import { NgModule } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

const material = [
    MatCardModule
];

@NgModule({
    imports: [
        ...material
    ],
    exports: [
        ...material
    ]
})
export class MaterialModule { }