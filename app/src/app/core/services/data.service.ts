import { HttpClient, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AsyncSubject, BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(
    private http: HttpClient
  ) { }

  rootURL = '/api';

  getData(route: string): Observable<any>[] {
    const result = new AsyncSubject<any>();
    const progress = new BehaviorSubject<number>(0);

    this.http.get(`${this.rootURL}/${route}`,
      {
        observe: 'events',
        reportProgress: true,
        responseType: 'json'
      }).subscribe(
        (response: HttpEvent<any>) => {
          this.httpEvent(response, result, progress);
        }
    );

    return [result, progress];
  }

  postData(route: string, data: any): Observable<any>[] {
    const result = new AsyncSubject<any>();
    const progress = new BehaviorSubject<number>(0);

    this.http.post(`${this.rootURL}/${route}`, data,
      {
        observe: 'events',
        reportProgress: true,
        responseType: 'json'
      }).subscribe(
        (response: HttpEvent<any>) => {
          this.httpEvent(response, result, progress);
        }
    );

    return [result, progress];
  }

  putData(route: string, data: any): Observable<any>[] {
    const result = new AsyncSubject<any>();
    const progress = new BehaviorSubject<number>(0);

    this.http.put(`${this.rootURL}/${route}`, data,
      {
        observe: 'events',
        reportProgress: true,
        responseType: 'json'
      }).subscribe(
        (response: HttpEvent<any>) => {
          this.httpEvent(response, result, progress);
        }
    );

    return [result, progress];
  }

  private httpEvent(response: HttpEvent<any>, result: AsyncSubject<any>, progress: BehaviorSubject<number>): void {
    switch (response.type) {
      case 0:
        progress.next(10);
        break;
      case 1:
        progress.next(30);
        break;
      case 2:
        progress.next(50);
        break;
      case 3:
        progress.next(75);
        break;
      case 4:

        progress.next(100);
        progress.complete();

        result.next((response as any).body);
        result.complete();

        break;
    }
  }

}