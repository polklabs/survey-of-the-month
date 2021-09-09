import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormMultiComponent } from './form-multi.component';

describe('FormMultiComponent', () => {
  let component: FormMultiComponent;
  let fixture: ComponentFixture<FormMultiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormMultiComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormMultiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
