console.log("Focus Cat content script running!");

(async () => {
  console.log("Focus Cat: Starting...");

  try {
    const data = await chrome.storage.sync.get(["blockedSites", "enabled"]);
    const blockedSites = data.blockedSites || [
      "youtube.com",
      "netflix.com",
      "tiktok.com",
      "instagram.com",
    ];
    const enabled = data.enabled !== false;

    console.log("Focus Cat: Enabled =", enabled);
    console.log("Focus Cat: Blocked sites =", blockedSites);

    if (!enabled) {
      console.log("Focus Cat: Extension disabled");
      return;
    }

    const currentURL = window.location.href;
    const currentHost = window.location.hostname;
    const isBlocked = blockedSites.some(
      (site) => currentURL.includes(site) || currentHost.includes(site)
    );

    console.log("Focus Cat: Current URL =", currentURL);
    console.log("Focus Cat: Current Host =", currentHost);
    console.log("Focus Cat: Is blocked =", isBlocked);

    if (isBlocked) {
      console.log("Focus Cat: Injecting overlay...");
      injectCatOverlay();
    } else {
      console.log("Focus Cat: Injecting desktop cat...");
      injectDesktopCat();
    }
  } catch (error) {
    console.error("Focus Cat: Error in main script:", error);
  }
})();

// Listen for messages from popup and background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Focus Cat: Message received:", message);

  if (message.action === "startTimer") {
    console.log("Focus Cat: Starting timer in content script");
    startFocusTimer();
    sendResponse({ success: true });
  } else if (message.action === "showCompletion") {
    console.log("Focus Cat: Showing completion overlay");
    showCompletionOverlay();
    sendResponse({ success: true });
  } else if (message.action === "showPraise") {
    console.log("Focus Cat: Showing praise message");
    showPraiseMessage();
    sendResponse({ success: true });
  }

  return true; // Keep message channel open for async response
});

function injectCatOverlay() {
  try {
    const existingOverlay = document.getElementById("focus-cat-overlay");
    if (existingOverlay) {
      existingOverlay.remove();
    }

    const overlay = document.createElement("div");
    overlay.id = "focus-cat-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0,0,0,0.9);
      z-index: 999999;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const catEmoji = document.createElement("div");
    catEmoji.innerHTML = "😾";
    catEmoji.style.cssText = `
      font-size: 120px;
      margin-bottom: 30px;
      animation: angry-bounce 1s ease-in-out infinite alternate;
    `;

    const msg = document.createElement("div");
    msg.innerHTML =
      "Meow! Time to get back to work!<br><small>Close this tab to focus</small>";
    msg.style.cssText = `
      color: white;
      font-size: 28px;
      font-weight: bold;
      text-align: center;
      line-height: 1.4;
    `;

    const style = document.createElement("style");
    style.textContent = `
      @keyframes angry-bounce {
        0% { transform: scale(1) rotate(-2deg); }
        100% { transform: scale(1.1) rotate(2deg); }
      }
    `;
    document.head.appendChild(style);

    overlay.appendChild(catEmoji);
    overlay.appendChild(msg);
    document.body.appendChild(overlay);

    console.log("Focus Cat: Overlay injected successfully");
  } catch (error) {
    console.error("Focus Cat: Error injecting overlay:", error);
  }
}

function injectDesktopCat() {
  try {
    if (document.getElementById("desktop-cat")) {
      console.log("Focus Cat: Desktop cat already exists");
      return;
    }

    const catContainer = document.createElement("div");
    catContainer.id = "desktop-cat";
    catContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 80px;
      height: 120px;
      z-index: 10000;
      cursor: pointer;
      user-select: none;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: transform 0.3s ease;
    `;

    const cat = document.createElement("div");
    cat.innerHTML = "🐱";
    cat.style.cssText = `
      font-size: 60px;
      width: 100%;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s ease;
      filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));
    `;

    const timerDisplay = document.createElement("div");
    timerDisplay.id = "focus-cat-timer";
    timerDisplay.style.cssText = `
      background: rgba(173, 216, 230, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 13px;
      color: #2c3e50;
      font-weight: bold;
      text-align: center;
      margin-top: 2px;
      min-height: 18px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(3px);
      transition: all 0.3s ease;
      min-width: 65px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const style = document.createElement("style");
    style.textContent = `
      @keyframes catFloat {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-8px); }
      }
      #desktop-cat {
        animation: catFloat 3s ease-in-out infinite;
      }
      #desktop-cat:hover {
        animation-play-state: paused;
        transform: scale(1.2);
      }
      #desktop-cat:hover #focus-cat-timer {
        background: rgba(173, 216, 230, 1);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
      #focus-cat-timer:empty {
        display: none !important;
        min-height: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
      }
    `;
    if (!document.querySelector("#focus-cat-styles")) {
      style.id = "focus-cat-styles";
      document.head.appendChild(style);
    }

    catContainer.appendChild(cat);
    catContainer.appendChild(timerDisplay);
    document.body.appendChild(catContainer);

    console.log("Focus Cat: Desktop cat injected successfully");

    // Cat interaction
    catContainer.addEventListener("click", () => {
      const expressions = ["🐱", "😸", "😺", "😻", "🙀", "😹"];
      const randomCat =
        expressions[Math.floor(Math.random() * expressions.length)];
      cat.innerHTML = randomCat;
      cat.style.transform = "scale(1.5) rotate(360deg)";

      setTimeout(() => {
        cat.style.transform = "scale(1) rotate(0deg)";
        setTimeout(() => {
          cat.innerHTML = "🐱";
        }, 1000);
      }, 600);

      showCatMessage();
    });

    startCatBehaviors(cat);

    // Start timer display updates
    updateTimerDisplay(timerDisplay);
    setInterval(() => updateTimerDisplay(timerDisplay), 1000);
  } catch (error) {
    console.error("Focus Cat: Error injecting desktop cat:", error);
  }
}

function startCatBehaviors(cat) {
  setInterval(() => {
    if (Math.random() < 0.3) {
      const expressions = ["😴", "😿", "😽", "😼"];
      const randomExp =
        expressions[Math.floor(Math.random() * expressions.length)];
      const originalCat = cat.innerHTML;

      cat.innerHTML = randomExp;
      setTimeout(() => {
        cat.innerHTML = originalCat;
      }, 1500);
    }
  }, 15000);
}

function showCatMessage() {
  try {
    const existing = document.getElementById("focus-cat-message");
    if (existing) existing.remove();

    const messages = [
      "Meow! 🐱",
      "Good job staying focused! 💪",
      "Keep it up! 🎯",
      "You're doing great! ⭐",
      "Stay productive! 🔥",
      "Purr purr! 😸",
    ];

    const message = document.createElement("div");
    message.id = "focus-cat-message";
    message.style.cssText = `
      position: fixed;
      bottom: 130px;
      right: 20px;
      background-color: rgba(0,0,0,0.8);
      color: white;
      padding: 10px 15px;
      border-radius: 20px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      z-index: 10001;
      opacity: 0;
      transition: opacity 0.3s ease;
      max-width: 200px;
      text-align: center;
    `;
    message.textContent = messages[Math.floor(Math.random() * messages.length)];

    document.body.appendChild(message);
    setTimeout(() => (message.style.opacity = "1"), 10);

    setTimeout(() => {
      message.style.opacity = "0";
      setTimeout(() => {
        if (message.parentNode) message.parentNode.removeChild(message);
      }, 300);
    }, 2500);
  } catch (error) {
    console.error("Focus Cat: Error showing message:", error);
  }
}

async function updateTimerDisplay(timerElement) {
  try {
    const data = await chrome.storage.sync.get(["focusEndTime"]);
    const endTime = data.focusEndTime;

    if (!endTime) {
      timerElement.textContent = "";
      return;
    }

    const remaining = endTime - Date.now();
    if (remaining <= 0) {
      timerElement.textContent = "🎉 Done!";
      // Clear after 3 seconds
      setTimeout(async () => {
        await chrome.storage.sync.remove(["focusEndTime", "lastPraiseTime"]);
        timerElement.textContent = "";
      }, 3000);
    } else {
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      timerElement.textContent = `⏱ ${String(mins).padStart(2, "0")}:${String(
        secs
      ).padStart(2, "0")}`;
    }
  } catch (error) {
    console.error("Focus Cat: Error updating timer display:", error);
  }
}

function startFocusTimer() {
  console.log("Focus Cat: Starting focus timer monitoring in content script");

  // This is mainly for visual updates - the main timer logic is in background.js
  const intervalId = setInterval(async () => {
    try {
      const data = await chrome.storage.sync.get(["focusEndTime"]);

      if (!data.focusEndTime) {
        console.log("Focus Cat: No active timer, stopping content monitoring");
        clearInterval(intervalId);
        return;
      }

      const remaining = data.focusEndTime - Date.now();

      // Just update display here, background handles notifications
      if (remaining <= 0) {
        clearInterval(intervalId);
      }
    } catch (error) {
      console.error("Focus Cat: Error in content timer monitoring:", error);
    }
  }, 5000);
}

function showPraiseMessage() {
  try {
    const existing = document.getElementById("focus-cat-praise");
    if (existing) existing.remove();

    const praise = document.createElement("div");
    praise.id = "focus-cat-praise";
    praise.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
      color: white;
      padding: 20px 30px;
      border-radius: 15px;
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      z-index: 999998;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      opacity: 0;
      transition: all 0.5s ease;
    `;
    praise.innerHTML = "🐾 Paw-some! You've stayed focused for 10+ minutes! 🐾";

    document.body.appendChild(praise);
    setTimeout(() => (praise.style.opacity = "1"), 10);

    setTimeout(() => {
      praise.style.opacity = "0";
      setTimeout(() => {
        if (praise.parentNode) praise.parentNode.removeChild(praise);
      }, 500);
    }, 4000);
  } catch (error) {
    console.error("Focus Cat: Error showing praise message:", error);
  }
}

function showCompletionOverlay() {
  try {
    const existing = document.getElementById("focus-cat-completion");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "focus-cat-completion";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(45deg, #667eea, #764ba2, #f093fb, #f5576c);
      background-size: 400% 400%;
      animation: celebration-gradient 3s ease infinite;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      opacity: 0;
      transition: opacity 0.5s ease;
    `;

    const catCelebration = document.createElement("div");
    catCelebration.innerHTML = "🎉😸🎉";
    catCelebration.style.cssText = `
      font-size: 100px;
      margin-bottom: 20px;
      animation: celebration-bounce 1s ease-in-out infinite;
    `;

    const congratsText = document.createElement("div");
    congratsText.innerHTML = "Meow~ Time's up!<br>You did it! 🎊";
    congratsText.style.cssText = `
      color: white;
      font-size: 32px;
      font-weight: bold;
      text-align: center;
      line-height: 1.4;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
      margin-bottom: 20px;
    `;

    const dismissBtn = document.createElement("button");
    dismissBtn.textContent = "Thanks, Focus Cat! 🐱";
    dismissBtn.style.cssText = `
      padding: 15px 30px;
      font-size: 16px;
      background: rgba(255,255,255,0.9);
      color: #333;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.3s ease;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    `;

    dismissBtn.addEventListener("click", () => {
      overlay.style.opacity = "0";
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 500);
    });

    dismissBtn.addEventListener("mouseenter", () => {
      dismissBtn.style.transform = "scale(1.1)";
      dismissBtn.style.background = "white";
    });

    dismissBtn.addEventListener("mouseleave", () => {
      dismissBtn.style.transform = "scale(1)";
      dismissBtn.style.background = "rgba(255,255,255,0.9)";
    });

    const style = document.createElement("style");
    style.textContent = `
      @keyframes celebration-gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes celebration-bounce {
        0%, 100% { transform: scale(1) rotate(-5deg); }
        50% { transform: scale(1.2) rotate(5deg); }
      }
    `;
    document.head.appendChild(style);

    overlay.appendChild(catCelebration);
    overlay.appendChild(congratsText);
    overlay.appendChild(dismissBtn);
    document.body.appendChild(overlay);

    setTimeout(() => (overlay.style.opacity = "1"), 10);

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.style.opacity = "0";
        setTimeout(() => {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 500);
      }
    }, 10000);

    console.log("Focus Cat: Completion overlay shown successfully");
  } catch (error) {
    console.error("Focus Cat: Error showing completion overlay:", error);
  }
}
