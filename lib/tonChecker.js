const TonWeb = require("tonweb");
const { Address } = require("ton");

class NFTChecker {
  constructor(apiEndpoint, apiKey, collectionAddress) {
    this.tonweb = new TonWeb(
      new TonWeb.HttpProvider(apiEndpoint, {
        apiKey: apiKey,
      })
    );
    this.collectionAddress = collectionAddress;
  }

  async checkNFT(walletAddress) {
    try {
      if (!this.isValidAddress(walletAddress)) {
        throw new Error("Invalid wallet address format");
      }

      const accountInfo = await this.tonweb.provider.getAddressInfo(
        walletAddress
      );
      if (!accountInfo || accountInfo.state !== "active") {
        return false;
      }

      const response = await this.tonweb.provider.request(
        "getNftItemsByOwnerAddress",
        { ownerAddress: walletAddress }
      );

      if (
        !response ||
        !response.nft_items ||
        !Array.isArray(response.nft_items)
      ) {
        return false;
      }

      return response.nft_items.some(
        (item) => item.collection?.address === this.collectionAddress
      );
    } catch (error) {
      console.error("Error checking NFT ownership:", error);
      throw error;
    }
  }

  isValidAddress(address) {
    try {
      new Address(address);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = { NFTChecker };

