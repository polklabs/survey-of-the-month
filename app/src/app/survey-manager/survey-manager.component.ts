import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../core/services/data.service';
import { Survey } from '../shared/model/survey.model';

@Component({
  selector: 'app-survey-manager',
  templateUrl: './survey-manager.component.html',
  styleUrls: ['./survey-manager.component.scss']
})
export class SurveyManagerComponent implements OnInit {

  constructor(
      private dataService: DataService,
      private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe(params => { 
        console.log(params.get('id'));
        const id = params.get('id'); 
        if (id) this.getSurvey(id);
    });
  }

  getSurvey(guid: string): void {
    const [result, progress] = this.dataService.getData('survey?id=' + guid);
    result.subscribe((data: { ok: boolean, data?: Survey, error?: any }) => {
        if (data.ok) {
            console.log(data);
            // this.survey = data.data!;
            // this.users = this.survey.users.map(x => x.name);
        } else {
            console.error(data.error);
        }
    });
}

}
