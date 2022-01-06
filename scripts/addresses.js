let addresses = {
  1287: {
    crowns:       '0xFde9cad69E98b3Cc8C998a8F2094293cb0bD6911',

    tier:         '0x1bb55d99aaf303a1586114662ef74638ed9db2ee',
    tierWrapper:  '0xeFfdB75Ff90349151E100D82Dfd38fa1d7f050D2',
    
    usdc:         '0x1bc33357E79c1E69A46b69c3f6F14691164375Dd',

    project:      '0xCC084E9962eFc1f35fD18423Dc2424a0A0324f18',     // for prefund and registration.
    projectWrapper: '0xFA565e757FFE5A36Eaa623fA5353d1C70c1ab327',   // for auction and so on.

    registration: '0x908CCdD6C53deB1D14F815b178f828317e4E2943',     // v3
    prefund:      '0xC44E0A63ac50e5E58010d6aaa76579B1800914E1',     // v2
    auction:      '0xC31E7B6888d0AD6EF851Ad833Fc93E3640471E3a',     // v2

    gift:         '0x5b4a54Bf2F695A2aB20eF486EB3B5358C89A537C',     // v2
    invest:       '0xF2aa9d820C3b6c3efD10d6d51690ba6D9E9aBbCB',     // proj id 3

    mint:         '0xd542c9c0ec62c7a634A6eAEbF204EF5Ffd72c5eE',     // for testing. it includes imitating function
    burn:         '0xE7168F5E7dc7516D16476904006978345A546408'
  },
  1285: {
    usdc:         '0xE3F5a90F9cb311505cd691a46596599aA1A0AD7D',

    crowns: '0x6fc9651f45B262AE6338a701D563Ab118B1eC0Ce',

    tierWrapper: "0xbc719dc309beb82489e9a949c415e0eaed87d247",
    
    registration: "0xf102cA709bB314614167574e2965aDFcb001d3e9",
    prefund: "0x8caABAe09aaF3980A2954dB9d4F37c0FFe36E493",
    auction: "0x28788cadf01b37DA1c866c479B6809B24Ac8fD2B",

    gift: "0x2D81C6e616d1C2925Ed01f41D298BFD52f2f7ea0",
    invest: "0x32A9f8BB0bc177619c1c5C475AFd3E497288c1fd",       // MSCP ALLO

    project: "0x0395560D3b148b7b69255B87635AD01B2f761806",
    projectWrapper: "0x6749C5793d0F64D2287bEEf7D152F94B98679EE4",

    mint: "0x578Dc3b6f488e845fB2d3af73D6a61cd4D69dD09",
    burn: ""
  },
  97: {
    crowns:       '0x4Ca0ACab9f6B9C084d216F40963c070Eef95033B',

    tier: "0xd7Eb82f5AB90534dFa6922D8Ea3926F17911724E",
    tierWrapper: "0x1D4cB4EdBD484CC357606592de3c6b76A312B200",

    project: "0x790f532e7CB515066C60BE13074949aE4C90ea23",
    projectWrapper: "0x17803f649217C9cB7c6301e33BEfA946E6729950",

    registration: "0x3AfFC3A52B538f5A011dC14E97932b7fc8828Bf0",
    prefund: "0xFbc8B415c748091e6a813e13F9B21d314ED9c4e3",

  }
}

let alias = {
  TIER: 'tier',
  TIER_WRAPPER: 'tierWrapper',
  PROJECT: 'project',
  PROJECT_WRAPPER: 'projectWrapper',
  REGISTRATION: 'registration',
  PREFUND: 'prefund',
  AUCTION: 'auction',

  LIGHTHOUSE_NFT: 'gift',
  INVEST_NFT: 'invest',

  USDC: 'usdc',

  MINT: 'mint',
  BURN: 'burn',

  CROWNS: 'crowns'
}

/**
 * Throws an error if function couldn't find an address either by
 * - invalid name
 * - invalid chain ID
 * - address of smartcontract wasn't defined
 * 
 * @param {Integer} chainID 
 */
let addressOf = function(chainID, name) {
  if (addresses[chainID] === undefined) {
    throw `Invalid ${chainID} chain ID.`;
  } else if (addresses[chainID][name] === undefined) {
    throw `Invalid ${name} smartcontract alias name!`;
  } else if (addresses[chainID][name] === null) {
    throw `Smartcontract address for alias name ${name} on ${chainID} chain ID wasn't defined!`;
  }

  return addresses[chainID][name];
}

module.exports = {
  addresses: addresses,
  addressOf: addressOf,
  alias: alias
}