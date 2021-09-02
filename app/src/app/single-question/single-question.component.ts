import { Component, OnInit } from '@angular/core';
import { DataService } from '../core/services/data.service';

@Component({
  selector: 'app-single-question',
  templateUrl: './single-question.component.html',
  styleUrls: ['./single-question.component.scss']
})
export class SingleQuestionComponent implements OnInit {

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
      this.dataService.getUsers().subscribe(result => {
          console.log(result);
      })
  }

}
