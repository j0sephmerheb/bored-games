import { Routes } from '@angular/router';
import { WordGuessingComponent } from './games/word-guessing/word-guessing.component';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'word-guessing', component: WordGuessingComponent },
];

