import { Component, inject, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { LogApiService } from '../../services/log-api.service'; // Import the service
import { forkJoin } from 'rxjs'; // Add this import
import { HttpClientModule } from '@angular/common/http';


interface LogEntry {
  date: Date;
  type: 'WORK' | 'PTO';
  startTime?: string;
  endTime?: string;
  duration: number;
  durationSeconds?: number;
  durationFormatted?: string;
  description?: string;
  statuss?: string;
}

@Component({
  selector: 'app-log-filter',
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
    MatIconModule,
    MatSelectModule,
  ],
  templateUrl: './log-filter.component.html',
  styleUrls: ['./log-filter.component.scss'],
  //providers: [LogApiService] // Provide the service here or in the module
})
export class LogFilterComponent {
  startDate: Date | null;
  endDate: Date | null;
  sortOrder: 'asc' | 'desc' = 'asc';
  filteredLogs: LogEntry[] = [];
  isDarkTheme: boolean = false;
  loading: boolean = false;  // Add loading state

  private readonly snackBar = inject(MatSnackBar);
  private renderer = inject(Renderer2);
  private logApi = inject(LogApiService);

  constructor() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.startDate = today;
    this.endDate = today;

    this.isDarkTheme = localStorage.getItem('theme') === 'dark';
    this.applyTheme();
  }

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
    this.applyTheme();
  }
  private applyTheme() {
    if (this.isDarkTheme) {
      this.renderer.addClass(document.body, 'dark-theme');
    } else {
      this.renderer.removeClass(document.body, 'dark-theme');
    }
  }
  formatSeconds(seconds: number): string {
    if (seconds === undefined || seconds === null || isNaN(seconds)) {
      return '0s';
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  filterLogs(): void {
    if (!this.startDate || !this.endDate) {
      this.snackBar.open('Please select both start and end dates', 'Close', { duration: 3000 });
      return;
    }

    const startStr = this.startDate.toISOString().split('T')[0];
    const endStr = this.endDate.toISOString().split('T')[0];

    this.loading = true;

    forkJoin({
      timeEntries: this.logApi.getTimeEntries(startStr, endStr),
      ptoDays: this.logApi.getPtoDays(startStr, endStr)
    }).subscribe({
      next: (results) => {
        // Log raw results for debugging
        console.log('Raw time entries response:', results.timeEntries);
        console.log('Raw PTO days response:', results.ptoDays);

        // Extract data 
        const timeEntries = results.timeEntries?.data || [];
        const ptoDays = results.ptoDays?.data || [];
        
        const mergedTimeline: LogEntry[] = [];

        // Process time entries
        timeEntries.forEach((entry: any) => {
          const data = entry.attributes || entry;
          
          mergedTimeline.push({
            date: new Date(data.date),
            type: 'WORK',
            startTime: data.startTime || '',
            endTime: data.endTime || '',
            duration: data.duration || 0,
            durationSeconds: data.durationSeconds || data.duration || 0,
            durationFormatted: data.durationFormatted || '',
            description: data.description || '',
            statuss: data.statuss || 'Completed'
          });
        });

        // Process PTO days
        ptoDays.forEach((pto: any) => {
          const data = pto.attributes || pto;
          
          mergedTimeline.push({
            date: new Date(data.ptoDate),
            type: 'PTO',
            startTime: 'All Day',
            endTime: '',
            duration: 8 * 3600, // 8 hour workday in seconds
            durationFormatted: '8h 0m 0s',
            description: data.reason,
            statuss: data.statuss
          });
        });

        if (this.sortOrder === 'asc') {
          mergedTimeline.sort((a, b) => a.date.getTime() - b.date.getTime());
        } else {
          mergedTimeline.sort((a, b) => b.date.getTime() - a.date.getTime());
        }

        this.filteredLogs = mergedTimeline;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading data:', err);
        this.snackBar.open('Error fetching logs from server', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }
}