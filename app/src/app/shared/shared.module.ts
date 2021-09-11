import { NgModule } from '@angular/core';
import { CoreModule } from '../core/module/core.module';
import { FormTextComponent } from './component/form-text/form-text.component';
import { TextBoxComponent } from './modal/text-box/text-box.component';
import { FormQuestionComponent } from './component/form-question/form-question.component';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { FormMultiComponent } from './component/form-multi/form-multi.component';
import { FormRankComponent } from './component/form-rank/form-rank.component';
import { FormCheckComponent } from './component/form-check/form-check.component';
import { FormDateComponent } from './component/form-date/form-date.component';
import { FormTimeComponent } from './component/form-time/form-time.component';
import { FormScaleComponent } from './component/form-scale/form-scale.component';

@NgModule({
    declarations: [
        FormTextComponent,
        TextBoxComponent,
        FormQuestionComponent,
        FormMultiComponent,
        FormRankComponent,
        FormCheckComponent,
        FormDateComponent,
        FormTimeComponent,
        FormScaleComponent,
    ],
    exports: [
        FormTextComponent,
        TextBoxComponent,
        FormQuestionComponent,
    ],
    imports: [
        CommonModule,
        BrowserModule,
        CoreModule
    ],
    providers: [],
})
export class SharedModule { }
