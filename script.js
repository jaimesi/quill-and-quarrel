const quotes = [
    "To be, or not to be: that is the question.",
    "The lady doth protest too much, methinks.",
    "All the world's a stage, and all the men and women merely players.",
    "Parting is such sweet sorrow, that I shall say good night till it be morrow."
];

let timer;
let time = 60;
let errors = 0;
let wpm = 0;
let started = false;
let currentQuote = "";
let userInput = "";

const quoteElement = document.getElementById("quote");
const timerElement = document.getElementById("timer");
const wpmElement = document.getElementById("wpm");
const errorsElement = document.getElementById("errors");
const restartButton = document.getElementById("restart");
const resultsElement = document.getElementById("results");

function getRandomQuote() {
    return quotes[Math.floor(Math.random() * quotes.length)];
}

function startGame() {
    currentQuote = getRandomQuote();
    quoteElement.innerHTML = currentQuote.split('').map(char => `<span>${char}</span>`).join('');
    userInput = "";
    errors = 0;
    wpm = 0;
    started = false;
    time = 60;
    updateStats();
    resultsElement.textContent = "";
    clearInterval(timer);
    
    // Set first character as active with blinking cursor
    quoteElement.children[0].classList.add('active');
}

// Listen for typing input
document.addEventListener("keydown", (e) => {
    if (!started) {
        started = true;
        timer = setInterval(updateTime, 1000);
    }

    if (e.key.length === 1) { // Only process printable characters
        userInput += e.key;
        updateTyping();
    } else if (e.key === "Backspace") {
        userInput = userInput.slice(0, -1);
        updateTyping();
    }
});

function updateTyping() {
    const quoteChars = quoteElement.querySelectorAll("span");
    errors = 0;

    quoteChars.forEach((char, i) => {
        if (i < userInput.length) {
            if (userInput[i] === char.textContent) {
                char.classList.add("correct");
                char.classList.remove("incorrect");
            } else {
                char.classList.add("incorrect");
                char.classList.remove("correct");
                errors++;
            }
        } else {
            char.classList.remove("correct", "incorrect");
        }
        char.classList.remove("active");
    });

    // Set cursor on the next character
    if (userInput.length < quoteChars.length) {
        quoteChars[userInput.length].classList.add("active");
    } else {
        clearInterval(timer);
        calculateResults();
    }

    updateStats();
}

function updateTime() {
    if (time > 0) {
        time--;
        updateStats();
    } else {
        clearInterval(timer);
        calculateResults();
    }
}

function showResultsPopup(completion, correctness, wpm, rank) {
    // Check if modal already exists, remove it first
    const existingModal = document.getElementById("results-modal");
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal container
    const modal = document.createElement("div");
    modal.id = "results-modal";
    modal.innerHTML = `
        <div id="results-content">
            <h2>Results</h2>
            <p>Completion: ${completion}%</p>
            <p>Correctness: ${correctness}%</p>
            <p>WPM: ${wpm}</p>
            <p>Rank: ${rank}</p>
            <button id="close-modal">Close</button>
        </div>
    `;
    document.body.appendChild(modal);

    // Add event listener to close button
    document.getElementById("close-modal").addEventListener("click", () => {
        modal.remove();
    });
}

function calculateResults() {
    let completion = (userInput.length / currentQuote.length) * 100;
    completion = Math.min(completion, 100); // Prevent over 100%

    let totalTyped = userInput.length;
    let correctTyped = 0;

    for (let i = 0; i < totalTyped; i++) {
        if (userInput[i] === currentQuote[i]) {
            correctTyped++;
        }
    }

    let correctness = totalTyped > 0 ? (correctTyped / totalTyped) * 100 : 100;
    correctness = Math.min(correctness, 100);

    // Determine rank
    let rank = "A Mere Knave";
    if (wpm >= 100) {
        rank = "The Bard’s Equal!";
    } else if (wpm >= 60) {
        rank = "A Noble Scribe";
    }

    // Demote rank for excessive errors
    if (errors > totalTyped * 0.2) { // More than 20% error rate
        rank = "A Mere Knave";
    }

    showResultsPopup(completion.toFixed(2), correctness.toFixed(2), wpm, rank);
}

function updateStats() {
    timerElement.textContent = time;
    wpmElement.textContent = wpm;
    errorsElement.textContent = errors;

    let elapsedTime = 60 - time; // Time that has passed
    if (elapsedTime > 0) {
        wpm = Math.round((userInput.length / 5) / (elapsedTime / 60));
    } else {
        wpm = 0;
    }

    wpmElement.textContent = wpm;
}

restartButton.addEventListener("click", startGame);
document.addEventListener("DOMContentLoaded", startGame);
