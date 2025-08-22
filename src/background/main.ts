import { Eko, LLMs, StreamCallbackMessage } from "@eko-ai/eko";
import { StreamCallback, HumanCallback } from "@eko-ai/eko/types";
import { BrowserAgent } from "@eko-ai/eko-extension";

// System prompt for extracting key-value pairs from text
const PARSING_SYSTEM_PROMPT = `You are an expert at extracting structured information from unstructured text. Your task is to identify and extract key-value pairs from the provided text with high precision.

STRICT GUIDELINES:
1. Extract ONLY clear, explicit key-value pairs from the text
2. Keys MUST be in English, even if the source text is in Chinese
3. Translate Chinese keys to English (e.g., "姓名" -> "name", "年龄" -> "age")
4. Values can be in any language but must be accurate
5. ONLY extract information that is explicitly stated in the text
6. Do NOT infer or guess information not present in the text
7. Format the output as a VALID JSON object with key-value pairs
8. Return ONLY the JSON object, nothing else (no markdown, no explanations)

FEW-SHOT EXAMPLES:

Example 1:
Input: "姓名=王小双,年龄=21,职业=程序员,技能=python"
Output: {"name": "王小双", "age": "21", "occupation": "程序员", "skills": "python"}

Example 2:
Input: "Name: John Smith, Age: 28, Email: john@example.com, Phone: +1-555-0123"
Output: {"name": "John Smith", "age": "28", "email": "john@example.com", "phone": "+1-555-0123"}

Example 3:
Input: "申请人：张三，联系电话：13800138000，申请职位：软件工程师，工作经验：3年"
Output: {"applicant": "张三", "phone": "13800138000", "position": "软件工程师", "experience": "3年"}

Example 4:
Input: "Product: iPhone 15, Price: $999, Color: Black, Storage: 128GB"
Output: {"product": "iPhone 15", "price": "$999", "color": "Black", "storage": "128GB"}

Example 5:
Input: "无明确键值对信息"
Output: {}

OUTPUT FORMAT:
- Return a valid JSON object
- Keys must be strings in English
- Values must be strings
- No markdown formatting (no \`\`\`json or \`\`\`)
- No additional text or explanations
- If no clear key-value pairs found, return empty object: {}`;

export async function getLLMConfig(name: string = "llmConfig"): Promise<any> {
  let result = await chrome.storage.sync.get([name]);
  return result[name];
}

export async function main(prompt: string): Promise<Eko> {
  let config = await getLLMConfig();
  if (!config || !config.apiKey) {
    printLog("Please configure apiKey, configure in the eko extension options of the browser extensions.", "error");
    chrome.runtime.openOptionsPage();
    chrome.storage.local.set({ running: false });
    chrome.runtime.sendMessage({ type: "stop" });
    return;
  }

  const llms: LLMs = {
    default: {
      provider: config.llm as any,
      model: config.modelName,
      apiKey: config.apiKey,
      config: {
        baseURL: config.options.baseURL,
      },
    },
  };

  return runEkoTask(llms, prompt);
}

// Function to parse text and extract key-value pairs using OpenRouter API directly
export async function parseTextWithLLM(inputText: string): Promise<{key: string, value: string}[]> {
  try {
    // Get LLM configuration
    let config = await getLLMConfig();
    if (!config) {
      throw new Error("LLM configuration not found. Please configure API key in extension options.");
    }
    
    if (!config.apiKey) {
      throw new Error("API Key not found in configuration. Please configure API key in extension options.");
    }
    
    // Check if API key is valid (not empty or just whitespace)
    if (!config.apiKey.trim()) {
      throw new Error("API Key is empty. Please configure a valid API key in extension options.");
    }

    // Create prompt for parsing
    const parsePrompt = `${PARSING_SYSTEM_PROMPT}

TASK:
Extract key-value pairs from the following text:
"${inputText}"

RESPONSE REQUIREMENTS:
1. Return ONLY a valid JSON object
2. NO markdown formatting (no \`\`\`json or \`\`\`)
3. NO explanations or additional text
4. If no clear key-value pairs found, return: {}`;

    // Prepare the API request
    const apiUrl = config.options.baseURL || "https://openrouter.ai/api/v1";
    const modelName = config.modelName || "anthropic/claude-3.5-sonnet";
    
    const requestBody = {
      model: modelName,
      messages: [
        {
          role: "user",
          content: parsePrompt
        }
      ],
      temperature: 0.1, // Lower temperature for more deterministic output
      max_tokens: 500, // Reduce max tokens as we expect short JSON output
      top_p: 0.9,
      frequency_penalty: 0.0,
      presence_penalty: 0.0
    };

    // Make the API call directly to OpenRouter
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://fellou.ai', // Optional, for OpenRouter analytics
        'X-Title': 'Fellou AI Extension' // Optional, for OpenRouter analytics
      },
      body: JSON.stringify(requestBody)
    }).catch(error => {
      throw new Error(`Network error when calling OpenRouter API: ${error.message}`);
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Extract the response content
    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from OpenRouter API");
    }
    
    // Parse the result to extract key-value pairs
    try {
      // Clean the content by removing markdown code block markers if present
      let cleanedContent = content.trim();
      
      // Remove leading code block markers
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.substring(7).trim(); // Remove ```json
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.substring(3).trim(); // Remove ```
      }
      
      // Remove trailing code block markers
      if (cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.slice(0, -3).trim(); // Remove trailing ```
      }
      
      // Additional cleanup - remove any remaining whitespace
      cleanedContent = cleanedContent.trim();
      
      // Try to parse the result as JSON
      const parsedResult = JSON.parse(cleanedContent);
      const keyValuePairs: {key: string, value: string}[] = [];
      
      // Convert JSON object to array of key-value pairs
      for (const [key, value] of Object.entries(parsedResult)) {
        keyValuePairs.push({key, value: String(value)});
      }
      
      return keyValuePairs;
    } catch (parseError) {
      console.error("Error parsing LLM response:", parseError);
      console.error("Original content:", content);
      // Try to extract JSON from the content using regex as a fallback
      try {
        // Look for JSON object pattern in the content
        const jsonRegex = /\{[^}]*\}/s;
        const match = content.match(jsonRegex);
        if (match) {
          const jsonString = match[0];
          const parsedResult = JSON.parse(jsonString);
          const keyValuePairs: {key: string, value: string}[] = [];
          
          // Convert JSON object to array of key-value pairs
          for (const [key, value] of Object.entries(parsedResult)) {
            keyValuePairs.push({key, value: String(value)});
          }
          
          return keyValuePairs;
        }
      } catch (fallbackError) {
        console.error("Fallback parsing also failed:", fallbackError);
      }
      throw new Error("Failed to parse LLM response as JSON: " + content);
    }
  } catch (error) {
    console.error("Error in parseTextWithLLM:", error);
    throw error;
  }
}

// New function to run Eko task with given LLMs and prompt
export async function runEkoTask(llms: LLMs, prompt: string): Promise<Eko> {

  let callback: StreamCallback & HumanCallback = {
    onMessage: async (message: StreamCallbackMessage) => {
      if (message.type == "workflow") {
        printLog("Plan\n" + message.workflow.xml, "info", !message.streamDone);
      } else if (message.type == "text") {
        printLog(message.text, "info", !message.streamDone);
      } else if (message.type == "tool_streaming") {
        printLog(`${message.agentName} > ${message.toolName}\n${message.paramsText}`, "info", true);
      } else if (message.type == "tool_use") {
        printLog(
          `${message.agentName} > ${message.toolName}\n${JSON.stringify(
            message.params
          )}`
        );
      }
      console.log("message: ", JSON.stringify(message, null, 2));
    },
    onHumanConfirm: async (context, prompt) => {
      return confirm(prompt);
    },
  };

  let agents = [new BrowserAgent()];
  let eko = new Eko({ llms, agents, callback });
  eko
    .run(prompt)
    .then((res) => {
      printLog(res.result, res.success ? "success" : "error");
    })
    .catch((error) => {
      printLog(error, "error");
    })
    .finally(() => {
      chrome.storage.local.set({ running: false });
      chrome.runtime.sendMessage({ type: "stop" });
    });
  return eko;
}

function printLog(
  message: string,
  level?: "info" | "success" | "error",
  stream?: boolean
) {
  chrome.runtime.sendMessage({
    type: "log",
    log: message + "",
    level: level || "info",
    stream,
  });
}
