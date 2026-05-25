/* ═══════════════════════════════════════════════════════════════
   Focus Orbit — main.js  v2
   ═══════════════════════════════════════════════════════════════ */

"use strict";

// ── Constants ─────────────────────────────────────────────────
const STORE_KEY   = "fo-v4";
const DAY_MS      = 86400000;
const C_2PI       = Math.PI * 2;
const PIE_COLORS  = ["#c85c2e","#2a6359","#e8a04a","#7b5ea7","#4a7fa0",
                     "#a04a6b","#4a8f5a","#9a732a","#c87a5c","#5a6b9a"];
const ENCOURAGEMENTS = [
  "太棒了！继续保持这股劲！","专注的力量，你感受到了吗？",
  "每一分钟都是对未来的投资。","做完了！你今天又进步了一点。",
  "专注是一种修炼，你做到了。","稳！保持这个节奏。",
];

// ── Default State ──────────────────────────────────────────────
function defaultState() {
  return {
    page:            "profile",
    lastDate:        null,          // YYYY-MM-DD, detect new day
    calendarDate:    null,
    calendarSelectedDate: null,
    profile:         { name:"专注者", bio:"今天也要好好专注！" },
    selectedTaskId:  null,
    selectedService: "netease",
    celebrateOff:    false,
    theme:           "light",
    fontSize:        "md",
    fontScale:       100,
    notebookDate:    null,
    musicSession:    { active:false, name:"", service:"netease", taskId:null, startedAt:null, songId:null, runId:null, prepared:false, counted:false },
    focusRunId:      0,
    appearance:      {
      pageWallpaper:"", miniWallpaper:"", pageTextColor:"", miniTextColor:"",
      sidebarBlur:18, sidebarOpacity:82, contentBlur:14, contentOpacity:84, miniBlur:20, miniOpacity:94,
    },
    notebookItems:   [],   // { id, text, date, status, doneDate, order, taskId, cycleCheck, cycleStart, cycleDays, cycleEnd }
    notebookReviews: [],   // { date, text, updatedAt }
    tasks:           [],   // { id, title, tag, focusMins, cycleCheck, cycleDays, cycleStartDate, done, doneDate, actualMins, pomCount, createdAt }
    calendarEvents:  [],   // { id, title, date, startTime, endTime, notes, color, createdAt, updatedAt }
    completedEntries: [],  // { id, title, mins, date, source, tag, createdAt }
    memos:           [],   // { id, text, createdAt }
    sessions:        [],   // { id, taskId, title, tag, mins, date, time, song }
    songs:           [],   // { id, name, service, plays, focusMins }
    timer: {
      duration:    25 * 60,
      remaining:   25 * 60,
      running:     false,
      startedAt:   null,
      startedFrom: 25 * 60,
    },
  };
}

// ── State ──────────────────────────────────────────────────────
let S = loadState();
let tickId = null;

// ── DOM Cache ──────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const $$ = sel => [...document.querySelectorAll(sel)];
const D = {
  // Nav
  navItems: $$(".nav-item"),
  pages:    $$(".page"),

  // Profile
  avatarInitial: $("avatarInitial"),  profileName: $("profileName"),
  profileBio:    $("profileBio"),     editProfileBtn: $("editProfileBtn"),
  editPanel:     $("editPanel"),      nameInput: $("nameInput"),
  bioInput:      $("bioInput"),       saveProfileBtn: $("saveProfileBtn"),
  cancelProfileBtn: $("cancelProfileBtn"),
  pTodayMins: $("p-todayMins"), pStreak: $("p-streak"),
  pTotalMins: $("p-totalMins"), pDoneTasks: $("p-doneTasks"),
  pCurrentTask: $("p-currentTask"), pCurrentTag: $("p-currentTag"),
  svcTabs:    $$(".svc-tab"),  mcTopSong: $("mc-topSong"),
  songInput:  $("songInput"), logSongBtn: $("logSongBtn"), mcSongList: $("mc-songList"),
  mcActiveSong: $("mcActiveSong"),
  pageWallpaperFile: $("pageWallpaperFile"), miniWallpaperFile: $("miniWallpaperFile"),
  pageTextColor: $("pageTextColor"), miniTextColor: $("miniTextColor"),
  sidebarBlur: $("sidebarBlur"), sidebarOpacity: $("sidebarOpacity"),
  contentBlur: $("contentBlur"), contentOpacity: $("contentOpacity"),
  miniBlur: $("miniBlur"), miniOpacity: $("miniOpacity"),
  clearPageWallpaper: $("clearPageWallpaper"), clearMiniWallpaper: $("clearMiniWallpaper"),
  resetAppearanceBtn: $("resetAppearanceBtn"),

  // Focus
  focusTaskLabel: $("focusTaskLabel"), focusTaskTag: $("focusTaskTag"),
  timerCanvas:  $("timerCanvas"), timerDigits: $("timerDigits"),
  timerPhase:   $("timerPhase"),  timerStartAt: $("timerStartAt"),
  startPauseBtn: $("startPauseBtn"), resetBtn: $("resetBtn"), doneBtn: $("doneBtn"),
  presets:     $$(".preset"), customMin: $("customMin"), applyCustom: $("applyCustom"),
  ftpList:  $("ftpList"), fmcTop: $("fmc-top"),

  // Planner
  plannerDate: $("plannerDate"),   taskTitle: $("taskTitle"),
  taskTag:     $("taskTag"),       taskFocusMins: $("taskFocusMins"),
  taskCycleCheck: $("taskCycleCheck"), cycleInputs: $("cycleInputs"),
  taskCycleStart: $("taskCycleStart"), taskCycleEnd: $("taskCycleEnd"),
  taskCycleStartDays: $("taskCycleStartDays"), taskCycleDays: $("taskCycleDays"),
  cycleModeInputs: $$("input[name='cycleMode']"),
  cycleRangePanel: $("cycleRangePanel"), cycleDaysPanel: $("cycleDaysPanel"),
  taskFormToggle: $("taskFormToggle"), taskFormDetails: $("taskFormDetails"),
  addTaskBtn: $("addTaskBtn"),
  activeTasks: $("activeTasks"),   cycleCount: $("cycleCount"),
  cycleTasks:  $("cycleTasks"),    toggleCycleTasks: $("toggleCycleTasks"),
  activeCount: $("activeCount"),   memoInput: $("memoInput"),
  addMemoBtn:  $("addMemoBtn"),    memoList: $("memoList"),
  notebookInput: $("notebookInput"), saveNotebookBtn: $("saveNotebookBtn"),
  notebookCycleCheck: $("notebookCycleCheck"), notebookCycleInputs: $("notebookCycleInputs"),
  notebookCycleStart: $("notebookCycleStart"), notebookCycleDays: $("notebookCycleDays"),
  noteCompleteBtn: $("noteCompleteBtn"), noteMoveBtn: $("noteMoveBtn"),
  noteMoveBackBtn: $("noteMoveBackBtn"), noteDeleteBtn: $("noteDeleteBtn"), notebookList: $("notebookList"),
  notebookCount: $("notebookCount"),
  notebookDate: $("notebookDate"), notebookFilterBtn: $("notebookFilterBtn"),
  notebookTodayBtn: $("notebookTodayBtn"), notebookPrevBtn: $("notebookPrevBtn"),
  notebookNextBtn: $("notebookNextBtn"),
  notebookReviewDate: $("notebookReviewDate"), notebookReviewInput: $("notebookReviewInput"),
  saveNotebookReviewBtn: $("saveNotebookReviewBtn"), clearNotebookReviewBtn: $("clearNotebookReviewBtn"),

  // Calendar
  sidebarCalendarMonth: $("sidebarCalendarMonth"), sidebarCalendarGrid: $("sidebarCalendarGrid"),
  calendarPrevBtn: $("calendarPrevBtn"), calendarNextBtn: $("calendarNextBtn"),
  calendarTodayBtn: $("calendarTodayBtn"), calendarMonthLabel: $("calendarMonthLabel"),
  calendarTodayLabel: $("calendarTodayLabel"), calendarGrid: $("calendarGrid"),
  calendarAgendaDate: $("calendarAgendaDate"), calendarAgendaList: $("calendarAgendaList"),
  calendarEditorOverlay: $("calendarEditorOverlay"), calendarEditorTitle: $("calendarEditorTitle"),
  calendarEventId: $("calendarEventId"),
  calendarEventTitle: $("calendarEventTitle"), calendarEventDate: $("calendarEventDate"),
  calendarEventEndDate: $("calendarEventEndDate"), calendarEventColor: $("calendarEventColor"), calendarEventStart: $("calendarEventStart"),
  calendarEventEnd: $("calendarEventEnd"), calendarEventNotes: $("calendarEventNotes"),
  calendarSaveBtn: $("calendarSaveBtn"), calendarDeleteBtn: $("calendarDeleteBtn"),
  calendarClearBtn: $("calendarClearBtn"),

  // Insights
  iToday: $("i-today"), iWeek: $("i-week"), iCount: $("i-count"), iStreak: $("i-streak"),
  pieCanvas:   $("pieCanvas"),    pieTooltip: $("pieTooltip"),
  pieLegend:   $("pieLegend"),    barCanvas: $("barCanvas"),
  topMusicList: $("topMusicList"), sessionList: $("sessionList"),

  // History
  historyDate: $("historyDate"), historyFilterBtn: $("historyFilterBtn"),
  historyTodayBtn: $("historyTodayBtn"), historyContent: $("historyContent"),
  historyPrevBtn: $("historyPrevBtn"), historyNextBtn: $("historyNextBtn"),
  manualDoneTitle: $("manualDoneTitle"), manualDoneMins: $("manualDoneMins"),
  manualDoneDate: $("manualDoneDate"), manualDoneBtn: $("manualDoneBtn"),

  // Mini
  miniWidget: $("miniWidget"), miniTrigger: $("miniTrigger"),
  miniClose:  $("miniClose"),  miniTime: $("miniTime"),
  miniTask:   $("miniTask"),   miniStartPause: $("miniStartPause"),
  miniReset:  $("miniReset"),

  // Theme / font
  themeBtns: $$(".theme-btn"),  fontBtns: $$(".font-btn"),

  // Modals
  newDayOverlay:    $("newDayOverlay"),    ndTaskList: $("ndTaskList"),
  ndConfirmBtn:     $("ndConfirmBtn"),     ndSkipBtn: $("ndSkipBtn"),
  celebrateOverlay: $("celebrateOverlay"), celebrateEmoji: $("celebrateEmoji"),
  celebrateTitle:   $("celebrateTitle"),   celebrateSub: $("celebrateSub"),
  celebrateStats:   $("celebrateStats"),   celebrateOkBtn: $("celebrateOkBtn"),
  celebrateOffBtn:  $("celebrateOffBtn"),
};

// Pie state
let pieSlices = [];
let timerCtx  = null;
let pieCtx    = null;
let barCtx    = null;
let calendarDrag = null;
let calendarResize = null;
let calendarPreviewDates = [];
let calendarCellMetrics = [];
let calendarGridBounds = null;

// ═══════════════════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════════════════
applyTheme(S.theme);
applyFontSize(S.fontScale ?? S.fontSize);
pruneExpiredRecurringItems();
applyAppearance();
bindEvents();
syncTimer();
checkNewDay();
render();
startTick();

// ═══════════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════════
function bindEvents() {
  // Nav
  D.navItems.forEach(b => b.addEventListener("click", () => { S.page = b.dataset.page; persist(); render(); }));

  // Nav shortcuts in content
  document.querySelectorAll("[data-page]").forEach(el => {
    if (!el.classList.contains("nav-item"))
      el.addEventListener("click", () => { S.page = el.dataset.page; persist(); render(); });
  });

  // Theme
  D.themeBtns.forEach(b => b.addEventListener("click", () => { applyTheme(b.dataset.theme); S.theme = b.dataset.theme; persist(); }));

  // Font size slider (profile page)
  const fontSlider = $("fontSizeSlider");
  if (fontSlider) {
    fontSlider.value = String(getFontScale());
    fontSlider.addEventListener("input", () => {
      const scale = clamp(+fontSlider.value || 100, 85, 125);
      applyFontSize(scale);
      S.fontScale = scale;
      persist();
    });
  }

  // Profile
  D.editProfileBtn.addEventListener("click", () => { D.nameInput.value = S.profile.name; D.bioInput.value = S.profile.bio; D.editPanel.classList.remove("hidden"); });
  D.saveProfileBtn.addEventListener("click", () => { S.profile.name = D.nameInput.value.trim() || S.profile.name; S.profile.bio = D.bioInput.value.trim() || S.profile.bio; D.editPanel.classList.add("hidden"); persist(); render(); });
  D.cancelProfileBtn.addEventListener("click", () => D.editPanel.classList.add("hidden"));

  // Music
  D.svcTabs.forEach(t => t.addEventListener("click", () => { S.selectedService = t.dataset.svc; persist(); render(); }));
  D.logSongBtn.addEventListener("click", logSong);
  D.songInput.addEventListener("keydown", e => e.key === "Enter" && logSong());
  D.mcSongList.addEventListener("click", e => {
    const item = e.target.closest("[data-song-id]");
    if (item) selectExistingSong(item.dataset.songId);
  });
  D.pageWallpaperFile.addEventListener("change", e => handleWallpaperUpload(e, "page"));
  D.miniWallpaperFile.addEventListener("change", e => handleWallpaperUpload(e, "mini"));
  D.pageTextColor.addEventListener("input", () => { S.appearance.pageTextColor = D.pageTextColor.value; persist(); applyAppearance(); });
  D.miniTextColor.addEventListener("input", () => { S.appearance.miniTextColor = D.miniTextColor.value; persist(); applyAppearance(); });
  D.sidebarBlur.addEventListener("input", () => updateAppearanceRange("sidebarBlur", D.sidebarBlur.value));
  D.sidebarOpacity.addEventListener("input", () => updateAppearanceRange("sidebarOpacity", D.sidebarOpacity.value));
  D.contentBlur.addEventListener("input", () => updateAppearanceRange("contentBlur", D.contentBlur.value));
  D.contentOpacity.addEventListener("input", () => updateAppearanceRange("contentOpacity", D.contentOpacity.value));
  D.miniBlur.addEventListener("input", () => updateAppearanceRange("miniBlur", D.miniBlur.value));
  D.miniOpacity.addEventListener("input", () => updateAppearanceRange("miniOpacity", D.miniOpacity.value));
  D.clearPageWallpaper.addEventListener("click", () => clearWallpaper("page"));
  D.clearMiniWallpaper.addEventListener("click", () => clearWallpaper("mini"));
  D.resetAppearanceBtn.addEventListener("click", resetAppearance);

  // Timer
  D.startPauseBtn.addEventListener("click", handleStartPause);
  D.resetBtn.addEventListener("click", handleReset);
  D.doneBtn.addEventListener("click", () => completeSession(true));
  D.presets.forEach(b => b.addEventListener("click", () => setDuration(+b.dataset.min * 60)));
  D.applyCustom.addEventListener("click", applyCustom);
  D.customMin.addEventListener("keydown", e => e.key === "Enter" && applyCustom());

  // Task picker (focus page)
  D.ftpList.addEventListener("click", e => {
    const item = e.target.closest(".ftp-task");
    if (!item) return;
    const nextId = item.dataset.id || null;
    if (S.selectedTaskId === nextId) {
      S.selectedTaskId = null;
    } else {
      S.selectedTaskId = nextId;
      const task = getSelectedTask();
      if (task?.focusMins && !S.timer.running) {
        S.timer.duration = task.focusMins * 60;
        S.timer.remaining = task.focusMins * 60;
        S.timer.startedFrom = task.focusMins * 60;
      }
    }
    persist(); render();
  });

  // Planner
  D.plannerDate.textContent = formatDateFull(new Date());
  D.taskCycleCheck.addEventListener("change", () => {
    syncCycleInputs();
  });
  D.cycleModeInputs.forEach(input => input.addEventListener("change", syncCycleInputs));
  D.taskFormToggle.addEventListener("click", toggleTaskFormDetails);
  D.taskTitle.addEventListener("keydown", e => e.key === "Enter" && addTask());
  D.addTaskBtn.addEventListener("click", addTask);
  D.activeTasks.addEventListener("click", handleTaskClick);
  D.cycleTasks.addEventListener("click",  handleTaskClick);
  D.toggleCycleTasks.addEventListener("click", () => {
    const hidden = D.cycleTasks.classList.toggle("hidden");
    D.toggleCycleTasks.textContent = hidden ? "展开" : "收起";
  });
  D.addMemoBtn.addEventListener("click", addMemo);
  D.memoInput.addEventListener("keydown", e => e.key === "Enter" && e.ctrlKey && addMemo());
  D.memoList.addEventListener("click", e => {
    const d = e.target.closest("[data-del-memo]");
    if (d) { S.memos = S.memos.filter(m => m.id !== d.dataset.delMemo); persist(); render(); }
  });
  D.saveNotebookBtn.addEventListener("click", saveNotebook);
  D.notebookCycleCheck.addEventListener("change", syncNotebookCycleInputs);
  D.notebookFilterBtn.addEventListener("click", () => setNotebookDate(D.notebookDate.value || localDate(new Date())));
  D.notebookTodayBtn.addEventListener("click", () => setNotebookDate(localDate(new Date())));
  D.notebookPrevBtn.addEventListener("click", () => shiftNotebookDate(-1));
  D.notebookNextBtn.addEventListener("click", () => shiftNotebookDate(1));
  D.notebookDate.addEventListener("keydown", e => e.key === "Enter" && setNotebookDate(D.notebookDate.value || localDate(new Date())));
  D.noteCompleteBtn.addEventListener("click", () => applyNotebookAction("done"));
  D.noteMoveBtn.addEventListener("click", () => applyNotebookAction("tomorrow"));
  D.noteMoveBackBtn.addEventListener("click", () => applyNotebookAction("yesterday"));
  D.noteDeleteBtn.addEventListener("click", () => applyNotebookAction("delete"));
  D.saveNotebookReviewBtn.addEventListener("click", saveNotebookReview);
  D.clearNotebookReviewBtn.addEventListener("click", clearNotebookReview);
  D.notebookList.addEventListener("click", e => {
    const focusBtn = e.target.closest("[data-note-focus]");
    if (focusBtn) {
      startFocusFromNotebook(focusBtn.dataset.noteFocus);
      return;
    }
    const item = e.target.closest("[data-note-id]");
    if (item) toggleNotebookItem(item.dataset.noteId);
  });
  D.notebookList.addEventListener("dragstart", handleNotebookDragStart);
  D.notebookList.addEventListener("dragover", handleNotebookDragOver);
  D.notebookList.addEventListener("drop", handleNotebookDrop);
  D.notebookList.addEventListener("dragend", handleNotebookDragEnd);

  // Calendar
  D.calendarPrevBtn?.addEventListener("click", () => shiftCalendarMonth(-1));
  D.calendarNextBtn?.addEventListener("click", () => shiftCalendarMonth(1));
  D.calendarTodayBtn?.addEventListener("click", focusCalendarToday);
  D.calendarSaveBtn?.addEventListener("click", saveCalendarEvent);
  D.calendarDeleteBtn?.addEventListener("click", deleteCalendarEvent);
  D.calendarClearBtn?.addEventListener("click", closeCalendarEditor);
  D.calendarGrid?.addEventListener("click", handleCalendarGridClick);
  D.calendarGrid?.addEventListener("dblclick", handleCalendarGridDoubleClick);
  D.calendarGrid?.addEventListener("dragstart", handleCalendarEventDragStart);
  D.calendarGrid?.addEventListener("dragover", handleCalendarGridDragOver);
  D.calendarGrid?.addEventListener("drop", handleCalendarGridDrop);
  D.sidebarCalendarGrid?.addEventListener("click", handleCalendarGridClick);
  D.calendarAgendaList?.addEventListener("click", handleCalendarAgendaClick);
  D.calendarAgendaList?.addEventListener("dblclick", handleCalendarAgendaDoubleClick);
  D.calendarAgendaList?.addEventListener("dragstart", handleCalendarEventDragStart);
  document.addEventListener("dragend", () => {
    calendarDrag = null;
    clearCalendarPreview();
  });
  document.addEventListener("mousedown", handleCalendarResizeStart);
  document.addEventListener("mousemove", handleCalendarResizeMove);
  document.addEventListener("mouseup", handleCalendarResizeEnd);
  window.addEventListener("resize", cacheCalendarCellMetrics);
  D.calendarEditorOverlay?.addEventListener("click", e => {
    if (e.target === D.calendarEditorOverlay) closeCalendarEditor();
  });

  // History
  D.manualDoneDate.value = localDate(new Date());
  D.manualDoneBtn.addEventListener("click", addManualCompletedTask);
  D.manualDoneTitle.addEventListener("keydown", e => e.key === "Enter" && addManualCompletedTask());
  D.historyFilterBtn.addEventListener("click", () => renderHistory(D.historyDate.value));
  D.historyTodayBtn.addEventListener("click", () => { D.historyDate.value = localDate(new Date()); renderHistory(D.historyDate.value); });
  D.historyPrevBtn.addEventListener("click", () => shiftHistoryDate(-1));
  D.historyNextBtn.addEventListener("click", () => shiftHistoryDate(1));
  D.historyDate.addEventListener("keydown", e => e.key === "Enter" && renderHistory(D.historyDate.value));

  // Mini
  D.miniTrigger.addEventListener("click", () => D.miniWidget.classList.remove("hidden"));
  D.miniClose.addEventListener("click",   () => D.miniWidget.classList.add("hidden"));
  D.miniStartPause.addEventListener("click", handleStartPause);
  D.miniReset.addEventListener("click", handleReset);

  // New-day modal
  D.ndConfirmBtn.addEventListener("click", confirmNewDay);
  D.ndSkipBtn.addEventListener("click",    skipNewDay);

  // Celebrate modal
  D.celebrateOkBtn.addEventListener("click",  () => D.celebrateOverlay.classList.add("hidden"));
  D.celebrateOffBtn.addEventListener("click", () => { S.celebrateOff = true; persist(); D.celebrateOverlay.classList.add("hidden"); });

  // Canvas init on first use
  timerCtx = D.timerCanvas.getContext("2d");
  pieCtx   = D.pieCanvas.getContext("2d");
  barCtx   = D.barCanvas.getContext("2d");
}

// ═══════════════════════════════════════════════════════════════
// THEME & FONT
// ═══════════════════════════════════════════════════════════════
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  D.themeBtns.forEach(b => b.classList.toggle("active", b.dataset.theme === theme));
  // Redraw canvases when theme changes
  applyAppearance();
  setTimeout(() => { drawTimerRing(); drawPie(); drawBar(); }, 50);
}

function applyFontSize(size) {
  const scale = typeof size === "number" ? size : legacyFontScale(size);
  document.documentElement.style.setProperty("--font-scale", scale / 100);
  document.documentElement.dataset.fontSize = scale < 95 ? "sm" : scale > 110 ? "lg" : "md";
  const fontHint = $("fontSizeHint");
  if (fontHint) fontHint.textContent = `${Math.round(scale)}%`;
  const fontSlider = $("fontSizeSlider");
  if (fontSlider) fontSlider.value = String(Math.round(scale));
}

function getFontScale() {
  return clamp(S.fontScale ?? legacyFontScale(S.fontSize), 85, 125);
}

function legacyFontScale(size) {
  return ({ sm: 90, md: 100, lg: 114 }[size] ?? 100);
}

function toggleTaskFormDetails(force) {
  const open = typeof force === "boolean" ? force : D.taskFormDetails.classList.contains("hidden");
  D.taskFormDetails.classList.toggle("hidden", !open);
  D.taskFormToggle.textContent = open ? "收起详情" : "展开详情";
  D.taskFormToggle.setAttribute("aria-expanded", String(open));
}

function syncCycleInputs() {
  const enabled = D.taskCycleCheck.checked;
  const today = localDate(new Date());
  D.cycleInputs.classList.toggle("hidden", !enabled);
  if (!enabled) return;

  if (!D.taskCycleStart.value) D.taskCycleStart.value = today;
  if (!D.taskCycleStartDays.value) D.taskCycleStartDays.value = today;
  if (!D.taskCycleEnd.value) D.taskCycleEnd.value = localDate(new Date(Date.now() + 30 * DAY_MS));
  if (!D.taskCycleDays.value) D.taskCycleDays.value = "7";

  const mode = getCycleMode();
  D.cycleRangePanel.classList.toggle("hidden", mode !== "range");
  D.cycleDaysPanel.classList.toggle("hidden", mode !== "days");
}

function getCycleMode() {
  return D.cycleModeInputs.find(input => input.checked)?.value || "range";
}

function shiftHistoryDate(days) {
  const base = D.historyDate.value || localDate(new Date());
  const next = parseLocalDateInput(base);
  next.setDate(next.getDate() + days);
  D.historyDate.value = localDate(next);
  renderHistory(D.historyDate.value);
}

function getCurrentNotebookDate() {
  return S.notebookDate || localDate(new Date());
}

function setNotebookDate(dateStr) {
  S.notebookDate = dateStr;
  S._selectedNotebookIds = [];
  persist();
  renderNotebook();
}

function shiftNotebookDate(days) {
  const base = D.notebookDate.value || getCurrentNotebookDate();
  const next = parseLocalDateInput(base);
  next.setDate(next.getDate() + days);
  setNotebookDate(localDate(next));
}

function applyAppearance() {
  const themeBackdrop = getThemeBackdrop(S.theme);
  if (S.appearance.pageWallpaper) {
    document.body.style.backgroundImage = `linear-gradient(rgba(15,12,10,0.18), rgba(15,12,10,0.18)), url("${S.appearance.pageWallpaper}")`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundAttachment = "fixed";
  } else {
    document.body.style.backgroundImage = themeBackdrop;
    document.body.style.backgroundSize = "";
    document.body.style.backgroundPosition = "";
    document.body.style.backgroundRepeat = "";
    document.body.style.backgroundAttachment = "";
  }

  D.miniWidget.style.backgroundImage = S.appearance.miniWallpaper
    ? `linear-gradient(rgba(10,8,8,0.18), rgba(10,8,8,0.18)), url("${S.appearance.miniWallpaper}")`
    : "";
  D.miniWidget.style.backgroundSize = S.appearance.miniWallpaper ? "cover" : "";
  D.miniWidget.style.backgroundPosition = S.appearance.miniWallpaper ? "center" : "";

  document.documentElement.style.setProperty("--user-page-text", S.appearance.pageTextColor || "");
  document.documentElement.style.setProperty("--user-mini-text", S.appearance.miniTextColor || "");
  document.documentElement.style.setProperty("--sidebar-blur", `${clamp(+S.appearance.sidebarBlur || 18, 0, 32)}px`);
  document.documentElement.style.setProperty("--sidebar-opacity", `${clamp(+S.appearance.sidebarOpacity || 82, 20, 100) / 100}`);
  document.documentElement.style.setProperty("--content-blur", `${clamp(+S.appearance.contentBlur || 14, 0, 36)}px`);
  document.documentElement.style.setProperty("--content-opacity", `${clamp(+S.appearance.contentOpacity || 84, 20, 100) / 100}`);
  document.documentElement.style.setProperty("--mini-blur", `${clamp(+S.appearance.miniBlur || 20, 0, 32)}px`);
  document.documentElement.style.setProperty("--mini-opacity", `${clamp(+S.appearance.miniOpacity || 94, 20, 100) / 100}`);

  D.pageTextColor.value = normalizeColorValue(S.appearance.pageTextColor, "#1a1108");
  D.miniTextColor.value = normalizeColorValue(S.appearance.miniTextColor, "#f5ede4");
  D.sidebarBlur.value = String(clamp(+S.appearance.sidebarBlur || 18, 0, 32));
  D.sidebarOpacity.value = String(clamp(+S.appearance.sidebarOpacity || 82, 20, 100));
  D.contentBlur.value = String(clamp(+S.appearance.contentBlur || 14, 0, 36));
  D.contentOpacity.value = String(clamp(+S.appearance.contentOpacity || 84, 20, 100));
  D.miniBlur.value = String(clamp(+S.appearance.miniBlur || 20, 0, 32));
  D.miniOpacity.value = String(clamp(+S.appearance.miniOpacity || 94, 20, 100));
}

function getThemeBackdrop(theme) {
  return theme === "dark"
    ? "radial-gradient(ellipse 50% 40% at 5% 5%, rgba(200,100,50,0.05) 0%, transparent 60%), radial-gradient(ellipse 40% 50% at 95% 90%, rgba(42,120,100,0.04) 0%, transparent 60%)"
    : "radial-gradient(ellipse 60% 40% at 8% 4%, rgba(200,92,46,0.07) 0%, transparent 55%), radial-gradient(ellipse 50% 50% at 92% 96%, rgba(42,99,89,0.06) 0%, transparent 55%)";
}

function handleWallpaperUpload(e, target) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    if (target === "page") S.appearance.pageWallpaper = String(reader.result || "");
    else S.appearance.miniWallpaper = String(reader.result || "");
    persist();
    applyAppearance();
  };
  reader.readAsDataURL(file);
}

function clearWallpaper(target) {
  if (target === "page") {
    S.appearance.pageWallpaper = "";
    D.pageWallpaperFile.value = "";
  } else {
    S.appearance.miniWallpaper = "";
    D.miniWallpaperFile.value = "";
  }
  persist();
  applyAppearance();
}

function resetAppearance() {
  S.appearance.pageTextColor = "";
  S.appearance.miniTextColor = "";
  S.appearance.sidebarBlur = 18;
  S.appearance.sidebarOpacity = 82;
  S.appearance.contentBlur = 14;
  S.appearance.contentOpacity = 84;
  S.appearance.miniBlur = 20;
  S.appearance.miniOpacity = 94;
  persist();
  applyAppearance();
}

function updateAppearanceRange(key, value) {
  S.appearance[key] = +value;
  persist();
  applyAppearance();
}

// ═══════════════════════════════════════════════════════════════
// NEW DAY CHECK
// ═══════════════════════════════════════════════════════════════
function checkNewDay() {
  pruneExpiredRecurringItems();
  const today = localDate(new Date());
  if (!S.lastDate || S.lastDate === today) { S.lastDate = today; return; }

  const yesterday = S.lastDate;
  S.lastDate = today;

  const candidates = S.tasks.filter(t => {
    if (t.cycleCheck || t.done) return false;
    return getTaskPlannedDate(t) === yesterday;
  });

  if (candidates.length === 0) { persist(); return; }

  // Show modal
  const ndChecked = new Set(candidates.map(t => t.id));
  D.ndTaskList.innerHTML = candidates.map(t => {
    let cycleLabel = "昨日未完成";
    if (t.cycleCheck) {
      const end = t.cycleEnd || (t.cycleStartDate && t.cycleDays ? localDate(new Date(new Date(t.cycleStartDate).getTime() + t.cycleDays * DAY_MS)) : null);
      cycleLabel = end ? `循环至 ${end}` : "持续循环";
    }
    return `
      <div class="nd-task-item checked" data-ndid="${t.id}">
        <div class="nd-check"></div>
        <div class="nd-task-label">${esc(t.title)}${t.tag ? ` <span class="muted small">· ${esc(t.tag)}</span>` : ""}</div>
        <span class="nd-task-cycle">${cycleLabel}</span>
      </div>`;
  }).join("");

  // Toggle check on click
  D.ndTaskList.querySelectorAll(".nd-task-item").forEach(item => {
    item.addEventListener("click", () => {
      item.classList.toggle("checked");
      if (item.classList.contains("checked")) ndChecked.add(item.dataset.ndid);
      else ndChecked.delete(item.dataset.ndid);
    });
  });

  D.ndConfirmBtn.dataset.ndChecked = [...ndChecked].join(",");
  D.newDayOverlay.classList.remove("hidden");

  // Store ndChecked reference for confirm handler
  D.ndConfirmBtn._ndChecked = ndChecked;
  persist();
}

function confirmNewDay() {
  const checked = D.ndConfirmBtn._ndChecked ?? new Set();
  S.tasks = S.tasks.map(t => {
    if (checked.has(t.id)) {
      return {
        ...t,
        done: false,
        doneDate: null,
        taskDate: localDate(new Date()),
        createdAt: new Date().toISOString(),
      };
    }
    return t;
  });
  D.newDayOverlay.classList.add("hidden");
  persist(); render();
}

function skipNewDay() {
  D.newDayOverlay.classList.add("hidden");
  persist();
}

function remainingCycleDays(t) {
  if (!t.cycleStartDate || !t.cycleDays) return 0;
  const end = new Date(t.cycleStartDate).getTime() + t.cycleDays * DAY_MS;
  return Math.max(0, Math.ceil((end - Date.now()) / DAY_MS));
}

// ═══════════════════════════════════════════════════════════════
// RENDER — master
// ═══════════════════════════════════════════════════════════════
function render() {
  pruneExpiredRecurringItems();
  renderNav();
  renderProfile();
  renderTimer();          // also calls drawTimerRing
  renderFocusPicker();
  renderPlanner();
  renderCalendar();
  renderNotebook();
  renderInsights();
  renderMini();
}

function renderNav() {
  D.navItems.forEach(b => b.classList.toggle("active", b.dataset.page === S.page));
  D.pages.forEach(p => p.classList.toggle("active", p.id === `page-${S.page}`));
  // Lazy-render history only when on that page
  if (S.page === "history") {
    const v = D.historyDate.value || localDate(new Date());
    D.historyDate.value = v;
    renderHistory(v);
  }
}

// ── Profile ────────────────────────────────────────────────────
function renderProfile() {
  D.avatarInitial.textContent = (S.profile.name || "U")[0].toUpperCase();
  D.profileName.textContent   = S.profile.name;
  D.profileBio.textContent    = S.profile.bio;

  const today     = localDate(new Date());
  const todayMins = sumMins(S.sessions.filter(s => s.date === today));
  const totalMins = sumMins(S.sessions);
  const doneTasks = S.tasks.filter(t => t.done).length;

  D.pTodayMins.innerHTML = `${todayMins}<small>分钟</small>`;
  D.pStreak.innerHTML    = `${getStreak()}<small>天</small>`;
  D.pTotalMins.innerHTML = `${totalMins}<small>分钟</small>`;
  D.pDoneTasks.innerHTML = `${doneTasks}<small>项</small>`;

  const task = getSelectedTask();
  D.pCurrentTask.textContent = task ? task.title : "未选择任务";
  D.pCurrentTag.textContent  = task?.tag || "";

  D.svcTabs.forEach(t => t.classList.toggle("active", t.dataset.svc === S.selectedService));

  const top = getTopSong();
  D.mcTopSong.innerHTML = top
    ? `🎵 <strong>${esc(top.name)}</strong> · ${top.plays}次`
    : `<span class="muted">还没有记录</span>`;
  D.mcActiveSong.textContent = getMusicSessionLabel();

  const songs = [...S.songs].filter(s => s.service === S.selectedService).sort((a,b) => b.plays - a.plays).slice(0,6);
  D.mcSongList.innerHTML = songs.map(s => `
    <button class="mc-song-item ${isSelectedMusicSong(s.id) ? "selected" : ""}" data-song-id="${s.id}" type="button">
      <span>${esc(s.name)}</span>
      <span class="plays">${s.plays}次 · ${s.focusMins}分钟</span>
    </button>`).join("") || "";

  // Sync font slider
  const fontSlider = $("fontSizeSlider");
  const fontHint   = $("fontSizeHint");
  if (fontSlider) {
    const scale = getFontScale();
    fontSlider.value = String(scale);
    if (fontHint) fontHint.textContent = `${scale}%`;
  }
}

// ── Timer render + canvas drawing ──────────────────────────────
function renderTimer() {
  const { remaining, duration, running, startedAt } = S.timer;

  D.timerDigits.textContent = fmt(remaining);
  D.timerPhase.textContent  = running ? "专注中" : remaining < duration ? "已暂停" : "准备开始";

  if (running && startedAt) {
    const d = new Date(startedAt);
    D.timerStartAt.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())} 开始`;
  } else {
    D.timerStartAt.textContent = "——";
  }

  D.startPauseBtn.textContent = running ? "暂停" : "开始";
  D.startPauseBtn.classList.toggle("running", running);
  D.doneBtn.disabled = !canCompleteSession();

  D.presets.forEach(b => b.classList.toggle("active", +b.dataset.min * 60 === duration));

  const task = getSelectedTask();
  D.focusTaskLabel.textContent = task ? task.title : "未选择任务";
  if (task?.tag) { D.focusTaskTag.textContent = task.tag; D.focusTaskTag.classList.remove("hidden"); }
  else D.focusTaskTag.classList.add("hidden");

  D.fmcTop.innerHTML = S.musicSession.active
    ? `🎵 <strong>${esc(S.musicSession.name)}</strong>`
    : `<span class="muted small">本次专注还未选择音乐</span>`;

  drawTimerRing();
}

function drawTimerRing() {
  const canvas = D.timerCanvas;
  if (!timerCtx || !canvas) return;

  const dpr  = window.devicePixelRatio || 1;
  const size = 260;  // matches CSS width/height
  canvas.width  = size * dpr;
  canvas.height = size * dpr;
  const ctx = timerCtx;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cx = size / 2, cy = size / 2;
  const R = size * 0.44;
  const lineW = size * 0.055;
  const isDark = document.documentElement.dataset.theme === "dark";

  const { remaining, duration } = S.timer;
  const progress = duration > 0 ? (duration - remaining) / duration : 0;

  ctx.clearRect(0, 0, size, size);

  // Track
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, C_2PI);
  ctx.strokeStyle = isDark ? "rgba(255,200,140,0.08)" : "rgba(200,92,46,0.1)";
  ctx.lineWidth   = lineW;
  ctx.stroke();

  // Progress arc
  if (progress > 0) {
    const startAngle = -Math.PI / 2;
    const endAngle   = startAngle + progress * C_2PI;
    ctx.beginPath();
    ctx.arc(cx, cy, R, startAngle, endAngle);
    const grad = ctx.createLinearGradient(cx - R, cy, cx + R, cy);
    grad.addColorStop(0, isDark ? "#e07040" : "#c85c2e");
    grad.addColorStop(1, isDark ? "#f0a060" : "#ea8a54");
    ctx.strokeStyle = grad;
    ctx.lineWidth   = lineW;
    ctx.lineCap     = "round";
    ctx.stroke();
  }

  // Subtle glow dot at tip
  if (progress > 0.01 && progress < 0.99) {
    const angle = -Math.PI / 2 + progress * C_2PI;
    const tx = cx + R * Math.cos(angle);
    const ty = cy + R * Math.sin(angle);
    const glow = ctx.createRadialGradient(tx, ty, 0, tx, ty, lineW);
    glow.addColorStop(0, isDark ? "rgba(240,160,96,0.7)" : "rgba(200,92,46,0.6)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.beginPath();
    ctx.arc(tx, ty, lineW, 0, C_2PI);
    ctx.fillStyle = glow;
    ctx.fill();
  }
}

// ── Focus Picker ───────────────────────────────────────────────
function renderFocusPicker() {
  const today = localDate(new Date());
  const active = S.tasks.filter(t => !t.done && isTaskVisibleInPlanner(t, today));
  if (!active.length) {
    D.ftpList.innerHTML = `
      <div class="ftp-task ${!S.selectedTaskId ? "selected" : ""}" data-id="">
        <div class="ftp-task-dot"></div>
        <div class="ftp-task-info">
          <div class="ftp-task-title">自由专注</div>
          <div class="ftp-task-tag">不绑定任务，直接开始</div>
        </div>
        <span class="ftp-task-mins">——</span>
      </div>`;
    return;
  }
  D.ftpList.innerHTML = `
    <div class="ftp-task ${!S.selectedTaskId ? "selected" : ""}" data-id="">
      <div class="ftp-task-dot"></div>
      <div class="ftp-task-info">
        <div class="ftp-task-title">自由专注</div>
        <div class="ftp-task-tag">再次点击已选任务也会回到这里</div>
      </div>
      <span class="ftp-task-mins">——</span>
    </div>` + active.map(t => `
    <div class="ftp-task ${t.id === S.selectedTaskId ? "selected" : ""}" data-id="${t.id}">
      <div class="ftp-task-dot"></div>
      <div class="ftp-task-info">
        <div class="ftp-task-title">${esc(t.title)}</div>
        ${t.tag ? `<div class="ftp-task-tag">${esc(t.tag)}</div>` : ""}
      </div>
      <span class="ftp-task-mins">${t.focusMins ? `${t.focusMins}分钟` : "——"}</span>
    </div>`).join("");
}

// ── Planner ────────────────────────────────────────────────────
function isCycleActiveToday(t) {
  if (!t.cycleCheck) return false;
  const today = localDate(new Date());
  // support both new (cycleStart/cycleEnd) and old (cycleStartDate/cycleDays) format
  const start = t.cycleStart || t.cycleStartDate || null;
  const end = getTaskCycleEnd(t);
  if (!start) return true; // no range = always active
  return today >= start && (!end || today <= end);
}

function renderPlanner() {
  D.plannerDate.textContent = formatDateFull(new Date());
  syncCycleInputs();
  const today = localDate(new Date());

  const active = [...S.tasks.filter(t => isTaskVisibleInPlanner(t, today))]
    .sort((a, b) => Number(a.done) - Number(b.done));
  const cycle  = S.tasks.filter(t => t.cycleCheck && isCycleActiveOnDate(t, today));

  D.activeCount.textContent = active.filter(t => !t.done).length;
  D.cycleCount.textContent  = cycle.length;

  const taskHTML = t => {
    const target  = t.focusMins || 0;
    const actual  = t.actualMins || 0;
    const pct     = target ? Math.min(100, Math.round(actual / target * 100)) : 0;
    let cycleBadge = "";
    if (t.cycleCheck) {
      const end = getTaskCycleEnd(t);
      const remainDays = end ? Math.max(0, Math.ceil((parseLocalDateInput(end) - new Date()) / DAY_MS)) : null;
      const endLabel = end ? `至 ${end}` : "持续中";
      const modeLabel = t.cycleMode === "days" && t.cycleDays ? `${t.cycleDays}天循环` : "日历循环";
      cycleBadge = `<span class="task-cycle-badge">${modeLabel} · ${endLabel}${remainDays !== null ? ` · 剩${remainDays}天` : ""}</span>`;
    }
    return `
      <div class="task-card ${t.done ? "done" : ""}" data-id="${t.id}">
        <button class="task-check ${t.done ? "checked" : ""}" data-toggle="${t.id}" type="button"></button>
        <div class="task-body">
          <div class="task-name ${t.done ? "done-text" : ""}">${esc(t.title)}</div>
          <div class="task-meta">
            ${t.tag ? `<span class="task-tag-badge">${esc(t.tag)}</span>` : ""}
            ${cycleBadge}
            ${actual ? `<span class="task-mins">⏱ ${actual}分钟` + (target ? ` / ${target}分钟` : "") + "</span>" : (target ? `<span class="task-mins">目标 ${target}分钟</span>` : "")}
          </div>
          ${target ? `<div class="task-progress"><div class="task-progress-fill" style="width:${pct}%"></div></div>` : ""}
        </div>
        <div class="task-actions-btn">
          ${!t.done ? `<button class="task-act focus-act" data-focus="${t.id}" title="开始专注" type="button">▷</button>` : ""}
          ${!t.done && !t.cycleCheck ? `<button class="task-act carry-act" data-carry="${t.id}" title="转移到次日" type="button">↷</button>` : ""}
          <button class="task-act del-act" data-delete="${t.id}" title="删除" type="button">✕</button>
        </div>
      </div>`;
  };

  D.activeTasks.innerHTML = active.length
    ? active.map(taskHTML).join("")
    : `<div class="tasks-empty">还没有任务，添加一件今天要做的事吧 ✦</div>`;

  D.cycleTasks.innerHTML = cycle.length ? cycle.map(taskHTML).join("") : `<div class="tasks-empty">没有循环任务</div>`;

  // Memos
  D.memoList.innerHTML = S.memos.length
    ? S.memos.map(m => `
        <div class="memo-item">
          <div class="memo-body">
            <span class="memo-text">${esc(m.text)}</span>
            <span class="memo-time">${formatDisplayTime(m.createdAt)}</span>
          </div>
          <button class="memo-del" data-del-memo="${m.id}" type="button">×</button>
        </div>`).join("")
    : `<p class="muted small">暂无备忘</p>`;

}

function renderCalendar() {
  const monthBase = getCalendarMonthBase();
  const selectedDate = getSelectedCalendarDate();
  const today = new Date();
  const monthLabel = `${monthBase.getFullYear()}年${monthBase.getMonth() + 1}月`;
  const todayLabel = formatDateFull(today);
  if (D.calendarMonthLabel) D.calendarMonthLabel.textContent = monthLabel;
  if (D.sidebarCalendarMonth) D.sidebarCalendarMonth.textContent = monthLabel;
  if (D.calendarTodayLabel) D.calendarTodayLabel.textContent = todayLabel;
  if (D.calendarAgendaDate) D.calendarAgendaDate.textContent = selectedDate;

  const gridDays = getCalendarGridDays(monthBase);
  const gridHTML = chunk(gridDays, 7).map(week => renderCalendarWeek(week, monthBase, selectedDate, today)).join("");
  if (D.calendarGrid) D.calendarGrid.innerHTML = gridHTML;

  if (D.sidebarCalendarGrid) {
    const sidebarDays = gridDays.slice(0, 35);
    D.sidebarCalendarGrid.innerHTML = sidebarDays.map(dateStr => `
      <button class="sidebar-calendar-day ${dateStr === localDate(today) ? "today" : ""} ${dateStr === selectedDate ? "selected" : ""}" data-calendar-day="${dateStr}" type="button">
        ${parseLocalDateInput(dateStr).getDate()}
      </button>`).join("");
  }

  cacheCalendarCellMetrics();

  if (!D.calendarAgendaList) {
    syncCalendarEditorDate();
    syncCalendarSelectionUI();
    return;
  }

  const agenda = getCalendarEventsForDate(selectedDate);
  D.calendarAgendaList.innerHTML = agenda.length
    ? agenda.map(event => `
        <button class="calendar-agenda-item ${event.id === D.calendarEventId?.value ? "selected" : ""}" data-calendar-event="${event.id}" draggable="true" type="button">
          <span class="calendar-agenda-color" style="background:${escAttr(event.color || "#c85c2e")}"></span>
          <div class="calendar-agenda-main">
            <strong>${esc(event.title)}</strong>
            <span class="muted small">${formatEventDateRange(event)} · ${formatEventTimeRange(event)}${event.notes ? ` · ${esc(event.notes)}` : ""}</span>
          </div>
        </button>`).join("")
    : `<p class="muted small">还没有安排</p>`;

  syncCalendarEditorDate();
  syncCalendarSelectionUI();
}

function handleCalendarGridClick(e) {
  if (e.target.closest(".calendar-event-chip") || e.target.closest(".calendar-resize-handle")) return;
  const day = e.target.closest("[data-calendar-day]");
  if (!day || e.detail > 1) return;
  setSelectedCalendarDate(day.dataset.calendarDay, { render: false });
}

function handleCalendarGridDoubleClick(e) {
  const chip = e.target.closest("[data-calendar-event]");
  if (chip) {
    const event = S.calendarEvents.find(entry => entry.id === chip.dataset.calendarEvent);
    if (!event) return;
    populateCalendarEditor(event);
    openCalendarEditor("edit");
    return;
  }
  const day = e.target.closest("[data-calendar-day]");
  if (!day) return;
  setSelectedCalendarDate(day.dataset.calendarDay, { render: false });
  clearCalendarEditor(true, { render: false });
  openCalendarEditor("create");
}

function handleCalendarAgendaClick(e) {
  const item = e.target.closest("[data-calendar-event]");
  if (!item) return;
  const event = S.calendarEvents.find(entry => entry.id === item.dataset.calendarEvent);
  if (!event) return;
  S.calendarSelectedDate = event.startDate || event.date;
  S.calendarDate = event.startDate || event.date;
  persist();
  if (shouldRender) renderCalendar();
}

function handleCalendarAgendaDoubleClick(e) {
  const item = e.target.closest("[data-calendar-event]");
  if (!item) return;
  const event = S.calendarEvents.find(entry => entry.id === item.dataset.calendarEvent);
  if (!event) return;
  populateCalendarEditor(event);
  openCalendarEditor("edit");
}

function getCalendarMonthBase() {
  const base = S.calendarDate ? parseLocalDateInput(S.calendarDate) : new Date();
  return new Date(base.getFullYear(), base.getMonth(), 1);
}

function getSelectedCalendarDate() {
  return S.calendarSelectedDate || localDate(new Date());
}

function setSelectedCalendarDate(dateStr, options = {}) {
  const shouldRender = options.render !== false;
  S.calendarSelectedDate = dateStr;
  S.calendarDate = dateStr;
  persist();
  if (D.calendarAgendaDate) D.calendarAgendaDate.textContent = dateStr;
  if (shouldRender) renderCalendar();
  else syncCalendarSelectionUI();
}

function shiftCalendarMonth(offset) {
  const base = getCalendarMonthBase();
  const next = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  S.calendarDate = localDate(next);
  if (!S.calendarSelectedDate || !S.calendarSelectedDate.startsWith(`${next.getFullYear()}-${pad(next.getMonth() + 1)}`)) {
    S.calendarSelectedDate = localDate(next);
  }
  persist();
  renderCalendar();
}

function focusCalendarToday() {
  const today = localDate(new Date());
  S.calendarDate = today;
  S.calendarSelectedDate = today;
  persist();
  renderCalendar();
}

function getCalendarGridDays(monthBase) {
  const first = new Date(monthBase.getFullYear(), monthBase.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return localDate(day);
  });
}

function getCalendarEventsForDate(dateStr) {
  return S.calendarEvents
    .filter(event => eventSpansDate(event, dateStr))
    .sort((a, b) => `${a.startDate || a.date || ""}${a.startTime || ""}${a.title}`.localeCompare(`${b.startDate || b.date || ""}${b.startTime || ""}${b.title}`));
}

function syncCalendarSelectionUI() {
  const selectedDate = getSelectedCalendarDate();
  D.calendarGrid?.querySelectorAll("[data-calendar-day]").forEach(cell => {
    cell.classList.toggle("selected", cell.dataset.calendarDay === selectedDate);
  });
}

function syncCalendarEditorDate() {
  if (!D.calendarEventDate) return;
  if (!D.calendarEventDate.value) D.calendarEventDate.value = getSelectedCalendarDate();
  if (D.calendarEventEndDate && !D.calendarEventEndDate.value) D.calendarEventEndDate.value = D.calendarEventDate.value;
}

function clearCalendarEditor(useSelectedDate = false, options = {}) {
  const shouldRender = options.render !== false;
  if (!D.calendarEventId) return;
  D.calendarEventId.value = "";
  D.calendarEventTitle.value = "";
  D.calendarEventDate.value = useSelectedDate ? getSelectedCalendarDate() : "";
  D.calendarEventEndDate.value = useSelectedDate ? getSelectedCalendarDate() : "";
  D.calendarEventColor.value = "#c85c2e";
  D.calendarEventStart.value = "";
  D.calendarEventEnd.value = "";
  D.calendarEventNotes.value = "";
  if (D.calendarEditorTitle) D.calendarEditorTitle.textContent = "添加事项";
  renderCalendar();
}

function populateCalendarEditor(event) {
  D.calendarEventId.value = event.id;
  D.calendarEventTitle.value = event.title || "";
  D.calendarEventDate.value = event.startDate || event.date || getSelectedCalendarDate();
  D.calendarEventEndDate.value = event.endDate || event.startDate || event.date || getSelectedCalendarDate();
  D.calendarEventColor.value = event.color || "#c85c2e";
  D.calendarEventStart.value = event.startTime || "";
  D.calendarEventEnd.value = event.endTime || "";
  D.calendarEventNotes.value = event.notes || "";
  if (D.calendarEditorTitle) D.calendarEditorTitle.textContent = "编辑事项";
  S.calendarSelectedDate = event.startDate || event.date;
  S.calendarDate = event.startDate || event.date;
  persist();
  renderCalendar();
}

function saveCalendarEvent() {
  const title = D.calendarEventTitle.value.trim();
  if (!title) {
    D.calendarEventTitle.focus();
    return;
  }
  const startDate = D.calendarEventDate.value || getSelectedCalendarDate();
  const endDate = (D.calendarEventEndDate.value || startDate) < startDate ? startDate : (D.calendarEventEndDate.value || startDate);
  const now = new Date().toISOString();
  const payload = {
    id: D.calendarEventId.value || crypto.randomUUID(),
    title,
    date: startDate,
    startDate,
    endDate,
    startTime: D.calendarEventStart.value || "",
    endTime: D.calendarEventEnd.value || "",
    notes: D.calendarEventNotes.value.trim(),
    color: D.calendarEventColor.value || "#c85c2e",
    createdAt: now,
    updatedAt: now,
  };
  const existingIndex = S.calendarEvents.findIndex(event => event.id === payload.id);
  if (existingIndex >= 0) {
    payload.createdAt = S.calendarEvents[existingIndex].createdAt || now;
    S.calendarEvents.splice(existingIndex, 1, payload);
  } else {
    S.calendarEvents.push(payload);
  }
  S.calendarSelectedDate = startDate;
  S.calendarDate = startDate;
  D.calendarEventId.value = payload.id;
  persist();
  closeCalendarEditor(false);
  renderCalendar();
}

function deleteCalendarEvent() {
  const id = D.calendarEventId.value;
  if (!id) return;
  S.calendarEvents = S.calendarEvents.filter(event => event.id !== id);
  persist();
  closeCalendarEditor();
  clearCalendarEditor(true);
}

function formatEventTimeRange(event) {
  if (event.startTime && event.endTime) return `${event.startTime} - ${event.endTime}`;
  if (event.startTime) return `${event.startTime} 开始`;
  if (event.endTime) return `截至 ${event.endTime}`;
  return "全天";
}

function renderCalendarWeek(week, monthBase, selectedDate, today) {
  const monthKey = `${monthBase.getFullYear()}-${pad(monthBase.getMonth() + 1)}`;
  const lanes = buildCalendarWeekLanes(week);
  const eventStackHeight = Math.max(44, lanes.length * 30 + 10);
  const dayCells = week.map(dateStr => {
    const isToday = dateStr === localDate(today);
    const isSelected = dateStr === selectedDate;
    const isOutside = !dateStr.startsWith(monthKey);
    return `
      <button class="calendar-cell ${isToday ? "today" : ""} ${isSelected ? "selected" : ""} ${isOutside ? "outside" : ""}" data-calendar-day="${dateStr}" type="button">
        <span class="calendar-cell-date">${parseLocalDateInput(dateStr).getDate()}</span>
      </button>`;
  }).join("");
  const bars = lanes.map((lane, laneIndex) => lane.map(segment => {
    const event = segment.event;
    return `
      <button
        class="calendar-event-chip ${segment.startsWeek ? "starts" : "middle"} ${segment.endsWeek ? "ends" : "middle-end"} ${event.id === D.calendarEventId?.value ? "selected" : ""}"
        data-calendar-event="${event.id}"
        data-week-start="${week[0]}"
        data-week-end="${week[week.length - 1]}"
        data-start-col="${segment.startCol}"
        data-end-col="${segment.endCol}"
        data-event-start="${segment.event.startDate}"
        data-event-end="${segment.event.endDate}"
        draggable="true"
        style="grid-column:${segment.startCol} / ${segment.endCol + 1}; grid-row:${laneIndex + 1}; --event-color:${escAttr(event.color || "#c85c2e")}"
        title="${escAttr(formatCalendarEventTooltip(event))}"
        type="button">
        ${segment.startsWeek ? `<span class="calendar-resize-handle start" data-resize-event="${event.id}" data-resize-edge="start"></span>` : ""}
        <span class="calendar-event-chip-label">${esc(formatCalendarEventLabel(event, segment.startsWeek))}</span>
        ${segment.endsWeek ? `<span class="calendar-resize-handle end" data-resize-event="${event.id}" data-resize-edge="end"></span>` : ""}
      </button>`;
  }).join("")).join("");
  return `
    <div class="calendar-week-row" style="--event-stack-height:${eventStackHeight}px">
      <div class="calendar-week-cells">${dayCells}</div>
      <div class="calendar-week-events" style="--lane-count:${Math.max(1, lanes.length)}">${bars}</div>
    </div>`;
}

function buildCalendarWeekLanes(week) {
  const weekStart = week[0];
  const weekEnd = week[week.length - 1];
  const events = S.calendarEvents
    .filter(event => !(getEventEndDate(event) < weekStart || getEventStartDate(event) > weekEnd))
    .sort((a, b) => getEventStartDate(a).localeCompare(getEventStartDate(b)) || getEventEndDate(a).localeCompare(getEventEndDate(b)) || a.title.localeCompare(b.title));
  const lanes = [];
  events.forEach(event => {
    const start = Math.max(0, diffDays(weekStart, getEventStartDate(event)));
    const end = Math.min(6, diffDays(weekStart, getEventEndDate(event)));
    const segment = {
      event,
      startCol: start + 1,
      endCol: end + 1,
      startsWeek: getEventStartDate(event) >= weekStart,
      endsWeek: getEventEndDate(event) <= weekEnd,
    };
    let laneIndex = lanes.findIndex(lane => lane.every(item => item.endCol < segment.startCol || item.startCol > segment.endCol));
    if (laneIndex === -1) {
      laneIndex = lanes.length;
      lanes.push([]);
    }
    lanes[laneIndex].push(segment);
  });
  return lanes;
}

function eventSpansDate(event, dateStr) {
  return getEventStartDate(event) <= dateStr && getEventEndDate(event) >= dateStr;
}

function getEventStartDate(event) {
  return event.startDate || event.date;
}

function getEventEndDate(event) {
  return event.endDate || event.startDate || event.date;
}

function formatEventDateRange(event) {
  const start = getEventStartDate(event);
  const end = getEventEndDate(event);
  return start === end ? start : `${start} 至 ${end}`;
}

function formatCalendarEventLabel(event, includeTime = true) {
  const title = event.title || "未命名任务";
  if (!includeTime || !event.startTime) return title;
  return `${event.startTime} ${title}`;
}

function formatCalendarEventTooltip(event) {
  const parts = [event.title || "未命名任务", formatEventDateRange(event), formatEventTimeRange(event)];
  if (event.notes) parts.push(event.notes);
  return parts.filter(Boolean).join(" · ");
}

function handleCalendarEventDragStart(e) {
  const item = e.target.closest("[data-calendar-event]");
  if (!item || e.target.closest(".calendar-resize-handle")) return;
  const event = S.calendarEvents.find(entry => entry.id === item.dataset.calendarEvent);
  if (!event) return;
  calendarDrag = {
    eventId: item.dataset.calendarEvent,
    fromDate: getEventStartDate(event),
    span: diffDays(getEventStartDate(event), getEventEndDate(event)),
  };
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", item.dataset.calendarEvent);
  }
}

function handleCalendarGridDragOver(e) {
  if (!calendarDrag) return;
  const day = getCalendarDateFromPointer(e.clientX, e.clientY);
  if (!day) return;
  e.preventDefault();
  updateCalendarMovePreview(day);
}

function handleCalendarGridDrop(e) {
  if (!calendarDrag) return;
  const day = getCalendarDateFromPointer(e.clientX, e.clientY) || calendarPreviewDates[0];
  if (!day) return;
  e.preventDefault();
  moveCalendarEventToDate(calendarDrag.eventId, day);
  clearCalendarPreview();
  calendarDrag = null;
}

function moveCalendarEventToDate(eventId, targetDate) {
  const event = S.calendarEvents.find(entry => entry.id === eventId);
  if (!event) return;
  const oldStart = getEventStartDate(event);
  const oldEnd = getEventEndDate(event);
  const span = diffDays(oldStart, oldEnd);
  event.startDate = targetDate;
  event.date = targetDate;
  event.endDate = addDays(targetDate, span);
  event.updatedAt = new Date().toISOString();
  S.calendarSelectedDate = targetDate;
  S.calendarDate = targetDate;
  persist();
  renderCalendar();
}

function handleCalendarResizeStart(e) {
  const handle = e.target.closest("[data-resize-event]");
  if (!handle) return;
  const chip = handle.closest("[data-calendar-event]");
  const event = S.calendarEvents.find(entry => entry.id === handle.dataset.resizeEvent);
  if (!chip || !event) return;
  clearCalendarPreview();
  calendarResize = {
    eventId: handle.dataset.resizeEvent,
    edge: handle.dataset.resizeEdge,
    weekStart: chip.dataset.weekStart,
    weekEnd: chip.dataset.weekEnd,
    previewEl: chip,
    originalStart: getEventStartDate(event),
    originalEnd: getEventEndDate(event),
    currentDate: handle.dataset.resizeEdge === "start" ? getEventStartDate(event) : getEventEndDate(event),
  };
  updateCalendarResizePreview(calendarResize, calendarResize.currentDate);
  document.body.style.cursor = "ew-resize";
  e.preventDefault();
}

function handleCalendarResizeMove(e) {
  if (!calendarResize) return;
  const day = getCalendarDateFromPointer(e.clientX, e.clientY);
  if (!day) return;
  const nextDate = clampResizeDate(calendarResize, day);
  if (!nextDate || nextDate === calendarResize.currentDate) return;
  calendarResize.currentDate = nextDate;
  updateCalendarResizePreview(calendarResize, nextDate);
}

function handleCalendarResizeEnd(e) {
  if (!calendarResize) return;
  document.body.style.cursor = "";
  const day = getCalendarDateFromPointer(e.clientX, e.clientY);
  const targetDate = day
    ? clampResizeDate(calendarResize, day)
    : calendarResize.currentDate;
  if (targetDate) {
    resizeCalendarEventToDate(calendarResize.eventId, calendarResize.edge, targetDate);
  } else {
    clearCalendarPreview();
    renderCalendar();
  }
  calendarResize = null;
}

function resizeCalendarEventToDate(eventId, edge, targetDate) {
  const event = S.calendarEvents.find(entry => entry.id === eventId);
  if (!event) return;
  const currentStart = getEventStartDate(event);
  const currentEnd = getEventEndDate(event);
  if (edge === "start") {
    event.startDate = targetDate <= currentEnd ? targetDate : currentEnd;
    event.date = event.startDate;
  } else {
    event.endDate = targetDate < currentStart ? currentStart : targetDate;
  }
  if (getEventEndDate(event) < getEventStartDate(event)) event.endDate = getEventStartDate(event);
  event.updatedAt = new Date().toISOString();
  S.calendarSelectedDate = getEventStartDate(event);
  S.calendarDate = getEventStartDate(event);
  persist();
  renderCalendar();
}

function clampResizeDate(resizeState, targetDate) {
  if (!targetDate) return null;
  let clamped = targetDate;
  if (resizeState.edge === "start" && clamped > resizeState.originalEnd) clamped = resizeState.originalEnd;
  if (resizeState.edge === "end" && clamped < resizeState.originalStart) clamped = resizeState.originalStart;
  return clamped;
}

function cacheCalendarCellMetrics() {
  const grid = D.calendarGrid;
  if (!grid) {
    calendarCellMetrics = [];
    calendarGridBounds = null;
    return;
  }
  calendarGridBounds = grid.getBoundingClientRect();
  calendarCellMetrics = [...grid.querySelectorAll("[data-calendar-day]")].map((cell, index) => {
    const rect = cell.getBoundingClientRect();
    return {
      index,
      date: cell.dataset.calendarDay,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
    };
  });
}

function getCalendarDateFromPointer(clientX, clientY) {
  if (!calendarCellMetrics.length || !calendarGridBounds) cacheCalendarCellMetrics();
  if (!calendarCellMetrics.length || !calendarGridBounds) return null;
  if (
    clientX < calendarGridBounds.left ||
    clientX > calendarGridBounds.right ||
    clientY < calendarGridBounds.top ||
    clientY > calendarGridBounds.bottom
  ) return null;
  const directHit = calendarCellMetrics.find(cell =>
    clientX >= cell.left && clientX <= cell.right &&
    clientY >= cell.top && clientY <= cell.bottom
  );
  if (directHit) return directHit.date;
  const clampedX = clamp(clientX, calendarGridBounds.left, calendarGridBounds.right);
  const clampedY = clamp(clientY, calendarGridBounds.top, calendarGridBounds.bottom);
  let closest = null;
  let closestScore = Infinity;
  calendarCellMetrics.forEach(cell => {
    const dx = clampedX - cell.centerX;
    const dy = clampedY - cell.centerY;
    const score = dx * dx + dy * dy;
    if (score < closestScore) {
      closestScore = score;
      closest = cell;
    }
  });
  return closest?.date || null;
}

function updateCalendarMovePreview(targetDate) {
  if (!calendarDrag || !targetDate) return;
  const dates = Array.from({ length: (calendarDrag.span || 0) + 1 }, (_, index) => addDays(targetDate, index));
  if (dates.length === calendarPreviewDates.length && dates.every((date, index) => date === calendarPreviewDates[index])) return;
  clearCalendarPreview();
  calendarPreviewDates = dates;
  dates.forEach(date => {
    const cell = D.calendarGrid?.querySelector(`[data-calendar-day="${date}"]`);
    cell?.classList.add("drag-preview");
  });
}

function clearCalendarPreview() {
  if (!calendarPreviewDates.length) return;
  calendarPreviewDates.forEach(date => {
    const cell = D.calendarGrid?.querySelector(`[data-calendar-day="${date}"]`);
    cell?.classList.remove("drag-preview");
  });
  calendarPreviewDates = [];
}

function updateCalendarResizePreview(resizeState, targetDate) {
  const chip = resizeState.previewEl;
  if (!chip) return;
  const startDate = resizeState.edge === "start" ? targetDate : resizeState.originalStart;
  const endDate = resizeState.edge === "end" ? targetDate : resizeState.originalEnd;
  const previewStart = startDate <= endDate ? startDate : endDate;
  const previewEnd = endDate >= startDate ? endDate : startDate;
  const previewDates = [];
  for (let date = previewStart; date <= previewEnd; date = addDays(date, 1)) previewDates.push(date);
  clearCalendarPreview();
  calendarPreviewDates = previewDates;
  previewDates.forEach(date => {
    const cell = D.calendarGrid?.querySelector(`[data-calendar-day="${date}"]`);
    cell?.classList.add("drag-preview");
  });
  const weekStart = resizeState.weekStart;
  const weekEnd = resizeState.weekEnd;
  const startCol = Math.max(1, diffDays(weekStart, startDate) + 1);
  const endCol = Math.min(7, diffDays(weekStart, endDate <= weekEnd ? endDate : weekEnd) + 1);
  chip.style.gridColumn = `${startCol} / ${endCol + 1}`;
  chip.dataset.startCol = String(startCol);
  chip.dataset.endCol = String(endCol);
}

function openCalendarEditor(mode = "create") {
  if (D.calendarEditorTitle) D.calendarEditorTitle.textContent = mode === "edit" ? "编辑事项" : "添加事项";
  D.calendarEditorOverlay?.classList.remove("hidden");
  setTimeout(() => D.calendarEventTitle?.focus(), 10);
}

function closeCalendarEditor(reset = true) {
  D.calendarEditorOverlay?.classList.add("hidden");
  if (reset) clearCalendarEditor(true);
}

function renderNotebook() {
  const viewDate = getCurrentNotebookDate();
  D.notebookDate.value = viewDate;
  const noteItems = getNotebookItemsForDate(viewDate);
  D.notebookCount.textContent = `${noteItems.filter(n => n.status === "pending").length} 条待处理`;
  D.notebookReviewDate.textContent = `${viewDate} 的复盘`;
  D.notebookReviewInput.value = getNotebookReview(viewDate)?.text || "";
  syncNotebookCycleInputs();
  D.notebookList.innerHTML = noteItems.length
    ? noteItems.map((item, index) => {
      const cycleLabel = item.cycleCheck
        ? `<span class="notebook-chip">${item.cycleDays || 0}天循环 · 至 ${esc(item.cycleEnd || item.date)}</span>`
        : "";
      return `
        <div class="notebook-item ${item.status === "done" ? "done" : ""} ${item.selected ? "selected" : ""}" data-note-id="${item.id}" draggable="true">
          <span class="notebook-index">${index + 1}.</span>
          <div class="notebook-main">
            <span class="notebook-text">${esc(item.text)}</span>
            <div class="notebook-meta">
              ${cycleLabel}
              ${item.taskId ? `<span class="notebook-chip">已关联专注</span>` : ""}
            </div>
          </div>
          ${item.status !== "done" ? `<button class="ghost-btn xs notebook-focus-btn" data-note-focus="${item.id}" type="button">开始专注</button>` : ""}
        </div>`;
    }).join("")
    : `<p class="muted small">这个日期还没有记事内容</p>`;
}

// ── Insights ───────────────────────────────────────────────────
function renderInsights() {
  const today   = localDate(new Date());
  const weekAgo = localDate(new Date(Date.now() - 6 * DAY_MS));
  D.iToday.innerHTML  = `${sumMins(S.sessions.filter(s => s.date === today))}<small>分钟</small>`;
  D.iWeek.innerHTML   = `${sumMins(S.sessions.filter(s => s.date >= weekAgo))}<small>分钟</small>`;
  D.iCount.innerHTML  = `${S.sessions.length}<small>次</small>`;
  D.iStreak.innerHTML = `${getStreak()}<small>天</small>`;
  drawPie();
  drawBar();
  renderTopMusic();
  renderSessions();
}

// ── Mini ───────────────────────────────────────────────────────
function renderMini() {
  D.miniTime.textContent      = fmt(S.timer.remaining);
  D.miniTask.textContent      = getSelectedTask()?.title ?? "未选择任务";
  D.miniStartPause.textContent = S.timer.running ? "⏸" : "▷";
}

// ── History ────────────────────────────────────────────────────
function renderHistory(dateStr) {
  if (!dateStr) { D.historyContent.innerHTML = `<p class="muted small" style="padding:16px">请选择日期</p>`; return; }

  const daySessions = mergeSessionsByTask(S.sessions.filter(s => s.date === dateStr));
  const dayTasks = mergeHistoryTasksForDate(dateStr);

  if (!daySessions.length && !dayTasks.length) {
    D.historyContent.innerHTML = `<div class="card" style="padding:28px;text-align:center"><p class="muted">${dateStr === localDate(new Date()) ? "今天还没有记录，去专注吧！" : "这天没有记录"}</p></div>`;
    return;
  }

  const totalMins = sumMins(daySessions);
  D.historyContent.innerHTML = `
    <div class="card history-day-card">
      <div class="hd-date">${dateStr} · 共专注 ${totalMins} 分钟</div>
      ${daySessions.length ? `
        <div class="hd-sessions">
          <div class="hd-sess-title">专注记录</div>
          ${daySessions.map(s => `
            <div class="top-music-item">
              <div><div class="song-name">${esc(s.title)}</div>${s.song ? `<div class="song-meta">🎵 ${esc(s.song)}</div>` : ""}</div>
              <div class="song-meta">${s.mins}分钟</div>
            </div>`).join("")}
        </div>` : ""}
      ${dayTasks.length ? `
        <div class="hd-sessions">
          <div class="hd-sess-title">完成内容</div>
          ${dayTasks.map(t => `
            <div class="hd-task">
              <span class="hd-check">✓</span>
              <span class="hd-task-name">${esc(t.title)}</span>
              <span class="hd-task-meta">${t.mins ? `${t.mins}分钟` : "已完成"}</span>
            </div>`).join("")}
        </div>` : ""}
    </div>`;
}

// ═══════════════════════════════════════════════════════════════
// TIMER LOGIC
// ═══════════════════════════════════════════════════════════════
function handleStartPause() {
  S.timer.running ? pause() : start();
  persist(); render();
}

function start() {
  if (!S.selectedTaskId) {
    const first = S.tasks.find(t => !t.done);
    if (first) S.selectedTaskId = first.id;
  }
  // Auto-set duration from task's focusMins if not yet running
  const task = getSelectedTask();
  if (task?.focusMins && S.timer.remaining === S.timer.duration && S.timer.duration === 25*60) {
    // only auto-set if still on default 25min
    setDuration(task.focusMins * 60);
    return;
  }
  const resuming = S.timer.remaining < S.timer.duration;
  if (!resuming) {
    S.focusRunId = (S.focusRunId || 0) + 1;
    S.timer.runId = S.focusRunId;
  }
  armPreparedMusicForRun();
  S.timer.running     = true;
  S.timer.startedAt   = Date.now();
  S.timer.startedFrom = S.timer.remaining;
}

function pause() {
  const elapsed     = Math.floor((Date.now() - S.timer.startedAt) / 1000);
  S.timer.remaining = Math.max(0, S.timer.startedFrom - elapsed);
  S.timer.running   = false;
  S.timer.startedAt = null;
  S.timer.startedFrom = S.timer.remaining;
}

function handleReset() {
  S.timer.running     = false;
  S.timer.startedAt   = null;
  S.timer.remaining   = S.timer.duration;
  S.timer.startedFrom = S.timer.duration;
  clearMusicSelection();
  persist(); render();
}

function setDuration(secs) {
  S.timer = { ...S.timer, running:false, startedAt:null, duration:secs, remaining:secs, startedFrom:secs, runId:S.timer.runId ?? null };
  persist(); render();
}

function applyCustom() {
  const v = parseInt(D.customMin.value, 10);
  if (v >= 1 && v <= 300) { setDuration(v * 60); D.customMin.value = ""; }
}

function completeSession(manual = false) {
  if (S.timer.running) syncTimer();
  if (!canCompleteSession()) return;
  const task    = getSelectedTask();
  const elapsed = S.timer.duration - S.timer.remaining;
  const mins    = Math.max(1, Math.round(elapsed / 60));

  if (task) {
    task.actualMins = (task.actualMins || 0) + mins;
    task.pomCount   = (task.pomCount   || 0) + 1;
    if (manual) {
      task.done = true;
      task.doneDate = localDate(new Date());
      moveTaskToDoneTail(task.id);
      syncNotebookStatusFromTask(task, true);
    }
  }
  const selectedSong = getMusicSongForCurrentRun();
  if (selectedSong) selectedSong.focusMins = (selectedSong.focusMins || 0) + mins;

  S.sessions.push({
    id: crypto.randomUUID(),
    taskId: task?.id ?? null, title: task?.title ?? "自由专注",
    tag: task?.tag ?? "",     mins,
    date: localDate(new Date()), time: new Date().toISOString(),
    song: selectedSong?.name ?? null,
  });

  S.timer.running     = false;
  S.timer.remaining   = S.timer.duration;
  S.timer.startedAt   = null;
  S.timer.startedFrom = S.timer.duration;

  clearMusicSelection();
  persist(); render();

  // Celebrate
  if (!S.celebrateOff) showCelebrate(task, mins);

  if ("Notification" in window && Notification.permission === "granted")
    new Notification("专注完成 🎉", { body: `${mins} 分钟已记录`, silent:true });
}

function showCelebrate(task, mins) {
  const enc = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
  D.celebrateEmoji.textContent = ["🎉","✨","🌟","💪","🏆","🔥"][Math.floor(Math.random()*6)];
  D.celebrateTitle.textContent = "专注完成！";
  D.celebrateSub.textContent   = enc;
  D.celebrateStats.innerHTML = `
    <div class="celebrate-stat"><strong>${mins}</strong>分钟</div>
    ${task ? `<div class="celebrate-stat"><strong>${esc(task.title)}</strong></div>` : ""}
    <div class="celebrate-stat"><strong>${S.sessions.length}</strong>次专注</div>`;
  D.celebrateOverlay.classList.remove("hidden");
}

function syncTimer() {
  if (!S.timer.running || !S.timer.startedAt) return;
  const elapsed     = Math.floor((Date.now() - S.timer.startedAt) / 1000);
  S.timer.remaining = Math.max(0, (S.timer.startedFrom ?? S.timer.duration) - elapsed);
}

function startTick() {
  if (tickId) clearInterval(tickId);
  tickId = setInterval(() => {
    if (!S.timer.running) return;
    syncTimer();
    if (S.timer.remaining <= 0) { completeSession(); return; }
    drawTimerRing();
    D.timerDigits.textContent = fmt(S.timer.remaining);
    D.miniTime.textContent    = fmt(S.timer.remaining);
    D.miniStartPause.textContent = "⏸";
  }, 1000);
}

// ═══════════════════════════════════════════════════════════════
// TASK ACTIONS
// ═══════════════════════════════════════════════════════════════
function addTask() {
  const title = D.taskTitle.value.trim();
  if (!title) { D.taskTitle.focus(); return; }
  const focusMins = parseInt(D.taskFocusMins.value, 10) || 0;
  const cycleCheck = D.taskCycleCheck.checked;
  const cycleMode = cycleCheck ? getCycleMode() : null;
  const cycleStart = !cycleCheck ? null : cycleMode === "days"
    ? (D.taskCycleStartDays.value || localDate(new Date()))
    : (D.taskCycleStart.value || localDate(new Date()));
  const cycleDays = cycleCheck && cycleMode === "days" ? clamp(parseInt(D.taskCycleDays.value, 10) || 0, 0, 365) : null;
  const cycleEnd = cycleCheck
    ? (cycleMode === "days" ? calcCycleEnd(cycleStart, cycleDays) : (D.taskCycleEnd.value || null))
    : null;
  if (cycleCheck && cycleMode === "days" && !cycleDays) { D.taskCycleDays.focus(); return; }
  if (cycleCheck && cycleMode === "range" && cycleEnd && cycleEnd < cycleStart) { D.taskCycleEnd.focus(); return; }

  S.tasks.unshift({
    id: crypto.randomUUID(), title,
    tag: D.taskTag.value.trim(),
    focusMins: focusMins || null,
    cycleCheck, cycleMode, cycleStart, cycleEnd,
    // keep cycleDays/cycleStartDate for backward compat
    cycleDays: cycleDays || null, cycleStartDate: cycleStart,
    done: false, doneDate: null,
    actualMins: 0, pomCount: 0,
    taskDate: localDate(new Date()),
    createdAt: new Date().toISOString(),
  });

  // If user set a focus duration, auto-apply to timer too
  if (focusMins && !S.timer.running) {
    S.timer.duration = focusMins * 60;
    S.timer.remaining = focusMins * 60;
    S.timer.startedFrom = focusMins * 60;
  }

  D.taskTitle.value = ""; D.taskTag.value = ""; D.taskFocusMins.value = "";
  D.taskCycleCheck.checked = false; D.cycleInputs.classList.add("hidden");
  D.taskCycleStart.value = ""; D.taskCycleEnd.value = "";
  D.taskCycleStartDays.value = ""; D.taskCycleDays.value = "";
  D.cycleModeInputs.forEach(input => { input.checked = input.value === "range"; });
  toggleTaskFormDetails(false);
  persist(); render();
}

function handleTaskClick(e) {
  const toggle = e.target.closest("[data-toggle]");
  const del    = e.target.closest("[data-delete]");
  const focus  = e.target.closest("[data-focus]");
  const carry  = e.target.closest("[data-carry]");
  if (toggle) {
    const t = S.tasks.find(x => x.id === toggle.dataset.toggle);
    if (t) {
      t.done = !t.done;
      t.doneDate = t.done ? localDate(new Date()) : null;
      if (t.done) moveTaskToDoneTail(t.id);
      syncNotebookStatusFromTask(t, t.done);
      if (t.done && S.selectedTaskId === t.id) {
        S.selectedTaskId = null;
        clearMusicSelection();
      }
    }
  }
  if (carry) {
    const t = S.tasks.find(x => x.id === carry.dataset.carry);
    if (t && !t.cycleCheck && !t.done) {
      t.taskDate = localDate(new Date(Date.now() + DAY_MS));
      if (S.selectedTaskId === t.id) {
        S.selectedTaskId = null;
        clearMusicSelection();
      }
    }
  }
  if (del) {
    S.tasks = S.tasks.filter(x => x.id !== del.dataset.delete);
    if (S.selectedTaskId === del.dataset.delete) S.selectedTaskId = null;
  }
  if (focus) {
    const nextId = focus.dataset.focus;
    S.selectedTaskId = nextId;
    // Auto-set timer duration from task
    const t = getSelectedTask();
    if (t?.focusMins && !S.timer.running) {
      S.timer.duration = t.focusMins * 60;
      S.timer.remaining = t.focusMins * 60;
      S.timer.startedFrom = t.focusMins * 60;
    }
    S.page = "focus";
  }
  persist(); render();
}

function syncNotebookStatusFromTask(task, done) {
  if (!task?.notebookItemId) return;
  const note = S.notebookItems.find(item => item.id === task.notebookItemId);
  if (!note) return;
  note.status = done ? "done" : "pending";
  note.doneDate = done ? localDate(new Date()) : null;
  note.order = done ? getNotebookTopOrder(note.date) - 1 : getNotebookTopPendingOrder(note.date) - 1;
}

// ═══════════════════════════════════════════════════════════════
// MEMO
// ═══════════════════════════════════════════════════════════════
function addMemo() {
  const text = D.memoInput.value.trim();
  if (!text) return;
  S.memos.unshift({ id: crypto.randomUUID(), text, createdAt: new Date().toISOString() });
  D.memoInput.value = "";
  persist(); render();
}

// ═══════════════════════════════════════════════════════════════
// MUSIC
// ═══════════════════════════════════════════════════════════════
function logSong() {
  const name = D.songInput.value.trim();
  if (!name) return;
  const ex = S.songs.find(s => s.name === name && s.service === S.selectedService);
  const song = ex || { id:crypto.randomUUID(), name, service:S.selectedService, plays:0, focusMins:0 };
  if (!ex) S.songs.push(song);
  selectSongForFocus(song);
  D.songInput.value = "";
  persist(); render();
}

function selectExistingSong(songId) {
  const song = S.songs.find(s => s.id === songId);
  if (!song) return;
  selectSongForFocus(song);
  persist(); render();
}

function getTopSong() {
  return [...S.songs].filter(s => s.service === S.selectedService)
    .sort((a,b) => (b.plays * 2 + b.focusMins / 5) - (a.plays * 2 + a.focusMins / 5))[0] ?? null;
}

function renderTopMusic() {
  const all = [...S.songs].sort((a,b) => b.plays - a.plays).slice(0,8);
  D.topMusicList.innerHTML = all.length
    ? all.map(s => `
        <div class="top-music-item">
          <div><span class="song-name">${esc(s.name)}</span><span class="song-meta"> · ${s.service === "netease" ? "网易云" : "酷狗"}</span></div>
          <div class="song-meta">${s.plays}次 · ${s.focusMins}分钟</div>
        </div>`).join("")
    : `<p class="muted small">还没有记录</p>`;
}

function renderSessions() {
  const list = mergeSessionsByTask(S.sessions).slice(0, 20);
  D.sessionList.innerHTML = list.length
    ? list.map(s => `
        <div class="session-item">
          <div><div class="sess-title">${esc(s.title)}</div>${s.tag ? `<div class="muted small">${esc(s.tag)}</div>` : ""}</div>
          <div class="sess-meta"><div>${s.mins}分钟</div><div>${s.date}</div></div>
        </div>`).join("")
    : `<p class="muted small">还没有记录</p>`;
}

// ═══════════════════════════════════════════════════════════════
// PIE CHART — High-DPI Canvas
// ═══════════════════════════════════════════════════════════════
function drawPie() {
  const canvas = D.pieCanvas;
  if (!pieCtx || !canvas) return;
  const dpr   = window.devicePixelRatio || 1;
  const size  = 220;  // matches CSS width/height
  canvas.width  = size * dpr;
  canvas.height = size * dpr;
  const ctx = pieCtx;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cx = size / 2, cy = size / 2;
  const R = size * 0.44, innerR = size * 0.26;
  const isDark = document.documentElement.dataset.theme === "dark";
  const textColor  = isDark ? "#ede4d6" : "#1a1108";
  const mutedColor = isDark ? "#8a7560" : "#9a7f68";
  const bgColor    = isDark ? "#2c2822" : "#f0ebe2";

  pieSlices = [];
  ctx.clearRect(0, 0, size, size);

  const today = localDate(new Date());
  // Only show today's focus content distribution
  const groups = {};
  S.sessions.filter(s => s.date === today).forEach(s => {
    const k = s.tag || s.title;
    groups[k] = (groups[k] || 0) + s.mins;
  });
  const entries = Object.entries(groups).sort((a,b) => b[1]-a[1]);
  const total   = entries.reduce((a,e) => a + e[1], 0);

  if (!total) {
    // Empty state ring
    ctx.beginPath(); ctx.arc(cx,cy,R,0,C_2PI);
    ctx.strokeStyle = isDark ? "rgba(255,200,140,0.07)" : "rgba(200,92,46,0.09)";
    ctx.lineWidth = size * 0.055; ctx.stroke();
    ctx.font = `${size*0.075}px DM Sans,sans-serif`;
    ctx.fillStyle = mutedColor; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("完成今日专注后显示", cx, cy);
    D.pieLegend.innerHTML = "";
    return;
  }

  // Draw slices
  let startAngle = -Math.PI / 2;
  entries.forEach((e, i) => {
    const ratio = e[1] / total;
    const sweep = ratio * C_2PI;
    const endAngle = startAngle + sweep;
    const color = PIE_COLORS[i % PIE_COLORS.length];

    // Outer slice
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Thin separator
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,R,startAngle,endAngle); ctx.closePath();
    ctx.strokeStyle = bgColor; ctx.lineWidth = 2; ctx.stroke();

    // Label if slice big enough
    if (ratio > 0.07) {
      const midAngle = startAngle + sweep / 2;
      const labelR = R * 0.68;
      const lx = cx + labelR * Math.cos(midAngle);
      const ly = cy + labelR * Math.sin(midAngle);
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = `600 ${size * 0.054}px DM Sans,sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(`${Math.round(ratio*100)}%`, lx, ly);
      ctx.restore();
    }

    pieSlices.push({ label:e[0], mins:e[1], ratio, start:startAngle, end:endAngle, color });
    startAngle = endAngle;
  });

  // Donut hole
  ctx.beginPath(); ctx.arc(cx, cy, innerR, 0, C_2PI);
  ctx.fillStyle = bgColor; ctx.fill();

  // Center text
  ctx.fillStyle = textColor;
  ctx.font = `400 ${size*0.11}px DM Serif Display,serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(`${total}`, cx, cy - size*0.04);
  ctx.font = `${size*0.065}px DM Sans,sans-serif`;
  ctx.fillStyle = mutedColor;
  ctx.fillText("分钟", cx, cy + size*0.055);

  // Legend
  D.pieLegend.innerHTML = entries.map((e,i) => `
    <div class="legend-item">
      <span class="legend-dot" style="background:${PIE_COLORS[i%PIE_COLORS.length]}"></span>
      <span>${esc(e[0])}</span>
      <span class="legend-pct">${e[1]}分钟 (${Math.round(e[1]/total*100)}%)</span>
    </div>`).join("");
}

// Pie hover
D.pieCanvas.addEventListener("mousemove", e => {
  if (!pieSlices.length) return;
  const rect = D.pieCanvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (220 / rect.width);
  const y = (e.clientY - rect.top)  * (220 / rect.height);
  const size = 220;
  const cx = size/2, cy = size/2;
  const dx = x - cx, dy = y - cy;
  const dist = Math.hypot(dx, dy);
  const innerR = size * 0.26, R = size * 0.44;

  if (dist < innerR || dist > R) { D.pieTooltip.classList.add("hidden"); return; }

  let angle = Math.atan2(dy, dx);
  if (angle < -Math.PI/2) angle += C_2PI;
  const slice = pieSlices.find(s => angle >= s.start && angle < s.end);
  if (!slice) { D.pieTooltip.classList.add("hidden"); return; }

  D.pieTooltip.innerHTML = `<strong>${esc(slice.label)}</strong><br>${slice.mins} 分钟 · ${Math.round(slice.ratio*100)}%`;
  D.pieTooltip.classList.remove("hidden");
  const offX = e.offsetX, offY = e.offsetY;
  const tw = D.pieTooltip.offsetWidth || 160;
  const th = D.pieTooltip.offsetHeight || 56;
  const left = clamp(offX + 14, 8, rect.width - tw - 8);
  const top  = clamp(offY - th / 2, 8, rect.height - th - 8);
  D.pieTooltip.style.left = left + "px";
  D.pieTooltip.style.top  = top  + "px";
  D.pieCanvas.style.cursor = "pointer";
});
D.pieCanvas.addEventListener("mouseleave", () => {
  D.pieTooltip.classList.add("hidden");
  D.pieCanvas.style.cursor = "crosshair";
});

// ═══════════════════════════════════════════════════════════════
// BAR CHART — Canvas
// ═══════════════════════════════════════════════════════════════
function drawBar() {
  const canvas = D.barCanvas;
  if (!barCtx || !canvas) return;
  const dpr  = window.devicePixelRatio || 1;
  const W    = canvas.offsetWidth  || 400;
  const H    = canvas.offsetHeight || 200;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  const ctx = barCtx;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const isDark     = document.documentElement.dataset.theme === "dark";
  const textColor  = isDark ? "#7a6050" : "#9a7f68";
  const barColor   = isDark ? "#e07040" : "#c85c2e";
  const barColorLt = isDark ? "rgba(224,112,64,0.25)" : "rgba(200,92,46,0.18)";
  const gridColor  = isDark ? "rgba(255,200,140,0.05)" : "rgba(55,35,15,0.06)";

  ctx.clearRect(0, 0, W, H);

  const days = Array.from({length:7}, (_,i) => {
    const d    = new Date(Date.now() - (6-i) * DAY_MS);
    const key  = localDate(d);
    const mins = sumMins(S.sessions.filter(s => s.date === key));
    return { label:`${d.getMonth()+1}/${d.getDate()}`, mins, isToday: key === localDate(new Date()) };
  });

  const maxVal = Math.max(...days.map(d => d.mins), 30);
  const pad = 36, padR = 12, padT = 16, padB = 36;
  const chartW = W - pad - padR;
  const chartH = H - padT - padB;
  const barW   = chartW / 7 * 0.5;
  const step   = chartW / 7;

  // Grid lines
  for (let i = 0; i <= 4; i++) {
    const y = padT + chartH - (i/4) * chartH;
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - padR, y);
    ctx.strokeStyle = gridColor; ctx.lineWidth = 1; ctx.stroke();
    if (i > 0) {
      ctx.fillStyle = textColor; ctx.font = `${10 * dpr / dpr}px DM Sans,sans-serif`;
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillText(Math.round(maxVal * i/4), pad - 5, y);
    }
  }

  // Bars
  days.forEach((d, i) => {
    const x   = pad + step * i + step/2 - barW/2;
    const barH = chartH * (d.mins / maxVal);
    const y   = padT + chartH - barH;

    // Background bar
    ctx.fillStyle = d.isToday ? barColorLt : "rgba(200,92,46,0.07)";
    ctx.beginPath();
    ctx.roundRect(x, padT, barW, chartH, 4);
    ctx.fill();

    // Filled bar
    if (d.mins > 0) {
      const grad = ctx.createLinearGradient(0, y, 0, padT + chartH);
      grad.addColorStop(0, barColor);
      grad.addColorStop(1, d.isToday ? barColor : barColorLt);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
      ctx.fill();

      // Value label
      if (barH > 20) {
        ctx.fillStyle = isDark ? "rgba(255,255,255,0.92)" : "#1a1108";
        ctx.font = `600 ${9}px DM Sans,sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "bottom";
        ctx.fillText(d.mins, x + barW/2, y - 2);
      } else {
        ctx.fillStyle = barColor;
        ctx.font = `600 ${9}px DM Sans,sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "bottom";
        ctx.fillText(d.mins, x + barW/2, y - 2);
      }
    }

    // X-axis label
    ctx.fillStyle = d.isToday ? barColor : textColor;
    ctx.font = `${d.isToday ? "600 " : ""}${10}px DM Sans,sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillText(d.label, x + barW/2, padT + chartH + 7);
  });
}

// ═══════════════════════════════════════════════════════════════
// MINI WIDGET DRAG
// ═══════════════════════════════════════════════════════════════
(function initDrag() {
  const widget = D.miniWidget, handle = $("miniDragHandle");
  let dragging = false, ox = 0, oy = 0;

  function startDrag(cx, cy) {
    dragging = true;
    const r = widget.getBoundingClientRect();
    ox = cx - r.left; oy = cy - r.top;
  }
  function moveDrag(cx, cy) {
    if (!dragging) return;
    const ww = window.innerWidth, wh = window.innerHeight;
    const x = Math.max(0, Math.min(ww - widget.offsetWidth,  cx - ox));
    const y = Math.max(0, Math.min(wh - widget.offsetHeight, cy - oy));
    widget.style.cssText += `;right:auto;bottom:auto;left:${x}px;top:${y}px`;
  }

  handle.addEventListener("mousedown",  e => { startDrag(e.clientX, e.clientY); e.preventDefault(); });
  document.addEventListener("mousemove",e => moveDrag(e.clientX, e.clientY));
  document.addEventListener("mouseup",  () => { dragging = false; });

  handle.addEventListener("touchstart", e => { const t=e.touches[0]; startDrag(t.clientX,t.clientY); }, {passive:true});
  document.addEventListener("touchmove", e => { const t=e.touches[0]; moveDrag(t.clientX,t.clientY); }, {passive:true});
  document.addEventListener("touchend",  () => { dragging = false; });
})();

// ═══════════════════════════════════════════════════════════════
// PERSIST / LOAD
// ═══════════════════════════════════════════════════════════════
function persist() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch(e) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const p = JSON.parse(raw), d = defaultState();
    const today = localDate(new Date());
    return {
      ...d, ...p,
      profile:  { ...d.profile,  ...(p.profile||{}) },
      timer:    { ...d.timer,    ...(p.timer||{}) },
      musicSession: { ...d.musicSession, ...(p.musicSession || {}) },
      appearance: { ...d.appearance, ...(p.appearance || {}) },
      fontScale: p.fontScale ?? legacyFontScale(p.fontSize ?? d.fontSize),
      tasks:    (p.tasks || []).map(task => ({
        ...task,
        taskDate: task.taskDate || task.doneDate || (task.createdAt ? localDate(new Date(task.createdAt)) : (p.lastDate || today)),
      })),
      notebookItems: p.notebookItems || [],
      notebookReviews: p.notebookReviews || [],
      calendarDate: p.calendarDate || today,
      calendarSelectedDate: p.calendarSelectedDate || today,
      calendarEvents: (p.calendarEvents || []).map(event => ({
        ...event,
        date: event.startDate || event.date,
        startDate: event.startDate || event.date,
        endDate: event.endDate || event.startDate || event.date,
        color: normalizeColorValue(event.color, "#c85c2e"),
      })),
      completedEntries: p.completedEntries || [],
      memos:    p.memos    || [],
      sessions: p.sessions || [],
      songs:    p.songs    || [],
    };
  } catch { return defaultState(); }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
function getSelectedTask() { return S.tasks.find(t => t.id === S.selectedTaskId) ?? null; }
function sumMins(arr) { return arr.reduce((a,s) => a + s.mins, 0); }
function hasTimerProgress() { return S.timer.duration - S.timer.remaining > 0; }
function canCompleteSession() { return S.timer.running && hasTimerProgress(); }
function getTaskPlannedDate(task) {
  return task?.taskDate || task?.doneDate || (task?.createdAt ? localDate(new Date(task.createdAt)) : localDate(new Date()));
}
function isCycleActiveOnDate(task, dateStr) {
  const start = task.cycleStart || task.cycleStartDate || null;
  const end = getTaskCycleEnd(task);
  if (!start) return true;
  return dateStr >= start && (!end || dateStr <= end);
}
function isTaskVisibleInPlanner(task, dateStr = localDate(new Date())) {
  if (task.cycleCheck) return isCycleActiveOnDate(task, dateStr);
  return getTaskPlannedDate(task) === dateStr;
}
function calcCycleEnd(start, days) {
  if (!start || !days) return null;
  return localDate(new Date(parseLocalDateInput(start).getTime() + days * DAY_MS));
}
function getTaskCycleEnd(t) {
  return t.cycleEnd || calcCycleEnd(t.cycleStart || t.cycleStartDate, t.cycleDays);
}
function mergeSessionsByTask(sessions) {
  const grouped = new Map();
  [...sessions].reverse().forEach(session => {
    const key = `${session.title}::${session.tag || ""}`;
    if (!grouped.has(key)) {
      grouped.set(key, { ...session });
      return;
    }
    const current = grouped.get(key);
    current.mins += session.mins;
    if (session.time > current.time) {
      current.time = session.time;
      current.date = session.date;
      current.song = session.song;
    }
  });
  return [...grouped.values()].sort((a, b) => String(b.time).localeCompare(String(a.time)));
}
function mergeItemsByTitle(items) {
  const grouped = new Map();
  items.forEach(item => {
    const key = item.title.trim().toLowerCase();
    if (!grouped.has(key)) {
      grouped.set(key, { ...item });
      return;
    }
    const current = grouped.get(key);
    current.mins = (current.mins || 0) + (item.mins || 0);
    current.count = (current.count || 1) + 1;
  });
  return [...grouped.values()];
}
function moveTaskToDoneTail(taskId) {
  const idx = S.tasks.findIndex(t => t.id === taskId);
  if (idx < 0) return;
  const [task] = S.tasks.splice(idx, 1);
  S.tasks.push(task);
}
function selectSongForFocus(song) {
  if (!song) return;
  const attachToRunningFocus = S.timer.running || (!S.timer.running && hasTimerProgress() && S.timer.runId);
  S.musicSession = {
    active: true,
    name: song.name,
    service: song.service,
    taskId: S.selectedTaskId ?? null,
    startedAt: new Date().toISOString(),
    songId: song.id,
    runId: attachToRunningFocus ? (S.timer.runId ?? null) : null,
    prepared: !attachToRunningFocus,
    counted: false,
  };
  if (attachToRunningFocus) countMusicPlayForSession();
}
function armPreparedMusicForRun() {
  if (!S.musicSession.active || !S.musicSession.prepared) return;
  S.musicSession.runId = S.timer.runId ?? null;
  S.musicSession.taskId = S.selectedTaskId ?? null;
  S.musicSession.prepared = false;
  countMusicPlayForSession();
}
function countMusicPlayForSession() {
  if (!S.musicSession.active || S.musicSession.counted) return;
  const song = S.songs.find(item => item.id === S.musicSession.songId);
  if (song) song.plays = (song.plays || 0) + 1;
  S.musicSession.counted = true;
}
function getMusicSongForCurrentRun() {
  if (!S.musicSession.active) return null;
  if (S.musicSession.runId !== (S.timer.runId ?? null)) return null;
  return S.songs.find(song => song.id === S.musicSession.songId) || null;
}
function isSelectedMusicSong(songId) {
  return !!songId && S.musicSession.active && S.musicSession.songId === songId;
}
function getMusicSessionLabel() {
  if (!S.musicSession.active) return "当前没有进行中的音乐";
  if (S.musicSession.prepared) return `已选音乐：${S.musicSession.name}，开始专注后才会计时`;
  if (S.musicSession.runId === (S.timer.runId ?? null)) return `本次专注音乐：${S.musicSession.name}`;
  return "当前没有进行中的音乐";
}
function clearMusicSelection() {
  if (!S.musicSession.active && !D.songInput.value) return;
  S.musicSession = {
    active: false,
    name: "",
    service: S.selectedService,
    taskId: null,
    startedAt: null,
    songId: null,
    runId: null,
    prepared: false,
    counted: false,
  };
  D.songInput.value = "";
}
function getNotebookItemsForDate(dateStr) {
  const selected = new Set(S._selectedNotebookIds || []);
  return S.notebookItems
    .filter(item => item.date === dateStr && item.status !== "moved" && isNotebookItemVisible(item))
    .sort((a, b) => Number(b.status === "done") - Number(a.status === "done") || (a.order ?? 0) - (b.order ?? 0))
    .map(item => ({ ...item, selected: selected.has(item.id) }));
}
function toggleNotebookItem(noteId) {
  const selected = new Set(S._selectedNotebookIds || []);
  if (selected.has(noteId)) selected.delete(noteId);
  else selected.add(noteId);
  S._selectedNotebookIds = [...selected];
  renderNotebook();
}
function saveNotebook() {
  const lines = D.notebookInput.value
    .split(/\r?\n/)
    .map(sanitizeNotebookLine)
    .filter(Boolean);
  const targetDate = getCurrentNotebookDate();
  const selectedIds = new Set(S._selectedNotebookIds || []);
  const selectedItems = S.notebookItems.filter(item => selectedIds.has(item.id) && item.date === targetDate);
  const cycleCheck = D.notebookCycleCheck.checked;
  const cycleStart = cycleCheck ? (D.notebookCycleStart.value || targetDate) : null;
  const cycleDays = cycleCheck ? clamp(parseInt(D.notebookCycleDays.value, 10) || 1, 1, 365) : null;
  const cycleDates = cycleCheck ? getNotebookCycleDates(cycleStart, cycleDays) : [targetDate];
  const cycleEnd = cycleCheck ? cycleDates[cycleDates.length - 1] : null;
  if (!lines.length && !(cycleCheck && selectedItems.length)) return;

  if (cycleCheck && selectedItems.length) {
    selectedItems.forEach(item => {
      const cycleRootId = item.cycleRootId || crypto.randomUUID();
      cycleDates.forEach((dateStr, dateIndex) => {
        if (dateStr === item.date) {
          item.cycleCheck = true;
          item.cycleStart = cycleStart;
          item.cycleDays = cycleDays;
          item.cycleEnd = cycleEnd;
          item.cycleRootId = cycleRootId;
          item.cycleIndex = dateIndex;
          return;
        }
        const exists = S.notebookItems.some(note =>
          note.cycleRootId === cycleRootId && note.date === dateStr && note.text === item.text
        );
        if (exists) return;
        S.notebookItems.push({
          ...item,
          id: crypto.randomUUID(),
          date: dateStr,
          status: "pending",
          doneDate: null,
          order: getNotebookBottomOrder(dateStr) + 1,
          taskId: null,
          cycleCheck: true,
          cycleStart,
          cycleDays,
          cycleEnd,
          cycleRootId,
          cycleIndex: dateIndex,
        });
      });
    });
  }

  lines.forEach((text, index) => {
    const cycleRootId = cycleCheck ? crypto.randomUUID() : null;
    cycleDates.forEach((dateStr, dateIndex) => {
      S.notebookItems.push({
        id: crypto.randomUUID(),
        text,
        date: dateStr,
        status: "pending",
        doneDate: null,
        order: getNotebookBottomOrder(dateStr) + 1,
        taskId: null,
        cycleCheck,
        cycleStart,
        cycleDays,
        cycleEnd,
        cycleRootId,
        cycleIndex: dateIndex,
      });
    });
  });
  D.notebookInput.value = "";
  D.notebookCycleCheck.checked = false;
  D.notebookCycleStart.value = "";
  D.notebookCycleDays.value = "";
  S._selectedNotebookIds = [];
  syncNotebookCycleInputs();
  persist();
  render();
}
function applyNotebookAction(action) {
  const selectedIds = new Set(S._selectedNotebookIds || []);
  if (!selectedIds.size) return;
  const viewDate = getCurrentNotebookDate();
  const tomorrowDate = parseLocalDateInput(viewDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = localDate(tomorrowDate);
  const yesterdayDate = parseLocalDateInput(viewDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = localDate(yesterdayDate);
  S.notebookItems = S.notebookItems.flatMap(item => {
    if (!selectedIds.has(item.id)) return [item];
    if (action === "delete") return [];
    if (action === "tomorrow") return [{ ...item, date: tomorrow, order: Date.now() }];
    if (action === "yesterday") return [{ ...item, date: yesterday, order: Date.now() }];
    const nextDone = item.status !== "done";
    if (item.taskId) {
      const task = S.tasks.find(t => t.id === item.taskId);
      if (task) {
        task.done = nextDone;
        task.doneDate = nextDone ? viewDate : null;
        if (nextDone) moveTaskToDoneTail(task.id);
      }
    }
    return [{
      ...item,
      status: nextDone ? "done" : "pending",
      doneDate: nextDone ? viewDate : null,
      order: nextDone ? getNotebookTopOrder(item.date) - 1 : getNotebookTopPendingOrder(item.date) - 1,
    }];
  });
  S._selectedNotebookIds = [];
  persist();
  render();
}
function syncNotebookCycleInputs() {
  const enabled = D.notebookCycleCheck.checked;
  D.notebookCycleInputs.classList.toggle("hidden", !enabled);
  if (!enabled) return;
  const targetDate = getCurrentNotebookDate();
  if (!D.notebookCycleStart.value) D.notebookCycleStart.value = targetDate;
  if (!D.notebookCycleDays.value) D.notebookCycleDays.value = "7";
}
function startFocusFromNotebook(noteId) {
  const note = S.notebookItems.find(item => item.id === noteId);
  if (!note || note.status === "done") return;
  const task = ensureTaskFromNotebook(note);
  S.selectedTaskId = task.id;
  S.page = "focus";
  persist();
  render();
}
function ensureTaskFromNotebook(note) {
  let task = note.taskId ? S.tasks.find(item => item.id === note.taskId) : null;
  if (!task) {
    task = {
      id: crypto.randomUUID(),
      title: note.text,
      tag: "记事本",
      focusMins: null,
      cycleCheck: !!note.cycleCheck,
      cycleMode: note.cycleCheck ? "days" : "range",
      cycleStart: note.cycleStart || note.date,
      cycleEnd: note.cycleEnd || null,
      cycleDays: note.cycleDays || null,
      cycleStartDate: note.cycleStart || note.date,
      done: false,
      doneDate: null,
      actualMins: 0,
      pomCount: 0,
      createdAt: new Date().toISOString(),
      notebookItemId: note.id,
    };
    S.tasks.unshift(task);
    note.taskId = task.id;
  } else {
    task.title = note.text;
    task.cycleCheck = !!note.cycleCheck;
    task.cycleMode = note.cycleCheck ? "days" : task.cycleMode;
    task.cycleStart = note.cycleStart || task.cycleStart;
    task.cycleEnd = note.cycleEnd || task.cycleEnd;
    task.cycleDays = note.cycleDays || task.cycleDays;
    task.notebookItemId = note.id;
  }
  return task;
}
function getNotebookTopOrder(dateStr) {
  const items = S.notebookItems.filter(item => item.date === dateStr);
  return items.length ? Math.min(...items.map(item => item.order ?? 0)) : 0;
}
function getNotebookBottomOrder(dateStr) {
  const items = S.notebookItems.filter(item => item.date === dateStr);
  return items.length ? Math.max(...items.map(item => item.order ?? 0)) : 0;
}
function getNotebookTopPendingOrder(dateStr) {
  const items = S.notebookItems.filter(item => item.date === dateStr && item.status !== "done");
  return items.length ? Math.min(...items.map(item => item.order ?? 0)) : getNotebookBottomOrder(dateStr) + 1;
}
function getNotebookCycleDates(start, count) {
  const safeCount = clamp(parseInt(count, 10) || 1, 1, 365);
  const base = parseLocalDateInput(start || localDate(new Date()));
  return Array.from({ length: safeCount }, (_, index) => {
    const next = new Date(base);
    next.setDate(base.getDate() + index);
    return localDate(next);
  });
}
function handleNotebookDragStart(e) {
  const item = e.target.closest("[data-note-id]");
  if (!item) return;
  S._draggingNotebookId = item.dataset.noteId;
  item.classList.add("dragging");
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", item.dataset.noteId);
  }
}
function handleNotebookDragOver(e) {
  const item = e.target.closest("[data-note-id]");
  if (!item || !S._draggingNotebookId || item.dataset.noteId === S._draggingNotebookId) return;
  e.preventDefault();
}
function handleNotebookDrop(e) {
  const item = e.target.closest("[data-note-id]");
  if (!item || !S._draggingNotebookId || item.dataset.noteId === S._draggingNotebookId) return;
  e.preventDefault();
  const dateStr = getCurrentNotebookDate();
  const ordered = getNotebookItemsForDate(dateStr).map(note => note.id);
  const from = ordered.indexOf(S._draggingNotebookId);
  const to = ordered.indexOf(item.dataset.noteId);
  if (from < 0 || to < 0) return;
  const [moved] = ordered.splice(from, 1);
  ordered.splice(to, 0, moved);
  setNotebookOrderForDate(dateStr, ordered);
}
function handleNotebookDragEnd() {
  S._draggingNotebookId = null;
  D.notebookList.querySelectorAll(".notebook-item.dragging").forEach(item => item.classList.remove("dragging"));
}
function setNotebookOrderForDate(dateStr, orderedIds) {
  const rank = new Map(orderedIds.map((id, index) => [id, index + 1]));
  S.notebookItems.forEach(item => {
    if (item.date === dateStr && rank.has(item.id)) item.order = rank.get(item.id);
  });
  persist();
  renderNotebook();
}
function getNotebookReview(dateStr) {
  return S.notebookReviews.find(item => item.date === dateStr) || null;
}
function saveNotebookReview() {
  const today = getCurrentNotebookDate();
  const text = D.notebookReviewInput.value.trim();
  S.notebookReviews = S.notebookReviews.filter(item => item.date !== today);
  if (text) S.notebookReviews.unshift({ date: today, text, updatedAt: new Date().toISOString() });
  persist();
  renderNotebook();
}
function clearNotebookReview() {
  const today = getCurrentNotebookDate();
  D.notebookReviewInput.value = "";
  S.notebookReviews = S.notebookReviews.filter(item => item.date !== today);
  persist();
  renderNotebook();
}
function isNotebookItemVisible(item) {
  return true;
}
function isCycleRangeActive(start, end) {
  const today = localDate(new Date());
  return (!start || today >= start) && (!end || today <= end);
}
function pruneExpiredRecurringItems() {
  S.tasks = S.tasks.filter(task => {
    const today = localDate(new Date());
    if (!task.cycleCheck) return true;
    const end = getTaskCycleEnd(task);
    return !(end && end < today);
  });
}
function getNoteDoneItemsForDate(dateStr) {
  return S.notebookItems
    .filter(item => item.status === "done" && item.doneDate === dateStr)
    .map(item => ({ title: item.text, mins: 0, date: dateStr, source: "note" }));
}
function getTaskDoneItemsForDate(dateStr) {
  return S.tasks
    .filter(t => t.doneDate === dateStr || (t.done && t.createdAt?.startsWith(dateStr)))
    .map(t => ({ title: t.title, mins: 0, date: dateStr, source: "task", tag: t.tag || "" }));
}
function getSessionDoneItemsForDate(dateStr) {
  return mergeSessionsByTask(S.sessions.filter(item => item.date === dateStr))
    .map(item => ({ title: item.title, mins: item.mins || 0, date: dateStr, source: "session", tag: item.tag || "" }));
}
function getManualDoneItemsForDate(dateStr) {
  return S.completedEntries.filter(item => item.date === dateStr);
}
function mergeHistoryTasksForDate(dateStr) {
  return mergeItemsByTitle([
    ...getSessionDoneItemsForDate(dateStr),
    ...getTaskDoneItemsForDate(dateStr),
    ...getManualDoneItemsForDate(dateStr),
    ...getNoteDoneItemsForDate(dateStr),
  ]);
}
function addManualCompletedTask() {
  const title = D.manualDoneTitle.value.trim();
  if (!title) return;
  S.completedEntries.unshift({
    id: crypto.randomUUID(),
    title,
    mins: clamp(parseInt(D.manualDoneMins.value, 10) || 0, 0, 600),
    date: D.manualDoneDate.value || localDate(new Date()),
    source: "manual",
    createdAt: new Date().toISOString(),
  });
  D.manualDoneTitle.value = "";
  D.manualDoneMins.value = "";
  persist();
  renderHistory(D.historyDate.value || localDate(new Date()));
}
function normalizeColorValue(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(value || "") ? value : fallback;
}
function sanitizeNotebookLine(text) {
  return text
    .trim()
    .replace(/^[\(\[（【]?\s*\d+\s*[\)\]）】.\-、:：]?\s*/, "")
    .replace(/^\s*[A-Za-z]\s*[\.\-、:：]\s*/, "")
    .trim();
}

function getStreak() {
  let n = 0;
  for (let i = 0; i < 365; i++) {
    const d = localDate(new Date(Date.now() - i * DAY_MS));
    if (!S.sessions.some(s => s.date === d)) break;
    n++;
  }
  return n;
}

function localDate(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function parseLocalDateInput(value) {
  const [y, m, d] = String(value).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
function formatDateFull(d) {
  const days = ["日","一","二","三","四","五","六"];
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 · 周${days[d.getDay()]}`;
}
function formatDisplayTime(iso) {
  const d = new Date(iso);
  return `${localDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function addDays(dateStr, days) {
  const d = parseLocalDateInput(dateStr);
  d.setDate(d.getDate() + days);
  return localDate(d);
}
function diffDays(startDateStr, endDateStr) {
  return Math.round((parseLocalDateInput(endDateStr) - parseLocalDateInput(startDateStr)) / DAY_MS);
}
function chunk(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}
function fmt(sec) { return `${pad(Math.floor(sec/60))}:${pad(sec%60)}`; }
function pad(n)   { return String(n).padStart(2,"0"); }
function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }
function esc(s="") {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
          .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function escAttr(s="") { return esc(String(s)); }
