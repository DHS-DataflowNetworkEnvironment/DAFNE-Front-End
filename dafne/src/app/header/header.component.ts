import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';

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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.menuButton = <HTMLElement>document.querySelector('#header-menu-button')!;
    this.dropdownMenu = <HTMLElement>document.querySelector('.dropdown-menu')!;
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
    this.router.navigate(['/gui', { outlets: { centralBodyRouter: ['network-component', 'homeView']}}], { skipLocationChange: true });
  }
  logout() {
    this.hideDropdown();
    this.authenticationService.logout();
  }
}

