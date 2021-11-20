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
    console.log(auction);

    let prefund = await project.prefunds(projectID);
    console.log(prefund);

    let totalPool = await project.prefundTotalPool(projectID);
    console.log(`Cap: ${totalPool[0]/1e18}, Invested: ${totalPool[1]/1e18}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});