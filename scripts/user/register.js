const chalk                   = require("chalk");
const clear                   = require("clear");

const { ethers }              = require("hardhat");
let cliGas                    = require('../cli/gas');
let cliConfirm            = require('../cli/confirm');
let cliProjectId          = require('../cli/project-id');
let cliAccount            = require('../cli/account')
let projectUtil           = require('./../project/util');
const { addressOf, alias } = require("../addresses");

/**
 * Investor registers in the Blockchain
 */
async function main() {
  clear();

    // We get the contract to deploy
    const Registration        = await ethers.getContractFactory("LighthouseRegistration");
    const Project             = await ethers.getContractFactory("LighthouseProject");
    const Tier                = await ethers.getContractFactory("LighthouseTierWrapper");

    let deployers             = await ethers.getSigners();
    let deployer              = await cliAccount.inputPickAccount(deployers);
    let chainID               = await deployer.getChainId();

    console.log(`Signing by ${deployer.address}`);

    let registration          = await Registration.attach(addressOf(chainID, alias.REGISTRATION));
    let project               = await Project.attach(addressOf(chainID, alias.PROJECT));
    let tier                  = await Tier.attach(addressOf(chainID, alias.TIER_WRAPPER));

    let tierLevel             = await tier.getTierLevel(deployer.address);
    if (tierLevel <= 0) {
      return console.log(chalk.red(`User ${deployer.address} tier should be atleast 1`));
    }

    let gasPrice              = await cliGas.inputGasPrice();

    let latestProjectId       = await projectUtil.lastId(project);
    let projectID             = await cliProjectId.inputProjectId(latestProjectId);

    let title                 = `Please confirm the parameters`;
    let params                = {
      projectID:  projectID,
      gasPrice: `${cliGas.weiToGwei(gasPrice)} wei`,
      user: deployer.address
    }

    await cliConfirm.inputConfirm(title, params)

    let userTx = await registration.connect(deployer).register(projectID, {from: deployer.address, gasPrice: gasPrice});

    console.log(`User ${deployer.address} registered for project ${projectID}! Txid ` + chalk.blue(userTx.hash));
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});