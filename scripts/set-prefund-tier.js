const { ethers } = require("hardhat");

async function main() {
    // We get the contract to deploy
    const Prefund        = await ethers.getContractFactory("LighthousePrefund");
    let prefund;

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    console.log(`Signing by ${deployer.address}`);

    let tierWrapper    = "0xBCd6277B5A27390773B4657A7406E1c3BA6165c0";

    if (chainID == 1287) {
      prefund = await Prefund.attach("0xbC7b18824c88710638cd0cd157effa3FE6117cF5");

      await prefund.setLighthouseTier(tierWrapper, {from: deployer.address});

      console.log(`Prefund Tier was updated to ${tierWrapper}`);
    } else if (chainID == 1285) {
    }
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});