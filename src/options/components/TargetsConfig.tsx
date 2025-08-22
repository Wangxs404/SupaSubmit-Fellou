import React, { useState, useEffect } from "react";
import { 
  Button, 
  message, 
  Input, 
  Form, 
  List,
  Space,
  Popconfirm,
  Card,
  Typography
} from "antd";
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Title } = Typography;

const TargetsConfig = () => {
  const [targets, setTargets] = useState<string[]>([]);
  const [form] = Form.useForm();

  // Load targets from storage
  useEffect(() => {
    loadTargets();
  }, []);

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

  const handleSave = () => {
    form
      .validateFields()
      .then(values => {
        // Filter out empty URLs
        const filteredUrls = values.urls.filter((url: string) => url.trim() !== '');
        setTargets(filteredUrls);
        message.success('Targets updated successfully');
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  const addUrlField = () => {
    const urls = form.getFieldValue('urls') || [];
    form.setFieldsValue({ urls: [...urls, ''] });
  };

  const removeUrlField = (index: number) => {
    const urls = form.getFieldValue('urls') || [];
    if (urls.length <= 1) {
      form.setFieldsValue({ urls: [''] });
    } else {
      const newUrls = urls.filter((_: string, i: number) => i !== index);
      form.setFieldsValue({ urls: newUrls });
    }
  };

  // Initialize form with targets
  useEffect(() => {
    form.setFieldsValue({ urls: targets.length > 0 ? targets : [''] });
  }, [targets]);

  return (
    <Card 
      title={<Title level={4}>Targets Configuration</Title>}
      bordered={false}
      style={{ width: '100%' }}
      extra={
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={addUrlField}
        >
          Add Target
        </Button>
      }
    >
      <Form form={form} layout="vertical">
        <Form.List name="urls">
          {(fields, { add, remove }) => (
            <>
              <List
                dataSource={fields}
                renderItem={({ key, name, ...restField }, index) => (
                  <List.Item key={key}>
                    <Space style={{ width: '100%' }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name]}
                        rules={[{ required: true, message: 'Please enter a URL' }]}
                        style={{ flex: 1 }}
                      >
                        <Input placeholder="https://example.com" />
                      </Form.Item>
                      <Popconfirm
                        title="Delete target"
                        description="Are you sure you want to delete this target?"
                        onConfirm={() => removeUrlField(index)}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button icon={<DeleteOutlined />} danger>
                          Remove
                        </Button>
                      </Popconfirm>
                    </Space>
                  </List.Item>
                )}
              />
            </>
          )}
        </Form.List>
        
        <Form.Item>
          <Button type="primary" onClick={handleSave} size="large" block>
            Save Targets
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default TargetsConfig;