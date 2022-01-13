// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface BNFT {
    function ownerOf(uint) external view returns(address);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
}

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
contract BurnAnyWichita {
    address public wichitaAddress;

    mapping (address => uint) public burntTotalAmount;
    mapping (address => mapping(uint => uint)) public burnt;

    event Burnt(address indexed investor, uint time, uint id);

    constructor(address _wichita) {
        wichitaAddress = _wichita;
    }

    function burn(uint _id) external {
        BNFT scape = BNFT(wichitaAddress);
        require(scape.ownerOf(_id) == msg.sender, "NOT_YOURS");

        scape.safeTransferFrom(msg.sender, address(0), _id);

        emit Burnt(msg.sender, block.timestamp, _id);
    }
}