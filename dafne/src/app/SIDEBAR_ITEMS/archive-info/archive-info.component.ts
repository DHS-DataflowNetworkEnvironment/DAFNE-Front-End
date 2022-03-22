import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { MessageService } from '../../services/message.service';

@Component({
  selector: 'app-archive-info',
  templateUrl: './archive-info.component.html',
  styleUrls: ['./archive-info.component.css']
})
export class ArchiveInfoComponent implements OnInit, OnDestroy {
  private autorefreshSubscription;
  public archiveList;
  private localId: number;
  public localName: string = "";

  constructor(
    private authenticationService: AuthenticationService,
    private messageService: MessageService
  ) { 
    this.autorefreshSubscription = this.messageService.invokeAutoRefresh.subscribe(() => {
      this.ngOnInit();
    });
  }

  ngOnInit(): void {
    this.getRolling();
  }

  ngOnDestroy(): void {
    if (this.autorefreshSubscription != undefined) {
      this.autorefreshSubscription.unsubscribe();
    }
  }

  getRolling() {
    this.authenticationService.getAllCentres().subscribe(
      (res: object) => {
        var result = Object.values(res).filter((x) => x.local === true);
        if (result[0] == undefined) {
          this.localId = -1;
          this.localName = "";
        } else {
          this.localId = result[0].id;
          this.localName = result[0].name;
          this.authenticationService.getRolling(this.localId).subscribe(
            (res: object) => {
              this.archiveList = res;
            }
          );
        }
      }
    );
  }
}