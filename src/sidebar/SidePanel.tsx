import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Button, 
  Input, 
  Select, 
  message, 
  Layout, 
  Card, 
  Typography, 
  Space, 
  Divider,
  Empty,
  Row,
  Col
} from 'antd';
import { 
  SettingOutlined, 
  PlusOutlined, 
  HistoryOutlined, 
  CheckOutlined, 
  UserOutlined, 
  BulbOutlined, 
  EyeOutlined,
  MessageOutlined,
  PlayCircleOutlined,
  StopOutlined
} from '@ant-design/icons';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import TemplateList from './components/TemplateList';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

interface LogMessage {
  time: string;
  log: string;
  level?: "info" | "error" | "success";
}

interface Template {
  id: string;
  title: string;
  content: string;
}

interface Message {
  actor?: string;
  content: string;
  timestamp: number;
}

// Default templates
const defaultTemplates: Template[] = [
  {
    id: '1',
    title: '💼 Submit Job Application',
    content:
      'Submit my job application on https://makeform.ai/f/XxPee7eh \n Detail information is:\n - name = Axis Wang\n- email = Axis@tstgmail.com\n- phone num = 154689\n- apply for Software Engineer',
  },
  {
    id: '2',
    title: '📝 Submit Waitlist',
    content:
      'Submit my post to https://www.pledge.health/waitlist \n  Detail information is:\n - First Name=Axis\n - Last Name=Wang\n - Organization Name=SupaSubmit\n - Work Email=hello@supasubmit.com\n',
  },
  {
    id: '3',
    title: '🚀 Submit Product',
    content:
      'Submit my product to https://once.tools/submit, \ndetail information is: \n - makerName=Axis Wang \n - makerEmail=hello@supasubmit.com \n - productName=SupaSubmit \n - productURL=https://supasubmit.com \n - tagline=Automate Form Submissions with AI Intelligence \n - description=Suapsubmit is a Vision-Based AI Agent for automate form filling \n - price=Freemium',
  },
];

const SidePanel: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [streamLog, setStreamLog] = useState<LogMessage | null>(null);
  const [prompt, setPrompt] = useState('Open Twitter, search for "SupaSubmit" and follow');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isFollowUpMode, setIsFollowUpMode] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectItems, setProjectItems] = useState<Array<{ key: string; value: string }>>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for dark mode preference and sync with body class
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    const initialDarkMode = !!darkModeMediaQuery?.matches;
    setIsDarkMode(initialDarkMode);
    
    // Apply initial dark mode class to body
    if (initialDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
      if (e.matches) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    };
    
    darkModeMediaQuery?.addEventListener('change', handleChange);
    return () => darkModeMediaQuery?.removeEventListener('change', handleChange);
  }, []);
  
  // Listen for theme changes from options page
  useEffect(() => {
    const handleStorageChange = (changes: any, area: string) => {
      if (area === 'local' && changes.darkMode !== undefined) {
        const newDarkMode = changes.darkMode.newValue;
        setIsDarkMode(newDarkMode);
        if (newDarkMode) {
          document.body.classList.add('dark');
        } else {
          document.body.classList.remove('dark');
        }
      }
    };
    
    chrome.storage.onChanged.addListener(handleStorageChange);
    
    // Apply current theme on mount
    chrome.storage.local.get(['darkMode'], (result) => {
      if (result.darkMode !== undefined) {
        setIsDarkMode(result.darkMode);
        if (result.darkMode) {
          document.body.classList.add('dark');
        } else {
          document.body.classList.remove('dark');
        }
      }
    });
    
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  useEffect(() => {
    chrome.storage.local.get(["running", "prompt"], (result) => {
      if (result.running !== undefined) {
        setRunning(result.running);
      }
      if (result.prompt !== undefined) {
        setPrompt(result.prompt);
      }
    });
    
    const messageListener = (message: any) => {
      if (!message) {
        return;
      }
      if (message.type === "stop") {
        setRunning(false);
        chrome.storage.local.set({ running: false });
      } else if (message.type === "log") {
        const time = new Date().toLocaleTimeString();
        const log_message = {
          time,
          log: message.log,
          level: message.level || "info",
        };
        if (message.stream) {
          setStreamLog(log_message);
        } else {
          setStreamLog(null);
          setLogs((prev) => [...prev, log_message]);
        }
      } else if (message.type === "execution") {
        // Handle execution messages from the background script
        const newMessage: Message = {
          actor: message.actor || "SYSTEM",
          content: message.data?.details || message.content || "Execution update",
          timestamp: message.timestamp || Date.now()
        };
        setMessages(prev => [...prev, newMessage]);
      }
    };
    
    chrome.runtime.onMessage.addListener(messageListener);
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  useEffect(() => {
    window.scrollTo({
      behavior: "smooth",
      top: document.body.scrollHeight,
    });
  }, [logs, streamLog]);

  const handleClick = () => {
    if (running) {
      setRunning(false);
      chrome.storage.local.set({ running: false, prompt });
      chrome.runtime.sendMessage({ type: "stop" });
      return;
    }
    if (!prompt.trim()) {
      return;
    }
    setLogs([]);
    setRunning(true);
    chrome.storage.local.set({ running: true, prompt });
    chrome.runtime.sendMessage({ type: "run", prompt: prompt.trim() });
  };

  const handleNewChat = () => {
    // Clear messages and start a new chat
    setMessages([]);
    setLogs([]);
    setStreamLog(null);
    setRunning(false);
    setIsFollowUpMode(false);
    // Reset selected project and target
    setSelectedProjectId('');
    setSelectedTarget('');
    setProjectName('');
    setProjectItems([]);
  };

  const handleTemplateSelect = (content: string) => {
    setPrompt(content);
  };

  const handleSelectionChange = useCallback(
    (projectId: string, target: string) => {
      setSelectedProjectId(projectId);
      setSelectedTarget(target);

      // Prepopulate input with selection info
      if (projectId && target && projectName) {
        // Create a formatted string of all key-value pairs
        const detailsString =
          projectItems.length > 0
            ? `\n\nDetail information as below:\n${projectItems.map(item => `- ${item.key}: ${item.value}`).join('\n')}`
            : '';

        // Set the input text with project, target, and details
        setPrompt(`Submit project "${projectName}" to target "${target}"${detailsString}`);
      }

      console.log(`Selected project ID: ${projectId}, Project name: ${projectName}, Selected target: ${target}`);
    },
    [projectItems, projectName],
  );

  // Load project items when a project is selected
  useEffect(() => {
    if (selectedProjectId) {
      // Mock project data loading - in a real implementation, this would come from storage
      const mockProjects = [
        {
          id: '1',
          projectName: 'Tom',
          items: [
            { key: 'name', value: 'Axis Wang' },
            { key: 'email', value: '493941331@qq.com' },
            { key: 'phone num', value: '13818181818' },
            { key: 'application', value: 'Software Engineer' },
          ],
        },
        {
          id: '2',
          projectName: 'Personal Info',
          items: [
            { key: 'First Name', value: 'Axis' },
            { key: 'Last Name', value: 'Wang' },
            { key: 'Organization Name', value: 'SupaSubmit' },
            { key: 'Work Email', value: 'hello@supasubmit.com' },
          ],
        },
        {
          id: '3',
          projectName: 'Product Info',
          items: [
            { key: 'makerName', value: 'Axis Wang' },
            { key: 'makerEmail', value: 'hello@supasubmit.com' },
            { key: 'productName', value: 'SupaSubmit' },
            { key: 'productURL', value: 'https://supasubmit.com' },
            { key: 'tagline', value: 'Automate Form Submissions with AI Intelligence' },
            { key: 'description', value: 'Suapsubmit is a Vision-Based AI Agent for automate form filling' },
            { key: 'price', value: 'Freemium' },
          ],
        }
      ];
      
      const project = mockProjects.find(p => p.id === selectedProjectId);
      if (project) {
        setProjectItems(project.items);
        setProjectName(project.projectName);
      } else {
        setProjectItems([]);
        setProjectName('');
      }
    } else {
      setProjectItems([]);
      setProjectName('');
    }
  }, [selectedProjectId]);

  // Open options page in a new tab
  const openOptionsPage = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html#projects-template') });
  };

  const getLogStyle = (level: string) => {
    switch (level) {
      case "error":
        return { color: "#ff4d4f" };
      case "success":
        return { color: "#52c41a" };
      default:
        return { color: "#1890ff" };
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0 16px',
        background: 'transparent',
        height: '56px',
        lineHeight: '56px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {showHistory ? (
            <Button 
              type="text"
              icon={<MessageOutlined />}
              onClick={() => setShowHistory(false)}
            >
              Back to Chat
            </Button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                width: 24, 
                height: 24, 
                marginRight: 8,
                backgroundColor: '#8b5cf6',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <EyeOutlined />
              </div>
              <Title level={5} style={{ margin: 0, color: isDarkMode ? 'white' : '#1f2937' }}>SupaSubmit</Title>
            </div>
          )}
        </div>
        
        <Space>
          {!showHistory && (
            <>
              <Button 
                icon={<PlusOutlined />} 
                onClick={handleNewChat}
                type="text"
                style={{ color: isDarkMode ? 'white' : '#1f2937' }}
              />
              <Button 
                icon={<HistoryOutlined />} 
                onClick={() => setShowHistory(true)}
                type="text"
                style={{ color: isDarkMode ? 'white' : '#1f2937' }}
              />
            </>
          )}
          <Button 
            icon={<SettingOutlined />} 
            onClick={openOptionsPage}
            type="text"
            style={{ color: isDarkMode ? 'white' : '#1f2937' }}
          />
        </Space>
      </Header>

      {showHistory ? (
        <Content style={{ padding: '16px', overflowY: 'auto' }}>
          <Card title="History" style={{ width: '100%' }}>
            <Empty description="No history yet" />
          </Card>
        </Content>
      ) : (
        <>
          <Content style={{ padding: '16px', overflowY: 'auto' }}>
            {messages.length === 0 && logs.length === 0 ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                padding: '20px'
              }}>
                <Title level={3} style={{ marginBottom: '16px' }}>
                  Welcome to SupaSubmit
                </Title>
                
                {/* <Card 
                  title="Get Started" 
                  style={{ width: '100%', maxWidth: '500px', marginBottom: '24px' }}
                >
                  <ChatInput
                    prompt={prompt}
                    setPrompt={setPrompt}
                    running={running}
                    handleClick={handleClick}
                    onSelectionChange={handleSelectionChange}
                  />
                </Card> */}
                
                <div style={{ width: '100%', maxWidth: '500px' }}>
                  <Text style={{ marginBottom: '16px', display: 'block' }}>
                    Click{' '}
                    <Button 
                      type="link" 
                      onClick={openOptionsPage}
                      style={{ padding: 0 }}
                    >
                      here
                    </Button>{' '}
                    to set up your templates.
                  </Text>
                  {/* <TemplateList 
                    templates={defaultTemplates} 
                    onTemplateSelect={handleTemplateSelect}
                  /> */}
                </div>
              </div>
            ) : (
              <>
                <MessageList messages={messages} />
                {logs.length > 0 && (
                  <Card 
                    title="Logs" 
                    size="small" 
                    style={{ marginTop: '16px' }}
                  >
                    {logs.map((log, index) => (
                      <pre
                        key={index}
                        style={{
                          margin: "2px 0",
                          fontSize: "12px",
                          fontFamily: "monospace",
                          whiteSpace: "pre-wrap",
                          ...getLogStyle(log.level || "info"),
                        }}
                      >
                        [{log.time}] {log.log}
                      </pre>
                    ))}
                    {streamLog && (
                      <pre
                        style={{
                          margin: "2px 0",
                          fontSize: "12px",
                          fontFamily: "monospace",
                          whiteSpace: "pre-wrap",
                          ...getLogStyle(streamLog.level || "info"),
                        }}
                      >
                        [{streamLog.time}] {streamLog.log}
                      </pre>
                    )}
                  </Card>
                )}
              </>
            )}
          </Content>
          
          <Footer style={{ 
            padding: '16px', 
            background: 'transparent',
            borderTop: '1px solid #f0f0f0'
          }}>
            <ChatInput
              prompt={prompt}
              setPrompt={setPrompt}
              running={running}
              handleClick={handleClick}
              onSelectionChange={handleSelectionChange}
            />
          </Footer>
        </>
      )}
    </Layout>
  );
};

export default SidePanel;