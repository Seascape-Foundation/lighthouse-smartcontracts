// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./crowns/CrownsInterface.sol";
import "./LighthouseTier.sol";
import "./LighthousePrefund.sol";
import "./LighthouseRegistration.sol";
import "./LighthouseProject.sol";
import "./GiftNft.sol";

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
    GiftNft private nft;

    uint256 public chainID;

    mapping(uint256 => mapping(address => uint256)) public spents;
    mapping(uint256 => uint16) public gifts;
    mapping(uint256 => uint16) public minted;

    event Participate(uint256 indexed projectId, address indexed participant, uint256 amount, uint256 time, uint256 tokenId);
    event Gift(uint256 indexed projectId, address indexed participant, uint256 indexed tokenId);

    constructor(address _crowns, address tier, address submission, address prefund, address project, uint16 giftsAmount, uint256 _chainID) {
        require(_crowns != address(0) && tier != address(0) && prefund != address(0) && submission != address(0) && project != address(0), "Lighthouse: ZERO_ADDRESS");
        require(tier != prefund, "Lighthouse: SAME_ADDRESS");
        require(tier != _crowns, "Lighthouse: SAME_ADDRESS");
        require(tier != submission, "Lighthouse: SAME_ADDRESS");
        require(tier != project, "Lighthouse: SAME_ADDRESS");
        require(submission != project, "Lighthouse: SAME_ADDRESS");
        require(submission != prefund, "Lighthouse: SAME_ADDRESS");
        require(prefund != project, "Lighthouse: SAME_ADDRESS");

        lighthouseTier = LighthouseTier(tier);
        lighthouseRegistration = LighthouseRegistration(submission);
        lighthousePrefund = LighthousePrefund(prefund);
        lighthouseProject = LighthouseProject(project);
        crowns = CrownsInterface(_crowns);
        chainID = _chainID;
        gifts = giftsAmount;
    }

    function setLighthouseTier(address newTier) external onlyOwner {
        lighthouseTier = LighthouseTier(newTier);
    }

    function setGiftNft(address giftNft) external onlyOwner {
        nft = GiftNft(giftNft);
    }

    /// @notice User participates in the Public Auction. Note that Public Auction interaction doesn't reset the Tier.
    /// @param amount of Crowns that user wants to spend
    /// @dev We are not checkig Tier level of the user, as it was checked in the LighthouseRegistration.
    function participate(uint256 projectId, uint256 amount, uint8 v, bytes32 r, bytes32 s) external {
        require(lighthouseProject.auctionInitialized(projectId), "Lighthouse: AUCTION_NOT_INITIALIZED");
        require(lighthouseProject.transferredPrefund(projectId), "Lighthouse: NOT_TRANSFERRED_PREFUND_YET");
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
	    bytes32 message         = keccak256(abi.encodePacked(msg.sender, address(this), projectId, amount, chainID));
	    bytes32 hash            = keccak256(abi.encodePacked(prefix, message));
	    address recover         = ecrecover(hash, v, r, s);

        if (minted[projectId] < gifts[projectId]) {
            uint256 tokenId = nft.getNextTokenId();
            require(nft.mint(projectId, tokenId, msg.sender, minted[projectId] + 1), "Lighthouse: FAILED_TO_GIFT");
            minted[projectId]++;

            emit Gift(projectId, msg.sender, tokenId);
        }

        lighthouseProject.collectAuctionAmount(projectId, amount);
        spents[projectId][msg.sender] = amount;

	    require(recover == lighthouseProject.getKYCVerifier(), "Lighthouse: SIG");

        require(crowns.spendFrom(msg.sender, amount), "Lighthouse: CWS_UNSPEND");

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