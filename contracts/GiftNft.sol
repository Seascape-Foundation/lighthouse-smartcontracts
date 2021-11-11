// Seascape NFT
// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

/// @title Lighthouse NFT given as a gift
/// @notice LighthouseNFT is the NFT used in Lighthouse platform.
/// @author Medet Ahmetson
contract GiftNft is ERC721, ERC721Burnable, Ownable {
    using Counters for Counters.Counter;

    // Base URI
    string private _baseURIextended;

    Counters.Counter private tokenId;

    // For which project this nft was given as a gift.
    mapping(uint256 => uint256) public projectId;
    // On which order this NFT was minted
    // project id => order => nft id
    mapping(uint256 => mapping(uint16 => uint256)) public order;
    mapping(uint256 => uint16) public tokenOrder;

    mapping(address => bool) public minters;
    mapping(address => bool) public burners;

    event Minted(address indexed owner, uint256 indexed id, uint256 indexed projectId, uint256 order);
    
    /**
     * @dev Sets the {name} and {symbol} of token.
     * Mints all tokens.
     */
    constructor(string memory nftName, string memory nftSymbol, address _auction) ERC721(nftName, nftSymbol) {
	    require(_auction != address(0), "Lighthouse: ZERO_ADDRESS");
        tokenId.increment(); // set to 1 the incrementor, so first token will be with id 1.

        minters[_auction]
    }

    modifier onlyMinter() {
        require(minters[_msgSender()], "Lighthouse: NOT_MINTER");
        _;
    }

    modifier onlyBurner() {
        require(burners[_msgSender()], "Lighthouse: NOT_BURNER");
        _;
    }

    /// @dev ensure that all parameters are checked on factory smartcontract
    /// WARNING! Potentially could be minted endless tokens.
    function mint(uint256 _projectId, uint256 _tokenId, address _to, uint16 _order) external onlyMinter returns(bool) {
        uint256 _nextTokenId = tokenId.current();
        require(_tokenId == _nextTokenId, "LighthouseNFT: INVALID_TOKEN");
        require(order[projectId][_order] == 0, "GiftNFT: MINTED_IN_ORDER");

        _safeMint(_to, _tokenId);

        projectId[_tokenId] = _projectId;
        order[projectId][_order] = _tokenId;
        tokenOrder[_tokenId] = _order;

        tokenId.increment();

        emit Minted(_to, _tokenId, projectId, _order);
        
        return true;
    }

    function burn(uint256 id) public virtual override onlyBurner {
        //solhint-disable-next-line max-line-length
        require(_isApprovedOrOwner(_msgSender(), id), "ERC721Burnable: caller is not owner nor approved");
        _burn(id);

        delete order[projectId[_tokenId]][_tokenId];
        delete projectId[_tokenId];
        delete tokenOrder[_tokenId];
    }

    function getNextTokenId() external view returns(uint256) {
        return tokenId.current();
    }

    function setOwner(address _owner) external onlyOwner {
	    transferOwnership(_owner);
    }

    function setMinter(address _minter) external onlyOwner {
	    minters[_minter] = true;
    }

    function unsetMinter(address _minter) external onlyOwner {
	    minters[_minter] = false;
    }

    function setBurner(address _burner) external onlyOwner {
	    burners[_burner] = true;
    }

    function unsetBurner(address _burner) external onlyOwner {
	    burners[_burner] = false;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseURIextended;
    }

    function setBaseURI(string memory baseURI_) external onlyOwner {
        _baseURIextended = baseURI_;
    }

    function projectIdOf(uint256 nftId) external view returns(uint256) {
        return projectId[nftId];
    }

    function orderOf(uint256 nftId) external view returns(uint256) {
        return order[nftId];
    }
}
