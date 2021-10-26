const { ethers } = require("hardhat");

async function main() {
    // We get the contract to deploy
    const Project        = await ethers.getContractFactory("LighthouseProject");
    let project;

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    if (chainID == 1287) {
      project = await Project.attach("0xc98c9f17673A7cf1278040a4A02e469Dd96d8D5f");

      let register1 = await project.registrations(1);
      console.log(`Project 1 from ${new Date(register1.startTime.toString() * 1000)} to ${new Date(register1.endTime.toString() * 1000)}`);
      let register2 = await project.registrations(2);
      console.log(`Project 2 from ${new Date(register2.startTime.toString() * 1000)} to ${new Date(register2.endTime.toString() * 1000)}`);
      let register3 = await project.registrations(3);
      console.log(`Project 3 from ${new Date(register3.startTime.toString() * 1000)} to ${new Date(register3.endTime.toString() * 1000)}`);
      let register4 = await project.registrations(4);
      console.log(`Project 4 from ${new Date(register4.startTime.toString() * 1000)} to ${new Date(register4.endTime.toString() * 1000)}`);
    } else if (chainID == 1285) {
    }
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});