#!/usr/bin/env node

const chalk               = require("chalk");
const clear               = require("clear");

const { ethers }          = require("hardhat");
let { addressOf, alias }  = require('../addresses');
let cliGas                = require('../cli/gas');
let cliStartEnd           = require('../cli/start-end');
let cliConfirm            = require('../cli/confirm');
let cliProjectId          = require('../cli/project-id');
let cliPrefund            = require('../cli/prefund');
let projectUtil           = require('./util');


async function main() {
  clear();

    // We get the contract to deploy
    const Project       = await ethers.getContractFactory("LighthouseProject");
    const Usdc          = await ethers.getContractFactory("USD");

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    console.log(`Signing by ${deployer.address}`);

    let projectAddress = addressOf(chainID, alias.PROJECT);
    let usdAddress    = addressOf(chainID, alias.USDC);

    let project = await Project.attach(projectAddress);
    let usdc = await Usdc.attach(usdAddress)

    let gasPrice = await cliGas.inputGasPrice();

    let latestProjectId = await projectUtil.lastId(project);
    let projectID       = await cliProjectId.inputProjectId(latestProjectId);

    let decimals        = await usdc.decimals();

    let investAmounts   = await cliPrefund.inputInvest(decimals);
    let pools           = await cliPrefund.inputPool(decimals);

    let { start, end }  = await cliStartEnd.inputStartEnd();

    let title = `Initiation of the prefund phase with the following parameters!`;
    let params = {
      gasPrice: `${cliGas.weiToGwei(gasPrice)} gwei`,
      projectAddress: `${projectAddress}`,
      prefundToken: `Collecting USDC at ${usdAddress}`,

      projectID: projectID,
      startTime: `${new Date(start * 1000)}`,
      endTime: `${new Date(end * 1000)}`,
      tierOneInvest: ethers.utils.formatUnits(investAmounts[0], decimals),
      tierTwoInvest: ethers.utils.formatUnits(investAmounts[1], decimals),
      tierThreeInvest: ethers.utils.formatUnits(investAmounts[2], decimals),

      tierOnePool: ethers.utils.formatUnits(pools[0], decimals),
      tierTwoPool: ethers.utils.formatUnits(pools[1], decimals),
      tierThreePool: ethers.utils.formatUnits(pools[2], decimals),

      tierOneAmount: ethers.utils.formatUnits(pools[0], decimals) / ethers.utils.formatUnits(investAmounts[0], decimals),
      tierTwoAmount: ethers.utils.formatUnits(pools[1], decimals) / ethers.utils.formatUnits(investAmounts[1], decimals),
      tierThreeAmount: ethers.utils.formatUnits(pools[2], decimals) / ethers.utils.formatUnits(investAmounts[2], decimals),
    }

    await cliConfirm.inputConfirm(title, params);

    let tx = await project.initPrefund(projectID, start, end, investAmounts, pools, usdAddress, {from: deployer.address, gasPrice: gasPrice});
    console.log(`Project registration was ` + chalk.green(`successfull`) + `. Txid: ` + chalk.blue(tx.hash));
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});