import React, { useState, useEffect } from "react";
import { Form, Input, Button, message, Card, Select, AutoComplete, Typography, Divider } from "antd";

const { Option } = Select;
const { Title, Text } = Typography;

const ApiKeyConfig = () => {
  const [form] = Form.useForm();
  const [config, setConfig] = useState({
    llm: "anthropic",
    apiKey: "",
    modelName: "claude-3-7-sonnet-20250219",
    options: {
      baseURL: "https://api.anthropic.com/v1",
    },
  });

  useEffect(() => {
    chrome.storage.sync.get(["llmConfig"], (result) => {
      if (result.llmConfig) {
        if (result.llmConfig.llm === "") {
          result.llmConfig.llm = "anthropic";
        }
        setConfig(result.llmConfig);
        form.setFieldsValue(result.llmConfig);
      }
    });
  }, []);

  const handleSave = () => {
    form
      .validateFields()
      .then((values) => {
        setConfig(values);
        chrome.storage.sync.set(
          {
            llmConfig: values,
          },
          () => {
            message.success("API Key configuration saved successfully!");
          }
        );
      })
      .catch(() => {
        message.error("Please check the form fields");
      });
  };

  const modelLLMs = [
    { value: "anthropic", label: "Claude (default)" },
    { value: "openai", label: "OpenAI" },
    { value: "openrouter", label: "OpenRouter" },
    { value: "gemini", label: "Gemini" },
  ];

  const modelOptions = {
    anthropic: [
      { value: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet (default)" },
      { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" }
    ],
    openai: [
      { value: "gpt-4o", label: "gpt-4o (default)" },
      { value: "gpt-4.1", label: "gpt-4.1" },
      { value: "gpt-4.1-mini", label: "gpt-4.1-mini" },
      { value: "gpt-4o-mini", label: "gpt-4o-mini" },
    ],
    openrouter: [
      { value: "anthropic/claude-3.7-sonnet", label: "claude-3.7-sonnet (default)" },
      { value: "anthropic/claude-3.5-sonnet", label: "claude-3.5-sonnet" },
      { value: "openai/gpt-4.1", label: "gpt-4.1" },
      { value: "openai/gpt-4.1-mini", label: "gpt-4.1-mini" },
      { value: "openai/gpt-4o", label: "gpt-4o" },
      { value: "google/gemini-2.5-flash-preview-05-20", label: "gemini-2.5-flash-preview-05-20" },
      { value: "google/gemini-2.5-pro-preview", label: "gemini-2.5-pro-preview" },
    ],
    gemini: [
      { value: "gemini-2.5-flash-preview-05-20", label: "gemini-2.5-flash-preview-05-20 (default)" },
      { value: "gemini-2.5-pro-preview", label: "gemini-2.5-pro-preview" },
      { value: "gemini-2.0-flash", label: "gemini-2.0-flash" },
    ],
  };

  const handleLLMChange = (value: string) => {
    const baseURLMap = {
      openai: "https://api.openai.com/v1",
      anthropic: "https://api.anthropic.com/v1",
      openrouter: "https://openrouter.ai/api/v1",
      gemini: "https://generativelanguage.googleapis.com/v1beta"
    };
    const newConfig = {
      llm: value,
      apiKey: "",
      modelName: modelOptions[value][0].value,
      options: {
        baseURL: baseURLMap[value]
      },
    };
    setConfig(newConfig);
    form.setFieldsValue(newConfig);
  };

  return (
    <Card 
      title={<Title level={4}>API Key Configuration</Title>}
      bordered={false}
      style={{ width: '100%' }}
    >
      <Form form={form} layout="vertical" initialValues={config}>
        <Card 
          size="small" 
          title={<Text strong>Model Provider</Text>}
          style={{ marginBottom: 24 }}
        >
          <Form.Item
            name="llm"
            label="LLM Provider"
            rules={[
              {
                required: true,
                message: "Please select a LLM provider",
              },
            ]}
          >
            <Select placeholder="Choose a LLM provider" onChange={handleLLMChange}>
              {modelLLMs.map((llm) => (
                <Option key={llm.value} value={llm.value}>
                  {llm.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Card>

        <Card 
          size="small" 
          title={<Text strong>API Configuration</Text>}
          style={{ marginBottom: 24 }}
        >
          <Form.Item
            name={["options", "baseURL"]}
            label="Base URL"
            rules={[
              {
                required: true,
                message: "Please enter the base URL",
              },
            ]}
          >
            <Input placeholder="Please enter the base URL" />
          </Form.Item>

          <Form.Item
            name="modelName"
            label="Model Name"
            rules={[
              {
                required: true,
                message: "Please select a model",
              },
            ]}
          >
            <AutoComplete
              placeholder="Model name"
              options={modelOptions[config.llm]}
              filterOption={(inputValue, option) =>
                (option.value as string).toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
            />
          </Form.Item>

          <Form.Item
            name="apiKey"
            label="API Key"
            rules={[
              {
                required: true,
                message: "Please enter the API Key",
              },
            ]}
          >
            <Input.Password placeholder="Please enter the API Key" allowClear />
          </Form.Item>
        </Card>

        <Form.Item>
          <Button type="primary" onClick={handleSave} size="large" block>
            Save Configuration
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ApiKeyConfig;