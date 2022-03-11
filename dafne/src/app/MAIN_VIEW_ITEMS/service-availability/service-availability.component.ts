import { Component, OnInit, ElementRef } from '@angular/core';
import { AuthenticationService } from '../../services/authentication.service';
import { AlertComponent } from '../../alert/alert.component';
import { IDatePickerConfig } from 'ng2-date-picker';
import { Availability } from '../../models/availability';
import { AppConfig } from '../../services/app.config';
import { CsvDataService } from '../../services/csv-data.service';
import * as p5 from 'p5';

@Component({
  selector: 'app-service-availability',
  templateUrl: './service-availability.component.html',
  styleUrls: ['./service-availability.component.css']
})
export class ServiceAvailabilityComponent implements OnInit {

  public p5Chart;

  public localCentre = {
    id: -1,
    name: "",
    color: "#ffffff"
  };

  public availabilityDaysNumber: number = 0;
  public requestedDaysNumber: number = 0;
  public millisPerDay: number = 86400000;
  public maxDays: number = 29;
  public millisPerMaxPeriod = this.millisPerDay * this.maxDays;

  public today = new Date();
  public todayDate: string = this.today.toISOString().slice(0, 10);

  public initialStartDayMillis = Date.parse(this.todayDate) - this.millisPerMaxPeriod;
  public startDateTemp = new Date(this.initialStartDayMillis);
  public startDate: string = this.startDateTemp.toISOString().slice(0, 10);

  public stopDate = this.todayDate;
  public startDatePickerConfig: IDatePickerConfig = {
    format: "YYYY-MM-DD",
    firstDayOfWeek: "mo",
    min: "2010-01-01",
    max: this.todayDate
  };
  public stopDatePickerConfig: IDatePickerConfig = {
    format: "YYYY-MM-DD",
    firstDayOfWeek: "mo",
    min: "2010-01-01",
    max: this.todayDate
  };
  public selectorText = [
    "Bar Chart",
    "Calendar Chart"
  ];
  public chartType: string = this.selectorText[0];
  public doResetZoom: boolean = false;

  public serviceAvailabilityList: Array<Availability> = [];
  public requestedServiceAvailabilityList: Array<Availability> = [];

  public dayOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  public weekdayShift: number = 0;
  public rowNumber = 5;

  public availabilityColors;

  constructor(
    public authenticationService: AuthenticationService,
    private csvService: CsvDataService,
    private el: ElementRef,
    private alert: AlertComponent,
  ) {
    this.availabilityColors = AppConfig.settings.availabilityColors;
  }

  ngOnInit(): void {
    this.authenticationService.getAllCentres().subscribe(
      (res: object) => {
        /* Get Local Centre */
        if (Object.values(res).filter((x) => x.local == true)[0]) {
          this.localCentre = Object.values(res).filter((x) => x.local == true)[0];
        } else {
          this.localCentre = {
            id: -1,
            name: "No Local",
            color: "#ffffff"
          };
        }
        this.init_P5();
      }
    );
  }

  onStartDateChanged(date) {
    let tempMillisDate = (Date.parse(date) + this.millisPerMaxPeriod);
    if (Date.parse(this.stopDate) > tempMillisDate) {
      this.alert.showErrorAlert("Check Date Range", "Please select a maximum range of 30 days");
      let tempDate = new Date(tempMillisDate);
      this.stopDate = tempDate.toISOString().slice(0, 10);
    }
    if (Date.parse(date) > Date.parse(this.stopDate)) {
      this.alert.showErrorAlert("Check Date Range", "Start date cannot be later than stop date");
      this.stopDate = date;
    }
  }

  onStopDateChanged(date) {
    let tempMillisDate = (Date.parse(date) - this.millisPerMaxPeriod);
    if (Date.parse(this.startDate) < tempMillisDate) {
      this.alert.showErrorAlert("Check Date Range", "Please select a maximum range of 30 days");
      let tempDate = new Date(tempMillisDate);
      this.startDate = tempDate.toISOString().slice(0, 10);
    }
    if (Date.parse(date) < Date.parse(this.startDate)) {
      this.alert.showErrorAlert("Check Date Range", "Stop date cannot be earlier than start date");
      this.startDate = date;
    }
  }

  onFilterSubmit(): void {
    let tempStopDate = new Date(this.stopDate);
    let tempStartDate = new Date(this.startDate);
    let tempTimeDifference = tempStopDate.getTime() - tempStartDate.getTime();

    let body: object = {
      "startDate": this.startDate.concat("T00:00:00"),
      "stopDate": this.stopDate.concat("T23:59:59")
    }
    if (this.localCentre.id == -1) {
      this.alert.showErrorAlert("No Local Centre Found", "Please check if a local centre has been configured");
      return;
    }
    this.authenticationService.getServiceAvailability(this.localCentre.id, body).subscribe(
      (res) => {
        if (res.centreId == this.localCentre.id) {
          this.availabilityDaysNumber = res.values.length;
          this.requestedDaysNumber = tempTimeDifference / (1000 * 3600 * 24) + 1;
          this.requestedServiceAvailabilityList = [];
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
          if (this.weekdayShift == 6 && this.requestedDaysNumber == 30) {
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
          this.p5Chart.windowResized();
        }
      }
    );
  }

  toggleTable() {
    if (document.getElementById("data-table-container").style.display == "none") {
      /* Show */
      document.getElementById("main-column-container").style.height = "calc(100vh - 9rem - 12rem)";
      document.getElementById("p5ServiceAvailabilityCanvas-column-div").style.height = "calc(100vh - 25.5rem)";
      document.getElementById("data-table-container").style.display = "block";
    } else {
      /* Hide */
      document.getElementById("main-column-container").style.height = "calc(100vh - 9rem)";
      document.getElementById("p5ServiceAvailabilityCanvas-column-div").style.height = "calc(100vh - 13.5rem)";
      document.getElementById("data-table-container").style.display = "none";
    }
  }

  chartChangeTo(type: string) {
    this.chartType = type;
    this.doResetZoom = true;
  }

  saveAsCSV() {
    if (this.requestedServiceAvailabilityList.length > 0) {
      var csvContent: string = '';
      var table = document.getElementById('data-table');
      for (var r = 0; r < table.childElementCount; r++) {
        for (var c = 0; c < table.children[r].childElementCount; c++) {
          csvContent += table.children[r].children[c].innerHTML;
          if (!(c == (table.children[r].childElementCount - 1) && r == (table.childElementCount - 1))) csvContent += ',';
        }
        r < (table.childElementCount - 1) ? csvContent += '\n' : null;
      }
      this.csvService.exportToCsv(
        'DAFNE-Service-Availability_Centre('
        + this.localCentre.name
        + ')_From('
        + table.children[0].children[1].innerHTML
        + ')_To('
        + table.children[0].children[table.children[0].childElementCount - 1].innerHTML
        + ').csv', csvContent
      );
    }
  }

  init_P5() {
    let canvas = document.getElementById("p5ServiceAvailabilityCanvas");
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

      let valueFontSize = 20;
      let dateFontSize = 12;
      let textFontSize = 10;

      let barGapScale = 30.0;
      let sectionScaleSingle = 1.4;
      let maxValue = 100;

      let sf = 1.0;
      let tx = 0;
      let ty = 0;

      p.setup = () => {
        canvasSpace = p.createCanvas(canvasWidth, canvasHeight).parent('p5ServiceAvailabilityCanvas');
        p.pixelDensity(1.0);
        p.smooth();
        p.frameRate(10);
        p.textFont('NotesESA-Reg');
        canvasSpace.mouseWheel(e => wheelZoom(e));
        canvasSpace.doubleClicked(resetZoom);
      };

      p.draw = () => {
        p.background(backgroundColor);
        p.windowResized();
        p.translate(tx, ty);

        if (this.chartType == this.selectorText[0]) {
          p.fillBarChart();
        } else if (this.chartType == this.selectorText[1]) {
          p.fillCalendarChart();
        }

        if (p.mouseIsPressed) {
          tx -= p.pmouseX - p.mouseX;
          ty -= p.pmouseY - p.mouseY;
        }
        
        if (this.doResetZoom) {
          this.doResetZoom = false;
          resetZoom();
        }
      }

      function applyScale(s) {
        sf = sf * s;
        tx = p.mouseX * (1-s) + tx * s;
        ty = p.mouseY * (1-s) + ty * s;
      }

      function wheelZoom(e) {
        applyScale(e.deltaY < 0 ? 1.1 : 0.9);
        return false;
      }

      function resetZoom() {
        sf = 1.0;
        tx = 0;
        ty = 0;
      }

      

      p.windowResized = () => {
        canvasWidth = canvas.clientWidth;
        canvasHeight = canvas.clientHeight;
        p.resizeCanvas(canvasWidth, canvasHeight);
        canvasWidth = canvas.clientWidth * sf;
        canvasHeight = canvas.clientHeight * sf;
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
          p.translate(sectionXCenter, yCenter + chartYDim2 + sinOfAngle + dateFontSize);
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
          if (this.requestedServiceAvailabilityList[i].percentage != -1) {
            p.fill(this.getAvailabilityIntsColorFromPerc(this.requestedServiceAvailabilityList[i].percentage));
            p.noStroke();
            p.rect(sectionXCenter - sectionXFilledDim2, yCenter + chartYDim2, sectionXFilledDim, -((this.requestedServiceAvailabilityList[i].percentage < 0 ? 0 : this.requestedServiceAvailabilityList[i].percentage) * chartYDim / maxValue));
          }
        } 
        /* Scheme */
        p.rectMode(p.CENTER);
        p.textAlign(p.RIGHT, p.CENTER);
        p.noFill();
        p.stroke(lineColor);
        p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter - chartXDim2, yCenter - chartYDim2);
        p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter + chartXDim2, yCenter + chartYDim2);
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

      p.fillCalendarChart = () => {        
        p.rectMode(p.CENTER);
        p.textAlign(p.CENTER, p.CENTER);
        
        for (var i = 0; i < 7; i++) {
          p.fill(200);
          p.noStroke();
          p.textSize(dateFontSize);
          p.text(this.dayOfWeek[i], xCenter - 3*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2*dayYDim - dayYDim/1.5);
          for (var k = 0; k < this.rowNumber; k++) {
            if ((i+k*7) < this.weekdayShift || (i+k*7) >= (this.weekdayShift + this.requestedDaysNumber)) {
              p.stroke(70);
              p.fill(20);
              p.rect(xCenter - 3*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2*dayYDim + k * dayYDim, dayXDim, dayYDim);
            } else {
              if (this.requestedServiceAvailabilityList[i+k*7 - this.weekdayShift].percentage == -1) {
                p.stroke(70);
                p.fill(20);
                p.rect(xCenter - 3*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2*dayYDim + k * dayYDim, dayXDim, dayYDim);
                p.noStroke();
                p.fill(labelBackgroundColor);
                p.rect(xCenter - 3*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2*dayYDim + k * dayYDim - dayYDim/4.0, dayXDim / 1.2, dayYDim / 4, 5);
                p.fill(200);
                p.noStroke();
                p.textSize(dateFontSize);
                p.text(this.requestedServiceAvailabilityList[i+k*7 - this.weekdayShift].date, xCenter - 3*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2 * dayYDim + k * dayYDim + 1 - dayYDim/4.0);
                p.fill(100);
                p.textSize(textFontSize);
                p.textSize(valueFontSize);
                p.text("N/A", xCenter - 3*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2 * dayYDim + k * dayYDim + 1 + dayYDim/5.5);
              }
            }
          }
        }
        for (var i = 0; i < 7; i++) {
          for (var k = 0; k < this.rowNumber; k++) {
            if ((i+k*7) >= this.weekdayShift && (i+k*7) < (this.weekdayShift + this.requestedDaysNumber)) {
              if (this.requestedServiceAvailabilityList[i+k*7 - this.weekdayShift].percentage != -1 ) {
                p.stroke(255);
                p.fill(this.getAvailabilityIntsColorFromPerc(this.requestedServiceAvailabilityList[i+k*7 - this.weekdayShift].percentage));
                p.rect(xCenter - 3*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2*dayYDim + k * dayYDim, dayXDim, dayYDim);
                p.noStroke();
                p.fill(0,100);
                p.rect(xCenter - 3*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2*dayYDim + k * dayYDim - dayYDim/4.0, dayXDim / 1.2, dayYDim / 4, 5);
                p.fill(200);
                p.noStroke();
                p.textSize(dateFontSize);
                p.text(this.requestedServiceAvailabilityList[i+k*7 - this.weekdayShift].date, xCenter - 3*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2 * dayYDim + k * dayYDim + 1 - dayYDim/4.0);
                p.textSize(textFontSize);
                p.textSize(valueFontSize);
                p.text(this.requestedServiceAvailabilityList[i+k*7 - this.weekdayShift].percentage.toFixed(2)+"%", xCenter - 3*dayXDim + i * dayXDim, yCenter - (this.rowNumber-1)/2 * dayYDim + k * dayYDim + 1 + dayYDim/5.5);
              }
            }
          }
        }
      }

      p.getBaseLog = (x: number, y: number) => {
        return Math.log(y) / Math.log(x);
      }

    }, this.el.nativeElement);
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
    return "#000000";
  }
  getAvailabilityIntsColorFromPerc(perc: number) {
    for (var i = 0; i < this.availabilityColors.length - 1; i++) {
      if (perc > this.availabilityColors[i].threshold && perc <= this.availabilityColors[i+1].threshold) {
        return this.rgbConvertToArray(this.availabilityColors[i].color);
      }
    }
    return [0, 0, 0];
  }
}
