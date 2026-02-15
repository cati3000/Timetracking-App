import { TestBed } from '@angular/core/testing';
import { PtoComponent } from './pto.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LogApiService } from '../../services/log-api.service';

describe('PtoComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PtoComponent, HttpClientTestingModule], // Standalone + HttpClientTestingModule
      providers: [LogApiService],
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PtoComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});