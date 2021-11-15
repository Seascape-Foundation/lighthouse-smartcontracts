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

    struct AuctionData {
        bool set;                       // whether it was set or not.
        uint16 gifted;                  // Amount of users that are gifted
        uint16 giftAmount;              // Amount of users that could be gifted

        uint256 min;                    // Minimum amount of CWS allowed to spend. Could be 0.
    }

    mapping(uint256 => mapping(address => uint256)) public spents;
    /// @notice Whether user is eligable for minting or not
    /// project id => user => bool
    mapping(uint256 => mapping(address => uint16)) public giftOrder;
    /// @notice Gifted NFT id for the user per project
    /// project id => user => nft id 
    mapping(uint256 => mapping(address => uint256)) public gifts;

    mapping(uint256 => AuctionData) public auctionData;


    event Participate(uint256 indexed projectId, address indexed participant, uint256 amount, uint256 time);
    event SetAuctionData(uint256 indexed projectId, uint256 min, uint16 giftAmount);
    event Gift(uint256 indexed projectId, address indexed participant, uint256 indexed tokenId);

    constructor(address _crowns, address tier, address submission, address prefund, address project, uint256 _chainID) {
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
    }

    function setAuctionData(uint256 projectId, uint256 min, uint16 giftAmount) external onlyOwner {
        require(lighthouseProject.auctionInitialized(projectId), "Lighthouse: AUCTION_NOT_INITIALIZED");
        require(!auctionData[projectId].set, "Lighthouse: ALREADY_SET");

        AuctionData data = auctionData[projectId];
        data.set = true;
        data.giftAmount = giftAmount;
        data.min = min;

        emit SetAuctionData(projectId, min, giftAmount);
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
        require(auctionData[projectId].set, "Lighthouse: AUCTION_NOT_SET");
        require(!participated(projectId, msg.sender), "Lighthouse: ALREADY_PARTICIPATED");
        require(amount > 0, "Lighthouse: ZERO_VALUE");

        {   // Avoid stack too deep.
        uint256 startTime;
        uint256 endTime;
        
        (startTime, endTime) = lighthouseProject.auctionTimeInfo(projectId);

        require(block.timestamp >= startTime,   "Lighthouse: NOT_STARTED_YET");
        require(block.timestamp <= endTime,     "Lighthouse: FINISHED");

        require(amount >= auctionData[projectId].min, "Lighthouse: LESS_THAN_MIN");
        }


        require(lighthouseRegistration.registered(projectId, msg.sender), "Lighthouse: NOT_REGISTERED");
        // Lottery winners are not joining to public auction
        require(!lighthousePrefund.prefunded(projectId, msg.sender), "Lighthouse: PREFUNDED");

        // investor, project verification
	    bytes memory prefix     = "\x19Ethereum Signed Message:\n32";
	    bytes32 message         = keccak256(abi.encodePacked(msg.sender, address(this), projectId, chainID));
	    bytes32 hash            = keccak256(abi.encodePacked(prefix, message));
	    address recover         = ecrecover(hash, v, r, s);

        AuctionData data = auctionData[projectId];

        if (data.giftAmount > 0) {
            require(address(nft) != address(0), "Lighthouse: NO_NFT_ADDRESS");
        }

        if (data.gifted < data.giftAmount) {
            uint256 nftId = nft.mint(projectId, msg.sender);
            require(nftId > 0, "Lighthouse: NOT_MINTED");
            giftOrder[projectId][msg.sender] = data.gifted + 1;
            gifts[projectId][msg.sender] = nftId;
        }

        data.gifted = data.gifted + 1;
        if (data.gifted < data.giftAmount) {
            data.gifted++;
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

    function participantGiftOrder(uint256 projectId, address participant) external view returns(uint16) {
        return giftOrder[projectId][participant];
    }

    /// @notice Returns the information about the minted amounts of NFTs and limit of them
    /// per project.
    function giftInfo(uint256 projectId) external view returns(uint16, uint16) {
        return (auctionData[projectId].gifted, auctionData[projectId].giftAmount);
    }
}