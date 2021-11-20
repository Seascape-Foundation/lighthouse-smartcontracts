const chalk                   = require("chalk");
const clear                   = require("clear");

const { ethers }              = require("hardhat");
let { addressOf, alias }      = require('../addresses');
let cliGas                    = require('../cli/gas');
let cliConfirm                = require('../cli/confirm');
let cliAccount                = require('../cli/account')

async function main() {
  clear();

  console.log(chalk.blue(`Welcome to the deployment of the Project`));

  // We get the contract to deploy
  const Project       = await ethers.getContractFactory("LighthouseProjectWrapper");

  console.log(`Contracts were initiated`);

  let deployer        = await ethers.getSigner();
  let chainID         = await deployer.getChainId();

  let projectAddress  = addressOf(chainID, alias.PROJECT);

  // verifier = "0xb7fA673753c321f14733Eff576bC0d8E644e455e";
  let verifier        = await cliAccount.inputKycVerifier(deployer.address);

  let gasPrice        = await cliGas.inputGasPrice();

  let title = chalk.bold(`Please confirm the Project Parameters`);
  let params = {
    gasPrice: `${cliGas.weiToGwei(gasPrice)} gwei.`,
    kycVerifier: verifier,
    chainID: chainID,
    deployer: deployer.address,
    project: projectAddress
  }

  await cliConfirm.inputConfirm(title, params);

  // deploy project
  let project              = await Project.deploy(verifier, projectAddress); 
  console.log("Lighthouse Project deployed to ", chalk.green(project.address), ' Txid ', chalk.blue(project.deployTransaction.hash));

  console.log(chalk.green(`Now, please insert it into the /scripts/addresses.js and update the docs.seascape.network/`));
}
  
main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});