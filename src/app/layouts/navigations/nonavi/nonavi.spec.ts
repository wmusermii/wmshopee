import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Nonavi } from './nonavi';

describe('Nonavi', () => {
  let component: Nonavi;
  let fixture: ComponentFixture<Nonavi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Nonavi]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Nonavi);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
