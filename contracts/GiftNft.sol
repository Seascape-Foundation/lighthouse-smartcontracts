// Seascape NFT
// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "./LighthouseAuction.sol";

/// @title Lighthouse NFT given as a gift
/// @notice LighthouseNFT is the NFT used in Lighthouse platform.
/// @author Medet Ahmetson
contract GiftNft is ERC721, ERC721Burnable, Ownable {
    using Counters for Counters.Counter;

    // Base URI
    string private _baseURIextended;

    Counters.Counter private tokenId;

    LighthouseAuction public auction;

    // Whether user claimed his NFT for the project or not.
    // project id => user => bool
    mapping(uint256 => mapping(address => bool)) public claimed;

    mapping(address => bool) public minters;
    mapping(address => bool) public burners;

    event Gifted(address indexed owner, uint256 indexed id, uint256 indexed projectId);
    
    /**
     * @dev Sets the {name} and {symbol} of token.
     * Mints all tokens.
     */
    constructor(string memory nftName, string memory nftSymbol, address _auction) ERC721(nftName, nftSymbol) {
	    require(_auction != address(0), "Lighthouse: ZERO_ADDRESS");
        tokenId.increment(); // set to 1 the incrementor, so first token will be with id 1.

        auction = LighthouseAuction(_auction);
        minters[_auction] = true;
    }

    
    modifier onlyMinter() {
        require(minters[_msgSender()], "Lighthouse: NOT_MINTER");
        _;
    }

    modifier onlyBurner() {
        require(burners[_msgSender()], "Lighthouse: NOT_BURNER");
        _;
    }

    function auctionAddress() external view returns(address) {
        return address(auction);
    }

    /// @dev ensure that all parameters are checked on factory smartcontract
    /// WARNING! Potentially could be minted endless tokens.
    function mint(uint256 _projectId, address _to) external onlyMinter returns(uint256) {
        require(_projectId > 0, "GiftNFT: ZERO_ID");
        require(!claimed[_projectId][_to], "GiftNFT: MINTED");

        uint256 _tokenId = tokenId.current();
        _safeMint(_to, _tokenId);
        tokenId.increment();

        claimed[_projectId][_to] = true;

        emit Gifted(_to, _tokenId, _projectId);
        
        return _tokenId;
    }

    function burn(uint256 id) public virtual override onlyBurner {
        //solhint-disable-next-line max-line-length
        require(_isApprovedOrOwner(_msgSender(), id), "ERC721Burnable: caller is not owner nor approved");
        
        address _nftOwner = ownerOf(id);
        
        _burn(id);

        delete claimed[id][_nftOwner];
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
}
