// Rarible SDK tools for OpenAI function calling
// Since the MCP server isn't providing tools, we'll create our own using the Rarible API

export interface RaribleToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

// Define comprehensive Rarible tools that we can implement
export const RARIBLE_TOOLS: RaribleToolDefinition[] = [
  {
    name: "get_collection_floor_price",
    description: "Get the floor price of an NFT collection",
    parameters: {
      type: "object",
      properties: {
        collection: {
          type: "string",
          description:
            "The name or contract address of the NFT collection (e.g. 'doodles', 'bored-ape-yacht-club')",
        },
        blockchain: {
          type: "string",
          enum: ["ethereum", "polygon", "flow", "tezos"],
          description: "The blockchain network (defaults to ethereum)",
        },
      },
      required: ["collection"],
    },
  },
  {
    name: "get_nft_info",
    description: "Get detailed information about a specific NFT",
    parameters: {
      type: "object",
      properties: {
        contract: {
          type: "string",
          description: "The contract address of the NFT",
        },
        tokenId: {
          type: "string",
          description: "The token ID of the NFT",
        },
        blockchain: {
          type: "string",
          enum: ["ethereum", "polygon", "flow", "tezos"],
          description: "The blockchain network (defaults to ethereum)",
        },
      },
      required: ["contract", "tokenId"],
    },
  },
  {
    name: "search_nfts",
    description: "Search for NFTs by name, collection, or other criteria",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (collection name, NFT name, etc.)",
        },
        size: {
          type: "number",
          description: "Number of results to return (default: 10, max: 50)",
        },
        blockchain: {
          type: "string",
          enum: ["ethereum", "polygon", "flow", "tezos"],
          description: "The blockchain network (defaults to ethereum)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_collection_stats",
    description:
      "Get statistics for an NFT collection including volume, sales, etc.",
    parameters: {
      type: "object",
      properties: {
        collection: {
          type: "string",
          description: "The contract address or slug of the NFT collection",
        },
        blockchain: {
          type: "string",
          enum: ["ethereum", "polygon", "flow", "tezos"],
          description: "The blockchain network (defaults to ethereum)",
        },
      },
      required: ["collection"],
    },
  },
  {
    name: "get_collection_activities",
    description: "Get recent trading activities for an NFT collection",
    parameters: {
      type: "object",
      properties: {
        collection: {
          type: "string",
          description: "The contract address of the NFT collection",
        },
        activityType: {
          type: "string",
          enum: ["SELL", "BID", "MINT", "TRANSFER", "BURN"],
          description: "Type of activity to filter (defaults to SELL)",
        },
        size: {
          type: "number",
          description: "Number of activities to return (default: 10, max: 100)",
        },
        blockchain: {
          type: "string",
          enum: ["ethereum", "polygon", "flow", "tezos"],
          description: "The blockchain network (defaults to ethereum)",
        },
      },
      required: ["collection"],
    },
  },
  {
    name: "get_nft_ownership",
    description: "Get ownership information for a specific NFT",
    parameters: {
      type: "object",
      properties: {
        contract: {
          type: "string",
          description: "The contract address of the NFT",
        },
        tokenId: {
          type: "string",
          description: "The token ID of the NFT",
        },
        blockchain: {
          type: "string",
          enum: ["ethereum", "polygon", "flow", "tezos"],
          description: "The blockchain network (defaults to ethereum)",
        },
      },
      required: ["contract", "tokenId"],
    },
  },
  {
    name: "get_user_nfts",
    description: "Get NFTs owned by a specific wallet address",
    parameters: {
      type: "object",
      properties: {
        owner: {
          type: "string",
          description: "The wallet address of the NFT owner",
        },
        size: {
          type: "number",
          description: "Number of NFTs to return (default: 20, max: 100)",
        },
        blockchain: {
          type: "string",
          enum: ["ethereum", "polygon", "flow", "tezos"],
          description: "The blockchain network (defaults to ethereum)",
        },
      },
      required: ["owner"],
    },
  },
  {
    name: "get_collection_items",
    description: "Get items/NFTs from a specific collection",
    parameters: {
      type: "object",
      properties: {
        collection: {
          type: "string",
          description: "The contract address of the NFT collection",
        },
        size: {
          type: "number",
          description: "Number of items to return (default: 20, max: 100)",
        },
        blockchain: {
          type: "string",
          enum: ["ethereum", "polygon", "flow", "tezos"],
          description: "The blockchain network (defaults to ethereum)",
        },
      },
      required: ["collection"],
    },
  },
  {
    name: "get_nft_orders",
    description: "Get current buy/sell orders for a specific NFT",
    parameters: {
      type: "object",
      properties: {
        contract: {
          type: "string",
          description: "The contract address of the NFT",
        },
        tokenId: {
          type: "string",
          description: "The token ID of the NFT",
        },
        orderType: {
          type: "string",
          enum: ["SELL", "BID"],
          description: "Type of orders to retrieve (defaults to SELL)",
        },
        blockchain: {
          type: "string",
          enum: ["ethereum", "polygon", "flow", "tezos"],
          description: "The blockchain network (defaults to ethereum)",
        },
      },
      required: ["contract", "tokenId"],
    },
  },
  {
    name: "get_trending_collections",
    description: "Get trending NFT collections by volume or activity",
    parameters: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["1h", "6h", "24h", "7d", "30d"],
          description: "Time period for trending analysis (defaults to 24h)",
        },
        size: {
          type: "number",
          description: "Number of collections to return (default: 10, max: 50)",
        },
        blockchain: {
          type: "string",
          enum: ["ethereum", "polygon", "flow", "tezos"],
          description: "The blockchain network (defaults to ethereum)",
        },
      },
    },
  },
];

// Convert Rarible tools to OpenAI function format
export function getRaribleToolsForOpenAI() {
  return RARIBLE_TOOLS.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}
