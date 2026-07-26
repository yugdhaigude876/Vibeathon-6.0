'use client'

import { useMemo, useState } from 'react'
import { Bot, Loader2, Send, Sparkles, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface Message {
  id: number
  role: 'assistant' | 'user'
  content: string
}

interface AIAssistantProps {
  role?: 'customer' | 'manager' | string | null
}

const customerSuggestions = [
  'Recommend something spicy from Asian Tapas',
  'What are the best vegetarian dishes under ₹600?',
  'Suggest a pairing for Butter Chicken Tacos',
]

const managerSuggestions = [
  "What's popular today?",
  'Give me a stock reorder warning',
  'What should I focus on during the next peak hour?',
]

export function AIAssistant({ role }: AIAssistantProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: 'Hi! I am your PLATR AI Concierge. Ask me anything about our official Luft Menu or dining recommendations!',
    },
  ])
  const [loading, setLoading] = useState(false)

  const mode = role === 'manager' ? 'manager' : 'customer'
  const suggestions = mode === 'manager' ? managerSuggestions : customerSuggestions

  const sendMessage = async (promptOverride?: string) => {
    const prompt = (promptOverride ?? input).trim()
    if (!prompt) return

    const nextUserMessage: Message = { id: Date.now(), role: 'user', content: prompt }
    setMessages((current) => [...current, nextUserMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context: mode }),
      })

      const rawText = await response.text()
      let data: any = {}
      try {
        data = JSON.parse(rawText)
      } catch (e) {
        data = { response: 'The AI assistant is ready. Please log in or refresh your session to start chatting.' }
      }

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response || data.debugError || data.error || 'I could not generate a response right now.',
      }
      setMessages((current) => [...current, assistantMessage])
    } catch (error: any) {
      setMessages((current) => [
        ...current,
        { id: Date.now() + 2, role: 'assistant', content: `Error: ${error?.message || 'The assistant encountered a connection issue.'}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  const headerLabel = mode === 'manager' ? 'Manager Insights' : 'AI Dish Assistant'

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-amber-500 p-0 text-zinc-950 shadow-xl hover:bg-amber-400"
        aria-label="Open AI assistant"
      >
        <Sparkles className="h-6 w-6" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl border-zinc-800 bg-zinc-950 p-0">
          <DialogHeader className="border-b border-zinc-800 px-5 py-4">
            <DialogTitle className="flex items-center gap-2 text-zinc-100">
              <Bot className="h-5 w-5 text-amber-400" />
              {headerLabel}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {mode === 'manager'
                ? 'Get quick operational advice for staffing, stock, and service pacing.'
                : 'Find recommendations that fit taste, diet, and budget.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex h-[480px] flex-col px-5 py-4">
            <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[85%] gap-2 rounded-2xl px-3 py-2 ${message.role === 'user' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-900 text-zinc-100'}`}>
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800/70">
                      {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-amber-400" />}
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                  </div>
                </div>
              ))}

              {loading ? (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
                    <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                    Thinking...
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                  onClick={() => void sendMessage(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={mode === 'manager' ? 'Ask about today’s service or stock...' : 'Ask for a recommendation...'}
                className="border-zinc-800 bg-zinc-900 text-zinc-100"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void sendMessage()
                  }
                }}
              />
              <Button type="button" onClick={() => void sendMessage()} className="bg-amber-500 text-zinc-950 hover:bg-amber-400">
                <Send className="mr-2 h-4 w-4" />
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
