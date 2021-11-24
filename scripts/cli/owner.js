const inquirer            = require("inquirer");
const chalk               = require("chalk");

const askNewOwner = () => {
    const questions = [
        {
            name: "OWNER",
            type: "input",
            message: `Who is the new owner of the smartcontract?`,
        }
    ];
    return inquirer.prompt(questions);
};

const askAddress = () => {
    const questions = [
        {
            name: "ADDR",
            type: "input",
            message: `Which contract ownership you want to check?`,
        }
    ];
    return inquirer.prompt(questions);
};

const inputNewOwner = async () => {
    const { OWNER } = await askNewOwner();
    if (OWNER.length > 0) {
      return OWNER;
    }

    console.error(chalk.red(`No new owner address given`));
    process.exit(1);
}

const inputAddress = async () => {
    const { ADDR } = await askAddress();
    if (ADDR.length > 0) {
      return ADDR;
    }

    console.error(chalk.red(`No smartcontract address given`));
    process.exit(1);
}

module.exports = {
    inputAddress: inputAddress,
    inputNewOwner: inputNewOwner
}