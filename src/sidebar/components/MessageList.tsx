import React from 'react';
import { UserOutlined, SettingOutlined, BulbOutlined, EyeOutlined, SafetyOutlined } from '@ant-design/icons';

interface Message {
  actor?: string;
  content: string;
  timestamp: number;
}

interface MessageListProps {
  messages: Message[];
}

const ACTOR_PROFILES: Record<string, { name: string; icon: React.ReactNode; iconBackground: string }> = {
  USER: {
    name: 'You',
    icon: <UserOutlined />,
    iconBackground: '#8b5cf6',
  },
  SYSTEM: {
    name: 'System',
    icon: <SettingOutlined />,
    iconBackground: '#3b82f6',
  },
  PLANNER: {
    name: 'Planner',
    icon: <BulbOutlined />,
    iconBackground: '#10b981',
  },
  NAVIGATOR: {
    name: 'Navigator',
    icon: <EyeOutlined />,
    iconBackground: '#f59e0b',
  },
  VALIDATOR: {
    name: 'Validator',
    icon: <SafetyOutlined />,
    iconBackground: '#ef4444',
  },
};

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  /**
   * Formats a timestamp (in milliseconds) to a readable time string
   * @param timestamp Unix timestamp in milliseconds
   * @returns Formatted time string
   */
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();

    // Check if the message is from today
    const isToday = date.toDateString() === now.toDateString();

    // Check if the message is from yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    // Check if the message is from this year
    const isThisYear = date.getFullYear() === now.getFullYear();

    // Format the time (HH:MM)
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return timeStr; // Just show the time for today's messages
    }

    if (isYesterday) {
      return `Yesterday, ${timeStr}`;
    }

    if (isThisYear) {
      // Show month and day for this year
      return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
    }

    // Show full date for older messages
    return `${date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}, ${timeStr}`;
  };

  const MessageBlock: React.FC<{ 
    message: Message; 
    isSameActor: boolean; 
  }> = ({ message, isSameActor }) => {
    if (!message.actor) {
      console.error('No actor found');
      return <div />;
    }
    
    const actor = ACTOR_PROFILES[message.actor as keyof typeof ACTOR_PROFILES];
    const isProgress = message.content === 'Showing progress...';

    return (
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginTop: !isSameActor ? '16px' : '0',
          paddingTop: !isSameActor ? '16px' : '0',
          borderTop: !isSameActor ? '1px solid #f0f0f0' : 'none',
        }}
      >
        {!isSameActor && (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: actor.iconBackground,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}
          >
            {actor.icon}
          </div>
        )}
        {isSameActor && <div style={{ width: '32px' }} />}

        <div style={{ flex: 1, minWidth: 0 }}>
          {!isSameActor && (
            <div 
              style={{ 
                marginBottom: '4px', 
                fontSize: '14px', 
                fontWeight: '600',
                color: 'inherit'
              }}
            >
              {actor.name}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div 
              style={{ 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word', 
                fontSize: '14px',
                color: 'inherit'
              }}
            >
              {isProgress ? (
                <div 
                  style={{ 
                    height: '4px', 
                    overflow: 'hidden', 
                    borderRadius: '2px',
                    backgroundColor: '#f0f0f0'
                  }}
                >
                  <div 
                    style={{ 
                      height: '100%', 
                      backgroundColor: '#8b5cf6',
                      animation: 'progress 1.5s ease-in-out infinite'
                    }}
                  />
                </div>
              ) : (
                message.content
              )}
            </div>
            {!isProgress && (
              <div 
                style={{ 
                  textAlign: 'right', 
                  fontSize: '12px',
                  color: '#8c8c8c'
                }}
              >
                {formatTimestamp(message.timestamp)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: '100%' }}>
      {messages.map((message, index) => (
        <MessageBlock
          key={`${message.actor}-${message.timestamp}-${index}`}
          message={message}
          isSameActor={index > 0 ? messages[index - 1].actor === message.actor : false}
        />
      ))}
      
      {/* Add animation styles */}
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default MessageList;