import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // 🔹 Verificar estado del servidor (endpoint /health)
  checkHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }

  // 🔹 Subir imagen al backend
  uploadImage(file: File): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(`${this.apiUrl}/upload-image/`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  // 🔹 Listar imágenes disponibles
  listImages(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/images/`);
  }
}