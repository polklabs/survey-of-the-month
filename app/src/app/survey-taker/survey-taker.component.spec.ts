import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SurveyTakerComponent } from './survey-taker.component';

describe('SurveyTakerComponent', () => {
  let component: SurveyTakerComponent;
  let fixture: ComponentFixture<SurveyTakerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SurveyTakerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SurveyTakerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
