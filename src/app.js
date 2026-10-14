import { STORAGE_KEY, languages, starterCards, validCard, makeCard, dueCards, scheduleCard, nextDueLabel } from './core.js';

const main = document.querySelector('#main');
const nav = document.querySelector('.nav');
const dialog = document.querySelector('#card-dialog');
const form = document.querySelector('#card-form');
const toast = document.querySelector('#toast');
let state = load();
let view = 'home';
let searchTerm = '';
let study = null;
let lastSessionCount = 0;

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (data && Array.isArray(data.cards) && data.cards.length <= 2000 && data.cards.every(validCard)) return {
      cards: data.cards, from: languages[data.from] ? data.from : 'en', to: languages[data.to] && data.to !== data.from ? data.to : 'kk'
    };
  } catch { /* A malformed local state should not stop the app. */ }
  return { cards: starterCards.map(card => ({ ...card })), from: 'en', to: 'kk' };
}
function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { showToast('Storage is unavailable. Export your deck before leaving.'); } }
function esc(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
function showToast(message) { toast.textContent = message; toast.hidden = false; clearTimeout(toast._timer); toast._timer = setTimeout(() => { toast.hidden = true; }, 4000); }
function download(filename, contents) { const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function todayReviews() { const start = new Date(); start.setHours(0, 0, 0, 0); return state.cards.filter(card => card.lastReviewedAt >= start.getTime()).length; }

function render() {
  nav.querySelectorAll('button').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  if (view === 'home') renderHome();
  if (view === 'library') renderLibrary();
  if (view === 'study') renderStudy();
  if (view === 'finish') renderFinish();
}

function renderHome() {
  const due = dueCards(state.cards).length;
  const learned = state.cards.filter(card => card.reviews > 0).length;
  const preview = state.cards.slice(0, 3);
  main.innerHTML = `<div class="home"><section class="hero editorial-hero"><div class="editorial-meta"><span>WORDORBIT / LANGUAGE STUDIO</span><span>EN · ҚАЗ · РУ</span></div><div class="hero-copy"><span class="hero-eyebrow">SPACED REPETITION, MADE SIMPLE</span><h1>Meet a word.<br><em>Meet it again.</em></h1><p>Practice English, Kazakh, and Russian. Words return when they are due, so every review has a purpose.</p><button type="button" class="hero-button" data-start-due>Review ${due} due word${due === 1 ? '' : 's'} <span aria-hidden="true">↗</span></button><span class="hero-footnote">Private to your browser. No sign-up needed.</span></div><div class="hero-visual type-studio" aria-hidden="true"><span class="language-type type-kk">СӨЗ</span><span class="language-type type-en">WORD</span><span class="language-type type-ru">СЛОВО</span><div class="type-caption">ONE IDEA<br>THREE LANGUAGES <span>↗</span></div></div><div class="editorial-footer"><span>001 — KEEP WORDS IN MOTION</span><span>LEARN · RETURN · REMEMBER</span></div></section>
    <section class="home-stats"><div><span class="stat-icon lilac">◉</span><p><strong>${due}</strong><small>DUE NOW</small></p></div><div><span class="stat-icon peach">✳</span><p><strong>${learned}</strong><small>WORDS PRACTICED</small></p></div><div><span class="stat-icon blue">↗</span><p><strong>${todayReviews()}</strong><small>REVIEWED TODAY</small></p></div></section>
    <section class="practice-section"><div class="section-heading"><div><span class="eyebrow">MAKE PRACTICE YOURS</span><h2>Choose your direction.</h2></div><p>Switch languages whenever curiosity takes you there.</p></div><div class="practice-card"><div class="direction-controls"><label>SHOW ME<select id="from-lang">${Object.entries(languages).map(([code, name]) => `<option value="${code}" ${code === state.from ? 'selected' : ''}>${name}</option>`).join('')}</select></label><span class="direction-arrow" aria-hidden="true">→</span><label>LET ME RECALL<select id="to-lang">${Object.entries(languages).map(([code, name]) => `<option value="${code}" ${code === state.to ? 'selected' : ''}>${name}</option>`).join('')}</select></label></div><div class="practice-actions"><p>Due cards return when your memory needs them. You can also explore the whole deck.</p><div><button class="outline-button" type="button" data-start-all ${state.cards.length ? '' : 'disabled'}>Study all</button><button class="primary-button" type="button" data-start-due ${due ? '' : 'disabled'}>Review due <span aria-hidden="true">↗</span></button></div></div></div></section>
    <section class="deck-section"><div class="section-heading"><div><span class="eyebrow">A PEEK INSIDE</span><h2>Your little universe.</h2></div><button type="button" class="section-link" data-view="library">View all ${state.cards.length} words ↗</button></div><div class="preview-grid">${preview.length ? preview.map((card, index) => `<article class="preview-card preview-${index}"><span class="preview-top">${String(index + 1).padStart(2, '0')} <span>✳</span></span><strong>${esc(card[state.from])}</strong><span class="preview-translation">${esc(card[state.to])}</span></article>`).join('') : '<div class="empty-small">No words yet. Add one to start your deck.</div>'}</div></section></div>`;
}

function cardRow(card, index) {
  return `<article class="word-row"><div class="word-index">${String(index + 1).padStart(2, '0')}</div><div class="word-main"><strong>${esc(card.en)}</strong><span>${esc(card.kk)} <b>·</b> ${esc(card.ru)}</span></div><div class="word-due ${card.dueAt <= Date.now() ? 'ready' : ''}">${esc(nextDueLabel(card))}</div><div class="word-actions"><button type="button" data-edit="${esc(card.id)}" aria-label="Edit ${esc(card.en)}">Edit</button><button type="button" data-delete="${esc(card.id)}" aria-label="Delete ${esc(card.en)}">×</button></div></article>`;
}

function renderLibrary() {
  main.innerHTML = `<div class="library"><div class="eyebrow">YOUR WORD COLLECTION <span>✳</span></div><div class="library-heading"><div><h1>My words<span>.</span></h1><p>Every word you save has a place to come back to.</p></div><button type="button" class="primary-button" data-add-card>＋ Add a word</button></div><div class="library-toolbar"><label class="search-box"><span aria-hidden="true">⌕</span><span class="sr-only">Search words</span><input id="search" type="search" value="${esc(searchTerm)}" placeholder="Search in any language…"></label><span>${state.cards.length} WORDS</span></div><div id="word-list" class="word-list"></div><div class="library-footer"><p>Stored only on this device. Export a copy before clearing browser data.</p><div><button type="button" data-import>Import words</button><button type="button" data-export>Export words ↗</button></div></div></div>`;
  renderWordList();
}

function renderWordList() {
  const filtered = state.cards.filter(card => `${card.en} ${card.kk} ${card.ru} ${card.note}`.toLowerCase().includes(searchTerm.toLowerCase()));
  document.querySelector('#word-list').innerHTML = filtered.length ? filtered.map(cardRow).join('') : `<div class="empty-state"><span>✳</span><h2>No words found.</h2><p>${state.cards.length ? 'Try another search.' : 'Add a word and start your own collection.'}</p><button type="button" data-add-card>Add a word ↗</button></div>`;
}

function renderStudy() {
  if (!study || study.index >= study.ids.length) { view = 'finish'; render(); return; }
  const card = state.cards.find(c => c.id === study.ids[study.index]);
  if (!card) { study.index++; renderStudy(); return; }
  const progress = Math.round(study.index / study.ids.length * 100);
  main.innerHTML = `<div class="study-page"><div class="study-header"><div><span class="eyebrow">IN YOUR OWN ORBIT</span><h1>One word at a time.</h1></div><button type="button" class="exit-button" data-end-study>End session ×</button></div><div class="study-meta"><span>WORD ${String(study.index + 1).padStart(2, '0')} / ${String(study.ids.length).padStart(2, '0')}</span><span>${esc(languages[state.from])} → ${esc(languages[state.to])}</span></div><div class="study-progress"><span style="width:${progress}%"></span></div><div class="study-card ${study.shown ? 'is-revealed' : ''}"><div class="card-upper"><span>${study.shown ? 'THE ANSWER' : 'RECALL THIS WORD'}</span><span>✳</span></div><div class="study-word"><span>${esc(languages[state.from])}</span><strong>${esc(card[state.from])}</strong>${study.shown ? `<div class="answer-divider">↓</div><span>${esc(languages[state.to])}</span><strong class="answer-word">${esc(card[state.to])}</strong>` : '<p>Take a breath. Find the word in your memory.</p>'}</div><div class="card-lower">${study.shown && card.note ? `<span>${esc(card.note)}</span>` : '<span>WordOrbit · A little every day</span>'}<span>◉</span></div></div>${study.shown ? `<div class="rating-panel"><span>HOW WELL DID YOU REMEMBER?</span><div class="rating-buttons"><button type="button" data-rate="again"><strong>Again</strong><small>10 min</small></button><button type="button" data-rate="hard"><strong>Hard</strong><small>1 hr+</small></button><button type="button" data-rate="good"><strong>Good</strong><small>1 day+</small></button><button type="button" data-rate="easy"><strong>Easy</strong><small>4 days+</small></button></div><p>Keyboard: 1 Again · 2 Hard · 3 Good · 4 Easy</p></div>` : `<button type="button" class="reveal-button" data-reveal>Reveal answer <span>↗</span></button><p class="keyboard-tip">Press space to reveal</p>`}</div>`;
}

function renderFinish() {
  const due = dueCards(state.cards).length;
  main.innerHTML = `<div class="finish-page"><div class="finish-orbit" aria-hidden="true">✳</div><span class="eyebrow">SESSION COMPLETE</span><h1>Look at you,<br><em>showing up.</em></h1><p>You practiced ${lastSessionCount} word${lastSessionCount === 1 ? '' : 's'}. Memory grows each time you return.</p><div class="finish-stats"><div><strong>${lastSessionCount}</strong><span>WORDS REVIEWED</span></div><div><strong>${due}</strong><span>DUE NOW</span></div></div><div class="finish-actions"><button type="button" class="primary-button" data-view="home">Back home ↗</button><button type="button" class="outline-button" data-start-all>Study all again</button></div></div>`;
}

function startStudy(mode) {
  const pool = mode === 'all' ? state.cards : dueCards(state.cards);
  if (!pool.length) { showToast('Nothing is due right now. Try studying all words.'); return; }
  study = { ids: pool.map(card => card.id), index: 0, shown: false };
  lastSessionCount = 0; view = 'study'; render(); main.focus();
}

function openCard(id = null) {
  const card = state.cards.find(c => c.id === id);
  form.reset();
  form.elements.id.value = card?.id || '';
  for (const lang of Object.keys(languages)) form.elements[lang].value = card?.[lang] || '';
  form.elements.note.value = card?.note || '';
  document.querySelector('#dialog-title').textContent = card ? 'Edit a word' : 'Add a word';
  dialog.showModal();
}

document.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  if (button.dataset.view) { view = button.dataset.view; study = null; render(); main.focus(); return; }
  if (button.hasAttribute('data-add-card')) { openCard(); return; }
  if (button.hasAttribute('data-close-dialog')) { dialog.close(); return; }
  if (button.dataset.edit) { openCard(button.dataset.edit); return; }
  if (button.dataset.delete) { const card = state.cards.find(c => c.id === button.dataset.delete); if (card && confirm(`Delete “${card.en}”?`)) { state.cards = state.cards.filter(c => c.id !== card.id); save(); renderLibrary(); showToast('Word deleted.'); } return; }
  if (button.hasAttribute('data-start-due')) { startStudy('due'); return; }
  if (button.hasAttribute('data-start-all')) { startStudy('all'); return; }
  if (button.hasAttribute('data-reveal')) { study.shown = true; renderStudy(); return; }
  if (button.dataset.rate) {
    const id = study.ids[study.index];
    state.cards = state.cards.map(card => card.id === id ? scheduleCard(card, button.dataset.rate) : card);
    save(); study.index++; study.shown = false; lastSessionCount++;
    renderStudy(); return;
  }
  if (button.hasAttribute('data-end-study')) { view = 'home'; study = null; render(); main.focus(); return; }
  if (button.hasAttribute('data-export')) { download('wordorbit-deck.json', JSON.stringify({ app: 'WordOrbit', version: 1, cards: state.cards }, null, 2)); showToast('Deck downloaded.'); return; }
  if (button.hasAttribute('data-import')) document.querySelector('#import-file').click();
});

document.addEventListener('change', event => {
  if (event.target.id === 'from-lang' || event.target.id === 'to-lang') {
    const value = event.target.value;
    if (event.target.id === 'from-lang') state.from = value; else state.to = value;
    if (state.from === state.to) { if (event.target.id === 'from-lang') state.to = Object.keys(languages).find(lang => lang !== state.from); else state.from = Object.keys(languages).find(lang => lang !== state.to); showToast('Choose two different languages.'); }
    save(); renderHome();
  }
});
document.addEventListener('input', event => { if (event.target.id === 'search') { searchTerm = event.target.value; renderWordList(); } });

document.addEventListener('keydown', event => {
  if (view !== 'study' || dialog.open || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(document.activeElement.tagName) || event.altKey || event.ctrlKey || event.metaKey) return;
  if (!study.shown && event.code === 'Space') { event.preventDefault(); study.shown = true; renderStudy(); }
  if (study.shown && /^[1-4]$/.test(event.key)) { event.preventDefault(); document.querySelector(`[data-rate="${['again','hard','good','easy'][Number(event.key) - 1]}"]`)?.click(); }
});

form.addEventListener('submit', event => {
  event.preventDefault();
  try {
    const id = form.elements.id.value;
    if (!id && state.cards.length >= 2000) throw new Error('This deck can hold up to 2,000 words.');
    const updated = makeCard({ en: form.elements.en.value, kk: form.elements.kk.value, ru: form.elements.ru.value, note: form.elements.note.value }, id || undefined);
    if (id) {
      const old = state.cards.find(card => card.id === id);
      state.cards = state.cards.map(card => card.id === id ? { ...old, en: updated.en, kk: updated.kk, ru: updated.ru, note: updated.note } : card);
    } else state.cards.unshift(updated);
    save(); dialog.close(); view = 'library'; render(); showToast(id ? 'Word updated.' : 'Word added.');
  } catch (error) { showToast(error.message); }
});

document.querySelector('#import-file').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > 2_000_000) throw new Error('File is too large.');
    const data = JSON.parse(await file.text());
    if (data?.app !== 'WordOrbit' || !Array.isArray(data.cards) || data.cards.length > 2000 || !data.cards.every(validCard)) throw new Error('This is not a valid WordOrbit deck.');
    const ids = new Set(state.cards.map(card => card.id));
    const additions = data.cards.filter(card => {
      if (ids.has(card.id)) return false;
      ids.add(card.id); return true;
    });
    if (state.cards.length + additions.length > 2000) throw new Error('This deck can hold up to 2,000 words.');
    state.cards.push(...additions);
    save(); render(); showToast(additions.length ? `Imported ${additions.length} word${additions.length === 1 ? '' : 's'}.` : 'These words are already in your deck.');
  } catch (error) { showToast(error.message || 'Could not read that file.'); }
  event.target.value = '';
});

render();
