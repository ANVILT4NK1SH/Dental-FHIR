
import { Component, ChangeDetectionStrategy, forwardRef, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isDisabled: boolean;
}

interface TimeSlot {
  display: string; // e.g., '8:00 AM'
  value: string;   // e.g., '08:00'
}

@Component({
  selector: 'app-datetime-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './datetime-picker.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatetimePickerComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class DatetimePickerComponent implements ControlValueAccessor {
  @ViewChild('container') containerRef!: ElementRef;

  isOpen = signal(false);
  
  // Internal state for the picker's value
  private selectedDateTime = signal<Date | null>(null);
  
  // State for the calendar UI
  viewDate = signal(new Date());
  selectedDate = signal<Date | null>(null);
  selectedTime = signal<string | null>(null); // Stored as 'HH:mm'
  weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  timeSlots: TimeSlot[] = this.generateTimeSlots();

  calendarGrid = computed<CalendarDay[][]>(() => {
    const date = this.viewDate();
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

    const endDate = new Date(lastDayOfMonth);
    if (endDate.getDay() !== 6) {
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    }
    
    const grid: CalendarDay[][] = [];
    let week: CalendarDay[] = [];
    let currentDate = new Date(startDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    while (currentDate <= endDate) {
        if (currentDate.getDay() === 0 && week.length > 0) {
            grid.push(week);
            week = [];
        }
        week.push({
            date: new Date(currentDate),
            isCurrentMonth: currentDate.getMonth() === month,
            isDisabled: new Date(currentDate) < today,
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }
    if (week.length > 0) {
        grid.push(week);
    }

    return grid;
  });

  displayValue = computed(() => {
    const dt = this.selectedDateTime();
    return dt ? formatDate(dt, 'MMM d, y, h:mm a', 'en-US') : 'Select date & time...';
  });

  isToday = computed(() => {
    const selected = this.selectedDate();
    if (!selected) return false;
    const today = new Date();
    return selected.getFullYear() === today.getFullYear() &&
           selected.getMonth() === today.getMonth() &&
           selected.getDate() === today.getDate();
  });

  // ControlValueAccessor implementation
  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    if (value && !isNaN(new Date(value).getTime())) {
      const date = new Date(value);
      this.selectedDateTime.set(date);
      this.selectedDate.set(date);
      this.viewDate.set(date);
      this.selectedTime.set(formatDate(date, 'HH:mm', 'en-US'));
    } else {
      this.selectedDateTime.set(null);
      this.selectedDate.set(null);
      this.selectedTime.set(null);
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // Component logic
  onDocumentClick(event: MouseEvent) {
    if (this.isOpen() && !this.containerRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  togglePicker() {
    this.isOpen.update(open => !open);
    if (!this.isOpen()) {
      this.onTouched();
    }
  }

  changeMonth(offset: number) {
    this.viewDate.update(d => {
      const newDate = new Date(d);
      newDate.setDate(1); // Avoids issues with different month lengths
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  }

  selectDate(date: Date) {
    this.selectedDate.set(date);
    this.updateValue();
  }

  selectTime(time: TimeSlot) {
    this.selectedTime.set(time.value);
    this.updateValue();
    this.isOpen.set(false);
    this.onTouched();
  }
  
  isTimeDisabled(timeValue: string): boolean {
    if (!this.isToday()) {
        return false;
    }
    const now = new Date();
    const currentTime = formatDate(now, 'HH:mm', 'en-US');
    return timeValue < currentTime;
  }

  private updateValue() {
    const date = this.selectedDate();
    const time = this.selectedTime();

    if (date && time) {
      const [hours, minutes] = time.split(':').map(Number);
      const newDateTime = new Date(date);
      newDateTime.setHours(hours, minutes, 0, 0);
      
      this.selectedDateTime.set(newDateTime);
      this.onChange(newDateTime.toISOString());
    }
  }

  private generateTimeSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    for (let h = 8; h < 17; h++) {
        for (let m = 0; m < 60; m += 15) {
            if (h === 16 && m > 45) continue;
            
            const hour24 = h;
            const minute = m.toString().padStart(2, '0');

            const ampm = hour24 >= 12 ? 'PM' : 'AM';
            let hour12 = hour24 % 12;
            if (hour12 === 0) { // Handle midnight and noon
                hour12 = 12;
            }

            slots.push({
              display: `${hour12}:${minute} ${ampm}`,
              value: `${hour24.toString().padStart(2, '0')}:${minute}`
            });
        }
    }
    return slots;
  }
}