const { ethers } = require("hardhat");

async function main() {
    // We get the contract to deploy
    const Tier        = await ethers.getContractFactory("LighthouseTier");
    let tier;

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    console.log(deployer.address);

    // Constructor arguments
    let fees;

    if (chainID == 1287) {
    } else if (chainID == 1285) {
        tier = await Tier.attach('0x59d1AF5D6CDC26c2F98c78fED5E55f11157Db8cF')

        fees            = [                     // Tier claiming fees
            ethers.utils.parseEther("1", 18).toString(),     // Tier 0
            ethers.utils.parseEther("5", 18).toString(),       // Tier 1
            ethers.utils.parseEther("10", 18).toString(),       // Tier 2
            ethers.utils.parseEther("20", 18).toString(),      // Tier 3
        ];

        let setFeesTx = await tier.setFees(fees);
        await setFeesTx.wait();
        console.log(`Fees updated on chain ${chainID}`);
    }
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });