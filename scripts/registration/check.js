const { ethers } = require("hardhat");
const { addressOf, alias } = require("../addresses");

async function main() {
    // We get the contract to deploy
    const Registration        = await ethers.getContractFactory("LighthouseRegistration");
    let registration;

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    console.log(`Signing by ${deployer.address}`);

    let tierWrapper   = addressOf(chainID, alias.TIER_WRAPPER);
    let gasPrice      = 30000000000;

    // console.log(Registration);


    registration = await Registration.attach(addressOf(chainID, alias.REGISTRATION));
    let isRegistered = await registration.registered(11, "0x4056f248B407d19e4A9288d7A26de079ad22DC50");

    console.log(isRegistered);

}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});