const inquirer            = require("inquirer");
const chalk               = require("chalk");

const askConfirmation = (message) => {
    const questions = [
      {
          name: "SURE",
          type: "input",
          message: message
      }
    ];
    return inquirer.prompt(questions);
};

let inputConfirm = async (title, params) => {
    let message = title + `\n`;
    for (var name in params) {
        message += name + `: ` + chalk.blue(params[name]) + `\n`;
    }

    message += `\nAre you sure you want to continue? (y/n): `;

    const { SURE } = await askConfirmation(message);
    if (SURE !== 'y' && SURE !== 'n') {
      console.error(chalk.red(`You can input only 'y' or 'n'`));
      return;
    }

    if (SURE === 'n') {
      process.exit(0);
    }
}

module.exports = {
    inputConfirm: inputConfirm
}