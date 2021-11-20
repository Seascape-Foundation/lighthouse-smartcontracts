const { ethers } = require("hardhat");

async function main() {
    // We get the contract to deploy
    const Tier        = await ethers.getContractFactory("LighthouseTier");

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    // Constructor arguments
    let crowns;
    let claimVerifier;
    let fees;

    if (chainID == 1287) {
      crowns          = "0xFde9cad69E98b3Cc8C998a8F2094293cb0bD6911";
      claimVerifier   = process.env.MOONBEAM_DEPLOYER_ADDRESS;
      fees            = [                     // Tier claiming fees
        ethers.utils.parseEther("0.1", 18),     // Tier 0
        ethers.utils.parseEther("0.25", 18),       // Tier 1
        ethers.utils.parseEther("0.5", 18),       // Tier 2
        ethers.utils.parseEther("1", 18),      // Tier 3
      ];
    } else if (chainID == 1285) {
      crowns          = "0x6fc9651f45B262AE6338a701D563Ab118B1eC0Ce";
      claimVerifier   = deployer.address;
      fees            = [                     // Tier claiming fees
        ethers.utils.parseEther("0.1", 18),     // Tier 0
        ethers.utils.parseEther("0.25", 18),       // Tier 1
        ethers.utils.parseEther("0.5", 18),       // Tier 2
        ethers.utils.parseEther("1", 18),      // Tier 3
      ];
    }

    const tier       = await Tier.deploy(crowns, claimVerifier, fees, chainID);
  
    console.log("Lighthouse Tier deployed to:", tier.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });