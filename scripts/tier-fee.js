const { ethers } = require("hardhat");

async function main() {
  // We get the contract to deploy
  const Tier = await ethers.getContractFactory("LighthouseTier");
  const Wrapper = await ethers.getContractFactory("LighthouseTierWrapper");
  let tier;
  let wrapper;

  let deployer = await ethers.getSigner();
  let chainID = await deployer.getChainId();

  console.log(deployer.address);

  // Constructor arguments
  let fees;

  // if (chainID == 1287) {
  // } else if (chainID == 1285) {
  //     tier = await Tier.attach('0x59d1AF5D6CDC26c2F98c78fED5E55f11157Db8cF')
  //     wrapper = await Wrapper.attach('0x95031b2b24B350CB30D30df7B1Cd688255BE839a')

  //     fees            = [                                   // Tier claiming fees
  //         ethers.utils.parseEther("1", 18).toString(),      // Tier 0
  //         ethers.utils.parseEther("5", 18).toString(),      // Tier 1
  //         ethers.utils.parseEther("10", 18).toString(),     // Tier 2
  //         ethers.utils.parseEther("20", 18).toString(),     // Tier 3
  //     ];

  //     let setFeesTx = await wrapper.setFees(fees);
  //     // await setFeesTx.wait();
  //     console.log(`Fees updated on chain for the Wrapper ${chainID}`);
  // }
  if (chainID == 97) {
    console.log("Changing on BSC Testnet")
    wrapper = await Wrapper.attach('0x5f64BB041D1d2E111406B6d63b0Ca6c4C66F2052')
    fees = [                     // Tier claiming fees
      ethers.utils.parseEther("5", 18),     // Tier 0
      ethers.utils.parseEther("50", 18),       // Tier 1
      ethers.utils.parseEther("100", 18),       // Tier 2
      ethers.utils.parseEther("200", 18),      // Tier 3
    ];
    let setFeesTx = await wrapper.setFees(fees);
    console.log(`TXID: ${setFeesTx.hash}`);

    console.log(`Fees updated on chain for the Wrapper ${chainID}`);
  }
  else if (chainID == 56) {
    console.log("Changing on BSC Mainnet")
    wrapper = await Wrapper.attach('0xAa5158938a54363F5701f51C9615c94bA300FB11')
    fees = [                     // Tier claiming fees
      ethers.utils.parseEther("5", 18),     // Tier 0
      ethers.utils.parseEther("50", 18),       // Tier 1
      ethers.utils.parseEther("100", 18),       // Tier 2
      ethers.utils.parseEther("200", 18),      // Tier 3
    ];
    let setFeesTx = await wrapper.setFees(fees);
    console.log(`TXID: ${setFeesTx.hash}`);
    console.log(`Fees updated on chain for the Wrapper ${chainID}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });