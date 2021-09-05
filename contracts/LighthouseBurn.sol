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
 * @title LighthouseBurn
 * @notice The Lighthouse Manager of tokens by Seascape Network team, investors.
 * It distributes the tokens to the game devs.
 * 
 * This smartcontract gets active for a project, only after its prefunding is finished.
 *
 * This smartcontract determines how much PCC (Player created coin) the investor would get, 
 * and an amount of compensation in case PCC failure.
 * The determination is described as a Lighthouse NFT.
 */
contract LighthouseBurn is Ownable {
    LighthouseAuction   private lighthouseAuction;
    LighthousePrefund   private lighthousePrefund;
    LighthouseTier      private lighthouseTier;
    LighthouseProject   private lighthouseProject;
    CrownsInterface     private crowns;

    uint256 private constant SCALER = 10 ** 18;

    struct Project {
        uint256 prefundPool;            // The PCC pool for prefund investors
        uint256 auctionPool;            // The PCC pool for auction participants
        uint256 prefundCompensation;    // The Crowns that prefunders could get
        uint256 auctionCompensation;    // The Crowns that auction participants could get
        uint256 ratio;                  // The prefund * scaler / ratio

        uint256 pool;                   // The total pool of tokens that users could get
        uint256 compensation;           // The total compensation of tokens that users could get
        address pcc;                    // The Game token that users are invested for
        address lighthouse;             // The nft dedicated for the project.

        uint256 startTime;
    }

    mapping(uint256 => Project) public projects;

    /// @notice Check whether the user minted nft for the project or not
    mapping(uint256 => mapping(address => uint256)) public mintedNfts;

    event AddProject(uint256 indexed projectId, uint256 prefundPool, uint256 auctionPool, uint256 prefundCompensation, uint256 auctionCompensation, address indexed lighthouse, uint256 startTime);
    event AddPCC(uint256 indexed projectId, address indexed pcc);
    event BurnForPCC(uint256 indexed projectId, address indexed lighthouse, uint256 indexed nftId, address owner, address pcc, uint256 allocation);
    event BurnForCWS(uint256 indexed projectId, address indexed lighthouse, uint256 indexed nftId, address owner, uint256 compensation);

    constructor(address _lighthouseAuction, address _lighthousePrefund, address _lighthouseTier, address _crowns, address _project) {
        require(_lighthouseAuction != address(0) && _crowns != address(0) && _lighthousePrefund != address(0) && _lighthouseTier != address(0) && _project != address(0), "Lighthouse: ZERO_ADDRESS");

        lighthouseAuction   = LighthouseAuction(_lighthouseAuction);
        lighthousePrefund   = LighthousePrefund(_lighthousePrefund);
        lighthouseTier      = LighthouseTier(_lighthouseTier);
        lighthouseProject   = LighthouseProject(_project);
        crowns              = CrownsInterface(_crowns);
    }

    /// @notice add a new project to the IDO project.
    // todo receive PCC and CWS for Nfts.
    function addProject(uint256 projectId, uint256 prefundPool, uint256 auctionPool, uint256 prefundCompensation, uint256 auctionCompensation, uint256 startTime, address lighthouse) external onlyOwner {
        require(projectId > 0 && prefundPool > 0 && auctionPool > 0 && prefundCompensation > 0 && auctionCompensation > 0, "Lighthouse: ZERO_PARAMETER");
        require(lighthouse != address(0), "Lighthouse: ZERO_ADDRESS");
        require(projects[projectId].startTime == 0, "Lighthouse: ALREADY_STARTED");
        require(startTime > 0, "Lighthouse: ZERO_PARAMETER");

        uint256 auctionEndTime = lighthouseProject.auctionEndTime(projectId);
        require(auctionEndTime > 0, "Lighthouse: NO_AUCTION_END_TIME");
        require(startTime >= auctionEndTime, "Lighthouse: START_TIME_BEFORE_AUCTION_END");

        Project storage project = projects[projectId];
        
        uint256 totalPool;
        uint256 totalInvested;
        
        (totalPool, totalInvested) = lighthouseProject.prefundTotalPool(projectId);
        
        project.prefundPool             = prefundPool;
        project.auctionPool             = auctionPool;
        project.prefundCompensation     = prefundCompensation;   
        project.auctionCompensation     = auctionCompensation;
        project.pool                    = prefundPool + auctionPool;
        project.compensation            = prefundCompensation + auctionCompensation;
        project.lighthouse              = lighthouse;                    
        project.startTime               = startTime;
        project.ratio                   = project.pool * SCALER / project.compensation;

        emit AddProject(projectId, prefundPool, auctionPool, prefundCompensation, auctionCompensation, lighthouse, startTime);
    }

    function addProjectPcc(uint256 projectId, address pcc) external onlyOwner {
        require(projectId > 0, "Lighthouse: PROJECT_NOT_EXIST");
        require(pcc != address(0), "Lighthouse: ZERO_ADDRESS");
        
        Project storage project = projects[projectId];
        require(project.pcc == address(0), "Lighthouse: ALREADY_ADDED");

        project.pcc = pcc;

        emit AddPCC(projectId, pcc);
    }

    //////////////////////////////////////////////////////////////////////
    //
    // The investor functions
    //
    //////////////////////////////////////////////////////////////////////

    /// 100k, 10k cws, 10:1
    // @todo compensation cws is burnt to spend it.
    function burnForPcc(uint256 projectId, uint256 nftId) external {
        Project storage project = projects[projectId];
        require(project.pcc != address(0), "Lighthouse: NO_PCC");

        LighthouseNft nft = LighthouseNft(project.lighthouse);
        require(nft.ownerOf(nftId) == msg.sender, "Lighthouse: NOT_NFT_OWNER");
        require(nft.mintType(nftId) <= 2, "Lighthouse: FORBIDDEN_MINT_TYPE");

        uint256 allocation = nft.getAllocation(nftId) / SCALER;
        require(allocation > 0, "Lighthouse: NFT_ZERO_ALLOCATION");

        nft.burn(nftId);

        IERC20 pcc = IERC20(project.pcc);
        pcc.transferFrom(address(this), msg.sender, allocation);

        emit BurnForPCC(projectId, project.lighthouse, nftId, msg.sender, project.pcc, allocation);
    }

    // @todo transfer allocation PCC in ration to CWS to the staking pool PCC.
    function burnForCws(uint256 projectId, uint256 nftId) external {
        Project storage project = projects[projectId];
        require(project.pcc != address(0), "Lighthouse: NO_PCC");

        LighthouseNft nft = LighthouseNft(project.lighthouse);
        require(nft.ownerOf(nftId) == msg.sender, "Lighthouse: NOT_NFT_OWNER");
        require(nft.mintType(nftId) <= 2, "Lighthouse: FORBIDDEN_MINT_TYPE");

        uint256 compensation = nft.getCompensation(nftId);
        require(compensation > 0, "Lighthouse: NFT_ZERO_COMPENSATION");

        nft.burn(nftId);

        crowns.transferFrom(address(this), msg.sender, compensation);

        emit BurnForCWS(projectId, project.lighthouse, nftId, msg.sender, compensation);
    }

    // @todo separated contract
    /// need to ask: could it be any project. or user has to choose a certain project for burning this nft.
    // @todo any nft.
    function burnForProject(uint256 projectId, uint256 anotherProjectId, address nftAddress, uint256 nftId) external {

    }
}