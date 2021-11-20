const inquirer            = require("inquirer");
const chalk               = require("chalk");

const MIN_GAS_PRICE     = 1000000000;
const GAS_PRICE         = 30000000000;                                    // 30 gwei

const weiToGwei = function(wei) {
  return parseInt(wei / 1e9);
}

const gweiToWei = function(gwei) {
  return parseInt(gwei * 1e9);
}

const askGasPrice = () => {
    const questions = [
        {
            name: "NEW_GAS_PRICE",
            type: "input",
            message: `What is the gas price? Default is ${weiToGwei(GAS_PRICE)} gwei. Left empty for default.`
        }
    ];
    return inquirer.prompt(questions);
};

const inputGasPrice = async () => {
    const { NEW_GAS_PRICE } = await askGasPrice();
    if (NEW_GAS_PRICE.length > 0) {
      let newGasPrice = gweiToWei(NEW_GAS_PRICE);
      if (isNaN(newGasPrice) || newGasPrice <= MIN_GAS_PRICE) {
        console.error(chalk.red(`Gas price should be minimum ${weiToGwei(MIN_GAS_PRICE)}`));
        return;
      }

      return newGasPrice;
    }

    return GAS_PRICE;
}

module.exports = {
    GAS_PRICE: GAS_PRICE,
    MIN_GAS_PRICE: MIN_GAS_PRICE,
    weiToGwei: weiToGwei,
    gweiToWei: gweiToWei,
    inputGasPrice: inputGasPrice
}