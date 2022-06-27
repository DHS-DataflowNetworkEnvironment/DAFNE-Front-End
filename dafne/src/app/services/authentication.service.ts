import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import jwt_decode from 'jwt-decode';
import { User } from '../models/user';
import { AppConfig } from '../services/app.config';



const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
};

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  public currentUser: User;
  public token: any;
  public isAuthenticated: boolean = false; /* refers to token */
  private _email = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) { }


  // call the auth/token end-point and set the token useful in the request towards ONDA Portal Back-End and the token in the local storage
  login(username: string, password: string) {
    var self = this;
    return this.http.post<any>(AppConfig.settings.apiUrl + '/auth/token',
      { "username": username, "password": password }, httpOptions)
      .pipe(catchError(err => {
        return throwError(err);
      }), tap(res => {        
        this.token = res.token;
        this.isAuthenticated = true;
        localStorage.setItem('token', JSON.stringify(this.token));
        this.currentUser = new User();
        this.currentUser.username = this.decodeToken(this.token.access_token).preferred_username;
        this.currentUser.role = this.decodeToken(this.token.access_token).resource_access.dafne.roles[0];
        this.currentUser.token = this.token;
        this.currentUser.isAdmin = res.isAdmin;
        localStorage.setItem('isAdmin', String(this.currentUser.isAdmin));        
      }));

  }

  logout() {

    let body = {
      "refresh_token": JSON.parse(localStorage.getItem('token')).refresh_token
    };
    
    return this.http.post<any>(
      AppConfig.settings.apiUrl + `/auth/logout`,
      body,
      httpOptions
    ).pipe(catchError(err => {
      console.error(err);
      return throwError(err);
    }));
  }

  getAllCentres() {
    // get all centres from the back-end
    return this.http.get<any>(AppConfig.settings.apiUrl + '/centres')
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }

  getAllServices() {
    // get all services from the back-end
    return this.http.get<any>(AppConfig.settings.apiUrl + '/services')
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }

  addNewService(body: object) {
    // Update one centre datum
    return this.http.post<any>(
      AppConfig.settings.apiUrl + `/services`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }

  updateService(id: number, body: object) {
    // Update one centre datum
    return this.http.put<any>(
      AppConfig.settings.apiUrl + `/services/${id}`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }

  deleteService(id: number) {
    // delete one service
    return this.http.delete<any>(
      AppConfig.settings.apiUrl + `/services/${id}`,
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }

  getServiceType(id: number) {
    // get all services from the back-end
    return this.http.get<any>(AppConfig.settings.apiUrl + `/servicetypes/${id}`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }

  getAllServiceTypes() {
    // get all service types from the back-end
    return this.http.get<any>(AppConfig.settings.apiUrl + '/servicetypes')
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }

  updateServiceType(id: number, body: object) {
    // Update one centre datum
    return this.http.put<any>(
      AppConfig.settings.apiUrl + `/services/${id}`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }

  getRolling(id: number) {
    // get rolling policy from the back-end
    return this.http.get<any>(AppConfig.settings.apiUrl + `/centres/${id}/rolling`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }

  getDataSourcesInfo(id: number) {
    // get data sources info from the back-end
    return this.http.get<any>(AppConfig.settings.apiUrl + `/centres/${id}/datasourcesinfo`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }

  addNewCentre(body: object) {
    // Add one centre
    return this.http.post<any>(
      AppConfig.settings.apiUrl + `/centres`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }

  deleteCentre(id: number) {
    // delete one centre
    return this.http.delete<any>(
      AppConfig.settings.apiUrl + `/centres/${id}`,
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }

  updateCentre(id: number, body: object) {
    // Update one centre datum
    return this.http.put<any>(
      AppConfig.settings.apiUrl + `/centres/${id}`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }

  decodeToken(token: any) {
    try {
        const decodedToken:any = jwt_decode(token); //decodes and verifies the token extracted form the header
        return decodedToken;
    } catch (error) {
        console.error({ 'level': 'error', 'message': { 'Token not valid!': error } });
        return throwError(error);
    }
  }


  getMapDataSourcesInfo(id: number) {
    // get map data info from the back-end
    return this.http.get<any>(AppConfig.settings.apiUrl + `/centres/${id}/map/datasourcesinfo`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }


  getMapDHSConnected(id: number) {
    // get map dhs info from the back-end
    return this.http.get<any>(AppConfig.settings.apiUrl + `/centres/${id}/map/dhsconnected`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }


  getSynchronizers() {
    // get synchronizers from the back-end
    return this.http.get<any>(AppConfig.settings.apiUrl + `/synchronizers`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }

  getFESynchronizers() {
    // get FE synchronizers from the back-end
    return this.http.get<any>(AppConfig.settings.apiUrl + `/synchronizers/fe`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }

  getBESynchronizers() {
    // get BE synchronizers from the back-end
    return this.http.get<any>(AppConfig.settings.apiUrl + `/synchronizers/be`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }

  getSISynchronizers() {
    // get SI synchronizers from the back-end
    return this.http.get<any>(AppConfig.settings.apiUrl + `/synchronizers/si`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }

  getSynchronizersV2() {
    // get synchronizers v2 from the back-end
    return this.http.get<any>(AppConfig.settings.apiUrl + `/synchronizers/v2`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }

  deleteSynchronizer(id: number, body: object) {
    // delete one sync
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      body: body
    };
    return this.http.delete<any>(
      AppConfig.settings.apiUrl + `/synchronizers/${id}`,
      options)
  }

  getCompleteness(body: object) {
    // get completeness
    return this.http.post<any>(
      AppConfig.settings.apiUrl + `/products/completeness`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }

  getFilterCompleteness(body: object) {
    // get completeness
    return this.http.post<any>(
      AppConfig.settings.apiUrl + `/products/filter-completeness`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }


  updateSynchronizer(id: number, body: object) {
    return this.http.put<any>(
      AppConfig.settings.apiUrl + `/synchronizers/${id}`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }


  addSynchronizer(body: object) {
    return this.http.post<any>(
      AppConfig.settings.apiUrl + `/synchronizers`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }

  getServiceAvailability(id: number, body: object) {
    return this.http.post<any>(
      AppConfig.settings.apiUrl + `/centres/${id}/service/availability`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }

  getServiceAvailabilityWeekly(id: number, body: object) {
    return this.http.post<any>(
      AppConfig.settings.apiUrl + `/centres/${id}/service/availability/weekly`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }

  getPublicationLatency(id: number, body: object) {
    return this.http.post<any>(
      AppConfig.settings.apiUrl + `/centres/${id}/service/latency/daily`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }

  getPublicationLatencyWeekly(id: number, body: object) {
    return this.http.post<any>(
      AppConfig.settings.apiUrl + `/centres/${id}/service/latency/weekly`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }

  getPublicationLatencyDetail(id: number, body: object) {
    return this.http.post<any>(
      AppConfig.settings.apiUrl + `/centres/${id}/service/latency/daily/details`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }

  getLatencyRollingPeriod() {
    // get latency rolling period in days from the back-end
    return this.http.get<any>(AppConfig.settings.apiUrl + `/config/latency/rollingPeriodInDays`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }

  getAvailabilityRollingPeriod() {
    // get availability rolling period in days from the back-end
    return this.http.get<any>(AppConfig.settings.apiUrl + `/config/availability/rollingPeriodInDays`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(err);
        }
    ));
  }
}
