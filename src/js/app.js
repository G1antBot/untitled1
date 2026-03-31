let questionPool = null;

const scoreConfig = {
  single: 1,
  multiple: 2,
  term: 1,
  short: 10
};

const displayConfig = {
  single: 50,
  multiple: 5,
  term: 10,
  short: 3
};

const tabButtons = document.querySelectorAll('[data-tab]');
const panels = document.querySelectorAll('.tab-panel');
const scoreTotalValue = document.querySelector('#score-total');
const scoreTotalMax = document.querySelector('#score-total-max');
const scoreSingleValue = document.querySelector('#score-single');
const scoreSingleMax = document.querySelector('#score-single-max');
const scoreMultipleValue = document.querySelector('#score-multiple');
const scoreMultipleMax = document.querySelector('#score-multiple-max');
const scoreTermValue = document.querySelector('#score-term');
const scoreTermMax = document.querySelector('#score-term-max');
const scoreShortValue = document.querySelector('#score-short');
const scoreShortMax = document.querySelector('#score-short-max');
const checkButton = document.querySelector('#check-answers');
const resetButton = document.querySelector('#reset-answers');
const shuffleButton = document.querySelector('#shuffle-questions');

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
  const targetCount = countOverride ?? Math.min(displayConfig[type] ?? pool.length, pool.length);
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

    if (type === 'single' || type === 'multiple') {
      const list = document.createElement('div');
      list.className = 'option-list';
      item.options.forEach((option) => {
        list.appendChild(createOption(type === 'single' ? 'radio' : 'checkbox', name, option));
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
    panel.innerHTML = '';
    renderSection(panel.dataset.type, panel);
  });
};

const updateScoreMax = () => {
  const maxSingle = (state.currentQuestions.single || []).length * scoreConfig.single;
  const maxMultiple = (state.currentQuestions.multiple || []).length * scoreConfig.multiple;
  const maxTerm = (state.currentQuestions.term || []).length * scoreConfig.term;
  const maxShort = (state.currentQuestions.short || []).length * scoreConfig.short;
  const maxTotal = maxSingle + maxMultiple + maxTerm + maxShort;

  scoreSingleMax.textContent = maxSingle.toFixed(1);
  scoreMultipleMax.textContent = maxMultiple.toFixed(1);
  scoreTermMax.textContent = maxTerm.toFixed(1);
  scoreShortMax.textContent = maxShort.toFixed(1);
  scoreTotalMax.textContent = maxTotal.toFixed(1);
};

const resetScoreValues = () => {
  scoreSingleValue.textContent = '0';
  scoreMultipleValue.textContent = '0';
  scoreTermValue.textContent = '0';
  scoreShortValue.textContent = '0';
  scoreTotalValue.textContent = '0';
};

const checkAnswers = () => {
  if (!questionPool) {
    return;
  }
  let totalScore = 0;
  const scoreByType = {
    single: 0,
    multiple: 0,
    term: 0,
    short: 0
  };

  panels.forEach((panel) => {
    const type = panel.dataset.type;
    const items = state.currentQuestions[type] || [];

    items.forEach((item, idx) => {
      const name = `${type}-${idx}`;
      const feedback = panel.querySelector(`.feedback[data-name="${name}"]`);
      const card = feedback.closest('.question-card');
      const answer = state.answers.get(name);

      let correct = false;
      if (type === 'single') {
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

      feedback.textContent = `正确答案：${type === 'multiple' ? item.answer.join('、') : item.answer}`;
      card.classList.remove('is-correct', 'is-wrong');
      card.classList.add(correct ? 'is-correct' : 'is-wrong');

      if (correct) {
        totalScore += scoreConfig[type];
        scoreByType[type] += scoreConfig[type];
      }
    });
  });

  scoreSingleValue.textContent = scoreByType.single.toFixed(1);
  scoreMultipleValue.textContent = scoreByType.multiple.toFixed(1);
  scoreTermValue.textContent = scoreByType.term.toFixed(1);
  scoreShortValue.textContent = scoreByType.short.toFixed(1);
  scoreTotalValue.textContent = totalScore.toFixed(1);
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
  const targetCount = currentItems.length || Math.min(displayConfig[type] ?? 0, (questionPool[type] || []).length);
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
  tabButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === target);
  });
  panels.forEach((panel) => {
    panel.classList.toggle('active', panel.dataset.type === target);
  });
};

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activateTab(button.dataset.tab);
  });
});

const loadQuestions = async () => {
  try {
    const response = await fetch('js/questions.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('无法加载题库文件');
    }
    questionPool = await response.json();
    panels.forEach((panel) => {
      const type = panel.dataset.type;
      state.currentQuestions[type] = pickQuestions(type);
    });
    renderAll();
    updateScoreMax();
    resetScoreValues();
    activateTab('single');
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

loadQuestions();
