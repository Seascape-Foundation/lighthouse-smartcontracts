const { ethers } = require("hardhat");

async function main() {
    // We get the contract to deploy
    const Project        = await ethers.getContractFactory("LighthouseProject");
    let project;

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    if (chainID == 1287) {
      project = await Project.attach("0xc98c9f17673A7cf1278040a4A02e469Dd96d8D5f");
    } else if (chainID == 1285) {
    }

    let projectID = 31;
    let tier = 3;
    let invest = await project.prefundInvestAmount(projectID, tier);
    console.log(`amount ${invest[0].toString()/1e18}, address: ${invest[1].toString()}`);
  }
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});