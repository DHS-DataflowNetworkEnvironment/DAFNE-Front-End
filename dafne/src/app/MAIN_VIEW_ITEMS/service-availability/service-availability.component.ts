import { Component, OnInit, ElementRef } from '@angular/core';
import { AlertComponent } from '../../alert/alert.component';
import { IDatePickerConfig } from 'ng2-date-picker';
import { Availability } from '../../models/availability';
import * as p5 from 'p5';

@Component({
  selector: 'app-service-availability',
  templateUrl: './service-availability.component.html',
  styleUrls: ['./service-availability.component.css']
})
export class ServiceAvailabilityComponent implements OnInit {

  public p5Chart;

  public tempDaysNumber: number = 0;
  public daysNumber: number = 30; /// THIS VALUE HAS TO BE TAKEN FROM A GET!!!!!!!!!!!
  public millisPerDay = 86400000;
  public maxDays = 29;
  public millisPerMaxPeriod = this.millisPerDay * this.maxDays;

  public today = new Date();
  public dd = String(this.today.getDate()).padStart(2, '0');
  public mm = String(this.today.getMonth() + 1).padStart(2, '0');
  public yyyy = this.today.getFullYear();
  public todayDate: string = this.yyyy + '-' + this.mm + '-' + this.dd;

  public initialStartDayMillis = Date.parse(this.todayDate) - (this.maxDays * this.millisPerDay);
  public startDateTemp = new Date(this.initialStartDayMillis);
  public ddStart = String(this.startDateTemp.getDate()).padStart(2, '0');
  public mmStart = String(this.startDateTemp.getMonth() + 1).padStart(2, '0');
  public yyyyStart = this.startDateTemp.getFullYear();
  public startDate: string = this.yyyyStart + '-' + this.mmStart + '-' + this.ddStart;

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

  public fakeServiceAvailabilityJson = {
    centreId: 0,
    values: [
      {date: "2022-01-20", successResponses: 132, totalRequests: 144, percentage: 100},
      {date: "2022-01-21", successResponses: 132, totalRequests: 144, percentage: 100},
      {date: "2022-01-22", successResponses: 132, totalRequests: 144, percentage: 65},
      {date: "2022-01-23", successResponses: 132, totalRequests: 144, percentage: 74},
      {date: "2022-01-24", successResponses: 132, totalRequests: 144, percentage: 98},
      {date: "2022-01-25", successResponses: 132, totalRequests: 144, percentage: 96},
      {date: "2022-01-26", successResponses: 132, totalRequests: 144, percentage: 98},
      {date: "2022-01-27", successResponses: 132, totalRequests: 144, percentage: 100},
      {date: "2022-01-28", successResponses: 132, totalRequests: 144, percentage: 98},
      {date: "2022-01-29", successResponses: 132, totalRequests: 144, percentage: 80},
      {date: "2022-01-30", successResponses: 132, totalRequests: 144, percentage: 77},
      {date: "2022-01-31", successResponses: 132, totalRequests: 144, percentage: 100},
      {date: "2022-02-01", successResponses: 132, totalRequests: 144, percentage: 97},
      {date: "2022-02-02", successResponses: 132, totalRequests: 144, percentage: 92},
      {date: "2022-02-03", successResponses: 132, totalRequests: 144, percentage: 100},
      {date: "2022-02-04", successResponses: 132, totalRequests: 144, percentage: 100},
      {date: "2022-02-05", successResponses: 132, totalRequests: 144, percentage: 88},
      {date: "2022-02-06", successResponses: 132, totalRequests: 144, percentage: 57},
      {date: "2022-02-07", successResponses: 132, totalRequests: 144, percentage: 100},
      {date: "2022-02-08", successResponses: 132, totalRequests: 144, percentage: 97},
      {date: "2022-02-09", successResponses: 132, totalRequests: 144, percentage: 94},
      {date: "2022-02-10", successResponses: 132, totalRequests: 144, percentage: 100},
      {date: "2022-02-11", successResponses: 132, totalRequests: 144, percentage: 100},
      {date: "2022-02-12", successResponses: 132, totalRequests: 144, percentage: 92},
      {date: "2022-02-13", successResponses: 132, totalRequests: 144, percentage: 88},
      {date: "2022-02-14", successResponses: 132, totalRequests: 144, percentage: 100},
      {date: "2022-02-15", successResponses: 132, totalRequests: 144, percentage: 99},
      {date: "2022-02-16", successResponses: 132, totalRequests: 144, percentage: 94},
      {date: "2022-02-17", successResponses: 132, totalRequests: 144, percentage: 100},
      {date: "2022-02-18", successResponses: 132, totalRequests: 144, percentage: 100}
    ]
  };    //// 

  //public serviceAvailabilityList: Array<Availability> = this.fakeServiceAvailabilityJson.values;
  public serviceAvailabilityList: Array<Availability>;
  public dayOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];


  constructor(
    private el: ElementRef,
    private alert: AlertComponent,
  ) { }

  ngOnInit(): void {
    this.init_P5();
  }

  onStartDateChanged(date) {
    let tempMillisDate = (Date.parse(date) + this.millisPerMaxPeriod);
    if (Date.parse(this.stopDate) > tempMillisDate) {
      this.alert.showErrorAlert("Check Date Range", "Please select a maximum range of 15 days");
      let tempDate = new Date(tempMillisDate);
      let dd = String(tempDate.getDate()).padStart(2, '0');
      let mm = String(tempDate.getMonth() + 1).padStart(2, '0');
      let yyyy = tempDate.getFullYear();
      this.stopDate = yyyy + '-' + mm + '-' + dd;
    }
    if (Date.parse(date) > Date.parse(this.stopDate)) {
      this.alert.showErrorAlert("Check Date Range", "Start date cannot be later than stop date");
      this.stopDate = date;
    }
  }

  onStopDateChanged(date) {
    let tempMillisDate = (Date.parse(date) - this.millisPerMaxPeriod);
    if (Date.parse(this.startDate) < tempMillisDate) {
      this.alert.showErrorAlert("Check Date Range", "Please select a maximum range of 15 days");
      let tempDate = new Date(tempMillisDate);
      let dd = String(tempDate.getDate()).padStart(2, '0');
      let mm = String(tempDate.getMonth() + 1).padStart(2, '0');
      let yyyy = tempDate.getFullYear();
      this.startDate = yyyy + '-' + mm + '-' + dd;
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
    //console.log("Time difference: " + tempTimeDifference);
    
    this.tempDaysNumber = tempTimeDifference / (1000 * 3600 * 24) + 1;
    //this.sectionRadians = (2 * Math.PI) / this.daysNumber;
    //console.log("Days difference: " + tempDaysNumber);
  
    for (var i = 0; i < this.tempDaysNumber; i++) {
      //console.log("Date " + i + " - " + new Date(tempStartDate.getTime() + i*(1000*3600*24)));
      let tempFilteredDate = new Date(tempStartDate.getTime() + i*(1000*3600*24));
      let tempdd = String(tempFilteredDate.getDate()).padStart(2, '0');
      let tempmm = String(tempFilteredDate.getMonth() + 1).padStart(2, '0');
      let tempyyyy = tempFilteredDate.getFullYear();
      let tempFilteredDateString: string = tempyyyy + '-' + tempmm + '-' + tempdd;
      //console.log("TempFilteredDate: " + tempFilteredDateString);

/*       let body: object = {
        "mission":this.bodyMission,
        "productType":this.productType,
        "startDate":tempFilteredDateString,
        "stopDate":tempFilteredDateString
      }; */
      //console.log("FILTER Body: " + JSON.stringify(body, null, 2));
/*       this.completenessDailyGetDone[i] = false;   
      this.getDailyCompleteness(body, i); */
    }

    /* CHECK!!!!  ---->  Fill the Array on filter submit */
    this.serviceAvailabilityList = this.fakeServiceAvailabilityJson.values;
    this.p5Chart.windowResized();
  }

  toggleTable() {
    //if (getComputedStyle(document.getElementById("data-table-container")).visibility == 'collapse') {
    if (document.getElementById("data-table-container").style.display == "none") {
      /* Show */
      document.getElementById("main-column-container").style.height = "calc(100vh - 9rem - 12rem)";
      document.getElementById("p5ServiceAvailabilityCanvas-column-div").style.height = "calc(100vh - 25.5rem)";
      /* document.getElementById("p5ServiceAvailabilityCanvas").style.height = "100%"; */
      document.getElementById("data-table-container").style.display = "block";
      
      //this.p5Chart.windowResized();
    } else {
      /* Hide */
      document.getElementById("main-column-container").style.height = "calc(100vh - 9rem)";
      document.getElementById("p5ServiceAvailabilityCanvas-column-div").style.height = "calc(100vh - 13.5rem)"; 
      /* document.getElementById("p5ServiceAvailabilityCanvas").style.height = "100%";  */
      document.getElementById("data-table-container").style.display = "none";
      
      //this.p5Chart.windowResized();
    }
  }

  chartChangeTo(type: string) {
    this.chartType = type;
    this.doResetZoom = true;
  }

  saveAsCSV() {
    /* if (this.completenessDataList.length > 0) {
      var csvContent: string = '';
      var table = document.getElementById('data-table');
      for (var r = 0; r < table.childElementCount; r++) {
        for (var c = 0; c < table.children[r].childElementCount; c++) {
          csvContent += table.children[r].children[c].innerHTML;
          if (!(c == (table.children[r].childElementCount - 1) && r == (table.childElementCount - 1))) csvContent += ',';
        }
        r < (table.childElementCount - 1) ? csvContent += '\n' : null;
      }
      let tempCompleteCsvMissionName = this.missionFiltered.acronym + this.platformNumber;
      this.csvService.exportToCsv(
        'DAFNE-Mission('
        + tempCompleteCsvMissionName
        + ')_Product('
        + this.productType 
        + ')_From('
        + table.children[0].children[1].innerHTML
        + ')_To('
        + table.children[0].children[table.children[0].childElementCount - 1].innerHTML
        + ').csv', csvContent
      );
    } */
  }

  init_P5() {
    let canvas = document.getElementById("p5ServiceAvailabilityCanvas");
    let canvasSpace;
    let canvasWidth = canvas.clientWidth;
    let canvasHeight = canvas.clientHeight;

    this.p5Chart = new p5(p => {
      let blankXDim = 140;
      let blankYDim = 140;
      let xCenter = canvasWidth / 2;
      let yCenter = canvasHeight / 2;
      let pieExtDiameter = (canvasWidth > canvasHeight) ? canvasHeight - blankYDim : canvasWidth - blankXDim;
      let pieExtRadius = pieExtDiameter / 2;
      let chartXDim = canvasWidth - blankXDim;
      let chartYDim = canvasHeight - blankYDim;
      let chartXDim2 = chartXDim / 2;
      let chartYDim2 = chartYDim / 2;
      let nLines = 4;

      let dayXDim = canvasWidth / 10;
      let dayYDim = canvasHeight / 8;

      let backgroundColor = p.color('#12222f');
      let labelBackgroundColor = p.color('#12222fcc')
      let lineColor = p.color('#aaaaaa');
      let valuesColor = p.color(200);

      let dateFontSize = 12;
      let valueFontSize = 10;

      let barGapScale = 30.0;
      let sectionScaleSingle = 1.4;
      let maxValue = 100;

      let sf = 1.0;
      let tx = 0;
      let ty = 0;

      let expNum = 1.056975;
      let serviceAvailabilityListScaled: Array<number> = [];
      //let expandedServiceAvailabilityList = Array.apply(null, Array(35)).map(function () {});
      let expandedServiceAvailabilityList: Array<Availability> = Array.apply(null, Array(35)).map(function () {});

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

        for (var i = 0; i < this.daysNumber; i++) {
          serviceAvailabilityListScaled[i] = expNum ** this.serviceAvailabilityList[i].percentage;
        }

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
        pieExtDiameter = (canvasWidth > canvasHeight) ? canvasHeight - blankYDim : canvasWidth - blankXDim;
        pieExtRadius = pieExtDiameter / 2;
        chartXDim = (canvasWidth - blankXDim);
        chartYDim = (canvasHeight - blankYDim);
        chartXDim2 = chartXDim / 2;
        chartYDim2 = chartYDim / 2;
        dayXDim = canvasWidth / 10;
        dayYDim = canvasHeight / 8;
      };

      p.fillBarChart = () => {
        for (var i = 0; i < this.daysNumber; i++) {
          let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.daysNumber) + i * chartXDim / this.daysNumber;
          let sectionXFilledDim = (chartXDim / this.daysNumber) / sectionScaleSingle;
          let sectionXFilledDim2 = sectionXFilledDim / 2;
          let barGap = sectionXFilledDim / barGapScale;

          /* xAxis Text */
          p.textAlign(p.CENTER, p.CENTER);
          p.fill(lineColor);
          p.noStroke();
          p.textSize(dateFontSize);
          /* Rotate Dates */
          let tempText = this.serviceAvailabilityList[i].date;
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
          p.line(xCenter - chartXDim2 + (i + 1) * chartXDim / this.daysNumber, yCenter + chartYDim2 + 5, xCenter - chartXDim2 + (i + 1) * chartXDim / this.daysNumber, yCenter + chartYDim2);
          /* Bars */
          p.rectMode(p.CORNER);
          p.fill(255 - serviceAvailabilityListScaled[i], serviceAvailabilityListScaled[i], 0);
          p.noStroke();
          p.rect(sectionXCenter - sectionXFilledDim2, yCenter + chartYDim2, sectionXFilledDim, -((this.serviceAvailabilityList[i].percentage < 0 ? 0 : this.serviceAvailabilityList[i].percentage) * chartYDim / maxValue));
/*           p.fill(lineColor)
          p.textSize(valueFontSize);
          p.text(this.serviceAvailabilityList[i].percentage + "%", sectionXCenter, yCenter + chartYDim2 - (this.serviceAvailabilityList[i].percentage * chartYDim / maxValue) - valueFontSize / 2);
 */          
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
          //p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines, xCenter + chartXDim2, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines)
        }
      }

      p.fillCalendarChart = () => {
        /* Calculate week-day shift */
        let weekdayShift = 3;
        for (var i = 0; i < 30; i++) {
          expandedServiceAvailabilityList[weekdayShift+i] = this.serviceAvailabilityList[i];
        }
        
        p.rectMode(p.CENTER);
        p.textAlign(p.CENTER, p.CENTER);
        for (var i = 0; i < 7; i++) {
          p.fill(200);
          p.text(this.dayOfWeek[i], xCenter - 3*dayXDim + i * dayXDim, yCenter - 2.6*dayYDim);
          for (var k = 0; k < 5; k++) {
            if (expandedServiceAvailabilityList[i+k*7] == null) {
              p.stroke(70);
              p.fill(20);
              p.rect(xCenter - 3*dayXDim + i * dayXDim, yCenter - 2*dayYDim + k * dayYDim, dayXDim, dayYDim);
            } else {
              p.stroke(255);
              p.fill(255 - serviceAvailabilityListScaled[(i+k*7)-weekdayShift], serviceAvailabilityListScaled[(i+k*7)-weekdayShift], 0);
              p.rect(xCenter - 3*dayXDim + i * dayXDim, yCenter - 2*dayYDim + k * dayYDim, dayXDim, dayYDim);
              p.stroke(200);
              p.fill(0,150);
              p.rect(xCenter - 3*dayXDim + i * dayXDim, yCenter - 2*dayYDim + k * dayYDim - dayYDim/4.0, dayXDim / 1.2, dayYDim / 3, 5);
              p.rect(xCenter - 3*dayXDim + i * dayXDim, yCenter - 2*dayYDim + k * dayYDim + dayYDim/4.0, dayXDim / 2.0, dayYDim / 3, 5);
              p.fill(200);
              p.noStroke();
              p.text(expandedServiceAvailabilityList[i+k*7].date, xCenter - 3*dayXDim + i * dayXDim, yCenter - 2 * dayYDim + k * dayYDim + 1 - dayYDim/4.0);
              p.text(expandedServiceAvailabilityList[i+k*7].percentage, xCenter - 3*dayXDim + i * dayXDim, yCenter - 2 * dayYDim + k * dayYDim + 1 + dayYDim/4.0);
            }
            
          }
        }
      }

      p.getBaseLog = (x: number, y: number) => {
        return Math.log(y) / Math.log(x);
      }

    }, this.el.nativeElement);
  }
}
