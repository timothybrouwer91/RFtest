const ui = {
  progress: document.getElementById("progress"),
  score: document.getElementById("score"),
  card: document.getElementById("card"),
  questionText: document.getElementById("question-text"),
  answerForm: document.getElementById("answer-form"),
  choiceList: document.getElementById("choice-list"),
  feedback: document.getElementById("feedback"),
  result: document.getElementById("result"),
  finalScore: document.getElementById("final-score"),
  reviewList: document.getElementById("review-list"),
  restart: document.getElementById("restart-btn"),
  downloadResults: document.getElementById("download-results-btn"),
  error: document.getElementById("error"),
  errorMessage: document.getElementById("error-message"),
  calculatorToggle: document.getElementById("calculator-toggle"),
  calculatorPanel: document.getElementById("calculator-panel"),
  calculatorScreen: document.getElementById("calculator-screen"),
  startScreen: document.getElementById("start-screen"),
  easyBtn: document.getElementById("easy-btn"),
  mediumBtn: document.getElementById("medium-btn"),
  hardBtn: document.getElementById("hard-btn"),
  candidateName: document.getElementById("candidate-name"),
  adminBtn: document.getElementById("admin-btn"),
  adminPanel: document.getElementById("admin-panel"),
  adminLogin: document.getElementById("admin-login"),
  adminPassword: document.getElementById("admin-password"),
  adminEditor: document.getElementById("admin-editor"),
  adminDifficulty: document.getElementById("admin-difficulty"),
  adminQuestion: document.getElementById("admin-question"),
  choiceA: document.getElementById("choice-a"),
  choiceB: document.getElementById("choice-b"),
  choiceC: document.getElementById("choice-c"),
  choiceD: document.getElementById("choice-d"),
  adminAnswer: document.getElementById("admin-answer"),
  saveQuestion: document.getElementById("save-question"),
  exportQuestions: document.getElementById("export-questions"),
  importQuestions: document.getElementById("import-questions"),
  dashboard: document.getElementById("dashboard"),
  resultsBody: document.getElementById("results-body"),
  statCandidates: document.getElementById("stat-candidates"),
  statAverage: document.getElementById("stat-average"),
  statHigh: document.getElementById("stat-high"),
  exportCandidateData: document.getElementById("export-candidate-data"),
};

const ADMIN_PASSWORD = "RF12345678";
const QUESTION_KEY = "quizQuestions";
const RESULTS_KEY = "quizResults";

const state = {
  questions: [],
  answers: [],
  index: 0,
  score: 0,
  selectedDifficulty: "",
  calculatorInput: "",
  startTimeMs: 0,
};

function safeParseJSON(raw, fallback) {
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function getQuestionBank() {
  const stored = safeParseJSON(localStorage.getItem(QUESTION_KEY), null);
  return stored || window.MATH_QUESTIONS;
}

function setQuestionBank(questionBank) {
  localStorage.setItem(QUESTION_KEY, JSON.stringify(questionBank));
}

function getResults() {
  const parsed = safeParseJSON(localStorage.getItem(RESULTS_KEY), []);
  return Array.isArray(parsed) ? parsed : [];
}

function setResults(results) {
  localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
}

function normalizeChoice(value) {
  return String(value).trim();
}

function isCorrect(expected, actual) {
  return normalizeChoice(expected) === normalizeChoice(actual);
}

function validateQuestions(payload) {
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error("Question list must be a non-empty array.");
  }

  payload.forEach((q, idx) => {
    if (typeof q.question !== "string" || q.question.trim() === "") {
      throw new Error(`Question ${idx + 1} is missing text.`);
    }

    if (!Array.isArray(q.choices) || q.choices.length < 2) {
      throw new Error(`Question ${idx + 1} must include at least 2 choices.`);
    }

    if (!q.choices.every((choice) => typeof choice === "string" || typeof choice === "number")) {
      throw new Error(`Question ${idx + 1} choices must be strings or numbers.`);
    }

    if (q.answer === undefined || q.answer === null) {
      throw new Error(`Question ${idx + 1} has an invalid answer.`);
    }

    if (!q.choices.some((choice) => isCorrect(choice, q.answer))) {
      throw new Error(`Question ${idx + 1} answer must be present in choices.`);
    }
  });

  return payload;
}

function shuffleQuestions(questions) {
  const copy = [...questions];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getSelectedChoiceValue() {
  const selected = ui.answerForm.querySelector('input[name="choice"]:checked');
  return selected ? selected.value : null;
}

function renderChoices(question) {
  ui.choiceList.innerHTML = "";
  const fragment = document.createDocumentFragment();

  question.choices.forEach((choice, idx) => {
    const id = `choice-${state.index}-${idx}`;

    const wrapper = document.createElement("label");
    wrapper.className = "choice-item";
    wrapper.setAttribute("for", id);

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "choice";
    input.id = id;
    input.value = String(choice);
    input.required = true;

    const text = document.createElement("span");
    text.textContent = String(choice);

    wrapper.append(input, text);
    fragment.append(wrapper);
  });

  ui.choiceList.append(fragment);
}

function updateCalculatorScreen(text) {
  ui.calculatorScreen.textContent = text || "0";
}

function evaluateCalculatorInput() {
  if (!state.calculatorInput) {
    updateCalculatorScreen("0");
    return;
  }

  const safe = state.calculatorInput.replace(/[^0-9+\-*/.()]/g, "");
  if (!safe) {
    state.calculatorInput = "";
    updateCalculatorScreen("Error");
    return;
  }

  try {
    const result = Function(`"use strict"; return (${safe});`)();
    if (!Number.isFinite(result)) {
      throw new Error("Invalid result");
    }
    state.calculatorInput = String(result);
    updateCalculatorScreen(state.calculatorInput);
  } catch {
    state.calculatorInput = "";
    updateCalculatorScreen("Error");
  }
}

function initializeCalculator() {
  ui.calculatorToggle.addEventListener("click", () => {
    ui.calculatorPanel.hidden = !ui.calculatorPanel.hidden;
  });

  ui.calculatorPanel.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) {
      return;
    }

    if (button.dataset.calcAction === "clear") {
      state.calculatorInput = "";
      updateCalculatorScreen("0");
      return;
    }

    if (button.dataset.calcAction === "equals") {
      evaluateCalculatorInput();
      return;
    }

    if (button.dataset.calc) {
      state.calculatorInput += button.dataset.calc;
      updateCalculatorScreen(state.calculatorInput);
    }
  });

  updateCalculatorScreen("0");
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function normalizeResult(record) {
  const totalQuestions = Number(record.totalQuestions || 0);
  const correctAnswers = Number(record.correctAnswers ?? record.score ?? 0);
  const percent = Number(
    record.percent ?? (totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : correctAnswers)
  );

  return {
    name: String(record.name || "Anonymous"),
    date: String(record.date || new Date().toLocaleDateString()),
    difficulty: String(record.difficulty || "unknown"),
    correctAnswers: Number.isFinite(correctAnswers) ? correctAnswers : 0,
    totalQuestions: Number.isFinite(totalQuestions) ? totalQuestions : 0,
    percent: Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0,
    timeSeconds: Number(record.timeSeconds ?? record.time ?? 0) || 0,
  };
}

function loadDashboard() {
  const results = getResults().map(normalizeResult);
  ui.resultsBody.innerHTML = "";

  if (results.length === 0) {
    ui.statCandidates.textContent = "0";
    ui.statAverage.textContent = "0%";
    ui.statHigh.textContent = "0%";
    return;
  }

  let totalPercent = 0;
  let maxPercent = 0;
  const fragment = document.createDocumentFragment();

  results.forEach((record) => {
    totalPercent += record.percent;
    maxPercent = Math.max(maxPercent, record.percent);

    const row = document.createElement("tr");
    const scoreText = record.totalQuestions > 0
      ? `${formatPercent(record.percent)} (${record.correctAnswers}/${record.totalQuestions})`
      : formatPercent(record.percent);

    row.innerHTML = `
      <td>${record.name}</td>
      <td>${record.date}</td>
      <td>${record.difficulty}</td>
      <td>${scoreText}</td>
      <td>${record.timeSeconds}s</td>
    `;

    fragment.append(row);
  });

  ui.resultsBody.append(fragment);
  ui.statCandidates.textContent = String(results.length);
  ui.statAverage.textContent = formatPercent(totalPercent / results.length);
  ui.statHigh.textContent = formatPercent(maxPercent);
}

function exportCandidateData() {
  const rows = getResults().map(normalizeResult);
  const header = "Name,Date,Difficulty,Score,Time";
  const body = rows.map((r) => {
    const scoreText = r.totalQuestions > 0
      ? `${Math.round(r.percent)}% (${r.correctAnswers}/${r.totalQuestions})`
      : `${Math.round(r.percent)}%`;
    return [r.name, r.date, r.difficulty, scoreText, `${r.timeSeconds}s`]
      .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
      .join(",");
  });

  const csv = [header, ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "candidate-results.csv";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function showQuestion() {
  const question = state.questions[state.index];
  ui.progress.textContent = `Question ${state.index + 1} of ${state.questions.length}`;
  ui.score.textContent = `Score: ${state.score}`;
  ui.questionText.textContent = question.question;
  ui.feedback.textContent = "";
  ui.feedback.className = "feedback";
  renderChoices(question);
}

function renderReview() {
  ui.reviewList.innerHTML = "";
  const fragment = document.createDocumentFragment();

  state.answers.forEach((entry, idx) => {
    const item = document.createElement("li");
    item.className = `review-item ${entry.correct ? "correct" : "incorrect"}`;
    item.innerHTML = `
      <p><strong>Q${idx + 1}:</strong> ${entry.question}</p>
      <p>Your answer: <strong>${entry.userAnswer}</strong></p>
      <p>Correct answer: <strong>${entry.correctAnswer}</strong></p>
      <p>${entry.correct ? "✅ Correct" : "❌ Incorrect"}</p>
    `;
    fragment.append(item);
  });

  ui.reviewList.append(fragment);
}

function downloadResultsFile() {
  const header = "Question,Your Answer,Correct Answer,Result";
  const lines = state.answers.map((entry) => {
    const cols = [
      entry.question,
      String(entry.userAnswer),
      String(entry.correctAnswer),
      entry.correct ? "Correct" : "Incorrect",
    ];
    return cols.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",");
  });

  const summary = `"Score","${state.score}/${state.questions.length}","",""`;
  const csv = [header, ...lines, summary].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "math-quiz-results.csv";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getTimeTakenSeconds() {
  return Math.floor((Date.now() - state.startTimeMs) / 1000);
}

function saveCandidateResult() {
  const candidateName = ui.candidateName.value.trim() || "Anonymous";
  const result = {
    name: candidateName,
    difficulty: state.selectedDifficulty,
    correctAnswers: state.score,
    totalQuestions: state.questions.length,
    percent: state.questions.length === 0 ? 0 : (state.score / state.questions.length) * 100,
    date: new Date().toLocaleDateString(),
    timeSeconds: getTimeTakenSeconds(),
  };

  const results = getResults();
  results.push(result);
  setResults(results);
}

function finishQuiz() {
  ui.card.hidden = true;
  ui.result.hidden = false;
  ui.finalScore.textContent = `You answered ${state.score} out of ${state.questions.length} correctly.`;
  renderReview();
  saveCandidateResult();
  loadDashboard();
}

function nextQuestion() {
  state.index += 1;
  if (state.index >= state.questions.length) {
    finishQuiz();
    return;
  }
  showQuestion();
}

function startQuiz(difficulty) {
  state.index = 0;
  state.score = 0;
  state.answers = [];
  state.selectedDifficulty = difficulty;

  const questionBank = getQuestionBank();
  state.questions = shuffleQuestions(validateQuestions(questionBank[difficulty]));

  ui.startScreen.hidden = true;
  ui.result.hidden = true;
  ui.card.hidden = false;
  ui.error.hidden = true;

  ui.score.textContent = "Score: 0";
  state.startTimeMs = Date.now();
  showQuestion();
}

function showError(message) {
  ui.card.hidden = true;
  ui.result.hidden = true;
  ui.error.hidden = false;
  ui.errorMessage.textContent = message;
}

function resetToStart() {
  ui.result.hidden = true;
  ui.card.hidden = true;
  ui.startScreen.hidden = false;
}

function handleAnswerSubmit(event) {
  event.preventDefault();

  const answer = getSelectedChoiceValue();
  if (answer === null) {
    return;
  }

  const question = state.questions[state.index];
  const correct = isCorrect(question.answer, answer);

  state.answers.push({
    question: question.question,
    userAnswer: answer,
    correctAnswer: question.answer,
    correct,
  });

  if (correct) {
    state.score += 1;
    ui.feedback.textContent = "Correct!";
    ui.feedback.className = "feedback good";
  } else {
    ui.feedback.textContent = `Not quite. Correct answer: ${question.answer}`;
    ui.feedback.className = "feedback bad";
  }

  ui.score.textContent = `Score: ${state.score}`;
  setTimeout(nextQuestion, 700);
}

function saveQuestionFromAdmin() {
  const difficulty = ui.adminDifficulty.value;
  const questionText = ui.adminQuestion.value.trim();
  const choices = [ui.choiceA.value, ui.choiceB.value, ui.choiceC.value, ui.choiceD.value]
    .map((value) => value.trim())
    .filter(Boolean);
  const answer = ui.adminAnswer.value.trim();

  if (!questionText || choices.length < 2 || !answer) {
    alert("Please provide question text, at least 2 choices, and a correct answer.");
    return;
  }

  if (!choices.some((choice) => isCorrect(choice, answer))) {
    alert("Correct answer must match one of the choices.");
    return;
  }

  const questionBank = getQuestionBank();
  questionBank[difficulty].push({
    id: Date.now(),
    question: questionText,
    choices,
    answer,
  });

  setQuestionBank(questionBank);
  alert("Question saved!");
}

function exportQuestions() {
  const data = JSON.stringify(getQuestionBank(), null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "questions.json";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function importQuestions(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const data = safeParseJSON(reader.result, null);
    if (!data || !data.easy || !data.medium || !data.hard) {
      alert("Invalid questions file.");
      return;
    }

    try {
      validateQuestions(data.easy);
      validateQuestions(data.medium);
      validateQuestions(data.hard);
      setQuestionBank(data);
      alert("Questions imported!");
    } catch (error) {
      alert(error.message);
    }
  };
  reader.readAsText(file);
}

function initializeAdmin() {
  ui.adminBtn.addEventListener("click", () => {
    ui.adminPanel.hidden = !ui.adminPanel.hidden;
    if (!ui.adminPanel.hidden) {
      loadDashboard();
    }
  });

  ui.adminLogin.addEventListener("click", () => {
    if (ui.adminPassword.value === ADMIN_PASSWORD) {
      ui.adminEditor.hidden = false;
      ui.dashboard.hidden = false;
      loadDashboard();
    } else {
      alert("Incorrect password");
    }
  });

  ui.saveQuestion.addEventListener("click", saveQuestionFromAdmin);
  ui.exportQuestions.addEventListener("click", exportQuestions);
  ui.importQuestions.addEventListener("change", importQuestions);
  ui.exportCandidateData.addEventListener("click", exportCandidateData);
}

function initializeEvents() {
  ui.easyBtn.addEventListener("click", () => startQuiz("easy"));
  ui.mediumBtn.addEventListener("click", () => startQuiz("medium"));
  ui.hardBtn.addEventListener("click", () => startQuiz("hard"));
  ui.answerForm.addEventListener("submit", handleAnswerSubmit);
  ui.restart.addEventListener("click", resetToStart);
  ui.downloadResults.addEventListener("click", downloadResultsFile);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      alert("Warning: Tab switching detected.");
    }
  });

  document.addEventListener("copy", (e) => e.preventDefault());
  document.addEventListener("paste", (e) => e.preventDefault());
}

(function init() {
  try {
    const questionBank = getQuestionBank();
    validateQuestions(questionBank.easy);
    validateQuestions(questionBank.medium);
    validateQuestions(questionBank.hard);

    initializeCalculator();
    initializeAdmin();
    initializeEvents();

    ui.startScreen.hidden = false;
    ui.card.hidden = true;
    ui.result.hidden = true;
    ui.dashboard.hidden = true;
  } catch (error) {
    console.error(error);
    showError(`Could not load built-in questions: ${error.message}`);
  }
})();
