import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DhsCompletenessComponent } from './dhs-completeness.component';

describe('DhsCompletenessComponent', () => {
  let component: DhsCompletenessComponent;
  let fixture: ComponentFixture<DhsCompletenessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DhsCompletenessComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DhsCompletenessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
