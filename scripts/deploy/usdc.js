const chalk                   = require("chalk");
const clear                   = require("clear");

const { ethers }              = require("hardhat");
let { addressOf, alias }      = require('../addresses');
let cliGas                    = require('../cli/gas');
// let cliStartEnd               = require('../cli/start-end');
// let cliConfirm                = require('../cli/confirm');
// let cliProjectId              = require('../cli/project-id');
// let cliAuction                = require('../cli/auction');
// let cliAllocationCompensation = require('../cli/allocation-compensation');
// let cliInvestNft              = require('../cli/investment-nft');
let cliAccount                = require('../cli/account')
// let projectUtil               = require('./util');

async function main() {
  console.log(`Welcome to the deployment of USDC`);

    // We get the contract to deploy
    let totalUsdSupply  = ethers.utils.parseEther("10000000");
    let USD             = await ethers.getContractFactory("USD");
    // const Project       = await ethers.getContractFactory("LighthouseProject");
    // const Registration  = await ethers.getContractFactory("LighthouseRegistration");

    console.log(`Contracts were initiated`);

    let deployer        = await ethers.getSigner();
    let chainID         = await deployer.getChainId();

    // todo Change it on the Main network
    // verifier = "0xb7fA673753c321f14733Eff576bC0d8E644e455e";
    let verifier        = await cliAccount.inputKycVerifier(deployer.address);

    let gasPrice        = await cliGas.inputGasPrice();

    // Constructor arguments
    // let tierAddress     = await addressOf(chainID, alias.TIER_WRAPPER);

    // deploy project
    let usdc              = await USD.deploy(totalUsdSupply); 
    console.log("Lighthouse USDC deployed to ", usdc.address);

    // deploy registration interface
    // let registration              = await USD.deploy(tierAddress, project.address);  
    // console.log(`Lighthouse Registration deployed to ${registration.address}`);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });