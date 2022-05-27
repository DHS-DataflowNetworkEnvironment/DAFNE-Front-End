import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServAvailabilityComponent } from './serv-availability.component';

describe('ServAvailabilityComponent', () => {
  let component: ServAvailabilityComponent;
  let fixture: ComponentFixture<ServAvailabilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ServAvailabilityComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServAvailabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
