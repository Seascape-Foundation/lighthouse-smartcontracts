const { expect }    = require("chai");
const { ethers }    = require("hardhat");
const { utils }     = require("ethers");

/**
 * As described on https://docs.seascape.network/lighthouse-ido/smartcontrontracts#projects
 * 
 * We will use the sample Project for testing:
 * 
 *    Project Name:                 Element Words.
 *    Funds:                        10,000 USD token
 *    Allocated (lottery/auction):  8,000/2,000 ELEMENT token
 *    Collateral (lottery/auction): 400/100 CWS token
 * 
 * 
 * Prefunding timeline:
 *  
 *    Registration:                  60 seconds
 * 
 *                Delay 10 seconds
 * 
 *    Prefund:                        60 seconds
 *    
 *                Delay 10 seconds
 * 
 *    Auction:                        20 seconds
 * 
 *                Delay 10 seconds
 *                 (Create NFT)
 *             (Create ELEMENT token)
 * 
 *    Mint NFT:                       unlimited
 * 
 *                Delay 10 seconds
 * 
 *    Burn NFT:                       unlimited
 * 
 * 
 * Test parameters
 * 
 *    total users:                    10
 *    investors (lottery winners):    3
 *    auction:                        5
 *    tier 0:                         1
 *    unregistered                    1
 * 
 * Tiers:
 *    investor 1:                     1
 *    investor 2:                     2
 *    investor 3:                     3
 *    auction 1-5                     1
 *    tier 0:                         0
 *    unregistered:                   -1
 */
describe("Lighthouse Prefunding", async () => {
  //game data
  let cwsAmount               = utils.parseEther("10000");
  let totalElementSupply      = utils.parseEther("10000000");
  let totalUsdSupply          = utils.parseEther("10000000");

  let chainID         = null;

  //
  // imported contracts
  //
  let tier            = null;
  let crowns          = null;
  
  let project         = null;     // The Lighthouse Project parameters
  let usd             = null;     // The token to collect for a Project
  let element         = null;     // The token to reward to users.
  
  // registration/lottery/auction
  let registration    = null;     // The Lighthouse Project registration launched.
  let prefund         = null;     // The Lighthouse Project funding for lottery winners
  let auction         = null;     // The Lighthouse Project auction

  // claim the reward
  let nft             = null;     // The Investment NFT for a project that users could use for claiming project token
  let mint            = null;     // The interface to mint the NFTs.
  let burn            = null;     // The interface to get the project's token or collateral compensation. 

  //session & accounts data
  let investors       = [];       // Investor who one the lottery
  let participants    = [];       // Participant in the auction
  let unregistered    = [];       // Can not participate in the Project funding
  let randomPlayer    = [];       // Can not participate in the funding. Random user from outside of Lighthouse.
  let gameOwner       = null;

  let projectID       = 1;        // We test only one project

  let registrationStartTime = null; 
  let registrationEndTime   = null;
  let prefundStartTime = null; 
  let prefundEndTime   = null;
  let auctionStartTime = null; 
  let auctionEndTime   = null;

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

  async function signLotteryWin(investor, prefundAddress, chainID, projectID, level) {
    //v, r, s related stuff
    let bytes32 = utils.defaultAbiCoder.encode(["uint256", "uint256"], [chainID, projectID]);
    let bytes1 = utils.hexZeroPad([level], 1);
    let str = investor.address + prefundAddress.substr(2) + bytes32.substr(2) + bytes1.substr(2);
    let data = utils.keccak256(str);
    let flatSig = await gameOwner.signMessage(utils.arrayify(data));

    let sig = utils.splitSignature(flatSig);

    return [sig.v, sig.r, sig.s];
  }

  async function signAuction(investor, auctionAddress, projectID, amount, chainID) {
    //v, r, s related stuff
    let bytes32 = utils.defaultAbiCoder.encode(["uint256", "uint256", "uint256"], [projectID, amount, chainID]);
    let str = investor.address + auctionAddress.substr(2) + bytes32.substr(2);
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
    const accs          = await ethers.getSigners();
    gameOwner           = accs[0];
    investors           = [accs[1], accs[2], accs[3]]; // Investor
    participants        = [accs[4], accs[5], accs[6], accs[7], accs[8]]; // Participant in the auction
    unregistered        = [accs[9]]; // Can not participate in the Project funding
    randomPlayer        = [accs[10]]; // Can not participate in the funding. Random user from outside of Lighthouse.
    chainID             = await gameOwner.getChainId();

    // deploy crowns
    const Crowns        = await ethers.getContractFactory("CrownsToken");
    crowns              = await Crowns.deploy(1);    /// Argument '1' means deploy in Test mode
    await crowns.deployed();

    // deploy usd
    const USD        = await ethers.getContractFactory("USD");
    usd              = await USD.deploy(totalUsdSupply);    /// Argument '1' means deploy in Test mode
    await usd.deployed();

    // deploy tiers
    let fees = [
      utils.parseEther("1"),
      utils.parseEther("3"),
      utils.parseEther("5"),
      utils.parseEther("10")
    ];
    const Tier = await ethers.getContractFactory("LighthouseTier");
    tier = await Tier.deploy(crowns.address, gameOwner.address, fees, chainID);
    await tier.deployed();

    const addEditorTx = await tier.addEditor(gameOwner.address, {from: gameOwner.address});
    await addEditorTx.wait();

    expect(await tier.editors(gameOwner.address)).to.be.true;
  });

  it("transfer tokens to the users batch 1/3", async () => {
    // transfer to users some USD and CWS
    for (var i = 0; i<5; i++) {
      await transferFromGameOwner(participants[i], [crowns, usd]);
    }

    expect(true).to.be.true;
  });

  it("transfer tokens to the users batch 3/3", async () => {
    // transfer to users some USD and CWS
    for (var i = 0; i<3; i++) {
      await transferFromGameOwner(investors[i], [crowns, usd]);
    }

    await transferFromGameOwner(unregistered[0], [crowns, usd]);
    await transferFromGameOwner(randomPlayer[0], [crowns, usd]);

    expect(true).to.be.true;
  });
  

  it("transfer tokens and approve crowns", async () => {
    // transfer to users some USD and CWS
    await approveFor(investors, tier.address, crowns);
    await approveFor(participants, tier.address, crowns);
    await approveFor([unregistered[0], randomPlayer[0]], tier.address, crowns);

    expect(true).to.be.true;
  });

  
  it("claim tiers", async () => {
    // user 1 [investor]
    await claimTierTo(investors[0], 1);
    await claimTierTo(investors[1], 2);
    await claimTierTo(investors[2], 3);
    for (var i = 0; i < 5; i++) {
      await claimTierTo(participants[i], 1);
    }
    await claimTierTo(unregistered[0], 0);


    expect(true).to.be.true;
  });


  it("initiation of the lottery registration (game owner)", async () => {
    // deploy project
    const Project        = await ethers.getContractFactory("LighthouseProject");
    project              = await Project.deploy(gameOwner.address);    /// Argument '1' means deploy in Test mode
    await project.deployed();

    // uint256 startTime, uint256 endTime
    registrationStartTime = Math.floor(new Date().getTime() / 1000) + 3;
    registrationEndTime   = Math.floor(new Date().getTime() / 1000) + 13;
    let tx = await project.initRegistration(registrationStartTime, registrationEndTime, {from: gameOwner.address});
    await tx.wait();

    let projectRegistration = await project.registrations(projectID);

    expect(projectRegistration.startTime).to.equal(registrationStartTime);
  });

  it("register users", async () => {
    // deploy registration interface
    const Registration        = await ethers.getContractFactory("LighthouseRegistration");
    registration              = await Registration.deploy(tier.address, project.address);    /// Argument '1' means deploy in Test mode
    await registration.deployed();

    let tx = await registration.connect(investors[0]).register(projectID);
    await tx.wait();

    // register investors first
    for (var i = 1; i < investors.length; i++) {
      await registration.connect(investors[i]).register(projectID);
    }
    // then register public auctioners
    for (var i = 0; i < participants.length; i++) {
      await registration.connect(participants[i]).register(projectID);
    }

    expect(await registration.registrations(projectID, investors[0].address)).to.be.true;
  });

  it("initiation of the prefunding (game owner)", async () => {
    let currentTime   = Math.floor(new Date().getTime()/1000);
    if (registrationEndTime < currentTime) {
      prefundStartTime  = currentTime + 3;
    } else {
      prefundStartTime  = registrationEndTime + 3;
    }
    prefundEndTime    = prefundStartTime + 20;
    let investAmounts     = [
      utils.parseEther("100"),
      utils.parseEther("500"),
      utils.parseEther("1000")
    ];
    let pools             = [
      utils.parseEther("10000"),
      utils.parseEther("10000"),
      utils.parseEther("10000")
    ];
    let tx = await project.initPrefund(projectID, prefundStartTime, prefundEndTime, investAmounts, pools, usd.address, {from: gameOwner.address});
    await tx.wait();

    let projectPrefund = await project.prefunds(projectID);

    expect(projectPrefund.startTime).to.equal(prefundStartTime);
  });

  it("prepare for lottery (approve usd spend and link project to prefund)", async () => {
    // deploy prefund interface
    const Prefund        = await ethers.getContractFactory("LighthousePrefund");
    prefund              = await Prefund.deploy(tier.address, registration.address, project.address, gameOwner.address, chainID);    /// Argument '1' means deploy in Test mode
    await prefund.deployed();
    
    // Give access to the prefund to reset user's tier.
    await tier.addEditor(prefund.address, {from: gameOwner.address});

    await project.addEditor(prefund.address, {from: gameOwner.address});
    
    // so that Prefund contract can withdraw from users the investment amount.
    await approveFor(investors, prefund.address, usd, true);
  });

  it("winners invest in lottery", async () => {
    let investorBalance = await usd.balanceOf(investors[0].address);
    console.log(`Investor balance: ${investorBalance}`);
    
    // now let's invest.
    //msg.sender, address(this), chainID, projectId, tier
    let tierLevel = 1;
    var [v, r, s] = await signLotteryWin(investors[0], prefund.address, chainID, projectID, tierLevel);
    let tx = await prefund.connect(investors[0]).prefund(projectID, tierLevel, v, r, s);
    await tx.wait();

    tierLevel = 2;
    var [v, r, s] = await signLotteryWin(investors[1], prefund.address, chainID, projectID, tierLevel);
    await prefund.connect(investors[1]).prefund(projectID, tierLevel, v, r, s);

    // even though investor #3 is tier 3, he still can prefund as for tier 2
    var [v, r, s] = await signLotteryWin(investors[2], prefund.address, chainID, projectID, tierLevel);
    await prefund.connect(investors[2]).prefund(projectID, tierLevel, v, r, s);

    expect(await prefund.investments(projectID, investors[0].address)).to.be.true;
  });

  it("initiation of the auction (game owner)", async () => {
    let currentTime   = Math.floor(new Date().getTime()/1000);
    if (prefundEndTime < currentTime) {
      auctionStartTime  = currentTime + 3;
    } else {
      auctionStartTime  = prefundEndTime + 3;
    }
    auctionEndTime    = auctionStartTime + 20;
    let tx = await project.initAuction(projectID, auctionStartTime, auctionEndTime, {from: gameOwner.address});
    await tx.wait();

    let projectAuction = await project.auctions(projectID);

    expect(projectAuction.startTime).to.equal(auctionStartTime);
  });

  it("prepare for auction (mint investment nft, add pcc amount and collatoreal, move prefund to auction pool)", async () => {
    // deploy prefund interface
    const Auction        = await ethers.getContractFactory("LighthouseAuction");
    auction              = await Auction.deploy(
      crowns.address, 
      tier.address,
      registration.address, 
      prefund.address, 
      project.address, 
      chainID
    ); 
    await auction.deployed();
        
    await project.addEditor(auction.address, {from: gameOwner.address});

    // deploy investment nft
    const NFT        = await ethers.getContractFactory("LighthouseNft");
    nft              = await NFT.deploy(
      projectID, "Element Investment", "ELEMENT-NFT"
    );
    await nft.deployed();

    let prefundAllocation = utils.parseEther("8000");
    let prefundCompensation = utils.parseEther("400");
    let auctionAllocation = utils.parseEther("8000");
    let auctionCompensation = utils.parseEther("400");
    await project.initAllocationCompensation(
      projectID, 
      prefundAllocation, prefundCompensation, 
      auctionAllocation, auctionCompensation, 
      nft.address
    )
    // transfer other parts
    await project.transferPrefund(projectID);

    // so that Prefund contract can withdraw from users the investment amount.
    await approveFor([participants[0], participants[1]], auction.address, crowns, true);
  });

  it("participate in the auction", async () => {
    // now let's participate.
    //participate(uint256 projectId, uint256 amount, uint8 v, bytes32 r, bytes32 s)
    let diff = auctionStartTime - Math.floor(new Date().getTime()/1000);
    if (diff > 0) {
      if (diff > 10) {
        throw `Too many seconds to pass, please update the interval of the project phases`;
      }
      await sleep(diff * 1000);
    }

    let amount = utils.parseEther("100");
    var [v, r, s] = await signAuction(participants[0], auction.address, projectID, amount, chainID);
    await auction.connect(participants[0]).participate(projectID, amount, v, r, s);

    amount = utils.parseEther("75");
    var [v, r, s] = await signAuction(participants[1], auction.address, projectID, amount, chainID);
    let tx = await auction.connect(participants[1]).participate(projectID, amount, v, r, s);
    await tx.wait();

    expect(await auction.spents(projectID, participants[1].address)).to.equal(amount);
  });

  it("initiation of the minting (game owner)", async () => {
    // deploy investment nft minting interface
    const Mint        = await ethers.getContractFactory("LighthouseMint");
    mint              = await Mint.deploy(
      auction.address, prefund.address, tier.address, project.address, crowns.address
    );
    await mint.deployed();

    // allow investment token to be minted by mint interface
    await nft.setMinter(mint.address);
  });

  it("mint investment nfts", async () => {
    let wait = 0;   // Wait till the end of the Auction
    let currentTime   = Math.floor(new Date().getTime()/1000);
    console.log(`In the tests Current time ${currentTime} and auction end time ${auctionEndTime}`)
    if (auctionEndTime > currentTime) {
      wait  = auctionEndTime - currentTime;
    }
    if (wait > 10) {
      throw `Please decrease the Auction duration, as it exceeds timeout limit of tests`;
    } else if (wait > 0) {
      await sleep(wait * 1000);
    }

    console.log(`Prefund investor's tier: ${await prefund.getPrefundTier(projectID, investors[0].address)}`);

    console.log(`Now after waiting ${wait} seconds, current time is ${Math.floor(new Date().getTime()/1000)}`);
    let tx = await mint.connect(investors[0]).mint(projectID, {from: investors[0].address});
    await tx.wait();

    await mint.connect(investors[1]).mint(projectID, {from: investors[1].address});

    await mint.connect(participants[0]).mint(projectID, {from: participants[0].address});
    await mint.connect(participants[1]).mint(projectID, {from: participants[1].address});

    expect(await mint.mintedNfts(projectID, investors[0].address)).to.not.equal(0);
  });


  it("initiation of the investment nft burning in exchange for tokens (game owner)", async () => {
    // deploy investment nft burning
    const Burn        = await ethers.getContractFactory("LighthouseBurn");
    burn              = await Burn.deploy(
      auction.address, prefund.address, tier.address, crowns.address, project.address
    );
    await burn.deployed();

    // allow investment token to be minted by mint interface
    await nft.setBurner(burn.address);

    // deploy investment nft burning
    const Element        = await ethers.getContractFactory("Element");
    element              = await Element.deploy(totalElementSupply);
    await element.deployed();

    let tx = await project.setPcc(projectID, element.address, {from: gameOwner.address});
    await tx.wait();
  });

  it("transfer PCC and collateral to the burn (game owner)", async () => {
    tx = await element.transfer(burn.address, utils.parseEther("10000"), {from: gameOwner.address});
    await tx.wait();
    tx = await crowns.transfer(burn.address, utils.parseEther("500"), {from: gameOwner.address});
    await tx.wait();
  });
  
  it("burn investment nfts", async () => {
    let nftID = 1;
    let tx = await nft.connect(investors[0]).approve(burn.address, nftID, {from: investors[0].address})
    await tx.wait();
    await burn.connect(investors[0]).burnForPcc(projectID, nftID, {from: investors[0].address});

    nftID = 4;
    tx = await nft.connect(participants[1]).approve(burn.address, nftID, {from: participants[1].address})
    await tx.wait();
    tx = await burn.connect(participants[1]).burnForCws(projectID, nftID, {from: participants[1].address});
    await tx.wait();

    // nftID = 3;
    // tx = await nft.connect(participants[0]).approve(burn.address, nftID, {from: participants[0].address})
    // await tx.wait();
    // await burn.connect(participants[0]).burnForPcc(projectID, nftID, {from: participants[0].address});

    expect(await burn.stakeReserves(element.address)).to.not.equal(0);
  });

  async function claimTierTo(acc, levelTo) {
    let level = 0;
    let nonce = 0;

    var claimTx;

    for (var i = 0; i <= levelTo; i++) {
      var [v, r, s] = await signBadge(acc, nonce, level, chainID, tier.address);
      claimTx = await tier.connect(acc).claim(level, v, r, s);
      // await claimTx.wait();

      nonce++;
      level++;
    }
  }


  async function transferFromGameOwner(to, tokens) {
    for (var i = 0; i < tokens.length; i++){ 
      var transferTx = await tokens[i].transfer(to.address, cwsAmount, {from: gameOwner.address});
      // await transferTx.wait();
    }
  }

  async function approveFor(users, to, token, wait) {
    for (var i = 0; i < users.length; i++){ 
      var approveTx = await token.connect(users[i]).approve(to, cwsAmount);
      if (wait) {
        await approveTx.wait();
      }
    }
  }
});
