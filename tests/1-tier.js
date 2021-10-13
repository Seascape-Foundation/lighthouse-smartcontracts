const { expect } = require("chai");
const { ethers } = require("hardhat");
const { utils } = require("ethers")

describe("Lighthouse Tier", async () => {
  //game data
  let cwsAmount = utils.parseEther("10000");

  // imported contracts
  let tier = null;
  let crowns = null;

  //session & accounts data
  let player = null;
  let gameOwner = null;

  let chainID = null;

  async function signBadge(investor, nonce, level, chainID, tierAddress) {
    //v, r, s related stuff
    let bytes32 = utils.defaultAbiCoder.encode(["uint256"], [nonce]);
    let chain32 = utils.defaultAbiCoder.encode(["uint256"], [chainID]);
    let bytes1 = utils.hexZeroPad([level], 1);
    let str = investor.address + bytes32.substr(2) + bytes1.substr(2) + chain32.substr(2) + tierAddress.substr(2);
    let data = utils.keccak256(str);
    let flatSig = await gameOwner.signMessage(utils.arrayify(data));

    let sig = utils.splitSignature(flatSig);

    return [sig.v, sig.r, sig.s];
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // before player starts, need a few things prepare.
  // one of things to allow nft to be minted by nft factory
  it("initiates the contracts and set the tier user to game owner.", async () => {
    const [acc0, acc1] = await ethers.getSigners();
    gameOwner = acc0;
    player = acc1;
    chainID             = await gameOwner.getChainId();
    
    const Crowns = await ethers.getContractFactory("CrownsToken");
    crowns = await Crowns.deploy(1);    /// Argument 1 means deploy in Test mode
    await crowns.deployed();

    let fees = [
      utils.parseEther("1"),
      utils.parseEther("3"),
      utils.parseEther("5"),
      utils.parseEther("10")
    ];
    const Tier = await ethers.getContractFactory("LighthouseTier");
    tier = await Tier.deploy(crowns.address, gameOwner.address, fees);

    const transferTx = await crowns.transfer(player.address, cwsAmount, {from: gameOwner.address});
    await transferTx.wait();

    const addEditorTx = await tier.addEditor(gameOwner.address, {from: gameOwner.address});
    await addEditorTx.wait();

    expect(await tier.editors(gameOwner.address)).to.be.true;
  });

  it("should fail to claim tier 1, before claiming tier 0", async () => {
    // To pay for fee
    const approveTx = await crowns.connect(player).approve(tier.address, cwsAmount);
    await approveTx.wait();

    let level = 1;
    
    let badge = await tier.tiers(player.address);
    let nonce = parseInt(badge.nonce.toString());

    let [v, r, s] = await signBadge(player, nonce, level, chainID, tier.address);

    try {
        let claimTx = await tier.connect(player).claim(level, v, r, s);
        await claimTx.wait();
    } catch(e) {
      expect(e.reason).to.equal("transaction failed");//LighthouseTier: LEVEL_MISMATCH");
    }
  });

  //does not wait a week to see if session is closed
  it("should claim tier 0", async () => {
    let level = 0;
    
    let badge = await tier.tiers(player.address);
    let nonce = parseInt(badge.nonce.toString());

    let [v, r, s] = await signBadge(player, nonce, level, chainID, tier.address);

    let claimTx = await tier.connect(player).claim(level, v, r, s);
    await claimTx.wait();

    let claimedBadge = await tier.tiers(player.address);
    expect(claimedBadge.nonce).to.equal("1");
    expect(claimedBadge.usable).to.be.true;
  });

  it("should claim tier 1", async () => {
    let level = 1;
    
    let badge = await tier.tiers(player.address);
    let nonce = parseInt(badge.nonce.toString());

    let [v, r, s] = await signBadge(player, nonce, level, chainID, tier.address);

    let claimTx = await tier.connect(player).claim(level, v, r, s);
    await claimTx.wait();

    let claimedBadge = await tier.tiers(player.address);
    expect(claimedBadge.nonce).to.equal("2");
    expect(claimedBadge.usable).to.be.true;
    expect(claimedBadge.level).to.equal(level);
  });

  it("should fail to claim tier 0 after claiming tier 1", async () => {
    let level = 0;
    
    let badge = await tier.tiers(player.address);
    let nonce = parseInt(badge.nonce.toString());

    let [v, r, s] = await signBadge(player, nonce, level, chainID, tier.address);

    try {
      let claimTx = await tier.connect(player).claim(level, v, r, s);
      claimTx.wait();  
    } catch(e) {
      expect(e.reason).to.equal("transaction failed");//LighthouseTier: CLAIM_0");
    }
  });

  it("should fail to re-claim tier 1, when tier 1 is usable by tier user", async () => {
    let level = 1;
    
    let badge = await tier.tiers(player.address);
    let nonce = parseInt(badge.nonce.toString());

    let [v, r, s] = await signBadge(player, nonce, level, chainID, tier.address);

    let claimTx;
    try {
      claimTx = await tier.connect(player).claim(level, v, r, s);
      await claimTx.wait();
    } catch(e) {
      expect(e.reason).to.equal("transaction failed");//LighthouseTier: INVALID_LEVEL");
    }
  });


  it("uses the tier", async () => {
    let level = 1;
    
    let useTx = await tier.use(player.address, level);
    await useTx.wait();

    let badge = await tier.tiers(player.address);
    expect(badge.usable).to.be.false;
  });

  it("can not claim any tier except used tier, which is tier 1", async () => {
    let level = 0;
    
    let badge = await tier.tiers(player.address);
    let nonce = parseInt(badge.nonce.toString());

    let [v, r, s] = await signBadge(player, nonce, level, chainID, tier.address);

    try {
        let claimTx = await tier.connect(player).claim(level, v, r, s);
        await claimTx.wait();
    } catch(e) {
        expect(e.reason).to.equal("transaction failed");//LighthouseTier: LEVEL_MISMATCH");
    }
  });

  it("re-claims tier 1 which is used", async () => {
    let level = 1;
    
    let badge = await tier.tiers(player.address);
    let nonce = parseInt(badge.nonce.toString());

    let [v, r, s] = await signBadge(player, nonce, level, chainID, tier.address);

    let claimTx = await tier.connect(player).claim(level, v, r, s);
    await claimTx.wait();

    let claimedBadge = await tier.tiers(player.address);
    expect(claimedBadge.nonce).to.equal(nonce + 1);
    expect(claimedBadge.usable).to.be.true;
    expect(claimedBadge.level).to.equal(level);
  });

  it("should fail to claim tier 3, since tier 2 not claimed", async () => {
    let level = 3;
    
    let badge = await tier.tiers(player.address);
    let nonce = parseInt(badge.nonce.toString());

    let [v, r, s] = await signBadge(player, nonce, level, chainID, tier.address);

    try {
      let claimTx = await tier.connect(player).claim(level, v, r, s);
      await claimTx.wait();
    } catch(e) {
        expect(e.reason).to.equal("transaction failed");//Seapad: INVALID_LEVEL");
    }
  });

  it("claim tier 2", async () => {
    let level = 2;
    
    let badge = await tier.tiers(player.address);
    let nonce = parseInt(badge.nonce.toString());

    let [v, r, s] = await signBadge(player, nonce, level, chainID, tier.address);

    let claimTx = await tier.connect(player).claim(level, v, r, s);
    await claimTx.wait();

    let claimedBadge = await tier.tiers(player.address);
    expect(claimedBadge.nonce).to.equal(nonce + 1);
    expect(claimedBadge.usable).to.be.true;
    expect(claimedBadge.level).to.equal(level);
  });

  it("claim tier 3", async () => {
    let level = 3;
    
    let badge = await tier.tiers(player.address);
    let nonce = parseInt(badge.nonce.toString());

    let [v, r, s] = await signBadge(player, nonce, level, chainID, tier.address);

    let claimTx = await tier.connect(player).claim(level, v, r, s);
    await claimTx.wait();

    let claimedBadge = await tier.tiers(player.address);
    expect(claimedBadge.nonce).to.equal(nonce + 1);
    expect(claimedBadge.usable).to.be.equal(true)
    expect(claimedBadge.level).to.equal(level)
  });

  it("should fail to claim non existing tier 4 ", async () => {
    let level = 4;
    
    let badge = await tier.tiers(player.address);
    let nonce = parseInt(badge.nonce.toString());

    let [v, r, s] = await signBadge(player, nonce, level, chainID, tier.address);

    try {
        await tier.connect(player).claim(level, v, r, s);
    } catch(e) {
        expect(e.reason).to.equal("transaction failed");//Seapad: INVALID_PARAMETER");
    }
  });

  it("should set fees", async () => {
    let fees = [
      utils.parseEther("100"),
      utils.parseEther("1"),
      utils.parseEther("5"),
      utils.parseEther("10")
    ];

    // player can not claim
    try {
        let setTx = await tier.connect(player).setFees(fees);
        await setTx.wait();
    } catch(e) {
        expect(e.reason).to.equal("transaction failed");//Ownable: caller is not the owner");
    }

    // game owner can claim
    let ownerSetTx = await tier.setFees(fees);
    await ownerSetTx.wait();

    let level0Fee = await tier.fees(0);
    let level3Fee = await tier.fees(3);

    expect(level0Fee).to.equal(fees[0]);
    expect(level3Fee).to.equal(fees[3]);
  });

  it("should set claim verifier", async () => {
    // player can not set it
    try {
        let playerTx = await tier.connect(player).setClaimVerifier(player.address);
        await playerTx.wait();
    } catch(e) {
        expect(e.reason).to.equal("transaction failed");//Ownable: caller is not the owner");
    }

    // game owner can claim
    let ownerTx = await tier.setClaimVerifier(player.address);
    await ownerTx.wait();

    let claimVerifier = await tier.claimVerifier();

    expect(claimVerifier).to.equal(player.address);
  });

  it("should add tier editor", async () => {
    // player can not set it
    try {
        let playerTx = await tier.connect(player).addEditor(player.address);
        await playerTx.wait();
    } catch(e) {
        expect(e.reason).to.equal("transaction failed");//Ownable: caller is not the owner");
    }

    // game owner can claim
    let ownerTx = await tier.addEditor(player.address);
    await ownerTx.wait();

    let user = await tier.editors(player.address);

    expect(user).to.be.true;
  });

  it("should delete editor", async () => {
    // player can not set it
    try {
        let playerTx = await tier.connect(player).deleteEditor(player.address);
        await playerTx.wait();
    } catch(e) {
        expect(e.reason).to.equal("transaction failed");//Ownable: caller is not the owner");
    }

    // game owner can claim
    let ownerTx = await tier.deleteEditor(player.address);
    await ownerTx.wait();

    let badgeUser = await tier.editors(player.address);

    expect(badgeUser).to.be.false;
  });
});
