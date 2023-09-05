export async function loadNft(network, nft) {
  try {
    const {
      data: { token },
    } = await fetch(network.graphql, {
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
                      name
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
  } catch (err) {
    return undefined;
  }
}

export async function loadOwnedNftsForAddress(network, address) {
  const {
    data: {
      tokens: { tokens },
    },
  } = await fetch(network.graphql, {
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
                      name
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

export async function getName(network, address) {
  const {
    data: { names },
  } = await fetch(network.graphql, {
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
