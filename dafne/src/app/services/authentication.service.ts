import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, throwError } from 'rxjs';
import { catchError, tap, timeout } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { User, Datastore, Metadatastore, Credential, Producer, Consumer } from '@app/models/models';
import { ConfigService } from '@app/services/config.service';
import { MessageService } from '@app/services/message.service';

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
    public configService: ConfigService,
    private messageService: MessageService
  ) {
  }


  // call the auth/token end-point and set the token useful in the request towards Back-End and the token in the local storage
  login(username: string, password: string) {
    return this.http.post<any>(this.configService.getConfig().apiUrl + '/auth/token',
      { "username": username, "password": password }, httpOptions)
      .pipe(catchError(err => {
        return throwError(() => err);
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

        this.messageService.changeLogin(true);
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
          this.messageService.changeLogin(false);
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
        return throwError(() => err);
      }
    ));
  }

  async isUserAuthenticated() {
    // check if already authenticated and token is valid:
    let tempToken: any = localStorage.getItem('token');
    if (tempToken) {
      let body = {};
      try {
        const isAuth = await firstValueFrom(this.http.post<any>(
          this.configService.getConfig().apiUrl + `/auth/is-auth`,
          body,
          httpOptions
        ).pipe(
          timeout(5000),
          catchError((err) => {
            return throwError(() => err);
          })
        ));
        if (isAuth === "user is auth") {
          if (!this.currentUser.hasOwnProperty('username')) {
            let token = JSON.parse(tempToken);
            let decodedToken = this.decodeToken(token.access_token);
            this.clientId = await firstValueFrom(this.getClientId());
            if (this.clientId) {
              this.currentUser.username = decodedToken.preferred_username;
              this.currentUser.role = decodedToken.resource_access[this.clientId].roles[0];
              this.currentUser.token = token;
              this.currentUser.isAdmin = localStorage.getItem('isAdmin') == 'true' ? true : false;
            } else {
              console.log("Error getting userAuthenticated");
              this.isAuthenticated = false;
              return false;
            }
          }
          this.isAuthenticated = true;
          return true;
        }
        return false;
      } catch (err) {
        return false;
      }
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
        return throwError(() => err);
      }
    ));
  }

  getAllServices() {
    // get all services from the back-end
    return this.http.get<any>(this.configService.getConfig().apiUrl + '/services')
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
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
        return throwError(() => err);
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
        return throwError(() => err);
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
        return throwError(() => err);
      }
    ));
  }

  getServiceType(id: number) {
    // get all services from the back-end
    return this.http.get<any>(this.configService.getConfig().apiUrl + `/servicetypes/${id}`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }

  getAllServiceTypes() {
    // get all service types from the back-end
    return this.http.get<any>(this.configService.getConfig().apiUrl + '/servicetypes')
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
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
        return throwError(() => err);
      }
    ));
  }

  getRolling(id: number) {
    // get rolling policy from the back-end
    return this.http.get<any>(this.configService.getConfig().apiUrl + `/centres/${id}/rolling`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }

  getDataSourcesInfo(id: number) {
    // get data sources info from the back-end
    return this.http.get<any>(this.configService.getConfig().apiUrl + `/centres/${id}/datasourcesinfo`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }

  getDHSConnected(id: number) {
    // get dhs connected from the back-end
    return this.http.get<any>(this.configService.getConfig().apiUrl + `/centres/${id}/dhsconnected`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
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
        return throwError(() => err);
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
        return throwError(() => err);
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
        return throwError(() => err);
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
        return throwError(() => err);
      }
    ));
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
        return throwError(() => err);
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
        return throwError(() => err);
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
        return throwError(() => err);
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
        return throwError(() => err);
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
        return throwError(() => err);
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
        return throwError(() => err);
      }
    ));
  }

  getPublicationTimelinessDetail(id: number, body: object) {
    return this.http.post<any>(
      this.configService.getConfig().apiUrl + `/centres/${id}/service/timeliness/daily/details`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }

  getTimelinessRollingPeriod() {
    // get timeliness rolling period in days from the back-end
    return this.http.get<any>(this.configService.getConfig().apiUrl + `/config/timeliness/rollingPeriodInDays`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }

  getAvailabilityRollingPeriod() {
    // get availability rolling period in days from the back-end
    return this.http.get<any>(this.configService.getConfig().apiUrl + `/config/availability/rollingPeriodInDays`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }

  getClientId() {
    // get keycloak clientId from the back-end
    return this.http.get<string>(this.configService.getConfig().apiUrl + `/config/auth/clientId`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }



  /* Ingesters */
  getServiceData() {
    // get service data from the back-end, to setup ingester initial data in the backend.
    return this.http.get<any>(this.configService.getConfig().apiUrl + `/ingesters/service-data`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }
  getDatastores() {
    // get datastores from the back-end
    return this.http.get<Datastore[]>(this.configService.getConfig().apiUrl + `/ingesters/datastores`)
    .pipe(
      catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }

  getMetadatastores() {
    // get metadatastores from the back-end
    return this.http.get<Metadatastore[]>(this.configService.getConfig().apiUrl + `/ingesters/metadatastores`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }

  getCredentials() {
    // get credentials from the back-end
    return this.http.get<Credential[]>(this.configService.getConfig().apiUrl + `/ingesters/credentials`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }

  getDatastoresTypesList() {
    // get datastores types list from the back-end
    return this.http.get<{type: string, url: string}[]>(this.configService.getConfig().apiUrl + `/ingesters/datastores-types`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }

  getProducers() {
    // get producers from the back-end
    return this.http.get<Producer[]>(this.configService.getConfig().apiUrl + `/ingesters/producers`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }

  getConsumers() {
    // get consumers from the back-end
    return this.http.get<Consumer[]>(this.configService.getConfig().apiUrl + `/ingesters/consumers`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }

  getAllIngesters() {
    // get all ingesters from the back-end to check if RUNNING
    return this.http.get<any[]>(this.configService.getConfig().apiUrl + `/ingesters/get-all-ingesters`)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }


  createDatastore(datastore: Datastore) {
    // create datastore
    return this.http.post(this.configService.getConfig().apiUrl + `/ingesters/create-datastore`, datastore)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }

  deleteDatastore(datastore: Datastore) {
    // delete datastore
    return this.http.post(this.configService.getConfig().apiUrl + `/ingesters/delete-datastore`, datastore)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }
  
  updateDatastore(ingesterElement: object, restart: boolean) {
    // Update one datastore data
    const body = {
      ingesterElement: ingesterElement,
      restart: restart
    }
    return this.http.patch<any>(
      this.configService.getConfig().apiUrl + `/ingesters/patch-datastore/`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }


  createMetadatastore(metadatastore: Metadatastore) {
    // create metadatastore
    return this.http.post(this.configService.getConfig().apiUrl + `/ingesters/create-metadatastore`, metadatastore)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }

  deleteMetadatastore(metadatastore: Metadatastore) {
    // delete metadatastore
    return this.http.post(this.configService.getConfig().apiUrl + `/ingesters/delete-metadatastore`, metadatastore)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }

  updateMetadatastore(ingesterElement: object, restart: boolean) {
    // Update one metadatastore data
    const body = {
      ingesterElement: ingesterElement,
      restart: restart
    }
    return this.http.patch<any>(
      this.configService.getConfig().apiUrl + `/ingesters/patch-metadatastore/`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }


  createProducer(producer: Producer) {
    // create producer
    return this.http.post(this.configService.getConfig().apiUrl + `/ingesters/create-producer`, producer)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }

  deleteProducer(name: string) {
    // delete producer
    return this.http.post(this.configService.getConfig().apiUrl + `/ingesters/delete-producer`, { name: name })
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }

  updateProducer(ingesterElement: object, restart: boolean) {
    // Update producer data
    const body = {
      ingesterElement: ingesterElement,
      restart: restart
    }
    return this.http.patch<any>(
      this.configService.getConfig().apiUrl + `/ingesters/patch-producer`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }


  createConsumer(consumer: Consumer) {
    // create consumer
    return this.http.post(this.configService.getConfig().apiUrl + `/ingesters/create-consumer`, consumer)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }

  deleteConsumer(name: string) {
    // delete consumer
    return this.http.post(this.configService.getConfig().apiUrl + `/ingesters/delete-consumer`, { name: name })
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }

  updateConsumer(ingesterElement: object, restart: boolean) {
    // Update consumer data
    const body = {
      ingesterElement: ingesterElement,
      restart: restart
    }
    return this.http.patch<any>(
      this.configService.getConfig().apiUrl + `/ingesters/patch-consumer`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }


  createCredential(credential: Credential, type: string) {
    // create credential
    const body = {
      ingesterElement: credential,
      type: type
    };
    return this.http.post(this.configService.getConfig().apiUrl + `/ingesters/create-credentials`, body)
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }

  deleteCredential(name: string, type: string) {
    // delete credential
    return this.http.post(this.configService.getConfig().apiUrl + `/ingesters/delete-credentials`, { name: name, type: type })
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }

  updateCredential(ingesterElement: object, type: string) {
    // Update one credential data
    const body = {
      ingesterElement: ingesterElement,
      type: type
    }
    return this.http.patch<any>(
      this.configService.getConfig().apiUrl + `/ingesters/patch-credential/`,
      body,
      httpOptions
    )
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }


  manageIngester(name: string, action: string) {
    // Start & Stop Ingester:
    return this.http.post(this.configService.getConfig().apiUrl + `/ingesters/ingesters-management`, { name: name, action: action })
    .pipe(
    catchError(err => {
        console.error(err);
        return throwError(() => err);
      }
    ));
  }
}
