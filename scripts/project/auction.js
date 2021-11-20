#!/usr/bin/env node

const chalk                   = require("chalk");
const clear                   = require("clear");

const { ethers }              = require("hardhat");
let { addressOf, alias }      = require('../addresses');
let cliGas                    = require('../cli/gas');
let cliStartEnd               = require('../cli/start-end');
let cliConfirm                = require('../cli/confirm');
let cliProjectId              = require('../cli/project-id');
let cliAuction                = require('../cli/auction');
let cliAllocationCompensation = require('../cli/allocation-compensation');
let cliInvestNft              = require('../cli/investment-nft');
let projectUtil               = require('./util');

async function main() {
  clear();

  // We get the contract to deploy
  const Project       = await ethers.getContractFactory("LighthouseProject");
  const Auction          = await ethers.getContractFactory("LighthouseAuction");
  const Gift          = await ethers.getContractFactory("GiftNft");

  let deployer      = await ethers.getSigner();
  let chainID       = await deployer.getChainId();

  console.log(`Signing by ${deployer.address}`);

  let projectAddress = addressOf(chainID, alias.PROJECT_WRAPPER);
  let auctionAddress    = addressOf(chainID, alias.AUCTION);
  let giftAddress = addressOf(chainID, alias.LIGHTHOUSE_NFT);

  let project = await Project.attach(projectAddress);
  let auction = await Auction.attach(auctionAddress);
  let gift = await Gift.attach(giftAddress);

  // Parameters of the transactions
  let gasPrice = await cliGas.inputGasPrice();
  let latestProjectId = await projectUtil.lastId(project);
  let projectID = await cliProjectId.inputProjectId(latestProjectId);

  let mintGift = await gift.minters(auctionAddress);
  if (!mintGift) {
    console.log(`Auction contract has no permission to mint a gift nft`);

    await gift.setMinter(auctionAddress, {gasPrice: gasPrice});
    console.log(`Now, auction contract has a permission to mint nft`);
  }

  // one time only, if smartcontract throws error NO_NFT_ADDRESS during auction bidding.
  // console.log(`Setting up the Gift NFT`);
  // await auction.setGiftNft(giftAddress, {gasPrice: gasPrice});
  // console.log(`Gift NFT was set in auction pool`);

  let decimals = 18;    // The PCC tokens usually are with 18 zeroes.

  let auctionEditor = await project.editors(auctionAddress);
  if (!auctionEditor) {
    console.log(`\nAuction contract can't edit the Project Wrapper`);
    
    await project.addEditor(auctionAddress, {from: deployer.address, gasPrice: gasPrice});
    console.log(`Auction contract can edit the Project parameters`);
  }
  
  console.log(`\nWe are setting auction phase...`);


  let initialized = await project.auctionInitialized(projectID);
  if (!initialized) {
    let {start, end} = await cliStartEnd.inputStartEnd();

    let auctionTitle = `Confirm the parameters of initiation of auction!`;
    let auctionParams = {
      gasPrice: `${cliGas.weiToGwei(gasPrice)} gwei.`,
      projectID: projectID,
      startTime: `${new Date(start * 1000)}`,
      endTime: `${new Date(end * 1000)}`
    }

    await cliConfirm.inputConfirm(auctionTitle, auctionParams);

    let auctionTx = await project.initAuction(projectID, start, end, {from: deployer.address, gasPrice});
    await auctionTx.wait();

    console.log(`Project auction initiation was ` + chalk.green(`successfull`) + `. Txid: ` + chalk.blue(auctionTx.hash));
  }

  console.log(`\nNow we are getting the parameters of Prefund and Compensation. Then setting it`);


  let allocationCompensationInitialized = await project.allocationCompensationInitialized(projectID);
  if (!allocationCompensationInitialized) {
    let prefund = await cliAllocationCompensation.inputPrefund(decimals);
    let auction = await cliAllocationCompensation.inputAuction(decimals);
    let currentInvestNft = addressOf(chainID, alias.INVEST_NFT);
    let investNft = await cliInvestNft.inputAddress(currentInvestNft);

    let allocationCompensationTitle = `Confirm the parameters of the Allocation and Compensation amounts!`;
    let allocationCompensationParams = {
      prefundAllocation: `${ethers.utils.formatUnits(prefund[0].toString(), decimals)} PCC`,
      prefundCompensation: `${ethers.utils.formatUnits(prefund[1].toString(), decimals)} CWS`,
  
      auctionAllocation: `${ethers.utils.formatUnits(auction[0].toString(), decimals)} PCC`,
      auctionCompensation: `${ethers.utils.formatUnits(auction[1].toString(), decimals)} CWS`,
  
      investNft: investNft
    }

    await cliConfirm.inputConfirm(allocationCompensationTitle, allocationCompensationParams);

    let allocationCompensationTx = await project.initAllocationCompensation(projectID, 
      prefund[0], prefund[1],
      auction[0], auction[1],
      investNft,
      {from: deployer.address, gasPrice: gasPrice}
    );
    await allocationCompensationTx.wait();

    console.log(`Project's Pools and Collaterals setting up was ` + chalk.green(`successfull`) + `. Txid: ` + chalk.blue(allocationCompensationTx.hash));
  }

  console.log(`\nNow we are transferring prefund pool to the auction pool`);

  let transferredPrefund = await project.transferredPrefund(projectID);
  if (!transferredPrefund) {
    let transferPrefundTitle = `Confirm the parameters of the Prefund Transfer!`;
    let transferPrefundParams = {
      projectID: projectID
    }

    await cliConfirm.inputConfirm(transferPrefundTitle, transferPrefundParams);

    let transferTx = await project.transferPrefund(projectID, {gasPrice: gasPrice});
    console.log(`Prefund phase pool transferred to auction pool ` + chalk.green(`successfull`) + `. Txid: ` + chalk.blue(transferTx.hash));
  }

  console.log(`\nNow we are getting the parameters of Auction data. Then setting it`);


  let setData = await auction.auctionData(projectID);
  if (!setData.set) {
    let {min, giftAmount} = await cliAuction.inputData();

    let dataTitle = `Please confirm Auction Data types`;
    let dataParams = {
      projectID: projectID,
      gasPrice: `${cliGas.weiToGwei(gasPrice)} gwei.`,
      min: min / 1e18,
      giftAmount: giftAmount
    }
  
    await cliConfirm.inputConfirm(dataTitle, dataParams);
  
    let dataTx = await auction.setAuctionData(projectID, min, giftAmount, {gasPrice: gasPrice});
    console.log(`Auction data setting was ` + chalk.green(`successfull`) + `. Txid: ` + chalk.blue(dataTx.hash));
  }
  
  console.log(chalk.green(`\n\nAuction phase set setted up. You can play with it now\n\n`))
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});