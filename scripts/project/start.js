#!/usr/bin/env node

const chalk = require("chalk");
const clear = require("clear");

const { ethers } = require("hardhat");
let { addressOf, alias } = require('../addresses');
let cliGas = require('../cli/gas');
let cliStartEnd = require('../cli/start-end');
let cliConfirm = require('../cli/confirm');
let projectUtil = require('./util');

async function main() {
  clear();

  // We get the contract to deploy
  const Project = await ethers.getContractFactory("LighthouseProject");

  let deployer = await ethers.getSigner();
  let chainID = await deployer.getChainId();

  console.log(`Signing by ${deployer.address}`);
  console.log(`Chain id  ${chainID}`);
  let projectAddress = addressOf(chainID, alias.PROJECT);
  let project = await Project.attach(projectAddress);
  let latestProjectId = await projectUtil.lastId(project);

  console.log('Latest project id: ' + chalk.blue(`${latestProjectId}`));

  let owner = await project.owner();
  if (owner.toLowerCase() != deployer.address.toLowerCase()) {
    console.error(`Owner ${owner} doesn't match with contract caller ${deployer.address}`);
    return;
  }

  let gasPrice = await cliGas.inputGasPrice();
  let { start, end } = await cliStartEnd.inputStartEnd();

  console.log(`\n\n`);

  let title = 'Initializing a new registration phase with following parameters!';
  let params = {
    gasPrice: chalk.blue(`${(cliGas.weiToGwei(gasPrice))} gwei`),
    projectAddress: chalk.blue(`${projectAddress}`),
    startTime: chalk.blue(`${new Date(start * 1000)}`),
    endTime: chalk.blue(`${new Date(end * 1000)}`),
  }

  await cliConfirm.inputConfirm(title, params);

  // uint256 startTime, uint256 endTime
  let tx = await project.initRegistration(start, end, { from: deployer.address, gasPrice: gasPrice });

  console.log(`Project registration was ` + chalk.green(`successfull`) + `. Txid: ` + chalk.blue(tx.hash));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
