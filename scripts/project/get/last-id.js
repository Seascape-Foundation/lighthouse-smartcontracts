const { ethers }  = require("hardhat");
const projectUtil = require(`../util`);

async function main() {
    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    let address       = "";

    if (chainID == 1287) {
      address         = "0xc98c9f17673A7cf1278040a4A02e469Dd96d8D5f";
    }

    if (!address) {
      throw `No Project Contract was detected`;
    }

    let result = await totalProjects(address);

    console.log(`${result}`);
}

async function totalProjects(address) {
  let project;

  // We get the contract to deploy
  try {
    const Project       = await ethers.getContractFactory("LighthouseProject");
    project             = await Project.attach(address);
  } catch (error) {
    console.error(error);
    throw `Failed to fetch project`;
  }

  return await projectUtil.lastId(project);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});