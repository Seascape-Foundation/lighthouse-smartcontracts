const { ethers } = require("hardhat");

async function main() {
    // We get the contract to deploy
    const Project        = await ethers.getContractFactory("LighthouseProject");
    let project;

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    if (chainID == 1287) {
      project = await Project.attach("0xc98c9f17673A7cf1278040a4A02e469Dd96d8D5f");

      let projectID = 20;

      let register1 = await project.registrations(projectID);
      console.log(`Project ${projectID} from ${new Date(register1.startTime.toString() * 1000)} to ${new Date(register1.endTime.toString() * 1000)}`);

      let info = await project.registrationInfo(projectID);
      console.log(`Registration: ${new Date(info[0].toString() * 1000)} and ${new Date(info[1].toString() * 1000)}`);
      console.log(`${info[0].toString()} - ${info[1].toString()}`);
    } else if (chainID == 1285) {
    } else if (chainID == 97) {
      project = await Project.attach("0x790f532e7CB515066C60BE13074949aE4C90ea23");

      let projectID = 8;

      let register1 = await project.registrations(projectID);
      console.log(`Project ${projectID} from ${new Date(register1.startTime.toString() * 1000)} to ${new Date(register1.endTime.toString() * 1000)}`);

      let info = await project.registrationInfo(projectID);
      console.log(`Registration: ${new Date(info[0].toString() * 1000)} and ${new Date(info[1].toString() * 1000)}`);
      console.log(`${info[0].toString()} - ${info[1].toString()}`);

    }
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});