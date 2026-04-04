const videoLibrary = {
  "Alt Toe Touch Jack": { id: "CmyKz49OJ_k", start: 81, end: 84},
  "Dumbbell In-Out": { id: "CmyKz49OJ_k", start: 48, end: 50 },
  "Dumbbell Rotation": { id: "CmyKz49OJ_k", start: 67, end: 73 },
  "Floor Touch Jack": { id: "CmyKz49OJ_k", start: 3, end: 7 },
  "Half Burpees": { id: "CmyKz49OJ_k", start: 20, end: 25 },
  "High Knees": { id: "CmyKz49OJ_k", start: 3, end: 7 },
  "Jumping Jacks": { id: "CmyKz49OJ_k", start: 3, end: 7 },
  "MC Climber": { id: "CmyKz49OJ_k", start: 3, end: 7 },
  "Military Jog": { id: "CmyKz49OJ_k", start: 57, end: 60 },
  "Mountain Climbers": { id: "CmyKz49OJ_k", start: 74, end: 78 },
  "P Ups": { id: "CmyKz49OJ_k", start: 3, end: 7 },
  "Push Up Post Jack": { id: "CmyKz49OJ_k", start: 94, end: 98 },
  "Push Up Post Toe Touch": { id: "CmyKz49OJ_k", start: 86, end: 90 },
  "Push Ups": { id: "CmyKz49OJ_k", start: 3, end: 7 },
  "Shoulder Tap": { id: "CmyKz49OJ_k", start: 101, end: 105},
  "Side Knee Tuck": { id: "CmyKz49OJ_k", start: 51, end: 56 },
  "Side-to-Side": { id: "CmyKz49OJ_k", start: 35, end: 49 },
  "Simple Step Up": { id: "CmyKz49OJ_k", start: 5, end: 12 },
  "Squat and Press": { id: "CmyKz49OJ_k", start: 13, end: 18 },
  "Squat Jump": { id: "CmyKz49OJ_k", start: 3, end: 7 },
  "Squats": { id: "CmyKz49OJ_k", start: 30, end: 33 },
  "Stepper Touch Jack": { id: "CmyKz49OJ_k", start: 61, end: 65 },
  "Rest": { id: "CmyKz49OJ_k", start: 3, end: 7 }
};

const API_BASE_URL = window.location.protocol === "file:"
  ? "http://127.0.0.1:5000"
  : "";

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
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
    const escapedName = name.replace(/'/g, "\\'");
    const div = document.createElement("div");
    div.className = "exercise-item";
    div.innerHTML = `
      <span>${name}</span>
      <button onclick="openPopup('${escapedName}')">+ Add</button>
    `;
    list.appendChild(div);
  });
}

// -------- POPUP --------

function openPopup(name, index = null) {
  editingIndex = index;
  document.getElementById("popupName").value = name;

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
  document.getElementById("popup").classList.add("hidden");
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
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to save batch");
    }

    await response.json();

    currentBatch = [];
    updateSelectedCount();
    await loadSavedBatches();
    goHome();
  } catch (error) {
    console.error("Fetch error:", error);
    alert("Could not save batch. Make sure backend + MongoDB are running.");
  }
}

async function loadSavedBatches() {
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
        <button onclick="openPopup('${escapedName}', ${index})">Edit</button>
        <button onclick="removeVariation(${index})">Remove</button>
      </div>
    `;
    list.appendChild(div);
  });
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
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update batch");
    }

    await response.json();
    await loadSavedBatches();
    goHome();
  } catch (error) {
    console.error("Update error:", error);
    alert("Could not update batch. Make sure backend + MongoDB are running.");
  }
}

async function deleteExistingBatch() {
  if (!editingBatchId) {
    alert("No batch selected.");
    return;
  }

  const ok = confirm(`Delete batch "${editingBatchName}"? This cannot be undone.`);
  if (!ok) return;

  try {
    const response = await fetch(apiUrl(`/api/batches/${editingBatchId}`), {
      method: "DELETE"
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete batch");
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
    alert("Could not delete batch. Make sure backend + MongoDB are running.");
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
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to save batch");
    }

    await response.json();
    await loadSavedBatches();
    goHome();
  } catch (error) {
    console.error("Duplicate error:", error);
    alert("Could not duplicate batch. Make sure backend + MongoDB are running.");
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

    if (bgMusic) bgMusic.pause();
  } else {
    isPaused = false;
    btn.textContent = "Pause";

    if (bgMusic) {
      if (speechSynthesis.speaking || speechSynthesis.pending) duckMusic();
      const p = bgMusic.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }

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
  setupBgMusicFallback();
  loadSavedBatches();
};
