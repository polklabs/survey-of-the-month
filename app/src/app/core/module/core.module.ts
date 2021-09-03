import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MaterialModule } from './material.module';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
    imports: [
        MaterialModule,
        FlexLayoutModule,
        DragDropModule
    ],
    exports: [
        MaterialModule,
        FlexLayoutModule,
        DragDropModule
    ]
})
export class CoreModule { }