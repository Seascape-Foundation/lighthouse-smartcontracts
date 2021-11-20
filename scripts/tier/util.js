const { ethers }              = require("hardhat");

let signTier = async function (userAddress, tier, chainID, level, signer) {
    let tierData = await tier.tiers(userAddress);
    let nonce = parseInt(tierData.nonce);

    // bytes32 message         = keccak256(abi.encodePacked(msg.sender, tier.nonce, level, chainID, address(this)));
    //v, r, s related stuff
    let nonceBytes = ethers.utils.defaultAbiCoder.encode(["uint256"], [nonce]);
    let chainBytes = ethers.utils.defaultAbiCoder.encode(["uint256"], [chainID]);
    let levelBytes = ethers.utils.hexZeroPad([level], 1);

    let str = userAddress + nonceBytes.substr(2) + levelBytes.substr(2) + chainBytes.substr(2) + tier.address.substr(2);
    let data = ethers.utils.keccak256(str);
    let flatSig = await signer.signMessage(ethers.utils.arrayify(data));

    let sig = ethers.utils.splitSignature(flatSig);

    return sig;
}
  
module.exports = {
    signTier: signTier
}