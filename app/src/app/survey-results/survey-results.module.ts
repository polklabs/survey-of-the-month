import { NgModule } from '@angular/core';
import { CoreModule } from '../core/module/core.module';
import { SharedModule } from '../shared/shared.module';
import { SurveyResultsComponent } from './survey-results.component';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';

const routes: Routes = [
    {
      path: '',
      component: SurveyResultsComponent
    }
];

@NgModule({
  declarations: [
    SurveyResultsComponent,
  ],
  imports: [
    CommonModule,

    CoreModule,
    SharedModule,

    RouterModule.forChild(routes)
  ],
  providers: []
})
export class SurveyResultsModule { }
