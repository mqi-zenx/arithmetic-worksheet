// app.js — Curriculum browser and worksheet renderer

const yearTabsEl     = document.getElementById('year-tabs');
const topicListEl    = document.getElementById('topic-list');
const sidebarCtrls   = document.getElementById('sidebar-controls');
const countInput     = document.getElementById('count-input');
const generateBtn    = document.getElementById('btn-generate');
const printBtn       = document.getElementById('btn-print');
const printKeyBtn    = document.getElementById('btn-print-key');
const answersBtn     = document.getElementById('btn-answers');
const errorMsg       = document.getElementById('error-msg');
const worksheetEl    = document.getElementById('worksheet');
const topicSearchEl  = document.getElementById('topic-search');
const printSettings  = document.getElementById('print-settings');
const printColsEl    = document.getElementById('print-cols');
const printSizeEl    = document.getElementById('print-size');

let activeYear        = null;
let activeTopic       = null;
let currentDifficulty = 1;
let lastProblems      = [];

document.getElementById('difficulty-btns').addEventListener('click', e => {
  const btn = e.target.closest('.diff-btn');
  if (!btn || btn.disabled) return;
  currentDifficulty = parseInt(btn.dataset.level, 10);
  document.querySelectorAll('.diff-btn').forEach(b => {
    const on = b === btn;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  });
  saveState();
});

// ── Build year tabs ───────────────────────────────────────────

CURRICULUM.forEach(year => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'year-tab';
  btn.textContent = year.label;
  btn.dataset.yearId = year.id;
  btn.setAttribute('role', 'tab');
  btn.setAttribute('aria-selected', 'false');
  btn.style.setProperty('--year-color', year.color);
  btn.addEventListener('click', () => selectYear(year));
  yearTabsEl.appendChild(btn);
});

// ── Topic search/filter ───────────────────────────────────────

topicSearchEl.addEventListener('input', () => {
  const q = topicSearchEl.value.toLowerCase().trim();
  let visibleCount = 0;
  topicListEl.querySelectorAll('li').forEach(li => {
    const text = li.querySelector('.topic-item').textContent.toLowerCase();
    const hidden = q !== '' && !text.includes(q);
    li.hidden = hidden;
    if (!hidden) visibleCount++;
  });
  // Show/hide "no results" hint
  let noResults = topicListEl.querySelector('.topic-no-results');
  if (q && visibleCount === 0) {
    if (!noResults) {
      noResults = document.createElement('li');
      noResults.className = 'topic-no-results';
      noResults.textContent = 'No topics match.';
      topicListEl.appendChild(noResults);
    }
    noResults.hidden = false;
  } else if (noResults) {
    noResults.hidden = true;
  }
});

function selectYear(year) {
  activeYear = year;
  activeTopic = null;
  sidebarCtrls.style.display = 'none';
  errorMsg.textContent = '';
  // Clear search when switching years
  topicSearchEl.value = '';
  topicListEl.querySelectorAll('li').forEach(li => { li.hidden = false; });

  document.querySelectorAll('.year-tab').forEach(b => {
    const on = b.dataset.yearId === year.id;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', String(on));
  });

  topicListEl.innerHTML = '';
  year.topics.forEach(topic => {
    const li = document.createElement('li');
    li.setAttribute('role', 'none');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'topic-item';
    btn.textContent = topic.label;
    btn.dataset.topicId = topic.id;
    btn.setAttribute('aria-pressed', 'false');
    btn.style.setProperty('--year-color', year.color);
    btn.addEventListener('click', () => selectTopic(topic));
    li.appendChild(btn);
    topicListEl.appendChild(li);
  });
}

function selectTopic(topic) {
  activeTopic = topic;
  errorMsg.textContent = '';

  document.querySelectorAll('.topic-item').forEach(el => {
    const on = el.dataset.topicId === topic.id;
    el.classList.toggle('active', on);
    el.setAttribute('aria-pressed', String(on));
  });

  countInput.value = topic.defaultCount;

  // Gate the difficulty control: only show it as active for generators that
  // actually respond to difficulty, so the selector never silently does nothing.
  const supportsDifficulty = DIFFICULTY_AWARE_TYPES.has(topic.type);
  const diffRow = document.querySelector('.difficulty-row');
  const diffButtons = document.querySelectorAll('.diff-btn');
  diffRow.classList.toggle('disabled', !supportsDifficulty);
  diffRow.title = supportsDifficulty ? '' : 'This topic has a fixed difficulty.';
  diffButtons.forEach(b => { b.disabled = !supportsDifficulty; });
  if (!supportsDifficulty) {
    currentDifficulty = 1;
    diffButtons.forEach(b => {
      const on = b.dataset.level === '1';
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  sidebarCtrls.style.display = '';
  generateBtn.focus();
  saveState();
}

// ── Generate ──────────────────────────────────────────────────

generateBtn.addEventListener('click', () => {
  if (!activeTopic) return;
  errorMsg.textContent = '';

  const count = Math.min(Math.max(parseInt(countInput.value, 10) || activeTopic.defaultCount, 1), 60);
  const problems = generateCurriculumProblems(activeTopic, count, currentDifficulty);

  if (problems.length === 0) {
    errorMsg.textContent = 'Could not generate problems. Please try again.';
    return;
  }

  renderWorksheet(activeTopic, problems);
  lastProblems = problems;
  printBtn.disabled = false;
  printKeyBtn.disabled = false;
  answersBtn.disabled = false;
  printSettings.style.display = '';
  // New worksheet always starts with answers hidden.
  worksheetEl.classList.remove('show-answers');
  answersBtn.textContent = 'Show Answers';
  answersBtn.setAttribute('aria-pressed', 'false');
  worksheetEl.scrollIntoView({ behavior: 'smooth' });
});

printBtn.addEventListener('click', () => window.print());
countInput.addEventListener('change', saveState);

// ── Print settings → write data attrs consumed by @media print CSS ────

function applyPrintSettings() {
  document.body.dataset.printCols = printColsEl.value;
  document.body.dataset.printSize = printSizeEl.value;
}
printColsEl.addEventListener('change', applyPrintSettings);
printSizeEl.addEventListener('change', applyPrintSettings);

// ── Print Answer Key (opens a separate window/tab) ────────────

printKeyBtn.addEventListener('click', () => {
  if (!lastProblems.length || !activeTopic) return;
  const yearLabel = CURRICULUM.find(y => y.topics.some(t => t.id === activeTopic.id))?.label ?? '';
  const diffLabel = ['Easy', 'Medium', 'Hard', 'Harder', 'Hardest'][currentDifficulty - 1];
  const title = `${yearLabel} — ${activeTopic.label} (${diffLabel})`;

  const cols = Math.min(5, Math.max(3, Math.ceil(Math.sqrt(lastProblems.length))));
  const rows = lastProblems.map((p, i) =>
    `<div class="ai"><span class="an">${i + 1}.</span><span class="av">${p.answer}</span></div>`
  ).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Answer Key — ${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, 'Times New Roman', serif; padding: 1.8cm 2.2cm; color: #111; }
  h1 { font-size: 1rem; font-weight: bold; letter-spacing: .02em; margin-bottom: .2em; }
  h2 { font-size: .82rem; color: #555; font-weight: normal; margin-bottom: 1.4em; }
  .grid { display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 6px 18px; }
  .ai { display: flex; align-items: baseline; gap: 5px; font-size: .9rem; padding: 3px 0; border-bottom: 1px solid #eee; }
  .an { color: #888; min-width: 26px; font-size: .75rem; flex-shrink: 0; }
  .av { font-weight: bold; color: #c1121f; }
  @media print {
    @page { size: A4 portrait; margin: 1.5cm 2cm; }
    body { padding: 0; }
  }
</style>
</head>
<body>
<h1>Answer Key</h1>
<h2>${escapeHtml(title)}</h2>
<div class="grid">${rows}</div>
<script>
  window.onload = function() { window.print(); };
<\/script>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=740,height=600');
  if (!w) {
    alert('Please allow pop-ups to open the answer key in a new tab.');
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();
});

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

answersBtn.addEventListener('click', () => {
  const showing = worksheetEl.classList.toggle('show-answers');
  answersBtn.textContent = showing ? 'Hide Answers' : 'Show Answers';
  answersBtn.setAttribute('aria-pressed', String(showing));
});

// ── Persistence (remember last selection) ─────────────────────

const LS_KEY = 'aw:lastState';

function saveState() {
  if (!activeTopic) return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      yearId: activeYear && activeYear.id,
      topicId: activeTopic.id,
      difficulty: currentDifficulty,
      count: parseInt(countInput.value, 10) || activeTopic.defaultCount,
    }));
  } catch (e) { /* storage unavailable (private mode) — ignore */ }
}

function restoreState() {
  let s;
  try { s = JSON.parse(localStorage.getItem(LS_KEY)); } catch (e) { return false; }
  if (!s) return false;
  const year = CURRICULUM.find(y => y.id === s.yearId);
  if (!year) return false;
  selectYear(year);
  const topic = year.topics.find(t => t.id === s.topicId);
  if (!topic) return false;
  selectTopic(topic);
  if (DIFFICULTY_AWARE_TYPES.has(topic.type) && s.difficulty) {
    currentDifficulty = s.difficulty;
    document.querySelectorAll('.diff-btn').forEach(b => {
      const on = Number(b.dataset.level) === s.difficulty;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }
  if (s.count) countInput.value = s.count;
  return true;
}

// ── Restore last session, or select the first year ───────────

if (!restoreState() && CURRICULUM.length > 0) selectYear(CURRICULUM[0]);

// ── Render worksheet ──────────────────────────────────────────

function renderWorksheet(topic, problems) {
  const yearLabel = CURRICULUM.find(y => y.topics.some(t => t.id === topic.id))?.label ?? '';
  const diffLabel = ['Easy', 'Medium', 'Hard', 'Harder', 'Hardest'][currentDifficulty - 1];
  const title = `${yearLabel} — ${topic.label} (${diffLabel})`;

  // Determine dominant layout
  const hasColumn = problems.some(p => p.layout === 'column' || p.layout === 'longdivision');
  const hasInline = problems.some(p => p.layout === 'inline');
  const hasClock  = problems.some(p => p.layout === 'clock');
  const hasLD     = problems.some(p => p.layout === 'longdivision');

  let gridClass;
  if (hasClock) {
    gridClass = 'cols-2-clock';
  } else if (hasColumn && !hasInline) {
    gridClass = hasLD ? 'cols-2' : (problems.length <= 10 ? 'cols-2' : problems.length <= 18 ? 'cols-3' : 'cols-4');
  } else {
    gridClass = 'cols-2-inline';
  }

  const problemsHTML = problems.map((p, i) => renderProblem(p, i + 1)).join('');

  worksheetEl.className = 'worksheet';
  worksheetEl.innerHTML = `
    <div class="worksheet-header">
      <h1>${title}</h1>
      <div class="student-info">
        <span>Name:</span>
        <span>Date:</span>
        <span>Score: &nbsp;/ ${problems.length}</span>
      </div>
    </div>
    <div class="problem-grid ${gridClass}">
      ${problemsHTML}
    </div>
  `;
}

function renderProblem(p, num) {
  const key = `<span class="answer-key">${p.answer}</span>`;

  if (p.layout === 'column') {
    return `
      <div class="problem">
        <span class="problem-number">${num}</span>
        <span class="operand-a">${p.operandA}</span>
        <div class="operand-b-row">
          <span class="operator">${p.operator}</span>
          <span class="operand-b">${p.operandB}</span>
        </div>
        <div class="problem-line"></div>
        <div class="problem-answer">${key}</div>
      </div>`;
  }

  if (p.layout === 'longdivision') {
    return `
      <div class="problem ld-problem">
        <span class="problem-number">${num}</span>
        <div class="ld-layout">
          <div class="ld-answer-space">${key}</div>
          <div class="ld-bottom">
            <span class="ld-divisor">${p.operandB}</span>
            <div class="ld-box">
              <span class="ld-dividend">${p.operandA}</span>
            </div>
          </div>
        </div>
      </div>`;
  }

  if (p.layout === 'clock') {
    return `
      <div class="problem clock-problem">
        <span class="problem-number">${num}</span>
        <div class="clock-body">
          ${p.html}
          <div class="prob-answer-line">${key}</div>
        </div>
      </div>`;
  }

  // inline
  return `
    <div class="problem inline-problem">
      <span class="problem-number">${num}</span>
      <div class="inline-body">
        ${p.html}
        <div class="prob-answer-line">${key}</div>
      </div>
    </div>`;
}
