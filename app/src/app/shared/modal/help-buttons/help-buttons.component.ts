import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-help-buttons',
  templateUrl: './help-buttons.component.html',
  styleUrls: ['./help-buttons.component.scss']
})
export class HelpButtonsComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<HelpButtonsComponent>,
  ) { }

  ngOnInit(): void {
  }

}
