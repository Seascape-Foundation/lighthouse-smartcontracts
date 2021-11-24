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
    invest:       '0xCd8a64e4736DeA2aFa6d2650B4354df6A82AAdDD',     // proj id 3

    mint:         '0xd542c9c0ec62c7a634A6eAEbF204EF5Ffd72c5eE'      // for testing. it includes imitating function
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

    mint: "0xd8d458C7Fc844d97ef90CCdAEddD7B2f8d066Fe0"
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