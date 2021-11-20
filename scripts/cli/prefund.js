/**
 * Asks exact start time and end time for the phases.
 */

const inquirer            = require("inquirer");
const { ethers }          = require("hardhat");

const askInvest = () => {
  const questions = [
      {
          name: "INVEST",
          type: "input",
          message: "What is the investment amount for each tier? Write with comma. For example: 10,20,30"
      }
  ];
  return inquirer.prompt(questions);
};

const askPool = () => {
  const questions = [
      {
          name: "POOL",
          type: "input",
          message: "What is the investment pool for each tier? Write with comma. For example: 100,200,300"
      }
  ];
  return inquirer.prompt(questions);
};

const inputInvest = async (decimals) => {
    const { INVEST } = await askInvest();
    let invest = INVEST.split(",", 3);
    if (invest.length !== 3) {
      throw `Expecting three values`;
    }

    let invests = invest.map((el) => {
      let num = parseInt(el)
      if (isNaN(num) || num <= 0) {
          throw `Invalid parameter ${el}`;
      }
      return ethers.utils.parseUnits(num.toString(), decimals);
    })

    return invests;
};

const inputPool = async (decimals) => {
  const { POOL } = await askPool();
  let invest = POOL.split(",", 3);
  if (invest.length !== 3) {
    throw `Expecting three values`;
  }

  let invests = invest.map((el) => {
    let num = parseInt(el)
    if (isNaN(num) || num <= 0) {
        throw `Invalid parameter ${el}`;
    }
    return ethers.utils.parseUnits(num.toString(), decimals);
  })

  return invests;
};

module.exports = {
  inputInvest: inputInvest,
  inputPool: inputPool
}