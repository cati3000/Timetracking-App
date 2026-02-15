import { TestBed } from '@angular/core/testing';
import { LogApiService, LogEntry, PtoRequest } from './log-api.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { API_BASE } from '../../config/api-base';

describe('LogApiService', () => {
  let service: LogApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LogApiService]
    });
    service = TestBed.inject(LogApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create a PTO day with correct JSON', () => {
    const mockPto: PtoRequest = {//checks that creating a PTO day sends the right POST request
      ptoDate: '2025-07-01',
      submittedOn: '2025-06-25T10:00:00Z',
      reason: 'Holiday',
      statuss: 'Pending'
    };

    service.createPtoDay(mockPto).subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne(`${API_BASE}/api/pto-days`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ data: mockPto });
    req.flush({ success: true });
  });

  it('should create a time entry and add default fields if missing', () => {
    const formEntry: Partial<LogEntry> = {//checks that missing fields are added and the right POST request is sent
      date: new Date('2025-06-25'),
      duration: 3600
    };

    service.createTimeEntry({ ...formEntry }).subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne(`${API_BASE}/api/time-entries`);
    expect(req.request.method).toBe('POST');
    // Should have type and statuss fields
    expect(req.request.body.data.type).toBe('WORK');
    expect(req.request.body.data.statuss).toBe('Pending');
    expect(req.request.body.data.duration).toBe(3600);
    req.flush({ success: true });
  });

  it('should get logs', () => {//checks that a GET request is made to fetch logs
    service.getLogs().subscribe(response => {
      expect(response).toEqual([{ id: 1 }]);
    });

    const req = httpMock.expectOne(`${API_BASE}/api/logs`);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1 }]);
  });

  it('should delete a log by id', () => {//checks that a DELETE request is made to remove a log
    service.deleteLog(123).subscribe(response => {
      expect(response).toEqual({ deleted: true });
    });

    const req = httpMock.expectOne(`${API_BASE}/api/logs/123`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ deleted: true });
  });

  it('should update a log by id', () => {//checks that a PUT request is made to update a log
    const update: Partial<LogEntry> = { description: 'Updated' };
    service.updateLog(123, update).subscribe(response => {
      expect(response).toEqual({ updated: true });
    });

    const req = httpMock.expectOne(`${API_BASE}/api/logs/123`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ data: update });
    req.flush({ updated: true });
  });
});