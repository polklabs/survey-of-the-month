import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CoreModule } from './core/module/core.module';
import { SingleQuestionComponent } from './single-question/single-question.component';
import { AppRoutingModule } from './app-routing.module';
import { HomeComponent } from './home/home.component';
import { SharedModule } from './shared/shared.module';
import { SurveyTakerComponent } from './survey-taker/survey-taker.component';

@NgModule({
  declarations: [
    AppComponent,
    SingleQuestionComponent,
    HomeComponent,
    SurveyTakerComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,

    CoreModule,
    AppRoutingModule,
    SharedModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
