const chalk = require("chalk");
const clear = require("clear");

const { ethers } = require("hardhat");
let { addressOf, alias } = require('../addresses');
let cliGas = require('../cli/gas');
let cliConfirm = require('../cli/confirm');

async function main() {
  clear();

  console.log(chalk.blue(`Welcome to the deployment of Registration Interface`));

  // We get the contract to deploy
  const Registration = await ethers.getContractFactory("LighthouseRegistration");

  let deployer = await ethers.getSigner();
  let chainID = await deployer.getChainId();

  let gasPrice = await cliGas.inputGasPrice();

  // Constructor arguments
  let projectAddress = await addressOf(chainID, alias.PROJECT);

  let title = `Please confirm the parameters...`;
  let params = {
    projectAddress: projectAddress,
    gasPrice: `${cliGas.weiToGwei(gasPrice)} gwei`,
    deployer: deployer.address
  }

  await cliConfirm.inputConfirm(title, params);

  // deploy registration interface
  let registration = await Registration.deploy(projectAddress, chainID);

  console.log("Lighthouse Registration deployed to ", chalk.green(registration.address), ' Txid ', chalk.blue(registration.deployTransaction.hash));

  console.log(chalk.green(`Now, please insert it into the /scripts/addresses.js and update the docs.seascape.network/`));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });