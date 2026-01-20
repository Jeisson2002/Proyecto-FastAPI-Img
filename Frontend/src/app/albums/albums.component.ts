import { Component, OnInit, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-albums',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './albums.component.html',
  styleUrls: ['./albums.component.css']
})
export class AlbumsComponent implements OnInit, AfterViewInit {

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit(): void {
    // Código que se ejecuta al inicializar el componente
  }

  ngAfterViewInit(): void {
    // Solo ejecutar en el navegador, NO en el servidor
    if (isPlatformBrowser(this.platformId)) {
      this.initParallaxEffect();
      this.initGalleryAnimation();
    }
  }

  private initParallaxEffect(): void {
    // Efecto parallax suave al hacer scroll
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const particles = document.querySelectorAll('.particle');
        particles.forEach((particle, index) => {
          const speed = (index + 1) * 0.1;
          (particle as HTMLElement).style.transform = `translateY(${scrolled * speed}px)`;
        });
      });
    }
  }

  private initGalleryAnimation(): void {
    // Animación de entrada para las imágenes
    if (typeof window !== 'undefined' && typeof IntersectionObserver !== 'undefined') {
      const observerOptions: IntersectionObserverInit = {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              const target = entry.target as HTMLElement;
              target.style.opacity = '1';
              target.style.transform = 'translateY(0)';
            }, index * 100);
          }
        });
      }, observerOptions);

      // Observar todos los elementos de la galería
      const galleryItems = document.querySelectorAll('.gallery-item');
      galleryItems.forEach(item => {
        const htmlItem = item as HTMLElement;
        htmlItem.style.opacity = '0';
        htmlItem.style.transform = 'translateY(30px)';
        htmlItem.style.transition = 'all 0.6s ease';
        observer.observe(item);
      });
    }
  }
}