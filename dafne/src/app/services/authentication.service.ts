import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { User } from 'src/app/models/models';
import { ConfigService } from 'src/app/services/config.service';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
};

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  public currentUser: User = {};
  public clientId!: string;
  public isAuthenticated: boolean = true; /* refers to token */

  constructor(
    private http: HttpClient,
    private router: Router,
    public configService: ConfigService
  ) { }


  // call the auth/token end-point and set the token useful in the request towards Back-End and the token in the local storage
  login(username: string, password: string) {
    return this.http.post<any>(this.configService.getConfig().apiUrl + '/auth/token',
      { "username": username, "password": password }, httpOptions)
      .pipe(catchError(err => {
        return throwError(() => new Error(err));
      }), tap(res => {
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
        let token = res.token;
        this.isAuthenticated = true;
        localStorage.setItem('token', JSON.stringify(token));
        let decodedToken = this.decodeToken(token.access_token);
        this.clientId = res.clientId;
        this.currentUser = new User();
        this.currentUser.username = decodedToken.preferred_username;
        this.currentUser.role = decodedToken.resource_access[this.clientId].roles[0];
        this.currentUser.token = token;
        this.currentUser.isAdmin = res.isAdmin;
        localStorage.setItem('isAdmin', String(this.currentUser.isAdmin));        
      }));

  }

  logout() {
    let token = JSON.parse(localStorage.getItem('token')!);
    let refresh_token = '';
    if (token) {
      refresh_token = token.refresh_token;
      let body = {
        "refresh_token": refresh_token
      };
      return this.http.post<any>(
        this.configService.getConfig().apiUrl + `/auth/logout`,
        body,
        httpOptions
      ).subscribe({
        next: () => {},
        error: (error) => {
          console.error(error);
        },
        complete: () => {
          this.resetUser();
        }
      });
    } else {
      return null;
    }
  }

  resetUser() {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    this.isAuthenticated = false;
    this.currentUser = {};
    this.router.navigate(['/dafne-login'], { skipLocationChange: false });
  }

  checkAdminCount() {
    return this.http.get<any>(
      this.configService.getConfig().apiUrl + `/auth/check-admin-count`,
      httpOptions
    ).pipe(
      catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  async isUserAuthenticated() {
    // check if already authenticated and token is valid:
    let tempToken: any = localStorage.getItem('token');
    if (tempToken && this.isAuthenticated) {
      let body = {};
      return this.http.post<any>(
        this.configService.getConfig().apiUrl + `/auth/is-auth`,
        body,
        httpOptions
      ).subscribe({
        next: () => {
          if (!this.currentUser.hasOwnProperty('username')) {
            let token = JSON.parse(tempToken);
            let decodedToken = this.decodeToken(token.access_token);
            this.clientId = Object.keys(decodedToken.resource_access)[0];
            this.currentUser.username = decodedToken.preferred_username;
            this.currentUser.role = decodedToken.resource_access[this.clientId].roles[0];
            this.currentUser.token = token;
            this.currentUser.isAdmin = localStorage.getItem('isAdmin') == 'true' ? true : false;
          }  
          this.isAuthenticated = true;
          return this.isAuthenticated;
        },
        error: (error) => {
          this.isAuthenticated = false;
          this.logout();
        }
      });

    } else {
      this.isAuthenticated = false;
      this.logout();
      return false;
    }
  }

  getAllCentres() {
    // get all centres from the back-end
    return this.http.get<any>(this.configService.getConfig().apiUrl + '/centres')
    .pipe(
    catchError(err => {
        console.error(err);
        if (err.status == 401) {
        }
        return throwError(() => new Error(err));
      }
    ));
  }

  getAllServices() {
    // get all services from the back-end
    return this.http.get<any>(this.configService.getConfig().apiUrl + '/services')
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  addNewService(body: object) {
    // Update one centre datum
    return this.http.post<any>(
      this.configService.getConfig().apiUrl + `/services`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  updateService(id: number, body: object) {
    // Update one centre datum
    return this.http.put<any>(
      this.configService.getConfig().apiUrl + `/services/${id}`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  deleteService(id: number) {
    // delete one service
    return this.http.delete<any>(
      this.configService.getConfig().apiUrl + `/services/${id}`,
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  getServiceType(id: number) {
    // get all services from the back-end
    return this.http.get<any>(this.configService.getConfig().apiUrl + `/servicetypes/${id}`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  getAllServiceTypes() {
    // get all service types from the back-end
    return this.http.get<any>(this.configService.getConfig().apiUrl + '/servicetypes')
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  updateServiceType(id: number, body: object) {
    // Update one centre datum
    return this.http.put<any>(
      this.configService.getConfig().apiUrl + `/services/${id}`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  getRolling(id: number) {
    // get rolling policy from the back-end
    return this.http.get<any>(this.configService.getConfig().apiUrl + `/centres/${id}/rolling`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  getDataSourcesInfo(id: number) {
    // get data sources info from the back-end
    return this.http.get<any>(this.configService.getConfig().apiUrl + `/centres/${id}/datasourcesinfo`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  addNewCentre(body: object) {
    // Add one centre
    return this.http.post<any>(
      this.configService.getConfig().apiUrl + `/centres`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  deleteCentre(id: number) {
    // delete one centre
    return this.http.delete<any>(
      this.configService.getConfig().apiUrl + `/centres/${id}`,
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  updateCentre(id: number, body: object) {
    // Update one centre datum
    return this.http.put<any>(
      this.configService.getConfig().apiUrl + `/centres/${id}`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  decodeToken(token: any) {
    try {
        const decodedToken:any = jwtDecode(token); //decodes and verifies the token extracted form the header
        return decodedToken;
    } catch (error: any) {
        console.error({ 'level': 'error', 'message': { 'Token not valid!': error } });
        return throwError(() => new Error(error));
    }
  }


  getMapDataSourcesInfo(id: number) {
    // get map data info from the back-end
    return this.http.get<any>(this.configService.getConfig().apiUrl + `/centres/${id}/map/datasourcesinfo`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }


  getMapDHSConnected(id: number) {
    // get map dhs info from the back-end
    return this.http.get<any>(this.configService.getConfig().apiUrl + `/centres/${id}/map/dhsconnected`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }


  getSynchronizers() {
    // get synchronizers from the back-end
    return this.http.get<any>(this.configService.getConfig().apiUrl + `/synchronizers`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  getFESynchronizers() {
    // get FE synchronizers from the back-end
    return this.http.get<any>(this.configService.getConfig().apiUrl + `/synchronizers/fe`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  getBESynchronizers() {
    // get BE synchronizers from the back-end
    return this.http.get<any>(this.configService.getConfig().apiUrl + `/synchronizers/be`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  getSISynchronizers() {
    // get SI synchronizers from the back-end
    return this.http.get<any>(this.configService.getConfig().apiUrl + `/synchronizers/si`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  getSynchronizersV2() {
    // get synchronizers v2 from the back-end
    return this.http.get<any>(this.configService.getConfig().apiUrl + `/synchronizers/v2`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  getFESynchronizersV2() {
    // get FE synchronizers from the back-end v2
    return this.http.get<any>(this.configService.getConfig().apiUrl + `/synchronizers/v2fe`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  getBESynchronizersV2() {
    // get BE synchronizers from the back-end v2
    return this.http.get<any>(this.configService.getConfig().apiUrl + `/synchronizers/v2be`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  getSISynchronizersV2() {
    // get SI synchronizers from the back-end v2
    return this.http.get<any>(this.configService.getConfig().apiUrl + `/synchronizers/v2si`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
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
      this.configService.getConfig().apiUrl + `/synchronizers/${id}`,
      options)
  }

  getCompleteness(body: object) {
    // get completeness
    return this.http.post<any>(
      this.configService.getConfig().apiUrl + `/products/completeness`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  getFilterCompleteness(body: object) {
    // get completeness
    return this.http.post<any>(
      this.configService.getConfig().apiUrl + `/products/filter-completeness`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }


  updateSynchronizer(id: number, body: object) {
    return this.http.put<any>(
      this.configService.getConfig().apiUrl + `/synchronizers/${id}`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }


  addSynchronizer(body: object) {
    return this.http.post<any>(
      this.configService.getConfig().apiUrl + `/synchronizers`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  getServiceAvailability(id: number, body: object) {
    return this.http.post<any>(
      this.configService.getConfig().apiUrl + `/centres/${id}/service/availability`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  getServiceAvailabilityWeekly(id: number, body: object) {
    return this.http.post<any>(
      this.configService.getConfig().apiUrl + `/centres/${id}/service/availability/weekly`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  getPublicationTimeliness(id: number, body: object) {
    return this.http.post<any>(
      this.configService.getConfig().apiUrl + `/centres/${id}/service/timeliness/daily`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  getPublicationTimelinessWeekly(id: number, body: object) {
    return this.http.post<any>(
      this.configService.getConfig().apiUrl + `/centres/${id}/service/timeliness/weekly`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  getPublicationTimelinessDetail(id: number, body: object) {
    return this.http.post<any>(
      this.configService.getConfig().apiUrl + `/centres/${id}/service/Timeliness/daily/details`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  getTimelinessRollingPeriod() {
    // get timeliness rolling period in days from the back-end
    return this.http.get<any>(this.configService.getConfig().apiUrl + `/config/timeliness/rollingPeriodInDays`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }

  getAvailabilityRollingPeriod() {
    // get availability rolling period in days from the back-end
    return this.http.get<any>(this.configService.getConfig().apiUrl + `/config/availability/rollingPeriodInDays`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => new Error(err));
      }
    ));
  }
}
