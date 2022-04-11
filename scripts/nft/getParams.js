const { ethers } = require("hardhat");
const { addressOf, alias } = require("../addresses");

async function main() {
    // We get the contract to deploy
    const LighthouseNft        = await ethers.getContractFactory("LighthouseNft");
    let nft;

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    // if (chainID == 1287) {
    //   prefund = await Prefund.attach("0x403Fcee103D7Be1835c16C306388AE7CC9eD8786");
    // } else if (chainID == 1285) {
    // } else if (chainID == 97) {
    //   prefund = await Prefund.attach(addressOf(chainID, alias.PREFUND));
    // }

    nft = await LighthouseNft.attach(addressOf(chainID, alias.INVEST_NFT));
    let nftId = 9;



    let params = await nft.paramsOf(nftId);
    console.log(params)
    // let user = "";
    // let prefunded = await prefund.prefunded(projectID, user);
    
    // console.log(`Is user ${user} prefunded project ${projectID}? ${prefunded}`);
    // let investments = await prefund.investments(projectID, user);
    // console.log(investments);
    
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});