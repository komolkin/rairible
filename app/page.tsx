"use client"

import { useState } from "react"
import { 
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from "@/components/ui/prompt-input"
import { Button } from "@/components/ui/button"
import { ArrowUp } from "lucide-react"

export default function Home() {
  const [value, setValue] = useState("")

  const handleSubmit = () => {
    if (value.trim()) {
      console.log("Submitted:", value)
      alert(`You submitted: ${value}`)
      setValue("")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <PromptInput 
          value={value} 
          onValueChange={setValue} 
          onSubmit={handleSubmit}
        >
          <PromptInputTextarea placeholder="Type your message here..." />
          <PromptInputActions className="justify-end">
            <PromptInputAction tooltip="Send message">
              <Button size="icon" className="rounded-full">
                <ArrowUp className="h-4 w-4" />
              </Button>
            </PromptInputAction>
          </PromptInputActions>
        </PromptInput>
      </div>
    </div>
  );
}
