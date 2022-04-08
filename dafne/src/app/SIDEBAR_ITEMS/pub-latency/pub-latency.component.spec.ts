import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PubLatencyComponent } from './pub-latency.component';

describe('PubLatencyComponent', () => {
  let component: PubLatencyComponent;
  let fixture: ComponentFixture<PubLatencyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PubLatencyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PubLatencyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
