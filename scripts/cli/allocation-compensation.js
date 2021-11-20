/**
 * Asks exact start time and end time for the phases.
 */

const inquirer            = require("inquirer");
const { ethers }          = require("hardhat");

const askPrefund = () => {
  const questions = [
      {
          name: "PREFUND",
          type: "input",
          message: "What is the PCC allocation, CWS collateral amount for prefunded investors? Write with comma. For example: 10,20"
      }
  ];
  return inquirer.prompt(questions);
};

const askAuction = () => {
  const questions = [
      {
          name: "AUCTION",
          type: "input",
          message: "What is the PCC allocation, CWS collateral amount for auction bidders? Write with comma. For example: 10,20"
      }
  ];
  return inquirer.prompt(questions);
};

const inputPrefund = async (decimals = 18) => {
    const { PREFUND } = await askPrefund();
    let prefund = PREFUND.split(",", 2);
    if (prefund.length !== 2) {
      throw `Expecting two values`;
    }

    let prefunds = prefund.map((el) => {
      let num = parseInt(el)
      if (isNaN(num) || num <= 0) {
          throw `Invalid parameter ${el}`;
      }
      return ethers.utils.parseUnits(num.toString(), decimals);
    })

    return prefunds;
};

const inputAuction = async (decimals = 18) => {
  const { AUCTION } = await askAuction();
    let auction = AUCTION.split(",", 2);
    if (auction.length !== 2) {
      throw `Expecting two values`;
    }

    let auctions = auction.map((el) => {
      let num = parseInt(el)
      if (isNaN(num) || num <= 0) {
          throw `Invalid parameter ${el}`;
      }
      return ethers.utils.parseUnits(num.toString(), decimals);
    })

  return auctions;
};

module.exports = {
  inputPrefund: inputPrefund,
  inputAuction: inputAuction
}