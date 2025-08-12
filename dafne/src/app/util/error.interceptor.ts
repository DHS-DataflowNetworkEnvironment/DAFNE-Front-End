import { HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpEvent, HttpEventType } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { Router } from '@angular/router';
import { AlertComponent } from 'src/app/alert/alert.component';
import { SpinnerComponent } from '../spinner/spinner.component';
import * as moment from 'moment';

export const errorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {

  const authenticationService = inject(AuthenticationService);
  const alert = inject(AlertComponent);
  const router = inject(Router);
  const spinner = inject(SpinnerComponent);

  /* Spinner Service On */
  const now = moment.now().toLocaleString();
  spinner.setOn(now);

  return next(req).pipe(
    tap((event: any) => {
      if (event.type === HttpEventType.Response) {
        /* Spinner Service Off */
        spinner.setOff(now);
      }
      
    }),
    catchError((error: any) => {
      /* Spinner Service Off */
      spinner.setOff(now);

      if (error.status === 401) {
        authenticationService.logout();
      } else if (error.status === 403) {
        /* Cannot login if 403 response returned from api */          
        console.log("ERROR 403: Invalid role.");
        alert.showErrorAlert("ERROR " + error.status + ": " + error.statusText + " - Invalid role.", error.message);
        reloadCurrentRoute();
      } else if (error.status === 404) {
        /* show alert with message if error is 404: Not found */
        console.log("ERROR 404: Not Found.");
        alert.showErrorAlert("ERROR " + error.status + ": " + error.statusText, error.message);
        reloadCurrentRoute();
      } else if (error.status === 400) {
        /* Don't show alert if error is 400: Token not valid */
        console.log("ERROR 400: Token not valid.");
        alert.showErrorAlert("ERROR " + error.status + ": " + error.statusText, error.message);
        reloadCurrentRoute();
      } else {
        /* Show alert on any other error */
        if (error.error.hasOwnProperty('errors')) {
          alert.showErrorAlert("ERROR " + error.status + ": " + error.statusText, error.error.errors[0].message);
        } else {
          alert.showErrorAlert("ERROR " + error.status + ": " + error.statusText, error.message);
        }
      }
      return throwError(() => error);
    })
  );

  function reloadCurrentRoute() {
    const currentUrl = router.url;
    router.navigateByUrl('/', {skipLocationChange: true}).then(() => {
        router.navigate([currentUrl]);
    });
  }
};
