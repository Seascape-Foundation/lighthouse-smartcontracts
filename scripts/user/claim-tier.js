const chalk                   = require("chalk");
const clear                   = require("clear");

const { ethers }              = require("hardhat");
let cliGas                    = require('../cli/gas');
let cliConfirm            = require('../cli/confirm');
let cliProjectId          = require('../cli/project-id');
let projectUtil           = require('../project/util');
let tierUtil              = require('../tier/util')
let cliAccount            = require('../cli/account');
const { addressOf, alias } = require("../addresses");

/**
 * Investor registers in the Blockchain
 */
async function main() {
  clear();

    // We get the contract to deploy
    const Tier                = await ethers.getContractFactory("LighthouseTierWrapper");

    let i = 1;

    let deployers       = await ethers.getSigners();
    let deployer        = await cliAccount.inputPickAccount(deployers);
    let chainID       = await deployer.getChainId();

    console.log(`Signing by ${deployer.address}`);

    let tier            = await Tier.attach(addressOf(chainID, alias.TIER_WRAPPER));

    let tierLevel       = await tier.getTierLevel(deployer.address);
    console.log(`${deployer.address} tier level is ${tierLevel}`);
    if (tierLevel == 3) {
      console.log(chalk.green(`User is already at max level`));
      return;
    }

    let gasPrice        = await cliGas.inputGasPrice();

    let sig             = await tierUtil.signTier(deployer.address, tier, chainID, tierLevel + 1, deployers[0]);

    // todo: transfer crowns, and check that user approved to burn his crowns.

    let title           = `Please confirm the signing`;
    let params          = {
      gasPrice: `${cliGas.weiToGwei(gasPrice)} wei`,
      user: deployer.address,
      signer: deployers[0].address,
      sig: `v: ${sig.v}, r: ${sig.r}, s: ${sig.s}`,
      tierContract: tier.address,
      level: tierLevel + 1,
      chainID: chainID
    }

    await cliConfirm.inputConfirm(title, params)

    let tx = await tier.connect(deployer).claim(tierLevel + 1, sig.v, sig.r, sig.s, {from: deployer.address, gasPrice: gasPrice});
    await tx.wait();

    console.log(`User ${deployer.address} claimed the tier ${tierLevel + 1}! Txid ` + chalk.blue(tx.hash));
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});