export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: Message[];
}

export interface ChatResponse {
  message: string;
  error?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema?: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}
