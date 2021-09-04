// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./LighthouseTier.sol";
import "./LighthouseProject.sol";

/**
 * @notice This contract initiates the first stage of the Project funding.
 * Users are registertion for the lottery within the given time period for the project.
 * Registration for lottery.
 * 
 * @dev In order to start a new project funding, the first thing to do is add project here.
 */
contract LighthouseRegistration is Ownable {
    LighthouseTier private lighthouseTier;
    LighthouseProject private lighthouseProject;

    /// @notice Amount of participants
    mapping(uint256 => uint256) public participantsAmount;
    mapping(uint256 => mapping(address => bool)) public registrations;

    event RegistrationOpen(uint256 indexed projectId, uint256 startTime, uint256 endTime);
    event Register(uint256 indexed projectId, address indexed participant, uint256 indexed registrationId, uint256 registrationTime);

    constructor(address _lighthouseTier, address _lighthouseProject) {
        require(_lighthouseTier != address(0), "Lighthouse: ZERO_ADDRESS");

        lighthouseTier = LighthouseTier(_lighthouseTier);
        lighthouseProject = LighthouseProject(_lighthouseProject);
    }

    ////////////////////////////////////////////////////////////////////////////
    //
    // Investor functions: register for the prefund in the project.
    //
    ////////////////////////////////////////////////////////////////////////////

    /// @notice User registers to join the fund.
    /// @param id is the project id to join
    function register(uint256 id) external {
        require(lighthouseProject.registrationInitialized(id), "Lighthouse: REGISTRATION_NOT_INITIALIZED");

        uint256 startTime;
        uint256 endTime;
        
        (startTime, endTime) = lighthouseProject.registrationInfo(id);

        require(block.timestamp >= startTime, "Lighthouse: NOT_STARTED_YET");
        require(block.timestamp <= endTime, "Lighthouse: FINISHED");
        require(!registered(id, msg.sender), "Lighthouse: ALREADY_REGISTERED");

        int8 tierLevel = lighthouseTier.getTierLevel(msg.sender);
        require(tierLevel > 0, "Lighthouse: NOT_QUALIFIED");
        
        participantsAmount[id] = participantsAmount[id] + 1;

        registrations[id][msg.sender] = true;

        emit Register(id, msg.sender, participantsAmount[id], block.timestamp);
    }

    ////////////////////////////////////////////////////////////////////////////
    //
    // Public functions
    //
    ////////////////////////////////////////////////////////////////////////////

    function registered(uint256 id, address investor) public view returns(bool) {
        bool r = registrations[id][investor];
        return r;
    }
}