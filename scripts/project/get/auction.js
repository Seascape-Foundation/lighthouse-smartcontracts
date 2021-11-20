const { ethers } = require("hardhat");
const chalk               = require("chalk");
const clear               = require("clear");

let { addressOf, alias }  = require('../../addresses');
let cliProjectId          = require('../../cli/project-id');
let projectUtil           = require('../util');


async function main() {
  clear();
  
    // We get the contract to deploy
    const Project        = await ethers.getContractFactory("LighthouseProject");
    const Auction        = await ethers.getContractFactory("LighthouseAuction");

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    let projectAddress = addressOf(chainID, alias.PROJECT);
    let auctionAddress = addressOf(chainID, alias.AUCTION);

    console.log(`Signing by ${deployer.address}`);

    let project = await Project.attach(projectAddress);
    let auction = await Auction.attach(auctionAddress);

    let latestProjectId = await projectUtil.lastId(project);
    let projectID = await cliProjectId.inputProjectId(latestProjectId);

    // was auction initialized
    let auctionInitialized = await project.auctionInitialized(projectID);
    if (!auctionInitialized) {
      console.error(chalk.red(`Auction was not initialized for the project ${projectID}`));
      return;
    } else {
      console.log(`Auction was initialized ${auctionInitialized}`);
    }

    let transferredPrefund = await project.transferredPrefund(projectID);
    if (!transferredPrefund) {
      console.error(chalk.red(`Prefund was not transferred for the project ${projectID}`));
      return;
    } else {
      console.log(`Prefund data was transferred`);
    }

    let auctionData = await auction.auctionData(projectID);
    if (!auctionData.set) {
      console.error(chalk.red(`Auction Data was not set for the project ${projectID}`));
      return;
    } else {
      console.log(`Auction data`, auctionData);
    }

    let participated = await auction.participated(projectID, deployer.address)
    if (participated) {
      return console.error(chalk.red(`User ${deployer.address} already participated in the auction for the project ${projectID}`))
    } else {
      console.log(`User ${deployer.address} did not participated!`)
    }

    // let sig = await signAuction(deployer, "0xf58Ad9E329F83B43Ba1e41AA8BbCF14CD615a951", auction.address, projectID, chainID);
    // console.log(sig);
}

async function signAuction(gameOwner, investor, auctionAddress, projectID, chainID) {
  //v, r, s related stuff
  let bytes32 = ethers.utils.defaultAbiCoder.encode(["uint256", "uint256"], [projectID, chainID]);
  let str = investor + auctionAddress.substr(2) + bytes32.substr(2);
  let data = ethers.utils.keccak256(str);
  let flatSig = await gameOwner.signMessage(ethers.utils.arrayify(data));

  let sig = ethers.utils.splitSignature(flatSig);
  console.log(sig);

  console.log(data);

  return [sig.v, sig.r, sig.s];
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});