import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { DataService } from '../core/services/data.service';
import { DialogService } from '../core/services/dialog.service';
import { Survey } from '../shared/model/survey.model';

@Component({
    selector: 'app-survey-taker',
    templateUrl: './survey-taker.component.html',
    styleUrls: ['./survey-taker.component.scss']
})
export class SurveyTakerComponent implements OnInit {

    id = '';
    survey: Survey = new Survey();

    debounceButton = false;
    loading: boolean[] = [];
    loadingUnknown = false;

    dirty = false;

    constructor(
        private dialogService: DialogService,
        private activatedRoute: ActivatedRoute,
        private dataService: DataService
    ) { }

    ngOnInit(): void {
        this.activatedRoute.paramMap.subscribe(params => { 
            const id = params.get('id');
            if (id && id !== '0') {
                this.id = id;
                this.getSurvey();
            } else {
                window.alert('No Survey!');
            }
        });
    }

    canDeactivate(): Observable<boolean> | boolean {
        if (this.dirty) {
            return this.dialogService.confirm('Discard changes for Survey?');
        }
        return true;
    }

    getSurvey(): void {
        this.loadingUnknown = true;
        const [result, _] = this.dataService.getData(`survey?id=${this.id}`);
        result.subscribe((data: { ok: boolean, data?: Survey, headers?: any, status?: any, error?: any }) => {
            if (data.ok) {
                this.survey = data.data!;
                console.log(this.survey.users);
            } else {
                this.dialogService.alert(`Error: ${JSON.stringify(data.error)}`);
            }
            this.loadingUnknown = false;
        });
    }

}
