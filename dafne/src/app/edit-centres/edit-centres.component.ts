import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { MessageService } from 'src/app/services/message.service';
import { Centre } from 'src/app/models/models';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule, Validators, FormGroup, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppComponent } from 'src/app/app.component';

const regexPatterns: {[key:string]: string} = {
  "add-name": "^.{1,60}$",
  "add-latitude": "^[+-]?(([0]*90([.][0]*)?)|(([0]*[0-8]?[0-9])([.][0-9]*)?))$", // from -90.0 to +90.0
  "add-longitude": "^[+-]?(([0]*180([.][0]*)?)|([0]*[0-9]?[0-9])([.][0-9]*)?|(([0]*[0-1]?[0-7]?[0-9])([.][0-9]*)?))$", // from -180.0 to +180.0
  "add-color": "^#(?:[0-9a-fA-F]{6})$",

  "edit-name": "^.{1,60}$",
  "edit-latitude": "^[+-]?(([0]*90([.][0]*)?)|(([0]*[0-8]?[0-9])([.][0-9]*)?))$",
  "edit-longitude": "^[+-]?(([0]*180([.][0]*)?)|([0]*[0-9]?[0-9])([.][0-9]*)?|(([0]*[0-1]?[0-7]?[0-9])([.][0-9]*)?))$",
  "edit-color": "^#(?:[0-9a-fA-F]{6})$"
};
const updateValidationAction: any = 'change';

@Component({
  selector: 'app-edit-centres',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './edit-centres.component.html',
  styleUrl: './edit-centres.component.scss'
})
export class EditCentresComponent implements OnInit {
  addCentreForm: FormGroup = new FormGroup({
    addCentreName: new FormControl(null, {
      validators: [
        Validators.required,
        Validators.pattern(regexPatterns['add-name'])
      ],
      updateOn: updateValidationAction
    }),
    addCentreLatitude: new FormControl(null, {
      validators: [
        Validators.required,
        Validators.pattern(regexPatterns['add-latitude'])
      ],
      updateOn: updateValidationAction
    }),
    addCentreLongitude: new FormControl(null, {
      validators: [
        Validators.required,
        Validators.pattern(regexPatterns['add-longitude'])
      ],
      updateOn: updateValidationAction
    }),
    addCentreColor: new FormControl('#000000', {
      validators: [
        Validators.required,
        Validators.pattern(regexPatterns['add-color'])
      ],
      updateOn: updateValidationAction
    }),
    addCentreLocal: new FormControl(false, {
      updateOn: updateValidationAction
    }),
    addCentreDescription: new FormControl(null, {
      updateOn: updateValidationAction
    })
  });

  editCentreForm: FormGroup = new FormGroup({
    editCentreName: new FormControl(null, {
      validators: [
        Validators.required,
        Validators.pattern(regexPatterns['edit-name'])
      ],
      updateOn: updateValidationAction
    }),
    editCentreLatitude: new FormControl(null, {
      validators: [
        Validators.required,
        Validators.pattern(regexPatterns['edit-latitude'])
      ],
      updateOn: updateValidationAction
    }),
    editCentreLongitude: new FormControl(null, {
      validators: [
        Validators.required,
        Validators.pattern(regexPatterns['edit-longitude'])
      ],
      updateOn: updateValidationAction
    }),
    editCentreColor: new FormControl(null, {
      validators: [
        Validators.required,
        Validators.pattern(regexPatterns['edit-color'])
      ],
      updateOn: updateValidationAction
    }),
    editCentreLocal: new FormControl(false, {
      updateOn: updateValidationAction
    }),
    editCentreDescription: new FormControl(null, {
      updateOn: updateValidationAction
    })
  });

  public centreList: any;
  public tempCentreIdToEdit: number = -1;
  private tempCentreIdToDelete = -1;
  public tempCentreNameToDelete = '';
  public tempCentreColorToDelete = '';

  constructor(
    private authenticationService: AuthenticationService,
    private messageService: MessageService,
    private router: Router,
    private appComponent: AppComponent
  ) {

  }
  ngOnInit(): void {
    this.messageService.showSpinner(true);
    this.messageService.hideSidebar(true);
    this.getCentresData(false);

    let addColorSelector = <HTMLInputElement>document.querySelector('#add-color-selector');
    if (addColorSelector) {
      addColorSelector.addEventListener('change', (e: any) => {
        this.passColorToParent(addColorSelector);
      });
    }
    let editColorSelector = <HTMLInputElement>document.querySelector('#edit-color-selector');
    if (editColorSelector) {
      editColorSelector.addEventListener('change', (e: any) => {
        this.passColorToParent(editColorSelector);
      });
    }
  }

  isAdmin() {
    return this.authenticationService.currentUser.isAdmin;
  }
  
  getCentresData(reload: boolean) {
    this.authenticationService.getAllCentres().subscribe({
      next: (res) => {
        this.centreList = res;
        if (this.centreList.filter((x: Centre) => x.local === true)[0]) {
          this.messageService.setLocalPresent(true);
        } else {
          this.messageService.setLocalPresent(false);
        }
      },
      error: (error) => {
        console.error(error);
        console.error(error.status);
      },
      complete: () => {
        if (reload) {
          this.router.navigate(['/gui', { outlets: { centralBodyRouter: ['edit-centres']}}], { skipLocationChange: true });
        }
      }
    });
  }

  onAddColorChanged(event: any) {
    this.addCentreForm.patchValue({
      addCentreColor: event.target.value
    });
  }
  onAddColorTextChanged(event: any) {
    let addColorSelector = <HTMLInputElement>document.querySelector('#add-color-selector');
    if (addColorSelector) {
      addColorSelector.value = event.target.value;
      this.passColorToParent(addColorSelector);
    }
  }

  addNewCentre() {
    this.appComponent.checkAdminCount();
    // assign random color and defaults to remote centre:
    document.querySelector("#addCentreModal")!.classList.remove('hidden');
    this.addCentreForm.reset();
    this.addCentreForm.patchValue({
      addCentreColor: this.getRandomColor()
    });
    // assign centre color to the color input selector:
    let colorPicker = <HTMLInputElement>document.querySelector('#add-color-selector');
    colorPicker.value = <string>this.addCentreForm.value.addCentreColor;
    let addColorSelector = <HTMLInputElement>document.querySelector('#add-color-selector');
    if (addColorSelector) {
        this.passColorToParent(addColorSelector);
    }
  }

  onAddSubmit() {
    if (this.addCentreForm.invalid) {
      let controls = this.addCentreForm.controls;
      for (const [key, value] of Object.entries(controls)) {
        this.addCentreForm.controls[key].markAsTouched();
      }
      return;
    }
    let body = {
      name: this.addCentreForm.value.addCentreName,
      latitude: this.addCentreForm.value.addCentreLatitude,
      longitude: this.addCentreForm.value.addCentreLongitude,
      color: this.addCentreForm.value.addCentreColor,
      local: this.addCentreForm.value.addCentreLocal ? true : null,
      description: this.addCentreForm.value.addCentreDescription,
      icon: this.addCentreForm.value.addCentreLocal ? 'home' : 'place'
    }
    this.authenticationService.addNewCentre(body).subscribe({
      complete: () => {
        this.onClosePressed();
        setTimeout(() => {
          this.addCentreForm.reset();
          this.refreshPage();
        }, 250);
      },
      error: (error) => {
        console.error(error);
        console.error(error.status);
      }
    });
  }

  onEditColorChanged(event: any) {
    this.editCentreForm.patchValue({
      editCentreColor: event.target.value
    });
  }
  onEditColorTextChanged(event: any) {
    let editColorSelector = <HTMLInputElement>document.querySelector('#edit-color-selector');
    if (editColorSelector) {
      editColorSelector.value = event.target.value;
      this.passColorToParent(editColorSelector);
    }
  }

  editCentre(id: number) {
    this.appComponent.checkAdminCount();
    // assign random color and defaults to remote centre:
    document.querySelector("#editCentreModal")!.classList.remove('hidden');
    let centreToEdit: Centre = this.centreList.filter((a: Centre) => a.id === id)[0];
    if (centreToEdit) {
      this.tempCentreIdToEdit = id;
      this.editCentreForm.patchValue({
        editCentreName: centreToEdit.name,
        editCentreLatitude: centreToEdit.latitude,
        editCentreLongitude: centreToEdit.longitude,
        editCentreColor: centreToEdit.color,
        editCentreLocal: centreToEdit.local == null ? false : true,
        editCentreDescription: centreToEdit.description
      });
      // assign centre color to the color input selector:
      let colorPicker = <HTMLInputElement>document.querySelector('#edit-color-selector');
      colorPicker.value = <string>this.editCentreForm.value.editCentreColor;
      let editColorSelector = <HTMLInputElement>document.querySelector('#edit-color-selector');
      if (editColorSelector) {
          this.passColorToParent(editColorSelector);
      }
    } else {
      this.tempCentreIdToEdit = -1;
      console.error("Error: id: "+id+" doesn't exist.");
      return;
    }
  }

  onEditSubmit(id: number) {
    if (this.editCentreForm.invalid) {
      let controls = this.editCentreForm.controls;
      for (const [key, value] of Object.entries(controls)) {
        this.editCentreForm.controls[key].markAsTouched();
      }
      return;
    }
    let body = {
      name: this.editCentreForm.value.editCentreName,
      latitude: this.editCentreForm.value.editCentreLatitude,
      longitude: this.editCentreForm.value.editCentreLongitude,
      color: this.editCentreForm.value.editCentreColor,
      local: this.editCentreForm.value.editCentreLocal ? true : null,
      description: this.editCentreForm.value.editCentreDescription,
      icon: this.editCentreForm.value.editCentreLocal ? 'home' : 'place'
    }
    this.authenticationService.updateCentre(id, body).subscribe({
      complete: () => {
        this.onClosePressed();
        this.messageService.refreshLocalCentre();
        setTimeout(() => {
          this.editCentreForm.reset();
          this.refreshPage();
        }, 250);
      },
      error: (error) => {
        console.error(error);
        console.error(error.status);
      }
    });
  }

  deleteCentre(id: number) {
    this.appComponent.checkAdminCount();
    this.tempCentreIdToDelete = id;
    this.tempCentreNameToDelete = this.centreList.filter((a: Centre) => a.id == id)[0].name;
    this.tempCentreColorToDelete = this.centreList.filter((a: Centre) => a.id == id)[0].color;
    document.querySelector("#deleteCentreModal")!.classList.remove('hidden');
  }

  deleteCentreConfirmed() {
    this.authenticationService.deleteCentre(this.tempCentreIdToDelete).subscribe({
      complete: () => {
        this.tempCentreIdToDelete = -1;
        this.onClosePressed();
        this.refreshPage();
      },
      error: (error) => {
        console.error(error);
        console.error(error.status);
      }
    }
    )
  }
  
  onClosePressed() {
    this.tempCentreIdToDelete = -1;
    let modals = document.querySelectorAll('.modal');
    [].forEach.call(modals, (modal: HTMLElement) => {
      modal.classList.add('hidden');
    })
  }

  /* Assign a random color to a new centre */
  getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color: string = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  passColorToParent(element: HTMLInputElement) {
    element.parentElement!.style.backgroundColor = element.value;
  }

  refreshPage() {
    this.getCentresData(true);
  }
}
