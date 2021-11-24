const { ethers } = require("hardhat");
const clear               = require("clear");
const chalk               = require("chalk");

let cliOwner              = require('../cli/owner')
let cliConfirm            = require('../cli/confirm')
let cliGas                = require('../cli/gas');

async function main() {
  clear();
  
    // We get the contract to deploy
    const Project        = await ethers.getContractFactory("LighthouseProject");

    let deployer      = await ethers.getSigner();

    let address       = await cliOwner.inputAddress();

    console.log(`Signing by ${deployer.address}`);

    let project = await Project.attach(address);

    let owner = await project.kycVerifier();

    console.log(`The smartcontract ${address} verifier is ${owner}`);

    let changeTitle = 'Do you want to change the verifier of the contract? y/n';

    await cliConfirm.inputConfirm(changeTitle, {});

    let contractOwner = await project.owner();

    if (contractOwner.toLowerCase() != deployer.address.toLocaleLowerCase()) {
      console.error(chalk.red(`The current user ${deployer.address} and the owner of contract ${owner} doesnt match!`));
      process.exit(1);
    }

    let newOwner = await cliOwner.inputNewOwner();
    let gasPrice = await cliGas.inputGasPrice();

    let newOwnerTitle = `Are you sure you?`
    let newOwnerParams = {
      oldOwner: owner,
      newOwner: newOwner,
      gasPrice: `${cliGas.weiToGwei(gasPrice)} gwei`
    };
    await cliConfirm.inputConfirm(newOwnerTitle, newOwnerParams);

  let transferTx = await project.setKYCVerifier(newOwner, {from: deployer.address, gasPrice});
  console.log(`Changing verifier was successful! Txid: ` + chalk.blue(transferTx.hash))
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});