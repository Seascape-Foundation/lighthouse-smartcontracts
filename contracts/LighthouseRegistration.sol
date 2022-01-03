// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./LighthouseProject.sol";

/**
 * @notice This contract initiates the first stage of the Project funding.
 * Users are registertion for the lottery within the given time period for the project.
 * Registration for lottery.
 * 
 * @dev In order to start a new project funding, the first thing to do is add project here.
 */
contract LighthouseRegistration is Ownable {
    LighthouseProject private lighthouseProject;

    uint public chainID;

    /// @notice Amount of participants
    mapping(uint256 => uint256) public participantsAmount;
    mapping(uint256 => mapping(address => bool)) public registrations;

    event Register(uint256 indexed projectId, address indexed participant, uint256 indexed registrationId, uint256 registrationTime);

    constructor(address _lighthouseProject, uint _chainID) {
        lighthouseProject = LighthouseProject(_lighthouseProject);
        chainID = _chainID;
    }

    ////////////////////////////////////////////////////////////////////////////
    //
    // Investor functions: register for the prefund in the project.
    //
    ////////////////////////////////////////////////////////////////////////////

    /// @notice User registers to join the fund.
    /// @param id is the project id to join
    function register(uint256 id, int8 tierLevel, uint8 v, bytes32 r, bytes32 s) external {
        require(lighthouseProject.registrationInitialized(id), "Lighthouse: REGISTRATION_NOT_INITIALIZED");

        uint256 startTime;
        uint256 endTime;
        
        (startTime, endTime) = lighthouseProject.registrationInfo(id);

        require(block.timestamp >= startTime, "Lighthouse: NOT_STARTED_YET");
        require(block.timestamp <= endTime, "Lighthouse: FINISHED");
        require(!registered(id, msg.sender), "Lighthouse: ALREADY_REGISTERED");

        {   // avoid stack too deep
        // investor, project verification
	    bytes memory prefix     = "\x19Ethereum Signed Message:\n32";
	    bytes32 message         = keccak256(abi.encodePacked(msg.sender, address(this), chainID, id, uint8(tierLevel)));
	    bytes32 hash            = keccak256(abi.encodePacked(prefix, message));
	    address recover         = ecrecover(hash, v, r, s);

	    require(recover == lighthouseProject.getKYCVerifier(), "Lighthouse: SIG");
        }
        
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