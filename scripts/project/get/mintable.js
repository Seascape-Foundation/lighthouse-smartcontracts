#!/usr/bin/env node

/**
 * This script enables the minting of Lighthouse NFTs
 */

const chalk                   = require("chalk");
const clear                   = require("clear");

const { ethers }              = require("hardhat");
let { addressOf, alias }      = require('../../addresses');
let cliProjectId              = require('../../cli/project-id');
let projectUtil               = require('../util');

async function main() {
  clear();

  // We get the contract to deploy
  const Project       = await ethers.getContractFactory("LighthouseProject");

  let deployer        = await ethers.getSigner();
  let chainID         = await deployer.getChainId();

  console.log(`Signing by ${deployer.address}`);

  let projectAddress  = addressOf(chainID, alias.PROJECT);

  let project         = await Project.attach(projectAddress);

  // Parameters of the transactions
  let latestProjectId = await projectUtil.lastId(project);
  let projectID = await cliProjectId.inputProjectId(latestProjectId);

  let mintInitialized = await project.mintInitialized(projectID);
  if (!mintInitialized) {
    console.log(`Mint Enablng is ` + chalk.red(`disabled`) + `.`);
  } else {
    console.log(`Minting was not enabled yet`);
  }
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});