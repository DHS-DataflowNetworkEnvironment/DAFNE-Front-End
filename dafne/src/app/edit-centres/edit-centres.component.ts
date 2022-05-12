import { Component, OnInit, OnDestroy } from '@angular/core';
import { Centre } from '../models/centre';
import { AuthenticationService } from '../services/authentication.service';
import { Router, NavigationEnd } from '@angular/router';
import { AlertComponent } from '../alert/alert.component';
import { MessageService } from '../services/message.service';

declare var $: any;

const regexPatterns = {
  add_name: "^.{1,60}$",
  add_description: "",
  add_latitude: "^[+-]?(([0]*90([.][0]*)?)|(([0]*[0-8]?[0-9])([.][0-9]*)?))$", // from -90.0 to +90.0
  add_longitude: "^[+-]?(([0]*180([.][0]*)?)|(([0]*[0-1]?[0-7]?[0-9])([.][0-9]*)?))$", // from -180.0 to +180.0
  add_color: "^#(?:[0-9a-f]{6})$",

  edit_name: "^.{1,60}$",
  edit_description: "",
  edit_latitude: "^[+-]?(([0]*90([.][0]*)?)|(([0]*[0-8]?[0-9])([.][0-9]*)?))$",
  edit_longitude: "^[+-]?(([0]*180([.][0]*)?)|(([0]*[0-1]?[0-7]?[0-9])([.][0-9]*)?))$",
  edit_color: "^#(?:[0-9a-f]{6})$"
};

@Component({
  selector: 'app-edit-centres',
  templateUrl: './edit-centres.component.html',
  styleUrls: ['./edit-centres.component.css']
})
export class EditCentresComponent implements OnInit, OnDestroy {
  private autorefreshSubscription;
  private navigationSubscription;
  private pageRefreshed: boolean = true;
  public centreList:any;
  public editCentreId: number = 0;
  public tempCentre: Centre = new Centre();
  public tempCentreIdToDelete = -1;
  public tempCentreNameToDelete = '';
  public tempCentreColorToDelete = '';

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
      this.getCentresData();
    });
  }

  ngOnInit(): void {
    this.messageService.showSpinner(true);
    this.getCentresData();

    let inputs = document.querySelectorAll('input.form-control');
    inputs.forEach((input) => {
      input.addEventListener('input', (e:any) => {        
        this.validate(e.target, regexPatterns[e.target.attributes.id.value]);
      });
    });
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

  getCentresData():any {
    this.authenticationService.getAllCentres().subscribe(
      (res: object) => {
        this.centreList = res;
        this.pageRefreshed = false;
      }
    );
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

  public addNewCentre() {
    this.tempCentre.name = '';
    this.tempCentre.latitude = '';
    this.tempCentre.longitude = '';
    this.tempCentre.color = this.getRandomColor();
    this.tempCentre.local = false;
    this.tempCentre.description = '';
    let inputs = document.querySelectorAll('#addCentreForm input.form-control');
    inputs.forEach((input) => {
      if ((<HTMLInputElement>input).id == "add_name") (<HTMLInputElement>input).value = this.tempCentre.name;
      if ((<HTMLInputElement>input).id == "add_latitude") (<HTMLInputElement>input).value = this.tempCentre.latitude;
      if ((<HTMLInputElement>input).id == "add_longitude") (<HTMLInputElement>input).value = this.tempCentre.longitude;
      if ((<HTMLInputElement>input).id == "add_local") (<HTMLInputElement>input).checked = this.tempCentre.local;
      if ((<HTMLInputElement>input).id == "add_description") (<HTMLInputElement>input).value = this.tempCentre.description;
    });
    let cleanInputs = document.querySelectorAll('#addCentreForm input.form-control');
    cleanInputs.forEach((input) => {
      if (input.className == "form-control invalid") {
        input.className = "form-control";
      }
    });
    $("#addCentreModal").modal('toggle');
  }

  public onAddSubmit() {
    let valid = true;
    let inputs = document.querySelectorAll('#addCentreForm input.form-control');
    inputs.forEach((input) => {
      this.validate(input, regexPatterns[input.id]);
      if (input.className == "form-control invalid") {
        valid = false;
        return;
      }
    });
    if (valid) {
      $('.modal').modal('hide');
      let body = {
        name: (<HTMLInputElement>document.getElementById("add_name")).value,
        latitude: (<HTMLInputElement>document.getElementById('add_latitude')).value,
        longitude: (<HTMLInputElement>document.getElementById('add_longitude')).value,
        color: (<HTMLInputElement>document.getElementById('add_color')).value,
        local: (<HTMLInputElement>document.getElementById('add_local')).checked ? true : null,
        description: (<HTMLInputElement>document.getElementById('add_description')).value,
        icon: (<HTMLInputElement>document.getElementById('add_local')).checked ? 'home' : 'place'
      };
      this.authenticationService.addNewCentre(body).subscribe(
        (res: string) => {
          this.refreshPage();
        }
      );
    }
  }

  public deleteCentre(id: number) {
    this.tempCentreIdToDelete = id;
    this.tempCentreNameToDelete = this.centreList.filter(a => a.id == id)[0].name;
    this.tempCentreColorToDelete = this.centreList.filter(a => a.id == id)[0].color;
    console.log("temp: " + this.tempCentreIdToDelete);
    $("#deleteCentreModal").modal('toggle');
  }

  public deleteCentreConfirmed() {
    this.authenticationService.deleteCentre(this.tempCentreIdToDelete).subscribe(
      (res: string) => {
        this.tempCentreIdToDelete = -1;
        this.refreshPage();
      }
    )
  }

  public deleteCentreCanceled() {
    this.tempCentreIdToDelete = -1;
  }

  public editCentre(id: number) {
    let cleanInputs = document.querySelectorAll('#editCentreForm input.form-control');
    cleanInputs.forEach((input) => {
      if (input.className == "form-control invalid") {
        input.className = "form-control";
      }
    });
    this.tempCentre = new Centre();
    this.tempCentre.id = this.centreList.filter(a => a.id === id)[0].id;
    this.tempCentre.name = this.centreList.filter(a => a.id === id)[0].name;
    this.tempCentre.description = this.centreList.filter(a => a.id === id)[0].description;
    this.tempCentre.latitude = this.centreList.filter(a => a.id === id)[0].latitude;
    this.tempCentre.longitude = this.centreList.filter(a => a.id === id)[0].longitude;
    this.tempCentre.color = this.centreList.filter(a => a.id === id)[0].color;
    this.tempCentre.local = this.centreList.filter(a => a.id === id)[0].local == null ? false : true;
    $("#editCentreModal").modal('toggle');
  }

  public onEditSubmit(id: number) {
    let valid = true;
    let inputs = document.querySelectorAll('#editCentreForm input.form-control');
    
    inputs.forEach((input) => {
      this.validate(input, regexPatterns[input.id]);
      if (input.className == "form-control invalid") {
        valid = false;
        return;
      }
    });
    if (valid) {
      $('.modal').modal('hide');
      let body = {
        name: (<HTMLInputElement>document.getElementById("edit_name")).value,
        latitude: (<HTMLInputElement>document.getElementById('edit_latitude')).value,
        longitude: (<HTMLInputElement>document.getElementById('edit_longitude')).value,
        color: (<HTMLInputElement>document.getElementById('edit_color')).value,
        local: (<HTMLInputElement>document.getElementById('edit_local')).checked ? true : null,
        description: (<HTMLInputElement>document.getElementById('edit_description')).value,
        icon: (<HTMLInputElement>document.getElementById('edit_local')).checked ? 'home' : 'place'
      };
      this.authenticationService.updateCentre(id, body).subscribe(
        (res: string) => {
          this.refreshPage();
        }
      )
    }
  }

  /* Assign a random color to a new centre */
  public getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color: string = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  refreshPage() {
    this.authenticationService.getAllCentres().subscribe(
      (res: object) => {
        this.centreList = res;
        if (Object.values(res).filter((x) => x.local === true)[0]) {
          this.messageService.setLocalPresent(true);
        } else {
          this.messageService.setLocalPresent(false);
        }
        this.router.navigate(['edit-centres'], { skipLocationChange: true });
      }
    );
  }
}

