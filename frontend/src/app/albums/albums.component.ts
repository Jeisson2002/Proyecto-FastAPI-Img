import { Component } from '@angular/core';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-albums',
  standalone: true,
  imports: [NgFor],
  templateUrl: './albums.component.html',
  styleUrls: ['./albums.component.css']
})
export class AlbumsComponent {
  albums = [
    {
      title: 'Carros y Estilos 🛻',
      photos: [
        'assets/img/Mc laren.jpg',
        'assets/img/Lamborguini.jpg',
        'assets/img/Porsche.jpg'
      ]
    },
    {
      title: 'Mujeres y Demas 😎',
      photos: [
        'assets/img/Fondo Mujer.jpg',
        'assets/img/Woman.jpg',
        'assets/img/Mujer.jpg'
      ]
    },
    {
      title: 'Días Especiales 🎉',
      photos: [
        'assets/img/Amor.jpg',
        'assets/img/Amor1.jpg',
        'assets/img/Amor2.jpg'
      ]
    }
  ];
}
