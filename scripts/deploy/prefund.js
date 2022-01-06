const chalk                   = require("chalk");
const clear                   = require("clear");

const { ethers }              = require("hardhat");
let { addressOf, alias }      = require('../addresses');
let cliGas                    = require('../cli/gas');
let cliConfirm                = require('../cli/confirm');
let cliAccount                = require('../cli/account');

async function main() {
  clear();

  console.log(`Welcome to the deployment of the Prefund Contract`);

  // We get the contract to deploy
  const Tier          = await ethers.getContractFactory("LighthouseTierWrapper");
  const Project       = await ethers.getContractFactory("LighthouseProject");
  const Prefund       = await ethers.getContractFactory("LighthousePrefund");

  console.log(`Contracts were initiated`);

  let deployer        = await ethers.getSigner();
  let chainID         = await deployer.getChainId();

  // Constructor arguments
  let tierAddress     = addressOf(chainID, alias.TIER_WRAPPER);
  let registrationAddress = addressOf(chainID, alias.REGISTRATION);
  let projectAddress  = addressOf(chainID, alias.PROJECT);

  // To add permissions
  let project         = await Project.attach(projectAddress);
  let tier            = await Tier.attach(tierAddress);

  let gasPrice        = await cliGas.inputGasPrice();

  let fundCollector   = await cliAccount.inputFundCollector(deployer.address);

  let deployTitle = `Please confirm Prefund parameters`;
  let deployParams = {
    gasPrice: `${cliGas.weiToGwei(gasPrice)}`,
    fundCollector: fundCollector,
    tierAddress: tierAddress,
    registrationAddress: registrationAddress,
    projectAddress: projectAddress,

    chainID: chainID
  }

  await cliConfirm.inputConfirm(deployTitle, deployParams);

  // deploy prefund interface
  let prefund         = await Prefund.deploy(tierAddress, registrationAddress, projectAddress, fundCollector, chainID, {gasPrice: gasPrice});    /// Argument '1' means deploy in Test mode
  console.log("Lighthouse Project deployed to ", chalk.green(prefund.address), ' Txid ', chalk.blue(prefund.deployTransaction.hash));

  console.log(chalk.green(`Now, please insert it into the /scripts/addresses.js and update the docs.seascape.network/`));

  // Give access to the prefund to reset user's tier.
  await tier.addEditor(prefund.address, {from: deployer.address, gasPrice: gasPrice});
  console.log(`Lighthouse Prefund got permission to update Lighthouse Tier.`);

  await project.addEditor(prefund.address, {from: deployer.address, gasPrice: gasPrice});
  console.log(`Lighthouse Prefund got permission to update Lighthouse Project data.`);

  console.log(`\n\nDeployment Finished!\n\n`);
}
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });