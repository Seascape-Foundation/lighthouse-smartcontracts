const { ethers } = require("hardhat");
const chalk               = require("chalk");
const clear               = require("clear");

let { addressOf, alias }  = require('../addresses');
let cliGas                = require('../cli/gas');
let cliProjectId          = require('../cli/project-id');
let projectUtil           = require('../project/util');


async function main() {
    // We get the contract to deploy
    const Project        = await ethers.getContractFactory("LighthouseProject");
    const Auction        = await ethers.getContractFactory("LighthouseAuction");
    const Cws             = await ethers.getContractFactory("CrownsToken");

    let deployer         = await ethers.getSigner();
    let chainID          = await deployer.getChainId();

    let projectAddress = addressOf(chainID, alias.PROJECT);
    let auctionAddress = addressOf(chainID, alias.AUCTION);

    let project = await Project.attach(projectAddress);
    let auction = await Auction.attach(auctionAddress);
    let cws     = await Cws.attach(addressOf(chainID, alias.CROWNS));

    let latestProjectId = await projectUtil.lastId(project);
    let projectID = await cliProjectId.inputProjectId(latestProjectId);

    let gasPrice = await cliGas.inputGasPrice();

    let allowanceWei = await cws.allowance(deployer.address, auction.address);
    let allowance = ethers.utils.formatUnits(allowanceWei, 18)
    if (allowance < 100000) {
      let approveTx = await cws.approve(auction.address, ethers.utils.parseUnits("100000", 18), {gasPrice: gasPrice})
      await approveTx.wait();
      console.log(`Approved CWS`);
    }

    let amount = ethers.utils.parseUnits("10", 18);

    let sig = await signAuction(deployer, deployer.address, auction.address, projectID, chainID);

    let bidTx = await auction.participate(projectID, amount, sig.v, sig.r, sig.s);
    console.log(`Successfully bidded in auction pool. Txid: ${bidTx.hash}`);
}

async function signAuction(gameOwner, investor, auctionAddress, projectID, chainID) {
  //v, r, s related stuff
  let bytes32 = ethers.utils.defaultAbiCoder.encode(["uint256", "uint256"], [projectID, chainID]);
  let str = investor + auctionAddress.substr(2) + bytes32.substr(2);
  let data = ethers.utils.keccak256(str);
  let flatSig = await gameOwner.signMessage(ethers.utils.arrayify(data));

  let sig = ethers.utils.splitSignature(flatSig);

  return sig;
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});