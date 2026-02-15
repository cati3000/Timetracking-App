import { Component, OnInit, Renderer2, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { HttpClientModule } from '@angular/common/http';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';
import { LogApiService } from '../../services/log-api.service';

@Component({
  selector: 'app-time-tracking',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    //HttpClientModule,
    MatSnackBarModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatDialogModule
  ],
  templateUrl: './time-tracking.component.html',
  styleUrls: ['./time-tracking.component.scss'],
})
export class TimeTrackingComponent implements OnInit {
  totalTimeWorked: number = 0;
  isTimerRunning: boolean = false;
  timer: any;
  clockInTime: Date | null = null;
  clockOutTime: Date | null = null;
  isPaused: boolean = false;
  isDarkTheme: boolean = false;
  selectedDate: Date = new Date();
  timeEntries: any[] = [];
  filteredEntries: any[] = [];
  loading: boolean = false;
  editingEntry: any = null;
  editStartTime: string = '';
  editEndTime: string = '';

  private readonly renderer = inject(Renderer2);
  private readonly snackBar = inject(MatSnackBar);
  private readonly logApi = inject(LogApiService);

  ngOnInit() {
    this.selectedDate = new Date();
    this.selectedDate.setHours(0, 0, 0, 0);

    this.loadEntries();
    this.filterEntries();
    this.restoreTimerState();
    this.restoreTheme();
  }

  startTimer() {
    this.clockInTime = new Date();
    this.totalTimeWorked = 0;
    this.isTimerRunning = true;
    this.isPaused = false;
    this.clockOutTime = null;
    this.timer = setInterval(() => {
      this.totalTimeWorked++;
    }, 1000);
  }

  resumeTimer() {
    this.isTimerRunning = true;
    this.isPaused = false;
    this.clockOutTime = null;
    this.timer = setInterval(() => {
      this.totalTimeWorked++;
    }, 1000);
  }

  stopTimer() {
    this.isTimerRunning = false;
    this.isPaused = true;
    this.clockOutTime = new Date();
    this.saveTimerState();
    clearInterval(this.timer);
  }

  resetTimer() {
    this.isTimerRunning = false;
    this.isPaused = false;
    this.totalTimeWorked = 0;
    this.clockInTime = null;
    this.clockOutTime = null;
    clearInterval(this.timer);
    this.saveTimerState();
  }

  saveTimerState() {
    const timerState = {
      totalTimeWorked: this.totalTimeWorked,
      isTimerRunning: this.isTimerRunning,
      clockInTime: this.clockInTime ? this.clockInTime.toISOString() : null,
      clockOutTime: this.clockOutTime ? this.clockOutTime.toISOString() : null,
      isPaused: this.isPaused
    };
    localStorage.setItem('timerState', JSON.stringify(timerState));
  }

  private formatDuration(seconds: number): string {
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

  private normalizeDate(date: Date): string {
    const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return normalized.toISOString().split('T')[0];
  }

 saveAndShowSnackBar() {
  this.saveTimerState();

  // Convert date to correct format (YYYY-MM-DD)
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0]; // Just the date part

  // Make sure duration is a valid number (required field)
  const durationValue = isNaN(this.totalTimeWorked) ? 0 : this.totalTimeWorked;

  // Format times as HH:MM:SS (24-hour format)
  const formatTime = (date: Date | null): string => {
    if (!date) return '00:00:00';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  // new time entry with necessary the fields
  const newEntry = {
    date: formattedDate,  // required
    type: "WORK",         // required enum
    startTime: formatTime(this.clockInTime),
    endTime: formatTime(this.clockOutTime),
    duration: durationValue,  // required number 
    durationSeconds: durationValue, // optional number
    durationFormatted: this.getFormattedTime(durationValue), // text
    description: `Worked for ${this.getFormattedTime(durationValue)}`, // text
    statuss: "Pending"  // text
  };

  // Log the entry for debugging
  console.log('Sending time entry:', newEntry);

  this.logApi.createTimeEntry(newEntry).subscribe({
    next: (response) => {
      console.log('Success response:', response);
      this.loadEntries();
      this.filterEntries();
      this.resetTimer(); // Reset timer after successful save
      this.showSnackBar(`Timer state has been successfully registered! You have worked for ${this.getFormattedTime(durationValue)}`);
    },
    error: (err) => {
      console.error('Error saving time entry:', err);
      if (err.error && err.error.error) {
        console.error('Specific error details:', err.error.error);
      }
      
      // Show more detailed error message
      const errorMsg = err.error?.error?.message || err.message || 'Unknown error';
      this.showSnackBar(`Failed to save time entry: ${errorMsg}`);
    }
  });
}

  showSnackBar(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      verticalPosition: 'top'
    });
  }

  restoreTimerState() {
    const timerState = localStorage.getItem('timerState');
    if (timerState) {
      const state = JSON.parse(timerState);
      this.totalTimeWorked = Number(state.totalTimeWorked) || 0;
      this.isTimerRunning = state.isTimerRunning;
      this.clockInTime = state.clockInTime ? new Date(state.clockInTime) : null;
      this.clockOutTime = state.clockOutTime ? new Date(state.clockOutTime) : null;
      this.isPaused = state.isPaused;

      if (this.isTimerRunning) {
        this.timer = setInterval(() => {
          this.totalTimeWorked++;
        }, 1000);
      }
    }
  }

  getFormattedTime(seconds: number): string {
    const totalSeconds = Number(seconds);
    if (isNaN(totalSeconds)) return '00:00:00';

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;

    const paddedHours = hours < 10 ? '0' + hours : hours;
    const paddedMinutes = minutes < 10 ? '0' + minutes : minutes;
    const paddedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds;

    return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
  }

  restoreTheme() {
    const timerState = localStorage.getItem('timerState');
    if (timerState) {
      const state = JSON.parse(timerState);
      this.totalTimeWorked = Number(state.totalTimeWorked) || 0;
      const theme = localStorage.getItem('theme');
      if (theme === 'dark') {
        this.isDarkTheme = true;
        this.renderer.addClass(document.body, 'dark-theme');
      }
    }
  }

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    if (this.isDarkTheme) {
      this.renderer.addClass(document.body, 'dark-theme');
    } else {
      this.renderer.removeClass(document.body, 'dark-theme');
    }
    localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
  }

  loadEntries() {
    this.loading = true;
    this.logApi.getTimeEntries().subscribe({
      next: (response) => {
        console.log('Time entries response:', response);
        // Backend returns { success: true, data: [...] }
        // Each item in data is already the full object: { id, date, type, duration, ... }
        const entries = response?.data || [];
        this.timeEntries = entries;
        this.loading = false;
        this.filterEntries();
      },
      error: (err) => {
        console.error('Error loading entries:', err);
        this.timeEntries = [];
        this.loading = false;
      }
    });
  }

  filterEntries() {
    console.log('Filtering entries. Total entries:', this.timeEntries.length);
    console.log('Selected date:', this.selectedDate);
    
    if (this.selectedDate) {
      // Format date locally to avoid timezone issues
      const year = this.selectedDate.getFullYear();
      const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(this.selectedDate.getDate()).padStart(2, '0');
      const selectedDateStr = `${year}-${month}-${day}`;

      console.log('Selected date string:', selectedDateStr);

      this.filteredEntries = this.timeEntries.filter(entry => {
        const entryDateStr = entry.date;
        console.log('Entry date:', entryDateStr, 'Match:', entryDateStr === selectedDateStr);
        return entryDateStr === selectedDateStr;
      });
      
      console.log('Filtered entries count:', this.filteredEntries.length);
    } else {
      this.filteredEntries = [];
    }
  }

  startEdit(entry: any) {
    this.editingEntry = entry;
    // Use full HH:MM:SS format for input type="time" with step="1"
    this.editStartTime = entry.startTime || '00:00:00';
    this.editEndTime = entry.endTime || '00:00:00';
  }

  cancelEdit() {
    this.editingEntry = null;
    this.editStartTime = '';
    this.editEndTime = '';
  }

  saveEdit() {
    if (!this.editStartTime || !this.editEndTime) {
      this.showSnackBar('Please enter both start and end times');
      return;
    }

    const duration = this.calculateDurationFromTime(this.editStartTime, this.editEndTime);
    if (duration < 0) {
      this.showSnackBar('End time must be after start time');
      return;
    }

    const updatedEntry = {
      date: this.editingEntry.date,
      type: this.editingEntry.type || 'WORK',
      startTime: this.editStartTime,
      endTime: this.editEndTime,
      duration: duration,
      durationSeconds: duration,
      durationFormatted: this.getFormattedTime(duration),
      description: this.editingEntry.description || '',
      statuss: this.editingEntry.statuss || 'Pending',
      email: this.editingEntry.email || ''
    };

    console.log('Updating entry ID:', this.editingEntry.id, 'with data:', updatedEntry);

    this.logApi.updateTimeEntry(this.editingEntry.id, updatedEntry).subscribe({
      next: (response) => {
        console.log('Update successful:', response);
        this.cancelEdit();
        this.loadEntries();
        this.showSnackBar('Entry updated successfully');
      },
      error: (err) => {
        console.error('Update error:', err);
        const errorMsg = err.error?.error?.message || err.message || 'Unknown error';
        this.showSnackBar(`Failed to update: ${errorMsg}`);
      }
    });
  }

  calculateDurationFromTime(startTime: string, endTime: string): number {
    const parseTime = (timeStr: string): number => {
      const parts = timeStr.split(':').map(Number);
      return parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);
    };
    
    return parseTime(endTime) - parseTime(startTime);
  }

  deleteEntry(entry: any) {
    if (!entry.id) {
      this.showSnackBar('Entry ID missing!');
      return;
    }
    this.logApi.deleteTimeEntry(entry.id).subscribe({
      next: () => {
        this.loadEntries();
        this.showSnackBar('Entry deleted successfully');
      },
      error: () => {
        this.showSnackBar('Failed to delete entry!');
      }
    });
  }
}