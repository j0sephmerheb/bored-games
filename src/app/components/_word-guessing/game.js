document.getElementById('startGame').addEventListener('click', startGame);
document.getElementById('submitGuess').addEventListener('click', submitGuess);
document.getElementById('showWord').addEventListener('click', showWord);

let originalWord = '';
let wordDefinition = '';

async function startGame() {
    const charCount = parseInt(document.getElementById('charCount').value);
    if (charCount < 4 || charCount > 20) {
        alert('Please select a number between 4 and 20.');
        return;
    }
    
    originalWord = await fetchRandomWord(charCount);
    if (!originalWord) {
        alert('Could not fetch a word. Please try again.');
        return;
    }

    wordDefinition = await fetchWordDefinition(originalWord);
    
    const shuffledWord = shuffleWord(originalWord);
    document.getElementById('shuffledWord').textContent = shuffledWord;
    document.getElementById('userGuess').value = '';
    document.getElementById('gameContainer').style.display = 'block';
    document.getElementById('wordHint').textContent = wordDefinition ? wordDefinition : 'No definition available';
    document.getElementById('submitGuess').style.display = 'inline';
    document.getElementById('showWord').style.display = 'inline';
}

async function fetchRandomWord(length) {
    document.getElementById('submitGuess').disabled = false;
    document.getElementById('userGuess').disabled = false;
    document.getElementById('showWord').disabled = false;

    try {
        const response = await fetch('words.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        const words = data[length.toString()];
        if (words && words.length > 0) {
            const randomIndex = Math.floor(Math.random() * words.length);
            return words[randomIndex];
        } else {
            console.error(`No words found of length ${length}`);
            return null;
        }
    } catch (error) {
        console.error('Error fetching words from JSON:', error);
        return null;
    }
}

async function fetchWordDefinition(word) {
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = await response.json();
        return data.length > 0 ? data[0].meanings[0].definitions[0].definition : null;
    } catch (error) {
        console.error('Error fetching word definition:', error);
        return null;
    }
}

function shuffleWord(word) {
    let shuffledWord = word;
    while (shuffledWord === word) {
        const array = word.split('');
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        shuffledWord = array.join('');
    }
    return shuffledWord;
}


function submitGuess() {
    const userGuess = document.getElementById('userGuess').value.toLowerCase();
    if (userGuess === originalWord.toLowerCase()) {
        alert('Correct! The word is ' + originalWord);
        document.getElementById('submitGuess').disabled = true;
        document.getElementById('userGuess').disabled = true;
        document.getElementById('showWord').disabled = true;
    } else {
        alert('Wrong! Try again.');
    }
}

function showWord() {
    alert('The correct word is ' + originalWord);
    document.getElementById('shuffledWord').textContent = originalWord;
    document.getElementById('submitGuess').disabled = true;
    document.getElementById('userGuess').disabled = true;
    document.getElementById('showWord').disabled = true;
}