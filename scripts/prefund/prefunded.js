const { ethers } = require("hardhat");

async function main() {
    // We get the contract to deploy
    const Prefund        = await ethers.getContractFactory("LighthousePrefund");
    let prefund;

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    if (chainID == 1287) {
      prefund = await Prefund.attach("0x403Fcee103D7Be1835c16C306388AE7CC9eD8786");
    } else if (chainID == 1285) {
    }

    let projectID = 4;
    let user = "0xba2C3910b213079cbb718a1B5F8AdB3E9169B7b4";
    let prefunded = await prefund.prefunded(projectID, user);
    console.log(`Is user ${user} prefunded project ${projectID}? ${prefunded}`);
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});