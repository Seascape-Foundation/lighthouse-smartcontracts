// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./LighthouseAuction.sol";
import "./LighthousePrefund.sol";
import "./LighthouseNft.sol";
import "./LighthouseProject.sol";
import "./crowns/CrownsInterface.sol";

/**
 * @title LighthouseMint
 * @notice The Lighthouse Manager of tokens by Seascape Network team, investors.
 * It distributes the tokens to the game devs.
 * 
 * This smartcontract gets active for a project, only after its prefunding is finished.
 *
 * This smartcontract determines how much PCC (Player created coin) the investor would get, 
 * and an amount of compensation in case PCC failure.
 * The determination is described as a Lighthouse NFT.
 */
contract LighthouseMint is Ownable {
    LighthouseAuction   private lighthouseAuction;
    LighthousePrefund   private lighthousePrefund;
    LighthouseTier      private lighthouseTier;
    LighthouseProject   private lighthouseProject;
    CrownsInterface     private crowns;

    uint256 private constant SCALER = 10 ** 18;

    /// @notice Check whether the user minted nft for the project or not
    mapping(uint256 => mapping(address => uint256)) public mintedNfts;

    event Mint(uint256 indexed projectId, address indexed nft, uint256 indexed nftId, address owner, uint256 allocation, uint256 compensation);

    constructor(address _lighthouseAuction, address _lighthousePrefund, address _lighthouseTier, address _project, address _crowns) {
        require(_lighthouseAuction != address(0) && _crowns != address(0) && _lighthousePrefund != address(0) && _lighthouseTier != address(0) && _project != address(0), "Lighthouse: ZERO_ADDRESS");

        lighthouseAuction   = LighthouseAuction(_lighthouseAuction);
        lighthousePrefund   = LighthousePrefund(_lighthousePrefund);
        lighthouseTier      = LighthouseTier(_lighthouseTier);
        lighthouseProject   = LighthouseProject(_project);
        crowns          = CrownsInterface(_crowns);
    }

    //////////////////////////////////////////////////////////////////////
    //
    // The investor functions
    //
    //////////////////////////////////////////////////////////////////////

    /// @notice After the prefund phase, investors can get a NFT with the weight proportion to their investment.
    /// @dev Lighthouse should be added into LighthouseTier.badgeUser();
    /// todo make it to be minted for any player, besides prefund, auction
    function mint(uint256 projectId) external {
        uint256 endTime = lighthouseProject.auctionEndTime(projectId);
        require(block.timestamp > endTime,     "Lighthouse: AUCTION_FINISHED_YET");
        require(mintedNfts[projectId][msg.sender] == 0, "Lighthouse: ALREADY_MINTED");

        bool prefunded = lighthousePrefund.prefunded(projectId, msg.sender);
        uint256 spent = lighthouseAuction.getSpent(projectId, msg.sender);

        require(prefunded || spent > 0, "Lighthouse: NOT_INVESTED");

        int8 tierLevel = lighthouseTier.getTierLevel(msg.sender);
        require(tierLevel > 0, "Lighthouse: INVALID_TIER");

        uint8 mintType;
        uint256 allocation;        // Portion of Pool that user will get
        uint256 compensation;
        uint256 scaledAllocationUnit;
        uint256 scaledCompensationUnit;

        if (prefunded) {
            mintType = 1;
 
            (scaledAllocationUnit, scaledCompensationUnit) = lighthouseProject.prefundScaledUnit(projectId);

            uint256 investAmount;
            address _investToken; 
            (investAmount, _investToken) = lighthouseProject.prefundInvestAmount(projectId, tierLevel);

            allocation = scaledAllocationUnit * investAmount;
            compensation = scaledCompensationUnit * investAmount;
        } else {
            mintType = 2;
            (scaledAllocationUnit, scaledCompensationUnit) = lighthouseProject.auctionScaledUnit(projectId);

            allocation = scaledAllocationUnit * spent;
            compensation = scaledCompensationUnit * spent;
        }

        // stack too deep
        address nftAddress = lighthouseProject.nftAddress(projectId);
        LighthouseNft lighthouseNft = LighthouseNft(nftAddress);
        uint256 nftId = lighthouseNft.mint(projectId, msg.sender, allocation, compensation, tierLevel, mintType);
        require(nftId > 0, "Lighthouse: NO_NFT_MINTED");

        mintedNfts[projectId][msg.sender] = nftId;

        emit Mint(projectId, nftAddress, nftId, msg.sender, allocation, compensation);
    }

    // @todo stake
    // @todo separated contract
    function stake(uint256 projectId, uint256 nftId) external {

    }
}