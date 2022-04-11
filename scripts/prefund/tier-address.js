const { ethers } = require("hardhat");
const { addressOf, alias } = require("../addresses");

async function main() {
    // We get the contract to deploy
    const Prefund        = await ethers.getContractFactory("LighthousePrefund");
    let prefund;

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    if (chainID == 1287) {
        prefund = await Prefund.attach("0xc98c9f17673A7cf1278040a4A02e469Dd96d8D5f");
    } else if (chainID == 1285) {
    } else if (chainID == 97) {
        prefund = await Prefund.attach(addressOf(chainID, alias.PREFUND));
    }

    let address = addressOf(chainID, alias.TIER_WRAPPER);

    let initialized = await prefund.setLighthouseTier(address);
    console.log(`Is prefund address set  ${address}? ${JSON.stringify(initialized)}`);
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});