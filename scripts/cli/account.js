const inquirer            = require("inquirer");
const chalk               = require("chalk");

const ask = (deployer = '') => {
    const questions = [
        {
            name: "ADDR",
            type: "input",
            message: `Who is the KYC verifier? If its the ${deployer} then leave empty.`
        }
    ];
    return inquirer.prompt(questions);
};

const askPick = (accounts) => {
    const questions = [
        {
            name: "ACC",
            type: "list",
            message: `Pick an account.`,
            choices: accounts
        }
    ];
    return inquirer.prompt(questions);
};


const askFund = (deployer = '') => {
    const questions = [
        {
            name: "ADDR",
            type: "input",
            message: `Who is the Fund collector? If its the ${deployer} then leave empty.`
        }
    ];
    return inquirer.prompt(questions);
};

const inputKycVerifier = async (deployer) => {
    const { ADDR } = await ask(deployer);
    if (ADDR.length > 0) {
      return ADDR;
    }

    if (deployer.length === 0) {
      return console.error(chalk.red(`KYC Verifier was not presented`));
    }

    return deployer;
}

const inputFundCollector = async (deployer) => {
    const { ADDR } = await askFund(deployer);
    if (ADDR.length > 0) {
      return ADDR;
    }

    if (deployer.length === 0) {
      return console.error(chalk.red(`Fund collector was not presented`));
    }

    return deployer;
}

const inputPickAccount = async (accounts) => {
    let addresses = accounts.map((el) => {return el.address;});

    const { ACC } = await askPick(addresses);
    if (ACC.length == 0) {
        return console.error(chalk.red(`No account was selected`));
    }

    for (var i in accounts) {
        if (accounts[i].address == ACC) {
            return accounts[i];
        }
    }

    console.error(`Unexpected error`);
    process.exit(0);
}

module.exports = {
    inputKycVerifier: inputKycVerifier,
    inputFundCollector: inputFundCollector,
    inputPickAccount: inputPickAccount
}