import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-terms',
  imports: [],
  templateUrl: './terms.html',
  styleUrl: './terms.css',
})
export class Terms {

  constructor(private router: Router) {}

  volverAlInicio() {
    this.router.navigate(['/albums']);  // Ruta principal
  }

}