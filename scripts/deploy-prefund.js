const { ethers } = require("hardhat");

async function main() {
  console.log(`Welcome to deployment`);

    // We get the contract to deploy
    const Tier          = await ethers.getContractFactory("LighthouseTier");
    const Project       = await ethers.getContractFactory("LighthouseProject");
    const Prefund       = await ethers.getContractFactory("LighthousePrefund");

    console.log(`Contracts were initiated`);

    let deployer        = await ethers.getSigner();
    let chainID         = await deployer.getChainId();

    // todo Change it on the Main network
    let verifier        = null;

    // To add permissions
    let project         = null;
    let tier            = null;

    // Constructor arguments
    let crowns;
    let tierAddress     = null;
    let registrationAddress = null;
    let projectAddress  = null;

    console.log(`All variables were initiated`);

    if (chainID == 1287) {
      console.log(`Moonbeam Alpha`);

      verifier = deployer.address;
      tierAddress = "0x8dbD38BbA02A3Cb72c8E9b42b4bcAD3e0889a6da";
      registrationAddress = "0xbe7Ed48539099AF26FB63db2E7FbE7DF1a8c3bfa";
      projectAddress = "0xc98c9f17673A7cf1278040a4A02e469Dd96d8D5f";

      tier = Tier.attach(tierAddress);
      project = Project.attach(projectAddress);
    } else if (chainID == 1285) {
      crowns          = "0x6fc9651f45B262AE6338a701D563Ab118B1eC0Ce";
    }

    // deploy prefund interface
    let prefund              = await Prefund.deploy(tierAddress, registrationAddress, projectAddress, verifier, chainID);    /// Argument '1' means deploy in Test mode
    console.log(`Lighthouse Prefund deployed to ${prefund.address}.\nSetting up permissions...`);
    
    // Give access to the prefund to reset user's tier.
    await tier.addEditor(prefund.address, {from: deployer.address});
    console.log(`Lighthouse Prefund got permission to update Lighthouse Tier.`);

    await project.addEditor(prefund.address, {from: deployer.address});
    console.log(`Lighthouse Prefund got permission to update Lighthouse Project data.`);

    console.log(`\n\nDeployment Finished!\n\n`);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });