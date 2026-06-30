const fs = require('fs');

let content = fs.readFileSync('main.js', 'utf8');

content = content.replace('let currentNoteId = null;', 'let currentNoteId = null;\nlet currentNoteCover = null;');

const openOld = `function openNoteEditor(note = null) {
  DOM.noteContent.innerHTML = '';
  DOM.noteTagsContainer.innerHTML = '';
  DOM.noteTagInput.value = '';
  
  if (note) {
    currentNoteId = note.id;
    DOM.noteTitle.value = note.title;
    (note.tags || []).forEach(tag => addTagToUI(tag));
    note.blocks.forEach(block => addNoteBlock(block.type, block.content, block.checked));
  } else {
    currentNoteId = null;
    DOM.noteTitle.value = '';
    addNoteBlock('text');
  }
  DOM.noteEditor.style.display = 'flex';
}`;

const openNew = `function openNoteEditor(note = null) {
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
}`;

content = content.replace(openOld, openNew);


const addOld = `function addNoteBlock(type, content = '', checked = false) {
  const block = document.createElement('div');
  block.className = 'content-block';
  block.dataset.type = type;
  
  let innerHtml = '';
  if (type === 'text') {
    innerHtml = \`<textarea class="text-block-input" placeholder="Type here..." rows="1">\${content}</textarea>\`;
  } else if (type === 'checkbox') {
    innerHtml = \`
      <div class="checkbox-block">
        <input type="checkbox" class="checkbox-input" \${checked ? 'checked' : ''} />
        <input type="text" class="checkbox-text-input" placeholder="Task..." value="\${content}" />
      </div>
    \`;
  }
  
  block.innerHTML = innerHtml + \`
    <button class="block-action-btn delete" title="Delete block"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/></svg></button>
  \`;`;

const addNew = `function addNoteBlock(type, content = '', checked = false) {
  const block = document.createElement('div');
  block.className = 'content-block';
  block.dataset.type = type;
  
  let innerHtml = '';
  if (type === 'text') {
    innerHtml = \`<textarea class="text-block-input" placeholder="Type here..." rows="1">\${content}</textarea>\`;
  } else if (type === 'checkbox') {
    innerHtml = \`
      <div class="checkbox-block">
        <input type="checkbox" class="checkbox-input" \${checked ? 'checked' : ''} />
        <input type="text" class="checkbox-text-input" placeholder="Task..." value="\${content}" />
      </div>
    \`;
  } else if (type === 'image') {
    innerHtml = \`<div class="image-block" style="text-align: center;"><img src="\${content}" style="max-width: 100%; border-radius: 6px; max-height: 400px; object-fit: contain;" /></div>\`;
  }
  
  block.innerHTML = innerHtml + \`
    <button class="block-action-btn delete" title="Delete block"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/></svg></button>
  \`;`;

content = content.replace(addOld, addNew);


const saveOld = `    DOM.noteContent.querySelectorAll('.content-block').forEach(el => {
      const type = el.dataset.type;
      if (type === 'text') {
        const content = el.querySelector('textarea').value.trim();
        if (content) blocks.push({ type, content });
      } else if (type === 'checkbox') {
        const content = el.querySelector('.checkbox-text-input').value.trim();
        const checked = el.querySelector('.checkbox-input').checked;
        if (content) blocks.push({ type, content, checked });
      }
    });`;

const saveNew = `    DOM.noteContent.querySelectorAll('.content-block').forEach(el => {
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
    });`;

content = content.replace(saveOld, saveNew);

const newNotePushOld = `appData.notes.unshift({ id: generateId(), title, blocks, tags, date: currentDate.toISOString().split('T')[0], updatedAt: new Date().toISOString() });`;
const newNotePushNew = `appData.notes.unshift({ id: generateId(), title, blocks, tags, date: currentDate.toISOString().split('T')[0], updatedAt: new Date().toISOString(), coverImage: currentNoteCover });`;
content = content.replace(newNotePushOld, newNotePushNew);

const updateNoteOld = `appData.notes[idx] = { ...appData.notes[idx], title, blocks, tags, updatedAt: new Date().toISOString() };`;
const updateNoteNew = `appData.notes[idx] = { ...appData.notes[idx], title, blocks, tags, updatedAt: new Date().toISOString(), coverImage: currentNoteCover };`;
content = content.replace(updateNoteOld, updateNoteNew);


const listeners = `
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
`;

const replaceStr = "DOM.noteToolbarBtns.forEach(btn => btn.addEventListener('click', () => {\n" +
  "    if(btn.dataset.action === 'image') {\n" +
  "      const imageInput = document.getElementById('note-image-input');\n" +
  "      if(imageInput) imageInput.click();\n" +
  "    } else {\n" +
  "      addNoteBlock(btn.dataset.action);\n" +
  "    }\n" +
  "  }));\n" +
  listeners;

content = content.replace("DOM.noteToolbarBtns.forEach(btn => btn.addEventListener('click', () => addNoteBlock(btn.dataset.action)));", replaceStr);


fs.writeFileSync('main.js', content, 'utf8');
