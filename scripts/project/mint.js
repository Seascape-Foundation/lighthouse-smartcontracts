#!/usr/bin/env node

/**
 * This script enables the minting of Lighthouse NFTs
 */

const chalk                   = require("chalk");
const clear                   = require("clear");

const { ethers }              = require("hardhat");
let { addressOf, alias }      = require('../addresses');
let cliGas                    = require('../cli/gas');
let cliConfirm                = require('../cli/confirm');
let cliProjectId              = require('../cli/project-id');
let projectUtil               = require('./util');

async function main() {
  clear();

  // We get the contract to deploy
  const Project       = await ethers.getContractFactory("LighthouseProject");
  const Nft           = await ethers.getContractFactory("LighthouseNft");

  let deployer        = await ethers.getSigner();
  let chainID         = await deployer.getChainId();

  console.log(`Signing by ${deployer.address}`);

  let projectAddress  = addressOf(chainID, alias.PROJECT_WRAPPER);
  let nftAddress      = addressOf(chainID, alias.INVEST_NFT);
  let mintAddress     = addressOf(chainID, alias.MINT);

  let project         = await Project.attach(projectAddress);
  let nft             = await Nft.attach(nftAddress)

  // Parameters of the transactions
  let gasPrice = await cliGas.inputGasPrice();
  let latestProjectId = await projectUtil.lastId(project);
  let projectID = await cliProjectId.inputProjectId(latestProjectId);

  // Check whether the minter can mint Investment nft
  let nftProjectId    = await nft.projectId();
  if (nftProjectId.toString() !== projectID.toString()) {
    console.error(chalk.red(`Investment NFT ${nft} is for project id ${nftProjectId}.\nYou are trying to enable minting for project id ${projectID}`))
    process.exit(1);
  }

  let minter          = await nft.minters(mintAddress);
  if (!minter) {
    console.log(chalk.blue(`\nLighthouseMint has no permission to mint Investment NFT. Giving permission.`))

    let nftContractOwner = await nft.owner();
    if (nftContractOwner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log(chalk.red(`Investment NFT ${nftAddress} owner ${nftContractOwner} doesn't match this script caller ${deployer.address}`))
      process.exit(1);
    }

    let permissionTitle = `Check the parameters of giving permisson!`;
    let permissionParams = {
      gasPrice: `${cliGas.weiToGwei(gasPrice)} gwei`,
      nftAddress: nftAddress,
      permissionReceiver: mintAddress
    }

    await cliConfirm.inputConfirm(permissionTitle, permissionParams);

    try {
      let permissionTx = await nft.setMinter(mintAddress, {from: deployer.address, gasPrice: gasPrice});
      console.log(`Permission to mint was ` + chalk.green(`successfull`) + `. Txid: ` + chalk.blue(permissionTx.hash));
    } catch (error) {
      console.log(`Permission to mint was ` + chalk.red(`failed`) + `. Txid: ` + chalk.blueBright(permissionTx.hash));
      process.exit(1);
    }
  }

  let mintInitialized = await project.mintInitialized(projectID);
  if (!mintInitialized) {
    console.log(chalk.blue(`\nEnabling minting`))

    let mintTitle = `Check the parameters!`;
    let mintParams = {
      gasPrice: `${cliGas.weiToGwei(gasPrice)} gwei`,
      projectID: projectID
    }

    await cliConfirm.inputConfirm(mintTitle, mintParams);

    let mintTx = await project.initMinting(projectID, {gasPrice: gasPrice});
    console.log(`Mint Enablng was ` + chalk.green(`successfull`) + `. Txid: ` + chalk.blue(mintTx.hash));
  }

  console.log(chalk.green(`\n\nMinting is enabled now. Investors can claim their Investment NFTs now!\n\n`))
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});