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

  private reportMessageSource = new BehaviorSubject(false);
  reportCurrentMessage = this.reportMessageSource.asObservable();

  private loginMessageSource = new BehaviorSubject(false);
  loginMessage = this.loginMessageSource.asObservable();

  private showIngestersMessageSource = new BehaviorSubject(false);
  showIngestersMessage = this.showIngestersMessageSource.asObservable();

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

  showReport(show: boolean) {
    this.reportMessageSource.next(show);
  }

  changeLogin(login: boolean) {
    this.loginMessageSource.next(login);
  }

  showIngesters(show: boolean) {
    this.showIngestersMessageSource.next(show);
  }
}
