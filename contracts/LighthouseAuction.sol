// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./crowns/CrownsInterface.sol";
import "./LighthouseTier.sol";
import "./LighthousePrefund.sol";
import "./LighthouseRegistration.sol";
import "./LighthouseProject.sol";

/**
 *  @title Lighthouse Public Auction
 *  @notice Public Auction - the third phase of fundraising. It's the final stage.
 */
contract LighthouseAuction is Ownable {

    LighthouseTier private lighthouseTier;
    LighthouseRegistration private lighthouseRegistration;
    LighthousePrefund private lighthousePrefund;
    LighthouseProject private lighthouseProject;
    CrownsInterface private crowns;

    mapping(uint256 => mapping(address => uint256)) public spents;

    event Participate(uint256 indexed projectId, address indexed participant, uint256 amount, uint256 time);

    constructor(address _crowns, address tier, address submission, address prefund, address project) {
        require(_crowns != address(0) && tier != address(0) && prefund != address(0) && submission != address(0) && project != address(0), "Lighthouse: ZERO_ADDRESS");
        require(tier != prefund, "Lighthouse: SAME_ADDRESS");
        require(tier != _crowns, "Lighthouse: SAME_ADDRESS");
        require(tier != submission, "Lighthouse: SAME_ADDRESS");
        require(tier != project, "Lighthouse: SAME_ADDRESS");

        lighthouseTier = LighthouseTier(tier);
        lighthouseRegistration = LighthouseRegistration(submission);
        lighthousePrefund = LighthousePrefund(prefund);
        lighthouseProject = LighthouseProject(project);
        crowns = CrownsInterface(_crowns);
    }

    /// @notice User participates in the Public Auction
    /// @param amount of Crowns that user wants to spend
    /// @dev We are not checkig Tier level of the user, as it was checked in the LighthouseRegistration.
    function participate(uint256 projectId, uint256 amount, uint8 v, bytes32 r, bytes32 s) external {
        require(lighthouseProject.auctionInitialized(projectId), "Lighthouse: AUCTION_NOT_INITIALIZED");
        require(lighthouseProject.transferredPrefund(), "Lighthouse: NOT_TRANSFERRED_PREFUND_YET");
        require(!participated(projectId, msg.sender), "Lighthouse: ALREADY_PARTICIPATED");

        {   // Avoid stack too deep.
        uint256 startTime;
        uint256 endTime;
        
        (startTime, endTime) = lighthouseProject.auctionTimeInfo(projectId);

        require(block.timestamp >= startTime,   "Lighthouse: NOT_STARTED_YET");
        require(block.timestamp <= endTime,     "Lighthouse: FINISHED");
        }

        require(lighthouseRegistration.registered(projectId, msg.sender), "Lighthouse: NOT_REGISTERED");
        // Lottery winners are not joining to public auction
        require(!lighthousePrefund.prefunded(projectId, msg.sender), "Lighthouse: PREFUNDED");

        require(amount > 0, "Lighthouse: ZERO_VALUE");

        // investor, project verification
	    bytes memory prefix     = "\x19Ethereum Signed Message:\n32";
	    bytes32 message         = keccak256(abi.encodePacked(msg.sender, projectId, amount));
	    bytes32 hash            = keccak256(abi.encodePacked(prefix, message));
	    address recover         = ecrecover(hash, v, r, s);

	    require(recover == lighthouseProject.getKYCVerifier(), "Lighthouse: SIG");

        require(crowns.spendFrom(msg.sender, amount), "Lighthouse: CWS_UNSPEND");

        lighthouseProject.collectAuctionAmount(projectId, amount);
        spents[projectId][msg.sender] = amount;

        emit Participate(projectId, msg.sender, amount, block.timestamp);
    }

    /// @notice Return spent tokens
    /// @dev First returned parameter is investor's spent amount.
    /// Second parameter is total spent amount
    function getSpent(uint256 projectId, address investor) external view returns(uint256) {
        return spents[projectId][investor];
    }

    function participated(uint256 projectId, address investor) public view returns(bool) {
        return spents[projectId][investor] > 0;
    }
}