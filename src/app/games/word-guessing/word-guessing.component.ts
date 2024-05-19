import { HttpClient, provideHttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-word-guessing',
  standalone: true,
  imports: [FormsModule], 
  templateUrl: './word-guessing.component.html',
  styleUrl: './word-guessing.component.scss',
})
export class WordGuessingComponent {
  charCount: number = 4;
  gameStarted: boolean = false;
  originalWord: string = '';
  shuffledWord: string = '';
  userGuess: string = '';
  wordHint: string = '';

  constructor(private http: HttpClient) {}

  async startGame() {
    if (this.charCount < 4 || this.charCount > 20) {
      alert('Please select a number between 4 and 20.');
      return;
    }

    const word = await this.fetchRandomWord(this.charCount);
    if (!word) {
      alert('Could not fetch a word. Please try again.');
      return;
    }

    this.originalWord = word;
    this.wordHint = await this.fetchWordDefinition(this.originalWord) || 'No definition available';
    this.shuffledWord = this.shuffleWord(this.originalWord);
    this.userGuess = '';
    this.gameStarted = true;
  }

  async fetchRandomWord(length: number): Promise<string | null> {
    try {
      const data = await this.http.get<{ [key: string]: string[] }>('assets/words.json').toPromise();
      const words = data?.[length.toString()] ?? [];
      if (words.length > 0) {
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

  async fetchWordDefinition(word: string): Promise<string | null> {
    try {
      const data = await this.http.get<any[]>(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`).toPromise();
      return data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition ?? null;
    } catch (error) {
      console.error('Error fetching word definition:', error);
      return null;
    }
  }

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

  submitGuess() {
    if (this.userGuess.toLowerCase() === this.originalWord.toLowerCase()) {
      alert('Correct! The word is ' + this.originalWord);
      this.disableGame();
    } else {
      alert('Wrong! Try again.');
    }
  }

  showWord() {
    alert('The correct word is ' + this.originalWord);
    this.shuffledWord = this.originalWord;
    this.disableGame();
  }

  private disableGame() {
    this.gameStarted = false;
  }
}
