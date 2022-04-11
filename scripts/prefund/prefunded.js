const { ethers } = require("hardhat");
const { addressOf, alias } = require("../addresses");

async function main() {
    // We get the contract to deploy
    const Prefund        = await ethers.getContractFactory("LighthousePrefund");
    let prefund;

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    if (chainID == 1287) {
      prefund = await Prefund.attach("0x403Fcee103D7Be1835c16C306388AE7CC9eD8786");
    } else if (chainID == 1285) {
    } else if (chainID == 97) {
      prefund = await Prefund.attach(addressOf(chainID, alias.PREFUND));
    }

    let projectID = 19;
    let user = "";
    let prefunded = await prefund.prefunded(projectID, user);
    
    console.log(`Is user ${user} prefunded project ${projectID}? ${prefunded}`);
    let investments = await prefund.investments(projectID, user);
    console.log(investments);
    
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});