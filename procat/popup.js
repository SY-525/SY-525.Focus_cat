document.addEventListener("DOMContentLoaded", async () => {
  const toggleBtn = document.getElementById("toggle");
  const statusDiv = document.getElementById("status");
  const startTimerBtn = document.getElementById("startTimer");
  const stopTimerBtn = document.getElementById("stopTimer");
  const resumeTimerBtn = document.getElementById("resumeTimer");
  const clearTimerBtn = document.getElementById("clearTimer");
  const focusMinutesInput = document.getElementById("focusMinutes");

  // Load current status
  const data = await chrome.storage.sync.get([
    "enabled",
    "focusEndTime",
    "pausedTime",
    "timerPaused",
  ]);
  const enabled = data.enabled !== false; // default true

  updateUI(enabled);
  updateTimerStatus(data.focusEndTime, data.pausedTime, data.timerPaused);
  updateButtonStates(data.focusEndTime, data.timerPaused);

  // Toggle extension on/off
  toggleBtn.addEventListener("click", async () => {
    const currentData = await chrome.storage.sync.get(["enabled"]);
    const currentEnabled = currentData.enabled !== false;
    await chrome.storage.sync.set({ enabled: !currentEnabled });
    updateUI(!currentEnabled);
  });

  // Start focus timer
  startTimerBtn.addEventListener("click", async () => {
    const minutes = parseInt(focusMinutesInput.value) || 25; // Default to 25 if empty

    if (minutes <= 0) {
      alert("Please enter a valid number of minutes.");
      return;
    }

    const endTime = Date.now() + minutes * 60 * 1000;

    try {
      // Store timer data
      await chrome.storage.sync.set({
        focusEndTime: endTime,
        lastPraiseTime: Date.now(),
        timerPaused: false,
        pausedTime: null,
      });

      console.log("Popup: Timer data stored, notifying background script");

      // Notify scripts
      notifyScripts("startTimer");

      alert(
        `Focus timer set for ${minutes} minutes! \u{1F431}\n\nYour desktop cat will show the countdown timer.`
      );
      updateTimerStatus(endTime, null, false);
      updateButtonStates(endTime, false);

      // Close popup after successful setup
      window.close();
    } catch (error) {
      console.error("Popup: Error starting timer:", error);
      alert("Error starting timer. Please try again.");
    }
  });

  // Stop focus timer (pause it)
  stopTimerBtn.addEventListener("click", async () => {
    try {
      const data = await chrome.storage.sync.get(["focusEndTime"]);

      if (!data.focusEndTime || data.focusEndTime <= Date.now()) {
        alert("No active timer to stop!");
        return;
      }

      // Calculate remaining time and store it
      const remainingTime = data.focusEndTime - Date.now();

      await chrome.storage.sync.set({
        pausedTime: remainingTime,
        timerPaused: true,
        focusEndTime: null, // Remove the end time to stop the timer
      });

      console.log("Popup: Timer paused, notifying scripts");

      // Notify background script and content scripts
      notifyScripts("pauseTimer");

      alert("Timer paused! \u{1F63F}");
      updateTimerStatus(null, remainingTime, true);
      updateButtonStates(null, true);
    } catch (error) {
      console.error("Popup: Error stopping timer:", error);
      alert("Error stopping timer. Please try again.");
    }
  });

  // Resume focus timer
  resumeTimerBtn.addEventListener("click", async () => {
    try {
      const data = await chrome.storage.sync.get(["pausedTime", "timerPaused"]);

      if (!data.timerPaused || !data.pausedTime) {
        alert("No paused timer to resume!");
        return;
      }

      // Calculate new end time based on remaining time
      const newEndTime = Date.now() + data.pausedTime;

      await chrome.storage.sync.set({
        focusEndTime: newEndTime,
        timerPaused: false,
        pausedTime: null,
      });

      console.log("Popup: Timer resumed, notifying scripts");

      // Notify background script and content scripts
      notifyScripts("startTimer");

      const minutes = Math.ceil(data.pausedTime / 60000);
      alert(`Timer resumed! ${minutes} minutes remaining \u{1F63B}`);
      updateTimerStatus(newEndTime, null, false);
      updateButtonStates(newEndTime, false);
    } catch (error) {
      console.error("Popup: Error resuming timer:", error);
      alert("Error resuming timer. Please try again.");
    }
  });

  // Clear timer (completely remove)
  clearTimerBtn.addEventListener("click", async () => {
    try {
      // Remove all timer data from storage
      await chrome.storage.sync.remove([
        "focusEndTime",
        "lastPraiseTime",
        "pausedTime",
        "timerPaused",
      ]);

      console.log("Popup: Timer cleared, notifying scripts");

      // Notify background script and content scripts
      notifyScripts("stopTimer");

      // Clear the input field
      focusMinutesInput.value = "";

      alert("Timer cleared! \u{1F63C}");
      updateTimerStatus(null, null, false);
      updateButtonStates(null, false);
    } catch (error) {
      console.error("Popup: Error clearing timer:", error);
      alert("Error clearing timer. Please try again.");
    }
  });

  // Allow Enter key to start timer
  focusMinutesInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      startTimerBtn.click();
    }
  });

  // Helper function to notify all scripts
  function notifyScripts(action) {
    // Notify background script
    chrome.runtime.sendMessage({ action }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Popup: Error sending message to background:",
          chrome.runtime.lastError
        );
      } else {
        console.log("Popup: Background script responded:", response);
      }
    });

    // Notify all content scripts
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, { action }, (response) => {
          if (chrome.runtime.lastError) {
            console.log(
              `Popup: Could not message tab ${tab.id}: ${chrome.runtime.lastError.message}`
            );
          } else {
            console.log(`Popup: Successfully messaged tab ${tab.id}`);
          }
        });
      });
    });
  }

  function updateButtonStates(focusEndTime, timerPaused) {
    const hasActiveTimer = focusEndTime && focusEndTime > Date.now();
    const hasPausedTimer = timerPaused;

    // Enable/disable buttons based on timer state
    startTimerBtn.disabled = hasActiveTimer;
    stopTimerBtn.disabled = !hasActiveTimer;
    resumeTimerBtn.disabled = !hasPausedTimer;
    clearTimerBtn.disabled = !hasActiveTimer && !hasPausedTimer;

    // Update button text based on state
    if (hasActiveTimer) {
      startTimerBtn.textContent = "Timer Running";
    } else {
      startTimerBtn.textContent = "Start Focus Timer";
    }
  }

  function updateUI(enabled) {
    if (enabled) {
      toggleBtn.textContent = "Disable Focus Cat";
      toggleBtn.style.background = "#f44336";
      statusDiv.textContent = "\u{1F408} Active - Desktop cat is watching!";
    } else {
      toggleBtn.textContent = "Enable Focus Cat";
      toggleBtn.style.background = "#4CAF50";
      statusDiv.textContent =
        "\u{1F408}\u{200D}\u{2B1B} Disabled - No protection active";
    }
  }

  function updateTimerStatus(focusEndTime, pausedTime, timerPaused) {
    const timerStatusDiv =
      document.getElementById("timerStatus") || createTimerStatusDiv();

    if (timerPaused && pausedTime) {
      // Show paused timer
      const mins = Math.floor(pausedTime / 60000);
      const secs = Math.floor((pausedTime % 60000) / 1000);
      timerStatusDiv.textContent = `Timer Paused: ${mins}:${String(
        secs
      ).padStart(2, "0")} remaining`;
      timerStatusDiv.style.color = "#ff9800";
    } else if (!focusEndTime || focusEndTime <= Date.now()) {
      // No active timer
      timerStatusDiv.textContent = "No active timer";
      timerStatusDiv.style.color = "#ccc";
    } else {
      // Active timer
      const remaining = focusEndTime - Date.now();
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      timerStatusDiv.textContent = `Timer: ${mins}:${String(secs).padStart(
        2,
        "0"
      )} remaining`;
      timerStatusDiv.style.color = "#4CAF50";

      // Update every second
      setTimeout(() => {
        chrome.storage.sync.get(
          ["focusEndTime", "pausedTime", "timerPaused"],
          (data) => {
            updateTimerStatus(
              data.focusEndTime,
              data.pausedTime,
              data.timerPaused
            );
            updateButtonStates(data.focusEndTime, data.timerPaused);
          }
        );
      }, 1000);
    }
  }

  function createTimerStatusDiv() {
    const timerStatusDiv = document.createElement("div");
    timerStatusDiv.id = "timerStatus";
    timerStatusDiv.style.cssText = `
      text-align: center;
      font-size: 11px;
      margin-top: 5px;
      opacity: 0.8;
      font-weight: bold;
    `;
    statusDiv.parentNode.appendChild(timerStatusDiv);
    return timerStatusDiv;
  }
});
