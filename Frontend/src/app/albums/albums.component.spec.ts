import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlbumsComponent } from './albums.component'; // 👈 nombre correcto

describe('AlbumsComponent', () => {
  let component: AlbumsComponent; // 👈 usar AlbumsComponent
  let fixture: ComponentFixture<AlbumsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlbumsComponent] // 👈 standalone se importa aquí
    }).compileComponents();

    fixture = TestBed.createComponent(AlbumsComponent); // 👈 igual aquí
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
