// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./LighthouseTier.sol";
import "./LighthouseRegistration.sol";
import "./LighthouseProject.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @notice The second phase of the Project Fund raising is to prefund. 
 * todo accept native token, function should be payable
 */
contract LighthousePrefund is Ownable {
    LighthouseTier private lighthouseTier;
    LighthouseRegistration private lighthouseRegistration;
    LighthouseProject private lighthouseProject;

    /// @notice The investor prefunds in the project
    /// @dev Project -> Investor -> funded
    mapping(uint256 => mapping(address => bool)) public investments;

    event Prefund(uint256 indexed projectId, address indexed investor, int8 tier, uint256 time);

    constructor(address _tier, address _submission, address _project) {
        require(_tier != address(0) && _submission != address(0) && _project != address(0), "Lighthouse: ZERO_ADDRESS");
        require(_tier != _submission, "Lighthouse: SAME_ADDRESS");
        require(_tier != _project, "Lighthouse: SAME_ADDRESS");

        lighthouseTier = LighthouseTier(_tier);
        lighthouseRegistration = LighthouseRegistration(_submission);
        lighthouseProject = LighthouseProject(_project);
    }

    /// @dev v, r, s are used to ensure on server side that user passed KYC
    //todo pass Tier eligable for prefunding.
    //todo can use least tier
    //todo use the tier parameter
    function prefund(uint256 projectId, uint8 v, bytes32 r, bytes32 s) external payable {
        require(lighthouseProject.prefundInitialized(projectId), "Lighthouse: REGISTRATION_NOT_INITIALIZED");
        require(!prefunded(projectId, msg.sender), "Lighthouse: ALREADY_PREFUNDED");

        {   // Avoid stack too deep.
        uint256 startTime;
        uint256 endTime;
        
        (startTime, endTime) = lighthouseProject.prefundTimeInfo(projectId);

        require(block.timestamp >= startTime,   "Lighthouse: NOT_STARTED_YET");
        require(block.timestamp <= endTime,     "Lighthouse: FINISHED");
        }
        require(lighthouseRegistration.registered(projectId, msg.sender), "Lighthouse: NOT_REGISTERED");

        int8 tier = lighthouseTier.getTierLevel(msg.sender);
        require(tier > 0 && tier < 4, "Lighthouse: NO_TIER");

        uint256 collectedAmount;        // Tier investment amount
        uint256 pool;                   // Tier investment cap
        (collectedAmount, pool) = lighthouseProject.prefundPoolInfo(projectId, tier);

        require(collectedAmount < pool, "Lighthouse: TIER_CAP");
 
        // investor, project verification
	    bytes memory prefix     = "\x19Ethereum Signed Message:\n32";
	    bytes32 message         = keccak256(abi.encodePacked(msg.sender, projectId, tier));
	    bytes32 hash            = keccak256(abi.encodePacked(prefix, message));
	    address recover         = ecrecover(hash, v, r, s);

	    require(recover == lighthouseProject.getKYCVerifier(), "Lighthouse: SIG");

        uint256 investAmount;
        address investToken;
        (investAmount, investToken) = lighthouseProject.prefundInvestAmount(projectId, tier);

        if (investToken == address(0)) {
            require(msg.value == investAmount, "Lighthouse: NOT_ENOUGH_NATIVE");
        } else {
            IERC20 token = IERC20(investToken);
            require(token.transferFrom(msg.sender, address(this), investAmount), "Lighthouse: FAILED_TO_TRANSER");
        }

        lighthouseProject.collectPrefundInvestment(projectId, tier);
        investments[projectId][msg.sender] = true;

        emit Prefund(projectId, msg.sender, tier, block.timestamp);
    }

    /// @notice checks whether the user had prefunded or not.
    /// @param id of the project
    /// @param investor who prefuned
    function prefunded(uint256 id, address investor) public view returns(bool) {
        return investments[id][investor];
    }
}