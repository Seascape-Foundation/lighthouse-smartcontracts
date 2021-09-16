async function main() {
    // We get the contract to deploy
    const Tier       = await ethers.getContractFactory("LighthouseTier");

    // Constructor arguments
    let crowns          = "0xFde9cad69E98b3Cc8C998a8F2094293cb0bD6911";
    let claimVerifier   = process.env.MOONBEAM_DEPLOYER_ADDRESS;
    let fees            = [                     // Tier claiming fees
        ethers.utils.parseEther("1.0", 18),     // Tier 0
        ethers.utils.parseEther("3", 18),       // Tier 1
        ethers.utils.parseEther("5", 18),       // Tier 2
        ethers.utils.parseEther("10", 18),      // Tier 3
    ];

    const tier       = await Tier.deploy(crowns, claimVerifier, fees);
  
    console.log("Lighthouse Tier deployed to:", tier.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });