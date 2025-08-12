import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { firstValueFrom, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: any;
  constructor(
    private http: HttpClient
  ) {}

  loadConfig() {
    return firstValueFrom(
      this.http
        .get("assets/config/config.json")
        .pipe(
          catchError((error) => {
            console.error('Failed to load config:', error);
            return of({});
          })
        )
    )
    .then((data) => this.config = data);
  }

  getConfig() {
    return this.config;
  }
}