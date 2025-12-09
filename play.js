import { letters,wordPuzzles } from "./letters.js"



let START_DATE = new Date('2025-01-01');

let currentDay = 1;
let selectedLetter = null;
let unlockedLetters = {};
let currentGuess = '';
let attempts = 0;
let maxAttempts = 6;
let guesses = [];
let keyboardState = {};
let currentPuzzle = null;

let keyboard = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
];

function calculateCurrentDay() {
    const now = new Date();
    const diffTime = Math.abs(now - START_DATE);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    currentDay = Math.min(diffDays + 1, 5);
}

function isUnlocked(day) {
    return day <= currentDay && unlockedLetters[day];
}

function renderEnvelopes() {
    let container = document.getElementById('envelopes');
    container.innerHTML = '';

    letters.forEach(function(letter) {
        let isAvailable = letter.day <= currentDay;
        let isLetterUnlocked = unlockedLetters[letter.day];

        let envelope = document.createElement('div');
        envelope.className = 'envelope ' + (isLetterUnlocked ? 'unlocked ' + letter.color : 'locked');

        if (isAvailable && !isLetterUnlocked) {
            envelope.onclick = function() {
                startGame(letter);
            };
            envelope.style.cursor = 'pointer';
        } else if (isLetterUnlocked) {
            envelope.onclick = function() {
                openLetter(letter);
            };
        }

        let icon = isLetterUnlocked ? '✉️' : (isAvailable ? '🎮' : '🔒');
        let subtitle = isLetterUnlocked
            ? 'Click to read'
            : (isAvailable ? 'Play to unlock' : 'Available on day ' + letter.day);

        envelope.innerHTML =
            '<div class="envelope-left"><div class="envelope-icon">' +
            icon +
            '</div><div><div class="envelope-title">Day ' + letter.day +
            '</div><div class="envelope-subtitle">' + subtitle +
            '</div></div></div>' +
            (isLetterUnlocked ? '<div class="heart-small">❤️</div>' : '');

        container.appendChild(envelope);
    });

    // 🎉 Show celebration button when all 5 letters are unlocked
    if (Object.keys(unlockedLetters).length === 5) {
        const btn = document.createElement('button');
        btn.textContent = '🎉 Tap for a Surprise 🎉';
        btn.className = 'celebration-btn';
        btn.onclick = openCelebration;
        container.appendChild(btn);
    }

    let unlockedCount = Object.keys(unlockedLetters).length;
    document.getElementById('dayCounter').textContent =
        unlockedCount + ' of ' + Math.min(currentDay, 5) + ' letters unlocked';
}

function startGame(letter) {
    selectedLetter = letter;
    currentPuzzle = wordPuzzles[letter.day];
    currentGuess = '';
    attempts = 0;
    guesses = [];
    keyboardState = {};
    
    document.getElementById('gameDay').textContent = letter.day;
    document.getElementById('hintSection').textContent = currentPuzzle.hint;
    document.getElementById('gameCard').className = 'game-card ' + letter.color;
    document.getElementById('attemptCount').textContent = '0';
    document.getElementById('gameMessage').textContent = '';
    document.getElementById('gameMessage').className = 'message';
    
    renderKeyboard();
    renderGuesses();
    
    document.getElementById('mainView').style.display = 'none';
    document.getElementById('gameView').classList.add('active');
}

function renderKeyboard() {
    let container = document.getElementById('keyboard');
    container.innerHTML = '';
    
    keyboard.forEach(function(row) {
        let rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        
        row.forEach(function(key) {
            let keyBtn = document.createElement('button');
            keyBtn.className = 'key' + (key.length > 1 ? ' wide' : '');
            keyBtn.textContent = key;
            keyBtn.onclick = function() { handleKeyPress(key); };
            
            if (keyboardState[key]) {
                keyBtn.classList.add(keyboardState[key]);
            }
            
            rowDiv.appendChild(keyBtn);
        });
        
        container.appendChild(rowDiv);
    });
}

function renderGuesses() {
    let container = document.getElementById('guessesContainer');
    container.innerHTML = '';
    
    for (let i = 0; i < maxAttempts; i++) {
        let guessDiv = document.createElement('div');
        guessDiv.className = 'word-display';
        
        let wordLength = currentPuzzle.word.length;
        for (let j = 0; j < wordLength; j++) {
            let box = document.createElement('div');
            box.className = 'letter-box';
            
            if (guesses[i]) {
                box.textContent = guesses[i].letters[j];
                box.classList.add(guesses[i].states[j]);
            } else if (i === attempts && currentGuess[j]) {
                box.textContent = currentGuess[j];
            }
            
            guessDiv.appendChild(box);
        }
        
        container.appendChild(guessDiv);
    }
}

function handleKeyPress(key) {
    if (attempts >= maxAttempts) return;
    
    let msg = document.getElementById('gameMessage');
    msg.textContent = '';
    
    if (key === '⌫') {
        currentGuess = currentGuess.slice(0, -1);
    } else if (key === 'ENTER') {
        if (currentGuess.length === currentPuzzle.word.length) {
            submitGuess();
        } else {
            msg.textContent = 'Not enough letters!';
            msg.className = 'message error';
        }
    } else if (currentGuess.length < currentPuzzle.word.length) {
        currentGuess += key;
    }
    
    renderGuesses();
}

function submitGuess() {
    let target = currentPuzzle.word;
    let states = [];
    let letterCount = {};
    
    for (let i = 0; i < target.length; i++) {
        letterCount[target[i]] = (letterCount[target[i]] || 0) + 1;
    }
    
    for (let i = 0; i < currentGuess.length; i++) {
        if (currentGuess[i] === target[i]) {
            states[i] = 'correct';
            letterCount[currentGuess[i]]--;
        } else {
            states[i] = 'absent';
        }
    }
    
    for (let i = 0; i < currentGuess.length; i++) {
        if (states[i] === 'absent' && letterCount[currentGuess[i]] > 0) {
            states[i] = 'present';
            letterCount[currentGuess[i]]--;
        }
    }
    
    guesses.push({
        letters: currentGuess.split(''),
        states: states
    });
    
    for (let i = 0; i < currentGuess.length; i++) {
        let letter = currentGuess[i];
        let state = states[i];
        
        if (!keyboardState[letter] || 
            (state === 'correct') ||
            (state === 'present' && keyboardState[letter] !== 'correct')) {
            keyboardState[letter] = state;
        }
    }
    
    attempts++;
    document.getElementById('attemptCount').textContent = attempts;
    
    let msg = document.getElementById('gameMessage');
    
    if (currentGuess === target) {
        msg.textContent = '🎉 Correct! Letter unlocked!';
        msg.className = 'message success';
        unlockedLetters[selectedLetter.day] = true;
        
        setTimeout(function() {
            closeGame();
            openLetter(selectedLetter);
        }, 1500);
    } else if (attempts >= maxAttempts) {
        msg.textContent = 'The word was: ' + target + '. Try again!';
        msg.className = 'message error';
        
        setTimeout(function() {
            closeGame();
        }, 2500);
    }
    
    currentGuess = '';
    renderKeyboard();
    renderGuesses();
}

export function closeGame() {
    document.getElementById('mainView').style.display = 'block';
    document.getElementById('gameView').classList.remove('active');
    renderEnvelopes();
}

export function openLetter(letter) {
    document.getElementById('letterTitle').textContent = letter.title;
    document.getElementById('letterDay').textContent = 'Day ' + letter.day + ' of 8';
    document.getElementById('letterText').textContent = letter.content;
    document.getElementById('letterCard').className = 'letter-card ' + letter.color;
    
    document.getElementById('mainView').style.display = 'none';
    document.getElementById('letterView').classList.add('active');
}

export function closeLetter() {
    document.getElementById('mainView').style.display = 'block';
    document.getElementById('letterView').classList.remove('active');
}

calculateCurrentDay();
renderEnvelopes();

document.addEventListener('keydown', function(e) {
    if (document.getElementById('gameView').classList.contains('active')) {
        let key = e.key.toUpperCase();
        
        if (key === 'BACKSPACE') {
            handleKeyPress('⌫');
        } else if (key === 'ENTER') {
            handleKeyPress('ENTER');
        } else if (key.length === 1 && key >= 'A' && key <= 'Z') {
            handleKeyPress(key);
        }
    }
});

window.closeGame = closeGame
window.openLetter = openLetter
window.closeLetter = closeLetter
// 🎉 Open Celebration
export function openCelebration() {
    // 🎵 Play birthday music
    const audio = document.getElementById("bgMusic");
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {
            console.log("Autoplay blocked, user gesture required.");
        });
    }

    document.getElementById('mainView').style.display = 'none';
    document.getElementById('letterView').style.display = 'none';
    document.getElementById('celebrationView').style.display = 'block';

    // Start all effects
    startConfettiFireworks();
    startFloatingHearts();
    playMusic();
}

// 🎉 Close Celebration
export function closeCelebration() {
    document.getElementById('celebrationView').style.display = 'none';
    document.getElementById('mainView').style.display = 'block';
}

// ❤️ Floating Hearts
function startFloatingHearts() {
    const container = document.getElementById('heartsContainer');
    container.innerHTML = '';

    setInterval(() => {
        let heart = document.createElement('div');
        heart.textContent = '❤️';
        heart.style.left = Math.random() * 90 + 'vw';
        heart.style.bottom = '0';
        container.appendChild(heart);

        setTimeout(() => heart.remove(), 5000);
    }, 500);
}

// 🔥 Fireworks Effect
function startConfettiFireworks() {
    const canvas = document.getElementById('fireworksCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    function firework() {
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height / 2;

        for (let i = 0; i < 50; i++) {
            let angle = Math.random() * Math.PI * 2;
            let speed = Math.random() * 5 + 2;
            let vx = Math.cos(angle) * speed;
            let vy = Math.sin(angle) * speed;

            let r = Math.floor(Math.random() * 255);
            let g = Math.floor(Math.random() * 255);
            let b = Math.floor(Math.random() * 255);

            (function drawParticle() {
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x, y, 3, 3);

                x += vx;
                y += vy;
                vy += 0.03;

                if (y < canvas.height) requestAnimationFrame(drawParticle);
            })();
        }
    }

    setInterval(firework, 600);
}

// 🎵 Play Music
function playMusic() {
    const music = document.getElementById('bgMusic');
    music.volume = 0.4;
    music.play().catch(() => {
        console.log('User interaction required to start music.');
    });
}

