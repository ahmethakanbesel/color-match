const gameState = {
  score: 0,
  timeLeft: 30,
  maxTime: 10,
  isPlaying: false,
  lastCardTime: 0,
  bestScore: 0,
  language: 'en',
  countdownInterval: null,
  isWelcomeCard: true,
  soundEnabled: true,
  speedFactor: 1.0, // Base speed factor that will increase with each correct answer
  difficultyMultiplier: 0.001, // How much to increase difficulty per correct answer
  currentStreakMultiplier: 1.0 // Bonus multiplier for consecutive correct answers
};

// Sound effects
const sounds = {
  swipe: new Audio('swipe.mp3'),
  correct: new Audio('correct.wav'),
  wrong: new Audio('wrong.mp3'),
};

// Available colors for the game
const colors = {
  red: { en: 'RED', tr: 'KIRMIZI' },
  blue: { en: 'BLUE', tr: 'MAVİ' },
  green: { en: 'GREEN', tr: 'YEŞİL' },
  yellow: { en: 'YELLOW', tr: 'SARI' },
  purple: { en: 'PURPLE', tr: 'MOR' },
  orange: { en: 'ORANGE', tr: 'TURUNCU' },
  black: { en: 'BLACK', tr: 'SİYAH' },
};

// Color hex codes
const colorHexCodes = {
  red: '#EC1A2F',
  blue: '#01A2E6',
  green: '#62BB46',
  yellow: '#FEE019',
  purple: '#786BCF',
  orange: '#FCAC53',
  black: '#000000',
};

// Translations for UI elements
const translations = {
  en: {
    title: 'Color Match!',
    instruction:
      "Swipe right if the text matches its color, left if it doesn't!",
    score: 'Score:',
    gameOver: 'Game Over!',
    finalScore: 'Your final score:',
    bestScore: 'Best score:',
    restart: 'Play Again',
    about: 'About Color Match!',
    aboutText:
      "Color Match! is a fast-paced game where you need to swipe right if the color name matches its text color, and left if it doesn't. Each correct match adds time to your countdown, with faster responses adding more time. Wrong choices have a time penalty. How long can you keep the game going?",
    close: 'Tap anywhere to close',
    startGame: 'Start Game',
    timeRunningOut: 'Time running out!',
    swipeToStart: 'Swipe to start',
  },
  tr: {
    title: 'Renk Eşleştirme!',
    instruction:
      'Renk ismi ile rengi eşleşiyorsa sağa, eşleşmiyorsa sola kaydır!',
    score: 'Puan:',
    gameOver: 'Oyun Bitti!',
    finalScore: 'Toplam puanınız:',
    bestScore: 'En yüksek puan:',
    restart: 'Tekrar Oyna',
    about: 'Renk Eşleştirme Hakkında',
    aboutText:
      'Renk Eşleştirme, renk ismi ve rengin eşleştiği durumlarda sağa, eşleşmediği durumlarda sola kaydırmanız gereken hızlı bir oyundur. Her doğru eşleşme geri sayıma süre ekler, daha hızlı yanıtlar daha fazla süre kazandırır. Yanlış seçimler zaman cezasına neden olur. Oyunu ne kadar süre devam ettirebilirsiniz?',
    close: 'Kapatmak için herhangi bir yere tıklayın',
    startGame: 'Oyuna Başla',
    timeRunningOut: 'Süre bitiyor!',
    swipeToStart: 'Başlamak için kaydırın',
  },
};

// DOM elements
let cardElement;
let cardTextElement;
let scoreElement;
let timerProgressElement;
let gameOverElement;
let gameOverReasonElement;
let restartButtonElement;
let aboutIconElement;
let aboutModalElement;
let startScreenElement;
let startButtonElement;
let languageButtons;
let timerWarningElement;
let soundToggleElement;

// Current card that's being shown
let currentCard = null;

// Sound function - play sound if enabled
function playSound(soundName) {
  if (gameState.soundEnabled && sounds[soundName]) {
    // Reset sound to beginning in case it's already playing
    sounds[soundName].currentTime = 0;
    sounds[soundName].play().catch((err) => {
      // Handle autoplay restrictions gracefully
      console.log('Error playing sound:', err);
    });
  }
}

// Toggle sound on/off
function toggleSound() {
  gameState.soundEnabled = !gameState.soundEnabled;

  // Update the sound button icon
  if (soundToggleElement) {
    soundToggleElement.textContent = gameState.soundEnabled ? '🔊' : '🔈';
  }

  // Save sound preference to localStorage
  saveSoundPreference();
}

// Save sound preference to local storage
function saveSoundPreference() {
  localStorage.setItem(
    'colorMatchSoundEnabled',
    gameState.soundEnabled.toString()
  );
}

// Load sound preference from local storage
function loadSoundPreference() {
  const savedPreference = localStorage.getItem('colorMatchSoundEnabled');
  if (savedPreference !== null) {
    gameState.soundEnabled = savedPreference === 'true';
  }
}

// Generate a random card
function generateRandomCard() {
  // Get random color for the text content
  const colorNames = Object.keys(colors);
  const textColorIndex = Math.floor(Math.random() * colorNames.length);
  const textColorName = colorNames[textColorIndex];

  // Get random color for the text display color
  const displayColorIndex = Math.floor(Math.random() * colorNames.length);
  const displayColorName = colorNames[displayColorIndex];

  // Determine if this is a match (50% chance normally)
  // Let's give slightly higher chance for matches to help players
  const isMatch = Math.random() < 0.55;

  // If we want a match, set display color same as text color
  const finalDisplayColorName = isMatch
    ? textColorName
    : displayColorName === textColorName
      ? colorNames[(displayColorIndex + 1) % colorNames.length]
      : displayColorName;

  return {
    textColorName,
    displayColorName: finalDisplayColorName,
    isMatch: textColorName === finalDisplayColorName,
  };
}

// Update the card UI
function updateCardUI(card) {
  currentCard = card; // Store the current card
  const lang = gameState.language;
  cardTextElement.textContent = colors[card.textColorName][lang];
  cardTextElement.style.color = colorHexCodes[card.displayColorName];

  // Reset card position and style
  cardElement.style.transition = 'none';
  cardElement.style.transform = 'rotate(0) translateX(0)';
  cardElement.style.opacity = '1';
  cardElement.style.background = 'white';

  // Record the time this card was shown
  gameState.lastCardTime = Date.now();
}

// Initialize the game
function initializeGame() {
  loadBestScore();
  loadLanguagePreference();
  loadSoundPreference();
  updateLanguageUI();
  updateLanguageButtons();
  updateSoundButton();

  showWelcomeCard();
}

// Update sound button based on current state
function updateSoundButton() {
  if (soundToggleElement) {
    soundToggleElement.textContent = gameState.soundEnabled ? '🔊' : '🔈';
  }
}

// Start the game
function startGame() {
  gameState.score = 0;
  gameState.timeLeft = 10;
  gameState.maxTime = 10;
  gameState.isPlaying = true;
  gameState.speedFactor = 1.0; // Reset speed factor
  gameState.currentStreakMultiplier = 1.0; // Reset streak multiplier

  // Hide start screen and game over screen
  if (startScreenElement) startScreenElement.style.display = 'none';
  if (gameOverElement) gameOverElement.style.display = 'none';

  // Update UI
  updateScoreUI();
  updateTimerProgressBar();

  // Show the first card
  const initialCard = generateRandomCard();
  updateCardUI(initialCard);

  // Start the countdown
  if (gameState.countdownInterval) {
    clearInterval(gameState.countdownInterval);
  }

  gameState.countdownInterval = setInterval(() => {
    // Time decreases faster as the speed factor increases
    const timeDecrease = 0.1 * gameState.speedFactor;
    gameState.timeLeft -= timeDecrease;
    updateTimerProgressBar();

    if (gameState.timeLeft <= 0) {
      endGame();
    }
  }, 100);
}

// End the game
function endGame() {
  gameState.isPlaying = false;
  clearInterval(gameState.countdownInterval);

  // Check if this is a new best score
  if (gameState.score > gameState.bestScore) {
    gameState.bestScore = gameState.score;
    saveBestScore();
  }

  // Show game over screen
  showGameOver();
}

// Load best score from local storage
function loadBestScore() {
  const savedBest = localStorage.getItem('colorMatchBestScore-v2');
  if (savedBest) {
    gameState.bestScore = parseInt(savedBest, 10);
  }
}

// Save best score to local storage
function saveBestScore() {
  localStorage.setItem('colorMatchBestScore-v2', gameState.bestScore.toString());
}

// Load language preference from local storage
function loadLanguagePreference() {
  const savedLanguage = localStorage.getItem('colorMatchLanguage');
  if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'tr')) {
    gameState.language = savedLanguage;
  }
}

// Save language preference to local storage
function saveLanguagePreference(lang) {
  localStorage.setItem('colorMatchLanguage', lang);
}

// Update the score UI
function updateScoreUI() {
  const lang = gameState.language;
  scoreElement.textContent = `${translations[lang].score} ${gameState.score}`;
}

// Update the timer progress bar
function updateTimerProgressBar() {
  const percentLeft = (gameState.timeLeft / gameState.maxTime) * 100;
  timerProgressElement.style.width = `${percentLeft}%`;

  // Show warning when less than 10 seconds left
  if (gameState.timeLeft <= 3) {
    timerProgressElement.classList.add('warning');
    if (timerWarningElement) {
      timerWarningElement.style.display = 'none';
      timerWarningElement.querySelector('span:last-child').textContent =
        translations[gameState.language].timeRunningOut;
    }
  } else {
    timerProgressElement.classList.remove('warning');
    if (timerWarningElement) {
      timerWarningElement.style.display = 'none';
    }
  }
}

// Show the game over screen
function showGameOver() {
  const lang = gameState.language;

  if (!gameOverElement) return;

  gameOverElement.style.display = 'flex';

  // Update game over text
  if (gameOverReasonElement) {
    gameOverReasonElement.innerHTML = `
      <div>${translations[lang].finalScore} ${gameState.score}</div>
      <div>${translations[lang].bestScore} ${gameState.bestScore}</div>
    `;
  }
}

// Show the start screen
function showStartScreen() {
  if (!startScreenElement) return;

  startScreenElement.style.display = 'flex';
  if (gameOverElement) gameOverElement.style.display = 'none';
}

function showWelcomeCard() {
  gameState.isWelcomeCard = true;

  // Hide start screen if it exists
  if (startScreenElement) startScreenElement.style.display = 'none';
  if (gameOverElement) gameOverElement.style.display = 'none';

  // Set card text to "Swipe to start" in the current language
  const lang = gameState.language;
  cardTextElement.textContent = translations[lang].swipeToStart;

  // Apply welcome text styling
  cardTextElement.classList.add('welcome-text');

  // Reset card position and style
  cardElement.style.transition = 'none';
  cardElement.style.transform = 'rotate(0) translateX(0)';
  cardElement.style.opacity = '1';
  cardElement.style.background = 'white';

  // Remove any animations/classes that might interfere with dragging
  cardElement.classList.remove('welcome-pulse');

  // Show directional indicators without animation
  const swipeLeft = document.querySelector('.swipe-left');
  const swipeRight = document.querySelector('.swipe-right');
  if (swipeLeft) swipeLeft.style.opacity = '0.8';
  if (swipeRight) swipeRight.style.opacity = '0.8';
}

// Update UI based on selected language
function updateLanguageUI() {
  const lang = gameState.language;

  // Update all text elements in the UI
  document.getElementById('game-title').textContent = translations[lang].title;
  document.getElementById('game-instruction').textContent =
    translations[lang].instruction;

  if (scoreElement)
    scoreElement.textContent = `${translations[lang].score} ${gameState.score}`;

  // Update game over screen
  if (gameOverElement) {
    document.getElementById('game-over-title').textContent =
      translations[lang].gameOver;
    if (restartButtonElement)
      restartButtonElement.textContent = translations[lang].restart;
  }

  // Update about modal
  if (aboutModalElement) {
    document.getElementById('about-title').textContent =
      translations[lang].about;
    document.getElementById('about-text').textContent =
      translations[lang].aboutText;
  }

  // Update start screen
  if (startScreenElement && startButtonElement) {
    startButtonElement.textContent = translations[lang].startGame;
  }

  // Update timer warning text if showing
  if (timerWarningElement && timerWarningElement.style.display === 'flex') {
    timerWarningElement.querySelector('span:last-child').textContent =
      translations[lang].timeRunningOut;
  }

  // If a card is currently showing, update its text according to the language
  if (currentCard) {
    cardTextElement.textContent = colors[currentCard.textColorName][lang];
  }
}

// Update language button styles to show active language
function updateLanguageButtons() {
  if (!languageButtons) return;

  languageButtons.forEach((btn) => {
    if (btn.dataset.lang === gameState.language && btn.id !== 'sound-toggle') {
      btn.classList.add('active');
    } else if (btn.id !== 'sound-toggle') {
      btn.classList.remove('active');
    }
  });
}

// Handle language change
function changeLanguage(lang) {
  gameState.language = lang;
  saveLanguagePreference(lang);
  updateLanguageUI();
  updateLanguageButtons();

  // If welcome card is showing, update its text
  if (gameState.isWelcomeCard) {
    cardTextElement.textContent = translations[lang].swipeToStart;
  }
}

// Process player's swipe choice
function processSwipe(isRight) {
  if (gameState.isWelcomeCard) {
    cardTextElement.classList.remove('welcome-text');
    gameState.isWelcomeCard = false;
    startGame();
    return;
  }

  if (!gameState.isPlaying || !currentCard) return;

  const responseTime = (Date.now() - gameState.lastCardTime) / 1000; // in seconds

  const isCorrect =
    (isRight && currentCard.isMatch) || (!isRight && !currentCard.isMatch);

  if (isCorrect) {
    playSound('correct');

    // Increase difficulty slightly with each correct answer
    gameState.speedFactor += gameState.difficultyMultiplier * gameState.currentStreakMultiplier;

    // Cap the speed factor to avoid making the game impossible
    gameState.speedFactor = Math.min(gameState.speedFactor, 2.5);

    // Increase the streak multiplier (makes difficulty increase faster on streaks)
    gameState.currentStreakMultiplier = Math.min(gameState.currentStreakMultiplier + 0.1, 3.0);

    // Calculate time bonus based on response time
    // Faster responses (smaller responseTime) get more bonus time
    let baseTimeBonus = Math.max(0.100, Math.min(1.0, 3 - responseTime));
    if (responseTime <= 0.8) {
      // Extra bonus for very fast responses
      baseTimeBonus *= 1.5;
    }

    // Reduce time bonus as difficulty increases
    // Use inverse of speedFactor to reduce time bonus
    const difficultyReduction = 1 / gameState.speedFactor;
    const timeBonus = baseTimeBonus * difficultyReduction;

    // Add time and score
    gameState.timeLeft += timeBonus;
    gameState.score += 1;

    // Update score display
    updateScoreUI();
  } else {
    playSound('wrong');

    // Penalty for wrong answer - lose some time
    // Make penalties more severe as difficulty increases
    const basePenalty = 2;
    const scaledPenalty = basePenalty * gameState.speedFactor;
    gameState.timeLeft = Math.max(0, gameState.timeLeft - scaledPenalty);

    // Reset streak multiplier on incorrect swipe
    gameState.currentStreakMultiplier = 1.0;
  }

  // Generate and show a new card
  const newCard = generateRandomCard();
  updateCardUI(newCard);

  // Animate stack for visual feedback
  animateStackForward();
  addNewCardToStack();
}

// Card stack animation functions adapted from original game
function addNewCardToStack() {
  const cardArea = document.getElementById('card-area');
  const stackItems = document.querySelectorAll('.card-stack-item');

  // If we already have the maximum number of stack items (2), remove the last one
  if (stackItems.length >= 2) {
    stackItems[stackItems.length - 1].remove();
  }

  // Create a new stack item to go at the back
  const newStackItem = document.createElement('div');
  newStackItem.className = 'card-stack-item';

  // Initial position - off screen to the right and transparent
  newStackItem.style.transform = 'translate(20px, 4px)';
  newStackItem.style.opacity = '0';
  newStackItem.style.zIndex = '2';

  // Insert the new stack item at the beginning of card-area (before all other elements)
  cardArea.insertBefore(newStackItem, cardArea.firstChild);

  // Force a reflow to ensure the starting position is applied
  void newStackItem.offsetWidth;

  // Add transition for smooth animation
  newStackItem.style.transition = 'all 0.5s ease';

  // After a tiny delay, animate to the final position (right to left)
  setTimeout(() => {
    newStackItem.style.transform = 'translate(8px, 4px)';
    newStackItem.style.opacity = '0.8';
  }, 50);

  // Reapply styles to main card to ensure it stays on top
  cardElement.style.zIndex = '10';
}

function animateStackForward() {
  const stackItems = document.querySelectorAll('.card-stack-item');

  // Enable transitions on stack items
  stackItems.forEach((item) => {
    item.style.transition = 'all 0.5s ease';
  });

  // Move the first stack item to the main card position
  if (stackItems.length > 0) {
    stackItems[0].style.transform = 'translate(0, 0)';
    stackItems[0].style.opacity = '1';
    stackItems[0].style.zIndex = '5'; // Higher than other stack items
  }

  // Move the second stack item to the first stack position
  if (stackItems.length > 1) {
    stackItems[1].style.transform = 'translate(4px, 2px)';
    stackItems[1].style.opacity = '0.9';
    stackItems[1].style.zIndex = '3';
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // DOM element references
  cardElement = document.getElementById('card');
  cardTextElement = document.getElementById('card-text');
  scoreElement = document.getElementById('score-counter');
  timerProgressElement = document.getElementById('timer-progress');
  gameOverElement = document.getElementById('game-over');
  gameOverReasonElement = document.getElementById('game-over-reason');
  restartButtonElement = document.getElementById('restart-button');
  aboutIconElement = document.getElementById('about-icon');
  aboutModalElement = document.getElementById('about-modal');
  startScreenElement = document.getElementById('start-screen');
  startButtonElement = document.getElementById('start-button');
  languageButtons = document.querySelectorAll('.language-btn');
  timerWarningElement = document.getElementById('timer-warning');
  soundToggleElement = document.getElementById('sound-toggle');

  // Card dragging logic
  let dragging = false;
  let startX = 0;
  let currentX = 0;

  cardElement.addEventListener('mousedown', startDrag);
  cardElement.addEventListener('touchstart', startDrag, { passive: false });
  document.addEventListener('mousemove', drag);
  document.addEventListener('touchmove', drag, { passive: false });
  document.addEventListener('mouseup', endDrag);
  document.addEventListener('touchend', endDrag);

  function startDrag(e) {
    if (!gameState.isPlaying && !gameState.isWelcomeCard) return;

    dragging = true;
    startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    currentX = 0;
    cardElement.style.transition = 'none';

    if (e.type.includes('touch')) {
      e.preventDefault();
    }
  }

  function drag(e) {
    if (!dragging || (!gameState.isPlaying && !gameState.isWelcomeCard)) return;

    const x = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const deltaX = x - startX;
    currentX = deltaX;

    // Limit rotation for smoother experience
    const maxRotation = 15;
    const rotation = Math.min(Math.max(deltaX / 10, -maxRotation), maxRotation);

    // Apply the transformation directly without any animation
    cardElement.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;

    // Add visual feedback with background gradient
    const absX = Math.abs(deltaX);
    const gradientOpacity = Math.min(absX / 400, 0.3);

    if (deltaX > 0) {
      // Swiping right - blue gradient for welcome card, green for game cards
      if (gameState.isWelcomeCard) {
        cardElement.style.background = `linear-gradient(to right, white, rgba(59, 130, 246, ${gradientOpacity}))`;
      } else {
        cardElement.style.background = `linear-gradient(to right, white, rgba(34, 197, 94, ${gradientOpacity}))`;
      }
    } else if (deltaX < 0) {
      // Swiping left - blue gradient for welcome card, red for game cards
      if (gameState.isWelcomeCard) {
        cardElement.style.background = `linear-gradient(to left, white, rgba(59, 130, 246, ${gradientOpacity}))`;
      } else {
        cardElement.style.background = `linear-gradient(to left, white, rgba(239, 68, 68, ${gradientOpacity}))`;
      }
    } else {
      cardElement.style.background = 'white';
    }

    if (e.type.includes('touch')) {
      e.preventDefault();
    }
  }

  function endDrag(e) {
    if (!dragging || (!gameState.isPlaying && !gameState.isWelcomeCard)) return;
    dragging = false;

    const threshold = 50;

    if (Math.abs(currentX) > threshold) {
      // Card was swiped past threshold
      const isRight = currentX > 0;
      const screenWidth = window.innerWidth;

      // Play the swipe sound effect
      // playSound('swipe');

      // Animate card off screen
      cardElement.style.transition = 'transform 0.5s ease, opacity 0.5s ease';

      if (isRight) {
        cardElement.style.transform = `translateX(${screenWidth}px) rotate(30deg)`;
      } else {
        cardElement.style.transform = `translateX(-${screenWidth}px) rotate(-30deg)`;
      }

      cardElement.style.opacity = '0';

      // Process the swipe with slight delay to allow animation
      setTimeout(() => {
        processSwipe(isRight);
      }, 300);
    } else {
      // Return card to center if not swiped far enough
      cardElement.style.transition = 'all 0.3s ease';
      cardElement.style.transform = 'rotate(0) translateX(0)';
      cardElement.style.background = 'white';
    }

    currentX = 0;
  }

  // Button event listeners
  if (restartButtonElement) {
    restartButtonElement.addEventListener('click', () => {
      startGame();
    });
  }

  if (aboutIconElement && aboutModalElement) {
    aboutIconElement.addEventListener('click', () => {
      aboutModalElement.style.display = 'flex';
    });

    aboutModalElement.addEventListener('click', () => {
      aboutModalElement.style.display = 'none';
    });
  }

  if (startButtonElement) {
    startButtonElement.addEventListener('click', () => {
      startGame();
    });
  }

  // Language button event listeners
  if (languageButtons) {
    languageButtons.forEach((btn) => {
      if (btn.id !== 'sound-toggle') {
        btn.addEventListener('click', () => {
          const lang = btn.dataset.lang;
          changeLanguage(lang);
        });
      }
    });
  }

  // Sound toggle button event listener
  if (soundToggleElement) {
    soundToggleElement.addEventListener('click', () => {
      toggleSound();
    });
  }

  // Initialize game
  initializeGame();
});
