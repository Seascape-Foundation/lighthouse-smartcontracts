// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./crowns/CrownsInterface.sol";
import "./LighthouseTier.sol";
import "./LighthousePrefund.sol";
import "./LighthouseRegistration.sol";

/**
 *  @title Lighthouse Public Auction
 *  @notice Public Auction - the third phase of fundraising. It's the final stage.
 */
contract LighthouseAuction is Ownable {

    LighthouseTier private lighthouseTier;
    LighthouseRegistration private lighthouseRegistration;
    LighthousePrefund private lighthousePrefund;
    CrownsInterface private crowns;

    struct Project {
        uint256 startTime;
        uint256 endTime;
        uint256 spent;          // Total Spent Crowns for this project
    }

    mapping(uint256 => Project) public projects;
    mapping(uint256 => mapping(address => uint256)) public spents;
    // todo track how much CWS each participant spent.

    event AddProject(uint256 indexed projectId, uint256 startTime, uint256 endTime);
    event Participate(uint256 indexed projectId, address indexed participant, uint256 amount, uint256 time);

    constructor(address _crowns, address tier, address submission, address prefund) {
        require(_crowns != address(0) && tier != address(0) && prefund != address(0) && submission != address(0), "Lighthouse: ZERO_ADDRESS");
        require(tier != prefund, "Lighthouse: SAME_ADDRESS");
        require(tier != _crowns, "Lighthouse: SAME_ADDRESS");
        require(tier != submission, "Lighthouse: SAME_ADDRESS");

        lighthouseTier = LighthouseTier(tier);
        LighthouseRegistration = lighthouseRegistration(submission);
        lighthousePrefund = LighthousePrefund(prefund);
        crowns = CrownsInterface(_crowns);
    }

    /// @notice Add the last stage period for the project
    /// @dev the Start time of this phase is the end time of Prefund phase.
    // todo add start time
    function addProject(uint256 projectId, uint256 endTime) external onlyOwner {
        require(projectId > 0, "Lighthouse: INVALID_PARAMETER");
        require(endTime > 0 && now < endTime, "Lighthouse: INVALID_TIME");
        Project storage project = projects[projectId];
        require(project.startTime == 0, "Lighthouse: ALREADY_ADDED");

        uint256 prefundEndTime = lighthousePrefund.getEndTime(projectId);
        require(prefundEndTime > 0 && prefundEndTime < endTime, "Lighthouse: INVALID_SUBMISSION_TIME");
    
        project.startTime = prefundEndTime;
        project.endTime = endTime;

        emit AddProject(projectId, prefundEndTime, endTime);
    }

    // todo cancel aution

    /// @notice User participates in the Public Auction
    /// @param amount of Crowns that user wants to spend
    // todo add v,r,s for KYC or for checking lottery win
    // todo lottery winners are not joining public auction.
    function participate(uint256 projectId, uint256 amount) external {
        require(projectId > 0 && amount > 0, "Lighthouse: ZERO_VALUE");
        Project storage project = projects[projectId];

        require(project.startTime > 0, "Lighthouse: INVALID_PROJECT_ID");
        require(now >= project.startTime, "Lighthouse: NOT_STARTED_YET");
        require(now <= project.endTime, "Lighthouse: FINISHED");
        require(spents[projectId][msg.sender] == 0, "Lighthouse: PARTICIPATED_ALREADY");
        require(lighthouseRegistration.submissions(projectId, msg.sender), "Lighthouse: NOT_SUBMITTED");
        require(lighthousePrefund.investments(projectId, msg.sender) == false, "Lighthouse: ALREADY_PREFUNDED");

        uint8 tierLevel = lighthouseTier.getTierLevel(msg.sender);
        require(tierLevel > 0, "Lighthouse: NOT_QUALIFIED");

        require(crowns.spendFrom(msg.sender, amount), "Lighthouse: CWS_UNSPEND");

        project.spent = project.spent + amount;
        spents[projectId][msg.sender] = amount;

        emit Participate(projectId, msg.sender, amount, now);
    }

    function getEndTime(uint256 projectId) external view returns(uint256) {
        if (projectId == 0 || projectId <= lighthouseRegistration.totalProjects()) {
            return 0;
        }

        return projects[projectId].endTime;
    }

    /// @notice Return spent tokens
    /// @dev First returned parameter is investor's spent amount.
    /// Second parameter is total spent amount
    function getSpent(uint256 projectId, address investor) external view returns(uint256, uint256) {
        return (spents[projectId][investor], projects[projectId].spent);
    }
}