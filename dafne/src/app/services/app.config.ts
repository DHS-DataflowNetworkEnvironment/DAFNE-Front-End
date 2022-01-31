import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SpinnerComponent } from '../spinner/spinner.component';

@Injectable()
export class AppConfig {
    static settings: any;
    constructor(private http: HttpClient,
      private spinner: SpinnerComponent) {}

    load() {
        const jsonFile = 'assets/config/config.json';
        return new Promise<void>((resolve, reject) => {
            this.http.get(jsonFile).toPromise().then((response : any) => {
               AppConfig.settings = response;
               resolve();
            }).catch((response: any) => {
               reject(`Could not load file '${jsonFile}': ${JSON.stringify(response)}`);
            });
        });
    }
}