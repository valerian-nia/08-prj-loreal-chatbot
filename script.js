/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");

// This class-hosted Cloudflare Worker securely handles the API request.
// It does not require a key in the browser.
const workerUrl = "https://loreal-beauty-advisor.valerian-e33.workers.dev/";

// System prompt for the beauty advisor behavior.
const systemPrompt =
  "You are the L'Oréal Smart Beauty Advisor, a friendly and professional beauty assistant. Help users understand and explore L'Oréal products, makeup, skincare, haircare, fragrances, and beauty routines. Provide helpful general product and routine recommendations based on information the user shares. Ask a brief follow-up question when more information would improve a recommendation. Do not diagnose medical conditions or claim to replace a dermatologist or other healthcare professional. Stay focused on L'Oréal products and beauty routines. If a user asks about an unrelated topic, politely explain that you can only help with L'Oréal products, beauty, and routines, and invite them to ask a relevant question. Do not invent specific product facts when you are uncertain.";

// Keep the conversation in memory while this page stays open.
const conversationHistory = [{ role: "system", content: systemPrompt }];

// Add a labeled message bubble and scroll it into view.
function addChatMessage(text, sender) {
  const message = document.createElement("div");
  message.className = `chat-message ${sender}`;

  const label = document.createElement("span");
  label.className = "chat-label";
  label.textContent =
    sender === "user" ? "You" : "L'Oréal Beauty Advisor";

  const bubble = document.createElement("p");
  bubble.className = "chat-bubble";
  bubble.textContent = text;

  message.append(label, bubble);
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  return bubble;
}

// Keep the welcome message visible as the first assistant bubble.
addChatMessage("👋 Hello! How can I help you today?", "assistant");

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Clean up the message before sending.
  const message = userInput.value.trim();

  // Ignore empty messages.
  if (!message) {
    return;
  }

  // Add this question so the advisor can remember earlier messages.
  conversationHistory.push({ role: "user", content: message });
  addChatMessage(message, "user");

  // Temporarily disable the send button while the request is running.
  sendBtn.disabled = true;

  // Show a simple loading message while waiting for the API.
  const thinkingBubble = addChatMessage("Thinking...", "assistant");

  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: conversationHistory,
      }),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Read the assistant response from the OpenAI-style response payload.
    const reply = data.choices[0].message.content;

    // Keep the response so it can be included in the next request.
    conversationHistory.push({ role: "assistant", content: reply });

    thinkingBubble.textContent = reply;
    chatWindow.scrollTop = chatWindow.scrollHeight;
    userInput.value = "";
  } catch (error) {
    console.error(error);
    thinkingBubble.textContent =
      "Sorry, I couldn't connect to the beauty advisor. Please try again.";
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } finally {
    // Re-enable the button after the request finishes.
    sendBtn.disabled = false;
    userInput.focus();
  }
});
