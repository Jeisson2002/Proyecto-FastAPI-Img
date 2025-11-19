import { Component } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { KeysPipe } from '../pipes/keys.pipe';

// 📊 Importar Chart.js
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-excel-uploader',
  standalone: true,
  imports: [CommonModule, FormsModule, KeysPipe],
  templateUrl: './excel-uploader.component.html',
  styleUrls: ['./excel-uploader.component.css']
})
export class ExcelUploaderComponent {

  selectedFile: File | null = null;

  excelData: any[] = [];
  excelPreview: any[][] = [];

  sheetNames: string[] = [];
  selectedSheet: string = '';

  uploading = false;
  uploadProgress = 0;

  statusMessage = '';
  statusType = '';

  constructor(private http: HttpClient) {}


  // -------------------------------------------------------------------
  // 📌 SELECCIONAR ARCHIVO
  // -------------------------------------------------------------------
  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];

    if (!this.selectedFile) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      this.sheetNames = workbook.SheetNames;
      this.selectedSheet = this.sheetNames[0];

      this.loadSheet(workbook, this.selectedSheet);

      setTimeout(() => this.generateCharts(), 200);
    };

    reader.readAsArrayBuffer(this.selectedFile);
  }


  // -------------------------------------------------------------------
  // 📌 CARGAR HOJA
  // -------------------------------------------------------------------
  loadSheet(workbook: XLSX.WorkBook, sheetName: string) {
    const worksheet = workbook.Sheets[sheetName];

    this.excelData = XLSX.utils.sheet_to_json(worksheet);
    this.excelPreview = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  }


  // -------------------------------------------------------------------
  // 📌 CAMBIO DE HOJA
  // -------------------------------------------------------------------
  onSheetChange(event: any) {
    if (!this.selectedFile) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      this.loadSheet(workbook, this.selectedSheet);

      setTimeout(() => this.generateCharts(), 200);
    };

    reader.readAsArrayBuffer(this.selectedFile);
  }


  // -------------------------------------------------------------------
  // 📌 SUBIR AL BACKEND
  // -------------------------------------------------------------------
  uploadExcel() {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.uploading = true;

    this.http.post('http://localhost:8000/uploadfile/', formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe(
      (event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = Math.round((event.loaded / (event.total || 1)) * 100);
        }

        if (event.type === HttpEventType.Response) {
          this.statusMessage = 'Archivo subido correctamente.';
          this.statusType = 'success';
          this.uploading = false;

          setTimeout(() => this.generateCharts(), 200);
        }
      },
      error => {
        this.statusMessage = 'Error al subir archivo.';
        this.statusType = 'error';
        this.uploading = false;
      }
    );
  }


  // -------------------------------------------------------------------
  // 📊 GENERAR GRÁFICOS
  // -------------------------------------------------------------------
  generateCharts() {
    if (this.excelData.length === 0) return;

    const labels = this.excelData.map(row => Object.values(row)[0]);
    const values = this.excelData.map(row => Object.values(row)[1]);

    // Destruir gráficos anteriores
    if ((window as any).chart1) (window as any).chart1.destroy();
    if ((window as any).chart2) (window as any).chart2.destroy();

    // 📊 Gráfico de Barras
    (window as any).chart1 = new Chart("chartBar", {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Gráfico de Barras',
          data: values
        }]
      }
    });

    // 📈 Gráfico de Líneas
    (window as any).chart2 = new Chart("chartLine", {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Gráfico de Líneas',
          data: values
        }]
      }
    });
  }
}