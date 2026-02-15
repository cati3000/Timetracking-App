import { TestBed } from '@angular/core/testing';
import { LogFilterComponent } from './log-filter.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LogApiService } from '../../services/log-api.service';

describe('LogFilterComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LogFilterComponent, HttpClientTestingModule], // Standalone + HttpClientTestingModule
      providers: [LogApiService],
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(LogFilterComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});