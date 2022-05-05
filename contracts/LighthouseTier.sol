// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./crowns/CrownsInterface.sol";

/**
 *  @title Lighthouse Tier
 *  @author Medet Ahmetson (ahmetson@zoho.com)
 *  @notice This contract tracks the tier of every user, tier allocation by each project.
 */
contract LighthouseTier is Ownable {
    using Counters for Counters.Counter;

    CrownsInterface private immutable crowns;

    uint256 public chainID;

    struct Tier {
        uint8 level;
        bool usable;
        uint256 nonce;
    }

    /// @notice Investor tier level
    /// @dev Investor address => TIER Level
    mapping(address => Tier) public tiers;

    /// @notice Amount of Crowns (CWS) that user would spend to claim the fee
    mapping(uint8 => uint256) public fees;

    /// @notice The Lighthouse contracts that can use the user Tier.
    /// @dev Smartcontract address => can use or not
    mapping(address => bool) public editors;

    /// @notice An account that tracks and prooves the Tier level to claim
    /// It tracks the requirements on the server side.
    /// @dev Used with v, r, s
    address public claimVerifier;

    event Fees(uint256 feeZero, uint256 feeOne, uint256 feeTwo, uint256 feeThree);
    event TierEditer(address indexed user, bool allowed);
    event Claim(address indexed investor, uint8 indexed tier);
    event Use(address indexed investor, uint8 indexed tier);

    constructor(address _crowns, address _claimVerifier, uint256[4] memory _fees, uint256 _chainID) {
        require(_crowns != address(0),          "LighthouseTier: ZERO_ADDRESS");
        require(_claimVerifier != address(0),   "LighthouseTier: ZERO_ADDRESS");
        require(_chainID > 0,                   "LighthouseTier: ZERO_VALUE");

        // Fee for claiming Tier
        setFees(_fees);

        crowns          = CrownsInterface(_crowns);
        claimVerifier   = _claimVerifier;
        chainID         = _chainID;
    }

    ////////////////////////////////////////////////////////////////////////////
    //
    // Management functions: change verifier, fee, editors.
    //
    ////////////////////////////////////////////////////////////////////////////

    /// @notice Fee for claiming Tier
    function setFees(uint256[4] memory _fees) public onlyOwner {
        require(_fees[0] > 0, "LighthouseTier: ZERO_FEE_0");
        require(_fees[1] > 0, "LighthouseTier: ZERO_FEE_1");
        require(_fees[2] > 0, "LighthouseTier: ZERO_FEE_2");
        require(_fees[3] > 0, "LighthouseTier: ZERO_FEE_3");

        fees[0] = _fees[0];
        fees[1] = _fees[1];
        fees[2] = _fees[2];
        fees[3] = _fees[3];

        emit Fees(_fees[0], _fees[1], _fees[2], _fees[3]);
    }

    /// @notice Who verifies the tier from the server side.
    function setClaimVerifier(address _claimVerifier) external onlyOwner {
        require(_claimVerifier != address(0),       "LighthouseTier: ZERO_ADDRESS");
        require(claimVerifier != _claimVerifier,    "LighthouseTier: SAME_ADDRESS");

        claimVerifier = _claimVerifier;
    }

    /// @notice Who can update tier of user? It's another smartcontract from Seapad.
    function addEditor(address _user) external onlyOwner {
        require(_user != address(0),                "LighthouseTier: ZERO_ADDRESS");
        require(!editors[_user],                    "LighthouseTier: ALREADY_ADDED");

        editors[_user] = true;

        emit TierEditer(_user, true);
    }

    /// @notice Remove the tier user.
    function deleteEditor(address _user) external onlyOwner {
        require(_user != address(0),                "LighthouseTier: ZERO_ADDRESS");
        require(editors[_user],                     "LighthouseTier: NO_USER");

        editors[_user] = false;

        emit TierEditer(_user, false);
    }

    ////////////////////////////////////////////////////////////////////////////
    //
    // User functions.
    //
    ////////////////////////////////////////////////////////////////////////////

    /// @notice Investor claims his Tier.
    /// This function intended to be called from the website directly
    function claim(uint8 level, uint8 v, bytes32 r, bytes32 s) external {
        require(level >= 0 && level < 4,        "LighthouseTier: INVALID_PARAMETER");
        Tier storage tier = tiers[msg.sender];

        // You can't Skip tiers.        
        if (level != 0) {
            require(tier.level + 1 == level,                "LighthouseTier: INVALID_LEVEL");
        } else {
            require(tier.usable == false,                   "LighhouseTier: 0_CLAIMED");
        }

        // investor, level verification with claim verifier
	    bytes memory prefix     = "\x19Ethereum Signed Message:\n32";
	    bytes32 message         = keccak256(abi.encodePacked(msg.sender, tier.nonce, level, chainID, address(this)));
	    bytes32 hash            = keccak256(abi.encodePacked(prefix, message));
	    address recover         = ecrecover(hash, v, r, s);
	    require(recover == claimVerifier,                   "LighthouseTier: SIG");

        tier.level = level;
        tier.usable = true;
        tier.nonce = tier.nonce + 1;      // Prevent "double-spend".

        // Charging fee
        require(crowns.spendFrom(msg.sender, fees[level]),  "LighthouseTier: CWS_UNSPEND");

        emit Claim(msg.sender, level);
    }

    ////////////////////////////////////////////////////////////////////////////
    //
    // Editor functions
    //
    ////////////////////////////////////////////////////////////////////////////

    /// @notice Other Smartcontracts of Lighthouse use the Tier of user.
    /// It's happening, when user won the lottery.
    function use(address investor, uint8 level) external {
        require(level >= 0 && level < 4,    "LighthouseTier: INVALID_PARAMETER");
        require(investor != address(0),     "LighthouseTier: ZERO_ADDRESS");
        require(editors[msg.sender],        "LighthouseTier: FORBIDDEN");

        Tier storage tier     = tiers[investor];

        require(tier.level == level,        "LighthouseTier: INVALID_LEVEL");
        require(tier.usable,                "LighthouseTier: ALREADY_USED");

        // Reset Tier to 0.
        tier.usable            = false;
        tier.level             = 0;

        emit Use(investor, level);
    }

    ////////////////////////////////////////////////////////////////////////////
    //
    // Public functions
    //
    ////////////////////////////////////////////////////////////////////////////

    /// @notice Return Tier Level of the investor.
    function getTierLevel(address investor) external view returns(int8) {
        if (tiers[investor].usable) {
            return int8(tiers[investor].level);
        }
        return -1;
    }
}