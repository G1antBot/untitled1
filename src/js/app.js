let questionBank = null;

const scoreConfig = {
  single: 1,
  multiple: 2,
  term: 2,
  short: (100 - 50 - 10 - 20) / 3
};

const tabButtons = document.querySelectorAll('[data-tab]');
const panels = document.querySelectorAll('.tab-panel');
const scoreOutput = document.querySelector('#score-value');
const checkButton = document.querySelector('#check-answers');
const resetButton = document.querySelector('#reset-answers');

const state = {
  answers: new Map()
};

const normalize = (value) => {
  if (!value) return '';
  return value
    .toString()
    .toLowerCase()
    .replace(/[\s\u3000\uFF01-\uFF65\u3001-\u303F.,;:!?、，。；：]/g, '')
    .trim();
};

const createOption = (type, name, option, index) => {
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
  const items = questionBank[type] || [];
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
      item.options.forEach((option, optionIndex) => {
        list.appendChild(createOption(type === 'single' ? 'radio' : 'checkbox', name, option, optionIndex));
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

const checkAnswers = () => {
  if (!questionBank) {
    return;
  }
  let totalScore = 0;

  panels.forEach((panel) => {
    const type = panel.dataset.type;
    const items = questionBank[type] || [];

    items.forEach((item, idx) => {
      const name = `${type}-${idx}`;
      const feedback = panel.querySelector(`.feedback[data-name="${name}"]`);
      const card = feedback.closest('.question-card');
      const answer = state.answers.get(name);

      let correct = false;
      if (type === "single") {
        correct = answer === item.answer;
      } else if (type === "multiple") {
        const correctSet = new Set(item.answer);
        const answerSet = new Set(answer || []);
        correct = correctSet.size === answerSet.size && [...correctSet].every((v) => answerSet.has(v));
      } else {
        const user = normalize(answer || '');
        const key = normalize(item.answer || '');
        if (user && key) {
          correct = key.includes(user) || user.includes(key);
        }
      }

      feedback.textContent = `正确答案�?{type === 'multiple' ? item.answer.join('�?) : item.answer}`;
      card.classList.remove('is-correct', 'is-wrong');
      card.classList.add(correct ? 'is-correct' : 'is-wrong');

      if (correct) {
        totalScore += scoreConfig[type];
      }
    });
  });

  scoreOutput.textContent = totalScore.toFixed(1);
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
  scoreOutput.textContent = '0';
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
    questionBank = await response.json();
    renderAll();
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

loadQuestions();
