const inquirer            = require("inquirer");
const chalk               = require("chalk");

const askProjectId = (latestProjectId) => {
    const questions = [
        {
            name: "PROJECT_ID",
            type: "input",
            message: `What is the project ID? Latest is ${latestProjectId}. Leave empty for the latest project ID.`
        }
    ];
    return inquirer.prompt(questions);
};

const inputProjectId = async (latestProjectId) => {
    const { PROJECT_ID } = await askProjectId(latestProjectId);

    if (PROJECT_ID.length === 0) {
      return latestProjectId;
    }

    let projectId = parseInt(PROJECT_ID);

    if (isNaN(projectId) || projectId <= 0) {
      console.error(chalk.red(`Project ID should be a positive natural number`));
      process.exit(0);
    }

    return projectId;
}

module.exports = {
  inputProjectId: inputProjectId
}