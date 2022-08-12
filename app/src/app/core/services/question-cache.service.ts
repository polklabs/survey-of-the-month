import { Injectable } from '@angular/core';
import { Question } from 'src/app/shared/model/question.model';

@Injectable({
  providedIn: 'root',
})
export class QuestionCacheService {
  private index: {[key:string]:number} = {};
  private questions: {[key:string]:Question[]} = {};

  addQuestion(q: Question, key = ''): void {
    if (this.questions[key] === undefined) {
      this.questions[key] = [];
      this.index[key] = -1;
    }
    this.questions[key].push(q);
    while (this.questions[key].length >= 10) {
      this.questions[key] = this.questions[key].slice(1);
    }
    this.index[key] = this.questions[key].length - 1;
  }

  canUndo(key = ''): boolean {
    if (this.index[key] === undefined) return false;
    return this.index[key] > 0;
  }

  canRedo(key = ''): boolean {
    if (this.index[key] === undefined) return false;
    return this.index[key] < this.questions[key].length - 1;
  }

  undo(key = ''): Question | undefined {
    this.index[key]--;
    return this.questions[key][this.index[key]];
  }

  redo(key = ''): Question | undefined {
    this.index[key]++;
    return this.questions[key][this.index[key]];
  }

  constructor() {}
}
