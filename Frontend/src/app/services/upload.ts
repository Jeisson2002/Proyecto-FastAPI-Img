import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UploadService {

  apiUrl = 'http://localhost:8000/uploadfile/';

  constructor(private http: HttpClient) {}

  uploadExcel(file: File, sheet: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sheet', sheet);

    return this.http.post(this.apiUrl, formData);
  }
}