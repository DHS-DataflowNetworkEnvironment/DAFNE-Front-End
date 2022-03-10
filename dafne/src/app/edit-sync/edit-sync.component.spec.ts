import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditSyncComponent } from './edit-sync.component';

describe('EditSyncComponent', () => {
  let component: EditSyncComponent;
  let fixture: ComponentFixture<EditSyncComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditSyncComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSyncComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
