import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GrammarComponent } from './grammar/grammar.component';
import { HomeComponent } from './home/home.component';
import { PublicSurveyComponent } from './public-survey/public-survey.component';
import { CanDeactivateGuard } from './shared/guard/can-deactivate-guard.service';
import { SurveyTakerComponent } from './survey-taker/survey-taker.component';

const routes: Routes = [
    {
        path: 'home',
        component: HomeComponent,
    },
    {
        path: 'manage',
        loadChildren: () => import('./manager/manager.module').then(m => m.ManagerModule),
    },
    {
        path: 'public',
        component: PublicSurveyComponent
    },
    {
        path: 'survey/:id',
        component: SurveyTakerComponent,
        canDeactivate: [CanDeactivateGuard],
    },
    ...['results/:id/:key', 'results/:id'].map(path => ({
        path,
        loadChildren: () => import('./survey-results/survey-results.module').then(m => m.SurveyResultsModule),
    })),
    {
        path: 'grammar',
        component: GrammarComponent,
    },
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },
    {
        path: '**',
        redirectTo: 'home',
        pathMatch: 'full'
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: false, scrollPositionRestoration: 'top' })],
    exports: [RouterModule]
})
export class AppRoutingModule {}
