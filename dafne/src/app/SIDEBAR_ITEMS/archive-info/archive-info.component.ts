import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authentication.service';

@Component({
  selector: 'app-archive-info',
  templateUrl: './archive-info.component.html',
  styleUrls: ['./archive-info.component.css']
})
export class ArchiveInfoComponent implements OnInit {
  public archiveList;
  private localId: number;
  public localName: string = "";

  constructor(private authenticationService: AuthenticationService) { }

  ngOnInit(): void {
    this.getRolling();
  }

  getRolling() {
    //console.log("Calling getRolling()")
    this.authenticationService.getAllCentres().subscribe(
      (res: object) => {
        //console.log("ARCHIVE INFO GetAllCentres: " + JSON.stringify(res, null, 2));
        var result = Object.values(res).filter((x) => x.local === true);
        if (result[0] == undefined) {
          this.localId = -1;
          this.localName = "";
        } else {
          this.localId = result[0].id;
          this.localName = result[0].name;
          //console.log("LOCAL_ID: " + this.localId);
          this.authenticationService.getRolling(this.localId).subscribe(
            (res: object) => {
              //console.log("ROLLING: " + JSON.stringify(res, null, 2));
              this.archiveList = res;
            }
          );
        }
      }
    );
  }
}