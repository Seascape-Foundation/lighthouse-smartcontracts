const { ethers } = require("hardhat");

async function main() {
    // We get the contract to deploy
    const Tier        = await ethers.getContractFactory("LighthouseTierWrapper");
    let tier;

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    console.log(deployer.address);

    if (chainID == 1287) {
      tier = await Tier.attach("0x1BB55D99aAF303A1586114662ef74638Ed9dB2Ee");
    } else if (chainID == 1285) {
      tier = await Tier.attach("0xbc719dc309beb82489e9a949c415e0eaed87d247");
    }

    let user = '0xF218466013F3957d307C72154Dbe466dA2Aaec17'
    let level = await tier.getTierLevel(user)
    console.log(`User ${user} tier level is ${level}`);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });