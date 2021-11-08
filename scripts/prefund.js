const { ethers } = require("hardhat");

async function main() {
    // We get the contract to deploy
    const Prefund        = await ethers.getContractFactory("LighthousePrefund");
    const Tier           = await ethers.getContractFactory("LighthouseTier");
    const Project        = await ethers.getContractFactory("LighthouseProject");
    let project;
    let prefund;
    let tier;

    let deployer      = await ethers.getSigner();
    let chainID       = await deployer.getChainId();

    console.log(`Prefunding investor: ${deployer.address}`);

    // Constructor arguments
    let fees;

    if (chainID == 1285) {
    } else if (chainID == 1287) {
        prefund = await Prefund.attach('0xbC7b18824c88710638cd0cd157effa3FE6117cF5')
        tier = await Tier.attach('0x8dbD38BbA02A3Cb72c8E9b42b4bcAD3e0889a6da');
        project = await Project.attach("0xc98c9f17673A7cf1278040a4A02e469Dd96d8D5f");

        let projectId = 18;
        let certainTier = 1;
        let hash = "0x0d870d726a14a7c0fb50cd831967ee18180dc47743dd2220472f089e801be94878d6a658fd17db62cb718c8ed5e5ea2df3755fd6d73a5fdf7f88521928d9e6741c";
        
        let poolInfo = await project.prefundPoolInfo(projectId, certainTier);
        console.log(`Pool info: (Collected, Total Allocation) `, poolInfo[0].toString() / 1e18, poolInfo[1].toString() / 1e18);

        let kycVerifier = await project.getKYCVerifier();
        console.log(`KYC verifier: ${kycVerifier}`);

        let tierLevel = await tier.getTierLevel("0x07baC413a11C6c50aB864065d5cd325f18A36Fb9")
        console.log(`${deployer.address} tier level ${tierLevel}`);

        let investmentAmount1 = await project.prefundInvestAmount(projectId, 1);
        let investmentAmount2 = await project.prefundInvestAmount(projectId, 2);
        let investmentAmount3 = await project.prefundInvestAmount(projectId, 3);
        console.log(`1 Amount: ${investmentAmount1[0].toString() / 1e18}, token: ${investmentAmount1[1]}`);
        console.log(`2 Amount: ${investmentAmount2[0].toString() / 1e18}`);
        console.log(`3 Amount: ${investmentAmount3[0].toString() / 1e18}`);
        return;

        let r = hash.substr(0,66);
        let s = "0x" + hash.substr(66,64);
        let v = parseInt(hash.substr(130), 16);
        if (v < 27) {
          v += 27;
        }

        let prefundedTx = await prefund.prefund(projectId, certainTier, v, r, s)
        await prefundedTx.wait();
        console.log(`Prefunded successfully`);
    }
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });