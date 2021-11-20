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
      tierWrapper     = "0xeffdb75ff90349151e100d82dfd38fa1d7f050d2";
      prefund = await Prefund.attach("0x403Fcee103D7Be1835c16C306388AE7CC9eD8786");

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