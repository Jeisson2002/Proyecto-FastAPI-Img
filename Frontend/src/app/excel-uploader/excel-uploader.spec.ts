import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExcelUploaderComponent } from './excel-uploader.component';

describe('ExcelUploaderComponent', () => {
  let component: ExcelUploaderComponent;
  let fixture: ComponentFixture<ExcelUploaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExcelUploaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExcelUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});