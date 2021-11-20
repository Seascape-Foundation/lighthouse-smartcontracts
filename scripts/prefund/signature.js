const { ethers } = require("hardhat");

async function main() {
    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    let prefundAddress       = null;

    if (chainID == 1287) {
      prefundAddress         = "0x403Fcee103D7Be1835c16C306388AE7CC9eD8786";
    } else if (chainID == 1285) {
    }

    let projectID = 31;
    let user = "0xC6EF8A96F20d50E347eD9a1C84142D02b1EFedc0";
    let level = 3;

    //v, r, s related stuff
    // msg.sender, address(this), chainID, projectId, uint8(certainTier)
    let bytes32 = ethers.utils.defaultAbiCoder.encode(["uint256", "uint256"], [chainID, projectID]);
    let bytes1 = ethers.utils.hexZeroPad([level], 1);
    let str = user + prefundAddress.substr(2) + bytes32.substr(2) + bytes1.substr(2);
    let data = ethers.utils.keccak256(str);
    let flatSig = await deployer.signMessage(ethers.utils.arrayify(data));

    let sig = ethers.utils.splitSignature(flatSig);
    console.log(flatSig);

    console.log(data);

  }
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});