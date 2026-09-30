import { Component, Injectable } from '@angular/core';
import { AlertService } from '../services/alert.service';

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

  constructor(public alert: AlertService) { }

  alertConfirmed(event: Event) {
    this.alert.resolve(true);
  }

  alertCancelled(event: Event) {
    this.alert.resolve(false);
  }
}
