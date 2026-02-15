import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LogApiService } from '../../services/log-api.service';

export interface PtoRequest {
  ptoDate: string;
  submittedOn: string;
  reason: string;
  statuss: 'Pending' | 'Approved' | 'Rejected';
}

@Injectable({
  providedIn: 'root'
})
export class PtoService {
  private _ptoDays = new BehaviorSubject<PtoRequest[]>([]);
  private _usedPtoDays = new BehaviorSubject<number>(0);
  private _loading = new BehaviorSubject<boolean>(false);
  readonly totalPtoDays = 26;

  ptoDays$ = this._ptoDays.asObservable();
  usedPtoDays$ = this._usedPtoDays.asObservable();
  loading$ = this._loading.asObservable();

  constructor(private logApi: LogApiService) {}

  fetchPtoDays(): void {
    this._loading.next(true);
    this.logApi.getPtoDays().subscribe({
      next: (response) => {
        const raw = response.data || response;
        const ptoDays = (raw || []).map((item: any) => ({
          ptoDate: item.attributes?.ptoDate || item.ptoDate,
          submittedOn: item.attributes?.submittedOn || item.submittedOn,
          reason: item.attributes?.reason || item.reason,
          statuss: item.attributes?.statuss || item.statuss,
        }));
        this._ptoDays.next(ptoDays);
        this._usedPtoDays.next(Math.min(ptoDays.length, this.totalPtoDays));
        this._loading.next(false);
      },
      error: () => {
        this._ptoDays.next([]);
        this._usedPtoDays.next(0);
        this._loading.next(false);
      }
    });
  }

  submitPto(ptoRequest: PtoRequest, onSuccess?: () => void, onError?: (err: any) => void): void {
    this.logApi.createPtoDay(ptoRequest).subscribe({
      next: (response) => {
        this.fetchPtoDays();
        if (onSuccess) onSuccess();
      },
      error: (err) => {
        if (onError) onError(err);
      }
    });
  }
}