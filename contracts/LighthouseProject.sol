// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @notice This contract keeps project information.
 * @dev In order to start a new project funding, the first thing to do is add project here.
 */
contract LighthouseProject is Ownable {
    using Counters for Counters.Counter;

    uint256 private constant SCALER = 10 ** 18;

    Counters.Counter private projectId;

    /// @notice An account that tracks user's KYC pass
    /// @dev Used with v, r, s
    address public kycVerifier;

    /// @dev Smartcontract address => can use or not
    mapping(address => bool) public editors;

    struct Registration {
        uint256 startTime;
        uint256 endTime;
    }

    struct Prefund {
        uint256 startTime;
        uint256 endTime;
        uint256[3] investAmounts;         // Amount of tokens that user can invest, depending on his tier
        uint256[3] collectedAmounts;    // Amount of tokens that users invested so far.
        uint256[3] pools;               // Amount of tokens that could be invested in the pool.
        address token;                  // Token to accept

        uint256 scaledAllocation;       // prefund PCC allocation
        uint256 scaledCompensation;     // prefund Crowns compensation
        uint256 scaledRatio;            // Pool to compensation ratio.
    }

    struct Auction {
        uint256 startTime;
        uint256 endTime;
        uint256 spent;                  // Total Spent Crowns for this project

        uint256 scaledAllocation;             // auction PCC allocation
        uint256 scaledCompensation;           // auction Crowns compensation
    }

    struct Minting {
        uint256 scaledAllocation;             // The total pool of tokens that users could get
        uint256 scaledCompensation;     // The total compensation of tokens that users could get

        address nft;                    // The nft dedicated for the project.
        address pcc;                    // The nft dedicated for the project.
    }

    mapping(uint256 => Registration) public registrations;
    mapping(uint256 => Prefund) public prefunds;
    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => Minting) public mintings;

    event SetKYCVerifier(address indexed verifier);
    event ProjectEditor(address indexed user, bool allowed);
    event InitRegistration(uint256 indexed id, uint256 startTime, uint256 endTime);
    event InitPrefund(uint256 indexed id, address indexed token, uint256 startTime, uint256 endTime, uint256[3] pools, uint256[3] investAmounts);
    event InitAuction(uint256 indexed id, uint256 startTime, uint256 endTime);
    event InitAllocationCompensation(uint256 indexed id, uint256 prefundAllocation, uint256 prefundCompensation, uint256 auctionAllocation, uint256 auctionCompensation);
    event InitMinting(uint256 indexed id, uint256 scaledAllocation, uint256 scaledCompensation, address nft);
    event TransferUnfunded(uint256 indexed id, uint256 scaledPrefundAmount, uint256 scaledCompensationAmount);

    constructor(address verifier) {
        setKYCVerifier(verifier);
        projectId.increment(); 	// starts at value 1
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

        ProjectEditor(_user, true);
    }

    /// @notice Remove the tier user.
    function deleteEditorEditor(address _user) external onlyOwner {
        require(_user != address(0),                "Lighthouse: ZERO_ADDRESS");
        require(editors[_user],                     "Lighthouse: NO_USER");

        editors[_user] = false;

        ProjectEditor(_user, false);
    }

    /// @notice Opens a registration entrance for a new project
    /// @param startTime of the registration entrance
    /// @param endTime of the registration. This is not th end of the project funding.
    function initRegistration(uint256 startTime, uint256 endTime) external onlyOwner {
        require(startTime > 0,                  "Lighthouse: ZERO_ADDRESS");
        require(block.timestamp < startTime,    "Lighthouse: TIME_PASSED");
        require(endTime > startTime,            "Lighthouse: INCORRECT_END_TIME");

        uint256 id                      = projectId.current();
        registrations[id].startTime     = startTime;
        registrations[id].endTime       = endTime;

        projectId.increment();

        emit InitRegistration(id, startTime, endTime);
    }

    /// @notice Add the second phase of the project
    /// @dev
    /// If _token is address(0), then we receive native token.
    ///
    /// uint16 investorAmount 0 - total amount to spend for tier 1
    /// uint16 investorAmount 1 - total amount to spend for tier 2
    /// uint16 investorAmount 2 - total amount to spend for tier 3
    /// uint256 param 2 - tier 1 spend limit
    /// uint256 param 3 - tier 2 spend limit
    /// uint256 param 3 - tier 3 spend limit
    function initPrefund(uint256 id, uint256 startTime, uint256 endTime, uint256[3] calldata investAmounts, uint256[3] calldata pools, address _token) external onlyOwner {
        require(validProjectId(id), "Lighthouse: INVALID_PROJECT_ID");
        require(startTime > 0 && block.timestamp < startTime, "Lighthouse: INVALID_START_TIME");
        require(endTime > 0 && startTime != endTime && startTime < endTime, "Lighthouse: INVALID_END_TIME");
        require(pools[0] > 0 && pools[1] > 0 && pools[2] > 0, "Lighthouse: ZERO_POOL_CAP");
        require(investAmounts[0] > 0 && investAmounts[1] > 0 && investAmounts[2] > 0, "Lighthouse: ZERO_FIXED_PRICE");
        Prefund storage prefund = prefunds[id];
        require(prefund.startTime == 0, "Lighthouse: ALREADY_ADDED");

        uint256 regEndTime = registrations[id].endTime;
        require(regEndTime > 0, "Lighthouse: NO_REGISTRATION_YET");
        require(startTime > regEndTime, "Lighthouse: NO_REGISTRATION_END_YET");

        prefund.startTime   = startTime;
        prefund.endTime     = endTime;
        prefund.investAmounts = investAmounts;
        prefund.pools       = pools;
        prefund.token       = _token;

        emit InitPrefund(id, _token, startTime, endTime, pools, investAmounts);
    }

    /// @notice Add the last stage period for the project
    function initAuction(uint256 id, uint256 startTime, uint256 endTime) external onlyOwner {
        require(validProjectId(id), "Lighthouse: INVALID_PROJECT_ID");
        require(startTime > 0 && block.timestamp < startTime, "Lighthouse: INVALID_START_TIME");
        require(endTime > 0 && startTime != endTime && startTime < endTime, "Lighthouse: INVALID_END_TIME");
        Auction storage auction = auctions[id];
        require(auction.startTime == 0, "Lighthouse: ALREADY_ADDED");

        // prefundEndTime is already used as the name of function 
        uint256 prevEndTime = prefunds[id].endTime;
        require(prevEndTime > 0, "Lighthouse: NO_PREFUND_YET");
        require(startTime > prevEndTime, "Lighthouse: NO_REGISTRATION_END_YET");
    
        auction.startTime = startTime;
        auction.endTime = endTime;

        emit InitAuction(id, startTime, endTime);
    }

    /// @notice add allocation for prefund, auction.
    /// @dev Called after initAuction.
    /// Separated function for allocation to avoid stack too deep in other functions.
    function initAllocationCompensation(uint256 id, uint256 prefundAllocation, uint256 prefundCompensation, uint256 auctionAllocation, uint256 auctionCompensation) external onlyOwner {
        require(auctionInitialized(id), "Lighthouse: NO_AUCTION");
        require(!allocationCompensationInitialized(id), "Lighthouse: ALREADY_INITIATED");
        require(prefundAllocation > 0 && prefundCompensation > 0 && auctionAllocation > 0 && auctionCompensation > 0, "Lighthouse: ZERO_PARAMETER");

        Prefund storage prefund     = prefunds[id];
        Auction storage auction     = auctions[id];

        prefund.scaledAllocation    = prefundAllocation * SCALER;
        prefund.scaledCompensation  = prefundCompensation * SCALER;

        auction.scaledAllocation    = auctionAllocation * SCALER;
        auction.scaledCompensation  = auctionCompensation * SCALER;

        transferUnfunded(id);

        prefund.scaledRatio         = prefund.scaledAllocation / prefund.scaledCompensation;

        emit InitAllocationCompensation(id, prefundAllocation, prefundCompensation, auctionAllocation, auctionCompensation);
    }

    /// @notice add a the NFT minting which means NFT.
    /// @dev Called after initAllocationCompensation
    /// and after Lighthouse NFT deployment
    function initMinting(uint256 id, address nft) external onlyOwner {
        require(allocationCompensationInitialized(id), "Lighthouse: NO_ALLOCATION_COMPENSATION");
        require(!mintingInitialized(id), "Lighthouse: ALREADY_STARTED");
        require(nft != address(0), "Lighthouse: ZERO_ADDRESS");

        Minting storage minting         = mintings[id];
        Prefund storage prefund         = prefunds[id];
        Auction storage auction         = auctions[id];

        minting.scaledAllocation        = prefund.scaledAllocation + auction.scaledAllocation;
        minting.scaledCompensation      = prefund.scaledCompensation + auction.scaledCompensation;
        minting.nft                     = nft;                    

        emit InitMinting(id, minting.scaledAllocation, minting.scaledCompensation, nft);
    }

    /// @dev Should be called from other smartcontracts that are doing security check-ins.
    function collectPrefundInvestment(uint256 id, int8 tier) external {
        require(editors[msg.sender], "Lighthouse: FORBIDDEN");
        Prefund storage x = prefunds[id];

        // index
        uint8 i = uint8(tier) - 1;

        x.collectedAmounts[i] = x.collectedAmounts[i] + x.investAmounts[i];
    }

    /// @dev Should be called from other smartcontracts that are doing security check-ins.
    function collectAuctionAmount(uint256 id, uint256 amount) external {
        require(editors[msg.sender], "Lighthouse: FORBIDDEN");
        Auction storage x = auctions[id];

        x.spent = x.spent + amount;
    }

    ////////////////////////////////////////////////////////////////////////////
    //
    // Public functions
    //
    ////////////////////////////////////////////////////////////////////////////
    
    function totalProjects() external view returns(uint256) {
        return projectId.current();
    }

    function validProjectId(uint256 id) public view returns(bool) {
        return (id > 0 && id < projectId.current());
    }

    function registrationInitialized(uint256 id) public view returns(bool) {
        if (!validProjectId(id)) {
            return false;
        }

        Registration storage x = registrations[id];
        return (x.startTime > 0);
    }

    function prefundInitialized(uint256 id) public view returns(bool) {
        if (!validProjectId(id)) {
            return false;
        }

        Prefund storage x = prefunds[id];
        return (x.startTime > 0);
    }

    function auctionInitialized(uint256 id) public view returns(bool) {
        if (!validProjectId(id)) {
            return false;
        }

        Auction storage x = auctions[id];
        return (x.startTime > 0);
    }

    function mintingInitialized(uint256 id) public view returns(bool) {
        if (!validProjectId(id)) {
            return false;
        }

        Minting storage x = mintings[id];
        return (x.scaledAllocation > 0);
    }

    function allocationCompensationInitialized(uint256 id) public view returns(bool) {
        if (!validProjectId(id)) {
            return false;
        }

        Prefund storage x = prefunds[id];
        Auction storage y = auctions[id];
        return (x.scaledAllocation > 0 && y.scaledAllocation > 0);
    }

    /// @notice Returns Information about Registration: start time, end time
    function registrationInfo(uint256 id) external view returns(uint256, uint256) {
        Registration storage x = registrations[id];
        return (x.startTime, x.endTime);
    }

    function registrationEndTime(uint256 id) external view returns(uint256) {
        return registrations[id].endTime;
    }

    /// @notice Returns Information about Prefund Time: start time, end time
    function prefundTimeInfo(uint256 id) external view returns(uint256, uint256) {
        Prefund storage x = prefunds[id];
        return (x.startTime, x.endTime);
    }

    /// @notice Returns Information about Auction Time: start time, end time
    function auctionTimeInfo(uint256 id) external view returns(uint256, uint256) {
        Auction storage x = auctions[id];
        return (x.startTime, x.endTime);
    }

    /// @notice Returns Information about Prefund Pool: invested amount, investment cap
    function prefundPoolInfo(uint256 id, int8 tier) external view returns(uint256, uint256) {
        Prefund storage x = prefunds[id];

        // index
        uint8 i = uint8(tier) - 1;

        return (x.collectedAmounts[i], x.pools[i]);
    }

    /// @notice Returns Information about Prefund investment info: amount for tier, token to invest
    function prefundInvestAmount(uint256 id, int8 tier) external view returns(uint256, address) {
        Prefund storage x = prefunds[id];

        // index
        uint8 i = uint8(tier) - 1;

        return (x.investAmounts[i], x.token);
    }

    function prefundEndTime(uint256 id) external view returns(uint256) {
        return prefunds[id].endTime;
    }

    /// @notice returns total pool, and invested pool
    /// @dev the first returning parameter is total pool. The second returning parameter is invested amount so far.
    function prefundTotalPool(uint256 id) public view returns(uint256, uint256) {
        Prefund storage x = prefunds[id];

        uint256 totalPool = x.pools[0] + x.pools[1] + x.pools[2];
        uint256 totalInvested = x.collectedAmounts[0] + x.collectedAmounts[1] + x.collectedAmounts[2];

        return (totalPool, totalInvested);
    }

    /// @dev Prefund PCC distributed per Invested token.
    function prefundScaledUnit(uint256 id) external view returns(uint256, uint256) {
        Prefund storage x = prefunds[id];
        uint256 totalInvested = x.collectedAmounts[0] + x.collectedAmounts[1] + x.collectedAmounts[2];
    
        return (x.scaledAllocation / totalInvested, x.scaledCompensation / totalInvested);
    }

    function auctionEndTime(uint256 id) external view returns(uint256) {
        return auctions[id].endTime;
    }

    /// @notice returns total auction
    function auctionTotalPool(uint256 id) external view returns(uint256) {
        return auctions[id].spent;
    }

    /// @dev Prefund PCC distributed per Invested token.
    function auctionScaledUnit(uint256 id) external view returns(uint256, uint256) {
        Auction storage x = auctions[id];
        return (x.scaledAllocation / x.spent, x.scaledCompensation / x.spent);
    }

    function nftAddress(uint256 id) external view returns(address) {
        return mintings[id].nft;
    }

    function getKYCVerifier() external view returns(address) {
        return kycVerifier;
    }

    //////////////////////////////////////////////////////////
    //
    // Internal functions
    //
    //////////////////////////////////////////////////////////

    function transferUnfunded(uint256 id) internal {
        uint256 cap;
        uint256 amount;
        (cap, amount) = prefundTotalPool(id);
        
        if (amount < cap) {
            // We apply SCALER multiplayer, if the cap is less than 100
            // It could happen if investing goes in NATIVE token.
            uint256 scaledPercent = (cap - amount) * SCALER / (cap * SCALER / 100);

            // allocation = 10 * SCALER / 100 * SCALED percent;
            uint256 scaledTransferAmount = (prefunds[id].scaledAllocation / 100 * scaledPercent) / SCALER;

            auctions[id].scaledAllocation = auctions[id].scaledAllocation + scaledTransferAmount;
            prefunds[id].scaledAllocation = prefunds[id].scaledAllocation - scaledTransferAmount;

            uint256 scaledCompensationAmount = (prefunds[id].scaledCompensation / 100 * scaledPercent) / SCALER;

            auctions[id].scaledCompensation = auctions[id].scaledCompensation + scaledCompensationAmount;
            prefunds[id].scaledCompensation = prefunds[id].scaledCompensation - scaledCompensationAmount;

            TransferUnfunded(id, scaledTransferAmount, scaledCompensationAmount);
        }
    }
    
}