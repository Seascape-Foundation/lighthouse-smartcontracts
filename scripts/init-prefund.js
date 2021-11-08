const { ethers } = require("hardhat");

async function main() {
    // We get the contract to deploy
    const Project        = await ethers.getContractFactory("LighthouseProject");
    let project;

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    console.log(`Signing by ${deployer.address}`);

    let projectID     = 20;
    let usdAddress    = "0x1bc33357E79c1E69A46b69c3f6F14691164375Dd";

    if (chainID == 1287) {
      project = await Project.attach("0xc98c9f17673A7cf1278040a4A02e469Dd96d8D5f");

      // uint256 startTime, uint256 endTime
      let prefundStartTime = Math.floor(new Date().getTime() / 1000) + 100;
      let prefundEndTime   = prefundStartTime + (3600 * 2);   // 2 hours

      let investAmounts     = [
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("250"),
        ethers.utils.parseEther("1000")
      ];
      let pools             = [
        ethers.utils.parseEther("10000"),
        ethers.utils.parseEther("15000"),
        ethers.utils.parseEther("25000")
      ];

      await project.initPrefund(projectID, prefundStartTime, prefundEndTime, investAmounts, pools, usdAddress, {from: deployer.address});

      console.log(`Project Prefund for Project ${projectID} started from ${new Date(prefundStartTime * 1000)} to ${new Date(prefundEndTime * 1000)}`);
    } else if (chainID == 1285) {
    }
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});