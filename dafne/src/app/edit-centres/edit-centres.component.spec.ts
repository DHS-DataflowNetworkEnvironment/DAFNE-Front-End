import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCentresComponent } from './edit-centres.component';

describe('EditCentresComponent', () => {
  let component: EditCentresComponent;
  let fixture: ComponentFixture<EditCentresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCentresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditCentresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
