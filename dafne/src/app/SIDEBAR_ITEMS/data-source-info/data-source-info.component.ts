import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../../services/authentication.service';

declare var $: any;

@Component({
  selector: 'app-data-source-info',
  templateUrl: './data-source-info.component.html',
  styleUrls: ['./data-source-info.component.css']
})
export class DataSourceInfoComponent implements OnInit {
  public dataSourcesList;
  private localId: number = -1;

  constructor(private authenticationService: AuthenticationService) { }

  ngOnInit(): void {
    this.getDataSourcesInfo();
  }

  getDataSourcesInfo() {
    //console.log("Calling getDataSourcesInfo()")
    this.authenticationService.getAllCentres().subscribe(
      (res: object) => {
        if (Object.values(res).filter((x) => x.local == true)[0]) {
          this.localId = Object.values(res).filter((x) => x.local == true)[0].id;
        } else {
          this.localId = -1;
        }
        //console.log("LOCAL_ID: " + this.localId);
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
