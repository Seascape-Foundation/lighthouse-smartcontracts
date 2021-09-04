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

    Counters.Counter private projectId;

    /// @dev Smartcontract address => can use or not
    mapping(address => bool) public editors;

    struct Registration {
        uint256 startTime;
        uint256 endTime;
    }
    struct Prefund {
        uint256 startTime;
        uint256 endTime;
        uint256[3] fixedPrices;         // Amount of tokens that user can invest, depending on his tier
        uint256[3] collectedAmounts;    // Amount of tokens that users invested so far.
        uint256[3] pools;               // Amount of tokens that could be invested in the pool.
        address token;                  // Token to accept
    }
    struct Auction {
        uint256 startTime;
        uint256 endTime;
        uint256 spent;          // Total Spent Crowns for this project
    }

    mapping(uint256 => Registration) public registrations;
    mapping(uint256 => Prefund) public prefunds;
    mapping(uint256 => Auction) public auctions;

    event ProjectEditor(address indexed user, bool allowed);
    event InitRegistration(uint256 indexed id, uint256 startTime, uint256 endTime);
    event InitPrefund(uint256 indexed id, address indexed token, uint256 startTime, uint256 endTime, uint256[3] pools, uint256[3] fixedPrices);
    event InitAuction(uint256 indexed id, uint256 startTime, uint256 endTime);

    constructor() {
        projectId.increment(); 	// starts at value 1
    }

    ////////////////////////////////////////////////////////////////////////////
    //
    // Manager: adds project parameters, changes the permission for other smartcontracts
    //
    ////////////////////////////////////////////////////////////////////////////

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
    function initPrefund(uint256 id, uint256 startTime, uint256 endTime, uint256[3] calldata fixedPrices, uint256[3] calldata pools, address _token) external onlyOwner {
        require(validProjectId(id), "Lighthouse: INVALID_PROJECT_ID");
        require(startTime > 0 && block.timestamp < startTime, "Lighthouse: INVALID_START_TIME");
        require(endTime > 0 && startTime != endTime && startTime < endTime, "Lighthouse: INVALID_END_TIME");
        require(pools[0] > 0 && pools[1] > 0 && pools[2] > 0, "Lighthouse: ZERO_POOL_CAP");
        require(fixedPrices[0] > 0 && fixedPrices[1] > 0 && fixedPrices[2] > 0, "Lighthouse: ZERO_FIXED_PRICE");
        Prefund storage prefund = prefunds[id];
        require(prefund.startTime == 0, "Lighthouse: ALREADY_ADDED");

        uint256 regEndTime = registrations[id].endTime;
        require(regEndTime > 0, "Lighthouse: NO_REGISTRATION_YET");
        require(startTime > regEndTime, "Lighthouse: NO_REGISTRATION_END_YET");

        prefund.startTime   = startTime;
        prefund.endTime     = endTime;
        prefund.fixedPrices = fixedPrices;
        prefund.pools       = pools;
        prefund.token       = _token;

        emit InitPrefund(id, _token, startTime, endTime, pools, fixedPrices);
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

    /// @dev Should be called from other smartcontracts that are doing security check-ins.
    function collectPrefundInvestment(uint256 id, int8 tier) external {
        require(editors[msg.sender], "Lighthouse: FORBIDDEN");
        Prefund storage x = prefunds[id];

        // index
        uint8 i = uint8(tier) - 1;

        x.collectedAmounts[i] = x.collectedAmounts[i] + x.fixedPrices[i];
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

        return (x.fixedPrices[i], x.token);
    }

    function prefundEndTime(uint256 id) external view returns(uint256) {
        return prefunds[id].endTime;
    }

    /// @notice returns total pool, and invested pool
    /// @dev the first returning parameter is total pool. The second returning parameter is invested amount so far.
    function prefundTotalPool(uint256 id) external view returns(uint256, uint256) {
        Prefund storage x = prefunds[id];

        uint256 totalPool = x.pools[0] + x.pools[1] + x.pools[2];
        uint256 totalInvested = x.collectedAmounts[0] + x.collectedAmounts[1] + x.collectedAmounts[2];

        return (totalPool, totalInvested);
    }

    function auctionEndTime(uint256 id) external view returns(uint256) {
        return auctions[id].endTime;
    }

    /// @notice returns total auction
    function auctionTotalPool(uint256 id) external view returns(uint256) {
        return auctions[id].spent;
    }
}