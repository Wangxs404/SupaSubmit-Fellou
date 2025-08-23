import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider, Layout, Menu, Typography, Switch, theme } from "antd";
import { 
  KeyOutlined, 
  FolderOutlined, 
  AimOutlined,
  SettingOutlined,
  BulbOutlined,
  BulbFilled
} from '@ant-design/icons';
import ApiKeyConfig from "./components/ApiKeyConfig";
import ProjectsTemplate from "./components/ProjectsTemplate";
import TargetsConfig from "./components/TargetsConfig";
import "./Options.css";

const { Sider, Content } = Layout;
const { Title } = Typography;

const OptionsPage = () => {
  const [selectedKey, setSelectedKey] = useState("api-key");
  const [darkMode, setDarkMode] = useState(false);

  // Check URL hash on component mount
  useEffect(() => {
    const hash = window.location.hash.substring(1); // Remove the '#' character
    if (hash && ['api-key', 'projects-template', 'targets'].includes(hash)) {
      setSelectedKey(hash);
    }
  }, []);

  // Load theme preference from storage
  useEffect(() => {
    chrome.storage.local.get(['darkMode'], (result) => {
      if (result.darkMode !== undefined) {
        setDarkMode(result.darkMode);
      }
    });
  }, []);

  // Save theme preference to storage
  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    chrome.storage.local.set({ darkMode: newDarkMode });
    
    // Apply theme to document
    if (newDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };

  // Apply theme on initial load
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  const menuItems = [
    
    {
      key: "projects-template",
      icon: <FolderOutlined />,
      label: "Projects",
      component: <ProjectsTemplate />
    },
    {
      key: "targets",
      icon: <AimOutlined />,
      label: "Targets",
      component: <TargetsConfig />
    },
    {
      key: "api-key",
      icon: <KeyOutlined />,
      label: "API-Key",
      component: <ApiKeyConfig />
    }
  ];

  const selectedComponent = menuItems.find(item => item.key === selectedKey)?.component || <ApiKeyConfig />;

  return (
    <ConfigProvider
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <Layout className="options-layout">
        <Sider 
          width={250} 
          className="options-sider"
          theme="light"
        >
          <div className="logo" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '16px 16px', 
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Title level={4} style={{ color: darkMode ? '#fff' : '#000', margin: 0, flex: 1 }}>
              <SettingOutlined /> SupaSubmit
            </Title>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {darkMode ? <BulbFilled style={{ color: '#ffd700', marginRight: 8 }} /> : <BulbOutlined style={{ color: '#fff', marginRight: 8 }} />}
              <Switch
                checked={darkMode}
                onChange={toggleTheme}
                size="small"
                style={{ backgroundColor: darkMode ? '#1890ff' : undefined }}
              />
            </div>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            onSelect={({ key }) => setSelectedKey(key as string)}
            items={menuItems.map(item => ({
              key: item.key,
              icon: item.icon,
              label: item.label
            }))}
            className="options-menu"
          />
        </Sider>
        
        <Layout>
          <Content className="options-content">
            <div className="content-wrapper">
              {selectedComponent}
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <OptionsPage />
  </React.StrictMode>
);