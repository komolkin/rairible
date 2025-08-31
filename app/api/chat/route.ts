import { NextRequest, NextResponse } from "next/server";
import { ChatRequest, ChatResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const body: ChatRequest = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Build conversation context from history
    let conversationContext = "";
    if (conversationHistory.length > 0) {
      conversationContext =
        conversationHistory
          .map((msg) => `${msg.role}: ${msg.content}`)
          .join("\n") + "\n";
    }

    const fullInput = conversationContext + `user: ${message}`;

    console.log("Using OpenAI Responses API with Rarible MCP server");

    // Use OpenAI Responses API with MCP server directly (as shown in the example)
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Use a model that supports MCP
        tools: [
          {
            type: "mcp",
            server_label: "rarible-protocol",
            server_url: "https://mcp.icpaidev.space/sse",
            require_approval: "never",
          },
        ],
        input: fullInput,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI Responses API error:", response.status, errorText);
      throw new Error(
        `OpenAI Responses API error: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    console.log("OpenAI Responses API result:", data);

    let responseMessage = "";

    // Extract the user-friendly message from the response
    if (data.output && Array.isArray(data.output)) {
      // Find the assistant message in the output
      const assistantMessage = data.output.find(
        (item: any) =>
          item.type === "message" &&
          item.role === "assistant" &&
          item.content &&
          Array.isArray(item.content)
      );

      if (assistantMessage) {
        responseMessage = assistantMessage.content
          .filter((item: any) => item.type === "output_text")
          .map((item: any) => item.text)
          .join(" ");
      }
    }

    // Fallback to other response formats
    if (!responseMessage) {
      if (data.content && Array.isArray(data.content)) {
        responseMessage = data.content
          .filter((item: any) => item.type === "text")
          .map((item: any) => item.text)
          .join(" ");
      } else if (data.message) {
        responseMessage = data.message;
      } else if (data.choices && data.choices[0]?.message?.content) {
        responseMessage = data.choices[0].message.content;
      } else if (typeof data === "string") {
        responseMessage = data;
      }
    }

    if (!responseMessage) {
      responseMessage =
        "I'm sorry, I couldn't generate a response. Please try again.";
    }

    const chatResponse: ChatResponse = {
      message: responseMessage,
    };

    return NextResponse.json(chatResponse);
  } catch (error) {
    console.error("Chat API error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: `Failed to process chat request: ${errorMessage}` },
      { status: 500 }
    );
  }
}
