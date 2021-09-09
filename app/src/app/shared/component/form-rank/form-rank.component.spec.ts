import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormRankComponent } from './form-rank.component';

describe('FormRankComponent', () => {
  let component: FormRankComponent;
  let fixture: ComponentFixture<FormRankComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormRankComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormRankComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
