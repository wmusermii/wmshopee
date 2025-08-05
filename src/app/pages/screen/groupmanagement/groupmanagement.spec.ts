import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Groupmanagement } from './groupmanagement';

describe('Groupmanagement', () => {
  let component: Groupmanagement;
  let fixture: ComponentFixture<Groupmanagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Groupmanagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Groupmanagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
