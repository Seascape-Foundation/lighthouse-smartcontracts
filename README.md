# Lighthouse IDO smartcontracts
Lighthouse smartcontracts. Its a cross-chain IDO platform for p2e games on Ethereum, BSC and Moonriver.

The documentation about how Smartcontracts works: https://docs.seascape.network/lighthouse-ido/smartcontrontracts
The documentation about how to Run on local host: https://docs.seascape.network/lighthouse-ido/installation


# Project launch order

## 1. Prepare the Server
1. Get from Blockchain the latest called contract:
    ```
    let latestProject = await LighthouseProject.latestProject();

    // convert to Number
    let nextProjectId = parseInt(latestProject + 1);
    ```

2. Create the project and player_created_coin tables with sample data. As the `projectId` use `nextProjectId`


## 2. Run registration
1. Call the smartcontract's `initRegistration` method.
This method will create in Blockchain a new project ID.

For example, from this repository you can initiate the new IDO for a project by running:

```npx hardhat run scripts/project/start.js --network moonbeam```

Make sure that you edit the parameters in `scripts/project/start.js`.

The script is calling `LighthouseProject.initRegistration(startTime, endTime)` method.

`startTime` - when the Registration starts.
`endTime` - when the Registration finishes.

2. Make sure that on backend Sync bot tracks `LighthouseProject.InitRegistration` event, then updates the project's registration_phase.

## 3. Lottery of Prefund Winners
This is centralized, as its hard to pick pool of values within array in the smartcontracts. Would be happy if the technology could allow that.
Populate the `lottery_winners` list.

## 4. Run prefund phase
1. Make sure, that **Lottery of Prefund winners** went successful.

2. Call the `LighthouseProject` smartcontract's `initPrefund` method.

In this script you can call it by running the following command line:

```npx hardhat run scripts/project/prefund.js --network moonbeam```

*Make sure, that you edit the `scripts/project/prefund.js`* by passing `nextProjectId` that we get on first step as `projectId`.

The script is calling `LighthouseProject.initPrefund(uint256 id, uint256 startTime, uint256 endTime, uint256[3] calldata investAmounts, uint256[3] calldata pools, address _token)` method.

Here is the description of parameters:
* `id` - the project ID. Returned by `initRegistration` method.
* `startTime` - when the prefund phase starts
* `endTime` - when the prefund phase ends
* `investAmounts` - how much each tier user could invest in the prefund. The Lighthouse has three tiers only which are eligible for investments. So, if `investAmounts` is `[10, 20, 30]`, that means, tier 1 could invest 10 Token only.
* `pools` - the cap that prefund could collect in the token. If `pools` is `[100, 200, 90]`, that means ten tier 1, ten tier 2 and only three tier 3 users could participate in the prefund.
* `token` - the ERC20 token address that is used to collect funds. If this value is zero. Then Lighthouse collects the native Token of the blockchain.

*A small note. The amounts passed to `investAmounts` and `pools` should be in wei format. First get the token decimals. Then parse the number to wei using the decimal*.

3. Make sure that sync bot catched the event and added it to Projec's `prefund_phase` by catching `LighthouseProject.InitPrefund` event.

## 5. Deploy Investment NFT
Deploy the Investment NFT that will keep the PCC (player created coin) and collateral Crowns token. After the end of the funding, the user who prefunded or participated in the auction pool will get the Investment NFT. 

Later he can Burn NFT in exchange for project's token (PCC) or for collateral Crowns token.

## 5. Run Auction Phase
This part is a bit more complicated. As it requires three transactions. All four transactions could be done via the script in this repository:

```npx hardhat run scripts/project/auction.js --network moonbeam```

**Just make sure you edit the parameters in the script, before running it.**

Here are transactions to call.

1. Execute `LighthouseProject.initAuction(uint256 id, uint256 startTime, uint256 endTime)` method.

Parameters are:
`id` - the project ID
`startTime` - the project's start time.
`endTime` - the project's end time.

2. Execute `LighthouseAuction.setAuctionData(uint256 projectId, uint256 min, uint16 giftAmount)` method.
This method will tell the minium CWS to bid. And first amount of bidders who will get a Gift NFT.

3. After end of the prefund phase, execute the following `initAllocationCompensation(uint256 id, uint256 prefundAllocation, uint256 prefundCompensation, uint256 auctionAllocation, uint256 auctionCompensation, address nftAddress)` method.

In order to run this method, we need Investment NFT to be deployed. This method is setting up the PCC pool for Prefund and Auctions.

The parameters are:
`id` - the Project ID.
`prefundAllocation` - Total PCC amount for prefund phase.
`prefundCompensation` - Total Crowns amount for prefund phase.
`auctionAllocation` - Total PCC amount for auction bidders.
`auctionCompensation` - Total Crowns amount for auction bidders.
`nftAddress` - The Investment NFT that user could claim after the fundraising end.

4. Finally run this method after end and before the Auction phases: `LighthouseProject.transferPrefund(uint256 id)`.

This method requires `initAllocationCompensation` method to run first. Because the method `transferPrefund` transferres unclaimed prefund allocation to the Auction pool.

The paramaters are:
`id` - the Project ID.

Finally, make sure that the sync bot tracks the `InitAuction`, `InitAllocationCompensation` and `TransferPrefunded` events to track the right amount of tokens that each investor will get.

## 5. Minting Investment NFTs
In order to allow minting, we should execute the following method `LighthouseProject.initMinting(uint256 id)`.

The parameter `id` is the Project ID.

Make sure that sync bot tracks the `InitMint` event.

## 6. Deploy PCC
Deploy the PCC token for the project.   

## 6. Burning Investment NFTs
1. Transfer required amount of PCC and collateral CWS tokens to the `LighthouseBurn` smartcontract.

2. Then, execute the `LighthouseProject.setPcc(address pcc)` method.
This method tells that PCC account is ready. Which means NFT Burning contract is live too.
