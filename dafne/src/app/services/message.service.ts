import { Injectable, EventEmitter } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  private messageSource = new BehaviorSubject('default message');
  currentMessage = this.messageSource.asObservable();

  private localMessageSource = new BehaviorSubject(false);
  localCurrentMessage = this.localMessageSource.asObservable();

  private spinnerMessageSource = new BehaviorSubject(false);
  spinnerCurrentMessage = this.spinnerMessageSource.asObservable();

  invokeAutoRefresh = new EventEmitter();

  constructor() { }


  changeMessage(message: string) {
    this.messageSource.next(message)
  }

  setLocalPresent(local: boolean) {
    this.localMessageSource.next(local);
  }

  showSpinner(show: boolean) {
    this.spinnerMessageSource.next(show);
  }

  autoRefresh() {
    this.invokeAutoRefresh.emit();
  }
}
