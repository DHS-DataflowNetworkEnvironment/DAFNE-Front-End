import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthenticationService } from '../../services/authentication.service';
import { MessageService } from '../../services/message.service';

@Component({
  selector: 'app-centre',
  templateUrl: './centre.component.html',
  styleUrls: ['./centre.component.css']
})
export class CentreComponent implements OnInit, OnDestroy {
  private autorefreshSubscription;
  public localCentre = {
    name: "",
    color: "#ffffff"
  };
  constructor(
    private authenticationService: AuthenticationService,
    private messageService: MessageService
  ) { 
    this.autorefreshSubscription = this.messageService.invokeAutoRefresh.subscribe(() => {
        this.ngOnInit();
    });
  }

  ngOnInit(): void {
    this.getLocalCentre();
  }

  ngOnDestroy(): void {
    if (this.autorefreshSubscription != undefined) {
      this.autorefreshSubscription.unsubscribe();
    }
  }

  
  getLocalCentre() {
    this.authenticationService.getAllCentres().subscribe(
      (res: object) => {
        if (Object.values(res).filter((x) => x.local == true)[0]) {
          this.localCentre = Object.values(res).filter((x) => x.local == true)[0];
        } else {
          this.localCentre = {
            name: "",
            color: "#ffffff"
          };
        }
      }
    );
  }
}
