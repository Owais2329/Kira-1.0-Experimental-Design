/* ========================================
   Kira – Main Frontend Logic (main.js)
   ======================================== */

$(document).ready(function () {
  /* ✨ Jarvis-style animated banner text */
  $(".text").textillate({
    loop: true,
    minDisplayTime: 1500,
    sync: true,
    in: { effect: "bounceIn" },
    out: { effect: "bounceOut" },
  });

  /* 🌐 WebSocket connection to backend */
  let ws;
  function connectWS() {
    ws = new WebSocket("ws://localhost:8000/ws"); // update with backend port

    ws.onopen = () => console.log("✅ Connected to backend");
    ws.onmessage = (evt) => handleServerMessage(JSON.parse(evt.data));
    ws.onclose = () => setTimeout(connectWS, 3000);
    ws.onerror = (err) => console.error("❌ WS Error:", err);
  }
  connectWS();

  /* 🧠 Handle messages from backend */
  function handleServerMessage(msg) {
    if (msg.type === "tts") {
      playTTS(msg.audioUrl);
    } else if (msg.type === "chat") {
      appendChat("assistant", msg.text);
    } else if (msg.type === "subtitle") {
      $("#subtitleDisplay").text(msg.text);
    } else if (msg.type === "toast") {
      showToast(msg.title, msg.text);
    }
  }

  /* 🎤 Web Speech API – Speech Recognition */
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      $("#subtitleDisplay").text(transcript);
      if (event.results[event.results.length - 1].isFinal) {
        sendToServer({ type: "stt", text: transcript });
        appendChat("user", transcript);
      }
    };

    recognition.onerror = (e) => console.error("STT Error", e);
    recognition.onend = () => console.log("🎤 STT stopped");
  }

  /* 🔊 Play backend TTS audio */
  function playTTS(url) {
    const audio = new Audio(url);
    audio.play();
  }

  /* 💬 Chat UI */
  const chatBody = document.getElementById("chatBody");
  function appendChat(sender, text) {
    const bubble = document.createElement("div");
    bubble.className = sender === "user" ? "chat-bubble user" : "chat-bubble assistant";
    bubble.textContent = text;
    chatBody.appendChild(bubble);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  $("#sendChatBtn").click(() => {
    const msg = $("#chatInput").val();
    if (!msg) return;
    appendChat("user", msg);
    sendToServer({ type: "chat", text: msg });
    $("#chatInput").val("");
  });

  /* 🚀 Floating menu actions */
  const menuContainer = document.querySelector(".menu-container");
  const menuBtn = document.querySelector(".menu-btn");
  menuBtn.addEventListener("click", () => menuContainer.classList.toggle("active"));

  document.getElementById("micBtn").addEventListener("click", () => {
    if (recognition) recognition.start();
    showToast("Listening", "🎤 Speak now");
  });

  document.getElementById("chatBtn").addEventListener("click", () => {
    const chatPanel = new bootstrap.Offcanvas(document.getElementById("chatPanel"));
    chatPanel.show();
  });

  document.getElementById("settingsBtn").addEventListener("click", () => {
    const settingsModal = new bootstrap.Modal(document.getElementById("settingsModal"));
    settingsModal.show();
  });

  document.getElementById("attachBtn").addEventListener("click", () => {
    const attachModal = new bootstrap.Modal(document.getElementById("attachmentModal"));
    attachModal.show();
  });

  /* 📤 Send data to backend */
  function sendToServer(obj) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(obj));
    }
  }

  /* 🔔 Bootstrap Toast helper */
  function showToast(title, body) {
    const toastEl = document.createElement("div");
    toastEl.className = "toast align-items-center text-bg-primary border-0";
    toastEl.setAttribute("role", "alert");
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body"><strong>${title}</strong>: ${body}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>`;

    document.getElementById("toastContainer").appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
  }

  /* 🎥 Vision / AR hooks */
  const cameraFeed = document.getElementById("cameraFeed");
  if (cameraFeed) {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      cameraFeed.srcObject = stream;
    });
  }
});
