import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Listinvoice } from './listinvoice';

describe('Listinvoice', () => {
  let component: Listinvoice;
  let fixture: ComponentFixture<Listinvoice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Listinvoice]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Listinvoice);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
