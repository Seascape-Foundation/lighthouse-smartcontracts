const chalk                   = require("chalk");
const clear                   = require("clear");

const { ethers }              = require("hardhat");
let { addressOf, alias }      = require('../addresses');
let cliGas                    = require('../cli/gas');
let cliConfirm                = require('../cli/confirm');
const gas = require("../cli/gas");

async function main() {
  clear();

  console.log(`Welcome to the deployment of the Minting Contract`);

  // We get the contract to deploy
  const Mint          = await ethers.getContractFactory("LighthouseMint");

  console.log(`Contracts were initiated`);

  let deployer        = await ethers.getSigner();
  let chainID         = await deployer.getChainId();

  // Constructor arguments
  let tierAddress     = addressOf(chainID, alias.TIER_WRAPPER);
  let prefundAddress = addressOf(chainID, alias.PREFUND);
  let projectAddress  = addressOf(chainID, alias.PROJECT_WRAPPER);
  let auctionAddress  = addressOf(chainID, alias.AUCTION);
  let crownsAddress = addressOf(chainID, alias.CROWNS);

  let gasPrice        = await cliGas.inputGasPrice();

  let deployTitle = `Please confirm Mint contract parameters`;
  let deployParams = {
    gasPrice: `${cliGas.weiToGwei(gasPrice)}`,
    auctionAddress: auctionAddress,
    prefundAddress: prefundAddress,
    tierAddress: tierAddress,
    projectAddress: projectAddress,
    crownsAddress: crownsAddress,

    chainID: chainID
  }

  // await cliConfirm.inputConfirm(deployTitle, deployParams);

  // let mint         = await Mint.deploy(auctionAddress, prefundAddress, tierAddress, projectAddress, crownsAddress, chainID, {gasPrice: gasPrice});    /// Argument '1' means deploy in Test mode
  // console.log("Lighthouse Mint deployed to ", chalk.green(mint.address), ' Txid ', chalk.blue(mint.deployTransaction.hash));

  let nftAddress = addressOf(chainID, alias.INVEST_NFT);
  let permissionTitle = `press CTRL+Z if you don't want to add permission to ${nftAddress} to be minted`;
  await cliConfirm.inputConfirm(permissionTitle, {});

  const InvestNft     = await ethers.getContractFactory("LighthouseNft");

  let nft = await InvestNft.attach(nftAddress);
  let permissionTx = await nft.setMinter(mint.address, {gasPrice: gasPrice});
  console.log("Minting contract got a permission to mint Investment NFT! Txid: " + permissionTx.hash);
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });