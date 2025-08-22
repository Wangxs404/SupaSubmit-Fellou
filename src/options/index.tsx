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
      key: "api-key",
      icon: <KeyOutlined />,
      label: "API Key Configuration",
      component: <ApiKeyConfig />
    },
    {
      key: "projects-template",
      icon: <FolderOutlined />,
      label: "Projects Template",
      component: <ProjectsTemplate />
    },
    {
      key: "targets",
      icon: <AimOutlined />,
      label: "Targets",
      component: <TargetsConfig />
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
          <div className="logo">
            <Title level={4} style={{ color: '#fff', textAlign: 'center', padding: '16px 0', margin: 0 }}>
              <SettingOutlined /> Fellou
            </Title>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '12px 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {darkMode ? <BulbFilled style={{ color: '#ffd700', marginRight: 8 }} /> : <BulbOutlined style={{ color: '#fff', marginRight: 8 }} />}
            <Switch
              checked={darkMode}
              onChange={toggleTheme}
              checkedChildren="Dark"
              unCheckedChildren="Light"
              size="small"
              style={{ backgroundColor: darkMode ? '#1890ff' : undefined }}
            />
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