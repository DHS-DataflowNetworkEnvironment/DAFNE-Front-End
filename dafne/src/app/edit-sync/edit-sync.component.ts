import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { Synchronizer } from '../models/synchronizer';
import { AuthenticationService } from '../services/authentication.service';
import { AlertComponent } from '../alert/alert.component';
import { MessageService } from '../services/message.service';

declare var $: any;

const regexPatterns = {
  add_label: "^.{1,60}$",
  add_service_url_backend: "^[^\ \,\;]{1,256}$",
  add_service_url_sync: "^[^\ \,\;]{1,256}$",
  add_service_login: "^.{1,60}$",
  add_service_password: "^.{1,60}$",
  add_schedule:  "^(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every ([\\d]+(ns|us|µs|ms|s|m|h))+)|(((([1-5]?[0-9])|[\*])[\/|\,|\-])?(([1-5]?[0-9])|[\*]) (((2[0-3]|1[0-9]|[0-9])|[\*])([\/|\,|\-]))?((2[0-3]|1[0-9]|[0-9])|[\*]) (((3[01]|[12][0-9]|[1-9])|[\*])[\/|\,|\-])?((3[01]|[12][0-9]|[1-9])|[\*]) (((1[0-2]|[1-9])|[\*])[\/|\,|\-])?((1[0-2]|[1-9])|[\*]) ((([0-6])|[\*])[\/|\,|\-])?(([0-6])|[\*]) [\?])$",
  add_page_size: "^((1[0-9][0-9])|([1-9][0-9])|([1-9]))$", /* number: 1 to 199 */
  add_source_collection: "",
  add_remote_incoming: "",
  add_last_creation_date: "^([0-9]{4}-[0-9]{2}-[0-9]{2})(T[0-9]{2}[\:][0-9]{2}[\:][0-9]{2}[\.][0-9]{3})?$",
  add_filter_param: "",
  add_geo_filter: "",
  
  edit_label: "^.{1,60}$",
  edit_service_url_backend: "^[^\ \,\;]{1,256}$",
  edit_service_url_sync: "^[^\ \,\;]{1,256}$",
  edit_service_login: "^.{1,60}$",
  edit_service_password: "^.{1,60}$",
  edit_schedule:  "^(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every ([\\d]+(ns|us|µs|ms|s|m|h))+)|(((([1-5]?[0-9])|[\*])[\/|\,|\-])?(([1-5]?[0-9])|[\*]) (((2[0-3]|1[0-9]|[0-9])|[\*])([\/|\,|\-]))?((2[0-3]|1[0-9]|[0-9])|[\*]) (((3[01]|[12][0-9]|[1-9])|[\*])[\/|\,|\-])?((3[01]|[12][0-9]|[1-9])|[\*]) (((1[0-2]|[1-9])|[\*])[\/|\,|\-])?((1[0-2]|[1-9])|[\*]) ((([0-6])|[\*])[\/|\,|\-])?(([0-6])|[\*]) [\?])$",
  edit_page_size: "^((1[0-9][0-9])|([1-9][0-9])|([1-9]))$", /* number: 1 to 199 */
  edit_source_collection: "",
  edit_remote_incoming: "",
  edit_last_creation_date: "^([0-9]{4}-[0-9]{2}-[0-9]{2})(T[0-9]{2}[\:][0-9]{2}[\:][0-9]{2}[\.][0-9]{3})?$",
  edit_filter_param: "",
  edit_geo_filter: ""
};

@Component({
  selector: 'app-edit-sync',
  templateUrl: './edit-sync.component.html',
  styleUrls: ['./edit-sync.component.css']
})
export class EditSyncComponent implements OnInit, AfterViewInit {

  public isLocalConfigured = false;
  public syncList = [];
  public currentSync: Synchronizer = new Synchronizer();
  public tempDeleteSync = {
    Id: -1,
    Label: '',
    ServiceUrl: ''
  };
  public tempSyncIdToDelete = -1;
  public tempSyncUrlToDelete = '';
  public serviceUrlBackendList = []; //: Array<string>;
  public collectionsList = [[]];
  public syncBackendLength: number;
  public syncBackendLengthArray = [] //: Array<number>;
  public tempServiceUrlBackendNumber: number;

  public localCentre = {
    name: "",
    color: "#ffffff"
  };

  constructor(
    public authenticationService: AuthenticationService,
    private router: Router,
    private alert: AlertComponent,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.messageService.localCurrentMessage.subscribe(message => {
      if (message == false) {
        this.isLocalConfigured = false;       
      } else {
        this.isLocalConfigured = true;
        this.getLocalCentre();
        this.getSynchronizers();
      }
    });

    let inputs = document.querySelectorAll('input.form-control');
    inputs.forEach((input) => {
      input.addEventListener('keyup', (e:any) => {        
        this.validate(e.target, regexPatterns[e.target.attributes.id.value]);
      });
    });
  }

  ngAfterViewInit(): any {
    
  }

  validate(field, regex) {
    const rx = new RegExp(regex, 'i');
    if (rx.test(field.value)) {      
      field.className = 'form-control valid';
    } else {
      field.className = 'form-control invalid';
    }
  }

  getLocalCentre():any {
    this.authenticationService.getAllCentres().subscribe(
      (res: object) => {
        /* Get Local Centre */
        if (Object.values(res).filter((x) => x.local == true)[0]) {
          this.localCentre = Object.values(res).filter((x) => x.local == true)[0];
        } else {
          this.localCentre = {
            name: "No Local",
            color: "#ffffff"
          };
        }
      }
    );
  }
 

  getSynchronizers() {
    this.authenticationService.getSynchronizers().subscribe(
      (res: object) => {
        //console.log("GET SYNC: " + JSON.stringify(res, null, 2));
        this.syncBackendLength = Object.keys(res).length;
        this.syncBackendLengthArray = Array.from(Array(this.syncBackendLength).keys());
        for (var i = 0; i < this.syncBackendLength; i++) {
          this.syncList[i] = res[i].synchronizers;
          this.serviceUrlBackendList[i] = res[i].serviceUrl;  // Backend serviceUrl..
          for (var k = 0; k < this.syncList[i].length; k++) {
            this.syncList[i][k].ServiceUrlBackend = res[i].serviceUrl;
            //console.log("SYNC_LIST[" + i + "]["+ k +"] - SERVICE URL BE: " + this.syncList[i][k].ServiceUrlBackend); 
          }
          this.collectionsList.push([]);
          res[i].collections.forEach((item, index) => {
            //console.log("Pushing Collection item: " + item + " at pos: " + index);
            this.collectionsList[i].push(item.Name);
          });
        }
      }
    );
  }


  public editSynchronizer(id: number, service_url_backend: string) {
    let tempSync: any;
    for (var i = 0; i < this.serviceUrlBackendList.length; i++) {
      if (this.serviceUrlBackendList[i] == service_url_backend) {
        this.tempServiceUrlBackendNumber = i;
        tempSync = this.syncList[i].filter(a => a.Id === id)[0];
        //console.log("TempSync: " + JSON.stringify(tempSync, null, 2));
      }
    }
    
    this.currentSync.id = tempSync.Id;
    this.currentSync.label = tempSync.Label;
    this.currentSync.serviceUrlBackend = service_url_backend; // serviceUrlBackend..
    this.currentSync.serviceUrl = tempSync.ServiceUrl; // serviceUrlSync..
    this.currentSync.serviceLogin = tempSync.ServiceLogin;
    this.currentSync.servicePassword = ''; //tempSync.ServicePassword;
    this.currentSync.copyProduct = tempSync.CopyProduct;
    this.currentSync.schedule = tempSync.Schedule;
    this.currentSync.pageSize = tempSync.PageSize;
    this.currentSync.request = tempSync.Request;
    this.currentSync.targetCollection = (tempSync.TargetCollectionName == undefined ? '' : tempSync.TargetCollectionName);
    this.currentSync.remoteIncoming = tempSync.RemoteIncoming;
    this.currentSync.sourceCollection = tempSync.SourceCollection;
    this.currentSync.lastCreationDate = tempSync.LastCreationDate;
    this.currentSync.filterParam = tempSync.FilterParam;
    this.currentSync.geoFilter = tempSync.GeoFilter;
    $("#editSyncModal").modal('toggle');
  }


  public setNewFormRequest(request) {
    this.currentSync.request = request;
  }

  public setCopyProduct(copyProduct) {    
    this.currentSync.copyProduct = copyProduct;
  }

  public editCopyProduct(copyProduct) {    
    this.currentSync.copyProduct = copyProduct;
  }


  public addNewSynchronizer() {
    this.currentSync = new Synchronizer();
    this.currentSync.id = -1;
    this.currentSync.label = "";
    this.currentSync.serviceUrlBackend = "";
    this.currentSync.serviceUrl = "";
    this.currentSync.serviceLogin = "";
    this.currentSync.servicePassword = "";
    this.currentSync.copyProduct = "";
    this.currentSync.schedule = "";
    this.currentSync.pageSize = null;
    this.currentSync.request = "";
    this.currentSync.targetCollection = "";
    this.currentSync.remoteIncoming = "";
    this.currentSync.sourceCollection = "";
    this.currentSync.lastCreationDate = null;
    this.currentSync.filterParam = "";
    this.currentSync.geoFilter = "";
    $("#addSynchronizerModal").modal('toggle');
  }

  public deleteSynchronizer(id: number, service_url_backend: string) {
    //this.tempSyncIdToDelete = id;
    for (var i = 0; i < this.serviceUrlBackendList.length; i++) {
      if (this.serviceUrlBackendList[i] == service_url_backend) {
        this.tempDeleteSync = this.syncList[i].filter(a => a.Id === id)[0];
        //console.log("DELETE CURRENT SYNC: " + JSON.stringify(this.tempDeleteSync, null, 2));
      }
    }
    this.tempSyncUrlToDelete = service_url_backend;
    $("#deleteSynchronizerModal").modal('toggle');
  }

  public deleteSynchronizerConfirmed() {
    let body = {
      serviceUrl: this.tempSyncUrlToDelete,
    };
    this.authenticationService.deleteSynchronizer(this.tempDeleteSync.Id, body).subscribe(
      (res: string) => {
        //this.tempSyncIdToDelete = -1;
        this.tempSyncUrlToDelete = '';
        /* Refresh page: */
        this.refreshPage();
      }
    )
  }


  public deleteSynchronizerCanceled() {
    //this.tempSyncIdToDelete = -1;
    this.tempSyncUrlToDelete = '';
  }

  public onEditSubmit(id: number) {
    let valid = true;
    let inputs = document.querySelectorAll('#editSyncForm input.form-control');
    inputs.forEach((input) => {
      if (input.className == "form-control invalid") {
        valid = false;
        this.alert.showErrorAlert("Form value error", "You entered an invalid value into '" + input.id + "' field.");
      }
    });
    if (valid) {
      let serviceUrl = (<HTMLInputElement>document.getElementById("edit_service_url_backend")).value;
      let synch = {
        "Label":  (<HTMLInputElement>document.getElementById("edit_label")).value,
        "ServiceUrl": (<HTMLInputElement>document.getElementById("edit_service_url_sync")).value,
        "ServiceLogin": (<HTMLInputElement>document.getElementById("edit_service_login")).value,
        "ServicePassword": (<HTMLInputElement>document.getElementById("edit_service_password")).value,
        "RemoteIncoming": (<HTMLInputElement>document.getElementById("edit_remote_incoming")).value,
        "Schedule": (<HTMLInputElement>document.getElementById("edit_schedule")).value,
        "PageSize": (<HTMLInputElement>document.getElementById("edit_page_size")).value,
        "CopyProduct": (<HTMLInputElement>document.getElementById("edit_copy_product")).value,
        "FilterParam": (<HTMLInputElement>document.getElementById("edit_filter_param")).value,
        "GeoFilter": (<HTMLInputElement>document.getElementById("edit_geo_filter")).value,
        "SourceCollection": (<HTMLInputElement>document.getElementById("edit_source_collection")).value,
        "LastCreationDate": (<HTMLInputElement>document.getElementById("edit_last_creation_date")).value,
        "Request": (<HTMLInputElement>document.getElementById("edit_request")).value,
        "TargetCollectionName": (<HTMLInputElement>document.getElementById("edit_target_collection")).value
      }

      let body = {
        serviceUrl: serviceUrl,
        synch: synch
      };

      this.authenticationService.updateSynchronizer(id, body).subscribe(
        (res: string) => {
          this.refreshPage();
      });
    }
  }


  setNewFormServiceUrlBackend(idx: number) {
    //console.log("Selected ServiceUrlBackendId: " + idx);
    this.currentSync.serviceUrlBackend = this.serviceUrlBackendList[idx];
  }

  public onAddSubmit() {

    let valid = true;
    let inputs = document.querySelectorAll('#addSyncForm input.form-control');
    inputs.forEach((input) => {
      if (input.className == "form-control invalid") {
        valid = false;
        this.alert.showErrorAlert("Form value error", "You entered an invalid value into '" + input.id + "' field.");
      }
    });
    if (valid) {
      /* console.log("ADD SYNC SUBMITTED"); */
      let serviceUrl = (<HTMLInputElement>document.getElementById("add_service_url_backend")).value;
      let synch = {
        "Label":  (<HTMLInputElement>document.getElementById("add_label")).value,
        "ServiceUrl": (<HTMLInputElement>document.getElementById("add_service_url_sync")).value,
        "ServiceLogin": (<HTMLInputElement>document.getElementById("add_service_login")).value,
        "ServicePassword": (<HTMLInputElement>document.getElementById("add_service_password")).value,
        "RemoteIncoming": (<HTMLInputElement>document.getElementById("add_remote_incoming")).value,
        "Schedule": (<HTMLInputElement>document.getElementById("add_schedule")).value,
        "PageSize": (<HTMLInputElement>document.getElementById("add_page_size")).value,
        "CopyProduct": (<HTMLInputElement>document.getElementById("add_copy_product")).value,
        "FilterParam": (<HTMLInputElement>document.getElementById("add_filter_param")).value,
        "GeoFilter": (<HTMLInputElement>document.getElementById("add_geo_filter")).value,
        "SourceCollection": (<HTMLInputElement>document.getElementById("add_source_collection")).value,
        "LastCreationDate": (<HTMLInputElement>document.getElementById("add_last_creation_date")).value,
        "Request": (<HTMLInputElement>document.getElementById("add_request")).value,
        "TargetCollectionName": (<HTMLInputElement>document.getElementById("add_target_collection")).value
      }

      let body = {
        serviceUrl: serviceUrl,
        synch: synch
      };

    this.authenticationService.addSynchronizer(body).subscribe(
      (res: string) => {
        this.refreshPage();
    });
    }
  }


  refreshPage() {
    this.getSynchronizers();
    this.router.navigate(['edit-synchronizers'], { skipLocationChange: true });
  }

  
  parseJsonDate = (jsonDate)  => {
    try {
      var offset = new Date().getTimezoneOffset();
      let parts:any = /\/Date\((-?\d+)([+-]\d{2})?(\d{2})?.*/.exec(jsonDate);

      if (parts[2] == undefined)
          parts[2] = 0;

      if (parts[3] == undefined)
          parts[3] = 0;

      return new Date(+parts[1] + offset + parts[2] * 3600000 + parts[3] * 60000).toISOString().slice(0, -1);
    } catch (error) {
      return "N/A";
    }
  };


  public startSynchronizer(id: number, request: string, service_url_backend: string) {
    
    let tempStartSync;
    for (var i = 0; i < this.serviceUrlBackendList.length; i++) {
      if (this.serviceUrlBackendList[i] == service_url_backend) {
        this.tempServiceUrlBackendNumber = i;
        tempStartSync = this.syncList[i].filter(a => a.Id === id)[0];
      }
    }
    let synch = {
      "Label":  tempStartSync.Label,
      "ServiceUrl": tempStartSync.ServiceUrl,
      "ServiceLogin": tempStartSync.ServiceLogin,
      /* "ServicePassword": tempStartSync.ServicePassword, */
      "RemoteIncoming": tempStartSync.RemoteIncoming,
      "Schedule": tempStartSync.Schedule,
      "PageSize": tempStartSync.PageSize,
      "CopyProduct": tempStartSync.CopyProduct,
      "FilterParam": tempStartSync.FilterParam,
      "GeoFilter": tempStartSync.GeoFilter,
      "SourceCollection": tempStartSync.SourceCollection,
      "LastCreationDate": this.parseJsonDate(tempStartSync.LastCreationDate),
      "Request": request,
      "TargetCollection": tempStartSync.TargetCollection
    }
    let body = {
      serviceUrl: service_url_backend,
      synch: synch
    };

    this.authenticationService.updateSynchronizer(id, body).subscribe(
      (res: string) => {
        this.refreshPage();
      })
  }

  setTargetCollection(id: number) {
    this.currentSync.targetCollection = this.collectionsList[id]; // To Be Corrected..
  }

}
