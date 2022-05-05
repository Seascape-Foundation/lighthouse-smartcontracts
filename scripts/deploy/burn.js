const chalk                   = require("chalk");
const clear                   = require("clear");

const { ethers }              = require("hardhat");
let { addressOf, alias }      = require('../addresses');
let cliGas                    = require('../cli/gas');
let cliConfirm                = require('../cli/confirm');
const gas = require("../cli/gas");

async function main() {
  clear();

  console.log(`Welcome to the deployment of the Burn Contract`);

  // We get the contract to deploy
  const Burn          = await ethers.getContractFactory("LighthouseBurn");

  console.log(`Contracts were initiated`);

  let deployer        = await ethers.getSigner();
  let chainID         = await deployer.getChainId();

  // Constructor arguments
  //   (address _lighthouseAuction, 
  // lighthousePrefund, 
  // lighthouseTier, 
  // address _project, 
  // address _crowns) {
  let auctionAddress  = addressOf(chainID, alias.AUCTION);
  let prefundAddress = addressOf(chainID, alias.PREFUND);
  let tierAddress     = addressOf(chainID, alias.TIER_WRAPPER);
  let projectAddress  = addressOf(chainID, alias.PROJECT_WRAPPER);
  let crownsAddress = addressOf(chainID, alias.CROWNS);

  let gasPrice        = await cliGas.inputGasPrice();

  let deployTitle = `Please confirm Burn contract parameters`;
  let deployParams = {
    gasPrice: `${cliGas.weiToGwei(gasPrice)}`,
    auctionAddress: auctionAddress,
    prefundAddress: prefundAddress,
    tierAddress: tierAddress,
    projectAddress: projectAddress,
    crownsAddress: crownsAddress
  }

  await cliConfirm.inputConfirm(deployTitle, deployParams);

  let burn         = await Burn.deploy(auctionAddress, prefundAddress, projectAddress, crownsAddress, {gasPrice: gasPrice});    /// Argument '1' means deploy in Test mode
  console.log("Lighthouse Burn deployed to ", chalk.green(burn.address), ' Txid ', chalk.blue(burn.deployTransaction.hash));

  let nftAddress = addressOf(chainID, alias.INVEST_NFT);
  let permissionTitle = `press CTRL+Z if you don't want to add permission to ${nftAddress} to be burnt`;
  await cliConfirm.inputConfirm(permissionTitle, {});

  const InvestNft     = await ethers.getContractFactory("LighthouseNft");

  let nft = await InvestNft.attach(nftAddress);
  let permissionTx = await nft.setBurner(burn.address, {gasPrice: gasPrice});
  console.log("Burning contract got a permission to burn Investment NFT! Txid: " + permissionTx.hash);
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });