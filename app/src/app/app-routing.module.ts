import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SingleQuestionComponent } from './single-question/single-question.component';
import { SurveyMakerComponent } from './survey-maker/survey-maker.component';

const routes: Routes = [
    // {
    //     path: 'home',
    //     component: HomeComponent,
    //     data: {
    //         title: 'Ledger | Home',
    //     }
    // },
    {
        path: 'question',
        component: SingleQuestionComponent,
        data: {
            title: 'Survey OTM |',
        }
    },
    
    {
        path: 'make-survey',
        component: SurveyMakerComponent,
        data: {
            title: 'Survey OTM | New',
        }
    },
    // {
    //     path: 'survey/:id',
    //     component: SurveyAnswer,
    //     data: {
    //         title: 'Ledger |',
    //     }
    // },
    
    // {
    //     path: 'results',
    //     component: SurveyResults,
    //     data: {
    //         title: 'Survey OTM |',
    //     }
    // },
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
