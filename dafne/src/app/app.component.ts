import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from '@app/header/header.component';
import { FooterComponent } from '@app/footer/footer.component';
import { SpinnerComponent } from '@app/spinner/spinner.component';
import { AlertComponent } from './alert/alert.component';
import { AlertService } from './services/alert.service';
import { ReportComponent } from './report/report.component';
import { AuthenticationService } from '@app/services/authentication.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, SpinnerComponent, AlertComponent, ReportComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'DAFNE';
  public isAuthenticated = false;
  constructor(
    private authenticationService: AuthenticationService,
    private alert: AlertService,
    public router: Router
  ) {
    router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.checkAdminCount();
      }
    });
  }

  async checkAdminCount() {
    if (await this.authenticationService.isUserAuthenticated()) {
      this.authenticationService.checkAdminCount().subscribe({
        next: (res: any) => {
          if (res.adminCount > 1) {
            document.querySelector('.multi-admin-warning-message')?.classList.remove('hidden');
            if (sessionStorage.getItem("alreadyCheckedMultiAdminWarning") != "true") {
              this.alert.showAlert("Warning!", "Multiple users with DATAFLOW_MANAGER role are currently active on DAFNE.");
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
}
