# Recycle Force Skills Quiz

A lightweight, expandable quiz website for stored multiple-choice math questions, with randomized question order and end-of-quiz answer review.

## How to run

Open `Quiz App.html` directly in your browser. No localhost/server features are required.

## Add or remove questions

Update `questions.js`.

Each question object uses this format:

```js
{
  id: 1,
  question: "What is 12 + 7?",
  choices: [15, 17, 19, 21],
  answer: 19,
}
```

- `id`: unique identifier (recommended)
- `question`: text shown to the user
- `choices`: array of answer options (strings and/or numbers)
- `answer`: exact correct value from `choices`

The app validates question data on load and shows an error if data is invalid.


## Extra features

- Questions are randomized each time the quiz starts.
- Use **Download results** on the final screen to save a CSV report for email attachment.

- Use the **Calculator** button in the upper-right corner to open a built-in calculator while taking the quiz.
