import { createRoot } from "react-dom/client";
import React, { useState, useEffect } from "react";
import { ConfigProvider, theme } from 'antd';
import SidePanel from "./SidePanel";

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);

  // Load theme preference from storage
  useEffect(() => {
    chrome.storage.local.get(['darkMode'], (result) => {
      if (result.darkMode !== undefined) {
        setDarkMode(result.darkMode);
      } else {
        // Fallback to system preference
        const darkModeMediaQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
        setDarkMode(!!darkModeMediaQuery?.matches);
      }
    });
    
    // Listen for theme changes from options page
    const handleStorageChange = (changes: any, area: string) => {
      if (area === 'local' && changes.darkMode) {
        setDarkMode(changes.darkMode.newValue);
      }
    };
    
    chrome.storage.onChanged.addListener(handleStorageChange);
    
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  return (
    <ConfigProvider
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <SidePanel />
    </ConfigProvider>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);