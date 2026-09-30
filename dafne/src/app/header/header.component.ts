import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthenticationService } from '@app/services/authentication.service';
import { MessageService } from '@app/services/message.service';

@Component({
  selector: 'app-header',
  imports: [RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  public isAuthenticated = false;
  private menuHideTimeout: number = 1000;
  private menuHideTimeoutId: any;
  private menuButton: any;
  private dropdownMenu: any;

  constructor(
    private authenticationService: AuthenticationService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.menuButton = <HTMLElement>document.querySelector('#header-menu-button')!;
    this.dropdownMenu = <HTMLElement>document.querySelector('.dropdown-menu')!;

    this.messageService.showIngestersMessage.subscribe(show => {
      // Handle the showIngesters message
      const ingestersMenuButton = <HTMLElement>document.querySelector('#ingesters-menu-button')!;
      if (show) {
        (<HTMLButtonElement>ingestersMenuButton).disabled = false;
      } else {
        (<HTMLButtonElement>ingestersMenuButton).disabled = true;
      }
    });
  }

  isAdmin() {
    return this.authenticationService.currentUser.isAdmin;
  }

  onMenuClicked() {
    if (this.dropdownMenu.classList.contains('hidden')) {
      this.dropdownMenu.classList.remove('hidden');
      this.menuButton.classList.add('selected');
      this.setHideMenuTimeout();
    } else {
      this.hideDropdown();
    }
  }
  setHideMenuTimeout() {
    clearTimeout(this.menuHideTimeoutId);
    this.menuHideTimeoutId = setTimeout(() => {
      this.hideDropdown();
    }, this.menuHideTimeout);
  }
  hideDropdown() {
    this.dropdownMenu.classList.add('hidden');
    this.menuButton.classList.remove('selected');
  }
  onMenuHover() {
    clearTimeout(this.menuHideTimeoutId);
  }
  onHomeClicked() {
    this.router.navigate(['/home', { outlets: { centralBodyRouter: ['network-view', 'homeView']}}], { skipLocationChange: true });
  }
  onGenerateReportClicked() {
    this.hideDropdown();
    this.messageService.showReport(true);
  }
  logout() {
    this.hideDropdown();
    this.authenticationService.logout();
  }
}

