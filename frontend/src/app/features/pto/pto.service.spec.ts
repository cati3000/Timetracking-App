import { TestBed } from '@angular/core/testing';
import { PtoService, PtoRequest } from './pto.service';
import { LogApiService } from '../../services/log-api.service';
import { of, throwError } from 'rxjs';

describe('PtoService', () => {
  let service: PtoService;
  let logApiSpy: jasmine.SpyObj<LogApiService>;

  beforeEach(() => {//
    const spy = jasmine.createSpyObj('LogApiService', ['getPtoDays', 'createPtoDay']);
    TestBed.configureTestingModule({
      providers: [
        PtoService,
        { provide: LogApiService, useValue: spy }
      ]
    });
    service = TestBed.inject(PtoService);
    logApiSpy = TestBed.inject(LogApiService) as jasmine.SpyObj<LogApiService>;
  });

  it('should fetch PTO days and update state', (done) => {
    const mockBackendData = {// checks that fetching PTO days updates the state correctly
      data: [
        {
          attributes: {
            ptoDate: '2025-06-25',
            submittedOn: '2025-06-24T12:00:00Z',
            reason: 'Vacation',
            statuss: 'Pending'
          }
        }
      ]
    };
    logApiSpy.getPtoDays.and.returnValue(of(mockBackendData));// Mock the backend response

    service.fetchPtoDays();

    service.ptoDays$.subscribe((days) => {
      expect(days.length).toBe(1);
      expect(days[0].reason).toBe('Vacation');
      done();
    });
  });

  it('should submit PTO and call backend with correct JSON', (done) => {
    const formInput: PtoRequest = {// checks that submitting PTO calls the backend with the correct data
      ptoDate: '2025-07-01',
      submittedOn: '2025-06-25T10:00:00Z',
      reason: 'Family event',
      statuss: 'Pending'
    };
    logApiSpy.createPtoDay.and.returnValue(of({ success: true }));
    logApiSpy.getPtoDays.and.returnValue(of({ data: [] }));

    const onSuccess = jasmine.createSpy('onSuccess');
    const onError = jasmine.createSpy('onError');

    service.submitPto(formInput, onSuccess, onError);

    setTimeout(() => {
      expect(logApiSpy.createPtoDay).toHaveBeenCalledWith(formInput);
      expect(onSuccess).toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
      done();
    }, 0);
  });

  it('should call onError if backend returns error', (done) => {
    const formInput: PtoRequest = {// checks that if the backend returns an error, onError is called
      ptoDate: '2025-07-01',
      submittedOn: '2025-06-25T10:00:00Z',
      reason: 'Family event',
      statuss: 'Pending'
    };
    const backendError = { error: 'Backend error' };
    logApiSpy.createPtoDay.and.returnValue(throwError(() => backendError));

    const onSuccess = jasmine.createSpy('onSuccess');
    const onError = jasmine.createSpy('onError');

    service.submitPto(formInput, onSuccess, onError);

    setTimeout(() => {
      expect(logApiSpy.createPtoDay).toHaveBeenCalledWith(formInput);
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(backendError);
      done();
    }, 0);
  });
});