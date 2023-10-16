module.exports = {
  mainnet: {
    id: "mainnet",
    contract:
      "stars1eh58m7augmf7777k0kcgxwetse3tnsa6n7kwn458lfdv0zzknu2sgde4kq",
    admin: "stars1xy2at2a0qeehv9ccptt8f879nxmrl35xsasvpv",
    url: "https://rpc-stargaze.pupmos.network",
    mnemonic: process.env.MNEMONIC_MAINNET,
    graphql: "https://graphql.mainnet.stargaze-apis.com/graphql",
  },
  // testnet: {
  //   id: "testnet",
  //   contract:
  //     "stars1j64pe4hsr6ptmleapqnax7fdl39a0nw0dwayvgz0d7cmkaezyuzst0n7us",
  //   admin: "stars17cv7tkzteht4pxggrgf3jynstsasdf8pv07d3z",
  //   url: "https://rpc.elgafar-1.stargaze-apis.com",
  //   mnemonic: process.env.MNEMONIC,
  // graphql: "https://graphql.mainnet.stargaze-apis.com/graphql",
  // },
};
