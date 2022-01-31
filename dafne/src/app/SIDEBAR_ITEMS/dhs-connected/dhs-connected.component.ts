import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-dhs-connected',
  templateUrl: './dhs-connected.component.html',
  styleUrls: ['./dhs-connected.component.css']
})
export class DhsConnectedComponent implements OnInit {
  
  public numOfDhsConnected;
  private localId: number;  
  constructor(private authenticationService: AuthenticationService) { }

  ngOnInit(): void {
    this.getDHSConnected();
  }

  getDHSConnected():any {
    this.authenticationService.getAllCentres().subscribe(
      (res: object) => {
        if (Object.values(res).filter((x) => x.local == true)[0]) {
          this.localId = Object.values(res).filter((x) => x.local == true)[0].id;
          this.authenticationService.getMapDHSConnected(this.localId).subscribe(
            (res: object) => {
              var result = Object.values(res).filter((x) => x.local === null);
              this.numOfDhsConnected = result.length;
            }
          );
        } else {
          this.localId = -1;
        }
      }
    );
  }

  refreshDHSConnected() {
    this.getDHSConnected();
  }
}
