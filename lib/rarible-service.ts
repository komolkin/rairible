// Rarible API service for implementing tool functions

interface RaribleAPIResponse<T = any> {
  data?: T;
  error?: string;
}

// Base Rarible API URL
const RARIBLE_API_BASE = "https://api.rarible.org/v0.1";

async function makeRaribleAPICall(endpoint: string): Promise<any> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add API key if available
    if (
      process.env.RARIBLE_API_KEY &&
      process.env.RARIBLE_API_KEY !== "your_rarible_api_key_here"
    ) {
      headers["X-API-KEY"] = process.env.RARIBLE_API_KEY;
    }

    const response = await fetch(`${RARIBLE_API_BASE}${endpoint}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(
        `Rarible API error: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Rarible API call error:", error);
    throw error;
  }
}

export async function getCollectionFloorPrice(
  collection: string,
  blockchain: string = "ethereum"
): Promise<RaribleAPIResponse> {
  try {
    console.log(
      `Getting floor price for collection: ${collection} on ${blockchain}`
    );

    // Normalize collection identifier
    let collectionId = collection;
    if (!collection.includes(":")) {
      collectionId = `${blockchain.toUpperCase()}:${collection}`;
    }

    console.log(`Using collection ID: ${collectionId}`);

    // Get recent sales to calculate floor price
    const activities = await makeRaribleAPICall(
      `/activities/byCollection?type=SELL&collection=${collectionId}&size=20`
    );

    if (!activities.activities || activities.activities.length === 0) {
      return { error: `No recent sales found for collection ${collection}` };
    }

    // Calculate floor price from recent sales
    console.log(`Found ${activities.activities.length} recent activities`);

    const validPrices = [];
    for (const activity of activities.activities) {
      console.log("Activity:", JSON.stringify(activity, null, 2));

      if (activity.price) {
        let priceValue = 0;

        // Handle different price formats
        if (typeof activity.price === "string") {
          priceValue = parseFloat(activity.price);
        } else if (activity.price.value) {
          priceValue = parseFloat(activity.price.value);
        } else if (activity.price.amount) {
          priceValue = parseFloat(activity.price.amount);
        }

        // Convert from wei to ETH if needed (values > 1000 are likely in wei)
        if (priceValue > 1000) {
          priceValue = priceValue / 1e18;
        }

        if (!isNaN(priceValue) && priceValue > 0) {
          validPrices.push(priceValue);
          console.log(`Valid price found: ${priceValue} ETH`);
        }
      }
    }

    if (validPrices.length === 0) {
      return {
        error: `No valid price data found for collection ${collection}. Found ${activities.activities.length} activities but no parseable prices.`,
      };
    }

    validPrices.sort((a, b) => a - b);
    const floorPrice = validPrices[0];
    const averagePrice =
      validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length;

    // Also get some items from the collection for additional info
    const items = await makeRaribleAPICall(
      `/items/byCollection?collection=${collectionId}&size=5`
    );

    return {
      data: {
        collection: collection,
        collectionId: collectionId,
        blockchain: blockchain.toUpperCase(),
        floorPrice: floorPrice.toFixed(4),
        averagePrice: averagePrice.toFixed(4),
        currency: "ETH",
        recentSales: activities.activities.length,
        totalItems: items.items?.length || 0,
        priceRange: {
          min: validPrices[0].toFixed(4),
          max: validPrices[validPrices.length - 1].toFixed(4),
        },
      },
    };
  } catch (error) {
    console.error("Error getting collection floor price:", error);
    return {
      error: `Failed to get floor price for ${collection}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

export async function getNFTInfo(
  contract: string,
  tokenId: string,
  blockchain: string = "ethereum"
): Promise<RaribleAPIResponse> {
  try {
    console.log(`Getting NFT info for ${contract}:${tokenId} on ${blockchain}`);

    const itemId = `${blockchain.toUpperCase()}:${contract}:${tokenId}`;
    const nftData = await makeRaribleAPICall(`/items/${itemId}`);

    return {
      data: {
        id: nftData.id,
        name: nftData.meta?.name || "Unknown",
        description: nftData.meta?.description || "",
        image: nftData.meta?.image || "",
        owner: nftData.owners?.[0] || "Unknown",
        creator: nftData.creators?.[0]?.account || "Unknown",
        lastPrice: nftData.lastSale?.price || "Not sold",
        currency: nftData.lastSale?.currency || "",
        blockchain: blockchain,
      },
    };
  } catch (error) {
    console.error("Error getting NFT info:", error);
    return {
      error: `Failed to get NFT info: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

export async function searchNFTs(
  query: string,
  size: number = 10,
  blockchain: string = "ethereum"
): Promise<RaribleAPIResponse> {
  try {
    console.log(`Searching NFTs for: ${query} on ${blockchain}`);

    const searchData = await makeRaribleAPICall(
      `/items/search?text=${encodeURIComponent(
        query
      )}&size=${size}&blockchain=${blockchain.toUpperCase()}`
    );

    const results =
      searchData.items?.map((item: any) => ({
        id: item.id,
        name: item.meta?.name || "Unknown",
        collection: item.collection || "Unknown",
        price: item.bestSellOrder?.price || "Not listed",
        currency: item.bestSellOrder?.currency || "",
        image: item.meta?.image || "",
      })) || [];

    return {
      data: {
        query: query,
        results: results,
        total: searchData.total || 0,
        blockchain: blockchain,
      },
    };
  } catch (error) {
    console.error("Error searching NFTs:", error);
    return {
      error: `Failed to search NFTs: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

export async function getCollectionStats(
  collection: string,
  blockchain: string = "ethereum"
): Promise<RaribleAPIResponse> {
  try {
    console.log(`Getting stats for collection: ${collection} on ${blockchain}`);

    const stats = await makeRaribleAPICall(
      `/collections/${blockchain}:${collection}/stats`
    );

    return {
      data: {
        collection: collection,
        blockchain: blockchain,
        floorPrice: stats?.floorPrice || "Not available",
        volume24h: stats?.volume24h || "Not available",
        volume7d: stats?.volume7d || "Not available",
        volume30d: stats?.volume30d || "Not available",
        totalVolume: stats?.totalVolume || "Not available",
        owners: stats?.owners || "Not available",
        totalSupply: stats?.totalSupply || "Not available",
        averagePrice: stats?.averagePrice || "Not available",
      },
    };
  } catch (error) {
    console.error("Error getting collection stats:", error);
    return {
      error: `Failed to get collection stats: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

export async function getCollectionActivities(
  collection: string,
  activityType: string = "SELL",
  size: number = 10,
  blockchain: string = "ethereum"
): Promise<RaribleAPIResponse> {
  try {
    console.log(
      `Getting ${activityType} activities for collection: ${collection} on ${blockchain}`
    );

    let collectionId = collection;
    if (!collection.includes(":")) {
      collectionId = `${blockchain.toUpperCase()}:${collection}`;
    }

    const activities = await makeRaribleAPICall(
      `/activities/byCollection?type=${activityType}&collection=${collectionId}&size=${size}`
    );

    const formattedActivities =
      activities.activities?.map((activity: any) => ({
        id: activity.id,
        type: activity["@type"],
        date: activity.date,
        price: activity.price,
        priceUsd: activity.priceUsd,
        nft: {
          contract: activity.nft?.type?.contract,
          tokenId: activity.nft?.type?.tokenId,
        },
        buyer: activity.buyer,
        seller: activity.seller,
        source: activity.source,
      })) || [];

    return {
      data: {
        collection: collection,
        activityType: activityType,
        activities: formattedActivities,
        total: activities.activities?.length || 0,
        blockchain: blockchain.toUpperCase(),
      },
    };
  } catch (error) {
    console.error("Error getting collection activities:", error);
    return {
      error: `Failed to get activities for ${collection}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

export async function getNFTOwnership(
  contract: string,
  tokenId: string,
  blockchain: string = "ethereum"
): Promise<RaribleAPIResponse> {
  try {
    console.log(
      `Getting ownership for NFT ${contract}:${tokenId} on ${blockchain}`
    );

    const itemId = `${blockchain.toUpperCase()}:${contract}:${tokenId}`;
    const nftData = await makeRaribleAPICall(`/items/${itemId}`);

    return {
      data: {
        contract: contract,
        tokenId: tokenId,
        blockchain: blockchain.toUpperCase(),
        owners: nftData.owners || [],
        supply: nftData.supply || "1",
        lazySupply: nftData.lazySupply || "0",
        creators: nftData.creators || [],
        royalties: nftData.royalties || [],
      },
    };
  } catch (error) {
    console.error("Error getting NFT ownership:", error);
    return {
      error: `Failed to get ownership info: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

export async function getUserNFTs(
  owner: string,
  size: number = 20,
  blockchain: string = "ethereum"
): Promise<RaribleAPIResponse> {
  try {
    console.log(`Getting NFTs for owner: ${owner} on ${blockchain}`);

    let ownerId = owner;
    if (!owner.includes(":")) {
      ownerId = `${blockchain.toUpperCase()}:${owner}`;
    }

    const items = await makeRaribleAPICall(
      `/items/byOwner?owner=${ownerId}&size=${size}`
    );

    const formattedItems =
      items.items?.map((item: any) => ({
        id: item.id,
        name: item.meta?.name || "Unknown",
        description: item.meta?.description || "",
        image: item.meta?.image || "",
        collection: item.collection,
        supply: item.supply,
        lastPrice: item.lastSale?.price || "Not sold",
      })) || [];

    return {
      data: {
        owner: owner,
        blockchain: blockchain.toUpperCase(),
        items: formattedItems,
        total: items.items?.length || 0,
      },
    };
  } catch (error) {
    console.error("Error getting user NFTs:", error);
    return {
      error: `Failed to get NFTs for owner: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

export async function getCollectionItems(
  collection: string,
  size: number = 20,
  blockchain: string = "ethereum"
): Promise<RaribleAPIResponse> {
  try {
    console.log(`Getting items for collection: ${collection} on ${blockchain}`);

    let collectionId = collection;
    if (!collection.includes(":")) {
      collectionId = `${blockchain.toUpperCase()}:${collection}`;
    }

    const items = await makeRaribleAPICall(
      `/items/byCollection?collection=${collectionId}&size=${size}`
    );

    const formattedItems =
      items.items?.map((item: any) => ({
        id: item.id,
        name: item.meta?.name || "Unknown",
        description: item.meta?.description || "",
        image: item.meta?.image || "",
        tokenId: item.tokenId,
        supply: item.supply,
        owners: item.owners,
        bestSellOrder: item.bestSellOrder
          ? {
              price: item.bestSellOrder.makePrice,
              currency: item.bestSellOrder.make?.type?.contract,
            }
          : null,
      })) || [];

    return {
      data: {
        collection: collection,
        blockchain: blockchain.toUpperCase(),
        items: formattedItems,
        total: items.items?.length || 0,
      },
    };
  } catch (error) {
    console.error("Error getting collection items:", error);
    return {
      error: `Failed to get collection items: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

export async function getNFTOrders(
  contract: string,
  tokenId: string,
  orderType: string = "SELL",
  blockchain: string = "ethereum"
): Promise<RaribleAPIResponse> {
  try {
    console.log(
      `Getting ${orderType} orders for NFT ${contract}:${tokenId} on ${blockchain}`
    );

    const itemId = `${blockchain.toUpperCase()}:${contract}:${tokenId}`;
    const orders = await makeRaribleAPICall(
      `/orders/byItem?itemId=${itemId}&size=20`
    );

    const filteredOrders =
      orders.orders?.filter((order: any) =>
        orderType === "SELL"
          ? order.make?.type?.contract === contract
          : order.take?.type?.contract === contract
      ) || [];

    const formattedOrders = filteredOrders.map((order: any) => ({
      id: order.id,
      type: order.type,
      maker: order.maker,
      price: order.makePrice || order.takePrice,
      currency: order.make?.type?.contract || order.take?.type?.contract,
      startedAt: order.startedAt,
      endedAt: order.endedAt,
      status: order.status,
    }));

    return {
      data: {
        contract: contract,
        tokenId: tokenId,
        orderType: orderType,
        blockchain: blockchain.toUpperCase(),
        orders: formattedOrders,
        total: formattedOrders.length,
      },
    };
  } catch (error) {
    console.error("Error getting NFT orders:", error);
    return {
      error: `Failed to get NFT orders: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

export async function getTrendingCollections(
  period: string = "24h",
  size: number = 10,
  blockchain: string = "ethereum"
): Promise<RaribleAPIResponse> {
  try {
    console.log(
      `Getting trending collections for period: ${period} on ${blockchain}`
    );

    // Since we can't get general activities, use known popular collections
    const popularCollections = [
      "ETHEREUM:0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d", // BAYC
      "ETHEREUM:0x60e4d786628fea6478f785a6d7e704777c86a7c6", // MAYC
      "ETHEREUM:0x8a90cab2b38dba80c64b7734e58ee1db38b8992e", // Doodles
      "ETHEREUM:0x23581767a106ae21c074b2276d25e5c3e136a68b", // Moonbirds
      "ETHEREUM:0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b", // CloneX
    ];

    const collectionStats = [];

    for (const collectionId of popularCollections.slice(0, size)) {
      try {
        // Get recent activities for each collection
        const activities = await makeRaribleAPICall(
          `/activities/byCollection?type=SELL&collection=${collectionId}&size=20`
        );

        if (activities.activities && activities.activities.length > 0) {
          const prices = activities.activities
            .filter((activity: any) => activity.price)
            .map((activity: any) => parseFloat(activity.price))
            .filter((price: number) => !isNaN(price));

          const volumes = activities.activities
            .filter((activity: any) => activity.priceUsd)
            .map((activity: any) => parseFloat(activity.priceUsd))
            .filter((vol: number) => !isNaN(vol));

          const totalVolume = volumes.reduce((sum, vol) => sum + vol, 0);
          const floorPrice = prices.length > 0 ? Math.min(...prices) : 0;

          collectionStats.push({
            collection: collectionId,
            name: collectionId.split(":")[1].substring(0, 10) + "...", // Truncated address
            volume24h: totalVolume,
            sales: activities.activities.length,
            floorPrice:
              floorPrice > 0 ? floorPrice.toFixed(4) : "Not available",
            currency: "ETH",
          });
        }
      } catch (collectionError) {
        console.log(`Failed to get data for ${collectionId}:`, collectionError);
        continue;
      }
    }

    // Sort by volume
    collectionStats.sort((a, b) => b.volume24h - a.volume24h);

    return {
      data: {
        period: period,
        blockchain: blockchain.toUpperCase(),
        collections: collectionStats,
        total: collectionStats.length,
        note: "Based on recent activity from popular collections",
      },
    };
  } catch (error) {
    console.error("Error getting trending collections:", error);
    return {
      error: `Failed to get trending collections: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

// Tool execution function
export async function executeRaribleTool(
  toolName: string,
  parameters: any
): Promise<any> {
  switch (toolName) {
    case "get_collection_floor_price":
      return await getCollectionFloorPrice(
        parameters.collection,
        parameters.blockchain
      );

    case "get_nft_info":
      return await getNFTInfo(
        parameters.contract,
        parameters.tokenId,
        parameters.blockchain
      );

    case "search_nfts":
      return await searchNFTs(
        parameters.query,
        parameters.size,
        parameters.blockchain
      );

    case "get_collection_stats":
      return await getCollectionStats(
        parameters.collection,
        parameters.blockchain
      );

    case "get_collection_activities":
      return await getCollectionActivities(
        parameters.collection,
        parameters.activityType,
        parameters.size,
        parameters.blockchain
      );

    case "get_nft_ownership":
      return await getNFTOwnership(
        parameters.contract,
        parameters.tokenId,
        parameters.blockchain
      );

    case "get_user_nfts":
      return await getUserNFTs(
        parameters.owner,
        parameters.size,
        parameters.blockchain
      );

    case "get_collection_items":
      return await getCollectionItems(
        parameters.collection,
        parameters.size,
        parameters.blockchain
      );

    case "get_nft_orders":
      return await getNFTOrders(
        parameters.contract,
        parameters.tokenId,
        parameters.orderType,
        parameters.blockchain
      );

    case "get_trending_collections":
      return await getTrendingCollections(
        parameters.period,
        parameters.size,
        parameters.blockchain
      );

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}
