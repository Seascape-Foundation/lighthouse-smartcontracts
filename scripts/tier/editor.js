const { ethers } = require("hardhat");
const addresses = require("../addresses");
const { addressOf, alias } = require("../addresses");

async function main() {
    // We get the contract to deploy
    const Tier        = await ethers.getContractFactory("LighthouseTierWrapper");
    let tier;

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    console.log(deployer.address);

    // Constructor arguments
    let fees;

    tier = await Tier.attach(addressOf(chainID, alias.TIER_WRAPPER))

    let editor = addressOf(chainID, alias.PREFUND);
    let isEditor = await tier.editors(editor);
    console.log(`Editor ${editor} is able to change tier info: ${isEditor}`);

    // await tier.addEditor(editor);
    // console.log(`${editor} was set as tier user`);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });