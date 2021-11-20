const { ethers } = require("hardhat");
const chalk               = require("chalk");
const clear               = require("clear");

let { addressOf, alias }  = require('../addresses');
let cliGas                = require('../cli/gas');
let cliProjectId          = require('../cli/project-id');
let projectUtil           = require('../project/util');


async function main() {
    // We get the contract to deploy
    const Mint            = await ethers.getContractFactory("LighthouseMint");
    const Project         = await ethers.getContractFactory("LighthouseProject");

    let deployer          = await ethers.getSigner();
    let chainID           = await deployer.getChainId();

    let projectAddress    = addressOf(chainID, alias.PROJECT);
    let mintAddress       = addressOf(chainID, alias.MINT);

    let project           = await Project.attach(projectAddress);
    let mint              = await Mint.attach(mintAddress);

    let latestProjectId = await projectUtil.lastId(project);
    let projectID = await cliProjectId.inputProjectId(latestProjectId);

    let gasPrice = await cliGas.inputGasPrice();

    // msg.sender, address(this), chainID, projectId)
    let sig = await signMint(deployer.address, mint.address, chainID, projectID, deployer);

    let tx = await mint.mint(projectID, sig.v, [sig.r, sig.s], {gasPrice: gasPrice});
    console.log(`Successfully minted an investment nft. Txid: ${tx.hash}`);
}

async function signMint(investor, mintAddress, projectID, chainID, gameOwner) {
  //v, r, s related stuff
  let bytes32 = ethers.utils.defaultAbiCoder.encode(["uint256", "uint256"], [projectID, chainID]);
  let str = investor + mintAddress.substr(2) + bytes32.substr(2);
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