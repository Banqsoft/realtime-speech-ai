import { marked } from "marked";

const formReceivedTextContainer = document.querySelector<HTMLDivElement>(
  "#received-text-container",
)!;
const lastChatResponseContainer = document.querySelector<HTMLDivElement>(
  "#last-chat-response-container",
)!;
const formClearAllButton =
  document.querySelector<HTMLButtonElement>("#clear-all")!;

formClearAllButton.addEventListener("click", async () => {
  formReceivedTextContainer.innerHTML = "";
});

export async function setMainWebComponent(component: HTMLElement | null) {
  const mainContainer = document.querySelector<HTMLDivElement>(
    "#main-component-container",
  )!;
  if (component === null) {
    mainContainer.replaceChildren();
    window.history.pushState({}, "", "/");
    return;
  }
  mainContainer.replaceChildren(component);

  // Set the URL
  const componentName = component.tagName.toLowerCase();
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(component.dataset)) {
    params.append(key, value!);
  }
  const newUrl = `${window.location.origin}/${componentName}?${params.toString()}`;
  window.history.pushState(
    { componentName, params: params.toString() },
    "",
    newUrl,
  );
}

export function refreshMainComponent() {
  const mainContainer = document.querySelector<HTMLDivElement>(
    "#main-component-container",
  )!;
  const component = mainContainer.children[0] as HTMLElement;
  if (component && typeof (component as any).connectedCallback === "function") {
    (component as any).connectedCallback();
  }
}

export async function getMainComponentInfo() {
  const mainContainer = document.querySelector<HTMLDivElement>(
    "#main-component-container",
  )!;
  const component = mainContainer.children[0] as HTMLElement;
  if (component && typeof (component as any).componentInfo === "function") {
    return await (component as any).componentInfo();
  } else if (!component) {
    return "You are viewing the main page, and you can ask me about anything.";
  } else {
    return (
      "The current component in view is " +
      component.tagName +
      " but I don't have any information about it."
    );
  }
}

export async function addWebComponent(component: HTMLElement) {
  formReceivedTextContainer.appendChild(document.createElement("hr"));
  formReceivedTextContainer.appendChild(component);
}

export async function makeNewTextBlock(text: string = "") {
  let newElement = document.createElement("div");
  newElement.innerHTML = await marked(text);
  newElement.dataset.markdownText = text;
  formReceivedTextContainer.prepend(newElement);
  return newElement;
}

export async function clearMainBlock() {
  lastChatResponseContainer.innerHTML = "";
  lastChatResponseContainer.dataset.markdownText = "";
}

export async function appendToMainBlock(text: string) {
  let textElement: HTMLDivElement = lastChatResponseContainer;
  textElement.dataset.markdownText += text;
  textElement.innerHTML = await marked(textElement.dataset.markdownText || "");
}

export async function appendToTextBlock(text: string) {
  let textElements = formReceivedTextContainer.children;
  let textElement: HTMLDivElement;
  if (textElements.length == 0) {
    textElement = await makeNewTextBlock();
  } else {
    textElement = textElements[textElements.length - 1] as HTMLDivElement;
  }
  textElement.dataset.markdownText += text;
  textElement.innerHTML = await marked(textElement.dataset.markdownText || "");
}

const path = window.location.pathname;
if (path === "/") {
  setMainWebComponent(null); // No main component for root
} else {
  const component = document.createElement(path.split("/")[1]);
  const params = new URLSearchParams(window.location.search);

  for (const [key, value] of params.entries()) {
    component.dataset[key] = value;
    console.log(`${key}: ${value}`);
  }
  setMainWebComponent(component);
}
