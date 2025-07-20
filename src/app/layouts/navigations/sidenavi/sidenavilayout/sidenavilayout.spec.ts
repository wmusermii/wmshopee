import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sidenavilayout } from './sidenavilayout';

describe('Sidenavilayout', () => {
  let component: Sidenavilayout;
  let fixture: ComponentFixture<Sidenavilayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sidenavilayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Sidenavilayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
