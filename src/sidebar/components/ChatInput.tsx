import React, { useState } from 'react';
import { Button, Input } from 'antd';
import { PlayCircleOutlined, StopOutlined } from '@ant-design/icons';

interface ChatInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  running: boolean;
  handleClick: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  prompt, 
  setPrompt, 
  running, 
  handleClick
}) => {
  const isSendButtonDisabled = running || prompt.trim() === '';

  // Handle text changes
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setPrompt(newText);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      handleClick();
      setPrompt('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input.TextArea
        value={prompt}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        disabled={running}
        autoSize={{ minRows: 3, maxRows: 6 }}
        placeholder="What can I help with?"
      />
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        marginTop: '8px' 
      }}>
        {running ? (
          <Button
            type="primary"
            danger
            onClick={(e) => {
              e.preventDefault();
              handleClick();
            }}
            icon={<StopOutlined />}
          >
            Stop
          </Button>
        ) : (
          <Button
            type="primary"
            htmlType="submit"
            disabled={isSendButtonDisabled}
            icon={<PlayCircleOutlined />}
          >
            Send
          </Button>
        )}
      </div>
    </form>
  );
};

export default ChatInput;