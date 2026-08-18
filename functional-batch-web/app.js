const videoLibrary = {
  "Shoulder Tap": { id: "LBp7ez0VzaI", start: 94, end: 100 },
  "Push-Up Position Jack": { id: "LBp7ez0VzaI", start: 102, end: 108 },
  "Push-Up Position Toe Touch": { id: "LBp7ez0VzaI", start: 115, end: 126 },
  "Shoulder Tap Jack": { id: "LBp7ez0VzaI", start: 130, end: 136 },
  "Squat and Press": { id: "LBp7ez0VzaI", start: 138, end: 150 },
  "Squat and Side Knee Tuck": { id: "LBp7ez0VzaI", start: 156, end: 165 },
  "Diamond Push-Up": { id: "LBp7ez0VzaI", start: 175, end: 184 },
  "Jack and Press": { id: "LBp7ez0VzaI", start: 189, end: 194 },
  "Side Knee Tuck": { id: "LBp7ez0VzaI", start: 197, end: 207 },
  "Mountain Climber": { id: "LBp7ez0VzaI", start: 214, end: 223 },
  "Plank with Side Leg Raises": { id: "LBp7ez0VzaI", start: 228, end: 236 },
  "DB Military Jog": { id: "LBp7ez0VzaI", start: 239, end: 248 },
  "Squat Jump": { id: "LBp7ez0VzaI", start: 254, end: 262 },
  "Burpees": { id: "LBp7ez0VzaI", start: 270, end: 279 },
  "Wall Sit": { id: "LBp7ez0VzaI", start: 291, end: 300 },
  "Half Crunches": { id: "LBp7ez0VzaI", start: 306, end: 314 },
  "Toe Touch": { id: "LBp7ez0VzaI", start: 318, end: 327 },
  "Heel Touch": { id: "LBp7ez0VzaI", start: 333, end: 339 },
  "Russian Twist": { id: "LBp7ez0VzaI", start: 345, end: 354 },
  "Kick Out": { id: "LBp7ez0VzaI", start: 362, end: 370 },
  "V-Up Hold": { id: "LBp7ez0VzaI", start: 377, end: 382 },
  "Leg Raises": { id: "LBp7ez0VzaI", start: 387, end: 395 },
  "Flutter Kicks": { id: "LBp7ez0VzaI", start: 401, end: 408 },
  "Scissors": { id: "LBp7ez0VzaI", start: 416, end: 423 },
  "Plank Hold": { id: "LBp7ez0VzaI", start: 426, end: 432 },
  "Side Plank": { id: "LBp7ez0VzaI", start: 437, end: 444 }
};

const CUSTOM_VARIATIONS_STORAGE_KEY = "functionalBatchCustomVariations";
const LOCAL_BATCHES_STORAGE_KEY = "functionalBatchLocalBatches";

const LOCAL_API_BASE_URL = "http://127.0.0.1:5000";
const isLocalFrontend =
  window.location.protocol === "file:" ||
  ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
const usesBrowserStorage =
  window.location.protocol === "file:" ||
  window.location.hostname.endsWith("github.io");

const API_BASE_URL = isLocalFrontend && window.location.port !== "5000"
  ? LOCAL_API_BASE_URL
  : "";

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function parseYouTubeVideoId(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return parsed.pathname.split("/").filter(Boolean)[0] || "";
    }

    if (host.endsWith("youtube.com")) {
      if (parsed.searchParams.get("v")) {
        return parsed.searchParams.get("v");
      }

      const parts = parsed.pathname.split("/").filter(Boolean);
      const videoPathKeys = new Set(["embed", "shorts", "live"]);
      if (videoPathKeys.has(parts[0]) && parts[1]) {
        return parts[1];
      }
    }
  } catch (_error) {
    return raw.length === 11 ? raw : "";
  }

  return "";
}

function readCustomVariations() {
  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOM_VARIATIONS_STORAGE_KEY) || "{}");
    return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  } catch (_error) {
    return {};
  }
}

function parseTimeInput(value) {
  const raw = String(value || "").trim();
  if (!raw) return NaN;

  if (raw.includes(":")) {
    const parts = raw.split(":").map(part => part.trim());
    if (parts.length !== 2) return NaN;

    const minutes = Number(parts[0]);
    const seconds = Number(parts[1]);
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || seconds < 0 || seconds >= 60) return NaN;
    return minutes * 60 + seconds;
  }

  const dotMinutesMatch = raw.match(/^(\d+)\.(\d{2})$/);
  if (dotMinutesMatch) {
    const minutes = Number(dotMinutesMatch[1]);
    const seconds = Number(dotMinutesMatch[2]);
    if (seconds >= 60) return NaN;
    return minutes * 60 + seconds;
  }

  return Number(raw);
}

function loadCustomVariations() {
  try {
    const saved = readCustomVariations();
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return;

    Object.entries(saved).forEach(([name, videoData]) => {
      if (!name || !videoData || typeof videoData !== "object") return;
      if (!videoData.id || !Number.isFinite(videoData.start) || !Number.isFinite(videoData.end)) return;
      videoLibrary[name] = {
        id: videoData.id,
        start: videoData.start,
        end: videoData.end
      };
    });
  } catch (error) {
    console.warn("Could not load custom variations:", error);
  }
}

function persistCustomVariation(name, videoData) {
  const saved = readCustomVariations();
  saved[name] = videoData;
  localStorage.setItem(CUSTOM_VARIATIONS_STORAGE_KEY, JSON.stringify(saved));
}

function removePersistedCustomVariation(name) {
  const saved = readCustomVariations();
  delete saved[name];
  localStorage.setItem(CUSTOM_VARIATIONS_STORAGE_KEY, JSON.stringify(saved));
}

function readLocalBatches() {
  try {
    const saved = JSON.parse(localStorage.getItem(LOCAL_BATCHES_STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch (_error) {
    return [];
  }
}

function writeLocalBatches(batches) {
  localStorage.setItem(LOCAL_BATCHES_STORAGE_KEY, JSON.stringify(batches));
}

function createLocalId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cloneBatchExercises(exercises) {
  return (Array.isArray(exercises) ? exercises : []).map(ex => ({ ...ex }));
}

function createLocalBatch({ name, musicKey, exercises }) {
  const now = new Date().toISOString();
  const batch = {
    _id: createLocalId(),
    name,
    musicKey: musicKey || "energetic",
    exercises: cloneBatchExercises(exercises),
    createdAt: now,
    updatedAt: now
  };
  const batches = [batch, ...readLocalBatches()];
  writeLocalBatches(batches);
  return batch;
}

function updateLocalBatch(id, { name, musicKey, exercises }) {
  const batches = readLocalBatches();
  const index = batches.findIndex(batch => batch._id === id);
  if (index === -1) {
    throw new Error("Batch not found");
  }

  batches[index] = {
    ...batches[index],
    name,
    musicKey: musicKey || "energetic",
    exercises: cloneBatchExercises(exercises),
    updatedAt: new Date().toISOString()
  };
  writeLocalBatches(batches);
  return batches[index];
}

function deleteLocalBatch(id) {
  const batches = readLocalBatches();
  const nextBatches = batches.filter(batch => batch._id !== id);
  if (nextBatches.length === batches.length) {
    throw new Error("Batch not found");
  }

  writeLocalBatches(nextBatches);
}

async function loadSeedBatches() {
  try {
    const response = await fetch("seed-batches.json", { cache: "no-store" });
    if (!response.ok) return [];

    const batches = await response.json();
    return Array.isArray(batches) ? batches : [];
  } catch (_error) {
    return [];
  }
}

async function readErrorMessage(response, fallbackMessage) {
  const text = await response.text();

  if (!text) {
    return `${fallbackMessage} (${response.status})`;
  }

  try {
    const data = JSON.parse(text);
    return data.message || `${fallbackMessage} (${response.status})`;
  } catch (_error) {
    return `${fallbackMessage} (${response.status})`;
  }
}

let currentBatch = [];
let savedBatches = [];
let editingIndex = null;

const backgroundMusicOptions = [
  { key: "energetic", label: "Energetic", src: "assets/gym-beat.mp3" },
  { key: "peaceful", label: "Peaceful", src: "assets/peaceful.mp3" },
  { key: "meditation", label: "Meditation", src: "assets/meditation.mp3" },
  { key: "yoga", label: "Yoga", src: "assets/yoga.mp3" },
  { key: "nature", label: "Nature / Ambient", src: "assets/nature.mp3" }
];

let currentBatchMusicKey = "energetic";

let player;
let loopInterval;

let restSeconds = 10; // default rest time (can customize later)
let restInterval = null;
  document.querySelector(".bottom-nav").classList.remove("hidden");

let repInterval = null;
let workoutActive = false;
let isPaused = false;

let activeBatch = null;
let activeBatchIndex = null;

let batchMode = "create"; // "create" | "edit"
let editingBatchId = null;
let editingBatchName = "";
let libraryReturnScreen = "homeScreen";

let currentExerciseIndex = 0;
let currentRep = 0;
let currentExercise = null;
let exerciseElapsedMs = 0;
let exerciseLastTickMs = null;
let exerciseCompleted = false;
let nextExerciseFlashShown = false;
let playerReady = false;
let loadedVideoId = null;

function hideNextExerciseFlash() {
  const el = document.getElementById("nextExerciseFlash");
  if (!el) return;
  el.style.display = "none";
  el.classList.remove("flash");
  el.textContent = "";
}

function showNextExerciseFlash(text) {
  const el = document.getElementById("nextExerciseFlash");
  if (!el) return;
  el.textContent = text;
  el.style.display = "block";
  el.classList.remove("flash");
  void el.offsetWidth; // restart animation
  el.classList.add("flash");
}

let bgMusic = document.getElementById("bgMusic");
let beatInterval = null;
let bgMusicLoadErrorShown = false;



function onYouTubeIframeAPIReady() {
  player = new YT.Player("youtubePlayer", {
    playerVars: {
      autoplay: 0,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      cc_load_policy: 0,
      iv_load_policy: 3,
      playsinline: 1,
      mute: 1
    },

    events: {
      onReady: function (event) {
        playerReady = true;
        event.target.mute();
        if (activeBatch && document.getElementById("playerScreen")?.classList.contains("active")) {
          loadExercise();
        }
      }
    }

  });
}


// -------- SCREEN SWITCH --------

function switchScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.body.classList.toggle("workout-mode", id === "playerScreen");
}

// -------- HOME --------

function goHome() {
  batchMode = "create";
  editingBatchId = null;
  editingBatchName = "";
  libraryReturnScreen = "homeScreen";
  switchScreen("homeScreen");
  document.querySelector(".bottom-nav").classList.remove("hidden");

  renderSavedBatches();
}

function startCreateBatch() {
  batchMode = "create";
  editingBatchId = null;
  editingBatchName = "";
  libraryReturnScreen = "homeScreen";
  activeBatch = null;
  activeBatchIndex = null;
  currentBatch = [];
  currentBatchMusicKey = "energetic";
  updateSelectedCount();
  openVideoLibrary();
}

function openAddVariationScreen() {
  renderDeleteVariationOptions();
  switchScreen("addVariationScreen");
  document.querySelector(".bottom-nav").classList.remove("hidden");
}

function clearAddVariationForm() {
  const fields = [
    "variationNameInput",
    "variationYoutubeInput",
    "variationStartInput",
    "variationDurationInput"
  ];

  fields.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = id === "variationStartInput" ? "0" : "";
  });
}

function saveCustomVariation() {
  const name = document.getElementById("variationNameInput").value.trim();
  const youtubeUrl = document.getElementById("variationYoutubeInput").value.trim();
  const start = parseTimeInput(document.getElementById("variationStartInput").value || "0");
  const duration = parseTimeInput(document.getElementById("variationDurationInput").value);
  const videoId = parseYouTubeVideoId(youtubeUrl);

  if (!name) {
    alert("Enter a variation name.");
    return;
  }

  if (!videoId) {
    alert("Enter a valid YouTube URL.");
    return;
  }

  if (!Number.isFinite(start) || start < 0) {
    alert("Start time must be 0 or more.");
    return;
  }

  if (!Number.isFinite(duration) || duration <= 0) {
    alert("Loop duration must be more than 0 seconds.");
    return;
  }

  if (videoLibrary[name] && !confirm(`Replace existing variation "${name}"?`)) {
    return;
  }

  const videoData = {
    id: videoId,
    start,
    end: start + duration
  };

  videoLibrary[name] = videoData;
  persistCustomVariation(name, videoData);
  renderDeleteVariationOptions();
  clearAddVariationForm();
  alert(`"${name}" added to Video Library.`);
  openVideoLibrary();
}

function renderDeleteVariationOptions() {
  const select = document.getElementById("deleteVariationSelect");
  if (!select) return;

  const saved = readCustomVariations();
  const names = Object.keys(saved).sort();
  select.innerHTML = "";

  if (names.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No saved variations";
    select.appendChild(option);
    select.disabled = true;
    return;
  }

  select.disabled = false;
  names.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

function deleteCustomVariation() {
  const select = document.getElementById("deleteVariationSelect");
  if (!select || !select.value) {
    alert("No saved variation selected.");
    return;
  }

  const name = select.value;
  if (!confirm(`Delete saved variation "${name}"?`)) {
    return;
  }

  removePersistedCustomVariation(name);
  delete videoLibrary[name];
  renderDeleteVariationOptions();
  alert(`"${name}" deleted from Video Library.`);
}

function renderSavedBatches() {
  const list = document.getElementById("batchList");
  list.innerHTML = "";

  if (savedBatches.length === 0) {
    list.innerHTML = `<p class="muted">No batches created yet</p>`;
    return;
  }

  savedBatches.forEach((batch, index) => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerText = batch.name;
    div.onclick = () => openExistingBatch(index);
    list.appendChild(div);
  });
}

// -------- VIDEO LIBRARY --------

function openVideoLibrary() {
  configureLibraryButtons();
  updateSelectedCount();
  switchScreen("libraryScreen");
  renderExercises();
}

function configureLibraryButtons() {
  const backBtn = document.getElementById("libraryBackBtn");
  const continueBtn = document.getElementById("libraryContinueBtn");
  if (!backBtn || !continueBtn) return;

  if (batchMode === "edit") {
    backBtn.textContent = "Back to Batch";
    continueBtn.textContent = "Done";
  } else {
    backBtn.textContent = "Cancel / Back";
    continueBtn.textContent = "View Batch / Continue";
  }
}

function cancelLibrary() {
  if (batchMode === "edit") {
    renderExistingBatch();
    switchScreen("existingBatchScreen");
    return;
  }
  currentBatch = [];
  updateSelectedCount();
  goHome();
}

function continueFromLibrary() {
  if (batchMode === "edit") {
    renderExistingBatch();
    switchScreen("existingBatchScreen");
    return;
  }
  viewBatch();
}

function openVideoLibraryFromExisting() {
  if (!editingBatchId) {
    alert("Open a batch first.");
    return;
  }
  libraryReturnScreen = "existingBatchScreen";
  openVideoLibrary();
}

function renderExercises() {
  const list = document.getElementById("exerciseList");
  list.innerHTML = "";

  const exercises = Object.keys(videoLibrary).sort();
  exercises.forEach(name => {
    const div = document.createElement("div");
    div.className = "exercise-item";

    const label = document.createElement("span");
    label.textContent = name;

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "+ Add";
    button.onclick = () => openPopup(name);

    div.appendChild(label);
    div.appendChild(button);
    list.appendChild(div);
  });
}

// -------- POPUP --------

function openPopup(name, index = null) {
  editingIndex = index;
  document.getElementById("popupName").value = name;
  clearPopupPreview();

  if (index !== null) {
    document.getElementById("popupReps").value = currentBatch[index].reps;
    document.getElementById("popupRepTime").value = currentBatch[index].repTime;
  } else {
    document.getElementById("popupReps").value = 10;
    document.getElementById("popupRepTime").value = 2;
  }

  document.getElementById("popup").classList.remove("hidden");
}

function closePopup() {
  clearPopupPreview();
  document.getElementById("popup").classList.add("hidden");
}

function clearPopupPreview() {
  const preview = document.getElementById("popupPreview");
  const frame = document.getElementById("popupPreviewFrame");
  if (frame) frame.src = "";
  if (preview) preview.classList.add("hidden");
}

function previewPopupVariation() {
  const exerciseName = document.getElementById("popupName").value;
  const videoData = videoLibrary[exerciseName];
  if (!videoData) {
    alert(`No video configured for "${exerciseName}".`);
    return;
  }

  const preview = document.getElementById("popupPreview");
  const frame = document.getElementById("popupPreviewFrame");
  if (!preview || !frame) return;

  const params = new URLSearchParams({
    autoplay: "1",
    controls: "1",
    modestbranding: "1",
    rel: "0",
    start: Math.floor(videoData.start).toString(),
    end: Math.ceil(videoData.end).toString()
  });

  frame.src = `https://www.youtube.com/embed/${videoData.id}?${params.toString()}`;
  preview.classList.remove("hidden");
}

function addToBatch() {
  const exerciseName = document.getElementById("popupName").value;
const videoData = videoLibrary[exerciseName];
  if (!videoData) {
    alert(`No video configured for "${exerciseName}".`);
    return;
  }

const item = {
  name: exerciseName,
  videoId: videoData.id,
  start: videoData.start,
  end: videoData.end,
  reps: Number(document.getElementById("popupReps").value),
  repTime: Number(document.getElementById("popupRepTime").value)
};



  if (editingIndex !== null) {
    currentBatch[editingIndex] = item;
  } else {
    currentBatch.push(item);
  }

  updateSelectedCount();

  if (batchMode === "edit") {
    const existingScreen = document.getElementById("existingBatchScreen");
    if (existingScreen && existingScreen.classList.contains("active")) {
      renderExistingBatch();
    }
  }

  const reviewScreen = document.getElementById("reviewScreen");
  if (reviewScreen && reviewScreen.classList.contains("active")) {
    renderReview();
  }

  closePopup();
  editingIndex = null;
}

function updateSelectedCount() {
  document.getElementById("selectedCount").innerText = currentBatch.length;
}

// -------- REVIEW SCREEN --------

function viewBatch() {
  renderReview();
  switchScreen("reviewScreen");
}

function renderReview() {
  const list = document.getElementById("reviewList");
  list.innerHTML = "";

  syncBatchMusicUI();

  currentBatch.forEach((ex, index) => {
    const div = document.createElement("div");
    div.className = "exercise-item";
    div.innerHTML = `
      <span>
        ${ex.name} | Reps: ${ex.reps} | Sec/Rep: ${ex.repTime}
      </span>
      <button onclick="openPopup('${ex.name}', ${index})">Edit</button>
    `;
    list.appendChild(div);
  });
}

// -------- SAVE BATCH --------

async function saveBatch() {
  if (currentBatch.length === 0) {
    alert("Add at least one exercise before saving.");
    return;
  }

  const batchName = prompt("Enter Batch Name:");
  if (!batchName || !batchName.trim()) {
    return;
  }

  if (usesBrowserStorage) {
    createLocalBatch({
      name: batchName.trim(),
      musicKey: currentBatchMusicKey,
      exercises: currentBatch
    });

    currentBatch = [];
    updateSelectedCount();
    await loadSavedBatches();
    goHome();
    return;
  }

  try {
    const response = await fetch(apiUrl("/api/batches"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: batchName.trim(),
        musicKey: currentBatchMusicKey,
        exercises: currentBatch
      })
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to save batch"));
    }

    await response.json();

    currentBatch = [];
    updateSelectedCount();
    await loadSavedBatches();
    goHome();
  } catch (error) {
    console.error("Fetch error:", error);
    alert(`Could not save batch. ${error.message}`);
  }
}

async function loadSavedBatches() {
  if (usesBrowserStorage) {
    savedBatches = readLocalBatches();
    if (savedBatches.length === 0) {
      const seedBatches = await loadSeedBatches();
      if (seedBatches.length > 0) {
        writeLocalBatches(seedBatches);
        savedBatches = seedBatches;
      }
    }

    renderSavedBatches();
    return;
  }

  try {
    const res = await fetch(apiUrl("/api/batches"));
    if (!res.ok) {
      throw new Error("Failed to fetch batches");
    }

    const data = await res.json();
    savedBatches = data;
    renderSavedBatches();
  } catch (err) {
    console.error("Error loading batches:", err);
  }
}

// -------- EXISTING BATCH SCREEN --------

function openExistingBatch(index) {
  const selected = savedBatches[index];
  if (!selected) return;

  batchMode = "edit";
  activeBatchIndex = index;
  editingBatchId = selected._id || null;
  editingBatchName = selected.name || "";
  currentBatchMusicKey = selected.musicKey || "energetic";

  currentBatch = (selected.exercises || []).map(ex => ({ ...ex }));
  updateSelectedCount();

  activeBatch = {
    ...selected,
    name: editingBatchName,
    musicKey: currentBatchMusicKey,
    exercises: currentBatch
  };

  renderExistingBatch();
  switchScreen("existingBatchScreen");
}

function renderExistingBatch() {
  const title = document.getElementById("existingBatchTitle");
  if (title) title.innerText = editingBatchName || (activeBatch ? activeBatch.name : "");

  syncBatchMusicUI();

  const list = document.getElementById("existingBatchList");
  if (!list) return;
  list.innerHTML = "";

  if (!currentBatch || currentBatch.length === 0) {
    list.innerHTML = `<p class="muted">No variations in this batch</p>`;
    return;
  }

  currentBatch.forEach((ex, index) => {
    const escapedName = String(ex.name || "").replace(/'/g, "\\'");
    const div = document.createElement("div");
    div.className = "exercise-item";
    div.innerHTML = `
      <span>
        ${ex.name} | Reps: ${ex.reps} | Sec/Rep: ${ex.repTime}
      </span>
      <div class="row-actions">
        <button onclick="moveVariation(${index}, -1)" ${index === 0 ? "disabled" : ""}>Up</button>
        <button onclick="moveVariation(${index}, 1)" ${index === currentBatch.length - 1 ? "disabled" : ""}>Down</button>
        <button onclick="openPopup('${escapedName}', ${index})">Edit</button>
        <button onclick="removeVariation(${index})">Remove</button>
      </div>
    `;
    list.appendChild(div);
  });
}

function moveVariation(index, direction) {
  if (!Array.isArray(currentBatch)) return;

  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= currentBatch.length) return;

  [currentBatch[index], currentBatch[nextIndex]] = [currentBatch[nextIndex], currentBatch[index]];

  if (activeBatch) activeBatch.exercises = currentBatch;
  renderExistingBatch();
}

function removeVariation(index) {
  if (!Array.isArray(currentBatch)) return;
  currentBatch.splice(index, 1);
  updateSelectedCount();
  if (batchMode === "edit") {
    renderExistingBatch();
  } else {
    renderReview();
  }
}

async function saveExistingBatch() {
  if (!editingBatchId) {
    alert("No batch selected.");
    return;
  }

  if (!Array.isArray(currentBatch) || currentBatch.length === 0) {
    alert("Add at least one variation before saving changes.");
    return;
  }

  if (usesBrowserStorage) {
    try {
      updateLocalBatch(editingBatchId, {
        name: editingBatchName,
        musicKey: currentBatchMusicKey,
        exercises: currentBatch
      });

      await loadSavedBatches();
      goHome();
    } catch (error) {
      alert(`Could not update batch. ${error.message}`);
    }
    return;
  }

  try {
    const response = await fetch(apiUrl(`/api/batches/${editingBatchId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editingBatchName,
        musicKey: currentBatchMusicKey,
        exercises: currentBatch
      })
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to update batch"));
    }

    await response.json();
    await loadSavedBatches();
    goHome();
  } catch (error) {
    console.error("Update error:", error);
    alert(`Could not update batch. ${error.message}`);
  }
}

async function deleteExistingBatch() {
  if (!editingBatchId) {
    alert("No batch selected.");
    return;
  }

  const ok = confirm(`Delete batch "${editingBatchName}"? This cannot be undone.`);
  if (!ok) return;

  if (usesBrowserStorage) {
    try {
      deleteLocalBatch(editingBatchId);

      activeBatch = null;
      activeBatchIndex = null;
      batchMode = "create";
      editingBatchId = null;
      editingBatchName = "";
      currentBatch = [];
      updateSelectedCount();

      await loadSavedBatches();
      goHome();
    } catch (error) {
      alert(`Could not delete batch. ${error.message}`);
    }
    return;
  }

  try {
    const response = await fetch(apiUrl(`/api/batches/${editingBatchId}`), {
      method: "DELETE"
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to delete batch"));
    }

    activeBatch = null;
    activeBatchIndex = null;
    batchMode = "create";
    editingBatchId = null;
    editingBatchName = "";
    currentBatch = [];
    updateSelectedCount();

    await loadSavedBatches();
    goHome();
  } catch (error) {
    console.error("Delete error:", error);
    alert(`Could not delete batch. ${error.message}`);
  }
}


// -------- DUPLICATE BATCH --------

async function duplicateBatch() {
  if (!Array.isArray(currentBatch) || currentBatch.length === 0) {
    alert("Nothing to duplicate.");
    return;
  }

  const baseName = editingBatchName || (activeBatch ? activeBatch.name : "Batch");
  const newName = prompt("Enter new batch name:", `${baseName} Copy`);
  if (!newName || !newName.trim()) return;

  if (usesBrowserStorage) {
    createLocalBatch({
      name: newName.trim(),
      musicKey: currentBatchMusicKey,
      exercises: currentBatch
    });

    await loadSavedBatches();
    goHome();
    return;
  }

  try {
    const response = await fetch(apiUrl("/api/batches"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        musicKey: currentBatchMusicKey,
        exercises: currentBatch
      })
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to save batch"));
    }

    await response.json();
    await loadSavedBatches();
    goHome();
  } catch (error) {
    console.error("Duplicate error:", error);
    alert(`Could not duplicate batch. ${error.message}`);
  }
}

// -------- SEARCH --------

function filterExercises() {
  const q = document.getElementById("searchInput").value.toLowerCase();
  document.querySelectorAll(".exercise-item").forEach(item => {
    item.style.display = item.innerText.toLowerCase().includes(q)
      ? "flex"
      : "none";
  });
}



function startWorkout() {

  if (!activeBatch) {
    alert("No active batch found");
    return;
  }

  currentExerciseIndex = 0;
  switchScreen("playerScreen");
  document.querySelector(".bottom-nav").classList.add("hidden");

  bgMusic.volume = 0.6;
  applyBatchMusic(activeBatch.musicKey);
  bgMusic.play();

  loadExercise();
}

function applyBatchMusic(musicKey) {
  if (!bgMusic) return;
  const selected = backgroundMusicOptions.find(o => o.key === musicKey) || backgroundMusicOptions[0];
  const nextSrc = selected ? selected.src : "assets/gym-beat.mp3";
  const desiredUrl = nextSrc ? new URL(nextSrc, window.location.href).href : "";
  if (nextSrc && bgMusic.currentSrc !== desiredUrl) {
    bgMusic.src = nextSrc;
    bgMusic.load();
  }
}

function syncBatchMusicUI() {
  const applyToSelect = (id) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.innerHTML = "";
    backgroundMusicOptions.forEach(opt => {
      const option = document.createElement("option");
      option.value = opt.key;
      option.textContent = opt.label;
      el.appendChild(option);
    });

    el.value = currentBatchMusicKey || "energetic";
    el.onchange = () => {
      currentBatchMusicKey = el.value;
      if (activeBatch) activeBatch.musicKey = currentBatchMusicKey;
    };
  };

  applyToSelect("batchMusicSelect");
  applyToSelect("existingBatchMusicSelect");
}

function setupBgMusicFallback() {
  if (!bgMusic) return;
  bgMusic.addEventListener("error", () => {
    if (bgMusicLoadErrorShown) return;
    bgMusicLoadErrorShown = true;

    const fallback = "assets/gym-beat.mp3";
    console.warn("Background music failed to load. Falling back:", bgMusic.currentSrc);
    bgMusic.src = fallback;
    bgMusic.load();

    if (!isPaused) {
      const p = bgMusic.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }

    alert("Background music file not found. Falling back to Energetic track.");
  });
}


function loadExercise() {
  if (!player || !playerReady) return;

  clearInterval(repInterval);
  clearInterval(loopInterval);
  clearInterval(restInterval);
  repInterval = null;
  loopInterval = null;
  restInterval = null;

  const exercise = activeBatch.exercises[currentExerciseIndex];

  isPaused = false;
document.getElementById("pauseBtn").textContent = "Pause";


  document.getElementById("playerExerciseName").innerText = exercise.name;
  document.getElementById("variationIndex").innerText =
    (currentExerciseIndex + 1) + "/" + activeBatch.exercises.length;
  hideNextExerciseFlash();

  if (loadedVideoId === exercise.videoId) {
    player.seekTo(exercise.start, true);
    player.playVideo();
  } else {
    player.loadVideoById({
      videoId: exercise.videoId,
      startSeconds: exercise.start
    });
    loadedVideoId = exercise.videoId;
  }

  const progressPercent =
  ((currentExerciseIndex) / activeBatch.exercises.length) * 100;

document.getElementById("batchProgressFill").style.width =
  progressPercent + "%";

  document.getElementById("repCounter").innerText = "0";
  document.getElementById("repTarget").innerText = exercise.reps;
  document.getElementById("exerciseProgressFill").style.width = "0%";


  player.mute();

  loopInterval = setInterval(() => {
    const currentTime = player.getCurrentTime();
    if (currentTime >= exercise.end - 0.08) {
      player.seekTo(exercise.start, true);
      player.playVideo();
    }
  }, 100);

  currentRep = 0;
  exerciseElapsedMs = 0;
  exerciseLastTickMs = null;
  exerciseCompleted = false;
  nextExerciseFlashShown = false;
  announceExercise(exercise);
}



function startRepCounter(exercise) {
  isPaused = false;
  currentRep = 0;

  announceExercise(exercise);
}

function announceExercise(exercise) {

  const intro = `${exercise.name}. ${exercise.reps} reps.`;

  // Reset any queued speech so exercise transitions (Next/Prev) don't overlap.
  speechSynthesis.cancel();

  const shouldDuckMusic = !!(bgMusic && !bgMusic.paused);
  const previousMusicVolume = bgMusic ? bgMusic.volume : null;
  if (shouldDuckMusic) bgMusic.volume = Math.min(previousMusicVolume, 0.25);

  const queue = (text, pitch = 1, rate = 1.3, options = {}) =>
    speak(text, pitch, rate, { duck: false, restoreOnEnd: false, ...options });

  // Announce + countdown, then start rep counting after "Go".
  queue(intro, 1.05, 1.8);
  queue("Get ready", 1.05, 1.8);
  queue("3", 1.05, 2.35);
  queue("2", 1.05, 2.35);
  queue("1", 1.05, 2.35);
  queue("Go", 1.05, 1.8, {
    restoreOnEnd: false,
    onend: () => {
      if (bgMusic && shouldDuckMusic && previousMusicVolume != null && !isPaused) {
        bgMusic.volume = previousMusicVolume;
      }
      if (isPaused) {
        return;
      }
      startCounting(exercise);
    }
  });
}

function duckMusic() {
  bgMusic.volume = 0.25;
}

function restoreMusic() {
  bgMusic.volume = 0.6;
}

function moveToNextExerciseAfterVoice() {
  const waitForVoice = () => {
    if (speechSynthesis.speaking || speechSynthesis.pending) {
      setTimeout(waitForVoice, 80);
      return;
    }
    setTimeout(() => {
      nextExercise();
    }, 120);
  };

  waitForVoice();
}


function startCounting(exercise, isResume = false) {
  if (isPaused) return;

  const repDisplay = document.getElementById("repCounter");
  const targetDisplay = document.getElementById("repTarget");
  const exerciseProgressFill = document.getElementById("exerciseProgressFill");

  if (!isResume) {
    currentExercise = exercise;
    currentRep = 0;
    exerciseElapsedMs = 0;
    exerciseLastTickMs = null;
    exerciseCompleted = false;
    nextExerciseFlashShown = false;
    hideNextExerciseFlash();
    repDisplay.innerText = currentRep;
    targetDisplay.innerText = currentExercise.reps;
    exerciseProgressFill.style.width = "0%";
  }

  const beatDuration = Math.max(0.1, Number(currentExercise.repTime || 1)) * 1000;
  const totalDuration = beatDuration * Math.max(1, Number(currentExercise.reps || 1));

  if (repInterval) return;

  repInterval = setInterval(() => {
    if (isPaused) {
      clearInterval(repInterval);
      repInterval = null;
      exerciseLastTickMs = null;
      return;
    }

    const nowMs = performance.now();
    if (exerciseLastTickMs === null) {
      exerciseLastTickMs = nowMs;
      return;
    }

    const deltaMs = nowMs - exerciseLastTickMs;
    exerciseLastTickMs = nowMs;
    exerciseElapsedMs += deltaMs;

    const clampedElapsedMs = Math.min(exerciseElapsedMs, totalDuration);
    const percent = clampedElapsedMs / totalDuration;
    exerciseProgressFill.style.width = (percent * 100).toFixed(2) + "%";

    if (!nextExerciseFlashShown && activeBatch && activeBatch.exercises) {
      const nextExercise = activeBatch.exercises[currentExerciseIndex + 1];
      if (nextExercise) {
        const remainingMs = totalDuration - clampedElapsedMs;
        if (remainingMs <= 2500) {
          showNextExerciseFlash(`Next: ${nextExercise.name}`);
          nextExerciseFlashShown = true;
        }
      }
    }

    const targetRep = Math.min(
      Math.floor(clampedElapsedMs / beatDuration),
      currentExercise.reps
    );

    while (currentRep < targetRep) {
      currentRep++;
      repDisplay.innerText = currentRep;
      speak(currentRep.toString(), 1.08, 1.2);
    }

    if (!exerciseCompleted && currentRep >= currentExercise.reps) {
      exerciseCompleted = true;
      clearInterval(repInterval);
      repInterval = null;
      hideNextExerciseFlash();
      moveToNextExerciseAfterVoice();
    }

  }, 50);
}




function speak(text, pitch = 1, rate = 1.3, options = {}) {
  const duck = options.duck !== false;
  const restoreOnEnd = options.restoreOnEnd !== false;
  const onend = typeof options.onend === "function" ? options.onend : null;

  if (duck) duckMusic();

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = 1;

  const voices = speechSynthesis.getVoices();

  const femaleVoice = voices.find(v =>
    v.name.toLowerCase().includes("female") ||
    v.name.toLowerCase().includes("zira") ||
    v.name.toLowerCase().includes("google uk english female")
  );

  utterance.voice = femaleVoice || voices[0];

  utterance.onend = () => {
    try {
      if (onend) onend();
    } finally {
      if (restoreOnEnd) restoreMusic();
    }
  };

  speechSynthesis.speak(utterance);
}


function togglePause() {
  const btn = document.getElementById("pauseBtn");

  if (!isPaused) {
    isPaused = true;
    btn.textContent = "Play";
    clearInterval(repInterval);
    repInterval = null;
    exerciseLastTickMs = null;
    speechSynthesis.cancel();

    if (bgMusic) bgMusic.pause();
    if (player && typeof player.pauseVideo === "function") player.pauseVideo();
  } else {
    isPaused = false;
    btn.textContent = "Pause";

    if (bgMusic) {
      const p = bgMusic.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }

    if (player && typeof player.playVideo === "function") player.playVideo();
    startCounting(currentExercise, true);
  }
}

function nextExercise() {
  if (currentExerciseIndex < activeBatch.exercises.length - 1) {
    currentExerciseIndex++;
    loadExercise();
  } else {
    alert("Workout Completed");
    quitWorkout();
  }
}

function prevExercise() {
  if (currentExerciseIndex > 0) {
    currentExerciseIndex--;
    loadExercise();
  }
}

function quitWorkout() {
  clearInterval(repInterval);
  clearInterval(loopInterval);
  clearInterval(restInterval);
  repInterval = null;
  loopInterval = null;
  restInterval = null;
  loadedVideoId = null;
  speechSynthesis.cancel();
  hideNextExerciseFlash();

  bgMusic.pause();
  bgMusic.currentTime = 0;

  document.querySelector(".bottom-nav").classList.remove("hidden");
  switchScreen("existingBatchScreen");
}

window.onload = () => {
  loadCustomVariations();
  setupBgMusicFallback();
  loadSavedBatches();
};
