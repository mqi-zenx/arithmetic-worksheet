// app.js — Curriculum browser and worksheet renderer

const yearTabsEl     = document.getElementById('year-tabs');
const topicListEl    = document.getElementById('topic-list');
const sidebarCtrls   = document.getElementById('sidebar-controls');
const countInput     = document.getElementById('count-input');
const generateBtn    = document.getElementById('btn-generate');
const printBtn       = document.getElementById('btn-print');
const answersBtn     = document.getElementById('btn-answers');
const errorMsg       = document.getElementById('error-msg');
const worksheetEl    = document.getElementById('worksheet');

let activeYear        = null;
let activeTopic       = null;
let currentDifficulty = 1;

document.getElementById('difficulty-btns').addEventListener('click', e => {
  const btn = e.target.closest('.diff-btn');
  if (!btn) return;
  currentDifficulty = parseInt(btn.dataset.level, 10);
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.toggle('active', b === btn));
});

// ── Build year tabs ───────────────────────────────────────────

CURRICULUM.forEach(year => {
  const btn = document.createElement('button');
  btn.className = 'year-tab';
  btn.textContent = year.label;
  btn.dataset.yearId = year.id;
  btn.style.setProperty('--year-color', year.color);
  btn.addEventListener('click', () => selectYear(year));
  yearTabsEl.appendChild(btn);
});

function selectYear(year) {
  activeYear = year;
  activeTopic = null;
  sidebarCtrls.style.display = 'none';
  errorMsg.textContent = '';

  document.querySelectorAll('.year-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.yearId === year.id);
  });

  topicListEl.innerHTML = '';
  year.topics.forEach(topic => {
    const li = document.createElement('li');
    li.className = 'topic-item';
    li.textContent = topic.label;
    li.dataset.topicId = topic.id;
    li.style.setProperty('--year-color', year.color);
    li.addEventListener('click', () => selectTopic(topic));
    topicListEl.appendChild(li);
  });
}

function selectTopic(topic) {
  activeTopic = topic;
  errorMsg.textContent = '';

  document.querySelectorAll('.topic-item').forEach(li => {
    li.classList.toggle('active', li.dataset.topicId === topic.id);
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
    diffButtons.forEach(b => b.classList.toggle('active', b.dataset.level === '1'));
  }

  sidebarCtrls.style.display = '';
  generateBtn.focus();
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
  printBtn.disabled = false;
  answersBtn.disabled = false;
  // New worksheet always starts with answers hidden.
  worksheetEl.classList.remove('show-answers');
  answersBtn.textContent = 'Show Answers';
  answersBtn.setAttribute('aria-pressed', 'false');
  worksheetEl.scrollIntoView({ behavior: 'smooth' });
});

printBtn.addEventListener('click', () => window.print());

answersBtn.addEventListener('click', () => {
  const showing = worksheetEl.classList.toggle('show-answers');
  answersBtn.textContent = showing ? 'Hide Answers' : 'Show Answers';
  answersBtn.setAttribute('aria-pressed', String(showing));
});

// ── Select first year on load ─────────────────────────────────

if (CURRICULUM.length > 0) selectYear(CURRICULUM[0]);

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
