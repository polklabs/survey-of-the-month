import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormScaleComponent } from './form-scale.component';

describe('FormScaleComponent', () => {
  let component: FormScaleComponent;
  let fixture: ComponentFixture<FormScaleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormScaleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormScaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
