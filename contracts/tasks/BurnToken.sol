// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
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
contract BurnToken {
    address public wichitaAddress;

    address constant dead = 0x000000000000000000000000000000000000dEaD;

    // token => user => burn amount => burnt
    mapping (address => mapping(uint => mapping(address => uint))) public burnt;
    mapping (address => mapping(address => uint)) public totalBurnt;

    event Burnt(address indexed token, address indexed investor, uint time, uint amount);

    constructor() {}

    function burn(address _token, uint _amount) external {
        ERC20 token = ERC20(_token);
        require(token.balanceOf(msg.sender) >= _amount, "NOT_ENOUGH_BALANCE");

        token.transferFrom(msg.sender, dead, _amount);

        burnt[_token][_amount][msg.sender]++;
        totalBurnt[_token][msg.sender] += _amount;

        emit Burnt(_token, msg.sender, block.timestamp, _amount);
    }
}