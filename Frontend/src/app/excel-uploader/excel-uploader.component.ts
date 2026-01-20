import { Component, OnInit, PLATFORM_ID, Inject, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import * as XLSX from 'xlsx';
import { Chart, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-excel-uploader',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './excel-uploader.component.html',
  styleUrls: ['./excel-uploader.component.css'],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class ExcelUploaderComponent implements OnInit {

  @ViewChild('cellInput') cellInput!: ElementRef;

  // -------------------------------------------------------------------
  // 📁 ARCHIVO Y DATOS
  // -------------------------------------------------------------------
  selectedFile: File | null = null;
  excelData: any[] = [];
  filteredData: any[] = [];
  columnNames: string[] = [];

  sheetNames: string[] = [];
  selectedSheet: string = '';
  private workbookCache: XLSX.WorkBook | null = null;

  // -------------------------------------------------------------------
  // 🎨 DRAG & DROP
  // -------------------------------------------------------------------
  isDragging = false;

  // -------------------------------------------------------------------
  // 🔍 BÚSQUEDA Y FILTROS
  // -------------------------------------------------------------------
  searchTerm: string = '';
  selectedColumn: string = '';

  // -------------------------------------------------------------------
  // ✏️ EDICIÓN DE CELDAS
  // -------------------------------------------------------------------
  editMode = false;
  editingCell: { row: any, column: string } | null = null;

  // -------------------------------------------------------------------
  // 📄 PAGINACIÓN
  // -------------------------------------------------------------------
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // -------------------------------------------------------------------
  // 📊 ORDENAMIENTO
  // -------------------------------------------------------------------
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // -------------------------------------------------------------------
  // 📈 GRÁFICOS
  // -------------------------------------------------------------------
  showCharts = false;
  private chartBar: Chart | null = null;
  private chartLine: Chart | null = null;

  // -------------------------------------------------------------------
  // 🎛️ SELECT PERSONALIZADO
  // -------------------------------------------------------------------
  selectOpen = false;

  // -------------------------------------------------------------------
  // 📡 ESTADO DE SUBIDA
  // -------------------------------------------------------------------
  uploading = false;
  uploadProgress = 0;
  statusMessage = '';
  statusType = '';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    // Inicialización si es necesario
  }

  // ===================================================================
  // 🎨 DRAG & DROP HANDLERS
  // ===================================================================

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  // ===================================================================
  // 📁 MANEJO DE ARCHIVOS
  // ===================================================================

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.processFile(file);
    }
  }

  processFile(file: File): void {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    const allowedExtensions = ['.xls', '.xlsx', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      this.setStatus('❌ Solo se permiten archivos Excel (.xls, .xlsx) o CSV', 'error');
      this.resetData();
      return;
    }

    this.selectedFile = file;
    this.setStatus(`✅ Archivo cargado: ${file.name}`, 'success');

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      this.workbookCache = workbook;
      this.sheetNames = workbook.SheetNames;
      this.selectedSheet = this.sheetNames[0];

      this.loadSheet(workbook, this.selectedSheet);
    };

    reader.readAsArrayBuffer(file);
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.resetData();
    this.setStatus('', '');
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // ===================================================================
  // 📊 CARGA Y PROCESAMIENTO DE DATOS
  // ===================================================================

  loadSheet(workbook: XLSX.WorkBook, sheetName: string): void {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return;

    this.excelData = XLSX.utils.sheet_to_json(worksheet);

    if (this.excelData.length > 0) {
      this.columnNames = Object.keys(this.excelData[0]);
      this.filteredData = [...this.excelData];
      this.calculatePagination();
    }
  }

  // ===================================================================
  // 🔍 BÚSQUEDA Y FILTROS
  // ===================================================================

  filterData(): void {
    if (!this.searchTerm.trim()) {
      this.filteredData = [...this.excelData];
    } else {
      const term = this.searchTerm.toLowerCase();

      if (this.selectedColumn) {
        // Filtrar por columna específica
        this.filteredData = this.excelData.filter(row => {
          const value = row[this.selectedColumn];
          return value && value.toString().toLowerCase().includes(term);
        });
      } else {
        // Buscar en todas las columnas
        this.filteredData = this.excelData.filter(row => {
          return Object.values(row).some(value =>
            value && value.toString().toLowerCase().includes(term)
          );
        });
      }
    }

    this.currentPage = 1;
    this.calculatePagination();
  }

  toggleColumnFilter(column: string): void {
    this.selectedColumn = this.selectedColumn === column ? '' : column;
    this.filterData();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.selectedColumn = '';
    this.filterData();
  }

  // ===================================================================
  // 📊 ORDENAMIENTO
  // ===================================================================

  sortByColumn(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredData.sort((a, b) => {
      const valueA = a[column];
      const valueB = b[column];

      if (valueA === valueB) return 0;

      const comparison = valueA > valueB ? 1 : -1;
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  // ===================================================================
  // ✏️ EDICIÓN DE CELDAS
  // ===================================================================

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      this.editingCell = null;
    }
  }

  editCell(row: any, column: string): void {
    if (!this.editMode) return;
    this.editingCell = { row, column };

    setTimeout(() => {
      if (this.cellInput) {
        this.cellInput.nativeElement.focus();
      }
    }, 0);
  }

  isEditingCell(row: any, column: string): boolean {
    return this.editingCell?.row === row && this.editingCell?.column === column;
  }

  saveCell(row: any, column: string): void {
    this.editingCell = null;
    // Aquí puedes agregar lógica para guardar cambios en el backend
  }

  cancelEdit(): void {
    this.editingCell = null;
  }

  // ===================================================================
  // 📄 PAGINACIÓN
  // ===================================================================

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
  }

  getPaginatedData(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredData.slice(startIndex, endIndex);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;

    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }

  // ===================================================================
  // 💾 EXPORTACIÓN
  // ===================================================================

  exportToCSV(): void {
    const csvContent = this.convertToCSV(this.filteredData);
    this.downloadFile(csvContent, 'data.csv', 'text/csv');
  }

  exportToJSON(): void {
    const jsonContent = JSON.stringify(this.filteredData, null, 2);
    this.downloadFile(jsonContent, 'data.json', 'application/json');
  }

  exportToPDF(): void {
    if (this.filteredData.length === 0) {
      this.setStatus('⚠️ No hay datos para exportar', 'error');
      return;
    }

    try {
      // Crear documento PDF
      const doc = new jsPDF({
        orientation: 'landscape', // horizontal para más columnas
        unit: 'mm',
        format: 'a4'
      });

      // Configuración de colores neón/premium
      const primaryColor = [128, 0, 255]; // Morado
      const secondaryColor = [0, 255, 255]; // Cyan
      const darkBg = [20, 20, 40]; // Fondo oscuro

      // ===== ENCABEZADO PREMIUM =====
      // Gradiente de fondo (simulado con rectángulos)
      doc.setFillColor(128, 0, 255);
      doc.rect(0, 0, 297, 40, 'F');

      doc.setFillColor(64, 0, 200);
      doc.rect(0, 20, 297, 20, 'F');

      // Título principal
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('📊 REPORTE DE DATOS', 148.5, 20, { align: 'center' });

      // Subtítulo
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const fecha = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.text(`Generado el ${fecha}`, 148.5, 30, { align: 'center' });

      // ===== INFORMACIÓN ADICIONAL =====
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.text(`Total de registros: ${this.filteredData.length}`, 14, 50);
      if (this.selectedSheet) {
        doc.text(`Hoja: ${this.selectedSheet}`, 14, 56);
      }

      // ===== PREPARAR DATOS PARA LA TABLA =====
      const headers = this.columnNames.map(col => col.toString());
      const data = this.filteredData.map(row =>
        this.columnNames.map(col => {
          const value = row[col];
          return value !== undefined && value !== null ? value.toString() : '';
        })
      );

      // ===== GENERAR TABLA CON AUTOTABLE =====
      autoTable(doc, {
        startY: 65,
        head: [headers],
        body: data,
        theme: 'grid',

        // Estilos del encabezado
        headStyles: {
          fillColor: [128, 0, 255], // Morado neón
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center',
          lineWidth: 0.5,
          lineColor: [0, 255, 255] // Borde cyan
        },

        // Estilos del cuerpo
        bodyStyles: {
          fontSize: 9,
          textColor: [40, 40, 40],
          cellPadding: 5
        },

        // Estilos de filas alternadas
        alternateRowStyles: {
          fillColor: [245, 245, 250]
        },

        // Estilos de las celdas
        columnStyles: {
          // Ajustar ancho automáticamente
        },

        // Configuración de márgenes
        margin: { top: 65, left: 14, right: 14 },

        // Líneas de la tabla
        styles: {
          lineColor: [200, 200, 200],
          lineWidth: 0.3
        },

        // Hook para personalizar celdas
        didDrawCell: (data) => {
          // Agregar efecto hover simulado en filas específicas
        },

        // Callback cuando se dibuja la página
        didDrawPage: (data) => {
          // Footer en cada página
          const pageCount = (doc as any).internal.getNumberOfPages();
          const pageNumber = (doc as any).internal.getCurrentPageInfo().pageNumber;

          // Línea decorativa en el footer
          doc.setDrawColor(128, 0, 255);
          doc.setLineWidth(0.5);
          doc.line(14, 200, 283, 200);

          // Texto del footer
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text(
            `Página ${pageNumber} de ${pageCount}`,
            148.5,
            205,
            { align: 'center' }
          );

          // Info adicional
          doc.setFontSize(8);
          doc.text(
            '✨ Generado con Excel Uploader Premium',
            148.5,
            210,
            { align: 'center' }
          );
        }
      });

      // ===== GUARDAR PDF =====
      const fileName = `reporte_${new Date().getTime()}.pdf`;
      doc.save(fileName);

      this.setStatus('✅ PDF descargado exitosamente', 'success');

    } catch (error) {
      console.error('Error generando PDF:', error);
      this.setStatus('❌ Error al generar PDF', 'error');
    }

    
  }
  private generatePDFContent(): string {
    const title = `Reporte de Datos - ${new Date().toLocaleDateString()}`;
    const headers = this.columnNames.join('</th><th>');
    const rows = this.filteredData.map(row => {
      const cells = this.columnNames.map(col => row[col] || '').join('</td><td>');
      return `<tr><td>${cells}</td></tr>`;
    }).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: Arial, sans-serif; 
          padding: 20px;
          background: white;
          color: black;
        }
        h1 { 
          text-align: center; 
          margin-bottom: 20px;
          color: #333;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 20px;
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 10px; 
          text-align: left;
          font-size: 12px;
        }
        th { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) { background: #f9f9f9; }
        tr:hover { background: #f0f0f0; }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 11px;
          color: #666;
        }
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p style="text-align: center; margin-bottom: 20px;">
        Total de registros: <strong>${this.filteredData.length}</strong>
      </p>
      <table>
        <thead>
          <tr><th>${headers}</th></tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <div class="footer">
        <p>Generado el ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
      Object.values(row).map(value =>
        typeof value === 'string' && value.includes(',')
          ? `"${value}"`
          : value
      ).join(',')
    );

    return [headers, ...rows].join('\n');
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // ===================================================================
  // 🎛️ SELECT PERSONALIZADO
  // ===================================================================

  toggleSelect(): void {
    this.selectOpen = !this.selectOpen;
  }

  selectSheet(sheet: string): void {
    this.selectedSheet = sheet;
    this.selectOpen = false;

    if (this.workbookCache) {
      this.loadSheet(this.workbookCache, sheet);

      if (isPlatformBrowser(this.platformId)) {
        setTimeout(() => this.generateCharts(), 200);
      }
    }
  }

  // ===================================================================
  // 📡 SUBIR AL BACKEND
  // ===================================================================

  uploadExcel(): void {
    if (!this.selectedFile || !this.selectedSheet) {
      this.setStatus('⚠️ Selecciona un archivo y una hoja', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('sheet', this.selectedSheet);

    this.uploading = true;
    this.uploadProgress = 0;

    this.http.post('http://localhost:8000/uploadfile/', formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = Math.round((event.loaded / (event.total || 1)) * 100);
        }

        if (event.type === HttpEventType.Response) {
          this.setStatus('✅ Archivo subido correctamente', 'success');
          this.uploading = false;

          if (isPlatformBrowser(this.platformId)) {
            setTimeout(() => this.generateCharts(), 200);
          }
        }
      },
      error: (error) => {
        this.setStatus('❌ Error al subir archivo', 'error');
        this.uploading = false;
        console.error('Error:', error);
      }
    });
  }

  // ===================================================================
  // 📊 GRÁFICOS
  // ===================================================================

  toggleCharts(): void {
    this.showCharts = !this.showCharts;

    if (this.showCharts && isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.generateCharts(), 100);
    }
  }

  generateCharts(): void {
    if (!isPlatformBrowser(this.platformId) || this.excelData.length === 0) return;

    const labels = this.excelData.slice(0, 10).map((row, idx) => {
      const firstValue = Object.values(row)[0];
      return firstValue !== undefined && firstValue !== null ? String(firstValue) : `Item ${idx + 1}`;
    });

    const values = this.excelData.slice(0, 10).map(row => {
      const secondValue = Object.values(row)[1];
      return typeof secondValue === 'number' ? secondValue : parseFloat(String(secondValue)) || 0;
    });

    // Destruir gráficos anteriores
    if (this.chartBar) this.chartBar.destroy();
    if (this.chartLine) this.chartLine.destroy();

    // Gráfico de Barras
    const barCanvas = document.getElementById('chartBar') as HTMLCanvasElement;
    if (barCanvas) {
      this.chartBar = new Chart(barCanvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Valores',
            data: values,
            backgroundColor: 'rgba(255, 0, 255, 0.6)',
            borderColor: 'rgba(255, 0, 255, 1)',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              labels: {
                color: '#fff',
                font: {
                  size: 14
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: '#fff'
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            },
            x: {
              ticks: {
                color: '#fff'
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            }
          }
        }
      });
    }

    // Gráfico de Líneas
    const lineCanvas = document.getElementById('chartLine') as HTMLCanvasElement;
    if (lineCanvas) {
      this.chartLine = new Chart(lineCanvas, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Tendencia',
            data: values,
            borderColor: 'rgba(0, 255, 255, 1)',
            backgroundColor: 'rgba(0, 255, 255, 0.2)',
            borderWidth: 3,
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              labels: {
                color: '#fff',
                font: {
                  size: 14
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: '#fff'
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            },
            x: {
              ticks: {
                color: '#fff'
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            }
          }
        }
      });
    }
  }

  // ===================================================================
  // 🛠️ UTILIDADES
  // ===================================================================

  refreshData(): void {
    if (this.workbookCache && this.selectedSheet) {
      this.loadSheet(this.workbookCache, this.selectedSheet);
      this.setStatus('🔄 Datos actualizados', 'success');
    }
  }

  clearAll(): void {
    this.resetData();
    this.setStatus('🗑️ Todo limpiado', 'success');

    if (this.chartBar) this.chartBar.destroy();
    if (this.chartLine) this.chartLine.destroy();
  }

  private resetData(): void {
    this.selectedFile = null;
    this.excelData = [];
    this.filteredData = [];
    this.columnNames = [];
    this.sheetNames = [];
    this.selectedSheet = '';
    this.workbookCache = null;
    this.searchTerm = '';
    this.selectedColumn = '';
    this.currentPage = 1;
    this.editMode = false;
    this.showCharts = false;
  }

  private setStatus(message: string, type: string): void {
    this.statusMessage = message;
    this.statusType = type;

    if (message) {
      setTimeout(() => {
        this.statusMessage = '';
        this.statusType = '';
      }, 5000);
    }
  }
}