'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { aiApi } from '@/lib/api';
import { getInitials } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  orgId: string;
}

export function ChatInterface({ orgId }: ChatInterfaceProps) {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hi! I can help you understand your workflows, analyse data, draft emails, score leads, and more. What would you like to work on?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading || !token) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await aiApi.run(token, orgId, {
        action: 'chat',
        input: { message: text },
      });

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content:
          (res.result.message as string) ??
          (res.result.response as string) ??
          JSON.stringify(res.result, null, 2),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I ran into a problem processing that. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const userInitials = user ? getInitials(user.name) : '?';

  return (
    <div className="chat-container">
      <div className="chat-messages" aria-live="polite" aria-label="Chat messages">
        {messages.map(msg => (
          <div key={msg.id} className={`chat-message ${msg.role}`}>
            <div className="chat-avatar" aria-hidden="true">
              {msg.role === 'user' ? userInitials : '◆'}
            </div>
            <div className="chat-bubble">
              {msg.content.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < msg.content.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="chat-message assistant">
            <div className="chat-avatar" aria-hidden="true">◆</div>
            <div className="chat-bubble" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Spinner size="sm" label="AI is thinking" />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Thinking…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-row">
        <textarea
          ref={textareaRef}
          id="chat-input"
          name="chat-input"
          className="chat-input"
          placeholder="Ask anything — summarise a workflow, score a lead, draft an email…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          aria-label="Chat message input"
          disabled={isLoading}
        />
        <Button
          variant="primary"
          size="md"
          onClick={send}
          disabled={!input.trim() || isLoading}
          aria-label="Send message"
        >
          Send
        </Button>
      </div>
    </div>
  );
}
