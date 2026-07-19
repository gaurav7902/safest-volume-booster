const DEFAULT_STATE = {
  enabled: true,
  boost: 100
};

const enabledInput = document.querySelector("#enabled");
const boostInput = document.querySelector("#boost");
const boostValue = document.querySelector("#boostValue");
const statusText = document.querySelector("#status");
const presetButtons = [...document.querySelectorAll("[data-boost]")];
const resetButton = document.querySelector("#reset");

let state = { ...DEFAULT_STATE };

init();

async function init() {
  try {
    const saved = await getStorage(DEFAULT_STATE);
    state = normalizeState(saved);
    render();
    await applyState();
  } catch (error) {
    statusText.textContent = getErrorMessage(error);
  }
}

enabledInput.addEventListener("change", () => {
  state.enabled = enabledInput.checked;
  runAction(saveAndApply);
});

boostInput.addEventListener("input", () => {
  state.boost = Number(boostInput.value);
  runAction(saveAndApply);
});

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.boost = Number(button.dataset.boost);
    state.enabled = true;
    runAction(saveAndApply);
  });
});

resetButton.addEventListener("click", () => {
  state = { ...DEFAULT_STATE };
  runAction(saveAndApply);
});

async function runAction(action) {
  try {
    await action();
  } catch (error) {
    statusText.textContent = getErrorMessage(error);
  }
}

async function saveAndApply() {
  state = normalizeState(state);
  await setStorage(state);
  render();
  await applyState();
}

function render() {
  enabledInput.checked = state.enabled;
  boostInput.value = state.boost;
  boostValue.value = `${state.enabled ? state.boost : 100}%`;

  const percentage = ((state.boost - 100) / 500) * 100;
  boostInput.style.setProperty('--fill', `${percentage}%`);

  statusText.textContent = state.enabled && state.boost > 100 ? "Ready to boost" : "Boost is off";

  presetButtons.forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.boost) === state.boost);
  });
}

async function applyState() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      statusText.textContent = "No active tab";
      return;
    }

    let response = await sendTabMessage(tab.id, state);

    if (!response?.ok) {
      await injectContentScript(tab.id);
      response = await sendTabMessage(tab.id, state);
    }

    statusText.textContent = response?.message || "Boosting this tab";
  } catch (error) {
    statusText.textContent = getErrorMessage(error);
  }
}

async function sendTabMessage(tabId, nextState) {
  return await chrome.tabs.sendMessage(
    tabId,
    {
      type: "VOLUME_BOOSTER_SET",
      state: nextState
    }
  );
}

async function injectContentScript(tabId) {
  if (chrome.scripting?.executeScript) {
    await chrome.scripting.executeScript({
      target: {
        tabId,
        allFrames: true
      },
      files: ["content.js"]
    });
    return;
  }

  throw new Error("Script injection is unavailable");
}

async function getStorage(defaults) {
  return await chrome.storage.sync.get(defaults);
}

async function setStorage(nextState) {
  await chrome.storage.sync.set(nextState);
}

function getErrorMessage(error) {
  const message = error?.message || String(error || "");

  if (message.includes("Receiving end does not exist")) {
    return "Refresh the tab, then try again";
  }

  if (message.includes("Cannot access contents")) {
    return "This page cannot be boosted";
  }

  if (message.includes("Missing host permission")) {
    return "Refresh the tab, then try again";
  }

  return message || "Could not apply boost";
}

function normalizeState(value) {
  return {
    enabled: Boolean(value.enabled),
    boost: clamp(Number(value.boost) || DEFAULT_STATE.boost, 100, 600)
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
