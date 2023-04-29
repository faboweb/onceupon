// const graphql = 'https://galaxy-graphql-testnet.fly.dev'
const graphql = "https://graphql.stargaze-apis.com";

export async function loadNft(nft) {
  const {
    data: { token },
  } = await fetch(graphql, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
              query TokenMedia($collectionAddr: String!, $tokenId: String!, $size: ImageSize) {
                token(collectionAddr: $collectionAddr, tokenId: $tokenId) {
                  media {
                    image(size: $size) {
                      height
                      width
                      jpgLink
                      isAnimated
                    }
                  }
                  name
                  tokenId
                  collection {
                    contractAddress
                  }
                }
              }
            `,
      variables: {
        collectionAddr: nft.contract_address,
        tokenId: nft.token_id,
        size: "MD",
      },
    }),
  }).then((res) => res.json());

  return token;
}

export async function loadNftsForAddress(address) {
  const {
    data: {
      tokens: { tokens },
    },
  } = await fetch(graphql, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
              query Media($owner: String, $size: ImageSize) {
                tokens(owner: $owner, limit: 1000) {
                  tokens {
                    media {
                      image(size: $size) {
                        height
                        width
                        jpgLink
                        isAnimated
                      }
                    }
                    name
                    tokenId
                    collection {
                      contractAddress
                    }
                  }
                }
              }
            `,
      variables: {
        owner: address,
        size: "MD",
      },
    }),
  }).then((res) => res.json());

  return tokens;
}

export async function getName(address) {
  const {
    data: { names },
  } = await fetch(graphql, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
              query Name($associatedAddr: String) {
                names(associatedAddr: $associatedAddr) {
                  names {
                    image
                    name
                  }
                }
              }     
            `,
      variables: {
        associatedAddr: address,
      },
    }),
  }).then((res) => res.json());

  return names.names[0];
}
