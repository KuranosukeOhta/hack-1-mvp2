'use client';

import { useChat } from 'ai/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useRef } from 'react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // メッセージが更新されたとき、または初回レンダリング時にスクロール
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto py-4 px-6">
          <h1 className="text-2xl font-semibold text-gray-800">AI Chat</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <Card className={`max-w-xl ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'}`}>
              <CardHeader className="flex flex-row items-center space-x-2 p-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={m.role === 'user' ? "/user-avatar.png" : "/ai-avatar.png"} />
                  <AvatarFallback>{m.role === 'user' ? 'U' : 'AI'}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-sm font-medium">
                  {m.role === 'user' ? 'You' : 'AI Assistant'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="whitespace-pre-wrap">{m.content}</p>
              </CardContent>
            </Card>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="bg-white border-t p-4">
        <form onSubmit={handleSubmit} className="container mx-auto flex items-center space-x-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="AIにメッセージを送信..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '送信中...' : '送信'}
          </Button>
        </form>
      </footer>
    </div>
  );
} 