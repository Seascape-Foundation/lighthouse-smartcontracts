// contracts/Crowns.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

interface CrownsInterface {
    function addBridge(address _bridge) external returns(bool);
    function removeBridge(address _bridge) external returns(bool);

    function setLimitSupply(uint256 _newLimit) external returns(bool);

    function mint(address to, uint256 amount) external  ;

    function burn(uint256 _amount) external  ;

    function burnFrom(address account, uint256 amount) external  ;
    function toggleBridgeAllowance() external  ;

    function payWaveOwing (address account) external view returns(uint256);

    function name() external pure returns (string memory);

    function symbol() external pure returns (string memory);

    function decimals() external view returns (uint8);

    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount) external returns (bool);

    function allowance(address owner, address spender) external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    function increaseAllowance(address spender, uint256 addedValue) external returns (bool);

    function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool);

    function spend(uint256 amount) external returns(bool);

    function spendFrom(address sender, uint256 amount) external returns(bool);

    function getLastPayWave(address account) external view returns (uint256);

    function payWave() external returns (bool);
}
