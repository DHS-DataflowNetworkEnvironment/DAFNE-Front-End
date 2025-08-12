import { Component, OnInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, Validators, FormGroup, FormControl } from '@angular/forms';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { MessageService } from 'src/app/services/message.service';
import { AlertComponent } from 'src/app/alert/alert.component';
import { Availability, Centre } from 'src/app/models/models';
import { CsvDataService } from 'src/app/services/csv-data.service';
import { ConfigService } from 'src/app/services/config.service';
import p5 from 'p5';

const updateValidationAction: any = 'change';

@Component({
  selector: 'app-service-availability',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './service-availability.component.html',
  styleUrl: './service-availability.component.scss'
})
export class ServiceAvailabilityComponent implements OnInit {
  filterForm: FormGroup = new FormGroup({
    filterWeekly: new FormControl(false, {
      validators: [
        Validators.required
      ],
      updateOn: updateValidationAction
    }),
    filterStartDate: new FormControl(null, {
      validators: [
        Validators.required
      ],
      updateOn: updateValidationAction
    }),
    filterStopDate: new FormControl(null, {
      validators: [
        Validators.required
      ],
      updateOn: updateValidationAction
    })
  })
  private p5Chart: any;

  private startDateInput: any;
  private stopDateInput: any;
  
  public localCentre: Centre = {
    id: -1,
    name: "",
    latitude: '',
    longitude: '',
    local: false,
    color: "#ffffff",
    icon: '',
    description: ''
  };

  private availabilityDaysNumber: number = 0;
  private availabilityWeeksNumber: number = 0;
  private requestedDaysNumber: number = 0;
  private requestedWeeksNumber: number = 0;
  private requestedMonthNumber: number = 0;
  private maxWeeksPerMonth: number = 5;
  private requestedStartMonth: number = 0;
  private requestedStopMonth: number = 0;
  private millisPerDay: number = 86400000;
  private millisPerWeek:number = this.millisPerDay * 7;
  private maxDays: number = 30;  // set 30 for 31 days of availability.
  private millisPerMaxPeriod = this.millisPerDay * this.maxDays;
  private maxDaysWindow: number = 0;  // this should be retrieved from BE. set 89 for 90 days.
  private millisPerMaxWindow: number = 0;
  private today = new Date();
  private todayDate: string = this.today.toISOString().slice(0, 10);
  private initialStartDayMillis = Date.parse(this.todayDate) - this.millisPerMaxPeriod;
  private startDateTemp = new Date(this.initialStartDayMillis);
  public startDate: string = this.startDateTemp.toISOString().slice(0, 10);
  public stopDate: string = this.todayDate;

  public selectorText = [
    "Bar Chart",
    "Calendar Chart"
  ];
  public chartType: string = this.selectorText[0];
  private doResetZoom: boolean = false;

  private serviceAvailabilityList: Array<Availability> = [];
  public requestedServiceAvailabilityList: Array<Availability> = [];
  private completeWeeklyCalendarServiceAvailabilityList: Array<Availability> = [];
  public averageServiceAvailability: number = -1;
  private weekPerMonth: number[] = [];

  private dayOfWeek = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  private monthOfYear = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  private weekdayShift: number = 0;
  private weekdayStopShift: number = 0;
  private rowNumber = 5;
  private monthWeekShift: number = 0;

  private mouseIsOnList: Array<boolean> = [];
  public availabilityColors: any;
  public averageColor: string = "";

  private precWeekly_requestedServiceAvailabilityList: Array<Availability> = [];
  private precWeekly_startDate: string = '';
  private precWeekly_stopDate: string = '';
  private precWeekly_requestedWeeksNumber: number = 0;
  private precWeekly_averageServiceAvailability: number = 0;
  private precDaily_requestedServiceAvailabilityList: Array<Availability> = [];
  private precDaily_startDate: string = '';
  private precDaily_stopDate: string = '';
  private precDaily_requestedDaysNumber: number = 0;
  private precDaily_averageServiceAvailability: number = 0;

  public isWeekly: boolean = false;
  private askForWeekly: boolean = false;
  public firstDailySubmitted: boolean = false;
  public firstWeeklySubmitted: boolean = false;

  private tempNextMonthFirstDay: number = 0;
  private tempDiffDaysToSecondMonth: number = 0;

  private heightThreshold: number = 860;
  private heightLegendThreshold: number = 670;

  constructor(
    private authenticationService: AuthenticationService,
    private messageService: MessageService,
    private alert: AlertComponent,
    private el: ElementRef,
    private csvService: CsvDataService,
    public configService: ConfigService
  ) {
    this.availabilityColors = this.configService.getConfig().availabilityColors;
  }

  ngOnInit(): void {
    this.messageService.hideSidebar(true);
    window.addEventListener("resize", () => {
      this.checkWindowHeight();
    });

    this.filterForm.patchValue({
      filterStartDate: this.startDate,
      filterStopDate: this.stopDate
    });

    this.averageColor = this.configService.getConfig().averageAvailabilityColor;
    this.startDateInput = document.querySelector('#start-date');
    this.stopDateInput = document.querySelector('#stop-date');

    this.authenticationService.getAllCentres().subscribe({
      next: (res) => {
        /* Get Local Centre */
        this.localCentre = res.filter((x: Centre) => x.local == true)[0];
        if (this.localCentre && this.localCentre.local) {
          this.authenticationService.getAvailabilityRollingPeriod().subscribe({
            next: (res) => {
              this.maxDaysWindow = res - 1;
              this.millisPerMaxWindow = this.millisPerDay * this.maxDaysWindow;
              let tempMinDate = new Date(Date.parse(this.todayDate) - this.millisPerMaxWindow).toISOString().slice(0, 10);

              this.setMinDate(this.startDateInput, tempMinDate);
              this.setMaxDate(this.startDateInput, this.todayDate);

              this.setMinDate(this.stopDateInput, tempMinDate);
              this.setMaxDate(this.stopDateInput, this.todayDate);

              this.init_P5();
            }
          });
        } else {
          this.localCentre = {
            id: -1,
            name: "",
            latitude: '',
            longitude: '',
            local: false,
            color: "#ffffff",
            icon: '',
            description: ''
          };
          this.alert.showErrorAlert("No local Centre is set", "Please setup one Centre as local");
        }
      },
      error: (error) => {
        console.error(error);
        console.error(error.status);
      }
    });
  }

  checkWindowHeight() {
    if (window.innerHeight < this.heightThreshold) {
      this.onDataTableHide();
      if (window.innerHeight < this.heightLegendThreshold) {
        (<HTMLElement>document.querySelector('#legend-container')!).classList.add('hidden');
      } else {
        (<HTMLElement>document.querySelector('#legend-container')!).classList.remove('hidden');
      }
    } else {
      this.onDataTableShow();
    }
  }

  setMinDate(inputEl: HTMLInputElement, date: string) {
    inputEl.min = date;
  }
  setMaxDate(inputEl: HTMLInputElement, date: string) {
    inputEl.max = date;
  }

  onDataTableHide() {
    (<HTMLElement>document.querySelector('.data-table-main-container')!).classList.add('hidden');
    setTimeout(() => {
      (<HTMLElement>document.querySelector('.data-table-down-arrow-container')!).classList.add('hidden');
      (<HTMLElement>document.querySelector('.data-table-up-arrow-container')!).classList.remove('hidden');
    }, 250);
  }

  onDataTableShow() {
    (<HTMLElement>document.querySelector('.data-table-main-container')!).classList.remove('hidden');
    setTimeout(() => {
      (<HTMLElement>document.querySelector('.data-table-up-arrow-container')!).classList.add('hidden');
      (<HTMLElement>document.querySelector('.data-table-down-arrow-container')!).classList.remove('hidden');
    }, 250);
  }

  init_P5() {
    let canvas = document.getElementById("p5ServiceAvailabilityCanvas")!;
    let canvasSpace;
    let canvasWidth = canvas.clientWidth;
    let canvasHeight = canvas.clientHeight;

    this.p5Chart = new p5(p => {
      let blankXDim = 140;
      let blankYDim = 160;
      let xCenter = canvasWidth / 2;
      let yCenter = canvasHeight / 2;
      let chartXDim = canvasWidth - blankXDim;
      let chartYDim = canvasHeight - blankYDim;
      let chartXDim2 = chartXDim / 2;
      let chartYDim2 = chartYDim / 2;
      let nLines = 4;

      let dayXDim = canvasWidth / 10;
      let dayYDim = canvasHeight / (this.rowNumber+2);

      let backgroundColor = p.color('#12222f');
      let labelBackgroundColor = p.color('#12222fcc')
      let lineColor = p.color('#aaaaaa');
      let averageLineColor = p.color(this.averageColor);

      let valueFontSize = 20;
      let dateFontSize = 10;
      let textFontSize = 10;
      let percentageFontSize = 14;


      let barGapScale = 30.0;
      let sectionScaleSingle = 1.4;
      let maxValue = 100;

      let lineDashSequence = [10, 10];

      let sf = 1.0;
      let tx = 0;
      let ty = 0;

      let clickTimerId: any;

      p.setup = () => {
        canvasSpace = p.createCanvas(canvasWidth, canvasHeight).parent('p5ServiceAvailabilityCanvas');
        p.pixelDensity(1.0);
        p.smooth();
        p.frameRate(30);
        p.textFont('NotesESA-Reg');
        canvasSpace.mouseWheel((e: any) => wheelZoom(e));
        canvasSpace.doubleClicked(resetZoom);
      };

      p.draw = () => {
        p.background(backgroundColor);
        p.windowResized();
        p.translate(tx, ty);

        this.mouseIsOnList = Array(60).fill(false);
        if (this.chartType == this.selectorText[0]) {
          p.fillBarChart();
        } else if (this.chartType == this.selectorText[1]) {
          p.fillCalendarChart();
        }

        if (p.mouseIsPressed) {
          if (p.mouseButton === p.CENTER) {
            tx -= p.pmouseX - p.mouseX;
            ty -= p.pmouseY - p.mouseY;
          }
        }

        if (this.doResetZoom) {
          this.doResetZoom = false;
          resetZoom();
        }
      }

      p.doubleClicked = () => {
        if (clickTimerId) {
          clearTimeout(clickTimerId);
          clickTimerId = undefined;
        }
        resetZoom();
      }

      p.mouseClicked = () => {
        if (p.mouseX > xCenter - chartXDim2 + tx && p.mouseX < xCenter + chartXDim2 + tx
          && p.mouseY > yCenter - chartYDim2 + ty && p.mouseY < yCenter + chartYDim2 + ty) {
          if (!clickTimerId) {
            clickTimerId = setTimeout(() => {
              if (this.filterForm.value.filterWeekly == true) {
                for (var i = 0; i < this.requestedWeeksNumber; i++) {
                  if (this.mouseIsOnList[i] == true) {
                    this.startDate = this.requestedServiceAvailabilityList[i].date;
                    let tempStopDateToCalendar = Date.parse(this.requestedServiceAvailabilityList[i].date) + 6*this.millisPerDay;
                    if (tempStopDateToCalendar < Date.parse(this.stopDate)) {
                      this.stopDate = new Date(Date.parse(this.requestedServiceAvailabilityList[i].date) + 6*this.millisPerDay).toISOString().slice(0, 10);
                    }
                    this.filterForm.patchValue({
                      filterWeekly: false,
                      filterStartDate: this.startDate,
                      filterStopDate: this.stopDate
                    });
                    this.askForWeekly = false;
                    this.onFilterSubmit();
                  }
                }
              }
            }, 500)
          }
        }
      }

      p.setClickTimeoutId = (id: any) => {
        clickTimerId = id;
      }

      function applyScale(s: number) {
        sf = sf * s;
        if (sf < 0.65) {
          sf = 0.65;
        } else {
          tx = p.mouseX * (1-s) + tx * s;
          ty = p.mouseY * (1-s) + ty * s;
        }
      }

      function wheelZoom(e: any) {
        applyScale(e.deltaY < 0 ? 1.1 : 0.9);
        return false;
      }

      function resetZoom() {
        sf = 1.0;
        tx = 0;
        ty = 0;
      }

      p.resetZoom = () => {
        resetZoom();
      }

      p.windowResized = () => {
        canvasWidth = canvas.clientWidth;
        canvasHeight = canvas.clientHeight;
        p.resizeCanvas(canvasWidth, canvasHeight);
        canvasWidth = canvas.clientWidth * sf;
        canvasHeight = canvas.clientHeight * sf;
        if (canvasHeight < 240) canvasHeight = 240;
        xCenter = canvasWidth / 2;
        yCenter = canvasHeight / 2;
        chartXDim = (canvasWidth - blankXDim);
        chartYDim = (canvasHeight - blankYDim);
        chartXDim2 = chartXDim / 2;
        chartYDim2 = chartYDim / 2;
        dayXDim = canvasWidth / 10;
        dayYDim = canvasHeight / (this.rowNumber+2);
      };

      p.fillBarChart = () => {
        if (this.filterForm.value.filterWeekly == true) {
          /* Weekly */
          for (var i = 0; i < this.requestedWeeksNumber; i++) {
            let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.requestedWeeksNumber) + i * chartXDim / this.requestedWeeksNumber;
            let sectionXFilledDim = (chartXDim / this.requestedWeeksNumber) / sectionScaleSingle;
            let sectionXFilledDim2 = sectionXFilledDim / 2;
            let barGap = sectionXFilledDim / barGapScale;

            /* xAxis Text */
            p.textAlign(p.CENTER, p.CENTER);
            p.fill(lineColor);
            p.noStroke();
            p.textSize(dateFontSize);

            /* Rotate Dates */
            let tempText;
            let preText = "Week ("+ this.getWeekNumber(this.requestedServiceAvailabilityList[i].date) +")\n";
            let weekStartText = "from: " + this.requestedServiceAvailabilityList[i].date + "\nto: ";
            if (this.requestedServiceAvailabilityList[i].date < this.startDate) {
              preText = "Partial Week ("+ this.getWeekNumber(this.requestedServiceAvailabilityList[i].date) +")\n";
              weekStartText = "from: " + this.startDate + "\nto: ";
            }
            let weekEndText = this.getWeekEndDateText(this.requestedServiceAvailabilityList[i].date);
            if (weekEndText > this.stopDate) {
              preText = "Partial Week ("+ this.getWeekNumber(this.requestedServiceAvailabilityList[i].date) +")\n";
              weekEndText = this.stopDate;
            }
            tempText = preText + weekStartText + weekEndText;
            let tempRadium = (sectionXFilledDim - (2 * barGap) - dateFontSize);
            let angle = 0;
            if (tempRadium > p.textWidth(weekEndText)) tempRadium = p.textWidth(weekEndText);
            if (tempRadium > 0) angle = p.acos(tempRadium / p.textWidth(weekEndText));
            else angle = p.PI/2;
            let sinOfAngleTemp = p.sin(angle);
            if (sinOfAngleTemp < 0.001) {
              sinOfAngleTemp = 0.001;
            }
            let sinOfAngle = sinOfAngleTemp * (p.textWidth(weekEndText) / 2);
            p.push();
            p.translate(sectionXCenter, yCenter + chartYDim2 + sinOfAngle + 3 * dateFontSize);
            if (angle > p.PI / 2) angle = p.PI / 2;
            if (angle < 0) angle = 0;
            p.rotate(-angle);
            tempText = tempText + "\n";
            p.text(tempText, 0, 0);
            p.pop();

            p.noFill();
            p.stroke(lineColor);
            p.line(xCenter - chartXDim2 + (i + 1) * chartXDim / this.requestedWeeksNumber, yCenter + chartYDim2 + 5, xCenter - chartXDim2 + (i + 1) * chartXDim / this.requestedWeeksNumber, yCenter + chartYDim2);

            /* Bars */
            p.rectMode(p.CORNER);
            if (this.requestedServiceAvailabilityList[i].percentage == 0) {
              p.stroke(this.getAvailabilityIntsColorFromPerc(this.requestedServiceAvailabilityList[i].percentage));
              p.line(sectionXCenter - sectionXFilledDim2, yCenter + chartYDim2, sectionXCenter + sectionXFilledDim2, yCenter + chartYDim2);
            } else if (this.requestedServiceAvailabilityList[i].percentage > 0) {
              p.fill(this.getAvailabilityIntsColorFromPerc(this.requestedServiceAvailabilityList[i].percentage));
              p.noStroke();
              p.rect(sectionXCenter - sectionXFilledDim2, yCenter + chartYDim2, sectionXFilledDim, -((this.requestedServiceAvailabilityList[i].percentage < 0 ? 0 : this.requestedServiceAvailabilityList[i].percentage) * chartYDim / maxValue));
            }

            /* If mouse is on bar */
            if (p.mouseX > sectionXCenter - (chartXDim / this.requestedWeeksNumber)/2 + tx && p.mouseX < sectionXCenter + (chartXDim / this.requestedWeeksNumber)/2 + tx
                && p.mouseY > yCenter - chartYDim2 + ty && p.mouseY < yCenter + chartYDim2 + sinOfAngle + 4 * dateFontSize + ty) {

              /* Selector box */
              p.stroke(230);
              p.fill(255, 30);
              p.rect(sectionXCenter - sectionXFilledDim2, yCenter - chartYDim2, sectionXFilledDim, chartYDim + 2 * sinOfAngle + 4 * dateFontSize);
              this.mouseIsOnList[i] = true;

              /* Tooltip */
              p.textSize(percentageFontSize);
              p.noStroke();
              p.fill(lineColor);
              p.text((this.requestedServiceAvailabilityList[i].percentage == null || this.requestedServiceAvailabilityList[i].percentage < 0) ? "NaN" : this.requestedServiceAvailabilityList[i].percentage == 100 ? "100.00%": this.requestedServiceAvailabilityList[i].percentage.toFixed(2) +"%",
                      sectionXCenter, yCenter - chartYDim2 - 2 * dateFontSize);
            }
          }
          /* Scheme */
          p.rectMode(p.CENTER);
          p.textAlign(p.RIGHT, p.CENTER);
          p.noFill();
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter - chartXDim2, yCenter - chartYDim2);
          p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter + chartXDim2, yCenter + chartYDim2);
          /* Average Line */
          if (this.averageServiceAvailability >= 0) {
            p.stroke(averageLineColor);
            p.drawingContext.setLineDash(lineDashSequence);
            p.line(xCenter - chartXDim2, yCenter + chartYDim2 - this.averageServiceAvailability * chartYDim / maxValue, xCenter + chartXDim2, yCenter + chartYDim2 - this.averageServiceAvailability * chartYDim / maxValue);
            p.drawingContext.setLineDash([]);
            p.textSize(textFontSize);
            p.textAlign(p.RIGHT, p.CENTER);
          }
            /* Zero text */
          p.fill(lineColor);
          p.noStroke();
          p.text("0%", xCenter - chartXDim2 - 10, yCenter + chartYDim2);
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2, xCenter - chartXDim2, yCenter + chartYDim2);
          p.line(xCenter - chartXDim2, yCenter + chartYDim2 + 5, xCenter - chartXDim2, yCenter + chartYDim2);
          /* yAxis text */
          for (var i = 0; i < nLines; i++) {
            p.fill(lineColor);
            p.noStroke();
            p.text(p.int(maxValue / (nLines / (i + 1))) + "%", xCenter - chartXDim2 - 15, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines + 1);
            p.stroke(lineColor);
            p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines, xCenter - chartXDim2, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines)
          }
          /* Draw threshold lines */
          for (var i = 1; i < this.availabilityColors.length; i++) {
            p.stroke(this.getAvailabilityIntsColorFromPerc(this.availabilityColors[i].threshold));
            p.line(xCenter - chartXDim2, yCenter + chartYDim2 - (this.availabilityColors[i].threshold * chartYDim / 100), xCenter + chartXDim2, yCenter + chartYDim2 - (this.availabilityColors[i].threshold * chartYDim / 100));
          }
        } else {
          /* Daily */
          for (var i = 0; i < this.requestedDaysNumber; i++) {
            let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.requestedDaysNumber) + i * chartXDim / this.requestedDaysNumber;
            let sectionXFilledDim = (chartXDim / this.requestedDaysNumber) / sectionScaleSingle;
            let sectionXFilledDim2 = sectionXFilledDim / 2;
            let barGap = sectionXFilledDim / barGapScale;

            /* xAxis Text */
            p.textAlign(p.CENTER, p.CENTER);
            p.fill(lineColor);
            p.noStroke();
            p.textSize(dateFontSize);

            /* Rotate Dates */
            let tempText
            tempText = this.requestedServiceAvailabilityList[i].date;
            let tempRadium = (sectionXFilledDim - (2 * barGap) - dateFontSize);
            let angle = 0;
            if (tempRadium > p.textWidth(tempText)) tempRadium = p.textWidth(tempText);
            if (tempRadium > 0) angle = p.acos(tempRadium / p.textWidth(tempText));
            else angle = p.PI/2;
            let sinOfAngleTemp = p.sin(angle);
            if (sinOfAngleTemp < 0.001) {
              sinOfAngleTemp = 0.001;
            }
            let sinOfAngle = sinOfAngleTemp * (p.textWidth(tempText) / 2);
            p.push();
            p.translate(sectionXCenter, yCenter + chartYDim2 + sinOfAngle + 2 * dateFontSize);
            if (angle > p.PI / 2) angle = p.PI / 2;
            if (angle < 0) angle = 0;
            p.rotate(-angle);
            p.text(tempText, 0, 0);
            p.pop();
            p.noFill();
            p.stroke(lineColor);
            p.line(xCenter - chartXDim2 + (i + 1) * chartXDim / this.requestedDaysNumber, yCenter + chartYDim2 + 5, xCenter - chartXDim2 + (i + 1) * chartXDim / this.requestedDaysNumber, yCenter + chartYDim2);

            /* Bars */
            p.rectMode(p.CORNER);
            if (this.requestedServiceAvailabilityList[i].percentage == 0) {
              p.stroke(this.getAvailabilityIntsColorFromPerc(this.requestedServiceAvailabilityList[i].percentage));
              p.line(sectionXCenter - sectionXFilledDim2, yCenter + chartYDim2, sectionXCenter + sectionXFilledDim2, yCenter + chartYDim2);
            } else if (this.requestedServiceAvailabilityList[i].percentage > 0) {
              p.fill(this.getAvailabilityIntsColorFromPerc(this.requestedServiceAvailabilityList[i].percentage));
              p.noStroke();
              p.rect(sectionXCenter - sectionXFilledDim2, yCenter + chartYDim2, sectionXFilledDim, -((this.requestedServiceAvailabilityList[i].percentage < 0 ? 0 : this.requestedServiceAvailabilityList[i].percentage) * chartYDim / maxValue));
            }

            /* If mouse is on bar */
            if (p.mouseX > sectionXCenter - (chartXDim / this.requestedDaysNumber)/2 + tx && p.mouseX < sectionXCenter + (chartXDim / this.requestedDaysNumber)/2 + tx
                && p.mouseY > yCenter - chartYDim2 + ty && p.mouseY < yCenter + chartYDim2 + sinOfAngle + 4 * dateFontSize + ty) {

              /* Selector box */
              p.stroke(230);
              p.fill(255, 30);
              p.rect(sectionXCenter - sectionXFilledDim2, yCenter - chartYDim2, sectionXFilledDim, chartYDim + 2 * sinOfAngle + 3 * dateFontSize);
              this.mouseIsOnList[i] = true;

              /* Tooltip */
              p.textSize(percentageFontSize);
              p.noStroke();
              p.fill(lineColor);
              p.text((this.requestedServiceAvailabilityList[i].percentage == null || this.requestedServiceAvailabilityList[i].percentage < 0) ? "NaN" : this.requestedServiceAvailabilityList[i].percentage == 100 ? "100.00%": this.requestedServiceAvailabilityList[i].percentage.toFixed(2) +"%",
                      sectionXCenter, yCenter - chartYDim2 - 2 * dateFontSize);
            }
          }
          /* Scheme */
          p.rectMode(p.CENTER);
          p.textAlign(p.RIGHT, p.CENTER);
          p.noFill();
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter - chartXDim2, yCenter - chartYDim2);
          p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter + chartXDim2, yCenter + chartYDim2);
          /* Average Line */
          if (this.averageServiceAvailability >= 0) {
            p.stroke(averageLineColor);
            p.drawingContext.setLineDash(lineDashSequence);
            p.line(xCenter - chartXDim2, yCenter + chartYDim2 - this.averageServiceAvailability * chartYDim / maxValue, xCenter + chartXDim2, yCenter + chartYDim2 - this.averageServiceAvailability * chartYDim / maxValue);
            p.drawingContext.setLineDash([]);
            p.textSize(textFontSize);
            p.textAlign(p.RIGHT, p.CENTER);
          }
            /* Zero text */
          p.fill(lineColor);
          p.noStroke();
          p.text("0%", xCenter - chartXDim2 - 10, yCenter + chartYDim2);
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2, xCenter - chartXDim2, yCenter + chartYDim2);
          p.line(xCenter - chartXDim2, yCenter + chartYDim2 + 5, xCenter - chartXDim2, yCenter + chartYDim2);
          /* yAxis text */
          for (var i = 0; i < nLines; i++) {
            p.fill(lineColor);
            p.noStroke();
            p.text(p.int(maxValue / (nLines / (i + 1))) + "%", xCenter - chartXDim2 - 15, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines + 1);
            p.stroke(lineColor);
            p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines, xCenter - chartXDim2, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines)
          }
          /* Draw threshold lines */
          for (var i = 1; i < this.availabilityColors.length; i++) {
            p.stroke(this.getAvailabilityIntsColorFromPerc(this.availabilityColors[i].threshold));
            p.line(xCenter - chartXDim2, yCenter + chartYDim2 - (this.availabilityColors[i].threshold * chartYDim / 100), xCenter + chartXDim2, yCenter + chartYDim2 - (this.availabilityColors[i].threshold * chartYDim / 100));
          }
        }
      }

      p.fillCalendarChart = () => {
        p.rectMode(p.CENTER);
        p.textAlign(p.CENTER, p.CENTER);
        if (this.filterForm.value.filterWeekly == true) {
          /* Weekly */
          let counter = 0;

          let firstRequestedWeek = -1;
          let counterRequestedWeek = 0;
          for (var i = 0; i < this.requestedMonthNumber; i++) {
            /* Months header text */
            p.fill(200);
            p.noStroke();
            p.textSize(dateFontSize);
            p.text(this.monthOfYear[this.requestedStartMonth + i], xCenter - (this.requestedMonthNumber/2.0)*dayXDim + 0.5*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2.0*dayYDim - dayYDim/1.5);

            for (var k = 0; k < this.weekPerMonth[i]; k++) {
              /* Black empty background */
              p.stroke(70);
              p.fill(20);
              p.rect(xCenter - (this.requestedMonthNumber/2.0)*dayXDim + 0.5*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2.0*dayYDim + k * dayYDim, dayXDim, dayYDim);
              /* Add fifth empty rect if there are only 4 weeks in this month */
              if (k == 3 && this.weekPerMonth[i] == 4) {
                p.rect(xCenter - (this.requestedMonthNumber/2.0)*dayXDim + 0.5*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2.0*dayYDim + (k+1) * dayYDim, dayXDim, dayYDim);
              }
              let dates: string[] = this.getYearMonthWeekDatesString(new Date(this.startDate).getFullYear(), this.requestedStartMonth + i, k)!;
              if (dates != null) {

                let isPartialWeek = false;                
                if (this.getWeekNumber(dates[0]) == this.getWeekNumber(this.requestedServiceAvailabilityList[0].date)) {
                  firstRequestedWeek = counterRequestedWeek;
                }
                if (counterRequestedWeek == firstRequestedWeek && dates[0] < this.startDate) {
                  dates[0] = this.startDate;
                  isPartialWeek = true;
                }
                if (counterRequestedWeek == (this.requestedWeeksNumber + firstRequestedWeek - 1) && dates[1] > this.stopDate) {
                  dates[1] = this.stopDate;
                  isPartialWeek = true;
                }
                counterRequestedWeek += 1;

                p.fill(200);
                p.noStroke();
                p.textSize(dateFontSize);
                let tempPercentage = -1;
                tempPercentage = this.completeWeeklyCalendarServiceAvailabilityList[counter].percentage;
                if (tempPercentage != null) {
                  p.fill(this.getAvailabilityIntsColorFromPerc(this.completeWeeklyCalendarServiceAvailabilityList[counter].percentage));
                  p.rect(xCenter - (this.requestedMonthNumber/2.0)*dayXDim + 0.5*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2.0*dayYDim + k * dayYDim, dayXDim, dayYDim);
                }
                /* Shaded date background rect */
                p.noStroke();
                p.fill(0,150);
                p.rect(xCenter - (this.requestedMonthNumber/2.0)*dayXDim + 0.5*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2.0*dayYDim + k * dayYDim - dayYDim/5.0, dayXDim / 1.1, dayYDim / 2.0, 5);
                /* Week Date string */
                p.fill(200);
                p.noStroke();
                p.text(tempPercentage == null || tempPercentage == -99 ? "" : (isPartialWeek ? "Partial Week (" : "Week (") + this.getWeekNumber(dates[0]) + ")\nFrom: " + dates[0] + "\nTo: " + dates[1], xCenter - (this.requestedMonthNumber/2.0)*dayXDim + 0.5*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2 * dayYDim + k * dayYDim + 1 - dayYDim/4.8);
                /* Value string */
                p.fill(tempPercentage < 0 ? 100 : 30);
                p.textSize(valueFontSize);
                p.text((tempPercentage == null) ? "" : tempPercentage == -1 ? "NaN" : tempPercentage == -99 ? "" : tempPercentage == 100 ? "100.00%" : tempPercentage.toFixed(2) +"%",
                      xCenter - (this.requestedMonthNumber/2.0)*dayXDim + 0.5*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2.0 * dayYDim + k * dayYDim + 1 + dayYDim/4.0);
              }
              counter++;
            }
          }
          /* External Frame */
          p.stroke(200);
          p.noFill();
          p.rectMode(p.CORNER);
          p.rect(xCenter - (this.requestedMonthNumber/2.0)*dayXDim, yCenter - 2.5*dayYDim, dayXDim * this.requestedMonthNumber, dayYDim * 5);

          counter = 0;
          for (var i = 0; i < this.requestedMonthNumber; i++) {
            for (var k = 0; k < this.weekPerMonth[i]; k++) {
              let tempPercentage = -1;
              tempPercentage = this.completeWeeklyCalendarServiceAvailabilityList[counter].percentage;
              if (tempPercentage != null) {
                /* If mouse is on bar */
                if (p.mouseX > xCenter - (this.requestedMonthNumber/2.0)*dayXDim + i * dayXDim && p.mouseX < xCenter - (this.requestedMonthNumber/2.0)*dayXDim + i * dayXDim + dayXDim
                    && p.mouseY > yCenter - (this.rowNumber)/2.0*dayYDim + k * dayYDim && p.mouseY < yCenter - (this.rowNumber)/2.0*dayYDim + k * dayYDim + dayYDim) {

                  /* Selector box */
                  p.stroke(230);
                  p.fill(255, 30);
                  p.rect(xCenter - (this.requestedMonthNumber/2.0)*dayXDim + i * dayXDim, yCenter - (this.rowNumber)/2.0*dayYDim + k * dayYDim, dayXDim, dayYDim);
                  this.mouseIsOnList[counter - this.monthWeekShift] = true;
                }
              }

              counter++;
            }
          }

        } else {
          /* Daily */
          p.rectMode(p.CENTER);
          for (var i = 0; i < 7; i++) {
            p.fill(200);
            p.noStroke();
            p.textSize(dateFontSize);
            p.text(this.dayOfWeek[i], xCenter - 3*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2*dayYDim - dayYDim/1.5);
            for (var k = 0; k < this.rowNumber; k++) {
              if ((i+k*7) >= this.weekdayShift && (i+k*7) < (this.weekdayShift + this.requestedDaysNumber)) {
                if (this.requestedServiceAvailabilityList[i+k*7 - this.weekdayShift].percentage == -1) {
                  p.stroke(70);
                  p.fill(30, 40, 40);
                  p.rect(xCenter - 3*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2*dayYDim + k * dayYDim, dayXDim, dayYDim);
                  p.noStroke();
                  p.fill(0,150);
                  p.rect(xCenter - 3*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2*dayYDim + k * dayYDim - dayYDim/4.0, dayXDim / 1.2, dayYDim / 4, 5);
                  p.fill(200);
                  p.noStroke();
                  p.textSize(dateFontSize);
                  p.text(this.requestedServiceAvailabilityList[i+k*7 - this.weekdayShift].date, xCenter - 3*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2 * dayYDim + k * dayYDim + 1 - dayYDim/4.0);
                  p.fill(100);
                  p.textSize(valueFontSize);
                  p.text("NaN", xCenter - 3*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2 * dayYDim + k * dayYDim + 1 + dayYDim/5.5);
                } else {
                  p.stroke(70);
                  p.fill(this.getAvailabilityIntsColorFromPerc(this.requestedServiceAvailabilityList[i+k*7 - this.weekdayShift].percentage));
                  p.rect(xCenter - 3*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2*dayYDim + k * dayYDim, dayXDim, dayYDim);
                  p.noStroke();
                  p.fill(0,150);
                  p.rect(xCenter - 3*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2*dayYDim + k * dayYDim - dayYDim/4.0, dayXDim / 1.2, dayYDim / 4, 5);
                  p.fill(200);
                  p.noStroke();
                  p.textSize(dateFontSize);
                  p.text(this.requestedServiceAvailabilityList[i+k*7 - this.weekdayShift].date, xCenter - 3*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2 * dayYDim + k * dayYDim + 1 - dayYDim/4.0);
                  p.textSize(valueFontSize);
                  p.fill(30);
                  p.text(this.requestedServiceAvailabilityList[i+k*7 - this.weekdayShift].percentage.toFixed(2)+"%", xCenter - 3*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2 * dayYDim + k * dayYDim + 1 + dayYDim/5.5);
                }
              } else {
                p.stroke(70);
                p.fill(20);
                p.rect(xCenter - 3*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2*dayYDim + k * dayYDim, dayXDim, dayYDim);
              }
            }
          }
          /* External Frame */
          p.stroke(200);
          p.fill(0,0);
          p.rectMode(p.CORNER);
          p.rect(xCenter - 3.5*dayXDim, yCenter - (this.rowNumber)/2.0*dayYDim, dayXDim * 7, dayYDim * this.rowNumber);
        }
      }

      p.getBaseLog = (x: number, y: number) => {
        return Math.log(y) / Math.log(x);
      }

    }, this.el.nativeElement);
  }

  onStartDateChanged() {
    this.startDate = this.filterForm.value.filterStartDate;
    this.stopDate = this.filterForm.value.filterStopDate;
    let tempMillisDate: number = 0;
    if (this.askForWeekly == true) {
      tempMillisDate = (Date.parse(this.startDate) + this.millisPerMaxWindow);
      if (Date.parse(this.stopDate) > tempMillisDate) {
        this.alert.showErrorAlert("Check Date Range", "Please select a maximum range of 90 days");
        let tempDate = new Date(tempMillisDate);
        this.stopDate = tempDate.toISOString().slice(0, 10);
      }
      if (Date.parse(this.startDate) > Date.parse(this.stopDate)) {
        this.alert.showErrorAlert("Check Date Range", "Start date cannot be later than stop date");
        this.stopDate = this.startDate;
      }
    } else {
      tempMillisDate = (Date.parse(this.startDate) + this.millisPerMaxPeriod);
      if (Date.parse(this.stopDate) > tempMillisDate) {
        this.alert.showErrorAlert("Check Date Range", "Please select a maximum range of 31 days");
        let tempDate = new Date(tempMillisDate);
        this.stopDate = tempDate.toISOString().slice(0, 10);
      }
      if (Date.parse(this.startDate) > Date.parse(this.stopDate)) {
        this.alert.showErrorAlert("Check Date Range", "Start date cannot be later than stop date");
        this.stopDate = this.startDate;
      }
    }
    this.filterForm.patchValue({
      filterStopDate: this.stopDate
    })
  }

  onStopDateChanged() {
    this.stopDate = this.filterForm.value.filterStopDate;
    this.startDate = this.filterForm.value.filterStartDate;
    if (this.askForWeekly == true) {
      let tempMillisDate = (Date.parse(this.stopDate) - this.millisPerMaxWindow);
      if (Date.parse(this.startDate) < tempMillisDate) {
        this.alert.showErrorAlert("Check Date Range", "Please select a maximum range of 90 days");
        let tempDate = new Date(tempMillisDate);
        this.startDate = tempDate.toISOString().slice(0, 10);
      }
      if (Date.parse(this.stopDate) < Date.parse(this.startDate)) {
        this.alert.showErrorAlert("Check Date Range", "Stop date cannot be earlier than start date");
        this.startDate = this.stopDate;
      }
      
    } else {
      let tempMillisDate = (Date.parse(this.stopDate) - this.millisPerMaxPeriod);
      if (Date.parse(this.startDate) < tempMillisDate) {
        this.alert.showErrorAlert("Check Date Range", "Please select a maximum range of 31 days");
        let tempDate = new Date(tempMillisDate);
        this.startDate = tempDate.toISOString().slice(0, 10);
      }
      if (Date.parse(this.stopDate) < Date.parse(this.startDate)) {
        this.alert.showErrorAlert("Check Date Range", "Stop date cannot be earlier than start date");
        this.startDate = this.stopDate;
      }
    }
    this.filterForm.patchValue({
      filterStartDate: this.startDate
    })
  }

  onWeeklyCheckboxChange() {
    if (this.filterForm.value.filterWeekly == true) {
      this.askForWeekly = true;
      let tempMillisDate = (Date.parse(this.stopDate) - this.millisPerMaxWindow);
      if (tempMillisDate < (Date.parse(this.todayDate) - this.millisPerMaxWindow)) {
        tempMillisDate = Date.parse(this.todayDate) - this.millisPerMaxWindow;
      }
      this.startDate = new Date(tempMillisDate).toISOString().slice(0, 10);
    } else {
      this.askForWeekly = false;
      let tempMillisDate = (Date.parse(this.stopDate) - this.millisPerMaxPeriod);
      if (tempMillisDate < (Date.parse(this.todayDate) - this.millisPerMaxWindow)) {
        tempMillisDate = Date.parse(this.todayDate) - this.millisPerMaxWindow;
      }
      this.startDate = new Date(tempMillisDate).toISOString().slice(0, 10);
    }
    this.filterForm.patchValue({
      filterStartDate: this.startDate
    })
  }

  onFilterButtonSubmit(): void {
    if (this.filterForm.value.filterWeekly == true) {
      /* Weekly */
      this.firstDailySubmitted = false;
    } else {
      /* Daily */
      this.firstWeeklySubmitted = false;
    }
    this.onFilterSubmit();
  }

  onFilterSubmit(): void {
    if (this.localCentre.id == -1) {
      this.alert.showErrorAlert("No Local Centre Found", "Please check if a local centre has been configured");
      return;
    }
    this.startDate = this.filterForm.value.filterStartDate;
    this.stopDate = this.filterForm.value.filterStopDate;
    this.availabilityDaysNumber = 0;
    this.availabilityWeeksNumber = 0;
    this.requestedDaysNumber = 0;
    this.requestedWeeksNumber = 0;
    let tempStopDate = new Date(this.stopDate);
    let tempStartDate = new Date(this.startDate);
    let tempTimeDifference = tempStopDate.getTime() - tempStartDate.getTime();

    let body: object = {
      "startDate": this.startDate.concat("T00:00:00"),
      "stopDate": this.stopDate.concat("T23:59:59")
    }

    if (this.filterForm.value.filterWeekly == true) {
      /* Weekly */
      this.isWeekly = true;
      this.authenticationService.getServiceAvailabilityWeekly(this.localCentre.id, body).subscribe(
        (res) => {
          if (res.centreId == this.localCentre.id) {
            this.availabilityWeeksNumber = res.values.length;
            this.weekdayShift = (tempStartDate.getDay() == 0 ? 6 : (tempStartDate.getDay() - 1)); // number of week starting days not counted
            this.weekdayStopShift = (tempStopDate.getDay() == 0 ? 0 : (7 - tempStopDate.getDay())); // number of week ending days not counted.
            this.requestedWeeksNumber = Math.ceil((((tempTimeDifference + (this.weekdayShift + this.weekdayStopShift) * this.millisPerDay ) / this.millisPerDay) + 1) / 7);
            this.requestedStartMonth = tempStartDate.getMonth();
            this.requestedStopMonth = new Date(tempStopDate.valueOf() + this.weekdayStopShift * this.millisPerDay).getMonth();//tempStopDate.getMonth();

            this.tempNextMonthFirstDay = (this.requestedStartMonth == 11 ? new Date(new Date(this.startDate).getFullYear()+1, 0).getDay() : new Date(new Date(this.startDate).getFullYear(), this.requestedStartMonth + 1).getDay());
            this.tempDiffDaysToSecondMonth = Math.ceil(((this.requestedStartMonth == 11 ? new Date(new Date(this.startDate).getFullYear()+1, 0).getTime() : new Date(new Date(this.startDate).getFullYear(), this.requestedStartMonth + 1).getTime()) - new Date(this.startDate).getTime()) / this.millisPerDay);

            if (this.tempDiffDaysToSecondMonth > 0 && this.tempDiffDaysToSecondMonth < this.tempNextMonthFirstDay) {
              this.requestedStartMonth++;
            }
            this.requestedMonthNumber = (this.requestedStartMonth > this.requestedStopMonth ? (12 - this.requestedStartMonth + this.requestedStopMonth) + 1 : (this.requestedStopMonth - this.requestedStartMonth) + 1);

            this.requestedServiceAvailabilityList = [];
            if (this.availabilityWeeksNumber > 0) {
              this.averageServiceAvailability = res.values[0].average;
            } else {
              this.averageServiceAvailability = -1;
            }
            for (var i = 0; i < this.requestedWeeksNumber; i++) {
              this.requestedServiceAvailabilityList[i] = {
                date: new Date(Date.parse(this.startDate) - (this.weekdayShift * this.millisPerDay) + (i * this.millisPerWeek)).toISOString().slice(0,10),
                successResponses: -1,
                totalRequests: -1,
                percentage: -1
              }
            }
            this.serviceAvailabilityList = res.values;
            for (var i = 0; i < this.requestedWeeksNumber; i++) {
              for (var k = 0; k < this.availabilityWeeksNumber; k++) {
                if (this.serviceAvailabilityList[k].date == this.requestedServiceAvailabilityList[i].date) {
                  this.requestedServiceAvailabilityList[i] = this.serviceAvailabilityList[k];
                }
              }
            }
            let firstDates: string[] = this.getYearMonthWeekDatesString(new Date(this.startDate).getFullYear(), this.requestedStartMonth, 0)!;
            this.monthWeekShift = Math.floor((Date.parse(this.startDate) - Date.parse(firstDates[0])) / this.millisPerWeek);

            let counter = 0;
            this.weekPerMonth = [];
            for (var i = 0; i < this.requestedMonthNumber; i++) {
              /* Calculate number of weeks per month */
              this.weekPerMonth.push(this.maxWeeksPerMonth);
              for (var k = 0; k < this.maxWeeksPerMonth; k++) {
                let lastDates: string[] = this.getYearMonthWeekDatesString(new Date(this.startDate).getFullYear(), this.requestedStartMonth + i, k)!;
                if (lastDates == null) {
                  this.weekPerMonth[i] = k;
                  break;
                }
              }
              for (var k = 0; k < this.weekPerMonth[i]; k++) {
                if (counter >= this.monthWeekShift && counter < this.requestedWeeksNumber + this.monthWeekShift) {
                  this.completeWeeklyCalendarServiceAvailabilityList[counter] = this.requestedServiceAvailabilityList[counter - this.monthWeekShift];
                } else {
                  this.completeWeeklyCalendarServiceAvailabilityList[counter] = {
                    date: "",
                    successResponses: -1,
                    totalRequests: -1,
                    percentage: -99
                  }
                }
                counter++;
              }
            }
            this.rowNumber = 5;
            this.p5Chart.setClickTimeoutId(undefined);
            this.p5Chart.windowResized();

            /* Save Last Data */
            this.precWeekly_requestedServiceAvailabilityList = this.requestedServiceAvailabilityList;
            this.precWeekly_startDate = this.startDate;
            this.precWeekly_stopDate = this.stopDate;
            this.precWeekly_requestedWeeksNumber = this.requestedWeeksNumber;
            this.precWeekly_averageServiceAvailability = this.averageServiceAvailability;
          }
          this.firstWeeklySubmitted = true;

          this.onDataTableShow();
          this.checkWindowHeight();
        }
      );
    } else {
      /* Daily */
      this.isWeekly = false;
      this.authenticationService.getServiceAvailability(this.localCentre.id, body).subscribe(
        (res) => {
          if (res.centreId == this.localCentre.id) {
            this.availabilityDaysNumber = res.values.length;
            this.requestedDaysNumber = tempTimeDifference / (1000 * 3600 * 24) + 1;
            this.requestedServiceAvailabilityList = [];
            if (this.availabilityDaysNumber > 0) {
              this.averageServiceAvailability = res.values[0].average;
            } else {
              this.averageServiceAvailability = -1;
            }

            for (var i = 0; i < this.requestedDaysNumber; i++) {
              this.requestedServiceAvailabilityList[i] = {
                date: new Date(Date.parse(this.startDate) + (i * this.millisPerDay)).toISOString().slice(0,10),
                successResponses: -1,
                totalRequests: -1,
                percentage: -1
              }
            }
            this.serviceAvailabilityList = res.values;

            /* Calculate week-day shift */
            this.weekdayShift = (tempStartDate.getDay() == 0 ? 6 : tempStartDate.getDay() - 1);
            if ((this.weekdayShift == 6 && this.requestedDaysNumber >= 30) || (this.weekdayShift == 5 && this.requestedDaysNumber == 31)) {
              this.rowNumber = 6;
            } else {
              this.rowNumber = 5;
            }

            for (var i = 0; i < this.requestedDaysNumber; i++) {
              for (var k = 0; k < this.availabilityDaysNumber; k++) {
                if (this.serviceAvailabilityList[k].date == this.requestedServiceAvailabilityList[i].date) {
                  this.requestedServiceAvailabilityList[i] = this.serviceAvailabilityList[k];
                }
              }
            }
            this.p5Chart.setClickTimeoutId(undefined);
            this.p5Chart.windowResized();

            /* Save Last Data */
            this.precDaily_requestedServiceAvailabilityList = this.requestedServiceAvailabilityList;
            this.precDaily_startDate = this.startDate;
            this.precDaily_stopDate = this.stopDate;
            this.precDaily_requestedDaysNumber = this.requestedDaysNumber;
            this.precDaily_averageServiceAvailability = this.averageServiceAvailability;
          }
          this.firstDailySubmitted = true;
          
          this.onDataTableShow();
          this.checkWindowHeight();
        }
      );
    }
  }


  onBackToDailyClicked() {
    this.askForWeekly = false;
    this.isWeekly = false;
    this.requestedServiceAvailabilityList = this.precDaily_requestedServiceAvailabilityList;
    this.startDate = this.precDaily_startDate;
    this.stopDate = this.precDaily_stopDate;
    this.filterForm.patchValue({
      filterWeekly: this.isWeekly,
      filterStartDate: this.startDate,
      filterStopDate: this.stopDate
    })
    this.requestedDaysNumber = this.precDaily_requestedDaysNumber;
    this.averageServiceAvailability = this.precDaily_averageServiceAvailability;
    (<HTMLInputElement>document.getElementById("weekly-checkbox")).checked = false;
    this.p5Chart.setClickTimeoutId(undefined);
    this.p5Chart.windowResized();
    this.checkWindowHeight();
  }

  onBackToWeeklyClicked() {
    this.askForWeekly = true;
    this.isWeekly = true;
    this.requestedServiceAvailabilityList = this.precWeekly_requestedServiceAvailabilityList;
    this.startDate = this.precWeekly_startDate;
    this.stopDate = this.precWeekly_stopDate;
    this.filterForm.patchValue({
      filterWeekly: this.isWeekly,
      filterStartDate: this.startDate,
      filterStopDate: this.stopDate
    })
    this.requestedWeeksNumber = this.precWeekly_requestedWeeksNumber;
    this.averageServiceAvailability = this.precWeekly_averageServiceAvailability;
    (<HTMLInputElement>document.getElementById("weekly-checkbox")).checked = true;
    this.p5Chart.setClickTimeoutId(undefined);
    this.p5Chart.windowResized();
    this.checkWindowHeight();
  }

  toggleTable() {
    // TODO use sidebar way..
    let dataTableContainer = document.getElementById("data-table-container")!;
    if (dataTableContainer.style.display == "none") {
      /* Show */
      dataTableContainer.style.display = "block";
    } else {
      /* Hide */
      dataTableContainer.style.display = "none";
    }
    this.checkWindowHeight();
  }

  onResetZoomClicked() {
    this.p5Chart.resetZoom();
  }

  chartChangeTo(type: string) {
    this.chartType = type;
    this.doResetZoom = true;
  }

  saveAsCSV() {
    if (this.filterForm.value.filterWeekly == true) {
      /* Export Weekly Availability */
      if (this.requestedServiceAvailabilityList.length > 0) {
        var csvContent: string = '';
        var table = <HTMLTableElement>document.getElementById('data-table');
        for (var h = 0; h < table.tHead!.childElementCount; h++) {
          csvContent += table.tHead!.children[h].textContent;
          if (h != table.tHead!.childElementCount - 1) csvContent += ',';
        }
        csvContent += '\n';
        for (var r = 0; r < table.rows.length; r++) {
          for (var c = 0; c < table.rows[r].cells.length; c++) {
            csvContent += table.rows[r].cells[c].innerText;
            if (!(c == (table.rows[r].childElementCount - 1) && r == (table.childElementCount - 1))) csvContent += ',';
          }
          r < (table.childElementCount - 1) ? csvContent += '\n' : null;
        }
        this.csvService.exportToCsv(
          'DAFNE-Service_Weekly_Availability('
          + this.localCentre.name
          + ')_From('
          + this.startDate
          + ')_To('
          + this.stopDate
          + ').csv', csvContent
        );
      }
    } else {
      /* Export Daily Availability */
      if (this.requestedServiceAvailabilityList.length > 0) {
        var csvContent: string = '';
        var table = <HTMLTableElement>document.getElementById('data-table');
          for (var h = 0; h < table.tHead!.childElementCount; h++) {
            csvContent += table.tHead!.children[h].textContent;
            if (h != table.tHead!.childElementCount - 1) csvContent += ',';
          }
          csvContent += '\n';
          for (var r = 0; r < table.rows.length; r++) {
            for (var c = 0; c < table.rows[r].cells.length; c++) {
              csvContent += table.rows[r].cells[c].innerText;
              if (!(c == (table.rows[r].childElementCount - 1) && r == (table.childElementCount - 1))) csvContent += ',';
            }
            r < (table.childElementCount - 1) ? csvContent += '\n' : null;
          }
        this.csvService.exportToCsv(
          'DAFNE-Service_Daily_Availability('
          + this.localCentre.name
          + ')_From('
          + this.startDate
          + ')_To('
          + this.stopDate
          + ').csv', csvContent
        );
      }
    }
  }

  getYearMonthWeekDatesString(year: number, month: number, week: number) {
    let dates: string[] = [];
    let tempFirst = new Date(year, month);
    let userTimezoneOffset = tempFirst.getTimezoneOffset() * 60000;
    let tempFirstDayNum = (tempFirst.getDay() == 0 ? 6 : tempFirst.getDay() - 1);
    let weekStart = new Date(tempFirst.valueOf() - userTimezoneOffset - (this.millisPerDay * tempFirstDayNum) + (this.millisPerWeek * week));
    let weekStop = new Date(weekStart.valueOf() - userTimezoneOffset + (this.millisPerDay * 6));
    dates.push(weekStart.toISOString().slice(0, 10));
    dates.push(weekStop.toISOString().slice(0, 10));
    if (week == 4 && weekStop.getMonth() != month) {
      return null;
    }
    return dates;
  }

  /* Function to convert [r, g, b] colors to html string: "#rrggbb" */
  rgbConvertToString(col: [number, number, number]) {
    let color: string = "#" + col[0].toString(16).padStart(2, '0') + col[1].toString(16).padStart(2, '0') + col[2].toString(16).padStart(2, '0');
    return color;
  }

  /* Function to convert #rrggbb colors to array: [r, g, b] */
  rgbConvertToArray(col: string) {
    if (col.length != 7) {
      return [100, 200, 250];
    }
    if (col.charAt(0) != '#') return [200, 0, 0];
    var r = parseInt(col.slice(1, 3), 16);
    var g = parseInt(col.slice(3, 5), 16);
    var b = parseInt(col.slice(5, 7), 16);
    let color = [r, g, b];
    return color;
  }

  getAvailabilityHexColorFromPerc(perc: number) {
    for (var i = 0; i < this.availabilityColors.length - 1; i++) {
      if (perc > this.availabilityColors[i].threshold && perc <= this.availabilityColors[i+1].threshold) {
        return this.availabilityColors[i].color;
      }
    }
    if (perc == 0) return this.availabilityColors[0].color;
    return "#000000";
  }

  getAvailabilityIntsColorFromPerc(perc: number) {
    if (perc == -1) return [30, 40, 40];
    if (perc == -99) return [0, 0, 0];
    if (perc == 0) return this.rgbConvertToArray(this.availabilityColors[0].color);
    if (perc > 0 && perc <= 100) {
      for (var i = 0; i < this.availabilityColors.length - 1; i++) {
        if (perc > this.availabilityColors[i].threshold && perc <= this.availabilityColors[i+1].threshold) {
          return this.rgbConvertToArray(this.availabilityColors[i].color);
        }
      }
    }
    return [0, 0, 0];
  }

  getWeekEndDateText(weekStartText: string) {
    return new Date(Date.parse(weekStartText) + (this.millisPerDay * 6)).toISOString().slice(0, 10)
  }

  getWeekNumber(date: string) {
    // Copy date to not modify original
    let d: Date = new Date(date);
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    //console.log("Date: "+d);
    // Get first day of year
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    // Return array of year and week number
    //return [weekNo, d.getUTCFullYear()];
    return weekNo;
  }
}
