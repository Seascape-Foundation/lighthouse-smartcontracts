// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./LighthouseAuction.sol";
import "./LighthousePrefund.sol";
import "./LighthouseNft.sol";
import "./LighthouseProject.sol";
import "./crowns/CrownsInterface.sol";

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
contract LighthouseBurn is Ownable {
    LighthouseAuction   private lighthouseAuction;
    LighthousePrefund   private lighthousePrefund;
    LighthouseTier      private lighthouseTier;
    LighthouseProject   private lighthouseProject;
    CrownsInterface     private crowns;

    uint256 private constant SCALER = 10 ** 18;

    /// @notice Some PCC goes to staking contract
    /// @dev PCC address => reserve amount
    mapping(address => uint256) public stakeReserves;
    /// @notice The contract to where the staked tokens will go
    address public staker;

    /// @notice Check whether the user minted nft for the project or not
    mapping(uint256 => mapping(address => uint256)) public mintedNfts;

    event SetStaker(address indexed staker);
    event BurnForPCC(uint256 indexed projectId, address indexed lighthouse, uint256 indexed nftId, address owner, address pcc, uint256 allocation);
    event BurnForCWS(uint256 indexed projectId, address indexed lighthouse, uint256 indexed nftId, address owner, uint256 compensation);

    constructor(address _lighthouseAuction, address _lighthousePrefund, address _lighthouseTier, address _crowns, address _project) {
        require(_lighthouseAuction != address(0) && _crowns != address(0) && _lighthousePrefund != address(0) && _lighthouseTier != address(0) && _project != address(0), "Lighthouse: ZERO_ADDRESS");

        lighthouseAuction   = LighthouseAuction(_lighthouseAuction);
        lighthousePrefund   = LighthousePrefund(_lighthousePrefund);
        lighthouseTier      = LighthouseTier(_lighthouseTier);
        lighthouseProject   = LighthouseProject(_project);
        crowns              = CrownsInterface(_crowns);
    }

    function setStaker(address _staker) external onlyOwner {
        require(_staker != address(0), "Lighthouse: ZERO_ADDRESS");

        staker = _staker;

        emit SetStaker(_staker);
    }

    function transferStakeReserve(address pccAddress, uint256 amount) external {
        require(amount > 0, "Lighthouse: ZERO_PARAMETER");
        require(pccAddress != address(0) && staker != address(0), "Lighthouse: NO_STAKER_ADDRESS");
        require(msg.sender == owner() || msg.sender == staker, "Lighthouse: FORBIDDEN");
        require(stakeReserves[pccAddress] > 0, "Lighthouse: INVALID_PCC");
        require(stakeReserves[pccAddress] >= amount, "Lighthouse: NOT_ENOUGH_BALANCE");

        CrownsInterface pcc = CrownsInterface(pccAddress);
        require(pcc.transferFrom(address(this), staker, amount), "Lighthouse: FAILED_TO_TRANSFER");

        stakeReserves[pccAddress] = stakeReserves[pccAddress] - amount;
    }

    function transferMaxReserve(address pccAddress) external {
        require(pccAddress != address(0) && staker != address(0), "Lighthouse: NO_STAKER_ADDRESS");
        require(msg.sender == owner() || msg.sender == staker, "Lighthouse: FORBIDDEN");
        require(stakeReserves[pccAddress] > 0, "Lighthouse: INVALID_PCC");

        CrownsInterface pcc = CrownsInterface(pccAddress);
        require(pcc.transferFrom(address(this), staker, stakeReserves[pccAddress]), "LighthouseBurn: FAILED_TO_TRANSFER");

        stakeReserves[pccAddress] = 0;
    }

    //////////////////////////////////////////////////////////////////////
    //
    // The investor functions
    //
    //////////////////////////////////////////////////////////////////////

    function burnForPcc(uint256 projectId, uint256 nftId) external {
        address pccAddress = lighthouseProject.pcc(projectId);
        require(pccAddress != address(0), "Lighthouse: NO_PCC");
        require(lighthouseProject.allocationCompensationInitialized(projectId), "Lighthouse: ALLOCATION_NOT_INITIALIZED_YET");

        CrownsInterface pcc = CrownsInterface(pccAddress);

        // Nft address after initiation of Allocation should work.
        LighthouseNft nft = LighthouseNft(lighthouseProject.nft(projectId));
        require(nft.ownerOf(nftId) == msg.sender, "Lighthouse: NOT_NFT_OWNER");
        require(nft.mintType(nftId) <= 2, "Lighthouse: FORBIDDEN_MINT_TYPE");

        uint256 allocation = nft.scaledAllocation(nftId) / SCALER;
        uint256 compensation = nft.scaledCompensation(nftId) / SCALER;
        require(allocation > 0, "Lighthouse: NFT_ZERO_ALLOCATION");
        require(compensation > 0, "Lighthouse: NFT_ZERO_COMPENSATION");

        require(pcc.balanceOf(address(this)) >= allocation, "Lighthouse: NOT_ENOUGH_PCC");
        require(crowns.balanceOf(address(this)) >= compensation, "Lighthouse: NOT_ENOUGH_CROWNS");

        nft.burn(nftId);


        require(pcc.transfer(msg.sender, allocation), "Lighthouse: FAILED_TO_TRANSFER");
        console.log("Transferred correctly");

        emit BurnForPCC(projectId, lighthouseProject.nft(projectId), nftId, msg.sender, pccAddress, allocation);
    }

    function burnForCws(uint256 projectId, uint256 nftId) external {
        address pccAddress = lighthouseProject.pcc(projectId);
        require(pccAddress != address(0), "Lighthouse: NO_PCC");
        require(lighthouseProject.allocationCompensationInitialized(projectId), "Lighthouse: ALLOCATION_NOT_INITIALIZED_YET");

        CrownsInterface pcc = CrownsInterface(pccAddress);

        LighthouseNft nft = LighthouseNft(lighthouseProject.nft(projectId));
        require(nft.ownerOf(nftId) == msg.sender, "Lighthouse: NOT_NFT_OWNER");
        require(nft.mintType(nftId) <= 2, "Lighthouse: FORBIDDEN_MINT_TYPE");

        uint256 allocation = nft.scaledAllocation(nftId) / SCALER;
        uint256 compensation = nft.scaledCompensation(nftId) / SCALER;
        require(compensation > 0, "Lighthouse: NFT_ZERO_COMPENSATION");

        require(pcc.balanceOf(address(this)) >= allocation, "Lighthouse: NOT_ENOUGH_PCC");
        require(crowns.balanceOf(address(this)) >= compensation, "Lighthouse: NOT_ENOUGH_CROWNS");

        nft.burn(nftId);

        require(crowns.transfer(msg.sender, compensation), "Lighthouse: FAILED_TO_TRANSFER");
        stakeReserves[pccAddress] = stakeReserves[pccAddress] + allocation;

        emit BurnForCWS(projectId, lighthouseProject.nft(projectId), nftId, msg.sender, compensation);
    }
}