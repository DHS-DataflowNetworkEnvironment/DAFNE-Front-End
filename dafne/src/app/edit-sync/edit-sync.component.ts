import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Synchronizer } from '../models/synchronizer';
import { AuthenticationService } from '../services/authentication.service';
import { AlertComponent } from '../alert/alert.component';
import { MessageService } from '../services/message.service';

declare var $: any;

const regexPatterns = {
  add_label: "^.{1,60}$",
  add_service_url_backend: "^[^\ \,\;]{1,256}$",
  add_service_url_sync: "^[^\ \,\;]{1,256}$",
  add_sync_service_login: "^.{1,60}$",
  add_sync_service_password: "^.{1,60}$",
  add_schedule:  "^(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every ([\\d]+(ns|us|µs|ms|s|m|h))+)|(((([1-5]?[0-9])|[\*])[\/|\,|\-])?(([1-5]?[0-9])|[\*]) (((2[0-3]|1[0-9]|[0-9])|[\*])([\/|\,|\-]))?((2[0-3]|1[0-9]|[0-9])|[\*]) (((3[01]|[12][0-9]|[1-9])|[\*])[\/|\,|\-])?((3[01]|[12][0-9]|[1-9])|[\*]) (((1[0-2]|[1-9])|[\*])[\/|\,|\-])?((1[0-2]|[1-9])|[\*]) ((([0-6])|[\*])[\/|\,|\-])?(([0-6])|[\*]) [\?])$",
  add_copy_product: "^.{1,60}$",
  add_page_size: "^((1[0-9][0-9])|([1-9][0-9])|([1-9]))$", /* number: 1 to 199 */
  add_request: "^.{1,60}$",
  add_source_collection: "",
  add_remote_incoming: "",
  add_last_creation_date: "^([0-9]{4}-[0-9]{2}-[0-9]{2})(T[0-9]{2}[\:][0-9]{2}[\:][0-9]{2}[\.][0-9]{3})?$",
  add_filter_param: "",
  add_geo_filter: "",
  
  edit_label: "^.{1,60}$",
  edit_service_url_backend: "^[^\ \,\;]{1,256}$",
  edit_service_url_sync: "^[^\ \,\;]{1,256}$",
  edit_sync_service_login: "^.{1,60}$",
  edit_sync_service_password: "^.{0,60}$",
  edit_schedule:  "^(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every ([\\d]+(ns|us|µs|ms|s|m|h))+)|(((([1-5]?[0-9])|[\*])[\/|\,|\-])?(([1-5]?[0-9])|[\*]) (((2[0-3]|1[0-9]|[0-9])|[\*])([\/|\,|\-]))?((2[0-3]|1[0-9]|[0-9])|[\*]) (((3[01]|[12][0-9]|[1-9])|[\*])[\/|\,|\-])?((3[01]|[12][0-9]|[1-9])|[\*]) (((1[0-2]|[1-9])|[\*])[\/|\,|\-])?((1[0-2]|[1-9])|[\*]) ((([0-6])|[\*])[\/|\,|\-])?(([0-6])|[\*]) [\?])$",
  edit_copy_product: "^.{1,60}$",
  edit_page_size: "^((1[0-9][0-9])|([1-9][0-9])|([1-9]))$", /* number: 1 to 199 */
  edit_request: "^.{1,60}$",
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
export class EditSyncComponent implements OnInit, OnDestroy {
  private autorefreshSubscription;
  private navigationSubscription;
  private pageRefreshed: boolean = true;
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
  public serviceUrlBackendList = [];
  public intelligentSyncSupported = [];
  public collectionsList = [[]];
  public syncBackendLength: number;
  public syncBackendLengthArray = [];
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
  ) {
    this.navigationSubscription = this.router.events.subscribe((e: any) => {
      if (e instanceof NavigationEnd) {
        if (this.pageRefreshed == false) {
          this.pageRefreshed = true;
          this.ngOnInit();
        }
      }
    });

    this.autorefreshSubscription = this.messageService.invokeAutoRefresh.subscribe(() => {
      this.messageService.showSpinner(false);
      this.getLocalCentre();
      this.getSynchronizers();
    });
  }

  ngOnInit(): void {
    this.messageService.localCurrentMessage.subscribe(message => {
      if (message == false) {
        this.isLocalConfigured = false;       
      } else {
        this.messageService.showSpinner(true);
        this.isLocalConfigured = true;
        this.getLocalCentre();
        this.getSynchronizers();
      }      
    });

    let inputs = document.querySelectorAll('input.form-control');
    inputs.forEach((input) => {
      input.addEventListener('input', (e:any) => {        
        this.validate(e.target, regexPatterns[e.target.attributes.id.value]);
      });
    });
    var inputAddPassword = document.querySelector('#add_sync_service_password');
    inputAddPassword.addEventListener('input', (e:any) => {
      document.getElementById('toggleAddSyncPassword').style.setProperty('display', 'inline');
    })
    var inputEditPassword = document.querySelector('#edit_sync_service_password');
    inputEditPassword.addEventListener('input', (e:any) => {
      document.getElementById('toggleEditSyncPassword').style.setProperty('display', 'inline');
    })
    $('.modal').on('hidden.bs.modal', function () {
      var passwordAddEl = document.getElementById('add_sync_service_password');
      passwordAddEl.setAttribute('type', 'password');
      var passwordEditEl = document.getElementById('edit_sync_service_password');
      passwordEditEl.setAttribute('type', 'password');
    })
  }

  ngOnDestroy(): void {
    if (this.navigationSubscription != undefined) {
      this.navigationSubscription.unsubscribe();
    }
    if (this.autorefreshSubscription != undefined) {
      this.autorefreshSubscription.unsubscribe();
    }
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
        this.syncBackendLength = Object.keys(res).length;
        this.syncBackendLengthArray = Array.from(Array(this.syncBackendLength).keys());
        this.collectionsList = [[]];
        for (var i = 0; i < this.syncBackendLength; i++) {
          this.syncList[i] = res[i].synchronizers;
          this.serviceUrlBackendList[i] = res[i].serviceUrl;  // Backend serviceUrl..
          this.intelligentSyncSupported[i] = res[i].intelligentSyncSupported;
          
          for (var k = 0; k < this.syncList[i].length; k++) {
            this.syncList[i][k].ServiceUrlBackend = res[i].serviceUrl;
            this.syncList[i][k].IntelligentSyncSupported = res[i].intelligentSyncSupported;
          }
          this.collectionsList.push([]);
          if (res[i].collections != undefined) {
            res[i].collections.forEach((item, index) => {
              this.collectionsList[i].push(item.Name);
            });
          }
        }
        this.pageRefreshed = false;
      }
    );
  }

  public addNewSynchronizer() {
    this.tempServiceUrlBackendNumber = undefined;
    this.currentSync = new Synchronizer();
    this.currentSync.serviceUrlBackend = "";
    this.currentSync.label = "";
    this.currentSync.serviceUrl = "";
    this.currentSync.serviceLogin = "";
    this.currentSync.servicePassword = "";
    this.currentSync.schedule = "";
    this.currentSync.copyProduct = "true";
    this.currentSync.pageSize = null;
    this.currentSync.request = "stop";
    this.currentSync.sourceCollection = "";
    this.currentSync.targetCollection = "";
    this.currentSync.remoteIncoming = "";
    this.currentSync.lastCreationDate = null;
    this.currentSync.filterParam = "";
    this.currentSync.geoFilter = "";
    let inputs = document.querySelectorAll('#addSyncForm input.form-control');
    inputs.forEach((input) => {
      if ((<HTMLInputElement>input).id == "add_service_url_backend") (<HTMLInputElement>input).value = this.currentSync.serviceUrlBackend;
      if ((<HTMLInputElement>input).id == "add_label") (<HTMLInputElement>input).value = this.currentSync.label;
      if ((<HTMLInputElement>input).id == "add_service_url_sync") (<HTMLInputElement>input).value = this.currentSync.serviceUrl;
      if ((<HTMLInputElement>input).id == "add_sync_service_login") (<HTMLInputElement>input).value = this.currentSync.serviceLogin;
      if ((<HTMLInputElement>input).id == "add_sync_service_password") (<HTMLInputElement>input).value = this.currentSync.servicePassword;
      if ((<HTMLInputElement>input).id == "add_schedule") (<HTMLInputElement>input).value = this.currentSync.schedule;
      if ((<HTMLInputElement>input).id == "add_copy_product") (<HTMLInputElement>input).value = this.currentSync.copyProduct;
      if ((<HTMLInputElement>input).id == "add_page_size") (<HTMLInputElement>input).value = "";
      if ((<HTMLInputElement>input).id == "add_request") (<HTMLInputElement>input).value = this.currentSync.request;
      if ((<HTMLInputElement>input).id == "add_source_collection") (<HTMLInputElement>input).value = this.currentSync.sourceCollection;
      if ((<HTMLInputElement>input).id == "add_target_collection") (<HTMLInputElement>input).value = this.currentSync.targetCollection;
      if ((<HTMLInputElement>input).id == "add_remote_incoming") (<HTMLInputElement>input).value = this.currentSync.remoteIncoming;
      if ((<HTMLInputElement>input).id == "add_last_creation_date") (<HTMLInputElement>input).value = this.currentSync.lastCreationDate;
      if ((<HTMLInputElement>input).id == "add_filter_param") (<HTMLInputElement>input).value = this.currentSync.filterParam;
      if ((<HTMLInputElement>input).id == "add_geo_filter") (<HTMLInputElement>input).value = this.currentSync.geoFilter;
    });

    var eyeEl = document.getElementById('toggleAddSyncPassword');
    eyeEl.setAttribute('class', 'far fa-eye');
    eyeEl.style.setProperty('display', 'none');
    $("#addSynchronizerModal").modal('toggle');
  }

  public onAddSubmit() {
    let valid = true;
    let inputs = document.querySelectorAll('#addSyncForm input.form-control');
    inputs.forEach((input) => {
      this.validate(input, regexPatterns[input.id]);
      if (input.className == "form-control invalid") {
        valid = false;
        return;
      }
    });
    if (valid) {
      $('.modal').modal('hide');
      let serviceUrl = (<HTMLInputElement>document.getElementById("add_service_url_backend")).value;
      let synch = {
        "Label":  (<HTMLInputElement>document.getElementById("add_label")).value,
        "ServiceUrl": (<HTMLInputElement>document.getElementById("add_service_url_sync")).value,
        "ServiceLogin": (<HTMLInputElement>document.getElementById("add_sync_service_login")).value,
        "ServicePassword": (<HTMLInputElement>document.getElementById("add_sync_service_password")).value,
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

  public setNewFormServiceUrlBackend(idx: number) {
    if (this.intelligentSyncSupported[idx] == false) {
      this.currentSync.serviceUrlBackend = this.serviceUrlBackendList[idx];    
      this.tempServiceUrlBackendNumber = idx;
      let element = document.getElementById('add_service_url_backend');
      (<HTMLInputElement>element).value = this.currentSync.serviceUrlBackend;
      element.dispatchEvent(new KeyboardEvent('input', { 'bubbles': true }));
    } else {
      this.alert.showErrorAlert("Selected service URL belongs to a DHuS version >= 3.1.x", "DAFNE 2.x does not support synchronizer creation for DHuS version >= 3.1.x");
      let element = document.getElementById('add_service_url_backend');
      (<HTMLInputElement>element).value = "";
    }
  }

  public setTargetCollection(id: number) {
    this.currentSync.targetCollection = this.collectionsList[id];
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
  
  public deleteSynchronizer(id: number, service_url_backend: string) {
    for (var i = 0; i < this.serviceUrlBackendList.length; i++) {
      if (this.serviceUrlBackendList[i] == service_url_backend) {
        this.tempDeleteSync = this.syncList[i].filter(a => a.Id === id)[0];
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
        this.tempSyncUrlToDelete = '';
        this.refreshPage();
      }
    )
  }


  public deleteSynchronizerCanceled() {
    this.tempSyncUrlToDelete = '';
  }

  public findLableForControl(el) {
    var idVal = el.id;
    let labels = document.getElementsByTagName('label');
    for( var i = 0; i < labels.length; i++ ) {
       if (labels[i].htmlFor == idVal)
            return labels[i];
    }
    return undefined;
  }

  public editSynchronizer(id: number, service_url_backend: string) {
    this.tempServiceUrlBackendNumber = undefined;
    let tempSync: any;
    for (var i = 0; i < this.serviceUrlBackendList.length; i++) {
      if (this.serviceUrlBackendList[i] == service_url_backend) {
        this.tempServiceUrlBackendNumber = i;
        tempSync = this.syncList[i].filter(a => a.Id === id)[0];
      }
    }
    
    this.currentSync.id = tempSync.Id;
    this.currentSync.label = tempSync.Label;
    this.currentSync.serviceUrlBackend = service_url_backend; // serviceUrlBackend..
    this.currentSync.serviceUrl = tempSync.ServiceUrl; // serviceUrlSync..
    this.currentSync.serviceLogin = tempSync.ServiceLogin;
    this.currentSync.servicePassword = '';
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

    var passwordEl = document.getElementById('edit_sync_service_password');
    (<HTMLInputElement>passwordEl).value = null;
    var eyeEl = document.getElementById('toggleEditSyncPassword');
    eyeEl.setAttribute('class', 'far fa-eye');
    eyeEl.style.setProperty('display', 'none');

    $("#editSyncModal").modal('toggle');
  }

  public onEditSubmit(id: number) {
    let valid = true;
    let inputs = document.querySelectorAll('#editSyncForm input.form-control');
    inputs.forEach((input) => {
      this.validate(input, regexPatterns[input.id]);
      if (input.className == "form-control invalid") {
        valid = false;
        return;
      }
    });
    if (valid) {
      $('.modal').modal('hide');
      let serviceUrl = (<HTMLInputElement>document.getElementById("edit_service_url_backend")).value;
      let synch = {
        "Label":  (<HTMLInputElement>document.getElementById("edit_label")).value,
        "ServiceUrl": (<HTMLInputElement>document.getElementById("edit_service_url_sync")).value,
        "ServiceLogin": (<HTMLInputElement>document.getElementById("edit_sync_service_login")).value,
        "ServicePassword": (<HTMLInputElement>document.getElementById("edit_sync_service_password")).value,
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


  
  
  parseJsonDate = (jsonDate)  => {
    try {
      let parts:any = /\/Date\((-?\d+)([+-]\d{2})?(\d{2})?.*/.exec(jsonDate);
      let output = new Date(+parts[1]).toISOString().slice(0, -1);
      return output;
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

  public toggleAddPasswordVisibility() {
    const togglePassword = document.querySelector('#toggleAddSyncPassword');
    const passwordInput = document.querySelector('#add_sync_service_password');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    // toggle the eye slash icon
    const eye = passwordInput.getAttribute('type') === 'password' ? 'far fa-eye' : 'far fa-eye-slash';
    togglePassword.setAttribute('class', eye);
  }

  public toggleEditPasswordVisibility() {
    const togglePassword = document.querySelector('#toggleEditSyncPassword');
    const passwordInput = document.querySelector('#edit_sync_service_password');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    // toggle the eye slash icon
    const eye = passwordInput.getAttribute('type') === 'password' ? 'far fa-eye' : 'far fa-eye-slash';
    togglePassword.setAttribute('class', eye);
  }

  refreshPage() {
    this.getSynchronizers();
    this.router.navigate(['edit-synchronizers'], { skipLocationChange: true });
  }
}
