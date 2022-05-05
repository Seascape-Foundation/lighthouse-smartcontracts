const { ethers } = require("hardhat");
const chalk               = require("chalk");
const clear               = require("clear");

let { addressOf, alias }  = require('../addresses');
let cliGas                = require('../cli/gas');
let cliProjectId          = require('../cli/project-id');
let projectUtil           = require('../project/util');
let csv                   = require('./csv');


async function main() {
    // We get the contract to deploy
    const Mint            = await ethers.getContractFactory("LighthouseMint");
    const Project         = await ethers.getContractFactory("LighthouseProject");
    const Auction         = await ethers.getContractFactory("LighthouseAuction");

    let deployer          = await ethers.getSigner();
    let chainID           = await deployer.getChainId();

    let projectAddress    = addressOf(chainID, alias.PROJECT_WRAPPER);
    let mintAddress       = addressOf(chainID, alias.MINT);
    let auctionAddress  = addressOf(chainID, alias.AUCTION);

    let project           = await Project.attach(projectAddress);
    let mint              = await Mint.attach(mintAddress);
    let auction           = await Auction.attach(auctionAddress);

    let latestProjectId = await projectUtil.lastId(project);
    let projectID = await cliProjectId.inputProjectId(latestProjectId);

    let auctionTotalWei  = await project.auctionTotalPool(projectID);
    let totalSpent = auctionTotalWei / 1e18;
    let auctionData = await project.auctions(projectID);
    let perUnit = auctionData.scaledAllocation/1e36 / totalSpent;
    console.log(`Auction allocation: ${auctionData.scaledAllocation/1e36}, collateral: ${auctionData.scaledCompensation/1e36}`);
    console.log(`Per CWS: ${perUnit}`)

    let moonscapeAuction = csv.getMoonscapeAuction();

    let i = 1;  // minimum from 1, as index 0 is the title.
    let contractTotal = 0;
    let dbTotal = 0;
    for (; i < moonscapeAuction.length; i++) {
      let investor = moonscapeAuction[i][1];
      let dbAmount = moonscapeAuction[i][0];
      let contractSpent = await auction.getSpent(projectID, investor);
      let userParam = await mint.allocationCompensation(projectID, investor);
      dbTotal += dbAmount * perUnit;
      contractTotal += userParam[0].toString()/1e36;

      console.log(`${i},${investor},${contractSpent/1e18},${dbAmount},${userParam[0].toString()/1e36},${dbAmount * perUnit},${contractTotal},${dbTotal}`);
    }
    return

    console.log(`Successfully minted an investment nft. Txid: ${tx.hash}`);
}

async function signMint(investor, mintAddress, projectID, chainID, gameOwner) {
  //v, r, s related stuff
  let bytes32 = ethers.utils.defaultAbiCoder.encode(["uint256", "uint256"], [projectID, chainID]);
  let str = investor + mintAddress.substr(2) + bytes32.substr(2);
  let data = ethers.utils.keccak256(str);
  let flatSig = await gameOwner.signMessage(ethers.utils.arrayify(data));

  console.log(flatSig);
  let sig = ethers.utils.splitSignature(flatSig);

  return sig;
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});