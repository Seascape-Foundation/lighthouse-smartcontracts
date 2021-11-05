const { ethers } = require("hardhat");

async function main() {
    // We get the contract to deploy
    const Project        = await ethers.getContractFactory("LighthouseProject");
    let project;

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    console.log(`Signing by ${deployer.address}`);

    let projectID     = 6;

    if (chainID == 1287) {
      project = await Project.attach("0xc98c9f17673A7cf1278040a4A02e469Dd96d8D5f");

      // uint256 startTime, uint256 endTime
      // let auctionStartTime = Math.floor(new Date().getTime() / 1000) + 300;
      let auctionStartTime = 1635923901 + 10;
      let auctionEndTime   = auctionStartTime + (3600 * 24 * 1);   // 1 days

      await project.initAuction(projectID, auctionStartTime, auctionEndTime, {from: deployer.address});

      console.log(`Project Auction for Project ${projectID} started from ${new Date(auctionStartTime * 1000)} to ${new Date(auctionEndTime)} (unix timestamp ${auctionEndTime})`);
    } else if (chainID == 1285) {
    }
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});