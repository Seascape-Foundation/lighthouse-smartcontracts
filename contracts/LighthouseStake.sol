pragma solidity 0.8.1;

import "./StakeNftInterface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./LighthouseNftInterface.sol";

/// @notice Stake a single nft , and earn ERC20 token
///
/// STAKING:
/// First time whe user deposits his :
/// It receives  id, signature.
/// If user's  is in the game, then deposit is unavailable.
contract LighthouseStake is Ownable {
    address payable public stakeHandler;

    // The seascape  address
    address public nft; // address of nft user has to stake
    address public rewardToken; // pcc token address

    /// @dev The account that keeps all ERC20 rewards
    uint256 public nonce = 0;

    struct Session {
        uint256 startTime;
        uint256 period;
        uint256 rewardPool;
    }

    struct Player {
        uint256 weight;
        address player;
    }

    mapping(uint256 => Session) public sessions;
    // session id => player address = PlayerChallenge
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
    constructor(
        address _nft,
        address _reward,
        address payable _handler
    ) public {
        require(_nft != address(0), "invalid _scape address");

        nft = _nft;
        rewardToken = _reward;
        stakeHandler = _handler;
    }

    /// @notice The challenges of this category were added to the Zombie Farm season
    function addSession(
        uint256 sessionId,
        uint256 startTime,
        uint256 period,
        uint256 rewardPool
    ) external onlyOwner {
        require(
            sessions[sessionId].rewardPool == 0,
            "the session already exists"
        );

        require(
            rewardPool > 0 && period > 0 && startTime > block.timestamp,
            "zero_value"
        );

        // Challenge.stake is not null, means that earn is not null too.
        Session storage session = sessions[sessionId];
        session.startTime = startTime;
        session.period = period;
        session.rewardPool = rewardPool;
        StakeNft handler = StakeNft(stakeHandler);

        handler.newPeriod(
            sessionId,
            nft,
            rewardToken,
            startTime,
            startTime + period,
            rewardPool
        );
    }

    /// @notice Stake an  and some token.
    /// For the first time whe user deposits his :
    ///     It receives  id, signature and amount of staking.
    function stake(uint256 sessionId, uint256 nftId) external {
        // It does verification that  id is valid
        // (uint nftId, uint weight) = decodeStakeData(data);
        require(nftId > 0, "invalid nftId");

        // create interface of the LighthouseNft
        LighthouseNftInterface nftInterface = LighthouseNftInterface(
            nft
        );

        // get weight of the nft using paramsOf function of the LighthouseNftInterface
        (uint256 weight, , ) = nftInterface.paramsOf(nftId);

        Session storage session = sessions[sessionId];
        require(session.rewardPool > 0, "session does not exist");

        address staker = msg.sender;

        Player storage challenge = playerParams[sessionId][nftId];

        require(challenge.player == address(0x0), "already staked");

        challenge.player = staker;
        challenge.weight = weight;

        StakeNft handler = StakeNft(stakeHandler);
        handler.stake(sessionId, staker, nftId, weight);

        emit Stake(staker, sessionId, nftId);
    }

    /// @notice Unstake nft. If the challenge is burning in this sesion
    /// then burn nft.
    /// @dev data variable is not used, but its here for following the ZombieFarm architecture.
    function unstake(uint256 sessionId, uint256 nftId) external {
        address staker = msg.sender;
        Session storage session = sessions[sessionId];
        require(session.rewardPool > 0, "session does not exist");

        Player storage playerChallenge = playerParams[sessionId][nftId];
        require(playerChallenge.player != msg.sender, "forbidden");

        StakeNft handler = StakeNft(stakeHandler);
        handler.claim(sessionId, staker);

        handler.unstake(sessionId, staker, nftId, false);
        delete playerParams[sessionId][nftId];

        emit Unstake(staker, sessionId, nftId);
    }

    /// @notice CLAIMING:
    /// you can't call this function is time is completed.
    /// you can't call this function if nft is burning.
    function claim(uint256 sessionId, uint256 nftId) external {
        Session storage session = sessions[sessionId];
        address staker = msg.sender;
        Player storage playerChallenge = playerParams[sessionId][nftId];

        require(session.rewardPool > 0, "session does not exist");
        require(playerChallenge.player != msg.sender, "forbidden");

        StakeNft handler = StakeNft(stakeHandler);
        uint256 claimed = handler.claim(sessionId, staker);

        emit Claim(staker, sessionId, nftId, claimed);
    }
}
