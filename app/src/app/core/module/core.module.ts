import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MaterialModule } from './material.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
    imports: [
        MaterialModule,
        FlexLayoutModule,
        DragDropModule,
        HttpClientModule,
        ReactiveFormsModule
    ],
    exports: [
        MaterialModule,
        FlexLayoutModule,
        DragDropModule,
        HttpClientModule,
        ReactiveFormsModule
    ]
})
export class CoreModule { }