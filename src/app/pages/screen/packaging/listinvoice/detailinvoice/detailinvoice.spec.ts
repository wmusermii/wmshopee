import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Detailinvoice } from './detailinvoice';

describe('Detailinvoice', () => {
  let component: Detailinvoice;
  let fixture: ComponentFixture<Detailinvoice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Detailinvoice]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Detailinvoice);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
