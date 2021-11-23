/**
 * Asks exact start time and end time for the phases.
 */

const inquirer            = require("inquirer");
const { ethers }          = require("hardhat");

const askData = () => {
  const questions = [
    {
      name: "MIN",
      type: "input",
      message: "What is the minimum CWS to burn? By default its zero. Leave empty to use default value."
    },
    {
      name: "GIFT_AMOUNT",
      type: "input",
      message: "What is the amount of first bidders who will get free Lighthouse NFT?"
    }
  ];
  return inquirer.prompt(questions);
};

const inputData = async () => {
  const { MIN, GIFT_AMOUNT } = await askData();
  
  let min, giftAmount = parseInt(GIFT_AMOUNT);

  const decimals = 18; // CWS decimals.

  if (MIN.length === 0) {
    min = 0;
  } else {
    min = parseFloat(MIN);
    if (isNaN(min) || min < 0 || min > 100000) {
      throw `Invalid min burn ${min}`;
    } else {
      min = ethers.utils.parseUnits(min.toString(), decimals);
    }
  }

  if (isNaN(giftAmount) || giftAmount <= 0) {
    throw `Invalid Gift Amount ${giftAmount}`;
  }

  return {min, giftAmount};
};

module.exports = {
  inputData: inputData
}