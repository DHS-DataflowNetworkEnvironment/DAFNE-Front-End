import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../services/authentication.service';
import { Router } from '@angular/router';
import { ToastComponent } from '../toast/toast.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private authenticationService: AuthenticationService,
    private toast: ToastComponent,
    private router: Router) { }

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
			username: ['', [Validators.required]],
			password: ['', [Validators.required]]
		});
  }

  get f() { return this.loginForm.controls; }

  submit() {
		this.submitted = true;

		this.authenticationService.login(this.loginForm.value.username, this.loginForm.value.password)
			.subscribe(
				data => {	
          this.toast.showSuccessToast('Login','Login successful with role: ' + this.authenticationService.currentUser.role);
          console.log("Login successful with role: " + this.authenticationService.currentUser.role);
          this.router.navigate(['/dafne'], { skipLocationChange: false });
        },
				error => {
					console.log(error);
					console.log(error.status);
					if (error.status === 403) {
						this.toast.showErrorToast('Confirm Registration', 'Account locked. Please check your email to confirm your registration.');
            console.log("Account locked. Please check your email to confirm your registration.");
          }	else {
						this.toast.showErrorToast('Login Failed', 'Invalid username and/or password');
            console.log("Invalid username and/or password");
					  this.authenticationService.logout().subscribe(
              data => {
                console.log("Logout successful!");
              },
              error => {
                console.log(error);
                console.log(error.status);
              });
          }
				});
	}
}
