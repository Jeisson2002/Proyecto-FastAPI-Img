import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [],
  templateUrl: './terms.html',
  styleUrls: ['./terms.css']
})
export class Terms {

  constructor(private router: Router) {}

  /**
   * Navega de vuelta a la página principal de álbumes
   */
  volverAlInicio(): void {
    this.router.navigate(['/albums']);
  }
}