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

  private sidebarMessageSource = new BehaviorSubject(false);
  sidebarMessage = this.sidebarMessageSource.asObservable();

  private refreshLocalMessageSource = new BehaviorSubject(null);
  refreshLocalMessage = this.refreshLocalMessageSource.asObservable();

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

  hideSidebar(hide: boolean) {
    this.sidebarMessageSource.next(hide);
  }

  refreshLocalCentre() {
    this.refreshLocalMessageSource.next(null);
  }
}