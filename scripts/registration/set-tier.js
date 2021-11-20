const { ethers } = require("hardhat");

async function main() {
    // We get the contract to deploy
    const Registration        = await ethers.getContractFactory("LighthouseRegistration");
    let registration;

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    console.log(`Signing by ${deployer.address}`);

    let tierWrapper   = "0xBCd6277B5A27390773B4657A7406E1c3BA6165c0";
    let gasPrice      = 30000000000;

    if (chainID == 1287) {
      tierWrapper     = "0xeffdb75ff90349151e100d82dfd38fa1d7f050d2";
      registration = await Registration.attach("0xFe62cC8850BD425Ab6aF108e0044Dd29eC7578aD");

      console.log(`registrationt ier was updated to ${tierWrapper}`);
    } else if (chainID == 1285) {
      tierWrapper     = "0xbc719dc309beb82489e9a949c415e0eaed87d247";
      registration = await Registration.attach("0xf102cA709bB314614167574e2965aDFcb001d3e9");

    }
  
    await registration.setLighthouseTier(tierWrapper, {from: deployer.address, gasPrice: gasPrice});
    console.log(`Registration tier was updated.`);
  }
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});