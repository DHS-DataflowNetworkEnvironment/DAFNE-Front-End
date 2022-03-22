import { Component, OnInit, OnDestroy } from '@angular/core';
import { MessageService } from './services/message.service';
import { interval, Subscription } from 'rxjs';
import { AppConfig } from './services/app.config';

declare var $: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  public title = "DAFNE";
  public dataRefreshTime = AppConfig.settings.dataRefreshTime;
  autoRefreshSubscription: Subscription;

  constructor(
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    if (this.autoRefreshSubscription != undefined) {
      this.autoRefreshSubscription.unsubscribe();
    }
    const dataRefresh = interval(this.dataRefreshTime);
    this.autoRefreshSubscription = dataRefresh.subscribe(() => {
      // Call autorefresh service every dataRefreshTime milliseconds:
      this.messageService.autoRefresh();
    });
  }

  ngOnDestroy(): void {
    if (this.autoRefreshSubscription != undefined) {
      this.autoRefreshSubscription.unsubscribe();
    }
  }
}