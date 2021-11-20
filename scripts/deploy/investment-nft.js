const { ethers } = require("hardhat");
const clear               = require("clear");
const chalk                   = require("chalk");

let { addressOf, alias }      = require('../addresses');
let projectUtil               = require('../project/util');
let cliProjectId              = require('../cli/project-id');
let cliInvestNft              = require('../cli/investment-nft');
let cliConfirm                = require('../cli/confirm');

async function main() {
  clear();
  console.log(chalk.blue(`Welcome to the deployment of the Investment NFT`));

    // We get the contract to deploy
    const Invest            = await ethers.getContractFactory("LighthouseNft");
    const Project           = await ethers.getContractFactory("LighthouseProject");

    let deployer            = await ethers.getSigner();
    let chainID             = await deployer.getChainId();

    let projectAddress      = addressOf(chainID, alias.PROJECT);

    let project             = await Project.attach(projectAddress);
    let latestProjectId     = await projectUtil.lastId(project)
    let projectID           = await cliProjectId.inputProjectId(latestProjectId);

    let {name, symbol}      = await cliInvestNft.input("Moonscape Investment", "MSCPIDO")   

    let title               = `Deploying the Investment NFT!`;
    let params              = {
      projectID:            projectID,
      name:                 name,
      symbol:               symbol
    }

    await cliConfirm.inputConfirm(title, params);

    // address _crowns, address tier, address submission, address prefund, address project, uint256 _chainID
    let invest           = await Invest.deploy(projectID, name, symbol);    /// Argument '1' means deploy in Test mode
    console.log(`Investment NFT ${symbol} for project ${projectID} deployed on ` + chalk.green(invest.address) + `. Txid: ` + chalk.blue(invest.deployTransaction.hash));

    console.log(chalk.bold(`Don't forget to add permission to LighthouseMint`));

    console.log(chalk.blue(`\n\nDeployment Finished!\n\n`));
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });