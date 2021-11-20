// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./LighthouseProject.sol";

/**
 * @notice This contract keeps project information.
 * @dev In order to start a new project funding, the first thing to do is add project here.
 */
contract LighthouseProjectWrapper is Ownable {
    using Counters for Counters.Counter;

    LighthouseProject private project;

    uint256 private constant SCALER = 10 ** 18;

    /// @notice An account that tracks user's KYC pass
    /// @dev Used with v, r, s
    address public kycVerifier;

    /// @dev Smartcontract address => can use or not
    mapping(address => bool) public editors;

    struct Prefund {
        uint256 scaledAllocation;       // auction PCC allocation
        uint256 scaledCompensation;     // auction Crowns compensation
    }

    struct Auction {
        uint256 startTime;
        uint256 endTime;
        uint256 spent;                  // Total Spent Crowns for this project

        uint256 scaledAllocation;       // auction PCC allocation
        uint256 scaledCompensation;     // auction Crowns compensation

        bool transferredPrefund;        // Prefund allocation transferred to aution pool
    }

    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => Prefund) public prefunds;
    mapping(uint256 => bool) public mintable;

    // Lighthouse Investment NFT for each project.
    mapping(uint256 => address) public nfts;
    mapping(address => uint256) public usedNfts;

    /// PCC of each project.
    mapping(uint256 => address) public pccs;
    mapping(address => uint256) public usedPccs;

    event SetKYCVerifier(address indexed verifier);
    event ProjectEditor(address indexed user, bool allowed);
    event InitAuction(uint256 indexed id, uint256 startTime, uint256 endTime);
    event InitAllocationCompensation(uint256 indexed id, address indexed nftAddress, uint256 prefundAllocation, uint256 prefundCompensation, uint256 auctionAllocation, uint256 auctionCompensation);
    event TransferPrefund(uint256 indexed id, uint256 scaledPrefundAmount, uint256 scaledCompensationAmount);
    event SetPCC(uint256 indexed id, address indexed pccAddress);
    event InitMint(uint256 indexed id);

    constructor(address verifier, address _project) {
        setKYCVerifier(verifier);

        project = LighthouseProject(_project);
    }

    ////////////////////////////////////////////////////////////////////////////
    //
    // Manager: adds project parameters, changes the permission for other smartcontracts
    //
    ////////////////////////////////////////////////////////////////////////////

    function setKYCVerifier(address verifier) public onlyOwner {
        require(verifier != address(0), "Lighthouse: ZERO_ADDRESS");
        require(kycVerifier != verifier, "Lighthouse: SAME_ADDRESS");

        kycVerifier = verifier;

        emit SetKYCVerifier(verifier);
    }

    /// @notice Who can update tier of user? It's another smartcontract from Seapad.
    function addEditor(address _user) external onlyOwner {
        require(_user != address(0),                "Lighthouse: ZERO_ADDRESS");
        require(!editors[_user],                    "Lighthouse: ALREADY_ADDED");

        editors[_user] = true;

        emit ProjectEditor(_user, true);
    }

    /// @notice Remove the tier user.
    function deleteEditor(address _user) external onlyOwner {
        require(_user != address(0),                "Lighthouse: ZERO_ADDRESS");
        require(editors[_user],                     "Lighthouse: NO_USER");

        editors[_user] = false;

        emit ProjectEditor(_user, false);
    }

    /// @notice Add the last stage period for the project
    function initAuction(uint256 id, uint256 startTime, uint256 endTime) external onlyOwner {
        require(validProjectId(id), "Lighthouse: INVALID_PROJECT_ID");
        require(block.timestamp < startTime, "Lighthouse: INVALID_START_TIME");
        require(startTime < endTime, "Lighthouse: INVALID_END_TIME");
        Auction storage auction = auctions[id];
        require(auction.startTime == 0, "Lighthouse: ALREADY_ADDED");

        // prefundEndTime is already used as the name of function 
        uint256 prevEndTime = prefundEndTime(id);
        require(prevEndTime > 0, "Lighthouse: NO_PREFUND_YET");
        require(startTime > prevEndTime, "Lighthouse: NO_REGISTRATION_END_YET");
    
        auction.startTime = startTime;
        auction.endTime = endTime;

        emit InitAuction(id, startTime, endTime);
    }

    /// @notice add allocation for prefund, auction.
    /// @dev Called after initAuction.
    /// Separated function for allocation to avoid stack too deep in other functions.
    function initAllocationCompensation(uint256 id, uint256 prefundAllocation, uint256 prefundCompensation, uint256 auctionAllocation, uint256 auctionCompensation, address nftAddress) external onlyOwner {
        require(auctionInitialized(id), "Lighthouse: NO_AUCTION");
        require(!allocationCompensationInitialized(id), "Lighthouse: ALREADY_INITIATED");
        require(prefundAllocation > 0 && prefundCompensation > 0 && auctionAllocation > 0 && auctionCompensation > 0, "Lighthouse: ZERO_PARAMETER");
        require(nftAddress != address(0), "Lighthouse: ZERO_ADDRESS");
        require(usedNfts[nftAddress] == 0, "Lighthouse: NFT_USED");

        Prefund storage prefund     = prefunds[id];
        Auction storage auction     = auctions[id];

        prefund.scaledAllocation    = prefundAllocation * SCALER;
        prefund.scaledCompensation  = prefundCompensation * SCALER;

        auction.scaledAllocation    = auctionAllocation * SCALER;
        auction.scaledCompensation  = auctionCompensation * SCALER;

        nfts[id]                    = nftAddress; 
        usedNfts[nftAddress]        = id;                   

        emit InitAllocationCompensation(id, nftAddress, prefundAllocation, prefundCompensation, auctionAllocation, auctionCompensation);
    }

    function setPcc(uint256 id, address pccAddress) external onlyOwner {
        require(validProjectId(id), "Lighthouse: INVALID_PROJECT_ID");
        require(pccAddress != address(0), "Lighthouse: ZERO_ADDRESS");
        require(usedPccs[pccAddress] == 0, "Lighthouse: PCC_USED");

        pccs[id]                    = pccAddress;
        usedPccs[pccAddress]        = id;

        emit SetPCC(id, pccAddress);
    }

    function initMinting(uint256 id) external onlyOwner {
        require(validProjectId(id), "Lighthouse: INVALID_PROJECT_ID");
        require(!mintable[id], "Lighthouse: ALREADY_MINTED");

        mintable[id] = true;

        emit InitMint(id);
    }

    /// @dev Should be called from other smartcontracts that are doing security check-ins.
    function collectAuctionAmount(uint256 id, uint256 amount) external {
        require(editors[msg.sender], "Lighthouse: FORBIDDEN");
        Auction storage x = auctions[id];

        x.spent = x.spent + amount;
    }

    // auto transfer prefunded and track it in the Prefund
    function transferPrefund(uint256 id) external onlyOwner {
        if (auctions[id].transferredPrefund) {
            return;
        }
        require(validProjectId(id), "Lighthouse: INVALID_PROJECT_ID");

        require(prefundEndTime(id) < block.timestamp, "Lighthouse: PREFUND_PHASE");

        uint256 cap;
        uint256 amount;
        (cap, amount) = prefundTotalPool(id);
        
        if (amount < cap) {
            // We apply SCALER multiplayer, if the cap is less than 100
            // It could happen if investing goes in NATIVE token.
            uint256 scaledPercent = (cap - amount) * SCALER / (cap * SCALER / 100) * SCALER;

            // allocation = 10 * SCALER / 100 * SCALED percent;
            uint256 scaledTransferAmount = (prefunds[id].scaledAllocation * scaledPercent / 100) / SCALER;

            auctions[id].scaledAllocation = auctions[id].scaledAllocation + scaledTransferAmount;
            prefunds[id].scaledAllocation = prefunds[id].scaledAllocation - scaledTransferAmount;

            uint256 scaledCompensationAmount = (prefunds[id].scaledCompensation * scaledPercent / 100) / SCALER;

            auctions[id].scaledCompensation = auctions[id].scaledCompensation + scaledCompensationAmount;
            prefunds[id].scaledCompensation = prefunds[id].scaledCompensation - scaledCompensationAmount;

            emit TransferPrefund(id, scaledTransferAmount, scaledCompensationAmount);
        }

        auctions[id].transferredPrefund = true;
    }    

    ////////////////////////////////////////////////////////////////////////////
    //
    // Public functions
    //
    ////////////////////////////////////////////////////////////////////////////
    
    function totalProjects() external view returns(uint256) {
        return project.totalProjects();
    }

    function validProjectId(uint256 id) public view returns(bool) {
        return project.validProjectId(id);
    }

    function registrationInitialized(uint256 id) public view returns(bool) {
        return project.registrationInitialized(id);
    }

    function prefundInitialized(uint256 id) public view returns(bool) {
        return project.prefundInitialized(id);
    }

    function auctionInitialized(uint256 id) public view returns(bool) {
        if (!validProjectId(id)) {
            return false;
        }

        Auction storage x = auctions[id];
        return (x.startTime > 0);
    }

    function mintInitialized(uint256 id) public view returns(bool) {
        return mintable[id];
    }

    function allocationCompensationInitialized(uint256 id) public view returns(bool) {
        if (!validProjectId(id)) {
            return false;
        }

        return nfts[id] != address(0);
    }

    /// @notice Returns Information about Registration: start time, end time
    function registrationInfo(uint256 id) external view returns(uint256, uint256) {
        return project.registrationInfo(id);
    }

    function registrationEndTime(uint256 id) external view returns(uint256) {
        return project.registrationEndTime(id);
    }

    /// @notice Returns Information about Prefund Time: start time, end time
    function prefundTimeInfo(uint256 id) external view returns(uint256, uint256) {
        return project.prefundTimeInfo(id);
    }

    /// @notice Returns Information about Auction Time: start time, end time
    function auctionTimeInfo(uint256 id) external view returns(uint256, uint256) {
        Auction storage x = auctions[id];
        return (x.startTime, x.endTime);
    }

    /// @notice Returns Information about Prefund Pool: invested amount, investment cap
    function prefundPoolInfo(uint256 id, int8 tier) external view returns(uint256, uint256) {
        return project.prefundPoolInfo(id, tier);
    }

    /// @notice Returns Information about Prefund investment info: amount for tier, token to invest
    function prefundInvestAmount(uint256 id, int8 tier) external view returns(uint256, address) {
        return project.prefundInvestAmount(id, tier);
    }

    function prefundEndTime(uint256 id) public view returns(uint256) {
        return project.prefundEndTime(id);
    }

    /// @notice returns total pool, and invested pool
    /// @dev the first returning parameter is total pool. The second returning parameter is invested amount so far.
    function prefundTotalPool(uint256 id) public view returns(uint256, uint256) {
        return project.prefundTotalPool(id);
    }

    /// @dev Prefund PCC distributed per Invested token.
    function prefundScaledUnit(uint256 id) external view returns(uint256, uint256) {
        Prefund storage x = prefunds[id];
        
        (, uint256 totalCollected) = project.prefundTotalPool(id);

        return (x.scaledAllocation / totalCollected, x.scaledCompensation / totalCollected);
    }

    function auctionEndTime(uint256 id) external view returns(uint256) {
        return auctions[id].endTime;
    }

    /// @notice returns total auction
    function auctionTotalPool(uint256 id) external view returns(uint256) {
        return auctions[id].spent;
    }

    function transferredPrefund(uint256 id) external view returns(bool) {
        return auctions[id].transferredPrefund;
    }

    /// @dev Prefund PCC distributed per Invested token.
    function auctionScaledUnit(uint256 id) external view returns(uint256, uint256) {
        Auction storage x = auctions[id];
        return (x.scaledAllocation / x.spent, x.scaledCompensation / x.spent);
    }

    function nft(uint256 id) external view returns(address) {
        return nfts[id];
    }

    function pcc(uint256 id) external view returns(address) {
        return pccs[id];
    }

    function getKYCVerifier() external view returns(address) {
        return kycVerifier;
    }

}