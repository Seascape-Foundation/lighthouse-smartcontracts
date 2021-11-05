const { ethers } = require("hardhat");

async function main() {
  console.log(`Welcome to deployment`);

    // We get the contract to deploy
    const Tier          = await ethers.getContractFactory("LighthouseTier");
    const Project       = await ethers.getContractFactory("LighthouseProject");
    const Auction       = await ethers.getContractFactory("LighthouseAuction");

    console.log(`Contracts were initiated`);

    let deployer            = await ethers.getSigner();
    let chainID             = await deployer.getChainId();

    // todo Change it on the Main network
    let verifier            = null;

    // To add permissions
    let project             = null;
    let tier                = null;

    // Constructor arguments
    let crowns;
    let tierAddress         = null;
    let registrationAddress = null;
    let projectAddress      = null;
    let prefundAddress      = null;

    console.log(`All variables were initiated`);

    if (chainID == 1287) {
      console.log(`Moonbeam Alpha`);

      verifier            = deployer.address;
      tierAddress         = "0x8dbD38BbA02A3Cb72c8E9b42b4bcAD3e0889a6da";
      registrationAddress = "0xbe7Ed48539099AF26FB63db2E7FbE7DF1a8c3bfa";
      projectAddress      = "0xc98c9f17673A7cf1278040a4A02e469Dd96d8D5f";
      crowns              = "0xFde9cad69E98b3Cc8C998a8F2094293cb0bD6911";
      prefundAddress      = "0xbC7b18824c88710638cd0cd157effa3FE6117cF5";

      tier                = Tier.attach(tierAddress);
      project             = Project.attach(projectAddress);
    } else if (chainID == 1285) {
      crowns              = "0x6fc9651f45B262AE6338a701D563Ab118B1eC0Ce";
    }

    // deploy prefund interface
    // address _crowns, address tier, address submission, address prefund, address project, uint256 _chainID
    let auction           = await Auction.deploy(crowns, tierAddress, registrationAddress, prefundAddress, projectAddress, chainID);    /// Argument '1' means deploy in Test mode
    console.log(`Lighthouse Auction deployed to ${auction.address}.\nSetting up permissions...`);

    await project.addEditor(auction.address, {from: deployer.address});
    console.log(`Lighthouse Prefund got permission to update Lighthouse Project data.`);

    console.log(`\n\nDeployment Finished!\n\n`);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });