"use client";

import { useState, useRef, useEffect } from "react";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from "@/components/ui/prompt-input";
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ui/message";
import { Button } from "@/components/ui/button";
import { ArrowUp, Loader2, User, Bot } from "lucide-react";
import { Message as MessageType, ChatRequest, ChatResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function Home() {
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async () => {
    if (!value.trim() || isLoading) return;

    const userMessage: MessageType = {
      id: Date.now().toString(),
      role: "user",
      content: value,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setValue("");
    setIsLoading(true);

    try {
      const chatRequest: ChatRequest = {
        message: value,
        conversationHistory: messages,
      };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatRequest),
      });

      const data: ChatResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const assistantMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${
          error instanceof Error ? error.message : "Something went wrong"
        }`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <h1 className="text-xl font-semibold">NFT Market Analyst</h1>
        <p className="text-sm text-muted-foreground">
          Real-time NFT analytics powered by Rarible Protocol
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Bot className="h-16 w-16 mx-auto mb-6 opacity-40" />
            <h3 className="text-lg font-medium mb-2">NFT Market Analyst</h3>
            <p className="text-sm">
              Your expert NFT analyst powered by Rarible Protocol
            </p>
            <p className="text-xs mt-2 opacity-70">
              Ask about collection stats, floor prices, trading activities, or
              market trends
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <Message
              key={message.id}
              className={message.role === "user" ? "justify-end" : ""}
            >
              {message.role === "assistant" && (
                <MessageAvatar
                  src=""
                  alt="Assistant"
                  fallback={<Bot className="h-4 w-4" />}
                />
              )}
              <MessageContent
                markdown
                className={cn(
                  message.role === "user"
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-muted/50"
                )}
              >
                {message.content}
              </MessageContent>
              {message.role === "user" && (
                <MessageAvatar
                  src=""
                  alt="User"
                  fallback={<User className="h-4 w-4" />}
                />
              )}
            </Message>
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <Message>
            <MessageAvatar
              src=""
              alt="Assistant"
              fallback={<Bot className="h-4 w-4" />}
            />
            <MessageContent className="bg-muted/30">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Analyzing with Rarible tools...</span>
              </div>
            </MessageContent>
          </Message>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="max-w-2xl mx-auto">
          <PromptInput
            value={value}
            onValueChange={setValue}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          >
            <PromptInputTextarea
              placeholder="Ask about NFT collections, floor prices, market trends..."
              disabled={isLoading}
            />
            <PromptInputActions className="justify-end">
              <PromptInputAction tooltip="Send message">
                <Button
                  size="icon"
                  className="rounded-full cursor-pointer"
                  disabled={isLoading || !value.trim()}
                  onClick={handleSubmit}
                  type="button"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </Button>
              </PromptInputAction>
            </PromptInputActions>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
