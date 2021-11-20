const { ethers } = require("hardhat");

async function main() {
    // We get the contract to deploy
    const Project        = await ethers.getContractFactory("LighthouseProject");
    let project;

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    let projectID     = 4;

    if (chainID == 1287) {
      project = await Project.attach("0xc98c9f17673A7cf1278040a4A02e469Dd96d8D5f");
    } else if (chainID == 1285) {
      project = await Project.attach("0x0395560D3b148b7b69255B87635AD01B2f761806");
    }

    let prefund9 = await project.prefunds(projectID);
    console.log(`Project from ${new Date(prefund9.startTime.toString() * 1000)} to ${new Date(prefund9.endTime.toString() * 1000)}`);
    console.log(`Project from ${prefund9.startTime.toString()} to ${prefund9.endTime.toString()}`);
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});