import React, { useState, useEffect } from "react";
import { 
  Button, 
  message, 
  Card, 
  Input, 
  Form, 
  Modal, 
  List, 
  Typography, 
  Space, 
  Popconfirm,
  Divider
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface ProjectItem {
  key: string;
  value: string;
}

interface Project {
  id: string;
  projectName: string;
  items: ProjectItem[];
  createdAt: number;
  updatedAt: number;
}

interface TargetSettings {
  urls: string[];
  createdAt: number;
  updatedAt: number;
}

const ContentTemplates = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [targets, setTargets] = useState<string[]>(['']);
  const [isProjectModalVisible, setIsProjectModalVisible] = useState(false);
  const [isTargetModalVisible, setIsTargetModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm] = Form.useForm();
  const [targetForm] = Form.useForm();

  // Load projects and targets from storage
  useEffect(() => {
    loadProjects();
    loadTargets();
  }, []);

  const loadProjects = async () => {
    try {
      // In a real implementation, this would load from chrome.storage
      // For now, we'll use mock data
      const mockProjects: Project[] = [
        {
          id: '1',
          projectName: 'Tom',
          items: [
            { key: 'name', value: 'Tom' },
            { key: 'email', value: 'Tom@gmail.com' },
            { key: 'phone num', value: '154634589' },
            { key: 'apply for', value: 'Engineer' },
          ],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          projectName: 'Jerry',
          items: [
            { key: 'name', value: 'Jerry' },
            { key: 'email', value: 'Jerry@gmail.com' },
            { key: 'phone num', value: '5154dg689' },
            { key: 'apply for', value: 'Designer' },
          ],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
      ];
      setProjects(mockProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
      message.error('Failed to load projects');
    }
  };

  const loadTargets = async () => {
    try {
      // In a real implementation, this would load from chrome.storage
      // For now, we'll use mock data
      const mockTargets = [
        'https://makeform.ai/f/XxPee7eh',
        'https://www.pledge.health/waitlist',
        'https://once.tools/submit'
      ];
      setTargets(mockTargets);
    } catch (error) {
      console.error('Failed to load targets:', error);
      message.error('Failed to load targets');
    }
  };

  // Project functions
  const showProjectModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      projectForm.setFieldsValue({
        projectName: project.projectName,
        items: project.items,
      });
    } else {
      setEditingProject(null);
      projectForm.resetFields();
    }
    setIsProjectModalVisible(true);
  };

  const handleProjectModalOk = () => {
    projectForm
      .validateFields()
      .then(values => {
        if (editingProject) {
          // Update existing project
          const updatedProjects = projects.map(project => 
            project.id === editingProject.id 
              ? { 
                  ...project, 
                  projectName: values.projectName,
                  items: values.items,
                  updatedAt: Date.now()
                } 
              : project
          );
          setProjects(updatedProjects);
          message.success('Project updated successfully');
        } else {
          // Create new project
          const newProject: Project = {
            id: Date.now().toString(),
            projectName: values.projectName,
            items: values.items,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setProjects([...projects, newProject]);
          message.success('Project created successfully');
        }
        setIsProjectModalVisible(false);
        projectForm.resetFields();
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  const handleProjectModalCancel = () => {
    setIsProjectModalVisible(false);
    projectForm.resetFields();
  };

  const deleteProject = (id: string) => {
    const updatedProjects = projects.filter(project => project.id !== id);
    setProjects(updatedProjects);
    message.success('Project deleted successfully');
  };

  // Target functions
  const showTargetModal = () => {
    targetForm.setFieldsValue({ urls: targets });
    setIsTargetModalVisible(true);
  };

  const handleTargetModalOk = () => {
    targetForm
      .validateFields()
      .then(values => {
        // Filter out empty URLs
        const filteredUrls = values.urls.filter((url: string) => url.trim() !== '');
        setTargets(filteredUrls);
        message.success('Targets updated successfully');
        setIsTargetModalVisible(false);
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  const handleTargetModalCancel = () => {
    setIsTargetModalVisible(false);
    targetForm.resetFields();
  };

  const addUrlField = () => {
    const urls = targetForm.getFieldValue('urls') || [];
    targetForm.setFieldsValue({ urls: [...urls, ''] });
  };

  const removeUrlField = (index: number) => {
    const urls = targetForm.getFieldValue('urls') || [];
    if (urls.length <= 1) {
      targetForm.setFieldsValue({ urls: [''] });
    } else {
      const newUrls = urls.filter((_: string, i: number) => i !== index);
      targetForm.setFieldsValue({ urls: newUrls });
    }
  };

  return (
    <div>
      {/* Projects Section */}
      <div className="card-container">
        <div className="template-header">
          <div className="card-title">Projects</div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => showProjectModal()}
          >
            Add Project
          </Button>
        </div>
        
        {projects.length > 0 ? (
          <List
            dataSource={projects}
            renderItem={project => (
              <div className="template-card" key={project.id}>
                <div className="template-header">
                  <div className="template-name">{project.projectName}</div>
                  <div className="template-actions">
                    <Button 
                      icon={<EditOutlined />} 
                      onClick={() => showProjectModal(project)}
                      size="small"
                    >
                      Edit
                    </Button>
                    <Popconfirm
                      title="Delete project"
                      description="Are you sure you want to delete this project?"
                      onConfirm={() => deleteProject(project.id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button 
                        icon={<DeleteOutlined />} 
                        danger
                        size="small"
                      >
                        Delete
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
                
                <div className="item-list">
                  {project.items.map((item, index) => (
                    <div className="item-row" key={index}>
                      <div className="item-key">{item.key}:</div>
                      <div className="item-value">{item.value}</div>
                    </div>
                  ))}
                </div>
                
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#8c8c8c' }}>
                  Created: {new Date(project.createdAt).toLocaleString()}
                </div>
              </div>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
            <p>No projects yet. Click "Add Project" to create your first project.</p>
          </div>
        )}
      </div>

      {/* Targets Section */}
      <div className="card-container">
        <div className="template-header">
          <div className="card-title">Target URLs</div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={showTargetModal}
          >
            Manage Targets
          </Button>
        </div>
        
        {targets.length > 0 ? (
          <div className="url-list">
            {targets.map((url, index) => (
              <div className="url-item" key={index}>
                <div className="url-text">{url}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
            <p>No target URLs yet. Click "Manage Targets" to add URLs.</p>
          </div>
        )}
      </div>

      {/* Project Modal */}
      <Modal
        title={editingProject ? "Edit Project" : "Add Project"}
        open={isProjectModalVisible}
        onOk={handleProjectModalOk}
        onCancel={handleProjectModalCancel}
        width={600}
      >
        <Form form={projectForm} layout="vertical">
          <Form.Item
            name="projectName"
            label="Project Name"
            rules={[{ required: true, message: 'Please enter a project name' }]}
          >
            <Input placeholder="Enter project name" />
          </Form.Item>
          
          <Form.Item
            name="items"
            label="Project Items"
            rules={[{ required: true, message: 'Please add at least one item' }]}
            initialValue={[{ key: '', value: '' }]}
          >
            <Form.List name="items">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'key']}
                        rules={[{ required: true, message: 'Missing key' }]}
                      >
                        <Input placeholder="Key" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'value']}
                        rules={[{ required: true, message: 'Missing value' }]}
                      >
                        <Input placeholder="Value" />
                      </Form.Item>
                      <Button onClick={() => remove(name)} danger>
                        Remove
                      </Button>
                    </Space>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Add Item
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>
        </Form>
      </Modal>

      {/* Target Modal */}
      <Modal
        title="Manage Target URLs"
        open={isTargetModalVisible}
        onOk={handleTargetModalOk}
        onCancel={handleTargetModalCancel}
        width={600}
      >
        <Form form={targetForm} layout="vertical">
          <Form.List name="urls" initialValue={targets}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name]}
                      rules={[{ required: true, message: 'Missing URL' }]}
                      style={{ flex: 1 }}
                    >
                      <Input placeholder="https://example.com" />
                    </Form.Item>
                    <Button onClick={() => remove(name)} danger>
                      Remove
                    </Button>
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add URL
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};

export default ContentTemplates;