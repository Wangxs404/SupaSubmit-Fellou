import React from 'react';
import { Card, Typography } from 'antd';

const { Text } = Typography;

interface Template {
  id: string;
  title: string;
  content: string;
}

interface TemplateListProps {
  templates: Template[];
  onTemplateSelect: (content: string) => void;
}

const TemplateList: React.FC<TemplateListProps> = ({ 
  templates, 
  onTemplateSelect
}) => {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '8px'
    }}>
      {templates.map(template => (
        <Card
          key={template.id}
          hoverable
          onClick={() => onTemplateSelect(template.content)}
          size="small"
          style={{ cursor: 'pointer' }}
        >
          <Text strong>{template.title}</Text>
        </Card>
      ))}
    </div>
  );
};

export default TemplateList;