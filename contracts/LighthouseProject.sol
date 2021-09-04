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

    struct Registration {
        uint256 startTime;
        uint256 endTime;
    }

    mapping(uint256 => Registration) public registrations;

    event RegistrationOpen(uint256 indexed projectId, uint256 startTime, uint256 endTime);

    constructor() {
        projectId.increment(); 	// starts at value 1
    }

    function totalProjects() external view returns(uint256) {
        return projectId.current();
    }

    ////////////////////////////////////////////////////////////////////////////
    //
    // Manager: adds project registration
    //
    ////////////////////////////////////////////////////////////////////////////


    /// @notice Opens a registration entrance for a new project
    /// @param startTime of the registration entrance
    /// @param endTime of the registration. This is not th end of the project funding.
    function addRegistration(uint256 startTime, uint256 endTime) external onlyOwner {
        require(startTime > 0,                  "Lighthouse: ZERO_ADDRESS");
        require(block.timestamp < startTime,    "Lighthouse: TIME_PASSED");
        require(endTime > startTime,            "Lighthouse: INCORRECT_END_TIME");

        uint256 id                      = projectId.current();
        registrations[id].startTime     = startTime;
        registrations[id].endTime       = endTime;

        projectId.increment();

        emit RegistrationOpen(id, startTime, endTime);
    }

    ////////////////////////////////////////////////////////////////////////////
    //
    // Public functions
    //
    ////////////////////////////////////////////////////////////////////////////

    function validProjectId(uint256 id) public view returns(bool) {
        return (id > 0 && id < projectId.current());
    }

    /// @notice Returns Information about Registration: start time, end time
    function registrationInfo(uint256 id) external view returns(uint256, uint256) {
        Registration storage r = registrations[id];
        return (r.startTime, r.endTime);
    }

    function registrationEndTime(uint256 id) external view returns(uint256) {
        return registrations[id].endTime;
    }
}