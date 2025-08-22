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
import { PlusOutlined, EditOutlined, DeleteOutlined, SendOutlined } from '@ant-design/icons';

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

const ProjectsTemplate = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form] = Form.useForm();
  const [previewForm] = Form.useForm();
  const [inputText, setInputText] = useState('');
  const [parsedItems, setParsedItems] = useState<{key: string, value: string}[]>([]);

  // Load projects from storage
  useEffect(() => {
    loadProjects();
  }, []);

  // Save projects to storage whenever projects change
  useEffect(() => {
    saveProjects();
  }, [projects]);

  const loadProjects = async () => {
    try {
      // Load projects from chrome.storage
      const result = await chrome.storage.local.get(['projects']);
      if (result.projects) {
        setProjects(result.projects);
      } else {
        // If no projects in storage, use mock data
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
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      message.error('Failed to load projects');
    }
  };

  const saveProjects = async () => {
    try {
      // Save projects to chrome.storage
      await chrome.storage.local.set({ projects });
    } catch (error) {
      console.error('Failed to save projects:', error);
      message.error('Failed to save projects');
    }
  };

  // Project functions
  const showModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      form.setFieldsValue({
        projectName: project.projectName,
        items: project.items,
      });
    } else {
      setEditingProject(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleModalOk = () => {
    form
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
        setIsModalVisible(false);
        form.resetFields();
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const deleteProject = (id: string) => {
    const updatedProjects = projects.filter(project => project.id !== id);
    setProjects(updatedProjects);
    message.success('Project deleted successfully');
  };

  // Parse input text to extract key-value pairs using LLM
  const parseInputText = () => {
    if (!inputText.trim()) {
      message.warning('Please enter some text to parse');
      return;
    }
    
    // Send message to background script to parse text with LLM
    chrome.runtime.sendMessage({
      type: "parse_text",
      text: inputText
    });
    
    message.info('Parsing text with LLM...');
  };
  
  // Listen for parsed items from background script
  useEffect(() => {
    const handleMessage = (request: any) => {
      if (request.type === "parsed_items") {
        setParsedItems(request.items);
        message.success(`Parsed ${request.items.length} items successfully`);
        // Show preview modal after successful parsing
        setIsPreviewModalVisible(true);
        // Set initial values for preview form
        previewForm.setFieldsValue({
          projectName: request.items[0]?.value || 'New Project',
          items: request.items
        });
      } else if (request.type === "parsed_items_error") {
        message.error(`Error parsing text: ${request.error}`);
        // Even if parsing failed, show preview modal with original text for manual input
        setIsPreviewModalVisible(true);
        // Set initial values for preview form with parsed items as empty array
        previewForm.setFieldsValue({
          projectName: 'New Project',
          items: []
        });
      }
    };
    
    chrome.runtime.onMessage.addListener(handleMessage);
    
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  // Handle preview modal OK
  const handlePreviewModalOk = () => {
    previewForm
      .validateFields()
      .then(values => {
        // Create new project from preview form values
        const newProject: Project = {
          id: Date.now().toString(),
          projectName: values.projectName,
          items: values.items,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        setProjects([...projects, newProject]);
        setIsPreviewModalVisible(false);
        previewForm.resetFields();
        setParsedItems([]);
        setInputText('');
        message.success('Project created from parsed items successfully');
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  // Add parsed items to a new project
  const addParsedItemsToProject = () => {
    if (parsedItems.length === 0) {
      message.warning('No parsed items to add');
      return;
    }
    
    // Extract project name from the first item if it exists
    const projectName = parsedItems[0]?.value || 'New Project';
    
    const newProject: Project = {
      id: Date.now().toString(),
      projectName: projectName,
      items: parsedItems,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    setProjects([...projects, newProject]);
    setParsedItems([]);
    setInputText('');
    message.success('Project created from parsed items successfully');
  };

  // Handle preview modal cancel
  const handlePreviewModalCancel = () => {
    setIsPreviewModalVisible(false);
    previewForm.resetFields();
  };

  return (
    <div>
      <Card 
        title={<Title level={4}>Parse Input</Title>}
        bordered={false}
        className="parse-section"
      >
        <Form layout="vertical">
          <Form.Item
            label="Input Text"
            help="Enter text to parse, e.g., 姓名=jakc,年龄=18 or name=jack,age=18"
          >
            <TextArea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to parse, e.g., 姓名=jakc,年龄=18 or name=jack,age=18"
              autoSize={{ minRows: 3, maxRows: 6 }}
              className="parse-textarea"
            />
          </Form.Item>
          <Form.Item>
            <Button 
              type="primary" 
              icon={<SendOutlined />} 
              onClick={parseInputText}
              className="parse-button"
            >
              Parse
            </Button>
          </Form.Item>
        </Form>
      </Card>
        
        {/* Parsed Items Display */}
        {parsedItems.length > 0 && (
          <Card 
            title={<Text strong>Parsed Items</Text>}
            bordered={false}
            className="parsed-items-card"
          >
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {parsedItems.map((item, index) => (
                <div key={index} className="parsed-item-row">
                  <Text strong className="parsed-item-key">{item.key}:</Text>
                  <Text className="parsed-item-value">{item.value}</Text>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button 
                type="primary" 
                onClick={addParsedItemsToProject}
              >
                Add to Projects
              </Button>
            </div>
          </Card>
        )}
        
        <Divider />
        
        {/* Projects Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>Projects Template</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => showModal()}
          >
            Add Project
          </Button>
        </div>
        
        {projects.length > 0 ? (
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <List
              dataSource={projects}
              renderItem={project => (
                <Card 
                  key={project.id}
                  size="small"
                  title={<Text strong>{project.projectName}</Text>}
                  extra={
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button 
                        icon={<EditOutlined />} 
                        onClick={() => showModal(project)}
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
                  }
                  style={{ marginBottom: 16 }}
                >
                  <div>
                    {project.items.map((item, index) => (
                      <div key={index} className="item-row">
                        <Text strong className="item-key">{item.key}:</Text>
                        <Text className="item-value">{item.value}</Text>
                      </div>
                    ))}
                  </div>
                  <Text type="secondary" style={{ fontSize: '12px', marginTop: 12 }}>
                    Created: {new Date(project.createdAt).toLocaleString()}
                  </Text>
                </Card>
              )}
            />
          </div>
        ) : (
          <Card style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text type="secondary">No projects yet. Click "Add Project" to create your first project.</Text>
          </Card>
        )}

      {/* Project Modal */}
      <Modal
        title={editingProject ? "Edit Project" : "Add Project"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
      >
        <Form form={form} layout="vertical">
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
    </div>
  );
};

export default ProjectsTemplate;