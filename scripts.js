function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function emptyNode(htmlNode) {
  while (htmlNode.firstChild) {
    htmlNode.removeChild(htmlNode.firstChild);
  }
}

// GLOBAL VARIABLES
// TODO: Reduce their scope as much as possible
const roundWords = [];
const otherTranslations = [];
let solution;
let step;
let attempts;

// DOM ELEMENTS
const startGameBtn = document.querySelector("#start-game");
const playAgainBtn = document.querySelector("#play-again");
const reviewMistakesBtn = document.querySelector("#review-mistakes");
const progressBar = document.querySelector("#progress-bar");
const gamePlayingScreen = document.querySelector("#game-playing-screen");
const wordDisplay = document.querySelector("#word-display");
const possibleSolutionsList = document.querySelector("#possible-solutions");
const messageDisplay = document.querySelector("#message");
const scoreDisplay = document.querySelector("#score");
const gameStartScreen = document.querySelector("#game-start-screen");
const nextBtn = document.querySelector("#next-word-btn");

startGameBtn.addEventListener("click", function() {
  gameStartScreen.classList.add("hidden");
  gamePlayingScreen.classList.remove("hidden");
  wordDisplay.classList.remove("hidden");
  possibleSolutionsList.classList.remove("hidden");
  playAgainBtn.classList.add("hidden");
  reviewMistakesBtn.classList.add("hidden");
  scoreDisplay.classList.add("hidden");
  nextBtn.classList.remove("hidden");
  const wordTypeOptions = gameStartScreen.querySelector("#word-type-options");
  const translationDirection = gameStartScreen.querySelector(
    "#translation-direction-options"
  );
  engToEsp = translationDirection.querySelectorAll(
    'input[type="radio"][name="translation-direction"]'
  )[0].checked
    ? true
    : false;

  let i = 0;
  while (!wordTypeOptions.querySelectorAll("input")[i].checked) {
    i++;
  }
  const wordsPromise = fetch(
    "data/dictionary-" +
      wordTypeOptions.querySelectorAll("input")[i].value +
      ".json"
  );
  wordsPromise
    .then(data => data.json())
    .then(data => {
      const dictionary = data;
      startGame(dictionary, engToEsp);
    })
    .catch(err => {
      console.error(err);
    });
});

function startGame(dictionary, engToEsp) {
  for (let i = 0; i < dictionary.length; i++) {
    const progressItem = document.createElement("DIV");
    progressItem.className = "progress-item";
    progressItem.style.width = `${(1 / dictionary.length) * 100}%`;
    progressBar.appendChild(progressItem);
    roundWords[i] = {};
  }
  // Create the array of word objects with the specified translation direction
  if (engToEsp) {
    roundWords.forEach((word, i) => {
      word.original = dictionary[i].eng;
      word.translation = dictionary[i].esp;
    });
  } else {
    roundWords.forEach((word, i) => {
      word.original = dictionary[i].esp;
      word.translation = dictionary[i].eng;
    });
  }
  shuffleArray(roundWords);
  roundWords.forEach(word => (word.correct = false));
  step = 0;
  nextStep(roundWords, step);
}

function nextStep(arrayOfWordObjects, step) {
  emptyNode(messageDisplay);
  // Check if there are still incorrect answers from the current step onwards
  // and also if there are still words, otherwise end the round
  if (
    arrayOfWordObjects.slice(step).some(wordObject => !wordObject.correct) &&
    step < arrayOfWordObjects.length
  ) {
    nextBtn.disabled = true;
    nextBtn.classList.add("disabled-btn");
    // Find the step corresponding to the next incorrect word
    while (arrayOfWordObjects[step].correct) {
      step++;
    }
    attempts = 1;
    progressBar.children.item(step).classList.add("current-progress-item");
    currentWordObject = arrayOfWordObjects[step];
    getSolution(currentWordObject);
    showWord(currentWordObject);
    showOptions(arrayOfWordObjects, currentWordObject, step);
  } else {
    endGame(arrayOfWordObjects);
  }
}

function getSolution(currentWordObject) {
  solution = currentWordObject.translation;
}

function showWord(currentWordObject) {
  wordDisplay.innerHTML = currentWordObject.original;
}

function showOptions(arrayOfWordObjects, currentWordObject, step) {
  // Clon of the dictionary to work with it
  const tempDictionary = roundWords.slice();

  // Remove the current word from the dictionary because it has the solution
  tempDictionary.splice(tempDictionary.indexOf(currentWordObject), 1);

  // Creation of an array with the rest of the translations (wrong answers)
  for (let i = 0; i < tempDictionary.length; i++) {
    otherTranslations[i] = tempDictionary[i].translation;
  }

  // Get two random indices to select two words from the array of wrong answers
  let first = Math.floor(Math.random() * otherTranslations.length);
  let second;
  do {
    second = Math.floor(Math.random() * otherTranslations.length);
  } while (second === first);

  // I store three possible options, only 1 is the answer
  const possibleSolutions = [];
  possibleSolutions.push(solution);
  possibleSolutions.push(otherTranslations[first]);
  possibleSolutions.push(otherTranslations[second]);

  shuffleArray(possibleSolutions);

  emptyNode(possibleSolutionsList);

  possibleSolutions.forEach(posSolution => {
    let posSolutionItem = document.createElement("LI");
    posSolutionItem.appendChild(document.createTextNode(posSolution));
    possibleSolutionsList.appendChild(posSolutionItem);
  });

  let solutionListItems = document.querySelectorAll("#possible-solutions li");
  solutionListItems.forEach(solutionListItem =>
    solutionListItem.addEventListener("click", function(e) {
      checkOption(e, arrayOfWordObjects, step);
    })
  );
}

function checkOption(e, arrayOfWordObjects, step) {
  if (e.target.innerHTML !== solution) {
    messageDisplay.innerHTML = "Try again!";
    if (attempts === 2) {
      messageDisplay.innerHTML = "Ups! :(";
      progressBar.children.item(step).classList.add("error");
      progressBar.children.item(step).classList.remove("current-progress-item");

      arrayOfWordObjects[step].correct = false;

      endRound(arrayOfWordObjects, step);
    } else {
      attempts++;
      progressBar.children.item(step).classList.add("warning");
    }
  } else {
    messageDisplay.innerHTML = "Perfect!";

    arrayOfWordObjects[step].correct = true;

    progressBar.children.item(step).classList.remove("warning");
    progressBar.children.item(step).classList.add("success");
    // TODO: Optional: leave the 'warning' class and check also them later
    // if (attempts < 2) {progressBar.children.item(step).classList.add("success");}

    progressBar.children
      .item(step)
      .classList.remove("current-progress-item", "error");

    endRound(arrayOfWordObjects, step);
  }
}

function endRound(arrayOfWordObjects, step) {
  nextBtn.disabled = false;
  nextBtn.classList.remove("disabled-btn");
  // I added the addEventListener inside the function because I have to pass scope variables
  nextBtn.addEventListener("click", function goToNextStep() {
    step++;
    nextStep(arrayOfWordObjects, step);
    nextBtn.removeEventListener("click", goToNextStep);
  });
}

function endGame(arrayOfWordObjects) {
  messageDisplay.innerHTML = "Finish!";
  let correctWords = 0;
  for (let i = 0; i < arrayOfWordObjects.length; i++) {
    if (arrayOfWordObjects[i].correct) {
      correctWords++;
    }
  }
  scoreDisplay.innerHTML = `${correctWords}/${arrayOfWordObjects.length}`;
  scoreDisplay.classList.remove("hidden");
  wordDisplay.classList.add("hidden");
  possibleSolutionsList.classList.add("hidden");
  playAgainBtn.classList.remove("hidden");
  nextBtn.classList.add("hidden");
  if (arrayOfWordObjects.some(wordObject => !wordObject.correct)) {
    reviewMistakesBtn.classList.remove("hidden");
    // I added the addEventListener inside the function because I have to pass scope variables
    reviewMistakesBtn.addEventListener("click", function startReview() {
      playAgainBtn.classList.add("hidden");
      reviewMistakesBtn.classList.add("hidden");
      gamePlayingScreen.classList.remove("hidden");
      wordDisplay.classList.remove("hidden");
      possibleSolutionsList.classList.remove("hidden");
      scoreDisplay.classList.add("hidden");
      nextBtn.classList.remove("hidden");
      step = 0;
      nextStep(arrayOfWordObjects, step);
      reviewMistakesBtn.removeEventListener("click", startReview);
    });
  }
}

// TODO: 'Quit' button should do the same as this function
playAgainBtn.addEventListener("click", function() {
  gamePlayingScreen.classList.add("hidden");
  gameStartScreen.classList.remove("hidden");

  emptyNode(progressBar);
  messageDisplay.innerHTML = "";
});
