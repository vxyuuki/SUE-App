const fs = require('fs');

// --- 1. PATCH INDEX.HTML ---
let html = fs.readFileSync('index.html', 'utf8');

// Add Flashcards Nav Link
html = html.replace(
  '<a class="AppHeader-nav-link" href="#" data-view="settings">Settings</a>',
  '<a class="AppHeader-nav-link" href="#" data-view="flashcards">Flashcards</a>\n          <a class="AppHeader-nav-link" href="#" data-view="settings">Settings</a>'
);

// Add Flashcards Section
const flashcardsSection = `
      <!-- View: Flashcards -->
      <section class="view" id="view-flashcards" style="display:none;">
        <div class="d-flex flex-justify-between flex-items-center mb-4">
          <div class="Subhead mb-0 border-bottom-0">
            <h2 class="Subhead-heading">Flashcards</h2>
            <div class="Subhead-description">Memorize anything with spaced repetition.</div>
          </div>
          <div>
            <button class="btn btn-primary" id="btn-add-flashcard">Add Card</button>
            <button class="btn btn-outline color-fg-success" id="btn-study-flashcards">Study Now</button>
          </div>
        </div>

        <div class="Box">
          <div class="Box-header">
            <h3 class="Box-title" id="flashcards-count-title">Your Cards (0)</h3>
          </div>
          <div class="flashcards-list" id="flashcards-list">
            <!-- Cards will be rendered here -->
          </div>
        </div>

        <!-- Add Flashcard Modal -->
        <div class="note-editor-overlay" id="flashcard-editor-overlay" style="display:none; align-items:center; justify-content:center;">
          <div class="Box" style="width: 500px; max-width: 90vw; background: var(--color-canvas-default);">
            <div class="Box-header">
              <h3 class="Box-title">Add Flashcard</h3>
            </div>
            <div class="Box-body">
              <div class="form-group mt-0">
                <div class="form-group-header"><label>Front (Question)</label></div>
                <div class="form-group-body">
                  <textarea class="form-control" id="fc-front" style="width:100%;" rows="3"></textarea>
                </div>
              </div>
              <div class="form-group">
                <div class="form-group-header"><label>Back (Answer)</label></div>
                <div class="form-group-body">
                  <textarea class="form-control" id="fc-back" style="width:100%;" rows="3"></textarea>
                </div>
              </div>
            </div>
            <div class="Box-footer text-right">
              <button class="btn mr-1" id="btn-close-fc-editor">Cancel</button>
              <button class="btn btn-primary" id="btn-save-fc">Save</button>
            </div>
          </div>
        </div>

        <!-- Study Mode Modal -->
        <div class="note-editor-overlay" id="study-mode-overlay" style="display:none; flex-direction:column; align-items:center; justify-content:center; background: var(--color-canvas-default);">
          <button class="btn btn-invisible position-absolute top-0 right-0 m-3" id="btn-close-study">
            <svg class="octicon" width="24" height="24" viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" /></svg>
          </button>
          
          <h2 class="mb-4" id="study-progress-text">Study Session</h2>
          
          <div class="swipe-container" id="swipe-container">
            <!-- Active cards injected here -->
          </div>
          
          <div class="d-flex justify-content-between mt-4" style="width: 300px; gap: 20px;">
            <button class="btn btn-danger flex-1" id="btn-swipe-left" style="flex:1;">← Belum Hafal</button>
            <button class="btn btn-success flex-1" id="btn-swipe-right" style="flex:1;">Sudah Hafal →</button>
          </div>
          
          <div id="study-complete-msg" style="display:none; text-align:center;">
            <h1 class="color-fg-success mb-2">Hebat! 🎉</h1>
            <p>Anda sudah menghafal semuanya untuk sesi ini.</p>
            <button class="btn btn-primary mt-3" id="btn-study-done">Kembali</button>
          </div>
        </div>
      </section>
`;
html = html.replace('<!-- View: Settings -->', flashcardsSection + '\n      <!-- View: Settings -->');
fs.writeFileSync('index.html', html, 'utf8');


// --- 2. PATCH STYLE.CSS ---
let css = fs.readFileSync('style.css', 'utf8');
const flashcardCss = `
/* Flashcards */
.flashcard-item { padding: 12px 16px; border-bottom: 1px solid var(--color-border-default); display: flex; justify-content: space-between; align-items: center; }
.flashcard-item:last-child { border-bottom: none; }
.flashcard-front { font-weight: 600; margin-bottom: 4px; }
.flashcard-back { font-size: 12px; color: var(--color-fg-muted); }

.swipe-container {
  width: 300px;
  height: 400px;
  position: relative;
  perspective: 1000px;
}

.swipe-card {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background: var(--color-canvas-overlay);
  border: 1px solid var(--color-border-default);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 24px;
  text-align: center;
  cursor: grab;
  user-select: none;
  transform-origin: 50% 100%;
  transition: transform 0.3s ease, opacity 0.3s ease;
  will-change: transform;
}

.swipe-card.is-dragging {
  transition: none;
  cursor: grabbing;
}

.swipe-card-content {
  font-size: 20px;
  font-weight: 600;
  word-break: break-word;
}

.swipe-card-hint {
  position: absolute;
  bottom: 20px;
  font-size: 12px;
  color: var(--color-fg-muted);
}
`;
if (!css.includes('/* Flashcards */')) {
  fs.writeFileSync('style.css', css + '\n' + flashcardCss, 'utf8');
}


// --- 3. PATCH MAIN.JS ---
let js = fs.readFileSync('main.js', 'utf8');

// Add default flashcards data
js = js.replace('notes: [] // { id, title, blocks: [], tags: [], date, updatedAt }', 'notes: [],\n  flashcards: []');

// Inject flashcard logic
const jsLogic = `
// --- Flashcards Logic ---
let studyQueue = [];
let currentCardEl = null;
let isDragging = false;
let startX = 0, currentX = 0;

function renderFlashcardsList() {
  const list = document.getElementById('flashcards-list');
  const countTitle = document.getElementById('flashcards-count-title');
  if(!list) return;
  
  if (!appData.flashcards) appData.flashcards = [];
  countTitle.textContent = \`Your Cards (\${appData.flashcards.length})\`;
  
  if (appData.flashcards.length === 0) {
    list.innerHTML = '<div class="p-4 text-center color-fg-muted">Belum ada flashcard. Silakan tambah baru.</div>';
    return;
  }
  
  list.innerHTML = '';
  appData.flashcards.forEach(card => {
    const el = document.createElement('div');
    el.className = 'flashcard-item';
    el.innerHTML = \`
      <div>
        <div class="flashcard-front">\${card.front}</div>
        <div class="flashcard-back">\${card.back}</div>
      </div>
      <button class="btn-octicon color-fg-danger btn-del-fc" data-id="\${card.id}">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/></svg>
      </button>
    \`;
    list.appendChild(el);
  });
  
  list.querySelectorAll('.btn-del-fc').forEach(btn => {
    btn.addEventListener('click', () => {
      if(confirm('Hapus kartu ini?')) {
        appData.flashcards = appData.flashcards.filter(c => c.id !== btn.dataset.id);
        saveData();
        renderFlashcardsList();
      }
    });
  });
}

function startStudySession() {
  if (!appData.flashcards || appData.flashcards.length === 0) {
    alert('Tambahkan kartu terlebih dahulu!');
    return;
  }
  // Shuffle cards
  studyQueue = [...appData.flashcards].sort(() => Math.random() - 0.5);
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
  document.getElementById('study-progress-text').textContent = \`Tersisa: \${studyQueue.length} kartu\`;
  
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
  card.innerHTML = \`
    <div class="swipe-card-content" id="active-card-text">\${cardData.front}</div>
    <div class="swipe-card-hint">Klik untuk melihat jawaban</div>
  \`;
  
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
  currentCardEl.style.transform = \`translateX(\${currentX}px) rotate(\${rotate}deg)\`;
  
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
  currentCardEl.style.transform = \`translateX(\${direction === 'right' ? 1000 : -1000}px)\`;
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
    if(front && back) {
      if(!appData.flashcards) appData.flashcards = [];
      appData.flashcards.push({ id: generateId(), front, back });
      saveData();
      renderFlashcardsList();
      document.getElementById('flashcard-editor-overlay').style.display = 'none';
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
`;

// Inject the logic before `function init()`
js = js.replace('function init() {', jsLogic + '\n\nfunction init() {');

// Inject the setup and render inside init()
js = js.replace('setupEventListeners();', 'setupEventListeners();\n  setupFlashcardListeners();\n  renderFlashcardsList();');

// Also need to handle switchView to call renderFlashcardsList?
// renderFlashcardsList is fast enough, we just call it on init.

fs.writeFileSync('main.js', js, 'utf8');
