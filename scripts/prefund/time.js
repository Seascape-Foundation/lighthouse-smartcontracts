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

    let projectID = 32;
    let time = await project.prefundTimeInfo(projectID);
    console.log(time[0].toString(), time[1].toString());
    console.log(`Within phase? ${time[1].toString() >= (new Date().getTime()/1000)}`)
  }
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});