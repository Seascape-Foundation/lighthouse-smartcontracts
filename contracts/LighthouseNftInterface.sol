// Seascape NFT
// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

/// @title Lighthouse NFT
/// @notice LighthouseNFT is the NFT used in Lighthouse platform.
/// @author Medet Ahmetson
interface LighthouseNftInterface {
    function projectId() external view returns (uint256);

    function minter(address _minter) external view returns (bool);

    function burner(address _burner) external view returns (bool);

    function paramsOf(uint256 _tokenId)
        external
        view
        returns (
            uint256,
            uint256,
            uint8
        );

    /// @dev ensure that all parameters are checked on factory smartcontract
    function mint(
        uint256 _projectId,
        uint256 _tokenId,
        address _to,
        uint256 _allocation,
        uint256 _compensation,
        uint8 _type
    ) external returns (bool);

    function burn(uint256 id) external;

    function getNextTokenId() external view returns (uint256);

    function setOwner(address _owner) external;

    function setMinter(address _minter) external;

    function unsetMinter(address _minter) external;

    function setBurner(address _burner) external;

    function unsetBurner(address _burner) external;

    function setBaseURI(string memory baseURI_) external;

    function scaledAllocation(uint256 nftId) external view returns (uint256);

    function scaledCompensation(uint256 nftId) external view returns (uint256);

    function mintType(uint256 nftId) external view returns (uint8);
}
