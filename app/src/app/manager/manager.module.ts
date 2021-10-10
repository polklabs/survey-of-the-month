import { NgModule } from '@angular/core';
import { CoreModule } from '../core/module/core.module';
import { SharedModule } from '../shared/shared.module';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SurveyMakerComponent } from './survey-maker/survey-maker.component';
import { SurveyManagerComponent } from './survey-manager/survey-manager.component';
import { CanDeactivateGuard } from '../shared/guard/can-deactivate-guard.service';

const routes: Routes = [
    {
      path: 'make/:id/:key',
      component: SurveyMakerComponent,
      canDeactivate: [CanDeactivateGuard],
    },
    {
        path: ':id/:key',
        component: SurveyManagerComponent
    },
    {
        path: 'make',
        redirectTo: 'make/0/0',
        pathMatch: 'full'
    },
    {
        path: '',
        redirectTo: '0/0',
        pathMatch: 'full'
    },
];

@NgModule({
  declarations: [
    SurveyMakerComponent,
    SurveyManagerComponent
  ],
  imports: [
    CommonModule,

    CoreModule,
    SharedModule,

    RouterModule.forChild(routes)
  ],
  providers: []
})
export class ManagerModule { }
