const { ethers } = require("hardhat");
const chalk               = require("chalk");
const clear               = require("clear");

let { addressOf, alias }  = require('../../addresses');
let cliProjectId          = require('../../cli/project-id');
let projectUtil           = require('../util');


async function main() {
  clear();
  
    // We get the contract to deploy
    const Project        = await ethers.getContractFactory("LighthouseProjectWrapper");

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    let projectAddress = addressOf(chainID, alias.PROJECT_WRAPPER);

    console.log(`Signing by ${deployer.address}`);

    let project = await Project.attach(projectAddress);

    let latestProjectId = await projectUtil.lastId(project);
    let projectID = await cliProjectId.inputProjectId(latestProjectId);

    let auction = await project.auctions(projectID);
    console.log(`Auction allocation: ${auction.scaledAllocation/1e36}, collateral: ${auction.scaledCompensation/1e36}`);

    let prefund = await project.prefunds(projectID);
    console.log(prefund);

    let totalAuctionPool = await project.auctionTotalPool(projectID);
    console.log(`Total burnt CWS: ${totalAuctionPool/1e18}`);

    let totalPool = await project.prefundTotalPool(projectID);
    console.log(`Cap: ${totalPool[0]/1e6}, Invested: ${totalPool[1]/1e6}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});