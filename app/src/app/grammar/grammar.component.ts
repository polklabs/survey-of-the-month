import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DataService } from '../core/services/data.service';
import { DialogService } from '../core/services/dialog.service';
import { APIData } from '../shared/model/api-data.model';

@Component({
    selector: 'app-grammar',
    templateUrl: './grammar.component.html',
    styleUrls: ['./grammar.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class GrammarComponent implements OnInit {

    html: SafeHtml = '';

    constructor(
        private dataService: DataService,
        private dialogService: DialogService,
        private sanitizer: DomSanitizer
    ) { }

    ngOnInit(): void {
        const [result, _] = this.dataService.getData('grammar');
        result.subscribe((data: APIData) => {
            if (data.ok) {
                this.html = this.sanitizer.bypassSecurityTrustHtml(data.data ?? '');
            } else {
                this.dialogService.error(data.error);
            }
        });
    }

}
