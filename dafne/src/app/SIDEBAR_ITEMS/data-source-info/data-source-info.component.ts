import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthenticationService } from '../../services/authentication.service';
import { MessageService } from '../../services/message.service';

declare var $: any;

@Component({
  selector: 'app-data-source-info',
  templateUrl: './data-source-info.component.html',
  styleUrls: ['./data-source-info.component.css']
})
export class DataSourceInfoComponent implements OnInit, OnDestroy {
  private autorefreshSubscription;
  public dataSourcesList;
  private localId: number = -1;

  constructor(
    private authenticationService: AuthenticationService,
    private messageService: MessageService
  ) { 
    this.autorefreshSubscription = this.messageService.invokeAutoRefresh.subscribe(() => {
      this.ngOnInit();
    });
  }

  ngOnInit(): void {
    this.getDataSourcesInfo();
  }

  ngOnDestroy(): void {
    if (this.autorefreshSubscription != undefined) {
      this.autorefreshSubscription.unsubscribe();
    }
  }

  getDataSourcesInfo() {
    this.authenticationService.getAllCentres().subscribe(
      (res: object) => {
        if (Object.values(res).filter((x) => x.local == true)[0]) {
          this.localId = Object.values(res).filter((x) => x.local == true)[0].id;
        } else {
          this.localId = -1;
        }
        this.authenticationService.getDataSourcesInfo(this.localId).subscribe(
          (res: object) => {
            this.dataSourcesList = res;
            this.dataSourcesList.sort(this.getSortCentreOrder("name"));
          }
        );
      }
    );
  }

  refreshDataSources() {
    this.getDataSourcesInfo();
  }

  /* Function to sort arrays of object: */    
  getSortCentreOrder(prop) {
    return function(a, b) {
        if (a.centre[prop] > b.centre[prop]) {    
            return 1;    
        } else if (a.centre[prop] < b.centre[prop]) {    
            return -1;    
        }    
        return 0;    
    }    
  } 
}
