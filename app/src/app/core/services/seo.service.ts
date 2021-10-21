import { Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class SEOService {

  constructor(
    private title: Title,
    private meta: Meta
  ) { }

  updateTitle(title: string): void {
    this.title.setTitle(title);
  }

  updateDescription(desc: string): void {
    this.meta.updateTag({ name: 'description', content: desc });
  }

}
