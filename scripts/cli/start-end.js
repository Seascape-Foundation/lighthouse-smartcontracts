/**
 * Asks exact start time and end time for the phases.
 */

const inquirer            = require("inquirer");
const chalk               = require("chalk");

let OFFSET              = 30;

const askStartTimeType = () => {
  const questions = [
      {
          name: "START_TIME_TYPE",
          type: "input",
          message: "Defining `startTime` argument. Is it with offset (y/n)?"
      }
  ];
  return inquirer.prompt(questions);
};

const askExactStartTime = () => {
  const questions = [
      {
          name: "EXACT_START_TIME",
          type: "input",
          message: "What is the exact time?"
      }
  ];
  return inquirer.prompt(questions);
};

const askOffset = () => {
  const questions = [
      {
          name: "START_TIME_OFFSET",
          type: "input",
          message: `What is the offset? Default is ${OFFSET} seconds. Leave it empty, to use default value`
      }
  ];
  return inquirer.prompt(questions);
};

const askDuration = () => {
  const questions = [
      {
          name: "DURATION",
          type: "input",
          message: "What is the duration?"
      }
  ];
  return inquirer.prompt(questions);
};

/**
 * @returns start and end timestamps
 */
const inputStartEnd = async () => {
    const { DURATION } = await askDuration();
    let duration = parseInt(eval(DURATION));
    if (isNaN(duration) || duration < 1) {
      console.log(chalk.red(`Duration should be only a positive integer number`));
      return;
    }

    const { START_TIME_TYPE } = await askStartTimeType();
    if (START_TIME_TYPE !== 'y' && START_TIME_TYPE !== 'n') {
      console.error(chalk.red(`You can input only 'y' or 'n'`));
      return;
    }
    
    let start     = null;

    if (START_TIME_TYPE === 'n') {
      const { EXACT_START_TIME } = await askExactStartTime();

      let exactTimeStamp = parseInt(EXACT_START_TIME);
      let now = parseInt(new Date().getTime() / 1000);

      if (isNaN(exactTimeStamp) || exactTimeStamp <= 0) {
        console.error(chalk.red(`Only unix timestamp number could be written. For example: ${now}`));
        return;
      }

      if (exactTimeStamp < now + OFFSET) {
        console.error(chalk.red(`Starting Time should be atleast ${OFFSET} seconds later than current time!`));
        return;
      }
      start = exactTimeStamp;
    } else {
      const { START_TIME_OFFSET } = await askOffset();
      let offset = OFFSET;
      if (START_TIME_OFFSET.length != 0) {
        let offset = parseInt(eval(START_TIME_OFFSET));
        if (isNaN(offset) || offset < 1) {
          console.log(chalk.red(`Offset should be only a positive integer number. Given ${offset}`));
          process.exit(1);
        }
      }

      let now = parseInt(new Date().getTime() / 1000);

      start = now + offset;
    }

    let end = start + duration;

    return {start, end};
};

module.exports = {
    inputStartEnd: inputStartEnd
}