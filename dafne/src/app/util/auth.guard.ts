import { Injectable } from '@angular/core';
import { Router, CanActivate} from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authenticationService: AuthenticationService
  ) { }

  async canActivate(): Promise<boolean> {
    if (await this.authenticationService.isUserAuthenticated()) {
      return true;
    } 
    this.router.navigate(['/dafne-login']);
    return false;
  } 
}