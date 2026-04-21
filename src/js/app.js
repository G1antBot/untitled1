let questionPool = null;

const subjectConfig = {
  surgery: {
    title: '外科学总论复习',
    subtitle: '随机抽题（固定版） · 即时反馈 · 总分 100',
    file: 'js/questions.json',
    enabledTypes: ['single', 'multiple', 'term', 'short'],
    labels: {
      single: '单选题',
      multiple: '多选题',
      term: '名词解释',
      short: '问答题'
    },
    display: {
      single: 50,
      multiple: 5,
      term: 10,
      short: 3
    }
  },
  diagnostics: {
    title: '诊断学复习',
    subtitle: '随机抽题 · 当前仅简答题与论述题',
    file: 'js/questions_diagnostics.json',
    enabledTypes: ['term', 'short'],
    labels: {
      single: '单选题',
      multiple: '多选题',
      term: '简答题',
      short: '论述题'
    },
    display: {
      single: 0,
      multiple: 0,
      term: 20,
      short: 8
    }
  },
  ebm: {
    title: '循证医学复习',
    subtitle: '随机抽题（固定版） · 包含单选、名词解释、简答、判断',
    file: 'js/ebm_questions.json',
    enabledTypes: ['single', 'term', 'short', 'judge'],
    labels: {
      single: '单选题',
      term: '名词解释',
      short: '简答题',
      judge: '判断题'
    },
    display: {
      single: 30,
      term: 10,
      short: 5,
      judge: 10
    }
  }
};

const scoreConfig = {
  single: 1,
  multiple: 2,
  term: 1,
  short: 10,
  judge: 1
};

const defaultDisplayConfig = {
  single: 50,
  multiple: 5,
  term: 10,
  short: 3,
  judge: 5
};

let currentDisplayConfig = { ...defaultDisplayConfig };

const tabButtons = document.querySelectorAll('[data-tab]');
const panels = document.querySelectorAll('.tab-panel');
const scoreTotalValue = document.querySelector('#score-total');
const scoreTotalMax = document.querySelector('#score-total-max');
const scoreSingleValue = document.querySelector('#score-single');
const scoreSingleMax = document.querySelector('#score-single-max');
const scoreLabelSingle = document.querySelector('#score-label-single');
const scoreItemSingle = document.querySelector('#score-item-single');
const scoreMultipleValue = document.querySelector('#score-multiple');
const scoreMultipleMax = document.querySelector('#score-multiple-max');
const scoreLabelMultiple = document.querySelector('#score-label-multiple');
const scoreItemMultiple = document.querySelector('#score-item-multiple');
const scoreTermValue = document.querySelector('#score-term');
const scoreTermMax = document.querySelector('#score-term-max');
const scoreLabelTerm = document.querySelector('#score-label-term');
const scoreItemTerm = document.querySelector('#score-item-term');
const scoreShortValue = document.querySelector('#score-short');
const scoreShortMax = document.querySelector('#score-short-max');
const scoreLabelShort = document.querySelector('#score-label-short');
const scoreItemShort = document.querySelector('#score-item-short');
const scoreJudgeValue = document.querySelector('#score-judge');
const scoreJudgeMax = document.querySelector('#score-judge-max');
const scoreLabelJudge = document.querySelector('#score-label-judge');
const scoreItemJudge = document.querySelector('#score-item-judge');
const checkButton = document.querySelector('#check-answers');
const resetButton = document.querySelector('#reset-answers');
const shuffleButton = document.querySelector('#shuffle-questions');
const subjectSelect = document.querySelector('#subject-select');
const brandText = document.querySelector('#brand-text');
const subtitleText = document.querySelector('#subtitle-text');

const state = {
  answers: new Map(),
  currentQuestions: {}
};

const shuffle = (items) => {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};

const pickQuestions = (type, excludeItems = [], countOverride = null) => {
  const pool = questionPool[type] || [];
  const targetCount = countOverride ?? Math.min(currentDisplayConfig[type] ?? pool.length, pool.length);
  const excludeSet = new Set(excludeItems);
  let candidates = pool.filter((item) => !excludeSet.has(item));

  if (candidates.length < targetCount) {
    candidates = pool.slice();
  }

  return shuffle(candidates).slice(0, Math.min(targetCount, candidates.length));
};

const createOption = (type, name, option) => {
  const wrapper = document.createElement('label');
  wrapper.className = 'option';

  const input = document.createElement('input');
  input.type = type;
  input.name = name;
  input.value = option;
  input.addEventListener('change', () => {
    if (type === 'radio') {
      state.answers.set(name, option);
    } else {
      const current = new Set(state.answers.get(name) || []);
      if (input.checked) {
        current.add(option);
      } else {
        current.delete(option);
      }
      state.answers.set(name, Array.from(current));
    }
  });

  const text = document.createElement('span');
  text.textContent = option;

  wrapper.appendChild(input);
  wrapper.appendChild(text);
  return wrapper;
};

const renderSection = (type, container) => {
  const items = state.currentQuestions[type] || [];
  const sectionTitle = document.createElement('h2');
  sectionTitle.textContent = container.dataset.title;
  container.appendChild(sectionTitle);

  items.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'question-card';
    card.dataset.type = type;

    const title = document.createElement('div');
    title.className = 'question-title';
    title.textContent = `${idx + 1}. ${item.question}`;
    card.appendChild(title);

    const answerArea = document.createElement('div');
    answerArea.className = 'answer-area';

    const name = `${type}-${idx}`;

    if (type === 'single' || type === 'multiple' || type === 'judge') {
      const list = document.createElement('div');
      list.className = 'option-list';
      const options = item.options || (type === 'judge' ? ['√', '×'] : []);
      options.forEach((option) => {
        list.appendChild(createOption(type === 'multiple' ? 'checkbox' : 'radio', name, option));
      });
      answerArea.appendChild(list);
    } else {
      const input = document.createElement(type === 'term' ? 'input' : 'textarea');
      input.placeholder = '输入你的答案';
      input.addEventListener('input', () => {
        state.answers.set(name, input.value);
      });
      answerArea.appendChild(input);
    }

    const feedback = document.createElement('div');
    feedback.className = 'feedback';
    feedback.dataset.name = name;
    feedback.textContent = '';

    card.appendChild(answerArea);
    card.appendChild(feedback);
    container.appendChild(card);
  });
};

const renderAll = () => {
  panels.forEach((panel) => {
    if (panel.classList.contains('is-hidden')) {
      return;
    }
    panel.innerHTML = '';
    renderSection(panel.dataset.type, panel);
  });
};

const getCurrentSubject = () => subjectSelect?.value || 'surgery';

const getSubjectMeta = () => subjectConfig[getCurrentSubject()] || subjectConfig.surgery;

const applySubjectMeta = () => {
  const meta = getSubjectMeta();
  currentDisplayConfig = { ...defaultDisplayConfig, ...meta.display };

  brandText.textContent = meta.title;
  subtitleText.textContent = meta.subtitle;

  tabButtons.forEach((button) => {
    const type = button.dataset.tab;
    const enabled = meta.enabledTypes.includes(type);
    button.classList.toggle('is-hidden', !enabled);
    const label = meta.labels[type] || button.textContent;
    const count = currentDisplayConfig[type] || 0;
    button.textContent = `${label} ${count}`;
  });

  panels.forEach((panel) => {
    const type = panel.dataset.type;
    const enabled = meta.enabledTypes.includes(type);
    panel.classList.toggle('is-hidden', !enabled);
    panel.dataset.title = meta.labels[type] || panel.dataset.title;
    if (!enabled) {
      panel.classList.remove('active');
      panel.innerHTML = '';
    }
  });

  const compactLabel = (type) => (meta.labels[type] || '').replace(/题$/, '');
  scoreLabelSingle.textContent = compactLabel('single') || '单选';
  scoreLabelMultiple.textContent = compactLabel('multiple') || '多选';
  scoreLabelTerm.textContent = compactLabel('term') || '名词解释';
  scoreLabelShort.textContent = compactLabel('short') || '问答';
  scoreLabelJudge.textContent = compactLabel('judge') || '判断';

  scoreItemSingle.classList.toggle('is-hidden', !meta.enabledTypes.includes('single'));
  scoreItemMultiple.classList.toggle('is-hidden', !meta.enabledTypes.includes('multiple'));
  scoreItemTerm.classList.toggle('is-hidden', !meta.enabledTypes.includes('term'));
  scoreItemShort.classList.toggle('is-hidden', !meta.enabledTypes.includes('short'));
  scoreItemJudge.classList.toggle('is-hidden', !meta.enabledTypes.includes('judge'));
};

const updateScoreMax = () => {
  const maxSingle = (state.currentQuestions.single || []).length * scoreConfig.single;
  const maxMultiple = (state.currentQuestions.multiple || []).length * scoreConfig.multiple;
  const maxTerm = (state.currentQuestions.term || []).length * scoreConfig.term;
  const maxShort = (state.currentQuestions.short || []).length * scoreConfig.short;
  const maxJudge = (state.currentQuestions.judge || []).length * scoreConfig.judge;
  const maxTotal = maxSingle + maxMultiple + maxTerm + maxShort + maxJudge;

  scoreSingleMax.textContent = maxSingle.toFixed(1);
  scoreMultipleMax.textContent = maxMultiple.toFixed(1);
  scoreTermMax.textContent = maxTerm.toFixed(1);
  scoreShortMax.textContent = maxShort.toFixed(1);
  scoreJudgeMax.textContent = maxJudge.toFixed(1);
  scoreTotalMax.textContent = maxTotal.toFixed(1);
};

const resetScoreValues = () => {
  scoreSingleValue.textContent = '0';
  scoreMultipleValue.textContent = '0';
  scoreTermValue.textContent = '0';
  scoreShortValue.textContent = '0';
  scoreJudgeValue.textContent = '0';
  scoreTotalValue.textContent = '0';
};

const checkAnswers = () => {
  if (!questionPool) {
    return;
  }
  const activePanel = document.querySelector('.tab-panel.active');
  if (!activePanel) {
    return;
  }

  const type = activePanel.dataset.type;
  const items = state.currentQuestions[type] || [];
  let scoreForType = 0;

  items.forEach((item, idx) => {
    const name = `${type}-${idx}`;
    const feedback = activePanel.querySelector(`.feedback[data-name="${name}"]`);
    if (!feedback) return;
    const card = feedback.closest('.question-card');
    const answer = state.answers.get(name);

    let correct = false;
    if (type === 'single' || type === 'judge') {
      correct = answer === item.answer;
    } else if (type === 'multiple') {
      const correctSet = new Set(item.answer);
      const answerSet = new Set(answer || []);
      correct = correctSet.size === answerSet.size && [...correctSet].every((v) => answerSet.has(v));
    } else {
      const user = (answer || '').trim();
      const key = (item.answer || '').trim();
      correct = Boolean(user && key && user === key);
    }

    const answerText = type === 'multiple' ? (item.answer || []).join('、') : (item.answer || '');
    const hasReference = Boolean(answerText.trim());

    feedback.textContent = hasReference
      ? `参考答案：${answerText}`
      : '该题未提供标准答案，请结合教材自评。';
    card.classList.remove('is-correct', 'is-wrong');
    if (hasReference) {
      card.classList.add(correct ? 'is-correct' : 'is-wrong');
    }

    if (hasReference && correct) {
      scoreForType += scoreConfig[type];
    }
  });

  if (type === 'single') scoreSingleValue.textContent = scoreForType.toFixed(1);
  if (type === 'multiple') scoreMultipleValue.textContent = scoreForType.toFixed(1);
  if (type === 'term') scoreTermValue.textContent = scoreForType.toFixed(1);
  if (type === 'short') scoreShortValue.textContent = scoreForType.toFixed(1);
  if (type === 'judge') scoreJudgeValue.textContent = scoreForType.toFixed(1);

  const total = parseFloat(scoreSingleValue.textContent || 0) + 
                parseFloat(scoreMultipleValue.textContent || 0) + 
                parseFloat(scoreTermValue.textContent || 0) + 
                parseFloat(scoreShortValue.textContent || 0) + 
                parseFloat(scoreJudgeValue.textContent || 0);
  scoreTotalValue.textContent = total.toFixed(1);
};

const resetAnswers = () => {
  state.answers.clear();
  panels.forEach((panel) => {
    panel.querySelectorAll('input, textarea').forEach((input) => {
      if (input.type === 'checkbox' || input.type === 'radio') {
        input.checked = false;
      } else {
        input.value = '';
      }
    });
    panel.querySelectorAll('.feedback').forEach((fb) => {
      fb.textContent = '';
    });
    panel.querySelectorAll('.question-card').forEach((card) => {
      card.classList.remove('is-correct', 'is-wrong');
    });
  });
  resetScoreValues();
};

const replaceQuestionsForType = (type) => {
  const panel = document.querySelector(`.tab-panel[data-type="${type}"]`);
  if (!panel || !questionPool) {
    return;
  }

  const currentItems = state.currentQuestions[type] || [];
  const targetCount = currentItems.length || Math.min(currentDisplayConfig[type] ?? 0, (questionPool[type] || []).length);
  state.currentQuestions[type] = pickQuestions(type, currentItems, targetCount);

  Array.from(state.answers.keys()).forEach((key) => {
    if (key.startsWith(`${type}-`)) {
      state.answers.delete(key);
    }
  });

  panel.innerHTML = '';
  renderSection(type, panel);
  updateScoreMax();
  resetScoreValues();
};

const activateTab = (target) => {
  const meta = getSubjectMeta();
  const firstEnabled = meta.enabledTypes[0];
  const finalTarget = meta.enabledTypes.includes(target) ? target : firstEnabled;

  tabButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === finalTarget);
  });
  panels.forEach((panel) => {
    panel.classList.toggle('active', panel.dataset.type === finalTarget);
  });
};

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activateTab(button.dataset.tab);
  });
});

const loadQuestions = async () => {
  try {
    const meta = getSubjectMeta();
    const response = await fetch(meta.file, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('无法加载题库文件');
    }
    questionPool = await response.json();
    state.answers.clear();
    panels.forEach((panel) => {
      const type = panel.dataset.type;
      state.currentQuestions[type] = meta.enabledTypes.includes(type) ? pickQuestions(type) : [];
    });
    renderAll();
    updateScoreMax();
    resetScoreValues();
    activateTab(meta.enabledTypes[0]);
  } catch (error) {
    const fallback = document.createElement('div');
    fallback.className = 'load-error';
    fallback.textContent = '题库加载失败，请检查 questions.json 是否存在。';
    document.body.appendChild(fallback);
  }
};

checkButton.addEventListener('click', checkAnswers);
resetButton.addEventListener('click', resetAnswers);
shuffleButton.addEventListener('click', () => {
  const activePanel = document.querySelector('.tab-panel.active');
  if (activePanel) {
    replaceQuestionsForType(activePanel.dataset.type);
  }
});

subjectSelect.addEventListener('change', async () => {
  applySubjectMeta();
  await loadQuestions();
});

applySubjectMeta();
loadQuestions();
