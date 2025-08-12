import { Component, Injectable } from '@angular/core';

@Component({
  selector: 'app-alert',
  imports: [],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.scss'
})
@Injectable({
    providedIn: 'root'
})
export class AlertComponent {
  public alertTitle: string = 'Generic Error'
  public alertMessage: string = 'Alert!';
  constructor() { }

  showInfoAlert (message: string) {
    //this.showAlert(message);
  }

  showSuccessAlert (message: string) {
    //this.showAlert(message);
  }

  showWarningAlert (message: string) {
    //this.showAlert(message);
  }

  showErrorAlert (title: string, message: string) {
    this.alertTitle = title;
    this.alertMessage = message;
    document.querySelector('.alert-modal-title')!.innerHTML = this.alertTitle;
    document.querySelector('.alert-modal-message')!.innerHTML = this.alertMessage;
    document.querySelector("#alertModal")!.classList.remove('hidden');
  }

  alertConfirmed(event: Event) {
    document.querySelector("#alertModal")!.classList.add('hidden');
    event.preventDefault();
  }
}
