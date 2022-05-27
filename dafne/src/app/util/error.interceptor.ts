import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthenticationService } from '../services/authentication.service';
import { SpinnerComponent } from '../spinner/spinner.component';
import * as moment from 'moment';
import { AlertComponent } from '../alert/alert.component';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private authenticationService: AuthenticationService,
              private router: Router,
              private spinner: SpinnerComponent,
              private alert: AlertComponent
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    /* Spinner Service On */
    const now = moment.now().toLocaleString();
    this.spinner.setOn(now);
    return next.handle(request).pipe(
      tap(evt => {
        if (evt instanceof HttpResponse) {
          /* Spinner Service Off */
          this.spinner.setOff(now);
        }
      }),
      catchError(err => {
        /* Spinner Service Off */
        this.spinner.setOff(now);
        console.log('Error Interceptor: ', err);

        if (err.status === 401) {
          /* auto logout if 401 response returned from api */
          console.log("ERROR 401: Not Authorized");
          
          this.authenticationService.logout().subscribe(
            data => {
              console.log("Logout successful!");
              this.authenticationService.isAuthenticated = false;
              this.authenticationService.currentUser = null;
              this.router.navigate(['/dafne-login']);
            },
            error => {
              console.log(error);
              console.log(error.status);
            });
        } else if (err.status === 404) {
          /* show alert with message if error is 404: Not found */
          console.log("ERROR 404: Not Found.");
          this.alert.showErrorAlert("ERROR " + err.status + ": " + err.statusText, err.message);
          this.reloadCurrentRoute();
        } else {
          /* Show alert on any other error */
          if (err.error.hasOwnProperty('errors')) {
            this.alert.showErrorAlert("ERROR " + err.status + ": " + err.statusText, err.error.errors[0].message);
          } else {
            this.alert.showErrorAlert("ERROR " + err.status + ": " + err.statusText, err.message);
          }
        }

        return throwError(err);
      }));
  }

  reloadCurrentRoute() {
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', {skipLocationChange: true}).then(() => {
        this.router.navigate([currentUrl]);
    });
  }
}
