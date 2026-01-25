import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Send, Bot, User } from 'lucide-react';
import { cn } from '../lib/utils';

interface Message {
    role: 'agent' | 'user';
    text: string;
}

interface ChatProps {
    messages: Message[];
    onSendMessage: (text: string) => void;
    isLoading: boolean;
}

export function Chat({ messages, onSendMessage, isLoading }: ChatProps) {
    const [input, setInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        onSendMessage(input);
        setInput('');
    };

    return (
        <Card className="flex flex-col h-full border-0 shadow-none bg-transparent lg:bg-white lg:border lg:shadow-sm overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "flex w-full",
                            msg.role === 'user' ? "justify-end" : "justify-start"
                        )}
                    >
                        <div className={cn(
                            "flex max-w-[85%] gap-2",
                            msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                        )}>
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                msg.role === 'user' ? "bg-slate-900" : "bg-blue-100 text-blue-600"
                            )}>
                                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} />}
                            </div>
                            <div className={cn(
                                "p-3 rounded-2xl text-sm shadow-sm",
                                msg.role === 'user'
                                    ? "bg-slate-900 text-slate-50 rounded-tr-none"
                                    : "bg-white border text-slate-900 rounded-tl-none"
                            )}>
                                {msg.text}
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="p-3 bg-slate-50 border rounded-2xl rounded-tl-none flex items-center gap-2">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about your expenses..."
                        className="flex-1 h-10 px-4 rounded-full border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                    />
                    <Button type="submit" size="icon" className="rounded-full" disabled={isLoading}>
                        <Send size={18} />
                    </Button>
                </div>
            </form>
        </Card>
    );
}
