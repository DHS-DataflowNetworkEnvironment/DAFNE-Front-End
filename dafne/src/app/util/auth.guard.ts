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
            //console.log("TOKEN IS NOT PRESENT. GETTING FROM LOCAL STORAGE:");
            var token = JSON.parse(localStorage.getItem('token'));
            if (token) {
                //console.log("GOT TOKEN FROM LOCAL STORAGE.");
                
                this.authenticationService.token = token;
                
                if (this.authenticationService.currentUser) {
                    //console.log("CURRENT USER IS OK");
                    this.authenticationService.isAuthenticated = true;
                    return true; 
                } else {
                    //console.log("GETTING CURRENT USER FROM AUTH SERVICE");
                    this.authenticationService.currentUser = new User();
                    this.authenticationService.currentUser.username = this.authenticationService.decodeToken(token.access_token).preferred_username;
                    this.authenticationService.currentUser.role = this.authenticationService.decodeToken(token.access_token).resource_access.dafne.roles[0]; //ADMIN or USER
                    this.authenticationService.currentUser.token = token;
                    this.authenticationService.currentUser.isAdmin = (localStorage.getItem('isAdmin') == 'true' ? true : false);
                    //console.log("AUTH_GUARDS - IS ADMIN: " + this.authenticationService.currentUser.isAdmin);
                    this.authenticationService.isAuthenticated = true;
                    return true;
                }
            } else {
                //console.log("TOKEN FROM LOCAL STORAGE NOT OK! - redirect to LOGIN.");
                this.authenticationService.isAuthenticated = false;
                this.authenticationService.currentUser = null;
                this.router.navigate(['/dafne-login']);
                return false; 
            }
        }

    }
}
