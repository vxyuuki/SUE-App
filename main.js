// SUE - Show Up Everyday | Main Logic (GitHub Theme)

// --- Constants & Data ---
function generateId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch(e) {}
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
const STORAGE_KEY = 'sue_data_v1';

const DEFAULT_SETTINGS = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  notifications: true,
  sound: true,
  autoStart: false,
  theme: 'dark',
  language: 'id'
};

const DEFAULT_DATA = {
  settings: { ...DEFAULT_SETTINGS },
  profile: {
    name: 'User',
    avatar: null, // base64 string
    totalSessions: 0,
    totalTime: 0, // in minutes
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null
  },
  sessions: [], // { id, type, date, duration, completed }
  notes: [],
  flashcards: []
};

// --- IndexedDB for Avatar ---
const DB_NAME = 'sue_db';
const STORE_NAME = 'avatar_store';

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveAvatarToDB(base64Str) {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(base64Str, 'avatar');
  } catch (err) {
    console.error('Failed to save avatar to DB', err);
  }
}

async function getAvatarFromDB() {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get('avatar');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to get avatar from DB', err);
    return null;
  }
}

const MOTIVATIONAL_QUOTES = [
  { text: "Mulai dari yang kecil, tapi mulai sekarang.", author: "Anonim" },
  { text: "Fokus pada proses, bukan hanya hasil.", author: "Ryan Holiday" },
  { text: "Satu-satunya cara untuk melakukan pekerjaan hebat adalah dengan mencintai apa yang Anda lakukan.", author: "Steve Jobs" },
  { text: "Jangan menunggu inspirasi. Mulailah dan inspirasi akan datang.", author: "Anonim" },
  { text: "Kesempurnaan adalah musuh dari kebaikan.", author: "Voltaire" },
  { text: "Lakukan apa yang bisa kamu lakukan, dengan apa yang kamu miliki, di mana pun kamu berada.", author: "Theodore Roosevelt" },
  { text: "Sukses adalah jumlah dari usaha kecil, yang diulang hari demi hari.", author: "Robert Collier" },
  { text: "Disiplin adalah jembatan antara tujuan dan pencapaian.", author: "Jim Rohn" }
];

// --- State ---
let appData = null;
let timerState = {
  status: 'idle', // idle, running, paused
  type: 'focus', // focus, short_break, long_break
  timeLeft: 0,
  totalTime: 0,
  interval: null,
  focusCount: 0
};
let currentView = 'timer';
let currentDate = new Date();
let currentNoteId = null;
let currentNoteCover = null;

// --- DOM Elements ---
const DOM = {
  // Navigation
  navBtns: document.querySelectorAll('.nav-btn'),
  views: document.querySelectorAll('.view'),
  
  // Header
  headerAvatar: document.getElementById('header-avatar'),
  headerAvatarFallback: document.getElementById('header-avatar-fallback'),
  
  // Profile Sidebar
  avatarInput: document.getElementById('avatar-file-input'),
  avatarImage: document.getElementById('avatar-image'),
  avatarFallback: document.getElementById('avatar-fallback'),
  profileName: document.getElementById('profile-name'),
  editNameIcon: document.getElementById('edit-name-icon'),
  statSessions: document.getElementById('stat-total-sessions'),
  statTime: document.getElementById('stat-total-time'),
  statCurrentStreak: document.getElementById('stat-current-streak'),
  statLongestStreak: document.getElementById('stat-longest-streak'),
  quoteText: document.getElementById('quote-text'),
  quoteAuthor: document.getElementById('quote-author'),
  
  // Timer
  tabs: document.querySelectorAll('.session-tab'),
  timerTime: document.getElementById('timer-time'),
  timerLabel: document.getElementById('timer-label'),
  timerProgress: document.getElementById('timer-progress'),
  btnStartPause: document.getElementById('btn-start-pause'),
  btnReset: document.getElementById('btn-reset'),
  btnSkip: document.getElementById('btn-skip'),
  btnMiniMode: document.getElementById('btn-mini-mode'),
  iconPlay: document.getElementById('icon-play'),
  iconPause: document.getElementById('icon-pause'),
  sessionDots: document.querySelectorAll('.session-dot'),
  sessionText: document.querySelector('.session-counter-text'),
  
  // Calendar
  calMonthLabel: document.getElementById('cal-month-label'),
  calPrevBtn: document.getElementById('cal-prev-month'),
  calNextBtn: document.getElementById('cal-next-month'),
  calGrid: document.getElementById('calendar-grid'),
  
  // Graph
  graphContainer: document.getElementById('contribution-graph'),
  monthsContainer: document.getElementById('contribution-months'),
  
  // Settings
  settingFocus: document.getElementById('setting-focus'),
  settingShort: document.getElementById('setting-short-break'),
  settingLong: document.getElementById('setting-long-break'),
  settingNotif: document.getElementById('setting-notifications'),
  settingSound: document.getElementById('setting-sound'),
  settingAutoStart: document.getElementById('setting-auto-start'),
  settingTheme: document.getElementById('setting-theme'),
  settingLanguage: document.getElementById('setting-language'),
  btnExport: document.getElementById('btn-export-data'),
  btnClear: document.getElementById('btn-clear-data'),
  
  // Notes
  notesList: document.getElementById('notes-list'),
  notesEmpty: document.getElementById('notes-empty'),
  btnAddNote: document.getElementById('btn-add-note'),
  noteEditor: document.getElementById('note-editor-overlay'),
  btnNoteClose: document.getElementById('note-close-btn'),
  btnNoteSave: document.getElementById('note-save-btn'),
  noteTitle: document.getElementById('note-title-input'),
  noteContent: document.getElementById('note-editor-content'),
  noteToolbarBtns: document.querySelectorAll('.note-editor-toolbar .btn'),
  noteTagInput: document.getElementById('note-tag-input'),
  noteTagsContainer: document.getElementById('note-tags'),
  notesFilterDiv: document.getElementById('notes-filter'),
  filterClear: document.getElementById('filter-clear'),
  filterLabel: document.getElementById('filter-date-label')
};


// --- i18n Localization ---
const translations = {
  en: {
    nav_timer:'Timer',nav_notes:'Notes',nav_flashcards:'Flashcards',nav_settings:'Settings',
    search_placeholder:'Type / to search',header_timer_status:'Idle',stat_title:'Productivity Stats',
    stat_focus:'Focus Time',stat_sessions:'Sessions Completed',stat_streak:'Day Streak',stat_best:'Best Streak',
    timer_focus:'Focus',timer_short:'Short Break',timer_long:'Long Break',analytics_title:'Analytics & Habit Tracker',
    analytics_7days:'Study Time (Last 7 Days)',analytics_total:'Total Study (This Week)',analytics_avg:'Daily Average',
    analytics_ratio:'Focus & Break Ratio',settings_title:'Settings',settings_durations:'Timer Durations',
    settings_focus:'Focus Session (minutes)',settings_short:'Short Break (minutes)',settings_long:'Long Break (minutes)',
    settings_pref:'Preferences',settings_lang:'Language',settings_theme:'Theme',settings_notif:'Desktop notifications',
    settings_notif_desc:'Show notifications when a session completes.',settings_sound:'Sound effects',
    settings_sound_desc:'Play a sound when a session completes.',settings_auto:'Auto-start timer',
    settings_auto_desc:'Automatically start the next session when the current one ends.',
    graph_hours:'hours of focus in the last year',graph_learn:'Learn how we count contributions',
    graph_less:'Less',graph_more:'More',
    note_find_placeholder:'Find a note...',note_new:'New note',note_all_title:'All Notes',
    note_empty_title:'No notes yet',note_save:'Save',note_change_cover:'Change Cover',
    flashcards_title:'Flashcards',flashcards_create:'Create Folder',flashcards_folders:'Your Folders',
    flashcards_add:'Add Card',flashcards_study_now:'Study Now',flashcards_folder_name:'Folder Name',
    flashcards_cancel:'Cancel',flashcards_save:'Save',flashcards_front:'Front (Question)',flashcards_back_label:'Back (Answer)',
    toast_settings_saved:'Settings saved.',toast_avatar_updated:'Avatar updated',toast_max_file:'Max file size is 25MB',
    toast_notif_enabled:'Notifications enabled!',toast_notif_blocked:'Notifications blocked.'
  },
  id: {
    nav_timer:'Timer',nav_notes:'Catatan',nav_flashcards:'Flashcards',nav_settings:'Pengaturan',
    search_placeholder:'Ketik / untuk mencari',header_timer_status:'Diam',stat_title:'Statistik Produktivitas',
    stat_focus:'Waktu Fokus',stat_sessions:'Sesi Selesai',stat_streak:'Hari Streak',stat_best:'Rekor Streak',
    timer_focus:'Fokus',timer_short:'Istirahat',timer_long:'Long Break',analytics_title:'Analitik & Pelacak Kebiasaan',
    analytics_7days:'Waktu Belajar (7 Hari Terakhir)',analytics_total:'Total Belajar (Minggu Ini)',analytics_avg:'Rata-rata Harian',
    analytics_ratio:'Rasio Fokus & Istirahat',settings_title:'Pengaturan',settings_durations:'Durasi Timer',
    settings_focus:'Sesi Fokus (menit)',settings_short:'Istirahat Pendek (menit)',settings_long:'Istirahat Panjang (menit)',
    settings_pref:'Preferensi',settings_lang:'Bahasa',settings_theme:'Tema',settings_notif:'Notifikasi desktop',
    settings_notif_desc:'Tampilkan notifikasi saat sesi selesai.',settings_sound:'Efek Suara',
    settings_sound_desc:'Putar suara saat sesi selesai.',settings_auto:'Mulai otomatis',
    settings_auto_desc:'Mulai sesi berikutnya secara otomatis saat ini berakhir.',
    graph_hours:'jam waktu fokus dalam setahun terakhir',graph_learn:'Pelajari cara kami menghitung kontribusi',
    graph_less:'Sedikit',graph_more:'Banyak',
    note_find_placeholder:'Cari catatan...',note_new:'Catatan baru',note_all_title:'Semua Catatan',
    note_empty_title:'Belum ada catatan',note_save:'Simpan',note_change_cover:'Ubah Sampul',
    flashcards_title:'Flashcards',flashcards_create:'Buat Folder',flashcards_folders:'Folder Anda',
    flashcards_add:'Tambah Kartu',flashcards_study_now:'Belajar Sekarang',flashcards_folder_name:'Nama Folder',
    flashcards_cancel:'Batal',flashcards_save:'Simpan',flashcards_front:'Depan (Pertanyaan)',flashcards_back_label:'Belakang (Jawaban)',
    toast_settings_saved:'Pengaturan disimpan.',toast_avatar_updated:'Avatar diperbarui',toast_max_file:'Ukuran file maks 25MB',
    toast_notif_enabled:'Notifikasi diaktifkan!',toast_notif_blocked:'Notifikasi diblokir.'
  }
};

window.applyLanguage = function() {
  const lang = appData && appData.settings ? appData.settings.language || 'id' : 'id';
  const dict = translations[lang] || translations['id'];
  document.querySelectorAll("[data-i18n]").forEach(function(el) {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      let hasText = false;
      el.childNodes.forEach(function(node) {
        if (node.nodeType === 3 && node.nodeValue.trim().length > 0) { node.nodeValue = dict[key]; hasText = true; }
      });
      if (!hasText && el.childNodes.length === 0) el.textContent = dict[key];
    }
  });
  const ft = document.querySelector(".graph-panel") ? document.querySelector(".graph-panel").previousElementSibling : null;
  if (ft) ft.textContent = Math.floor((window._totalMinsYear || 0) / 60) + " " + dict.graph_hours;
  document.documentElement.lang = lang;
  const hlt = document.getElementById('header-lang-text');
  if (hlt) hlt.textContent = lang === 'en' ? 'EN' : 'ID';
};

window.t = function(key) {
  const lang = appData && appData.settings ? appData.settings.language || 'id' : 'id';
  const dict = translations[lang] || translations['id'];
  return dict[key] || key;
};
// --- Initialization ---



// --- Flashcards Logic ---
  let studyQueue = [];
  let currentCardEl = null;
  let isDragging = false;
  let startX = 0, currentX = 0;
  let currentDeckId = null;
  
  function renderDecksList() {
    // Migration: If old flat flashcards exist, move them to a default deck
    if (appData.flashcards && appData.flashcards.length > 0) {
      if (!appData.decks) appData.decks = [];
      appData.decks.push({
        id: generateId(),
        name: 'General',
        cards: [...appData.flashcards]
      });
      delete appData.flashcards;
      saveData();
    }
    
    if (!appData.decks) appData.decks = [];
    
    const list = document.getElementById('decks-list');
    const countTitle = document.getElementById('decks-count-title');
    if(!list) return;
    
    countTitle.textContent = `Your Folders (${appData.decks.length})`;
    
    if (appData.decks.length === 0) {
      list.innerHTML = '<div class="p-4 text-center color-fg-muted">Belum ada folder flashcard. Silakan buat folder baru.</div>';
      return;
    }
    
    list.innerHTML = '';
    appData.decks.forEach(deck => {
      const el = document.createElement('div');
      el.className = 'flashcard-item';
      el.style.cursor = 'pointer';
      el.innerHTML = `
        <div style="flex: 1;">
          <div class="flashcard-front">📁 ${deck.name}</div>
          <div class="flashcard-back">${deck.cards ? deck.cards.length : 0} cards</div>
        </div>
        <button class="btn-octicon color-fg-danger btn-del-deck" data-id="${deck.id}">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/></svg>
        </button>
      `;
      
      // Click deck to open it
      el.querySelector('div').addEventListener('click', () => openDeck(deck.id));
      
      list.appendChild(el);
    });
    
    list.querySelectorAll('.btn-del-deck').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if(confirm('Hapus folder ini beserta semua isinya?')) {
          appData.decks = appData.decks.filter(d => d.id !== btn.dataset.id);
          saveData();
          renderDecksList();
        }
      });
    });
  }
  
  function openDeck(deckId) {
    currentDeckId = deckId;
    const deck = appData.decks.find(d => d.id === deckId);
    if (!deck) return;
    
    document.getElementById('flashcard-decks-view').style.display = 'none';
    document.getElementById('flashcard-single-deck-view').style.display = 'block';
    
    document.getElementById('current-deck-title').textContent = deck.name;
    renderDecksList();
  }
  
  function closeDeck() {
    currentDeckId = null;
    document.getElementById('flashcard-decks-view').style.display = 'block';
    document.getElementById('flashcard-single-deck-view').style.display = 'none';
    renderDecksList();
  }
  
  function renderFlashcardsList() {
    if (!currentDeckId) return;
    const deck = appData.decks.find(d => d.id === currentDeckId);
    if (!deck) return;
    
    if (!deck.cards) deck.cards = [];
    document.getElementById('current-deck-count').textContent = `${deck.cards.length} cards`;
    
    const list = document.getElementById('flashcards-list');
    if(!list) return;
    
    if (deck.cards.length === 0) {
      list.innerHTML = '<div class="p-4 text-center color-fg-muted">Belum ada flashcard. Silakan tambah baru.</div>';
      return;
    }
    
    list.innerHTML = '';
    deck.cards.forEach(card => {
      const el = document.createElement('div');
      el.className = 'flashcard-item';
      el.innerHTML = `
        <div>
          <div class="flashcard-front">${card.front}</div>
          <div class="flashcard-back">${card.back}</div>
        </div>
        <button class="btn-octicon color-fg-danger btn-del-fc" data-id="${card.id}">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/></svg>
        </button>
      `;
      list.appendChild(el);
    });
    
    list.querySelectorAll('.btn-del-fc').forEach(btn => {
      btn.addEventListener('click', () => {
        if(confirm('Hapus kartu ini?')) {
          deck.cards = deck.cards.filter(c => c.id !== btn.dataset.id);
          saveData();
          renderFlashcardsList();
        }
      });
    });
    
    // Anime.js stagger for flashcards
    anime({
      targets: '.flashcard-item',
      translateX: [20, 0],
      opacity: [0, 1],
      delay: anime.stagger(40),
      easing: 'easeOutQuad',
      duration: 500
    });
  }
  
  function startStudySession() {
    if (!currentDeckId) return;
    const deck = appData.decks.find(d => d.id === currentDeckId);
    if (!deck || !deck.cards || deck.cards.length === 0) {
      alert('Tambahkan kartu terlebih dahulu!');
      return;
    }
    
    // Shuffle cards
    studyQueue = [...deck.cards].sort(() => Math.random() - 0.5);
    document.getElementById('study-mode-overlay').style.display = 'flex';
    document.getElementById('study-complete-msg').style.display = 'none';
    document.getElementById('swipe-container').style.display = 'block';
    document.getElementById('btn-swipe-left').style.display = 'block';
    document.getElementById('btn-swipe-right').style.display = 'block';
    
    showNextCard();
  }
  
  function showNextCard() {
    const container = document.getElementById('swipe-container');
    container.innerHTML = '';
    document.getElementById('study-progress-text').textContent = `Tersisa: ${studyQueue.length} kartu`;
    
    if (studyQueue.length === 0) {
      container.style.display = 'none';
      document.getElementById('study-complete-msg').style.display = 'block';
      document.getElementById('btn-swipe-left').style.display = 'none';
      document.getElementById('btn-swipe-right').style.display = 'none';
      return;
    }
    
    const cardData = studyQueue[0];
    const card = document.createElement('div');
    card.className = 'swipe-card';
    card.innerHTML = `
      <div class="swipe-card-content" id="active-card-text">${cardData.front}</div>
      <div class="swipe-card-hint">Klik untuk melihat jawaban</div>
    `;
    
    let showingFront = true;
    card.addEventListener('click', (e) => {
      if (Math.abs(currentX) > 10) return; // Prevent flip on drag
      showingFront = !showingFront;
      document.getElementById('active-card-text').textContent = showingFront ? cardData.front : cardData.back;
      card.querySelector('.swipe-card-hint').textContent = showingFront ? 'Klik untuk melihat jawaban' : '';
    });
    
    // Drag Mechanics
    card.addEventListener('mousedown', startDrag);
    card.addEventListener('touchstart', startDrag, {passive: false});
    window.addEventListener('mousemove', drag);
    window.addEventListener('touchmove', drag, {passive: false});
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);
    
    currentCardEl = card;
    container.appendChild(card);
  }
  
  function startDrag(e) {
    isDragging = true;
    startX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
    currentCardEl.classList.add('is-dragging');
  }
  
  function drag(e) {
    if (!isDragging || !currentCardEl) return;
    e.preventDefault(); // stop scrolling
    const x = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
    currentX = x - startX;
    const rotate = currentX * 0.05;
    currentCardEl.style.transform = `translateX(${currentX}px) rotate(${rotate}deg)`;
    
    // Highlight background slightly based on direction
    if (currentX > 50) currentCardEl.style.backgroundColor = 'rgba(46, 160, 67, 0.2)';
    else if (currentX < -50) currentCardEl.style.backgroundColor = 'rgba(248, 81, 73, 0.2)';
    else currentCardEl.style.backgroundColor = 'var(--color-canvas-overlay)';
  }
  
  function endDrag() {
    if (!isDragging || !currentCardEl) return;
    isDragging = false;
    currentCardEl.classList.remove('is-dragging');
    
    const threshold = 100;
    if (currentX > threshold) {
      handleSwipe('right');
    } else if (currentX < -threshold) {
      handleSwipe('left');
    } else {
      currentCardEl.style.transform = '';
      currentCardEl.style.backgroundColor = 'var(--color-canvas-overlay)';
    }
    currentX = 0;
    
    window.removeEventListener('mousemove', drag);
    window.removeEventListener('touchmove', drag);
    window.removeEventListener('mouseup', endDrag);
    window.removeEventListener('touchend', endDrag);
  }
  
  function handleSwipe(direction) {
    currentCardEl.style.transform = `translateX(${direction === 'right' ? 1000 : -1000}px)`;
    currentCardEl.style.opacity = '0';
    
    setTimeout(() => {
      const card = studyQueue.shift();
      if (direction === 'left') {
        // Re-add to queue if not memorized
        studyQueue.push(card);
      }
      showNextCard();
    }, 300);
  }
  
  // Setup Event Listeners for Flashcards
  function setupFlashcardListeners() {
    const btnAddDeck = document.getElementById('btn-add-deck');
    const btnCloseDeckEditor = document.getElementById('btn-close-deck-editor');
    const btnSaveDeck = document.getElementById('btn-save-deck');
    const btnBackToDecks = document.getElementById('btn-back-to-decks');
    
    if(btnAddDeck) btnAddDeck.addEventListener('click', () => {
      document.getElementById('deck-name').value = '';
      document.getElementById('deck-editor-overlay').style.display = 'flex';
    });
    
    if(btnCloseDeckEditor) btnCloseDeckEditor.addEventListener('click', () => {
      document.getElementById('deck-editor-overlay').style.display = 'none';
    });
    
    if(btnSaveDeck) btnSaveDeck.addEventListener('click', () => {
      const name = document.getElementById('deck-name').value.trim();
      if(name) {
        if(!appData.decks) appData.decks = [];
        appData.decks.push({ id: generateId(), name, cards: [] });
        saveData();
        renderDecksList();
        document.getElementById('deck-editor-overlay').style.display = 'none';
      }
    });
    
    if(btnBackToDecks) btnBackToDecks.addEventListener('click', closeDeck);
  
    const btnAdd = document.getElementById('btn-add-flashcard');
    const btnStudy = document.getElementById('btn-study-flashcards');
    const btnCloseEditor = document.getElementById('btn-close-fc-editor');
    const btnSaveFc = document.getElementById('btn-save-fc');
    const btnCloseStudy = document.getElementById('btn-close-study');
    const btnStudyDone = document.getElementById('btn-study-done');
    
    if(btnAdd) btnAdd.addEventListener('click', () => {
      document.getElementById('fc-front').value = '';
      document.getElementById('fc-back').value = '';
      document.getElementById('flashcard-editor-overlay').style.display = 'flex';
    });
    
    if(btnCloseEditor) btnCloseEditor.addEventListener('click', () => {
      document.getElementById('flashcard-editor-overlay').style.display = 'none';
    });
    
    if(btnSaveFc) btnSaveFc.addEventListener('click', () => {
      const front = document.getElementById('fc-front').value.trim();
      const back = document.getElementById('fc-back').value.trim();
      if(front && back && currentDeckId) {
        const deck = appData.decks.find(d => d.id === currentDeckId);
        if (deck) {
          if (!deck.cards) deck.cards = [];
          deck.cards.push({ id: generateId(), front, back });
          saveData();
          renderFlashcardsList();
          document.getElementById('flashcard-editor-overlay').style.display = 'none';
        }
      }
    });
    
    if(btnStudy) btnStudy.addEventListener('click', startStudySession);
    if(btnCloseStudy) btnCloseStudy.addEventListener('click', () => document.getElementById('study-mode-overlay').style.display = 'none');
    if(btnStudyDone) btnStudyDone.addEventListener('click', () => document.getElementById('study-mode-overlay').style.display = 'none');
    
    const btnLeft = document.getElementById('btn-swipe-left');
    const btnRight = document.getElementById('btn-swipe-right');
    if(btnLeft) btnLeft.addEventListener('click', () => handleSwipe('left'));
    if(btnRight) btnRight.addEventListener('click', () => handleSwipe('right'));
  }


async function init() {
  await loadData();
  setupEventListeners();
  setupFlashcardListeners();
  renderFlashcardsList();
  updateProfileUI();
  updateSettingsUI();
  renderCalendar(currentDate);
  renderGraph();
  renderAnalytics();
  renderNotes();
  setTimerType('focus');
  setInterval(changeQuote, 7000);
  if (window.applyLanguage) window.applyLanguage(); // Ganti kata motivasi setiap 7 detik (via API)
  
  if (appData.settings.notifications && 'Notification' in window) {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }

  applyGlobalAnimations();
}

function applyGlobalAnimations() {
  // Add a nice global button click animation using Anime.js
  document.querySelectorAll('.btn, button').forEach(btn => {
    btn.addEventListener('mousedown', () => {
      anime({
        targets: btn,
        scale: 0.95,
        duration: 150,
        easing: 'easeOutQuad'
      });
    });
    const resetAnim = () => {
      anime({
        targets: btn,
        scale: 1,
        duration: 400,
        easing: 'easeOutElastic(1, .5)'
      });
    };
    btn.addEventListener('mouseup', resetAnim);
    btn.addEventListener('mouseleave', resetAnim);
  });
  
  // Add subtle float animation to the profile avatar
  anime({
    targets: ['.avatar-wrapper img', '.avatar-wrapper .avatar-fallback'],
    translateY: [-3, 3],
    loop: true,
    direction: 'alternate',
    easing: 'easeInOutSine',
    duration: 2500
  });

  // Anime.js On-Scroll Animations using Intersection Observer
  const scrollElements = document.querySelectorAll('.Box.mt-3, .graph-container, .calendar-container');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        anime({
          targets: entry.target,
          translateY: [30, 0],
          opacity: [0, 1],
          duration: 800,
          easing: 'easeOutExpo'
        });
        observer.unobserve(entry.target); // Animasi sekali saja
      }
    });
  }, { threshold: 0.1 });
  
  scrollElements.forEach(el => {
    el.style.opacity = '0'; // Hide initially for animation
    observer.observe(el);
  });
}

// --- Data Management ---
async function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      appData = JSON.parse(saved);
      appData.settings = { ...DEFAULT_SETTINGS, ...(appData.settings || {}) };
      checkStreak();
      
      // Migrate avatar from localStorage to IndexedDB
      if (appData.profile.avatar) {
        await saveAvatarToDB(appData.profile.avatar);
        appData.profile.avatar = null;
        saveData(); // Save without avatar to free space
      }
      
      const dbAvatar = await getAvatarFromDB();
      if (dbAvatar) {
        appData.profile.avatar = dbAvatar;
      }
    } catch (e) {
      appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  } else {
    appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

function saveData() {
  const dataToSave = JSON.parse(JSON.stringify(appData));
  dataToSave.profile.avatar = null; // Prevent saving giant base64 to localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
}

function checkStreak() {
  const today = new Date().toISOString().split('T')[0];
  const lastActive = appData.profile.lastActiveDate;
  
  if (lastActive) {
    const lastDate = new Date(lastActive);
    const currDate = new Date(today);
    const diffTime = Math.abs(currDate - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays > 1) appData.profile.currentStreak = 0;
  }
  saveData();
}

function updateStreak(dateStr) {
  const lastActive = appData.profile.lastActiveDate;
  if (!lastActive) {
    appData.profile.currentStreak = 1;
  } else if (lastActive !== dateStr) {
    const lastDate = new Date(lastActive);
    const currDate = new Date(dateStr);
    const diffTime = Math.abs(currDate - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) appData.profile.currentStreak += 1;
    else if (diffDays > 1) appData.profile.currentStreak = 1;
  }
  
  appData.profile.lastActiveDate = dateStr;
  if (appData.profile.currentStreak > appData.profile.longestStreak) {
    appData.profile.longestStreak = appData.profile.currentStreak;
  }
  
  saveData();
  updateProfileUI();
}

// --- UI Updates ---
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<strong>${type === 'success' ? '✔' : '⚠'}</strong> ${message}`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 200); }, 3000);
}

function playSound() {
  if (!appData.settings.sound) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch(e) {}
}

function showNotification(title, body) {
  if (!appData.settings.notifications) return;
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
  playSound();
}

// --- Navigation ---

function switchView(viewId) {
  DOM.navBtns.forEach(btn => {
    if (btn.dataset.view === viewId) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  
  DOM.views.forEach(view => {
    if (view.id === `view-${viewId}`) {
      view.classList.add('active');
      view.style.display = 'block'; // Make sure display is block before animating
      // Anime.js Tab Switch Animation
      anime({
        targets: view,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 600,
        easing: 'easeOutExpo'
      });
    } else {
      view.classList.remove('active');
      view.style.display = 'none';
      view.style.opacity = 0;
    }
  });
  currentView = viewId;
  
  // Re-scroll graph if switching to timer
  if (viewId === 'timer') {
    const wrapper = document.querySelector('.contribution-graph-wrapper');
    if (wrapper) wrapper.scrollLeft = wrapper.scrollWidth;
  }
}

// --- Timer Logic ---
function getDuration(type) {
  switch (type) {
    case 'focus': return appData.settings.focusDuration * 60;
    case 'short_break': return appData.settings.shortBreakDuration * 60;
    case 'long_break': return appData.settings.longBreakDuration * 60;
    default: return 25 * 60;
  }
}

let isMiniMode = false;
function toggleMiniMode() {
  isMiniMode = !isMiniMode;
  if (isMiniMode) {
    // Force switch to timer view before entering mini mode
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-timer').classList.add('active');
    document.body.classList.add('mini-mode');
  } else {
    document.body.classList.remove('mini-mode');
  }
  if (window.electronAPI && window.electronAPI.setMiniMode) {
    window.electronAPI.setMiniMode(isMiniMode);
  }
}

function setTimerType(type) {
  if (timerState.status === 'running') return;
  
  timerState.type = type;
  const duration = getDuration(type);
  timerState.totalTime = duration;
  timerState.timeLeft = duration;
  
  DOM.tabs.forEach(tab => {
    if (tab.dataset.type === type) tab.classList.add('SegmentedControl-item--selected');
    else tab.classList.remove('SegmentedControl-item--selected');
  });
  
  const labels = { 'focus': 'FOKUS', 'short_break': 'ISTIRAHAT', 'long_break': 'LONG BREAK' };
  animateScrambleText(DOM.timerLabel, labels[type] || 'TIMER', 800);
  
  updateTimerDisplay();
  changeQuote();
  
  // Colors mapped to GitHub success/accent
  const timerCircle = document.getElementById('timer-progress');
  if (timerCircle) {
    if (type === 'focus') {
      timerCircle.style.stroke = 'var(--color-success-fg)';
    } else {
      timerCircle.style.stroke = 'var(--color-accent-fg)';
    }
  }
  
  // Anime.js pop animation for the timer
  const timerContainer = document.querySelector('.anime-widget-container');
  if (timerContainer) {
    anime({
      targets: timerContainer,
      scale: [0.9, 1],
      opacity: [0.5, 1],
      duration: 800,
      easing: 'easeOutElastic(1, .5)'
    });
  }
}

let timerMsAnimation = null;
function updateTimerDisplay() {
  const m = Math.floor(timerState.timeLeft / 60);
  const s = timerState.timeLeft % 60;
  const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  
  if (timerState.status === 'running') {
    if (timerMsAnimation) timerMsAnimation.pause();
    let msObj = { val: 99 };
    timerMsAnimation = anime({
      targets: msObj,
      val: 0,
      duration: 1000,
      easing: 'linear',
      round: 1,
      update: function() {
        DOM.timerTime.textContent = `${timeStr}.${msObj.val.toString().padStart(2, '0')}`;
      }
    });
  } else {
    if (timerMsAnimation) timerMsAnimation.pause();
    DOM.timerTime.textContent = timeStr;
  }
  
  const typeStr = timerState.type === 'focus' ? 'Fokus' : 'Break';
  document.title = `${timeStr} - ${typeStr} | SUE`;
}

function toggleTimer() {
  if (timerState.status === 'running') pauseTimer();
  else startTimer();
}

function startTimer() {
  timerState.status = 'running';
  DOM.iconPlay.style.display = 'none';
  DOM.iconPause.style.display = 'block';
  DOM.btnReset.disabled = false;
  DOM.btnSkip.disabled = false;
  
  const stateEl = document.getElementById('anime-running-state');
  if (stateEl) stateEl.textContent = 'true';
  
  timerState.interval = setInterval(() => {
    timerState.timeLeft--;
    updateTimerDisplay();
    updateHeaderTimerStatus();
    if (timerState.timeLeft <= 0) completeTimer();
  }, 1000);
}

function pauseTimer() {
  timerState.status = 'paused';
  clearInterval(timerState.interval);
  DOM.iconPlay.style.display = 'block';
  DOM.iconPause.style.display = 'none';
  document.title = `Paused - SUE`;
  
  const stateEl = document.getElementById('anime-running-state');
  if (stateEl) stateEl.textContent = 'false';
  updateHeaderTimerStatus();
}

function resetTimer() {
  pauseTimer();
  timerState.status = 'idle';
  timerState.timeLeft = timerState.totalTime;
  updateTimerDisplay();
  DOM.btnReset.disabled = true;
  DOM.btnSkip.disabled = true;
  document.title = `SUE — Show Up Everyday`;
  updateHeaderTimerStatus();
}

function completeTimer(skipped = false) {
  pauseTimer();
  timerState.status = 'idle';
  
  const isCompleted = !skipped || (timerState.totalTime - timerState.timeLeft) >= (timerState.totalTime * 0.8);
  const durationCompleted = Math.floor((timerState.totalTime - timerState.timeLeft) / 60);
  
  if (durationCompleted > 0) {
    const today = new Date().toISOString().split('T')[0];
    appData.sessions.push({
      id: generateId(),
      type: timerState.type,
      date: today,
      duration: durationCompleted,
      completed: isCompleted,
      timestamp: Date.now()
    });
    
    if (timerState.type === 'focus' && isCompleted) {
      appData.profile.totalSessions++;
      appData.profile.totalTime += durationCompleted;
      updateStreak(today);
      timerState.focusCount++;
      showNotification('Sesi Fokus Selesai!', 'Kerja bagus! Waktunya istirahat.');
    } else if (timerState.type !== 'focus') {
      showNotification('Waktu Istirahat Habis', 'Ayo kembali fokus!');
    }
    
    saveData();
    updateProfileUI();
    renderGraph();
    renderCalendar(currentDate);
    renderAnalytics();
  }
  
  if (timerState.type === 'focus') {
    if (timerState.focusCount >= 4) {
      timerState.focusCount = 0;
      setTimerType('long_break');
    } else {
      setTimerType('short_break');
    }
  } else {
    setTimerType('focus');
  }
  
  updateSessionDots();
  DOM.btnReset.disabled = true;
  DOM.btnSkip.disabled = true;
  document.title = `SUE — Show Up Everyday`;
  
  if (appData.settings.autoStart && !skipped) {
    setTimeout(() => startTimer(), 1500); // Auto start after 1.5 seconds
  }
}

function updateSessionDots() {
  DOM.sessionDots.forEach((dot, index) => {
    if (index < timerState.focusCount) dot.classList.add('filled');
    else dot.classList.remove('filled');
  });
  DOM.sessionText.textContent = `Sesi ${timerState.focusCount + 1} / 4`;
}

// --- SplitText Helper ---
function animateScrambleText(element, finalString, duration = 1200) {
  const chars = '!<>-_\\\\/[]{}—=+*^?#________';
  const length = finalString.length;
  const obj = { p: 0 };
  
  anime.remove(obj);
  anime({
    targets: obj,
    p: 1,
    duration: duration,
    easing: 'linear',
    update: function() {
      let currentString = '';
      for (let i = 0; i < length; i++) {
        if (i < Math.floor(obj.p * length)) {
          currentString += finalString[i];
        } else {
          currentString += chars[Math.floor(Math.random() * chars.length)];
        }
      }
      element.textContent = currentString;
    }
  });
}

async function changeQuote() {
  try {
    if (!window.loadedQuotes) {
      const response = await fetch('./quotes.json');
      window.loadedQuotes = await response.json();
    }
    
    let q;
    if (window.loadedQuotes && window.loadedQuotes.length > 0) {
      q = window.loadedQuotes[Math.floor(Math.random() * window.loadedQuotes.length)];
    } else {
      throw new Error('No quotes loaded');
    }

    anime.remove([DOM.quoteText, DOM.quoteAuthor]);
    anime.remove(DOM.quoteText.querySelectorAll('span'));

    anime({
      targets: [DOM.quoteText, DOM.quoteAuthor],
      opacity: 0,
      duration: 300,
      easing: 'linear',
      complete: function() {
        DOM.quoteAuthor.style.opacity = '1';
        DOM.quoteText.style.opacity = '1';
        
        animateScrambleText(DOM.quoteText, `"${q.text}"`, 1500);
        animateScrambleText(DOM.quoteAuthor, `— ${q.author || 'Unknown'}`, 1200);
      }
    });
  } catch (error) {
    console.error('Error loading quotes:', error);
    if(DOM.quoteText) {
      DOM.quoteText.textContent = "Error: " + error.message;
    }
  }
}

// --- Profile ---
function updateProfileUI() {
  animateScrambleText(DOM.profileName, appData.profile.name, 1000);
  animateScrambleText(DOM.statSessions, appData.profile.totalSessions.toString(), 800);
  
  const hours = Math.floor(appData.profile.totalTime / 60);
  const mins = appData.profile.totalTime % 60;
  const timeStr = hours > 0 ? `${hours}j ${mins}m` : `${mins}m`;
  animateScrambleText(DOM.statTime, timeStr, 800);
  
  animateScrambleText(DOM.statCurrentStreak, appData.profile.currentStreak.toString(), 800);
  animateScrambleText(DOM.statLongestStreak, appData.profile.longestStreak.toString(), 800);
  
  const fbText = appData.profile.name.charAt(0).toUpperCase();
  DOM.avatarFallback.textContent = fbText;
  DOM.headerAvatarFallback.textContent = fbText;
  
  if (appData.profile.avatar) {
    DOM.avatarImage.src = appData.profile.avatar;
    DOM.avatarImage.style.display = 'block';
    DOM.avatarFallback.style.display = 'none';
    DOM.headerAvatar.src = appData.profile.avatar;
    DOM.headerAvatar.style.display = 'block';
    DOM.headerAvatarFallback.style.display = 'none';
  } else {
    DOM.avatarImage.style.display = 'none';
    DOM.avatarFallback.style.display = 'flex';
    DOM.headerAvatar.style.display = 'none';
    DOM.headerAvatarFallback.style.display = 'flex';
  }
}

// --- Contribution Graph ---
function getSessionStatsByDate() {
  const stats = {};
  appData.sessions.forEach(s => {
    if (s.type === 'focus') {
      if (!stats[s.date]) stats[s.date] = 0;
      stats[s.date] += s.duration;
    }
  });
  return stats;
}

function getColorLevel(minutes) {
  if (!minutes || minutes === 0) return 'var(--color-calendar-graph-day-bg)';
  if (minutes < 25) return 'var(--color-calendar-graph-day-L1-bg)';
  if (minutes < 60) return 'var(--color-calendar-graph-day-L2-bg)';
  if (minutes < 120) return 'var(--color-calendar-graph-day-L3-bg)';
  return 'var(--color-calendar-graph-day-L4-bg)';
}

function renderGraph() {
  DOM.graphContainer.innerHTML = '';
  DOM.monthsContainer.innerHTML = '';
  
  const stats = getSessionStatsByDate();
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 364);
  const startDay = startDate.getDay();
  // GH starts on Sunday
  startDate.setDate(startDate.getDate() - startDay);
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let currentMonth = -1;
  let monthSpans = [];
  
  window._totalMinsYear = 0;
  
  for (let week = 0; week < 53; week++) {
    const col = document.createElement('div');
    col.className = 'graph-week';
    
    const firstDayOfWeek = new Date(startDate);
    firstDayOfWeek.setDate(startDate.getDate() + (week * 7));
    if (firstDayOfWeek.getMonth() !== currentMonth && firstDayOfWeek.getDate() <= 14) {
      currentMonth = firstDayOfWeek.getMonth();
      monthSpans.push({ name: months[currentMonth], weekIndex: week });
    }
    
    for (let day = 0; day < 7; day++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + (week * 7) + day);
      if (cellDate > today) break;
      
      const dateStr = cellDate.toISOString().split('T')[0];
      const mins = stats[dateStr] || 0;
      window._totalMinsYear += mins;
      
      const cell = document.createElement('div');
      cell.className = 'graph-day';
      cell.style.backgroundColor = getColorLevel(mins);
      cell.dataset.date = dateStr;
      
      const formattedDate = cellDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      const tipText = mins === 0 ? `No contributions on ${formattedDate}` : `${mins} minutes of focus on ${formattedDate}`;
      
      cell.addEventListener('mouseenter', () => {
        if (!window.globalTooltip) {
          window.globalTooltip = document.createElement('div');
          window.globalTooltip.className = 'global-tooltip';
          document.body.appendChild(window.globalTooltip);
        }
        window.globalTooltip.textContent = tipText;
        window.globalTooltip.style.opacity = '1';
        
        const rect = cell.getBoundingClientRect();
        window.globalTooltip.style.top = (rect.top + window.scrollY - 30) + 'px';
        // Wait for next frame to measure tooltip width correctly for centering
        requestAnimationFrame(() => {
          const tipWidth = window.globalTooltip.offsetWidth;
          window.globalTooltip.style.left = (rect.left + window.scrollX + (rect.width / 2) - (tipWidth / 2)) + 'px';
        });
      });
      
      cell.addEventListener('mouseleave', () => {
        if (window.globalTooltip) window.globalTooltip.style.opacity = '0';
      });
      
      cell.addEventListener('click', () => {
        currentDate = new Date(dateStr);
        renderCalendar(currentDate);
        filterNotesByDate(dateStr);
        switchView('notes');
      });
      col.appendChild(cell);
    }
    DOM.graphContainer.appendChild(col);
  }
  
  monthSpans.forEach(m => {
    const span = document.createElement('span');
    span.textContent = m.name;
    span.style.position = 'absolute';
    span.style.left = `${m.weekIndex * 19}px`;
    span.className = 'text-small color-fg-muted';
    DOM.monthsContainer.appendChild(span);
  });
  
  const h2 = document.querySelector('.graph-panel').previousElementSibling;
  h2.textContent = `${Math.floor(window._totalMinsYear / 60)} hours of focus in the last year`;
  
  const wrapper = document.querySelector('.contribution-graph-wrapper');
  if (wrapper) wrapper.scrollLeft = wrapper.scrollWidth;
}

// --- Analytics & Study Tracker ---
let analyticsChart = null;

function renderAnalytics() {
  const canvas = document.getElementById('weekly-chart-canvas');
  if (!canvas) return;

  // Get last 7 days (including today)
  const last7Days = [];
  const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const dayNames = [];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const localYear = d.getFullYear();
    const localMonth = (d.getMonth() + 1).toString().padStart(2, '0');
    const localDay = d.getDate().toString().padStart(2, '0');
    const dateStr = `${localYear}-${localMonth}-${localDay}`;
    last7Days.push(dateStr);
    dayNames.push(daysOfWeek[d.getDay()]);
  }

  // Aggregate time per day from appData.sessions
  const focusTimePerDay = {};
  const breakTimePerDay = {};
  let totalFocusMins = 0;
  let totalBreakMins = 0;

  last7Days.forEach(date => {
    focusTimePerDay[date] = 0;
    breakTimePerDay[date] = 0;
  });

  if (appData.sessions) {
    appData.sessions.forEach(s => {
      if (s.date && focusTimePerDay[s.date] !== undefined) {
        if (s.type === 'focus' && s.completed) {
          focusTimePerDay[s.date] += s.duration;
          totalFocusMins += s.duration;
        } else if (s.type !== 'focus') {
          breakTimePerDay[s.date] += s.duration;
          totalBreakMins += s.duration;
        }
      }
    });
  }

  const chartData = last7Days.map(date => focusTimePerDay[date]);

  // Chart.js Configuration
  if (analyticsChart) {
    analyticsChart.destroy();
  }

  // Determine colors based on the theme
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark' || !document.documentElement.hasAttribute('data-theme');
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const textColor = isDark ? '#8b949e' : '#57606a'; // Primer text-muted
  const lineColor = '#2ea043'; // Primer success green

  const ctx = canvas.getContext('2d');
  analyticsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dayNames,
      datasets: [{
        label: 'Fokus (Menit)',
        data: chartData,
        borderColor: lineColor,
        backgroundColor: 'rgba(46, 160, 67, 0.2)', // Light green fill
        borderWidth: 2,
        pointBackgroundColor: lineColor,
        pointBorderColor: isDark ? '#0d1117' : '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 0,
        pointHitRadius: 15,
        pointHoverRadius: 6,
        clip: false,
        fill: true,
        tension: 0.3 // Smooth curves
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          yAlign: 'bottom',
          backgroundColor: isDark ? '#161b22' : '#ffffff',
          titleColor: isDark ? '#c9d1d9' : '#24292f',
          bodyColor: isDark ? '#8b949e' : '#57606a',
          borderColor: isDark ? '#30363d' : '#d0d7de',
          borderWidth: 1,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return context.parsed.y + ' Menit';
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            color: textColor,
            font: {
              family: 'JetBrains Mono',
              size: 10
            }
          }
        },
        y: {
          beginAtZero: true,
          suggestedMax: 60,
          grid: {
            color: gridColor,
            drawBorder: false,
            borderDash: [3, 3]
          },
          ticks: {
            color: textColor,
            font: {
              family: 'JetBrains Mono',
              size: 10
            },
            stepSize: 20
          }
        }
      }
    }
  });

  // Populate Right Column statistics
  document.getElementById('analytics-total-time').textContent = `${totalFocusMins}m`;
  const averageMins = Math.round(totalFocusMins / 7);
  document.getElementById('analytics-daily-average').textContent = `${averageMins}m/hari`;

  // Focus vs Break Ratio
  const totalRatioMins = totalFocusMins + totalBreakMins;
  const focusPercent = totalRatioMins > 0 ? Math.round((totalFocusMins / totalRatioMins) * 100) : 100;
  const breakPercent = 100 - focusPercent;
  
  const ratioFocusBar = document.getElementById('analytics-ratio-focus');
  if (ratioFocusBar) {
    ratioFocusBar.style.width = `${focusPercent}%`;
  }
  const ratioText = document.getElementById('analytics-ratio-text');
  if (ratioText) {
    ratioText.textContent = `${focusPercent}:${breakPercent}`;
  }
}

// --- Calendar ---
function renderCalendar(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  DOM.calMonthLabel.textContent = `${months[month]} ${year}`;
  
  DOM.calGrid.innerHTML = '';
  const firstDay = new Date(year, month, 1).getDay();
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const stats = getSessionStatsByDate();
  
  for (let i = 0; i < adjustedFirstDay; i++) {
    const cell = document.createElement('div');
    cell.className = 'cal-day empty';
    DOM.calGrid.appendChild(cell);
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    const cellDate = new Date(year, month, i);
    const dateStr = cellDate.toISOString().split('T')[0];
    const isToday = cellDate.toDateString() === today.toDateString();
    
    const cell = document.createElement('div');
    cell.className = `cal-day ${isToday ? 'today' : ''}`;
    cell.textContent = i;
    
    if (stats[dateStr] && stats[dateStr] > 0) {
      const dot = document.createElement('span');
      dot.className = 'activity-dot';
      // override dot color
      dot.style.backgroundColor = 'var(--color-success-fg)';
      cell.appendChild(dot);
    }
    
    cell.addEventListener('click', () => {
      document.querySelectorAll('.cal-day').forEach(c => c.classList.remove('active'));
      cell.classList.add('active');
      filterNotesByDate(dateStr);
      switchView('notes');
    });
    DOM.calGrid.appendChild(cell);
  }
}

// --- Notes ---
function renderNotes(filterDate = null) {
  DOM.notesList.innerHTML = '';
  DOM.notesEmpty.style.display = 'none';
  
  let displayedNotes = appData.notes;
  if (filterDate) {
    displayedNotes = appData.notes.filter(n => n.date === filterDate);
    const dateObj = new Date(filterDate);
    DOM.filterLabel.textContent = `Notes on ${dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    DOM.notesFilterDiv.style.display = 'flex';
  } else {
    DOM.notesFilterDiv.style.display = 'none';
  }
  
  if (displayedNotes.length === 0) {
    DOM.notesEmpty.style.display = 'block';
    DOM.notesList.appendChild(DOM.notesEmpty);
    return;
  }
  
  displayedNotes.sort((a, b) => b.updatedAt - a.updatedAt);
  
  displayedNotes.forEach(note => {
    const card = document.createElement('div');
    card.className = 'note-card d-flex flex-column';
    card.dataset.id = note.id;
    
    let previewText = '';
    const textBlocks = note.blocks.filter(b => b.type === 'text' || b.type === 'checkbox');
    if (textBlocks.length > 0) {
      previewText = textBlocks.slice(0, 2).map(b => b.content).join(' ');
    } else {
      previewText = 'No text content.';
    }
    
    const dateStr = new Date(note.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const tagsHtml = (note.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('');
    
    card.innerHTML = `
      <div class="d-flex flex-justify-between flex-items-start mb-1">
        <h3 class="note-card-title m-0">${note.title || 'Untitled Note'}</h3>
        <span class="note-card-date">${dateStr}</span>
      </div>
      <p class="note-card-preview m-0">${previewText}</p>
      <div class="d-flex flex-wrap gap-1 mt-auto">
        ${tagsHtml}
      </div>
      <button class="btn btn-sm btn-danger mt-2 align-self-start note-delete-btn" data-id="${note.id}">
        Delete
      </button>
    `;
    
    card.addEventListener('click', (e) => {
      if (e.target.closest('.note-delete-btn')) deleteNote(note.id);
      else openNoteEditor(note);
    });
    DOM.notesList.appendChild(card);
  });
  
  // Stagger animation for rendered notes
  anime({
    targets: '.note-card',
    translateY: [20, 0],
    opacity: [0, 1],
    delay: anime.stagger(50),
    easing: 'easeOutQuart',
    duration: 600
  });
}

function filterNotesByDate(dateStr) {
  renderNotes(dateStr);
}

function openNoteEditor(note = null) {
  DOM.noteContent.innerHTML = '';
  DOM.noteTagsContainer.innerHTML = '';
  DOM.noteTagInput.value = '';
  
  const coverArea = document.getElementById('note-cover-area');
  const btnAddCover = document.getElementById('btn-add-cover');
  
  if (note) {
    currentNoteId = note.id;
    currentNoteCover = note.coverImage || null;
    DOM.noteTitle.value = note.title;
    (note.tags || []).forEach(tag => addTagToUI(tag));
    note.blocks.forEach(block => addNoteBlock(block.type, block.content, block.checked));
  } else {
    currentNoteId = null;
    currentNoteCover = null;
    DOM.noteTitle.value = '';
    addNoteBlock('text');
  }
  
  if (currentNoteCover) {
    coverArea.style.backgroundImage = 'url(' + currentNoteCover + ')';
    coverArea.style.display = 'block';
    if(btnAddCover) btnAddCover.style.display = 'none';
  } else {
    coverArea.style.display = 'none';
    coverArea.style.backgroundImage = '';
    if(btnAddCover) btnAddCover.style.display = 'inline-block';
  }
  
  DOM.noteEditor.style.display = 'flex';
}

function addTagToUI(tagText) {
  const tagEl = document.createElement('span');
  tagEl.className = 'IssueLabel color-bg-attention-emphasis color-fg-on-emphasis d-flex flex-items-center gap-1';
  tagEl.innerHTML = `${tagText} <button class="btn-octicon p-0 color-fg-on-emphasis tag-remove"><svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/></svg></button>`;
  tagEl.querySelector('.tag-remove').addEventListener('click', () => tagEl.remove());
  DOM.noteTagsContainer.appendChild(tagEl);
}

function addNoteBlock(type, content = '', checked = false) {
  const block = document.createElement('div');
  block.className = 'content-block';
  block.dataset.type = type;
  
  let innerHtml = '';
  if (type === 'text') {
    innerHtml = `<textarea class="text-block-input" placeholder="Type here..." rows="1">${content}</textarea>`;
  } else if (type === 'checkbox') {
    innerHtml = `
      <div class="checkbox-block">
        <input type="checkbox" class="checkbox-input" ${checked ? 'checked' : ''} />
        <input type="text" class="checkbox-text-input" placeholder="Task..." value="${content}" />
      </div>
    `;
  } else if (type === 'image') {
    innerHtml = `<div class="image-block" style="text-align: center;"><img src="${content}" style="max-width: 100%; border-radius: 6px; max-height: 400px; object-fit: contain;" /></div>`;
  }
  
  block.innerHTML = innerHtml + `
    <button class="block-action-btn delete" title="Delete block"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/></svg></button>
  `;
  
  if (type === 'text') {
    const ta = block.querySelector('textarea');
    setTimeout(() => { ta.style.height = 'auto'; ta.style.height = (ta.scrollHeight) + 'px'; }, 0);
    ta.addEventListener('input', function() { this.style.height = 'auto'; this.style.height = (this.scrollHeight) + 'px'; });
    ta.addEventListener('keydown', function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addNoteBlock('text'); } });
  } else if (type === 'checkbox') {
    const input = block.querySelector('.checkbox-text-input');
    input.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); addNoteBlock('checkbox'); } });
  }
  
  block.querySelector('.delete').addEventListener('click', () => block.remove());
  DOM.noteContent.appendChild(block);
  
  const focusInput = block.querySelector('textarea, input[type="text"]');
  if (focusInput) focusInput.focus();
}

function saveNote() {
    const title = DOM.noteTitle.value.trim();
    const blocks = [];
    
    DOM.noteContent.querySelectorAll('.content-block').forEach(el => {
      const type = el.dataset.type;
      if (type === 'text') {
        const content = el.querySelector('textarea').value.trim();
        if (content) blocks.push({ type, content });
      } else if (type === 'checkbox') {
        const content = el.querySelector('.checkbox-text-input').value.trim();
        const checked = el.querySelector('.checkbox-input').checked;
        if (content) blocks.push({ type, content, checked });
      } else if (type === 'image') {
        const img = el.querySelector('img');
        if (img && img.src) blocks.push({ type, content: img.src });
      }
    });
    
    const tags = Array.from(DOM.noteTagsContainer.querySelectorAll('.IssueLabel')).map(el => el.textContent.trim());
    
    if (!title && blocks.length === 0 && !currentNoteCover) {
      DOM.noteEditor.style.display = 'none';
      return;
    }
    
    if (currentNoteId) {
      const note = appData.notes.find(n => n.id === currentNoteId);
      if (note) {
        note.title = title;
        note.blocks = blocks;
        note.tags = tags;
        note.coverImage = currentNoteCover;
        note.updatedAt = Date.now();
      }
    } else {
      appData.notes.push({
        id: generateId(),
        title,
        blocks,
        tags,
        coverImage: currentNoteCover,
        date: new Date().toISOString().split('T')[0],
        updatedAt: Date.now()
      });
    }
    
    saveData();
    renderNotes();
    DOM.noteEditor.style.display = 'none';
  }

  function deleteNote(id) {
  if (confirm('Are you sure you want to delete this note?')) {
    appData.notes = appData.notes.filter(n => n.id !== id);
    saveData();
    renderNotes();
    showToast('Note deleted.');
  }
}

// --- Settings ---
function updateSettingsUI() {
  DOM.settingFocus.value = appData.settings.focusDuration;
  DOM.settingShort.value = appData.settings.shortBreakDuration;
  DOM.settingLong.value = appData.settings.longBreakDuration;
  DOM.settingNotif.checked = appData.settings.notifications;
  DOM.settingSound.checked = appData.settings.sound;
  DOM.settingAutoStart.checked = !!appData.settings.autoStart;
  DOM.settingTheme.value = appData.settings.theme || 'dark';
  if (DOM.settingLanguage) DOM.settingLanguage.value = appData.settings.language || 'id';
  document.documentElement.setAttribute('data-theme', appData.settings.theme || 'dark');
}

function saveSettings() {
  appData.settings = {
    focusDuration: parseInt(DOM.settingFocus.value) || 25,
    shortBreakDuration: parseInt(DOM.settingShort.value) || 5,
    longBreakDuration: parseInt(DOM.settingLong.value) || 15,
    notifications: DOM.settingNotif.checked,
    sound: DOM.settingSound.checked,
    autoStart: DOM.settingAutoStart.checked,
    theme: DOM.settingTheme.value,
    language: DOM.settingLanguage ? DOM.settingLanguage.value : (appData.settings.language || 'id')
  };
  document.documentElement.setAttribute('data-theme', appData.settings.theme);
  if (window.applyLanguage) window.applyLanguage();
  saveData();
  if (timerState.status === 'idle') setTimerType(timerState.type);
  showToast('Settings saved.');
}

function exportData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", `sue-export-${new Date().toISOString().split('T')[0]}.json`);
  dlAnchorElem.click();
}

function clearData() {
  if (confirm('WARNING: This will permanently delete all your data. Continue?')) {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }
}

// --- Setup Event Listeners ---
function setupEventListeners() {
  DOM.navBtns.forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
  
  DOM.btnStartPause.addEventListener('click', toggleTimer);
  DOM.btnReset.addEventListener('click', resetTimer);
  DOM.btnSkip.addEventListener('click', () => completeTimer(true));
  DOM.btnMiniMode.addEventListener('click', toggleMiniMode);
  const restoreBtn = document.getElementById('btn-mini-mode-restore');
  if (restoreBtn) restoreBtn.addEventListener('click', toggleMiniMode);
  
  DOM.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      if (timerState.status === 'running') {
        if (confirm('Timer is running. Switch mode?')) {
          pauseTimer();
          setTimerType(tab.dataset.type);
        }
      } else {
        setTimerType(tab.dataset.type);
      }
    });
  });
  
  DOM.profileName.addEventListener('blur', () => {
    appData.profile.name = DOM.profileName.textContent;
    saveData();
    updateProfileUI();
  });
  DOM.profileName.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); DOM.profileName.blur(); } });
  
  if(DOM.editNameIcon) {
    DOM.editNameIcon.addEventListener('click', () => {
      DOM.profileName.focus();
      // Posisikan kursor di akhir teks
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(DOM.profileName);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    });
  }
  
  DOM.avatarOverlay = document.getElementById('avatar-overlay');
  if (DOM.avatarOverlay) DOM.avatarOverlay.addEventListener('click', () => DOM.avatarInput.click());
  DOM.avatarInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) return showToast('Max file size is 25MB', 'error');
      const reader = new FileReader();
      reader.onload = async (event) => {
        appData.profile.avatar = event.target.result;
        await saveAvatarToDB(event.target.result);
        saveData();
        updateProfileUI();
        showToast('Avatar updated');
      };
      reader.readAsDataURL(file);
    }
  });
  
  DOM.calPrevBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(currentDate); });
  DOM.calNextBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(currentDate); });
  
  DOM.btnAddNote.addEventListener('click', () => openNoteEditor());
  DOM.btnNoteClose.addEventListener('click', () => DOM.noteEditor.style.display = 'none');
  DOM.btnNoteSave.addEventListener('click', saveNote);
  DOM.noteToolbarBtns.forEach(btn => btn.addEventListener('click', () => {
    if(btn.dataset.action === 'image') {
      const imageInput = document.getElementById('note-image-input');
      if(imageInput) imageInput.click();
    } else {
      addNoteBlock(btn.dataset.action);
    }
  }));

  const coverInput = document.getElementById('note-cover-input');
  const btnAddCover = document.getElementById('btn-add-cover');
  const btnChangeCover = document.getElementById('btn-change-cover');
  const coverArea = document.getElementById('note-cover-area');
  const imageInput = document.getElementById('note-image-input');

  if (btnAddCover) btnAddCover.addEventListener('click', () => coverInput.click());
  if (btnChangeCover) btnChangeCover.addEventListener('click', () => coverInput.click());

  if (coverInput) {
    coverInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          currentNoteCover = ev.target.result;
          coverArea.style.backgroundImage = "url(" + currentNoteCover + ")";
          coverArea.style.display = 'block';
          btnAddCover.style.display = 'none';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          addNoteBlock('image', ev.target.result);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  DOM.noteTagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = e.target.value.trim();
      if (val) { addTagToUI(val); e.target.value = ''; }
    }
  });
  DOM.filterClear.addEventListener('click', () => renderNotes());
  
  DOM.settingFocus.addEventListener('change', saveSettings);
  DOM.settingShort.addEventListener('change', saveSettings);
  DOM.settingLong.addEventListener('change', saveSettings);
  DOM.settingNotif.addEventListener('change', saveSettings);
  DOM.settingSound.addEventListener('change', saveSettings);
  DOM.settingAutoStart.addEventListener('change', saveSettings);
  DOM.settingTheme.addEventListener('change', saveSettings);
  if (DOM.settingLanguage) DOM.settingLanguage.addEventListener('change', saveSettings);
  DOM.btnExport.addEventListener('click', exportData);
  DOM.btnClear.addEventListener('click', clearData);
  
  window.addEventListener('resize', () => {
    if (currentView === 'timer') {
      const wrapper = document.querySelector('.contribution-graph-wrapper');
      if (wrapper) wrapper.scrollLeft = wrapper.scrollWidth;
    }
  });
  
  // --- Header Nav Links ---
  document.querySelectorAll('.AppHeader-nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchView(link.dataset.view);
    });
  });
  
  // --- Header Create Button ---
  const createBtn = document.getElementById('header-create-btn');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      switchView('notes');
      openNoteEditor();
    });
  }
  
  // --- Header Notification Bell (toggle notifications) ---
  const notifBtn = document.getElementById('header-notif-btn');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission().then(perm => {
          showToast(perm === 'granted' ? 'Notifications enabled!' : 'Notifications blocked.', perm === 'granted' ? 'success' : 'error');
        });
      } else {
        showToast('Notifications are already enabled.');
      }
    });
  }
}

// --- Header Timer Status ---
function updateHeaderTimerStatus() {
  const dot = document.getElementById('header-status-dot');
  const text = document.getElementById('header-status-text');
  if (!dot || !text) return;
  
  dot.className = 'status-dot';
  
  if (timerState.status === 'running') {
    dot.classList.add('running');
    const m = Math.floor(timerState.timeLeft / 60);
    const s = timerState.timeLeft % 60;
    const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    const typeLabel = timerState.type === 'focus' ? 'Focus' : 'Break';
    text.textContent = `${typeLabel} · ${timeStr}`;
  } else if (timerState.status === 'paused') {
    dot.classList.add('paused');
    text.textContent = 'Paused';
  } else {
    text.textContent = 'Idle';
  }
}

document.addEventListener('DOMContentLoaded', init);

