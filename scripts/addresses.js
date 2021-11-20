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
    auction:      '0xdd4e4E031Ff39447982b1C9BC1074809Dd3C138C',     // v2

    gift:         '0x5b4a54Bf2F695A2aB20eF486EB3B5358C89A537C',     // v2
    invest:       '0x809A4f9c16210838db01640f5A8EB00795483578',     // proj id 3

    mint:         '0x3a0D166079836C867D92c8b503eD33e4355a2Ab6'      // for testing. it includes imitating function
  },
  1285: {
    crowns: '0x6fc9651f45B262AE6338a701D563Ab118B1eC0Ce',

    tierWrapper: "0xbc719dc309beb82489e9a949c415e0eaed87d247",
    
    prefund: "0x8caABAe09aaF3980A2954dB9d4F37c0FFe36E493",

    project: "0x0395560D3b148b7b69255B87635AD01B2f761806"
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