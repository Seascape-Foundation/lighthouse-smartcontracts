pragma solidity 0.8.1;

/// @dev The core functionality of the DeFi.
/// This is Stake erc721/native, and earn another erc20/native currency.
/// It has two isolation groups:
/// Per smartcontract, per session.
/// Every smartcontract's staking is isolated from another smartcont stakings.
/// For staking of smartcontract, smartcontract can initialize as many periods, as he wants.
interface StakeNft {
    function periods(uint256) external view returns (address, address);

    function weights(address, uint256) external view returns (uint256);

    function owners(
        address,
        uint256,
        uint256
    ) external view returns (address);

    /// @notice a new staking period in the namespace of this method caller.
    function newPeriod(
        uint256 key,
        address stakeToken,
        address rewardToken,
        uint256 startTime,
        uint256 endTime,
        uint256 rewardPool
    ) external;

    /// @dev The ZombieFarm calls this function when the session is active only.
    function stake(
        uint256 key,
        address stakerAddr,
        uint256 id,
        uint256 amount
    ) external;

    function unstake(
        uint256 key,
        address stakerAddr,
        uint256 id,
        bool burn
    ) external;

    function claim(uint256 key, address stakerAddr) external returns (uint256);
}
