// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ScapeNFT {
    function paramsOf(uint) external view returns(uint, uint8);
    function ownerOf(uint) external view returns(address);
    function burn(uint tokenId) external;
}

/**
 * @title LighthouseBurn
 * @notice The Lighthouse Manager of tokens by Seascape Network team, investors.
 * It distributes the tokens to the game devs.
 * 
 * This smartcontract gets active for a project, only after its prefunding is finished.
 *
 * This smartcontract determines how much PCC (Player created coin) the investor would get, 
 * and an amount of compensation in case PCC failure.
 * The determination is described as a Lighthouse NFT.
 */
contract BurnScape {
    address public scapeAddress;

    struct Burn {
        uint time;
        uint id;        // nft id
        uint8 gen;
    }

    mapping (address => uint) public burntTotalAmount;
    mapping (address => uint) public burntCommonAmount;
    mapping (address => uint) public burntSpecialAmount;
    mapping (address => uint) public burntRareAmount;
    mapping (address => uint) public burntEpicAmount;
    mapping (address => uint) public burntLegendaryAmount;
    mapping (address => mapping(uint => Burn)) public burntCommons;
    mapping (address => mapping(uint => Burn)) public burntSpecials;
    mapping (address => mapping(uint => Burn)) public burntRares;
    mapping (address => mapping(uint => Burn)) public burntEpics;
    mapping (address => mapping(uint => Burn)) public burntLegendaries;

    event Burnt(address indexed investor, uint time, uint id, uint quality, uint8 gen);

    constructor(address _scape) {
        scapeAddress = _scape;
    }

    function burnCommon(uint _id) external {
        ScapeNFT scape = ScapeNFT(scapeAddress);
        require(scape.ownerOf(_id) == msg.sender, "NOT_YOURS");

        (uint quality, uint8 gen) = scape.paramsOf(_id);
        require(quality == 1, "NOT_COMMON");

        burntCommonAmount[msg.sender]++;
        burntTotalAmount[msg.sender]++;
        burntCommons[msg.sender][burntCommonAmount[msg.sender]] = Burn(block.timestamp, _id, gen);

        scape.burn(_id);

        emit Burnt(msg.sender, block.timestamp, _id, quality, gen);
    }


    function burnSpecial(uint _id) external {
        ScapeNFT scape = ScapeNFT(scapeAddress);
        require(scape.ownerOf(_id) == msg.sender, "NOT_YOURS");

        (uint quality, uint8 gen) = scape.paramsOf(_id);
        require(quality == 2, "NOT_EPIC");

        burntSpecialAmount[msg.sender]++;
        burntTotalAmount[msg.sender]++;
        burntSpecials[msg.sender][burntSpecialAmount[msg.sender]] = Burn(block.timestamp, _id, gen);

        scape.burn(_id);

        emit Burnt(msg.sender, block.timestamp, _id, quality, gen);
    }

    function burnRare(uint _id) external {
        ScapeNFT scape = ScapeNFT(scapeAddress);
        require(scape.ownerOf(_id) == msg.sender, "NOT_YOURS");

        (uint quality, uint8 gen) = scape.paramsOf(_id);
        require(quality == 3, "NOT_RARE");

        burntRareAmount[msg.sender]++;
        burntTotalAmount[msg.sender]++;
        burntRares[msg.sender][burntRareAmount[msg.sender]] = Burn(block.timestamp, _id, gen);

        scape.burn(_id);

        emit Burnt(msg.sender, block.timestamp, _id, quality, gen);
    }

    function burnEpic(uint _id) external {
        ScapeNFT scape = ScapeNFT(scapeAddress);
        require(scape.ownerOf(_id) == msg.sender, "NOT_YOURS");

        (uint quality, uint8 gen) = scape.paramsOf(_id);
        require(quality == 4, "NOT_EPIC");

        burntEpicAmount[msg.sender]++;
        burntTotalAmount[msg.sender]++;
        burntEpics[msg.sender][burntEpicAmount[msg.sender]] = Burn(block.timestamp, _id, gen);

        scape.burn(_id);

        emit Burnt(msg.sender, block.timestamp, _id, quality, gen);
    }

    function burnLegendary(uint _id) external {
        ScapeNFT scape = ScapeNFT(scapeAddress);
        require(scape.ownerOf(_id) == msg.sender, "NOT_YOURS");

        (uint quality, uint8 gen) = scape.paramsOf(_id);
        require(quality == 5, "NOT_LEGENDARY");

        burntLegendaryAmount[msg.sender]++;
        burntTotalAmount[msg.sender]++;
        burntLegendaries[msg.sender][burntLegendaryAmount[msg.sender]] = Burn(block.timestamp, _id, gen);

        scape.burn(_id);

        emit Burnt(msg.sender, block.timestamp, _id, quality, gen);
    }
}