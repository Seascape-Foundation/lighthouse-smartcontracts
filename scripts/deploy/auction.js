const { ethers }              = require("hardhat");
let cliGas                    = require('../cli/gas');
let cliConfirm                = require('../cli/confirm');
const { addressOf, alias } = require("../addresses");

async function main() {
  console.log(`Welcome to deployment`);

  // We get the contract to deploy
  const Project       = await ethers.getContractFactory("LighthouseProjectWrapper");
  const Auction       = await ethers.getContractFactory("LighthouseAuction");
  const Gift          = await ethers.getContractFactory("GiftNft");

  let deployer            = await ethers.getSigner();
  let chainID             = await deployer.getChainId();

  // To add permissions
  let projectAddress      = addressOf(chainID, alias.PROJECT_WRAPPER);
  let project             = await Project.attach(projectAddress);
  // let gift                = await Gift.attach(addressOf(chainID, alias.LIGHTHOUSE_NFT));

  // Constructor arguments
  let crowns              = addressOf(chainID, alias.CROWNS)
  let tierAddress         = addressOf(chainID, alias.TIER_WRAPPER);
  let registrationAddress = addressOf(chainID, alias.REGISTRATION);
  let prefundAddress      = addressOf(chainID, alias.PREFUND);

  let gasPrice            = await cliGas.inputGasPrice();

  let title = `Please confirm the parameters`;
  let params = {
    crowns: crowns,
    tierAddress: tierAddress,
    registrationAddress: registrationAddress,
    projectAddress: projectAddress,
    prefundAddress: prefundAddress,

    gasPrice: `${cliGas.weiToGwei(gasPrice)}`
  }

  await cliConfirm.inputConfirm(title, params);

  // deploy prefund interface
  // address _crowns, address tier, address submission, address prefund, address project, uint256 _chainID
  let auction           = await Auction.deploy(crowns, tierAddress, registrationAddress, prefundAddress, projectAddress, chainID, {gasPrice: gasPrice});    /// Argument '1' means deploy in Test mode
  console.log(`Lighthouse Auction deployed to ${auction.address}\nSetting up permissions...`);
  // let auction           = await Auction.attach("0xE8Ee22a82e3BC3e9dF8E49367f58144c9B0eFF5e");

  await project.addEditor(auction.address, {from: deployer.address, gasPrice: gasPrice});
  console.log(`Lighthouse Auction got permission to update Lighthouse Project data.`);

  // await auction.setGiftNft(gift.address, {gasPrice: gasPrice});
  // console.log(`Auction now linked to the Lighthose NFT`);

  // await gift.setMinter(auction.address, {gasPrice: gasPrice});
  // console.log(`Auction pool got permission to mint Lighthouse NFTs`);

  console.log(`\n\nDeployment Finished!\n\n`);
}
  
main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});