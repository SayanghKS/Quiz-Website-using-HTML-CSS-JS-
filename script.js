let questions = []; // now empty, will fill from API
let currentQuestion = 0;
let score = 0;
let timer;
let timeLeft = 15;

const questionElement = document.getElementById("question");
const optionsElement = document.getElementById("options");
const nextButton = document.getElementById("next-btn");
const resultElement = document.getElementById("result");
const progressElement = document.getElementById("progress");
const timerElement = document.getElementById("timer");
const restartButton = document.getElementById("restart-btn");

// ✅ Fetch questions from API
async function fetchQuestions() {
    try {
        const response = await fetch("https://opentdb.com/api.php?amount=10&category=23&type=multiple");
        const data = await response.json();

        // Convert API data into your quiz format
        questions = data.results.map(q => {
            // decode HTML entities (like &quot;)
            const parser = new DOMParser();
            const decodedQuestion = parser.parseFromString(q.question, "text/html").body.textContent;

            const options = [...q.incorrect_answers];
            const correctIndex = Math.floor(Math.random() * (options.length + 1));
            options.splice(correctIndex, 0, q.correct_answer);

            // decode options too
            const decodedOptions = options.map(opt => parser.parseFromString(opt, "text/html").body.textContent);

            return {
                question: decodedQuestion,
                options: decodedOptions,
                answer: correctIndex
            };
        });

        loadQuestion();
    } catch (error) {
        questionElement.textContent = "⚠️ Failed to load questions. Please try again.";
        console.error("Error fetching questions:", error);
    }
}

function loadQuestion() {
    resetState();
    const q = questions[currentQuestion];
    questionElement.textContent = q.question;
    progressElement.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;

    q.options.forEach((option, index) => {
        const li = document.createElement("li");
        li.textContent = option;
        li.addEventListener("click", () => checkAnswer(index, li));
        optionsElement.appendChild(li);
    });

    startTimer();
}

function resetState() {
    clearInterval(timer);
    timeLeft = 15;
    timerElement.textContent = `Time left: ${timeLeft}s`;
    nextButton.classList.add("hide");
    optionsElement.innerHTML = "";
}

function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        timerElement.textContent = `Time left: ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            showCorrectAnswer();
            nextButton.classList.remove("hide");
        }
    }, 1000);
}

function checkAnswer(selectedIndex, selectedLi) {
    clearInterval(timer);
    const correctIndex = questions[currentQuestion].answer;
    const options = optionsElement.querySelectorAll("li");

    options.forEach((li, index) => {
        if (index === correctIndex) {
            li.classList.add("correct");
        } else if (index === selectedIndex) {
            li.classList.add("wrong");
        }
        li.style.pointerEvents = "none";
    });

    if (selectedIndex === correctIndex) {
        score++;
    }
    nextButton.classList.remove("hide");
}

function showCorrectAnswer() {
    const correctIndex = questions[currentQuestion].answer;
    const options = optionsElement.querySelectorAll("li");
    options.forEach((li, index) => {
        if (index === correctIndex) li.classList.add("correct");
        li.style.pointerEvents = "none";
    });
}

nextButton.addEventListener("click", () => {
    currentQuestion++;
    if (currentQuestion < questions.length) {
        loadQuestion();
    } else {
        showResult();
    }
});

function showResult() {
    clearInterval(timer);
    questionElement.textContent = "";
    optionsElement.innerHTML = "";
    nextButton.classList.add("hide");
    progressElement.textContent = "";
    timerElement.textContent = "";

    const percentage = ((score / questions.length) * 100).toFixed(2);
    let highScore = localStorage.getItem("quizHighScore") || 0;

    if (score > highScore) {
        localStorage.setItem("quizHighScore", score);
        highScore = score;
    }

    resultElement.innerHTML = `
    🎉 You scored ${score} out of ${questions.length} <br>
    ✅ Percentage: ${percentage}% <br>
    🏆 High Score: ${highScore}
  `;
    resultElement.classList.remove("hide");
    restartButton.classList.remove("hide");
}

restartButton.addEventListener("click", () => {
    currentQuestion = 0;
    score = 0;
    restartButton.classList.add("hide");
    resultElement.classList.add("hide");
    fetchQuestions(); // fetch new questions when restarting
});

// ✅ Start the quiz by fetching questions
fetchQuestions();