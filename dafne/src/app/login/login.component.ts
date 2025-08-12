import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  login_form = this.formBuilder.group({
    login_username: ['', Validators.required],
    login_password: ['', Validators.required]
  });
  public passwordIsVisible: boolean = false;

  constructor(
    private authenticationService: AuthenticationService,
    private router: Router
  ) {}

  async ngOnInit() {
    console.log("LOGIN PAGE!");
    if (await this.authenticationService.isUserAuthenticated()) {
      this.router.navigate(['/gui'], { skipLocationChange: false });
    } else {
      let headerContainer = document.querySelector('#header-container')!;
      headerContainer.classList.add('disabled');
      setTimeout(() => {
        console.clear();
      }, 200);
    }
  }

  toggleLoginPasswordVisibility() {
    this.passwordIsVisible = !this.passwordIsVisible;
  }

  onLoginSubmit() {
		this.authenticationService.login(this.login_form.value.login_username!, this.login_form.value.login_password!)
    .subscribe({
      next: (data) => {	
        //this.toast.showSuccessToast('Login','Login successful with role: ' + this.authenticationService.currentUser.role);
        console.log("Login successful with role: " + this.authenticationService.currentUser.role);
        this.router.navigate(['/'], { skipLocationChange: false });
      },
      error: (error) => {
        console.error(error);
        console.error(error.status); 
        if (error.status === 403) {
          //this.toast.showErrorToast('Check User Roles', 'Access denied. Invalid user role.');
          console.error("Access denied. Invalid user role.");
        }	else {
          //this.toast.showErrorToast('Login Failed', 'Invalid username and/or password');
          console.error("Invalid username and/or password");
          this.authenticationService.logout();
        }
      }
    })
  }
}
