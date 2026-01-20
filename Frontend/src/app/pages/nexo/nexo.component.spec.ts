import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Nexo } from './nexo.component';

describe('Nexo', () => {
  let component: Nexo;
  let fixture: ComponentFixture<Nexo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Nexo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Nexo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
