import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { User } from '../models/user';
import { AuthenticationService } from '../services/authentication.service';


@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
    constructor(
        private router: Router,
        private authenticationService: AuthenticationService
    ) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

        var token = this.authenticationService.token?.access_token;

        if (token) {
            this.authenticationService.isAuthenticated = true;
            return true; 
        } else {
            var token = JSON.parse(localStorage.getItem('token'));
            if (token) {                
                this.authenticationService.token = token;
                
                if (this.authenticationService.currentUser) {
                    this.authenticationService.isAuthenticated = true;
                    return true; 
                } else {
                    this.authenticationService.currentUser = new User();
                    this.authenticationService.currentUser.username = this.authenticationService.decodeToken(token.access_token).preferred_username;
                    this.authenticationService.currentUser.role = this.authenticationService.decodeToken(token.access_token).resource_access.dafne.roles[0];
                    this.authenticationService.currentUser.token = token;
                    this.authenticationService.currentUser.isAdmin = (localStorage.getItem('isAdmin') == 'true' ? true : false);
                    this.authenticationService.isAuthenticated = true;
                    return true;
                }
            } else {
                this.authenticationService.isAuthenticated = false;
                this.authenticationService.currentUser = null;
                this.router.navigate(['/dafne-login']);
                return false; 
            }
        }

    }
}
