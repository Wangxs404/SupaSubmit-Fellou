import React, { useState, useEffect } from 'react';
import { Select, Button } from 'antd';
import { CheckOutlined } from '@ant-design/icons';

interface SelectorDropdownsProps {
  onSelectionChange?: (selectedProject: string, selectedTarget: string) => void;
}

interface DropdownItem {
  id: string;
  name: string;
}

const SelectorDropdowns: React.FC<SelectorDropdownsProps> = ({ 
  onSelectionChange 
}) => {
  const [projects, setProjects] = useState<DropdownItem[]>([
    { id: '1', name: 'Tom' },
    { id: '2', name: 'Jerry' },
    { id: '3', name: 'Spark' }
  ]);
  
  const [targets, setTargets] = useState<DropdownItem[]>([
    { id: 'https://makeform.ai/f/XxPee7eh', name: 'https://makeform.ai/f/XxPee7eh' },
    { id: 'https://www.pledge.health/waitlist', name: 'https://www.pledge.health/waitlist' },
    { id: 'https://once.tools/submit', name: 'https://once.tools/submit' }
  ]);
  
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [loading, setLoading] = useState(false);

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

  // Handle apply button click
  const handleApply = () => {
    if (onSelectionChange) {
      onSelectionChange(selectedProject, selectedTarget);
    }
  };

  return (
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
        onClick={handleApply}
        disabled={!selectedProject || !selectedTarget || loading}
        icon={<CheckOutlined />}
      />
    </div>
  );
};

export default SelectorDropdowns;