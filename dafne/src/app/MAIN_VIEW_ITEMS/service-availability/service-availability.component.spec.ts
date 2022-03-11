import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServiceAvailabilityComponent } from './service-availability.component';

describe('ServiceAvailabilityComponent', () => {
  let component: ServiceAvailabilityComponent;
  let fixture: ComponentFixture<ServiceAvailabilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ServiceAvailabilityComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceAvailabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
