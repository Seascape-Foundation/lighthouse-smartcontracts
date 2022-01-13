const chalk                   = require("chalk");
const clear                   = require("clear");

const { ethers }              = require("hardhat");
let { addressOf, alias }      = require('../addresses');
let cliGas                    = require('../cli/gas');

async function main() {
  console.log(`Welcome to the deployment of Project`);

    // We get the contract to deploy
    let USD             = await ethers.getContractFactory("USD");
    const AnyWichita    = await ethers.getContractFactory("BurnAnyWichita");
    const Scape         = await ethers.getContractFactory("BurnScape");
    const Token         = await ethers.getContractFactory("BurnToken");

    console.log(`Contracts were initiated`);

    let deployer        = await ethers.getSigner();
    let chainID         = await deployer.getChainId();

    // Constructor arguments
    let anyWichitaAddr  = await addressOf(chainID, alias.WICHITA);
    let scapeAddr       = await addressOf(chainID, alias.SCAPE);

    // let gasPrice        = await cliGas.inputGasPrice();

    // deploy project
    let anyWichita      = await AnyWichita.deploy(anyWichitaAddr); 
    console.log("Burn Any Wichita deployed to ", anyWichita.address);

    let scape           = await Scape.deploy(scapeAddr);  
    console.log(`Burn Scape NFT deployed to ${scape.address}`);

    let token           = await Token.deploy();
    console.log(`Burn ERC20 token dpeloyed to ${token.address}`);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });