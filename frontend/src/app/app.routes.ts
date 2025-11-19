import { Routes } from '@angular/router';
import { Terms } from './terms/terms';
import { AlbumsComponent } from './albums/albums.component';
import { ExcelUploaderComponent } from './excel-uploader/excel-uploader.component';  // 👈 IMPORT CORRECTO

export const routes: Routes = [
  { path: 'albums', component: AlbumsComponent },
  { path: 'cargar-excel', component: ExcelUploaderComponent },
  { path: 'terminos', component: Terms },  // 👈 COMPONENTE CORRECTO
  { path: '', redirectTo: 'albums', pathMatch: 'full' }
];