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
      tierAddress     = "0xeFfdB75Ff90349151E100D82Dfd38fa1d7f050D2";
      fees            = [                       // Tier claiming fees
        ethers.utils.parseEther("0.1", 18),     // Tier 0
        ethers.utils.parseEther("0.25", 18),    // Tier 1
        ethers.utils.parseEther("0.5", 18),     // Tier 2
        ethers.utils.parseEther("1", 18),       // Tier 3
      ];
    } else if (chainID == 1285) {
      crowns          = "0x6fc9651f45B262AE6338a701D563Ab118B1eC0Ce";
      claimVerifier   = "0xb7fA673753c321f14733Eff576bC0d8E644e455e";
      tierAddress     = "0x95031b2b24B350CB30D30df7B1Cd688255BE839a";
      fees            = [                     // Tier claiming fees
        ethers.utils.parseEther("1", 18),      // Tier 0
        ethers.utils.parseEther("5", 18),      // Tier 1
        ethers.utils.parseEther("10", 18),     // Tier 2
        ethers.utils.parseEther("20", 18),     // Tier 3
      ];
    } else if (chainID == 97) {
      crowns          = "0x4Ca0ACab9f6B9C084d216F40963c070Eef95033B";
      claimVerifier   = process.env.MOONBEAM_DEPLOYER_ADDRESS;
      tierAddress     = "0xd7Eb82f5AB90534dFa6922D8Ea3926F17911724E";
      fees            = [                     // Tier claiming fees
        ethers.utils.parseEther("0.1", 18),     // Tier 0
        ethers.utils.parseEther("0.25", 18),       // Tier 1
        ethers.utils.parseEther("0.5", 18),       // Tier 2
        ethers.utils.parseEther("1", 18),      // Tier 3
      ];
    } else if (chainID == 56) {
      crowns          = "0xbcf39F0EDDa668C58371E519AF37CA705f2bFcbd";
      claimVerifier   = process.env.BSC_DEPLOYER_ADDRESS;
      tierAddress     = "0x9066b28c2f3F712268D71893877d16Bb52A69c5c";
      fees            = [                     // Tier claiming fees
        ethers.utils.parseEther("0.1", 18),     // Tier 0
        ethers.utils.parseEther("0.25", 18),       // Tier 1
        ethers.utils.parseEther("0.5", 18),       // Tier 2
        ethers.utils.parseEther("1", 18),      // Tier 3
      ];
    }
    let gasPrice    = 20000000000;                                    // 20 gwei

    let tier;
    try {
      //address _crowns, address _tier, address _claimVerifier, uint256[4] memory _fees, uint256 _chainID
      tier       = await Tier.deploy(crowns, tierAddress, claimVerifier, fees, chainID);
      console.log(`Lighthouse Tier Wrapper deployed at tx: ${tier.deployTransaction.hash} to`, tier.address);
    } catch (error) {
      console.log(error);
    }

    
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });