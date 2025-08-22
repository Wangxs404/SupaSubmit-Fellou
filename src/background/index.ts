import { Eko } from "@eko-ai/eko";
import { main, parseTextWithLLM } from "./main";

var eko: Eko;

chrome.storage.local.set({ running: false });

// Listen to messages from the browser extension
chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  if (request.type == "run") {
    try {
      // Click the RUN button to execute the main function (workflow)
      chrome.runtime.sendMessage({ type: "log", log: "Run..." });
      // Run workflow
      eko = await main(request.prompt);
    } catch (e) {
      console.error(e);
      chrome.runtime.sendMessage({
        type: "log",
        log: e + "",
        level: "error",
      });
    }
  } else if (request.type == "stop") {
    eko && eko.getAllTaskId().forEach(taskId => {
      eko.abortTask(taskId);
      chrome.runtime.sendMessage({ type: "log", log: "Abort taskId: " + taskId });
    });
    chrome.runtime.sendMessage({ type: "log", log: "Stop" });
  } else if (request.type === "new_task") {
    // Handle new task from side panel
    try {
      chrome.runtime.sendMessage({ 
        type: "log", 
        log: `Starting new task: ${request.task}` 
      });
      
      // Emit execution start event
      chrome.runtime.sendMessage({
        type: "execution",
        actor: "SYSTEM",
        state: "TASK_START",
        data: { details: "Starting new task" },
        timestamp: Date.now()
      });
      
      // Run the task
      eko = await main(request.task);
    } catch (e) {
      console.error(e);
      chrome.runtime.sendMessage({
        type: "log",
        log: e + "",
        level: "error",
      });
      
      // Emit execution error event
      chrome.runtime.sendMessage({
        type: "execution",
        actor: "SYSTEM",
        state: "TASK_FAIL",
        data: { details: e.toString() },
        timestamp: Date.now()
      });
    }
  } else if (request.type === "follow_up_task") {
    // Handle follow-up task from side panel
    try {
      chrome.runtime.sendMessage({ 
        type: "log", 
        log: `Starting follow-up task: ${request.task}` 
      });
      
      // Emit execution start event
      chrome.runtime.sendMessage({
        type: "execution",
        actor: "SYSTEM",
        state: "TASK_START",
        data: { details: "Starting follow-up task" },
        timestamp: Date.now()
      });
      
      // Run the task
      eko = await main(request.task);
    } catch (e) {
      console.error(e);
      chrome.runtime.sendMessage({
        type: "log",
        log: e + "",
        level: "error",
      });
      
      // Emit execution error event
      chrome.runtime.sendMessage({
        type: "execution",
        actor: "SYSTEM",
        state: "TASK_FAIL",
        data: { details: e.toString() },
        timestamp: Date.now()
      });
    }
  } else if (request.type === "cancel_task") {
    // Handle task cancellation
    eko && eko.getAllTaskId().forEach(taskId => {
      eko.abortTask(taskId);
      chrome.runtime.sendMessage({ 
        type: "log", 
        log: "Task cancelled: " + taskId 
      });
    });
    
    // Emit execution cancel event
    chrome.runtime.sendMessage({
      type: "execution",
      actor: "SYSTEM",
      state: "TASK_CANCEL",
      data: { details: "Task cancelled by user" },
      timestamp: Date.now()
    });
    
    chrome.runtime.sendMessage({ type: "stop" });
  } else if (request.type === "state") {
    // Handle state request
    chrome.runtime.sendMessage({
      type: "log",
      log: "Current state requested",
      level: "info"
    });
  } else if (request.type === "nohighlight") {
    // Handle remove highlight request
    chrome.runtime.sendMessage({
      type: "log",
      log: "Remove highlight requested",
      level: "info"
    });
  } else if (request.type === "parse_text") {
    // Handle text parsing request
    try {
      chrome.runtime.sendMessage({ 
        type: "log", 
        log: "Parsing text with LLM..." 
      });
      
      // Parse the text using LLM
      const parsedItems = await parseTextWithLLM(request.text);
      
      // Send parsed items back to the sender
      chrome.runtime.sendMessage({
        type: "parsed_items",
        items: parsedItems
      });
    } catch (e) {
      console.error(e);
      chrome.runtime.sendMessage({
        type: "log",
        log: "Error parsing text: " + e.message,
        level: "error",
      });
      
      // Send error back to the sender
      chrome.runtime.sendMessage({
        type: "parsed_items_error",
        error: e.message
      });
    }
  }
});

(chrome as any).sidePanel && (chrome as any).sidePanel.setPanelBehavior({ openPanelOnActionClick: true });