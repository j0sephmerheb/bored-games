import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-word-guessing',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './word-guessing.component.html',
  styleUrls: ['./word-guessing.component.scss'],
})
export class WordGuessingComponent {
  charCount: number = 4;
  gameStarted: boolean = false;
  originalWord: string = '';
  shuffledWord: string = '';
  userGuess: string = '';
  wordHint: string = '';
  checkedWords: Set<string> = new Set(); // Track checked words to avoid repetition

  constructor(private http: HttpClient) {}

  /**
   * startGame
   * @returns
   */
  async startGame() {
    if (this.charCount < 4 || this.charCount > 20) {
      alert('Please select a number between 4 and 20.');
      return;
    }

    this.gameStarted = false;
    this.checkedWords.clear(); // Reset the set for new game start
    let word: string | null = null;
    let definition: string | null = null;

    while (!definition) {
      const result = await this.fetchRandomWord(this.charCount);
      if (!result || this.checkedWords.has(result.word)) {
        continue;
      }
      this.checkedWords.add(result.word);
      word = result.word;
      definition = result.definition;
    }

    this.originalWord = word!;
    this.wordHint = definition!;
    this.shuffledWord = this.shuffleWord(this.originalWord.toLowerCase()); // Convert to lowercase before shuffling
    this.userGuess = '';
    this.gameStarted = true;
  }

  /**
   * fetchRandomWord
   * @param length
   * @returns
   */
  async fetchRandomWord(length: number): Promise<{ word: string, definition: string } | null> {
    try {
      const data = await this.http.get<{ [key: string]: { [word: string]: string } }>('assets/words.json').toPromise();
      const words = data?.[length.toString()] ?? {};
      const wordList = Object.keys(words);
      if (wordList.length > 0) {
        const randomIndex = Math.floor(Math.random() * wordList.length);
        const word = wordList[randomIndex];
        const definition = words[word];
        return { word, definition };
      } else {
        console.error(`No words found of length ${length}`);
        return null;
      }
    } catch (error) {
      console.error('Error fetching words from JSON:', error);
      return null;
    }
  }


  /**
   * shuffleWord
   * @param word
   * @returns
   */
  shuffleWord(word: string): string {
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

  /**
   * submitGuess
   */
  submitGuess() {
    if (this.userGuess.toLowerCase() === this.originalWord.toLowerCase()) {
      alert('Correct! The word is ' + this.originalWord);
      this.disableGame();
    } else {
      alert('Wrong! Try again.');
    }
  }

  /**
   * showWord
   */
  showWord() {
    alert('The correct word is ' + this.originalWord);
    this.shuffledWord = this.originalWord.toLowerCase();
    this.disableGame();
  }

  /**
   * disableGame
   */
  private disableGame() {
    this.gameStarted = false;
  }
}
