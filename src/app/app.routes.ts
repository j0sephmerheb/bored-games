import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { WordGuessingComponent } from './games/word-guessing/word-guessing.component';
import { CamPuzzleComponent } from './games/cam-puzzle/cam-puzzle.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'home', redirectTo: '', pathMatch: 'full' },
    { path: 'word-guessing', component: WordGuessingComponent },
    { path: 'cam-puzzle', component: CamPuzzleComponent },
];

