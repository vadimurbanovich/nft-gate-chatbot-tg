const fetch = require("node-fetch");

class NFTChecker {
  constructor(collectionAddress) {
    this.collectionAddress = collectionAddress;
    this.graphqlEndpoint = "https://api.getgems.io/graphql";
  }

  async checkNFT(walletAddress) {
    let hasNextPage = true;
    let afterCursor = null;

    try {
      while (hasNextPage) {
        const query = `
          query {
            nftItemsByOwner(ownerAddress: "${walletAddress}", first: 50, after: ${
          afterCursor ? `"${afterCursor}"` : null
        }) {
              items {
                address
                collection {
                  address
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        `;

        const response = await fetch(this.graphqlEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
        });

        const data = await response.json();

        if (data.errors) {
          console.error("GraphQL Error:", data.errors);
          return false;
        }

        const nftItems = data.data.nftItemsByOwner.items;

        if (!nftItems || nftItems.length === 0) {
          return false;
        }

        const hasMatchingNFT = nftItems.some(
          (item) => item.collection.address === this.collectionAddress
        );

        if (hasMatchingNFT) {
          return true;
        }

        const pageInfo = data.data.nftItemsByOwner.pageInfo;
        hasNextPage = pageInfo.hasNextPage;
        afterCursor = pageInfo.endCursor;
      }

      return false;
    } catch (error) {
      console.error("Ошибка при проверке NFT:", error.message);
      throw error;
    }
  }
}

module.exports = { NFTChecker };
