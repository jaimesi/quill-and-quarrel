// Store passages by difficulty
let passages = { easy: [], medium: [], hard: [] };

// Game state variables
let timer;
let time = 60;
let errors = 0;
let wpm = 0;
let started = false;
let currentQuote = "";
let userInput = "";
let difficulty = "medium"; // Default difficulty
let mode = "solo"; // Default mode
let currentLine = 0; // Track the current line the user is typing on
let gameOver = false;
let isEventListenerAdded = false; // Track if the event listener has been added

// DOM elements
const quoteElement = document.getElementById("quote");
const timerElement = document.getElementById("timer");
const wpmElement = document.getElementById("wpm");
const errorsElement = document.getElementById("errors");
const restartButton = document.getElementById("restart");
const resultsElement = document.getElementById("results");
const landingPage = document.getElementById("landing-page");
const gameContainer = document.getElementById("game-container");
const difficultyButtons = document.querySelectorAll("#difficulty-buttons button");
const modeButtons = document.querySelectorAll("#mode-buttons button");

// Hide game container initially
gameContainer.style.display = "none";

// Load passages from JSON file
async function loadPassages() {
    try {
        const response = await fetch("passages.json");
        if (!response.ok) {
            throw new Error("Failed to load passages");
        }
        passages = await response.json();
    } catch (error) {
        console.error("Error loading passages:", error);
        alert("Failed to load passages. Please try again later.");
        return false; // Indicate failure
    }
    return true; // Indicate success
}

// Get a random quote based on the selected difficulty
function getRandomQuote(difficulty) {
    const quotes = passages[difficulty];
    if (!quotes || quotes.length === 0) {
        return "Failed to load passage. Please try again.";
    }
    return quotes[Math.floor(Math.random() * quotes.length)];
}

// Initialize and start the game
function startGame() {
    gameOver = false; // Reset game over flag
    currentQuote = getRandomQuote(difficulty);

    // Split the passage into lines and wrap each character in a <span>
    quoteElement.innerHTML = currentQuote.split('\n').map(line => 
        `<div>${line.split('').map(char => `<span>${char}</span>`).join('')}</div>`
    ).join('');

    // Reset game state
    userInput = "";
    errors = 0;
    wpm = 0;
    started = false; // Reset started flag
    time = 60;
    currentLine = 0;
    updateStats();
    resultsElement.textContent = "";
    clearInterval(timer); // Clear the previous timer

    // Reset progress bar
    const progressBar = document.getElementById("progress");
    progressBar.style.transition = "none"; // Disable transition
    progressBar.style.width = "0%"; // Reset to 0%
    void progressBar.offsetWidth; // Force reflow to reset transition
    progressBar.style.transition = ""; // Re-enable transition

    // Set first character as active with blinking cursor
    const firstChar = quoteElement.querySelector("span");
    if (firstChar) {
        firstChar.classList.add("active");
    }

    // Scroll to the top of the quote container
    const quoteContainer = document.getElementById("quote-container");
    quoteContainer.scrollTop = 0;

    // Add the keydown event listener only if the game container is visible
    if (gameContainer.style.display === "block") {
        addKeydownListener();
    }
}

// Handle keyboard input
function handleKeydown(e) {
    if (gameOver) return; // Ignore input if the game is over

    // Prevent default behavior for spacebar
    if (e.key === " ") {
        e.preventDefault();
    }

    // Start the timer on the first keypress
    if (!started) {
        started = true;
        timer = setInterval(updateTime, 1000);
    }

    // Handle printable characters and backspace
    if (e.key.length === 1) {
        userInput += e.key;
    } else if (e.key === "Backspace") {
        userInput = userInput.slice(0, -1);
    }

    // Disable the Enter key
    if (e.key === "Enter") {
        e.preventDefault();
        return;
    }

    // Update the typing display and stats
    updateTyping();
}

// Add the keydown event listener only once and only when the game is running
function addKeydownListener() {
    if (!isEventListenerAdded && gameContainer.style.display === "block") {
        document.addEventListener("keydown", handleKeydown);
        isEventListenerAdded = true;
    }
}

// Remove the keydown event listener when the game is over
function removeKeydownListener() {
    if (isEventListenerAdded) {
        document.removeEventListener("keydown", handleKeydown);
        isEventListenerAdded = false;
    }
}

// Debounce function to limit how often a function is called
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Debounced scroll function
const debouncedScroll = debounce((quoteContainer, scrollPosition) => {
    quoteContainer.scrollTo({
        top: scrollPosition,
        behavior: "smooth"
    });
}, 100); // Adjust the delay (in milliseconds) as needed

// Update the typing display and handle errors
function updateTyping() {
    const quoteChars = quoteElement.querySelectorAll("span");
    let newErrors = 0;

    // Compare user input with the quote and update character styling
    quoteChars.forEach((char, i) => {
        if (i < userInput.length) {
            if (userInput[i] === char.textContent) {
                char.classList.add("correct");
                char.classList.remove("incorrect");
            } else {
                char.classList.add("incorrect");
                char.classList.remove("correct");
                newErrors++;
            }
        } else {
            char.classList.remove("correct", "incorrect");
        }
        char.classList.remove("active");
    });

    errors = newErrors; // Update the global errors count

    // Set cursor on the next character
    if (userInput.length < quoteChars.length) {
        quoteChars[userInput.length].classList.add("active");

        // Calculate the current line based on the user's input
        const activeChar = quoteChars[userInput.length];
        const activeLine = Array.from(quoteElement.children).indexOf(activeChar.parentElement);

        // Always scroll to keep the active line in view
        const quoteContainer = document.getElementById("quote-container");
        const lineHeight = activeChar.parentElement.offsetHeight; // Height of one line

        // Use a fixed scroll offset (e.g., 2 lines above the active line)
        const scrollPosition = (activeLine - 2) * lineHeight;

        // Use the debounced scroll function
        debouncedScroll(quoteContainer, scrollPosition);
    } else {
        // End the game if the user finishes typing
        clearInterval(timer);
        calculateResults();
    }

    // Update stats and progress bar
    updateStats();
    updateProgressBar();
}

// Update the progress bar based on the user's progress
function updateProgressBar() {
    const progressBar = document.getElementById("progress");
    const progress = (userInput.length / currentQuote.length) * 100; // Calculate progress percentage

    // Ensure the progress bar fills completely when the user finishes typing
    if (userInput.length >= currentQuote.length) {
        progressBar.style.width = "100%";
    } else {
        progressBar.style.width = `${progress}%`;
    }
}

// Update the timer and end the game if time runs out
function updateTime() {
    if (time > 0) {
        time--;
        updateStats();
    } else {
        clearInterval(timer);
        calculateResults();
    }
}

// Show the results modal with completion, correctness, WPM, and rank
function showResultsPopup(completion, correctness, wpm, rank, phrase) {
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
            <p style="font-style: italic;">${phrase}</p>
            <button id="close-modal">Close</button>
        </div>
    `;
    document.body.appendChild(modal);

    // Add event listener to close button
    document.getElementById("close-modal").addEventListener("click", () => {
        modal.remove();
        gameOver = false;
        removeKeydownListener();
    });
}

// Calculate and display the results
function calculateResults() {
    gameOver = true; // Set the game over flag
    removeKeydownListener(); // Remove the keydown event listener

    // Normalize the quote and user input by removing newlines and trimming spaces
    const normalizedQuote = currentQuote.replace(/\n/g, '');
    const normalizedInput = userInput.trim();

     // Calculate completion percentage
    let completion = (normalizedInput.length / normalizedQuote.length) * 100;
    completion = Math.min(completion, 100); // Ensure it doesn't exceed 100%

    // If the user finishes typing (within a small tolerance), set completion to 100%
    if (Math.abs(normalizedInput.length - normalizedQuote.length) <= 1) {
        completion = 100;
    }

    // Calculate correctness based on the portion of the passage the user typed
    let totalTyped = normalizedInput.length;
    let correctTyped = 0;

    for (let i = 0; i < totalTyped; i++) {
        if (normalizedInput[i] === normalizedQuote[i]) {
            correctTyped++;
        }
    }

    let correctness = totalTyped > 0 ? (correctTyped / totalTyped) * 100 : 100;
    correctness = Math.min(correctness, 100); // Ensure it doesn't exceed 100%

    // Determine rank
    let rank = "A Blundering Fool";
    let phrase = "Hast thou even held a quill before?";
    if (wpm >= 120) {
        rank = "A Sonnet-Spinning Deity";
        phrase = "You're basically Shakespeare reborn!";
    } else if (wpm >= 100) {
        rank = "The Bard’s Equal!";
        phrase = "A true master of quill and tongue.";
    } else if (wpm >= 70) {
        rank = "A Noble Scribe";
        phrase = "Respected in the court of literature.";
    } else if (wpm >= 50) {
        rank = "A Quibbling Quillbearer";
        phrase = "A competent wordsmith, yet not quite legendary.";
    } else if (wpm >= 20) {
        rank = "A Mere Knave";
        phrase = "Your prose is riddled with folly.";
    }

    // Demote rank for excessive errors
    if (errors > totalTyped * 0.2) { // More than 20% error rate
        rank = "A Blundering Fool";
        phrase = "Hast thou even held a quill before?";
    }

    // Show the results modal
    showResultsPopup(completion.toFixed(2), correctness.toFixed(2), wpm, rank, phrase);
}

// Update the timer, errors, and WPM display
function updateStats() {
    timerElement.textContent = time;
    errorsElement.textContent = errors;

    let elapsedTime = 60 - time;
    wpm = elapsedTime > 0 ? Math.round((userInput.length / 5) / (elapsedTime / 60)) : 0;
    wpmElement.textContent = wpm;
}

// Restart the game
function restartGame() {
    gameOver = false;
    startGame();
    addKeydownListener();
}

// Handle solo mode button
document.getElementById("solo").addEventListener("click", () => {
    document.getElementById("mode-selection").style.display = "none";
    document.getElementById("difficulty-selection").style.display = "block";
    removeKeydownListener(); // Remove the keydown listener when leaving the game
});

// Handle back to mode page button
document.getElementById("back-to-mode").addEventListener("click", () => {
    document.getElementById("difficulty-selection").style.display = "none";
    document.getElementById("mode-selection").style.display = "block";
    removeKeydownListener(); // Remove the keydown listener when leaving the game
});

// Handle back to difficulty page button
document.getElementById("back-to-difficulty").addEventListener("click", () => {
    restartGame();
    document.getElementById("game-container").style.display = "none";
    document.getElementById("difficulty-selection").style.display = "block";
    removeKeydownListener(); // Remove the keydown listener when leaving the game
});

// Handle difficulty selection
difficultyButtons.forEach(button => {
    button.addEventListener("click", async () => {
        difficulty = button.id; // Update difficulty
        document.getElementById("difficulty-selection").style.display = "none";
        document.getElementById("game-container").style.display = "block";
        await startGame(); // Wait for the game to start
        addKeydownListener(); // Add the keydown listener when starting the game
    });
});

// Add event listener to restart button
restartButton.addEventListener("click", restartGame);

// Initialize the game when the DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
    if (await loadPassages()) startGame(); // Wait for passages to load to start game
});