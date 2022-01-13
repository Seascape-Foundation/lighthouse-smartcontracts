const { ethers } = require("hardhat");
const clear               = require("clear");
const chalk               = require("chalk");

let cliOwner              = require('./cli/owner')
let cliConfirm            = require('./cli/confirm')
let cliGas                = require('./cli/gas');
const gas = require("./cli/gas");

async function main() {
  clear();
  
    // We get the contract to deploy
    const Project        = await ethers.getContractFactory("LighthouseProject");

    const accounts = await hre.ethers.getSigners();
    console.log(`Transfer from ${accounts[0].address} to ${accounts[1].address}`)

    // let address       = await cliOwner.inputAddress();
    let address = "0x27d72484f1910f5d0226afa4e03742c9cd2b297a";
    let newOwner = "0x80Fb89Ac96600a53b402324B24017F458dF1c6Ed";
    // 200000000000 wei

    let project = await Project.attach(address);

    let owner = await project.owner();

    console.log(`The smartcontract ${address} owner is ${owner}`);

    let changeTitle = 'Do you want to change the ower of the contract? y/n';

    await cliConfirm.inputConfirm(changeTitle, {});

    if (owner.toLowerCase() != accounts[1].address.toLocaleLowerCase()) {
      console.error(chalk.red(`The current user ${accounts[1].address} and the owner of contract ${owner} doesnt match!`));
      process.exit(1);
    }

    // let newOwner = await cliOwner.inputNewOwner();
    let gasPrice = await cliGas.inputGasPrice();

    let newOwnerTitle = `Are you sure you?`
    let newOwnerParams = {
      oldOwner: owner,
      newOwner: newOwner,
      gasPrice: `${cliGas.weiToGwei(gasPrice)} gwei`
    };
    await cliConfirm.inputConfirm(newOwnerTitle, newOwnerParams);

    // let sendTx = await accounts[0].sendTransaction({
    //   to:  accounts[1].address,
    //   value: ethers.utils.parseEther("0.05"),
    //   gasPrice: gasPrice
    // });
    // await sendTx.wait();
    // console.log(`Send the tx.`);

  let transferTx = await project.connect(accounts[1]).transferOwnership(newOwner, {gasPrice: gasPrice});
  console.log(`Changing owner was successful! Txid: ` + chalk.blue(transferTx.hash))
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});