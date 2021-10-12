import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GrammarComponent } from './grammar/grammar.component';
import { HomeComponent } from './home/home.component';
import { CanDeactivateGuard } from './shared/guard/can-deactivate-guard.service';
import { SurveyTakerComponent } from './survey-taker/survey-taker.component';

const routes: Routes = [
    {
        path: 'home',
        component: HomeComponent,
        data: {
            title: 'Survey OTM | Home',
        }
    },
    {
        path: 'manage',
        loadChildren: () => import('./manager/manager.module').then(m => m.ManagerModule),
        data: {
            title: 'Survey OTM | Manage',
        }
    },
    {
        path: 'survey/:id',
        component: SurveyTakerComponent,
        canDeactivate: [CanDeactivateGuard],
        data: {
            title: 'Survey OTM',
        }
    },
    {
        path: 'results/:id/:key',
        loadChildren: () => import('./survey-results/survey-results.module').then(m => m.SurveyResultsModule),
        data: {
            title: 'Survey OTM | Results',
        }
    },
    {
        path: 'grammar',
        component: GrammarComponent,
        data: {
            title: 'Grammar',
        }
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
