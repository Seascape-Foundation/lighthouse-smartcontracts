const { ethers } = require("hardhat");

async function main() {
  console.log(`Welcome to deployment of the Lighthouse NFT (gift in auction pool)`);

    // We get the contract to deploy
    const Gift          = await ethers.getContractFactory("GiftNft");
    const Auction       = await ethers.getContractFactory("LighthouseAuction");

    console.log(`Contracts were initiated`);

    let deployer            = await ethers.getSigner();
    let chainID             = await deployer.getChainId();

    // todo Change it on the Main network
    let verifier            = null;

    // To add permissions
    let auction             = null;

    // Constructor arguments
    let crowns;
    let auctionAddress      = null;

    console.log(`All variables were initiated`);

    if (chainID == 1287) {
      console.log(`Moonbeam Alpha`);

      verifier            = deployer.address;
      auctionAddress      = "0xAa02f469605eD7B90afA0Da64249eA964E5FA53b";

      auction             = Auction.attach(auctionAddress);
    } else if (chainID == 1285) {
      throw `Chain 1285 Not supported yet`;
    }

    // deploy gift interface
    // address _crowns, address tier, address submission, address prefund, address project, uint256 _chainID
    let gift           = await Gift.deploy("Lighthouse NFT", "LIGHTHOUSE", auctionAddress);    /// Argument '1' means deploy in Test mode
    console.log(`Lighthouse NFT deployed to ${gift.address}\nSetting up permissions...`);

    await auction.setGiftNft("0x7375eb3a0686EBeFB8822358348D5B2929963e97", {from: deployer.address});
    console.log(`Lighthouse Auction knows the Lighthouse NFT`);

    console.log(`\n\nDeployment Finished!\n\n`);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });