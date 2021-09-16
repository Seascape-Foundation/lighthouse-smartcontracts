// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LighthouseAllocation
 * @notice The Lighthouse Allocation guarantees that user will get a guarantees seat in lottery by burning his token.
 * @dev WIP its not yet done, until November, 2021
 */
contract LighthouseAllocation is Ownable {
    // @todo separated contract
    /// need to ask: could it be any project. or user has to choose a certain project for burning this nft.
    function burnForProject(uint256 _projectId, uint256 _anotherProjectId, address _nftAddress, uint256 _nftId) external {

    }
}