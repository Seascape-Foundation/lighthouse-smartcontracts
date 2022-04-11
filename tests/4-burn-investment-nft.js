const { expect } = require("chai");
const { ethers } = require("hardhat");
const { utils } = require("ethers");

describe("Burn Lighthouse Allocation NFT", async () => {

    let u1;
    let usd, cws, stnk;

    it("1 should link contracts", async () => {
        let signers = await ethers.getSigners();
        u1 = signers[0];

        const USD = await ethers.getContractFactory("USD");
        usd = await USD.deploy(utils.parseEther("10000"));    /// Argument 1 means deploy in Test mode
        await usd.deployed();
        console.log("USD deployed to ", usd.address);
        



    });


});