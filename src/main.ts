// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Player } from "./player.ts";
import { Recorder } from "./recorder.ts";
import "./style.css";
import {
  LowLevelRTClient,
  ResponseFunctionCallArgumentsDoneMessage,
  SessionUpdateMessage,
  Voice,
} from "rt-client";
import { toolDefinitions, toolImplementations } from "./tools.ts";
import {
  makeNewTextBlock,
  appendToTextBlock,
  setMainWebComponent,
  appendToMainBlock,
  clearMainBlock,
} from "./ui.ts";

let realtimeStreaming: LowLevelRTClient;
let realtimeStreamingActive: boolean = false;
let audioRecorder: Recorder;
let audioPlayer: Player;

async function start_realtime(
  endpoint: string,
  apiKey: string,
  deploymentOrModel: string,
  withAudioRecording: boolean = true,
) {
  if (realtimeStreamingActive && withAudioRecording) {
    resetAudio(true);
    setFormInputState(InputState.ReadyToStop);
    return;
  }
  if (isAzureOpenAI()) {
    realtimeStreaming = new LowLevelRTClient(
      new URL(endpoint),
      { key: apiKey },
      { deployment: deploymentOrModel },
    );
  } else {
    realtimeStreaming = new LowLevelRTClient(
      { key: apiKey },
      { model: deploymentOrModel },
    );
  }

  try {
    console.log("sending session config");
    await realtimeStreaming.send(createConfigMessage());
  } catch (error) {
    console.log(error);
    await makeNewTextBlock(
      "[Connection error]: Unable to send initial config message. Please check your endpoint and authentication details.",
    );
    setFormInputState(InputState.ReadyToStart);
    return;
  }
  console.log("sent");
  realtimeStreamingActive = true;
  await Promise.all([resetAudio(withAudioRecording), handleRealtimeMessages()]);
  realtimeStreamingActive = false;
}

function createConfigMessage(): SessionUpdateMessage {
  let configMessage: SessionUpdateMessage = {
    type: "session.update",
    session: {
      turn_detection: {
        type: "server_vad",
      },
      input_audio_transcription: {
        model: "whisper-1",
      },
      instructions: "You are a helpful assistant",
      tools: toolDefinitions, // Includes the new getAccountNames tool
    },
  };

  const systemMessage = getSystemMessage();
  const temperature = getTemperature();
  const voice = getVoice();

  if (systemMessage) {
    configMessage.session.instructions = systemMessage;
  }
  if (!isNaN(temperature)) {
    configMessage.session.temperature = temperature;
  }
  if (voice) {
    configMessage.session.voice = voice;
  }

  return configMessage;
}

let toolCalls: ResponseFunctionCallArgumentsDoneMessage[] = [];

function handleStopRecordingAfterSpeaking() {
  if (stopRecordingAfterSpeaking) {
    recordingActive = false;
    stopRecordingAfterSpeaking = false;
    setFormInputState(InputState.ReadyToStop);
  }
}
async function handleRealtimeMessages() {
  clearMainBlock();
  for await (const message of realtimeStreaming.messages()) {
    let consoleLog = "" + message.type;

    switch (message.type) {
      case "session.created":
        setFormInputState(InputState.ReadyToStop);
        await makeNewTextBlock("<< Session Started >>");
        await makeNewTextBlock();
        break;
      case "response.audio_transcript.delta":
        await appendToMainBlock(message.delta);
        await appendToTextBlock(message.delta);
        break;
      case "response.audio_transcript.done":
        clearMainBlock();
        handleStopRecordingAfterSpeaking();
        await appendToMainBlock(message.transcript);
        break;
      case "response.audio.delta":
        handleStopRecordingAfterSpeaking();
        const binary = atob(message.delta);
        const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
        const pcmData = new Int16Array(bytes.buffer);
        audioPlayer.play(pcmData);
        break;

      case "input_audio_buffer.speech_started":
        await makeNewTextBlock("<< Speech Started >>");
        audioPlayer.clear();
        break;
      case "conversation.item.input_audio_transcription.completed":
        await makeNewTextBlock("User: " + message.transcript);
        break;
      case "response.done":
        handleStopRecordingAfterSpeaking();
        for (let toolCall of toolCalls) {
          clearMainBlock();
          appendToMainBlock(
            '<div class="blinking">Calling function `' +
              toolCall.name +
              "` with arguments " +
              toolCall.arguments +
              "</div>\n\n",
          );
          await makeNewTextBlock(
            "Calling function `" +
              toolCall.name +
              "` with arguments " +
              toolCall.arguments +
              "\n\n",
          );
          const toolResponse = await toolImplementations[toolCall.name](
            JSON.parse(toolCall.arguments),
          );
          appendToMainBlock("Got response " + toolResponse + "\n\n");
          appendToTextBlock("Got response " + toolResponse + "\n\n");
          await realtimeStreaming.send({
            type: "conversation.item.create",
            item: {
              call_id: toolCall.call_id,
              type: "function_call_output",
              output: toolResponse,
            },
          });
          await realtimeStreaming.send({ type: "response.create" });

          console.log("sent response.create");
          toolCalls = [];
        }
        break;
      case "response.function_call_arguments.done":
        toolCalls.push(message);
        break;
      case "response.text.delta":
        await appendToTextBlock(message.delta);
        await appendToMainBlock(message.delta);
        break;
      case "response.text.done":
        await clearMainBlock();
        await appendToMainBlock(message.text);
        break;
      default:
        consoleLog = JSON.stringify(message, null, 2);
        break;
    }
    if (consoleLog) {
      console.log(consoleLog);
    }
  }
  resetAudio(false);
}

/**
 * Basic audio handling
 */

let recordingActive: boolean = false;
let stopRecordingAfterSpeaking: boolean = false;
let buffer: Uint8Array = new Uint8Array();

function combineArray(newData: Uint8Array) {
  const newBuffer = new Uint8Array(buffer.length + newData.length);
  newBuffer.set(buffer);
  newBuffer.set(newData, buffer.length);
  buffer = newBuffer;
}

function processAudioRecordingBuffer(data: Buffer) {
  const uint8Array = new Uint8Array(data);
  combineArray(uint8Array);
  if (buffer.length >= 4800) {
    const toSend = new Uint8Array(buffer.slice(0, 4800));
    buffer = new Uint8Array(buffer.slice(4800));
    const regularArray = String.fromCharCode(...toSend);
    const base64 = btoa(regularArray);
    if (recordingActive) {
      realtimeStreaming.send({
        type: "input_audio_buffer.append",
        audio: base64,
      });
    }
  }
}

async function resetAudio(startRecording: boolean) {
  recordingActive = false;
  if (audioRecorder) {
    audioRecorder.stop();
  }
  if (audioPlayer) {
    audioPlayer.clear();
  }
  audioRecorder = new Recorder(processAudioRecordingBuffer);
  audioPlayer = new Player();
  audioPlayer.init(24000);
  if (startRecording) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioRecorder.start(stream);
    recordingActive = true;
    setFormInputState(InputState.ReadyToStop);
  }
}

/**
 * UI and controls
 */

const formStartButton =
  document.querySelector<HTMLButtonElement>("#start-recording")!;
const formStopButton =
  document.querySelector<HTMLButtonElement>("#stop-recording")!;
const formSessionInstructionsField =
  document.querySelector<HTMLTextAreaElement>("#session-instructions")!;
const formTemperatureField =
  document.querySelector<HTMLInputElement>("#temperature")!;
const formVoiceSelection = document.querySelector<HTMLInputElement>("#voice")!;

// Set default values from environment variables
const endpoint = import.meta.env.VITE_AI_ENDPOINT || "";
const apiKey = import.meta.env.VITE_AI_API_KEY || "";
const deploymentOrModel = import.meta.env.VITE_AI_DEPLOYMENT_NAME || "";

enum InputState {
  Working,
  ReadyToStart,
  ReadyToStop,
}

function isAzureOpenAI(): boolean {
  return true;
}

function setFormInputState(state: InputState) {
  formStartButton.disabled = state == InputState.Working;
  formStopButton.disabled = state != InputState.ReadyToStop;
  formSessionInstructionsField.disabled = state != InputState.ReadyToStart;
  if (state === InputState.ReadyToStop && recordingActive) {
    formStartButton.classList.add("recording");
    if (stopRecordingAfterSpeaking) {
      formStartButton.classList.add("blinking");
    }
  } else {
    formStartButton.classList.remove("recording");
    formStartButton.classList.remove("blinking");
  }
}

function getSystemMessage(): string {
  return formSessionInstructionsField.value || "";
}

function getTemperature(): number {
  return parseFloat(formTemperatureField.value);
}

function getVoice(): Voice {
  return formVoiceSelection.value as Voice;
}

formStartButton.addEventListener("click", async () => {
  setFormInputState(InputState.Working);

  if (isAzureOpenAI() && !endpoint && !deploymentOrModel) {
    alert("Endpoint and Deployment are required for Azure OpenAI");
    return;
  }

  if (!isAzureOpenAI() && !deploymentOrModel) {
    alert("Model is required for OpenAI");
    return;
  }

  if (!apiKey) {
    alert("API Key is required");
    return;
  }

  if (recordingActive) {
    stopRecordingAfterSpeaking = true;
    setFormInputState(InputState.ReadyToStop);
    return;
  }
  try {
    start_realtime(endpoint, apiKey, deploymentOrModel);
  } catch (error) {
    console.log(error);
    setFormInputState(InputState.ReadyToStart);
  }
});

formStopButton.addEventListener("click", async () => {
  setFormInputState(InputState.Working);
  resetAudio(false);
  realtimeStreaming.close();
  setFormInputState(InputState.ReadyToStart);
});

const customChatMessage =
  document.querySelector<HTMLTextAreaElement>("#customchatmessage")!;

const sendCustomChatMessageButton = document.querySelector<HTMLButtonElement>(
  "#sendcustomchatmessagebutton",
)!;

sendCustomChatMessageButton.addEventListener("click", async () => {
  if (!realtimeStreaming) {
    start_realtime(endpoint, apiKey, deploymentOrModel, false);
  }

  await realtimeStreaming.send({
    type: "conversation.item.create",
    item: {
      type: "message",
      role: "user",
      content: [{ type: "input_text", text: customChatMessage.value }],
    },
  });
  customChatMessage.value = "";
  await makeNewTextBlock();
  await realtimeStreaming.send({
    type: "response.create",
    response: {
      modalities: ["text"],
    },
  });
});

window.addEventListener("popstate", (event) => {
  const path = window.location.pathname;
  if (path === "/") {
    setMainWebComponent(null); // No main component for root
  } else if (event.state) {
    const { componentName, params } = event.state;
    const component = document.createElement(componentName);
    const searchParams = new URLSearchParams(params);
    for (const [key, value] of searchParams.entries()) {
      component.setAttribute(key, value);
    }
    setMainWebComponent(component);
  }
});
