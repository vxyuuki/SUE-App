const fs = require('fs');

let js = fs.readFileSync('main.js', 'utf8');

const saveNoteStr = `function saveNote() {
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
        id: crypto.randomUUID(),
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
  }`;

// Find the old saveNote function
const startIdx = js.indexOf('function saveNote() {');
const endIdx = js.indexOf('function deleteNote(id)', startIdx);
if (startIdx !== -1 && endIdx !== -1) {
  js = js.substring(0, startIdx) + saveNoteStr + '\n\n  ' + js.substring(endIdx);
  fs.writeFileSync('main.js', js, 'utf8');
} else {
  console.error("Could not patch saveNote");
}

