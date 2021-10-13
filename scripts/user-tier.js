const { ethers } = require("hardhat");

async function main() {
    // We get the contract to deploy
    const Tier        = await ethers.getContractFactory("LighthouseTier");
    let tier;

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    console.log(deployer.address);

    // Constructor arguments
    let fees;

    if (chainID == 1287) {
    } else if (chainID == 1285) {
        tier = await Tier.attach('0x59d1AF5D6CDC26c2F98c78fED5E55f11157Db8cF')
        let user = "0xf0009aD82171D95b11aA74F5F0310516266bae06";

        let userTier = await tier.tiers(user);
        console.log(userTier.nonce.toString())
    }
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });