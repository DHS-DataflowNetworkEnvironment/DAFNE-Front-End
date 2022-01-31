import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-centre',
  templateUrl: './centre.component.html',
  styleUrls: ['./centre.component.css']
})
export class CentreComponent implements OnInit {
  public localCentre = {
    name: "",
    color: "#ffffff"
  };
  constructor(private authenticationService: AuthenticationService) { }

  ngOnInit(): void {
    this.getLocalCentre();
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
