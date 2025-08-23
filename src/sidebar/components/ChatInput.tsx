import React, { useState, useEffect } from 'react';
import { Button, Input, Select } from 'antd';
import { PlayCircleOutlined, StopOutlined, CheckOutlined } from '@ant-design/icons';

interface ChatInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  running: boolean;
  handleClick: () => void;
  onSelectionChange?: (selectedProject: string, selectedTarget: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  prompt, 
  setPrompt, 
  running, 
  handleClick,
  onSelectionChange
}) => {
  const isSendButtonDisabled = running || prompt.trim() === '';
  
  // Selector states
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [targets, setTargets] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Load projects and targets from storage
  useEffect(() => {
    loadProjectsAndTargets();
    
    // Listen for storage changes
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.projects) {
        loadProjects();
      }
      if (changes.targets) {
        loadTargets();
      }
    };
    
    chrome.storage.onChanged.addListener(handleStorageChange);
    
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);
  
  const loadProjectsAndTargets = async () => {
    setLoading(true);
    await Promise.all([loadProjects(), loadTargets()]);
    setLoading(false);
  };
  
  const loadProjects = async () => {
    try {
      const result = await chrome.storage.local.get(['projects']);
      if (result.projects && result.projects.length > 0) {
        // Transform projects data to match the expected format
        const formattedProjects = result.projects.map((project: any) => ({
          id: project.id,
          name: project.projectName
        }));
        setProjects(formattedProjects);
      } else {
        // Default projects if none in storage
        setProjects([
          { id: '1', name: 'Job Application' },
          { id: '2', name: 'Leave Contact' },
          { id: '3', name: 'Product Promotion' }
        ]);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      // Set default projects on error
      setProjects([
        { id: '1', name: 'Job Application' },
        { id: '2', name: 'Leave Contact' },
        { id: '3', name: 'Product Promotion' }
      ]);
    }
  };
  
  const loadTargets = async () => {
    try {
      const result = await chrome.storage.local.get(['targets']);
      if (result.targets && result.targets.length > 0) {
        // Transform targets data to match the expected format
        const formattedTargets = result.targets.map((url: string) => ({
          id: url,
          name: url
        }));
        setTargets(formattedTargets);
      } else {
        // Default targets if none in storage
        setTargets([
          { id: 'https://makeform.ai/f/XxPee7eh', name: 'https://makeform.ai/f/XxPee7eh' },
          { id: 'https://www.pledge.health/waitlist', name: 'https://www.pledge.health/waitlist' },
          { id: 'https://once.tools/submit', name: 'https://once.tools/submit' }
        ]);
      }
    } catch (error) {
      console.error('Failed to load targets:', error);
      // Set default targets on error
      setTargets([
        { id: 'https://makeform.ai/f/XxPee7eh', name: 'https://makeform.ai/f/XxPee7eh' },
        { id: 'https://www.pledge.health/waitlist', name: 'https://www.pledge.health/waitlist' },
        { id: 'https://once.tools/submit', name: 'https://once.tools/submit' }
      ]);
    }
  };
  
  // Handle selection changes
  const handleProjectChange = (value: string) => {
    setSelectedProject(value);
    if (onSelectionChange) {
      onSelectionChange(value, selectedTarget);
    }
  };

  const handleTargetChange = (value: string) => {
    setSelectedTarget(value);
    if (onSelectionChange) {
      onSelectionChange(selectedProject, value);
    }
  };

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
      {/* Selector Dropdowns */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <div style={{ flex: 1 }}>
          <Select
            value={selectedProject}
            onChange={handleProjectChange}
            loading={loading}
            disabled={loading || projects.length === 0}
            placeholder={loading ? 'Loading projects...' : projects.length === 0 ? 'No projects available' : 'Select project'}
            style={{ width: '100%' }}
            dropdownStyle={{ width: 200 }}
          >
            {projects.map(project => (
              <Select.Option 
                key={project.id} 
                value={project.id}
              >
                {project.name}
              </Select.Option>
            ))}
          </Select>
        </div>
        
        <div style={{ flex: 1 }}>
          <Select
            value={selectedTarget}
            onChange={handleTargetChange}
            loading={loading}
            disabled={loading || targets.length === 0}
            placeholder={loading ? 'Loading targets...' : targets.length === 0 ? 'No targets available' : 'Select target'}
            style={{ width: '100%' }}
            dropdownStyle={{ width: 300 }}
          >
            {targets.map(target => (
              <Select.Option 
                key={target.id} 
                value={target.id}
              >
                {target.name}
              </Select.Option>
            ))}
          </Select>
        </div>
        
        <Button
          onClick={() => {
            if (onSelectionChange) {
              onSelectionChange(selectedProject, selectedTarget);
            }
          }}
          disabled={!selectedProject || !selectedTarget || loading}
          icon={<CheckOutlined />}
        />
      </div>
      
      {/* Chat Input */}
      <Input.TextArea
        value={prompt}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        disabled={running}
        autoSize={{ minRows: 3, maxRows: 6 }}
        placeholder="select items for submiting task"
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