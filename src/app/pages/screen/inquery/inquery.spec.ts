import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Inquery } from './inquery';

describe('Inquery', () => {
  let component: Inquery;
  let fixture: ComponentFixture<Inquery>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inquery]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Inquery);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
