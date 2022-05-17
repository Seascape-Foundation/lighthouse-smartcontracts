// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "./StakeNftInterface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./LighthouseNftInterface.sol";

/// @notice Stake multiple nfts, and earn ERC20 token
///
/// STAKING:
/// First time whe user deposits his :
/// It receives  id, signature.
/// If user's  is in the game, then deposit is unavailable.
contract LighthouseStake is Ownable, ReentrancyGuard {
    address payable public stakeHandler;
    
    uint256 public latestSessionId;

    /// @dev The account that keeps all ERC20 rewards
    uint256 public nonce = 0;

    struct Session {
        uint256 startTime;
        uint256 period;
        uint256 rewardPool;
        address nft;
        address rewardToken;
    }

    struct Player {
        uint256 weight;
        address player;
    }

    mapping(uint256 => Session) public sessions;
    // session id => nft id => Player struct
    mapping(uint256 => mapping(uint256 => Player)) public playerParams;


    event Stake(
        address indexed staker,
        uint256 indexed sessionId,
        uint256 nftId
    );

    event Unstake(
        address indexed staker,
        uint256 indexed sessionId,
        uint256 nftId
    );

    event Claim(
        address indexed staker,
        uint256 indexed sessionId,
        uint256 nftId,
        uint256 amount
    );

    /// @notice Decimal of reward token should be set to 18
    constructor(address payable _handler) {
        stakeHandler = _handler;
    }

    /// @notice The challenges of this category were added to the Zombie Farm season
    function addSession(
        uint256 startTime,
        uint256 period,
        uint256 rewardPool,
        address nft,
        address rewardToken
    )
        external
        onlyOwner
    {
        uint sessionId = latestSessionId + 1;
        require(sessions[sessionId].rewardPool == 0, "the session already exists");
        require(rewardPool > 0 && period > 0 , "rewardPool & period not above 0");
        require(startTime > block.timestamp, "startTime should be in future");

        // Challenge.stake is not null, means that earn is not null too.
        Session storage session = sessions[sessionId];
        session.startTime = startTime;
        session.period = period;
        session.rewardToken = rewardToken;
        session.nft = nft;
        session.rewardPool = rewardPool;
        StakeNft handler = StakeNft(stakeHandler);

        latestSessionId = sessionId;

        handler.newPeriod(
            sessionId,
            nft,
            rewardToken,
            startTime,
            startTime + period,
            rewardPool
        );
    }

    /// @notice Stake an NFT. Amount of earing tokens is proportional to the Weight of NFT.
    /// IMPORANT! Its possible to stake LighthouseNFT.sol (in ./contracts) only.
    function stake(uint256 sessionId, uint256 nftId) external nonReentrant {
        // It does verification that  id is valid
        require(nftId > 0, "invalid nftId");

        Session storage session = sessions[sessionId];
        require(session.rewardPool > 0, "session does not exist");
        require(block.timestamp >= session.startTime, "session hasnt started yet");
        require(block.timestamp < session.startTime + session.period, "session already finished");

        // create interface of the LighthouseNft
        LighthouseNftInterface nftInterface = LighthouseNftInterface(session.nft);

        // get weight of the nft using paramsOf function of the LighthouseNftInterface
        (uint256 weight, , ) = nftInterface.paramsOf(nftId);

        address staker = msg.sender;

        Player storage challenge = playerParams[sessionId][nftId];

        require(challenge.player == address(0x0), "already staked");

        // set the stake player and weight
        challenge.player = staker;
        challenge.weight = weight;

        StakeNft handler = StakeNft(stakeHandler);
        handler.stake(sessionId, staker, nftId, weight);

        emit Stake(staker, sessionId, nftId);
    }

    /// @notice Unstake nft.
    function unstake(uint256 sessionId, uint256 nftId) external nonReentrant {
        address staker = msg.sender;
        Session storage session = sessions[sessionId];
        require(session.rewardPool > 0, "session does not exist");

        Player storage playerChallenge = playerParams[sessionId][nftId];
        require(playerChallenge.player == msg.sender, "sender is not an active staker");

        StakeNft handler = StakeNft(stakeHandler);
        handler.claim(sessionId, staker);

        handler.unstake(sessionId, staker, nftId, false);
        delete playerParams[sessionId][nftId];

        emit Unstake(staker, sessionId, nftId);
    }

    /// @notice Keep stake and harvest the rewards till now.
    function claim(uint256 sessionId, uint256 nftId) external nonReentrant {
        Session storage session = sessions[sessionId];
        address staker = msg.sender;
        Player storage playerChallenge = playerParams[sessionId][nftId];

        require(session.rewardPool > 0, "session does not exist");
        require(playerChallenge.player == msg.sender, "sender is not an active staker");

        StakeNft handler = StakeNft(stakeHandler);
        uint256 claimed = handler.claim(sessionId, staker);

        emit Claim(staker, sessionId, nftId, claimed);
    }
}
