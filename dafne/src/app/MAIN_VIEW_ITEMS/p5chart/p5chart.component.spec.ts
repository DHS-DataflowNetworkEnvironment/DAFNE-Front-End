import { ComponentFixture, TestBed } from '@angular/core/testing';
import { P5chartComponent } from './p5chart.component';

describe('P5chartComponent', () => {
  let component: P5chartComponent;
  let fixture: ComponentFixture<P5chartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ P5chartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(P5chartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
