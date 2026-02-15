import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { HttpClientModule } from '@angular/common/http';
import { PtoService, PtoRequest } from './pto.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pto',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    //HttpClientModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatIconModule,
  ],
  templateUrl: './pto.component.html',
  styleUrls: ['./pto.component.scss'],
  providers: [PtoService] // <-- Add this line if you still get injection errors
})
export class PtoComponent implements OnInit, OnDestroy {
  totalPtoDays = 26;
  usedPtoDays = 0;
  ptoDays: PtoRequest[] = [];
  showReasonDialog = false;
  tempDate: Date | null = null;
  ptoReason: string = '';
  isDarkTheme = false;
  loading: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(private ptoService: PtoService) {
    const savedTheme = localStorage.getItem('isDarkTheme');
    if (savedTheme) {
      this.isDarkTheme = JSON.parse(savedTheme);
      this.applyTheme();
    }
  }

  ngOnInit() {
    this.subscriptions.push(
      this.ptoService.ptoDays$.subscribe((val: PtoRequest[]) => this.ptoDays = val),
      this.ptoService.usedPtoDays$.subscribe((val: number) => this.usedPtoDays = val),
      this.ptoService.loading$.subscribe((val: boolean) => this.loading = val)
    );
    this.ptoService.fetchPtoDays();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }

  openReasonDialog() {
    this.showReasonDialog = true;
  }

  fetchPtoDays() {
    this.ptoService.fetchPtoDays();
  }

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem('isDarkTheme', JSON.stringify(this.isDarkTheme));
    this.applyTheme();
  }

  private applyTheme() {
    if (this.isDarkTheme) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  get remainingDays(): number {
    return this.totalPtoDays - this.usedPtoDays;
  }

  get progressPercentage(): number {
    return (this.usedPtoDays / this.totalPtoDays) * 100;
  }

  closeDialogIfClickedOutside(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.showReasonDialog = false;
    }
  }

  submitPto() {
    if (!this.tempDate || !this.ptoReason) {
      console.log('Please select a date and provide a reason for your PTO request');
      return;
    }

    const formattedPtoDate = this.tempDate.toISOString().split('T')[0];
    const submittedOnDate = new Date().toISOString().split('T')[0];

    const ptoRequest: PtoRequest = {
      ptoDate: formattedPtoDate,
      submittedOn: submittedOnDate,
      reason: this.ptoReason,
      statuss: 'Pending'
    };

    this.ptoService.submitPto(
      ptoRequest,
      () => {
        this.tempDate = null;
        this.ptoReason = '';
        this.showReasonDialog = false;
      },
      (err: any) => {
        console.error('Error creating PTO:', err);
        if (err.error && err.error.error) {
          console.error('Specific error details:', err.error.error);
        }
        console.error(`Failed to submit PTO request: ${err.error?.error?.message || err.message || 'Unknown error'}`);
      }
    );
  }
}