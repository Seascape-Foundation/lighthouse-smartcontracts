const { ethers } = require("hardhat");

async function main() {
    // We get the contract to deploy
    const Tier        = await ethers.getContractFactory("LighthouseTierWrapper");
    let tier;

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    console.log(deployer.address);

    if (chainID == 1287) {
      tier = await Tier.attach("0xc815b90f2987747Df4617a592CBa8939eBE4B7F2");
    } else if (chainID == 1285) {
      tier = await Tier.attach("0xc815b90f2987747Df4617a592CBa8939eBE4B7F2");
    }  else if (chainID == 97) {
      tier = await Tier.attach("0xAa5158938a54363F5701f51C9615c94bA300FB11");
    }

    let user = ''
    let level = await tier.getTierLevel(user)
    console.log(`User ${user} tier level is ${level}`);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });