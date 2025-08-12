import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from 'src/app/header/header.component';
import { FooterComponent } from 'src/app/footer/footer.component';
import { SpinnerComponent } from 'src/app/spinner/spinner.component';
import { AlertComponent } from './alert/alert.component';
import { AuthenticationService } from 'src/app/services/authentication.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, SpinnerComponent, AlertComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'DAFNE';

  constructor(
    private authenticationService: AuthenticationService,
    private alert: AlertComponent,
    public router: Router
  ) {
    router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.checkAdminCount();
      }
    });
  }

  checkAdminCount() {
    this.authenticationService.checkAdminCount().subscribe({
      next: (res: any) => {
        if (res.adminCount > 1) {
          document.querySelector('.multi-admin-warning-message')?.classList.remove('hidden');
          if (sessionStorage.getItem("alreadyCheckedMultiAdminWarning") != "true") {
            this.alert.showErrorAlert("Warning!", "Multiple users with DATAFLOW_MANAGER role are currently active on DAFNE.");
            sessionStorage.setItem("alreadyCheckedMultiAdminWarning", "true");
          }
        } else {
          document.querySelector('.multi-admin-warning-message')?.classList.add('hidden');
        }
      },
      error: (error: any) => {
        console.error("Got error while checking Admin Count:");
        console.error(error);
      }
    });
  }
}
