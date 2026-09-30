import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ConfigService } from '@app/services/config.service';
import { throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
};

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor(
    private http: HttpClient,
    public configService: ConfigService
  ) {}

  getReportJsonForPeriod(startDate: Date, stopDate: Date, period: string, folder: string, filenameString: string) {
    return this.http.post<any>(
      this.configService.getConfig().apiUrl + `/reports/get-report-json-for-period`,
      {"startDate": startDate, "stopDate": stopDate, "period": period, "folder": folder, "filenameString": filenameString},
      httpOptions
    ).pipe(
      catchError(err => {
        console.error(err);
        return throwError(() => new Error(err.error));
      }
    ));
  }

  getReportsFolderName() {
    return this.http.get<any>(
      this.configService.getConfig().apiUrl + `/reports/get-reports-folder-name`,
      httpOptions
    ).pipe(
      catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  getReportFileStructure() {
    return this.http.get<any>(
      this.configService.getConfig().apiUrl + `/reports/get-reports-file-structure`,
      httpOptions
    ).pipe(
      catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  downloadReport(filename: string) {
    return this.http.post(
      this.configService.getConfig().apiUrl + `/reports/download-report`,
      {"filename": filename},
      {
        ...httpOptions,
        responseType: 'blob'
      }
    ).pipe(
      catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  deleteGeneratedReport(filename: string) {
    return this.http.post(
      this.configService.getConfig().apiUrl + `/reports/delete-generated-report`,
      {"fileName": filename},
      httpOptions,
    ).pipe(
      catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }
}
