const fs = require('fs');

// --- 1. PATCH INDEX.HTML ---
let html = fs.readFileSync('index.html', 'utf8');

const newFlashcardHTML = `
      <!-- View: Flashcards -->
      <section class="view" id="view-flashcards">
        <!-- Default State: List of Decks -->
        <div id="flashcard-decks-view">
          <div class="d-flex flex-justify-between flex-items-center mb-4">
            <div>
              <h2 style="font-size: 24px; font-weight: 400; margin-bottom: 4px;">Flashcards</h2>
              <p style="color: var(--color-fg-muted); font-size: 14px; margin: 0;">Organize and memorize with spaced repetition.</p>
            </div>
            <div>
              <button class="btn btn-primary" id="btn-add-deck">Create Folder</button>
            </div>
          </div>

          <div class="Box">
            <div class="Box-header">
              <h3 class="Box-title" id="decks-count-title">Your Folders (0)</h3>
            </div>
            <div class="flashcards-list" id="decks-list">
              <!-- Decks rendered here -->
            </div>
          </div>
        </div>

        <!-- Inside Deck State -->
        <div id="flashcard-single-deck-view" style="display:none;">
          <div class="mb-4">
            <button class="btn btn-sm btn-invisible px-0 mb-2" id="btn-back-to-decks" style="color: var(--color-accent-fg); font-weight: 600;">
              ← Back to Folders
            </button>
            <div class="d-flex flex-justify-between flex-items-center">
              <div>
                <h2 style="font-size: 24px; font-weight: 400; margin-bottom: 4px;" id="current-deck-title">Folder Name</h2>
                <p style="color: var(--color-fg-muted); font-size: 14px; margin: 0;" id="current-deck-count">0 cards</p>
              </div>
              <div>
                <button class="btn btn-primary" id="btn-add-flashcard">Add Card</button>
                <button class="btn btn-outline color-fg-success" id="btn-study-flashcards">Study Now</button>
              </div>
            </div>
          </div>

          <div class="Box">
            <div class="flashcards-list" id="flashcards-list">
              <!-- Cards will be rendered here -->
            </div>
          </div>
        </div>

        <!-- Add Deck Modal -->
        <div class="note-editor-overlay" id="deck-editor-overlay" style="display:none; align-items:center; justify-content:center;">
          <div class="Box" style="width: 400px; max-width: 90vw; background: var(--color-canvas-default);">
            <div class="Box-header"><h3 class="Box-title">Create Folder</h3></div>
            <div class="Box-body">
              <div class="form-group mt-0">
                <div class="form-group-header"><label>Folder Name</label></div>
                <div class="form-group-body"><input class="form-control" type="text" id="deck-name" style="width:100%;" /></div>
              </div>
            </div>
            <div class="Box-footer" style="display: flex; justify-content: flex-end; gap: 12px; padding: 16px; border-top: 1px solid var(--color-border-default);">
              <button class="btn" id="btn-close-deck-editor" style="height: 32px; padding: 0 16px; min-width: 80px;">Cancel</button>
              <button class="btn btn-primary" id="btn-save-deck" style="height: 32px; padding: 0 16px; min-width: 80px;">Save</button>
            </div>
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
            <div class="Box-footer" style="display: flex; justify-content: flex-end; gap: 12px; padding: 16px; border-top: 1px solid var(--color-border-default);">
              <button class="btn" id="btn-close-fc-editor" style="height: 32px; padding: 0 16px; min-width: 80px; display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box;">Cancel</button>
              <button class="btn btn-primary" id="btn-save-fc" style="height: 32px; padding: 0 16px; min-width: 80px; display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box;">Save</button>
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

const startIndexHtml = html.indexOf('<section class="view" id="view-flashcards"');
const endIndexHtml = html.indexOf('<!-- View: Settings -->');
if (startIndexHtml !== -1 && endIndexHtml !== -1) {
  html = html.substring(0, startIndexHtml) + newFlashcardHTML + '\n      ' + html.substring(endIndexHtml);
  fs.writeFileSync('index.html', html, 'utf8');
} else {
  console.error("Could not find flashcards section in index.html");
}


// --- 2. PATCH MAIN.JS ---
let js = fs.readFileSync('main.js', 'utf8');

const newFlashcardJS = `
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
        id: crypto.randomUUID(),
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
    
    countTitle.textContent = \`Your Folders (\${appData.decks.length})\`;
    
    if (appData.decks.length === 0) {
      list.innerHTML = '<div class="p-4 text-center color-fg-muted">Belum ada folder flashcard. Silakan buat folder baru.</div>';
      return;
    }
    
    list.innerHTML = '';
    appData.decks.forEach(deck => {
      const el = document.createElement('div');
      el.className = 'flashcard-item';
      el.style.cursor = 'pointer';
      el.innerHTML = \`
        <div style="flex: 1;">
          <div class="flashcard-front">📁 \${deck.name}</div>
          <div class="flashcard-back">\${deck.cards ? deck.cards.length : 0} cards</div>
        </div>
        <button class="btn-octicon color-fg-danger btn-del-deck" data-id="\${deck.id}">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/></svg>
        </button>
      \`;
      
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
    renderFlashcardsList();
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
    document.getElementById('current-deck-count').textContent = \`\${deck.cards.length} cards\`;
    
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
          deck.cards = deck.cards.filter(c => c.id !== btn.dataset.id);
          saveData();
          renderFlashcardsList();
        }
      });
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
        appData.decks.push({ id: crypto.randomUUID(), name, cards: [] });
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
          deck.cards.push({ id: crypto.randomUUID(), front, back });
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
`;

const startJs = js.indexOf('// --- Flashcards Logic ---');
const endJs = js.indexOf('function init() {');

if (startJs !== -1 && endJs !== -1) {
  js = js.substring(0, startJs) + newFlashcardJS + '\n\n' + js.substring(endJs);
  // Also fix renderFlashcardsList to renderDecksList in init
  js = js.replace('renderFlashcardsList();', 'renderDecksList();');
  fs.writeFileSync('main.js', js, 'utf8');
} else {
  console.error("Could not find flashcards logic block in main.js");
}
