const container = document.querySelector(".container");
const chatsContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = promptForm.querySelector(".prompt-input");
const fileInput = promptForm.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const themeToggle = document.querySelector("#theme-toggle-btn");

const API_URL = "/chat";

let typingInterval, controller;
const chatHistory = [];
const userData = { message: "", file: {} };

const createMsgElement = (content, ...className) => {
  const div = document.createElement("div");
  div.classList.add("message", ...className);
  div.innerHTML = content;
  return div;
};

const scrollToBottom = () =>
  container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });

function addCopyButtons() {
  document.querySelectorAll("pre").forEach((block) => {
    if (block.querySelector(".copy-btn")) return;

    const button = document.createElement("button");
    button.innerText = "Copy";
    button.className = "copy-btn";

    button.onclick = () => {
      navigator.clipboard.writeText(block.innerText);
      button.innerText = "Copied!";
      setTimeout(() => (button.innerText = "Copy"), 2000);
    };

    block.appendChild(button);
  });
}

const typingEffect = (text, textElement, botMsgDiv) => {
  textElement.textContent = "";
  let index = 0;

  typingInterval = setInterval(() => {
    if (index < text.length) {
      textElement.textContent += text[index++];
      scrollToBottom();
    } else {
      clearInterval(typingInterval);

      textElement.innerHTML = marked.parse(text);

      document.querySelectorAll("pre code").forEach((block) => {
        hljs.highlightElement(block);
      });

      addCopyButtons();

      botMsgDiv.classList.remove("loading");
      document.body.classList.remove("bot-responding");
    }
  }, 10);
};

const generateResponse = async (botMsgDiv) => {
  const textElement = botMsgDiv.querySelector(".message-text");
  controller = new AbortController();

  const userParts = [{ text: userData.message }];

  if (userData.file.data) {
    userParts.push({
      inline_data: {
        mime_type: userData.file.mime_type,
        data: userData.file.data,
      },
    });
  }

  chatHistory.push({
    role: "user",
    parts: userParts,
  });

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: chatHistory }),
      signal: controller.signal,
    });

    const data = await response.json();

    const responseText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response";

    chatHistory.push({
      role: "model",
      parts: [{ text: responseText }],
    });

    typingEffect(responseText, textElement, botMsgDiv);

  } catch (error) {
    textElement.style.color = "#d62939";
    textElement.textContent = error.message;

    botMsgDiv.classList.remove("loading");
    document.body.classList.remove("bot-responding");
  } finally {
    userData.file = {};
  }
};

const handleFormSubmit = (e) => {
  e.preventDefault();

  const userMessage = promptInput.value.trim();
  if (!userMessage || document.body.classList.contains("bot-responding"))
    return;

  promptInput.value = "";
  userData.message = userMessage;

  document.body.classList.add("bot-responding", "chats-active");

  const userMsgHTML = `<p class="message-text">${userMessage}</p>`;
  const userMsgDiv = createMsgElement(userMsgHTML, "user-message");

  chatsContainer.appendChild(userMsgDiv);
  scrollToBottom();

  setTimeout(() => {
    const botMsgHTML = `
      <img src="ntr.png" class="avatar">
      <p class="message-text"></p>
    `;

    const botMsgDiv = createMsgElement(botMsgHTML, "bot-message", "loading");

    chatsContainer.appendChild(botMsgDiv);
    scrollToBottom();

    generateResponse(botMsgDiv);
  }, 400);
};

promptForm.addEventListener("submit", handleFormSubmit);

document
  .querySelector("#add-file-btn")
  .addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.readAsDataURL(file);

  reader.onload = (e) => {
    fileInput.value = "";

    const base64String = e.target.result.split(",")[1];

    userData.file = {
      fileName: file.name,
      data: base64String,
      mime_type: file.type,
      isImage: file.type.startsWith("image/"),
    };

    fileUploadWrapper.classList.add(
      "active",
      userData.file.isImage ? "img-attached" : "file-attached"
    );
  };
});

document.querySelector("#cancel-file-btn").addEventListener("click", () => {
  userData.file = {};
  fileUploadWrapper.classList.remove("active", "img-attached", "file-attached");
});

document.querySelector("#stop-response-btn").addEventListener("click", () => {
  clearInterval(typingInterval);
  document.body.classList.remove("bot-responding");
});

document.querySelector("#delete-chat-btn").addEventListener("click", () => {
  chatHistory.length = 0;
  chatsContainer.innerHTML = "";
  document.body.classList.remove("bot-responding", "chats-active");
});

document.querySelectorAll(".suggestions-item").forEach((item) => {
  item.addEventListener("click", () => {
    promptInput.value = item.querySelector(".text").textContent;
    promptForm.dispatchEvent(new Event("submit"));
  });
});

themeToggle.addEventListener("click", () => {
  const isLightTheme = document.body.classList.toggle("light-theme");

  localStorage.setItem("themeColor", isLightTheme ? "light_mode" : "dark_mode");

  themeToggle.textContent = isLightTheme ? "dark_mode" : "light_mode";
});

const isLightTheme = localStorage.getItem("themeColor") === "light_mode";

document.body.classList.toggle("light-theme", isLightTheme);
themeToggle.textContent = isLightTheme ? "dark_mode" : "light_mode";

document
  .querySelector("#add-file-btn")
  .addEventListener("click", () => fileInput.click());