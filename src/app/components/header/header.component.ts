import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  menuItems = [
    { path: '/word-guessing', label: 'Word Guessing' },
    { path: '/cam-puzzle', label: 'Cam Puzzle' },
  ];
  version = environment.version;

}
