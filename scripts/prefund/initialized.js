const { ethers } = require("hardhat");
const { addressOf, alias } = require("../addresses");

async function main() {
    // We get the contract to deploy
    const Project        = await ethers.getContractFactory("LighthouseProject");
    let project;

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    if (chainID == 1287) {
      project = await Project.attach("0xc98c9f17673A7cf1278040a4A02e469Dd96d8D5f");
    } else if (chainID == 1285) {
    } else if (chainID == 97) {
      project = await Project.attach(addressOf(chainID, alias.PROJECT_WRAPPER));
    }

    let projectID = 31;
    let initialized = await project.prefundInitialized(projectID);
    console.log(`Is project ${projectID} initialized? ${initialized}`);
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});