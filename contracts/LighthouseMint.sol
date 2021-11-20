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
    uint256             private chainID;

    uint256 private constant SCALER = 10 ** 18;

    /// @notice Check whether the user minted nft for the project or not
    mapping(uint256 => mapping(address => uint256)) public mintedNfts;

    event Mint(uint256 indexed projectId, address indexed nft, uint256 indexed nftId, address owner, uint256 allocation, uint256 compensation, int tierLevel, uint8 mintType);

    constructor(address _lighthouseAuction, address _lighthousePrefund, address _lighthouseTier, address _project, address _crowns, uint256 _chainID) {
        require(_lighthouseAuction != address(0) && _crowns != address(0) && _lighthousePrefund != address(0) && _lighthouseTier != address(0) && _project != address(0), "Lighthouse: ZERO_ADDRESS");

        lighthouseAuction   = LighthouseAuction(_lighthouseAuction);
        lighthousePrefund   = LighthousePrefund(_lighthousePrefund);
        lighthouseTier      = LighthouseTier(_lighthouseTier);
        lighthouseProject   = LighthouseProject(_project);
        crowns          = CrownsInterface(_crowns);
        chainID             = _chainID;
    }

    function setLighthouseTier(address newTier) external onlyOwner {
        lighthouseTier = LighthouseTier(newTier);
    }

    //////////////////////////////////////////////////////////////////////
    //
    // The investor functions
    //
    //////////////////////////////////////////////////////////////////////

    /// @notice After the prefund phase, investors can get a NFT with the weight proportion to their investment.
    /// @dev Lighthouse should be added into LighthouseTier.badgeUser();
    function mint(uint256 projectId, uint8 v, bytes32[2] calldata sig) external {
        uint256 endTime = lighthouseProject.auctionEndTime(projectId);
        require(block.timestamp > endTime,     "Lighthouse: AUCTION_FINISHED_YET");
        require(mintedNfts[projectId][msg.sender] == 0, "Lighthouse: ALREADY_MINTED");
        require(lighthouseProject.allocationCompensationInitialized(projectId), "Lighthouse: ALLOCATION_NOT_INITIALIZED_YET");
        require(lighthouseProject.mintable(projectId), "Lighthouse: NO_PERMISSION");

        bool prefunded = lighthousePrefund.prefunded(projectId, msg.sender);
        uint256 spent = lighthouseAuction.getSpent(projectId, msg.sender);

        require(prefunded || spent > 0, "Lighthouse: NOT_INVESTED");

        {   // avoid stack too deep
	    bytes32 hash            = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", 
            keccak256(abi.encodePacked(msg.sender, address(this), chainID, projectId))));

	    require(ecrecover(hash, v, sig[0], sig[1]) == lighthouseProject.getKYCVerifier(), "Lighthouse: SIG");
        }


        int8 tierLevel = lighthouseTier.getTierLevel(msg.sender);
        if (tierLevel <= 0) {
            tierLevel = lighthousePrefund.getPrefundTier(projectId, msg.sender);
        }
        require(tierLevel > 0, "Lighthouse: INVALID_TIER");


        uint8 mintType = 1;
        uint256 allocation;        // Portion of Pool that user will get
        uint256 compensation;

        if (prefunded) {
            (allocation, compensation) = prefundAllocation(projectId, tierLevel);
        } else {
            mintType = 2;
            (allocation, compensation) = auctionAllocation(projectId, spent);
        }

        // stack too deep
        address nftAddress = lighthouseProject.nft(projectId);
        LighthouseNft lighthouseNft = LighthouseNft(nftAddress);
        uint256 nftId = lighthouseNft.getNextTokenId();
        require(nftId > 0, "Lighthouse: NO_NFT_MINTED");

        require(lighthouseNft.mint(projectId, nftId, msg.sender, allocation, compensation, tierLevel, mintType), "LighthouseMint: FAILED");

        mintedNfts[projectId][msg.sender] = nftId;

        emit Mint(projectId, nftAddress, nftId, msg.sender, allocation, compensation, tierLevel, mintType);
    }


    function prefundAllocation(uint256 projectId, int8 tierLevel) internal view returns (uint256, uint256) {
        (uint256 scaledAllocationUnit, uint256 scaledCompensationUnit) = lighthouseProject.prefundScaledUnit(projectId);

        (uint256 investAmount,) = lighthouseProject.prefundInvestAmount(projectId, tierLevel);

        return (scaledAllocationUnit * investAmount, scaledCompensationUnit * investAmount);
    }

    function auctionAllocation(uint256 projectId, uint256 spent) internal view returns (uint256, uint256) {
        (uint256 scaledAllocationUnit, uint256 scaledCompensationUnit) = lighthouseProject.auctionScaledUnit(projectId);

        return (scaledAllocationUnit * spent, scaledCompensationUnit * spent);
    }
}