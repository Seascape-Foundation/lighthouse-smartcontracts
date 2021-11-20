const { ethers } = require("hardhat");

async function main() {
    // We get the contract to deploy
    const Project        = await ethers.getContractFactory("LighthouseProject");
    let project;

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    console.log(deployer.address);

    if (chainID == 1287) {
      project = await Project.attach('0xc98c9f17673A7cf1278040a4A02e469Dd96d8D5f')
    } else if (chainID == 1285) {
      project = await Project.attach('0x0395560D3b148b7b69255B87635AD01B2f761806')
    }

    let editor = '0x8caABAe09aaF3980A2954dB9d4F37c0FFe36E493';
    let isEditor = await project.editors(editor);
    console.log(`Editor ${editor} is able to change project info: ${isEditor}`);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });