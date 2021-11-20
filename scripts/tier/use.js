const { ethers } = require("hardhat");

async function main() {
    // We get the contract to deploy
    const Tier        = await ethers.getContractFactory("LighthouseTierWrapper");
    let tier;

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    console.log(deployer.address);

    // Constructor arguments
    let fees;

    if (chainID == 1287) {
      tier = await Tier.attach('0xeFfdB75Ff90349151E100D82Dfd38fa1d7f050D2')
    } else if (chainID == 1285) {
    }

    let tierLevel = await tier.getTierLevel(deployer.address);

    await tier.use(deployer.address, tierLevel);
    console.log(`Tier was used`);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });