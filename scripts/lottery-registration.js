const { ethers } = require("hardhat");

async function main() {
    // We get the contract to deploy
    const Project        = await ethers.getContractFactory("LighthouseProject");
    let project;

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    console.log(`Signing by ${deployer.address}`);

    if (chainID == 1287) {
      project = await Project.attach("0xc98c9f17673A7cf1278040a4A02e469Dd96d8D5f");

      // uint256 startTime, uint256 endTime
      let registrationStartTime = Math.floor(new Date().getTime() / 1000) + 300;
      let registrationEndTime   = registrationStartTime + (3600 * 1);   // 2 hours
      let tx = await project.initRegistration(registrationStartTime, registrationEndTime, {from: deployer.address, gasPrice: 3000000000});
      // await tx.wait();

      console.log(`Project registration (${tx.hash}) between\n
      ${new Date(registrationStartTime * 1000)} and ${new Date(registrationEndTime * 1000)}`);
    } else if (chainID == 1285) {
    }
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});