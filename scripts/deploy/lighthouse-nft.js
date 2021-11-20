const chalk                   = require("chalk");
const clear                   = require("clear");

const { ethers }              = require("hardhat");
let cliGas                    = require('../cli/gas');
let cliConfirm                = require('../cli/confirm');
let cliAccount                = require('../cli/account')
const { addressOf, alias } = require("../addresses");
const gas = require("../cli/gas");

async function main() {
  console.log(`Welcome to deployment of the Lighthouse NFT (gift in auction pool)`);

    // We get the contract to deploy
    const Gift          = await ethers.getContractFactory("GiftNft");
    const Auction       = await ethers.getContractFactory("LighthouseAuction");

    let deployer            = await ethers.getSigner();
    let chainID             = await deployer.getChainId();

    // To add permissions
    let auction             = await Auction.attach(addressOf(chainID, alias.AUCTION));

    if (chainID == 1285) {
      throw `Chain 1285 Not supported yet`;
    }

    let gasPrice        = await cliGas.inputGasPrice();

    // deploy gift interface
    // address _crowns, address tier, address submission, address prefund, address project, uint256 _chainID
    let gift           = await Gift.deploy("Lighthouse NFT", "LIGHTHOUSE", auction.address, {gasPrice: gasPrice});    /// Argument '1' means deploy in Test mode
    console.log(`Lighthouse NFT deployed to ${gift.address}\nSetting up permissions...`);
    console.log(`Add the gift nft address to addresses.js and to docs.seascape.network`)

    await auction.setGiftNft(gift.address, {from: deployer.address, gasPrice: gasPrice});
    console.log(`Lighthouse Auction knows the Lighthouse NFT`);

    console.log(`\n\nDeployment Finished!\n\n`);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });