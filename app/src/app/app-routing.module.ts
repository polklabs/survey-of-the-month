import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { SurveyMakerComponent } from './survey-maker/survey-maker.component';
import { SurveyManagerComponent } from './survey-manager/survey-manager.component';
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
        path: 'make-survey/:id',
        component: SurveyMakerComponent,
        data: {
            title: 'Survey OTM | New',
        }
    },
    {
        path: 'manage-survey/:id',
        component: SurveyManagerComponent,
        data: {
            title: 'Survey OTM | Manage',
        }
    },
    {
        path: 'survey/:id',
        component: SurveyTakerComponent,
        data: {
            title: 'Survey OTM',
        }
    },
    
    // {
    //     path: 'results',
    //     component: SurveyResults,
    //     data: {
    //         title: 'Survey OTM |',
    //     }
    // },
    {
        path: 'make-survey',
        redirectTo: 'make-survey/0',
        pathMatch: 'full'
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
