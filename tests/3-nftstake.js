const { expect } = require("chai");
const { ethers } = require("hardhat");
const { utils } = require("ethers");
// var LighthouseStake = require("contracts/LighthouseStake.sol");
// var LighthouseNft = require("contracts/LighthouseNft.sol");
// var USD = require("contracts/USD.sol");
//npx hardhat test tests/3-nftstake.js
async function signStakeToken(owner, stakeId, sessionId, nftId) {
    //v, r, s related stuff
    let bytes32 = utils.defaultAbiCoder.encode(["uint256", "uint256", "uint256"], [stakeId, sessionId, nftId]);
    let data = utils.keccak256(bytes32);
    let hash = await owner.signMessage(utils.arrayify(data));

    let r = hash.substr(0, 66);
    let s = "0x" + hash.substr(66, 64);
    let v = parseInt(hash.substr(130), 16);
    if (v < 27) {
        v += 27;
    }
    return [v, r, s];
}
// describe Lighthouse Staking test
describe("Lighthouse Staking", async () => {
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    let usdAmount = utils.parseEther("10000");
    let usd = null;


    let owner = null;
    let nft1, nft2 = null;
    let stakeContract = null;
    let sessionId = 1;
    let rewardPool = 100;

    it("1 should link contracts", async () => {
        let signers = await ethers.getSigners();
        player1 = signers[0];
        player2 = signers[1];
        owner = signers[3];

        const USD = await ethers.getContractFactory("USD");
        usd = await USD.deploy(usdAmount);    /// Argument 1 means deploy in Test mode
        await usd.deployed();
        console.log("USD deployed to ", usd.address);


        const LighthouseNft = await ethers.getContractFactory("LighthouseNft");
        nft1 = await LighthouseNft.deploy(1, "nft1", "nft1");
        nft2 = await LighthouseNft.deploy(1, "nft2", "nft2");
        await nft1.deployed();
        await nft2.deployed();
        console.log("nft1 address: " + nft1.address);
        console.log("nft2 address: " + nft2.address);

        let deployer        = await ethers.getSigner();
        const LighthouseStake = await ethers.getContractFactory("LighthouseStake");
        stakeContract = await LighthouseStake.deploy(deployer.address);
        await stakeContract.deployed();
        console.log("LighthouseStake deployed to ", stakeContract.address);
    });

    it("2 should start a new defi session", async () => {
        let startTime = 1648051304;
        let period = 600;

        console.log(`starting session...`);
        await stakeContract.addSession(sessionId, startTime, period, rewardPool, nft1.address, usd.address);
        console.log(`session started!`);
    });

    it("3 should stake nfts", async () => {
        let stakeId = 1;
        let nftId = 1;
        let [v, r, s] = await signStakeToken(owner, stakeId, sessionId, nftId);

        console.log(`stakeId: ${stakeId}, sessionId: ${sessionId}, nftId: ${nftId}`);
        // console.log(`v: ${v}, r: ${r}, s: ${s}`);
        await stakeContract.stake(sessionId, nftId);
        console.log(`staked!`);
    });

    // try to stake the same nft again
    it("4 should try to stake the same nft again", async () => {
        let stakeId = 1;
        let nftId = 1;
        let [v, r, s] = await signStakeToken(owner, stakeId, sessionId, nftId);

        console.log(`stakeId: ${stakeId}, sessionId: ${sessionId}, nftId: ${nftId}`);
        // console.log(`v: ${v}, r: ${r}, s: ${s}`);
        await stakeContract.stake(sessionId, nftId);
        console.log(`staked!`);
    });
    
        


    async function stakeNft(token, amount) {

    }

});