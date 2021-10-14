const { ethers } = require("hardhat");

async function main() {
  console.log(`Welcome to deployment`);

    // We get the contract to deploy
    let totalUsdSupply  = ethers.utils.parseEther("10000000");
    let USD             = await ethers.getContractFactory("USD");
    let usd             = null;
    const Project       = await ethers.getContractFactory("LighthouseProject");
    const Registration  = await ethers.getContractFactory("LighthouseRegistration");

    console.log(`Contracts were initiated`);

    let deployer        = await ethers.getSigner();
    let chainID         = await deployer.getChainId();

    // todo Change it on the Main network
    let verifier        = null;

    // Constructor arguments
    let crowns;
    let tierAddress     = null;

    console.log(`All variables were initiated`);

    if (chainID == 1287) {
      console.log(`Moonbeam Alpha`);

      // deploy usd
      usd              = await USD.deploy(totalUsdSupply);
      console.log(`For the Moonbeam we deployed testnet stable coin: ${usd.address}`);

      verifier = deployer.address;
      tierAddress = "0x8dbD38BbA02A3Cb72c8E9b42b4bcAD3e0889a6da";
    } else if (chainID == 1285) {
      crowns          = "0x6fc9651f45B262AE6338a701D563Ab118B1eC0Ce";
    }

    // deploy project
    let project              = await Project.deploy(verifier); 
    console.log("Lighthouse Project deployed to ", project.address);

    // deploy registration interface
    let registration              = await Registration.deploy(tierAddress, project.address);  
    console.log(`Lighthouse Registration deployed to ${registration.address}`);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });