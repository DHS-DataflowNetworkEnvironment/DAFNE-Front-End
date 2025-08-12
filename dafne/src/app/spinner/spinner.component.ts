import { Component } from '@angular/core';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
@Component({
  selector: 'app-spinner',
  imports: [],
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.scss'
})
export class SpinnerComponent {
  public whoCalledMe: any = [];  // To handle multiple HTTP calls

  constructor() {
    this.setOff();
  }

  setOn(parent = '') {
    this.whoCalledMe.push(parent);
    if (document.getElementById('portal-spinner')) {
      document.getElementById('portal-spinner')!.style.visibility = 'visible';
    }
  }

  setOff(parent = '') {
    // Hide the spinner only if all the requests have been executed
    const indexOf = this.whoCalledMe.indexOf(parent);
    if (parent !== '' && indexOf !== -1) {
      this.whoCalledMe.splice(indexOf, 1);
    }

    // Disable only if whoCalledMe is empty -> No pending HTTP requests!
    if (this.whoCalledMe.length === 0) {
      if (document.getElementById('portal-spinner')) {
        document.getElementById('portal-spinner')!.style.visibility = 'hidden';
      }
    }
  }
}
