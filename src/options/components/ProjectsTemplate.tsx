import React, { useState, useEffect, useRef } from "react";
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
  Divider,
  Upload
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SendOutlined, UploadOutlined, PaperClipOutlined, GlobalOutlined, ArrowUpOutlined } from '@ant-design/icons';

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
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

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
  
  // Extract text from various file formats
  const extractTextFromFile = async (file: File) => {
    try {
      setUploading(true);
      message.info(`Extracting text from ${file.name}...`);
      
      let extractedText = '';
      
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        // PDF file extraction
        extractedText = await extractTextFromPDF(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                 file.name.toLowerCase().endsWith('.docx')) {
        // Word DOCX file extraction
        extractedText = await extractTextFromWord(file);
      } else if (file.type === 'text/markdown' || file.name.toLowerCase().endsWith('.md')) {
        // Markdown file extraction
        extractedText = await extractTextFromMarkdown(file);
      } else if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
        // Plain text file extraction
        extractedText = await extractTextFromTxt(file);
      } else {
        // Unsupported file type
        message.error('Unsupported file type. Please upload a PDF, Word (.docx), Markdown (.md), or Text (.txt) file.');
        setUploading(false);
        return;
      }
      
      // Set the extracted text to the input text area
      setInputText(extractedText);
      
      message.success(`Successfully extracted text from ${file.name}. Click "Parse" to extract key-value pairs.`);
    } catch (error) {
      console.error('Error extracting text:', error);
      message.error('Failed to extract text from file: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };
  
  // Extract text from PDF files using a simpler approach
  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      // Read the file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Dynamically import pdfjs-dist
      const pdfjsLib = await import('pdfjs-dist/build/pdf.min.js');
      
      // Try to set up a fake worker to avoid CSP issues
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = null;
      } catch (e) {
        // Ignore worker setup errors
      }
      
      // Load the PDF document with fallback options
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        disableWorker: true,
        disableStream: true,
        disableAutoFetch: true
      });
      
      const pdf = await loadingTask.promise;
      
      // Extract text from all pages
      let fullText = '';
      const numPages = Math.min(pdf.numPages, 50); // Limit to 50 pages for performance
      
      for (let i = 1; i <= numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n\n';
        } catch (pageError) {
          console.warn(`Failed to extract text from page ${i}:`, pageError);
          // Continue with other pages
        }
      }
      
      return fullText;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF. The PDF file may be corrupted, password-protected, or unsupported. Error: ' + (error as Error).message);
    }
  };
  
  // Extract text from Word DOCX files
  const extractTextFromWord = async (file: File): Promise<string> => {
    try {
      // Dynamically import mammoth to avoid bundling it in the main bundle
      const mammoth = await import('mammoth');
      
      // Read the file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Extract text from Word document
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      throw new Error('Failed to extract text from Word document: ' + (error as Error).message);
    }
  };
  
  // Extract text from Markdown files
  const extractTextFromMarkdown = async (file: File): Promise<string> => {
    try {
      // Read the file as text
      const text = await file.text();
      
      // Dynamically import marked to avoid bundling it in the main bundle
      const { marked } = await import('marked');
      
      // Convert markdown to plain text (simple approach - remove markdown syntax)
      // For a more sophisticated approach, we could convert to HTML and then extract text
      return text;
    } catch (error) {
      throw new Error('Failed to extract text from Markdown file: ' + (error as Error).message);
    }
  };
  
  // Extract text from plain text files
  const extractTextFromTxt = async (file: File): Promise<string> => {
    try {
      // Read the file as text
      return await file.text();
    } catch (error) {
      throw new Error('Failed to extract text from text file: ' + (error as Error).message);
    }
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
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ border: '1px solid #f0f0f0', borderRadius: '8px', padding: '16px', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            {/* Text input area */}
            <div>
              <TextArea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="输入要解析的文本..."
                autoSize={{ minRows: 2, maxRows: 6 }}
                style={{ border: 'none', resize: 'none' }}
              />
            </div>

            {/* Action buttons at the bottom */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Button
                  type="text"
                  size="small"
                  icon={<PaperClipOutlined />}
                  onClick={() => {
                    // Handle file upload
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.pdf,.docx,.md,.txt';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
                        const supportedExtensions = ['.pdf', '.docx', '.md', '.txt'];
                        
                        if (!supportedExtensions.includes(fileExtension)) {
                          message.error('Unsupported file type. Please upload a PDF, Word (.docx), Markdown (.md), or Text (.txt) file.');
                          return;
                        }
                        extractTextFromFile(file);
                      }
                    };
                    input.click();
                  }}
                />
                <Button
                  type="text"
                  size="small"
                  icon={<GlobalOutlined />}
                />
              </div>
              
              {/* Send button on the right */}
              <Button
                type="primary"
                shape="circle"
                size="small"
                disabled={!inputText.trim()}
                onClick={parseInputText}
                icon={<ArrowUpOutlined />}
              />
            </div>
          </div>
        </div>
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
        footer={[
          <Button key="cancel" onClick={handleModalCancel}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleModalOk}
          >
            {editingProject ? "Update" : "Add"}
          </Button>,
        ]}
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
      
      {/* Preview Modal */}
      <Modal
        title="Preview Parsed Items"
        open={isPreviewModalVisible}
        onOk={handlePreviewModalOk}
        onCancel={handlePreviewModalCancel}
        width={600}
        footer={[
          <Button key="cancel" onClick={handlePreviewModalCancel}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handlePreviewModalOk}
          >
            Create Project
          </Button>,
        ]}
      >
        <Form form={previewForm} layout="vertical">
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