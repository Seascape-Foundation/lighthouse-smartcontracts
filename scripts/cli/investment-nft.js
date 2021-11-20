/**
 * Asks exact start time and end time for the phases.
 */

const inquirer            = require("inquirer");
const { ethers }          = require("hardhat");

const ask = (name, symbol) => {
  const questions = [
    {
      name: "NAME",
      type: "input",
      message: `What is the Name of the Investment NFT? If its ${name}, then skip it.`
    },
    {
      name: "SYMBOL",
      type: "input",
      message: `What is the Symbol of Investment NFT? If its ${symbol}, then skip it.`
    }
  ];
  return inquirer.prompt(questions);
};

const input = async (name, symbol) => {
    const { NAME, SYMBOL } = await ask(name, symbol);
    if (NAME.length === 0 && !name) {
      throw `Invalid ${NAME} name.`;
    }

    if (SYMBOL.length === 0 && !symbol) {
      throw `Invalid ${SYMBOL} symbol.`;
    }

    return {
      name: NAME.length === 0 ? name : NAME,
      symbol: SYMBOL.length === 0 ? symbol : SYMBOL
    };
};

const askAddress = (deployedAddress) => {
  const questions = [
      {
          name: "INVEST_NFT",
          type: "input",
          message: `What is Invest NFT address?` + (deployedAddress.length > 0 ? `If address is ${deployedAddress}, you can skip this line.` : '') 
      }
  ];
  return inquirer.prompt(questions);
};

const inputAddress = async (deployedAddress = "") => {
  const { INVEST_NFT } = await askAddress(deployedAddress);
  if (INVEST_NFT.length === 0 && deployedAddress.length === 0) {
    throw `Invalid nft address`;
  }

  return INVEST_NFT.length === 0 ? deployedAddress : INVEST_NFT;
}


module.exports = {
  input: input,
  inputAddress: inputAddress
}