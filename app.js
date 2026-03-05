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
};

ui.startScreen = document.getElementById("start-screen");
ui.easyBtn = document.getElementById("easy-btn");
ui.mediumBtn = document.getElementById("medium-btn");
ui.hardBtn = document.getElementById("hard-btn");

ui.adminBtn = document.getElementById("admin-btn");
ui.adminPanel = document.getElementById("admin-panel");
ui.adminLogin = document.getElementById("admin-login");
ui.adminPassword = document.getElementById("admin-password");
ui.adminEditor = document.getElementById("admin-editor");

ui.adminDifficulty = document.getElementById("admin-difficulty");
ui.adminQuestion = document.getElementById("admin-question");

ui.choiceA = document.getElementById("choice-a");
ui.choiceB = document.getElementById("choice-b");
ui.choiceC = document.getElementById("choice-c");
ui.choiceD = document.getElementById("choice-d");

ui.adminAnswer = document.getElementById("admin-answer");

ui.saveQuestion = document.getElementById("save-question");
ui.exportQuestions = document.getElementById("export-questions");
ui.importQuestions = document.getElementById("import-questions");

const storedQuestions = localStorage.getItem("quizQuestions");

if (storedQuestions) {
  window.MATH_QUESTIONS = JSON.parse(storedQuestions);
};

ui.exportQuestions.addEventListener("click", () => {

  const data = JSON.stringify(window.MATH_QUESTIONS, null, 2);

  const blob = new Blob([data], { type: "application/json" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "questions.json";
  link.click();

});

ui.importQuestions.addEventListener("change", (e) => {

  const file = e.target.files[0];

  const reader = new FileReader();

  reader.onload = function() {

    const data = JSON.parse(reader.result);

    localStorage.setItem("quizQuestions", JSON.stringify(data));

    alert("Questions imported!");

  };

  reader.readAsText(file);

});

const ADMIN_PASSWORD = "RF12345678";

const state = {
  questionBank: [],
  questions: [],
  answers: [],
  index: 0,
  score: 0,
  calculatorInput: "",
};

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

    if (
      q.answer === undefined
      || q.answer === null
      || (typeof q.answer !== "string" && typeof q.answer !== "number")
    ) {
      throw new Error(`Question ${idx + 1} has an invalid answer.`);
    }

    if (!q.choices.some((choice) => isCorrect(choice, q.answer))) {
      throw new Error(`Question ${idx + 1} answer must be present in choices.`);
    }
  });

  return payload;
}

// admin mode toggle and login

ui.adminBtn.addEventListener("click", () => {
  ui.adminPanel.hidden = !ui.adminPanel.hidden;
});

ui.adminLogin.addEventListener("click", () => {

  if (ui.adminPassword.value === ADMIN_PASSWORD) {
    ui.adminEditor.hidden = false;
  } else {
    alert("Incorrect password");
  }

});

//Dashboard loader

function loadDashboard(){

const results = JSON.parse(localStorage.getItem("quizResults") || "[]");

const body = document.getElementById("results-body");

body.innerHTML = "";

results.forEach(r=>{

const row = document.createElement("tr");

row.innerHTML = `
<td>${r.name}</td>
<td>${r.date}</td>
<td>${r.difficulty}</td>
<td>${r.score}</td>
<td>${r.time}s</td>
`;

body.appendChild(row);

});

};

//admin save questions

ui.saveQuestion.addEventListener("click", () => {

  const difficulty = ui.adminDifficulty.value;

  const newQuestion = {
    id: Date.now(),
    question: ui.adminQuestion.value,
    choices: [
      ui.choiceA.value,
      ui.choiceB.value,
      ui.choiceC.value,
      ui.choiceD.value
    ],
    answer: ui.adminAnswer.value
  };

  const questions = JSON.parse(localStorage.getItem("quizQuestions")) || window.MATH_QUESTIONS;

  questions[difficulty].push(newQuestion);

  localStorage.setItem("quizQuestions", JSON.stringify(questions));

  alert("Question saved!");

});

// Export candidate data

document.getElementById("export-candidate-data").onclick = () => {

const results = JSON.parse(localStorage.getItem("quizResults") || "[]");

let csv = "Name,Date,Difficulty,Score,Time\n";

results.forEach(r=>{
csv += `${r.name},${r.date},${r.difficulty},${r.score},${r.time}\n`;
});

const blob = new Blob([csv]);

const a = document.createElement("a");

a.href = URL.createObjectURL(blob);

a.download = "candidate-results.csv";

a.click();

};

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
  if (!selected) {
    return null;
  }
  return selected.value;
}

function renderChoices(question) {
  ui.choiceList.innerHTML = "";

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
    ui.choiceList.append(wrapper);
  });
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
    updateCalculatorScreen("Error");
    state.calculatorInput = "";
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
    updateCalculatorScreen("Error");
    state.calculatorInput = "";
  }
}

function onCalculatorKeyPress(button) {
  const value = button.dataset.calc;
  const action = button.dataset.calcAction;

  if (action === "clear") {
    state.calculatorInput = "";
    updateCalculatorScreen("0");
    return;
  }

  if (action === "equals") {
    evaluateCalculatorInput();
    return;
  }

  if (value) {
    state.calculatorInput += value;
    updateCalculatorScreen(state.calculatorInput);
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
    onCalculatorKeyPress(button);
  });

  updateCalculatorScreen("0");
}

function showQuestion() {
  const q = state.questions[state.index];
  ui.progress.textContent = `Question ${state.index + 1} of ${state.questions.length}`;
  ui.score.textContent = `Score: ${state.score}`;
  ui.questionText.textContent = q.question;
  ui.feedback.textContent = "";
  ui.feedback.className = "feedback";
  renderChoices(q);
}

function renderReview() {
  ui.reviewList.innerHTML = "";

  state.answers.forEach((entry, idx) => {
    const item = document.createElement("li");
    item.className = `review-item ${entry.correct ? "correct" : "incorrect"}`;
    item.innerHTML = `
      <p><strong>Q${idx + 1}:</strong> ${entry.question}</p>
      <p>Your answer: <strong>${entry.userAnswer}</strong></p>
      <p>Correct answer: <strong>${entry.correctAnswer}</strong></p>
      <p>${entry.correct ? "✅ Correct" : "❌ Incorrect"}</p>
    `;
    ui.reviewList.append(item);
  });
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

function finishQuiz() {
  ui.card.hidden = true;
  ui.result.hidden = false;
  ui.finalScore.textContent = `You answered ${state.score} out of ${state.questions.length} correctly.`;
  renderReview();
  saveCandidateResult();
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

  state.questionBank = validateQuestions(window.MATH_QUESTIONS[difficulty]);
  state.questions = shuffleQuestions(state.questionBank);

  ui.startScreen.hidden = true;
  ui.result.hidden = true;
  ui.card.hidden = false;
  ui.error.hidden = true;

  ui.score.textContent = "Score: 0";

  showQuestion();
  startTimer();
}

function showError(message) {
  ui.card.hidden = true;
  ui.result.hidden = true;
  ui.error.hidden = false;
  ui.errorMessage.textContent = message;
}

ui.answerForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const answer = getSelectedChoiceValue();
  if (answer === null) {
    return;
  }

  const q = state.questions[state.index];
  const correct = isCorrect(q.answer, answer);

  state.answers.push({
    question: q.question,
    userAnswer: answer,
    correctAnswer: q.answer,
    correct,
  });

  if (correct) {
    state.score += 1;
    ui.feedback.textContent = "Correct!";
    ui.feedback.className = "feedback good";
  } else {
    ui.feedback.textContent = `Not quite. Correct answer: ${q.answer}`;
    ui.feedback.className = "feedback bad";
  }

  ui.score.textContent = `Score: ${state.score}`;
  setTimeout(nextQuestion, 700);
});

ui.easyBtn.addEventListener("click", () => startQuiz("easy"));
ui.mediumBtn.addEventListener("click", () => startQuiz("medium"));
ui.hardBtn.addEventListener("click", () => startQuiz("hard"));
ui.restart.addEventListener("click", startQuiz);
ui.downloadResults.addEventListener("click", downloadResultsFile);

// ANTI-CHEAT MODE
// disable tab switching

let tabSwitched = false;

document.addEventListener("visibilitychange", () => {

if(document.hidden){

tabSwitched = true;

alert("Warning: Tab switching detected.");

}

});

// block copy/paste

document.addEventListener("copy", e => e.preventDefault());
document.addEventListener("paste", e => e.preventDefault());

// Timer System

let startTime;

function startTimer(){

startTime = Date.now();

}

function getTimeTaken(){

const end = Date.now();

return Math.floor((end - startTime)/1000);

};

// Candidate Tracking

function saveCandidateResult(name, score, difficulty){

const results = JSON.parse(localStorage.getItem("quizResults") || "[]");

results.push({
name,
score,
difficulty,
date: new Date().toLocaleDateString(),
time: getTimeTaken()
});

localStorage.setItem("quizResults", JSON.stringify(results));

};

(() => {
  try {
    initializeCalculator();
	ui.startScreen.hidden = false;
	ui.card.hidden = true;
  } catch (error) {
    console.error(error);
    showError(`Could not load built-in questions: ${error.message}`);
  }
})();
