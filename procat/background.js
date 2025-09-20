console.log("Focus Cat: Background service worker loaded");

let timerMonitoringInterval = null;

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);

  if (message.action === "startTimer") {
    console.log("Background: Starting timer coordination");
    startTimerMonitoring();
    sendResponse({ success: true });
  }

  return true; // Keep the message channel open
});

function startTimerMonitoring() {
  // Clear any existing monitoring
  if (timerMonitoringInterval) {
    clearInterval(timerMonitoringInterval);
  }

  console.log("Background: Starting timer monitoring");

  timerMonitoringInterval = setInterval(async () => {
    try {
      const data = await chrome.storage.sync.get([
        "focusEndTime",
        "lastPraiseTime",
      ]);

      const { focusEndTime, lastPraiseTime = 0 } = data;

      if (!focusEndTime) {
        console.log("Background: No active timer, stopping monitoring");
        clearInterval(timerMonitoringInterval);
        timerMonitoringInterval = null;
        return;
      }

      const now = Date.now();
      const remaining = focusEndTime - now;

      console.log(
        "Background: Timer check - remaining:",
        Math.floor(remaining / 1000),
        "seconds"
      );

      // Check for 10-minute praise intervals
      if (now - lastPraiseTime >= 10 * 60 * 1000) {
        console.log("Background: 10 minutes passed, showing praise");
        await chrome.storage.sync.set({ lastPraiseTime: now });

        // Show browser notification
        try {
          await chrome.notifications.create({
            type: "basic",
            iconUrl: "cat.png",
            title: "Focus Cat says:",
            message: "Paw-some! You've stayed focused for 10 minutes! 🐾",
          });
        } catch (error) {
          console.log("Background: Notification error:", error);
        }

        // Show visual praise in all tabs
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            chrome.tabs
              .sendMessage(tab.id, {
                action: "showPraise",
              })
              .catch(() => {
                // Ignore errors for tabs that don't have the content script
              });
          });
        });
      }

      // Check if timer is complete
      if (remaining <= 0) {
        console.log("Background: Timer completed!");

        // Clean up storage
        await chrome.storage.sync.remove(["focusEndTime", "lastPraiseTime"]);

        // Show completion notification
        try {
          await chrome.notifications.create({
            type: "basic",
            iconUrl: "cat.png",
            title: "Focus Cat says:",
            message: "Meow~ Time's up! You did it! 🎉",
          });
        } catch (error) {
          console.log("Background: Notification error:", error);
        }

        // Show completion overlay in all tabs
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            chrome.tabs
              .sendMessage(tab.id, {
                action: "showCompletion",
              })
              .catch(() => {
                // Ignore errors for tabs that don't have the content script
              });
          });
        });

        // Stop monitoring
        clearInterval(timerMonitoringInterval);
        timerMonitoringInterval = null;
      }
    } catch (error) {
      console.error("Background: Error in timer monitoring:", error);
    }
  }, 30000); // Check every 30 seconds
}

// Handle extension startup - resume timer if one was active
chrome.runtime.onStartup.addListener(() => {
  console.log("Focus Cat: Extension startup");
  checkForActiveTimer();
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("Focus Cat: Extension installed/updated");
  checkForActiveTimer();
});

async function checkForActiveTimer() {
  try {
    const data = await chrome.storage.sync.get(["focusEndTime"]);
    if (data.focusEndTime && data.focusEndTime > Date.now()) {
      console.log(
        "Background: Found active timer on startup, resuming monitoring"
      );
      startTimerMonitoring();
    }
  } catch (error) {
    console.error("Background: Error checking for active timer:", error);
  }
}
