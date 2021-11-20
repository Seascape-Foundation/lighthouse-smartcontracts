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
        tier = await Tier.attach('0xbc719dc309beb82489e9a949c415e0eaed87d247')
    }

    let editor = '0x8caABAe09aaF3980A2954dB9d4F37c0FFe36E493';
    let isEditor = await tier.editors(editor);
    console.log(`Editor ${editor} is able to change tier info: ${isEditor}`);

    // await tier.addEditor(deployer.address);
    // console.log(`${deployer.address} was set as tier user`);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });