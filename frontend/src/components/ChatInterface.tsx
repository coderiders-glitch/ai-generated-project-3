import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendChatMessage(inputText);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.sender}`}>
            <div className="message-content">{message.text}</div>
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant loading">
            <div className="message-content">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="input-form">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isLoading}
          rows={3}
          className="message-input"
        />
        <button type="submit" disabled={!inputText.trim() || isLoading} className="send-button">
          Send
        </button>
      </form>
      
      <style jsx>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px 0;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .message {
          margin-bottom: 15px;
          padding: 10px 15px;
          border-radius: 8px;
          max-width: 70%;
        }
        
        .message.user {
          background-color: #007bff;
          color: white;
          margin-left: auto;
          text-align: right;
        }
        
        .message.assistant {
          background-color: #f8f9fa;
          color: #333;
          border: 1px solid #e0e0e0;
        }
        
        .message.loading {
          opacity: 0.7;
        }
        
        .message-content {
          margin-bottom: 5px;
        }
        
        .message-timestamp {
          font-size: 0.8em;
          opacity: 0.7;
        }
        
        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 10px;
          border: 1px solid #f5c6cb;
        }
        
        .input-form {
          display: flex;
          gap: 10px;
          align-items: flex-end;
        }
        
        .message-input {
          flex: 1;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          resize: vertical;
          min-height: 60px;
        }
        
        .message-input:focus {
          outline: none;
          border-color: #007bff;
        }
        
        .send-button {
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          height: fit-content;
        }
        
        .send-button:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }
        
        .send-button:hover:not(:disabled) {
          background-color: #0056b3;
        }
        
        @media (max-width: 768px) {
          .chat-container {
            padding: 10px;
          }
          
          .message {
            max-width: 85%;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;