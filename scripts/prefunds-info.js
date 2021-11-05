const { ethers } = require("hardhat");

async function main() {
    // We get the contract to deploy
    const Project        = await ethers.getContractFactory("LighthouseProject");
    let project;

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    if (chainID == 1287) {
      project = await Project.attach("0xc98c9f17673A7cf1278040a4A02e469Dd96d8D5f");

      let prefund9 = await project.prefunds(11);
      console.log(`Project from ${new Date(prefund9.startTime.toString() * 1000)} to ${new Date(prefund9.endTime.toString() * 1000)}`);
      console.log(`Project from ${prefund9.startTime.toString()} to ${prefund9.endTime.toString()}`);
    } else if (chainID == 1285) {
    }
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});