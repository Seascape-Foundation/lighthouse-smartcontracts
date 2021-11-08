const { ethers } = require("hardhat");

async function main() {
    // We get the contract to deploy
    const Tier        = await ethers.getContractFactory("LighthouseTierWrapper");

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    console.log(`Sign with ${deployer.address}`);

    // Constructor arguments
    let crowns;
    let claimVerifier;
    let fees;
    let tierAddress;

    if (chainID == 1287) {
      crowns          = "0xFde9cad69E98b3Cc8C998a8F2094293cb0bD6911";
      claimVerifier   = process.env.MOONBEAM_DEPLOYER_ADDRESS;
      tierAddress     = "0x8dbD38BbA02A3Cb72c8E9b42b4bcAD3e0889a6da";
      fees            = [                       // Tier claiming fees
        ethers.utils.parseEther("0.1", 18),     // Tier 0
        ethers.utils.parseEther("0.25", 18),    // Tier 1
        ethers.utils.parseEther("0.5", 18),     // Tier 2
        ethers.utils.parseEther("1", 18),       // Tier 3
      ];
    } else if (chainID == 1285) {
      crowns          = "0x6fc9651f45B262AE6338a701D563Ab118B1eC0Ce";
      claimVerifier   = deployer.address;
      tierAddress     = "0x59d1AF5D6CDC26c2F98c78fED5E55f11157Db8cF";
      fees            = [                     // Tier claiming fees
        ethers.utils.parseEther("0.1", 18),     // Tier 0
        ethers.utils.parseEther("0.25", 18),       // Tier 1
        ethers.utils.parseEther("0.5", 18),       // Tier 2
        ethers.utils.parseEther("1", 18),      // Tier 3
      ];
    }

    const tier       = await Tier.deploy(crowns, tierAddress, claimVerifier, fees, chainID);
    // console.log(tier);

    console.log(`Lighthouse Tier Wrapper deployed to: ${tier.hash}`, tier.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });