
import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FhirDataService, Appointment } from '../../services/fhir-data.service';
import { DatetimePickerComponent } from '../shared/datetime-picker/datetime-picker.component';
import { NotificationService } from '../../services/notification.service';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  appointments: Appointment[];
}

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatetimePickerComponent],
  templateUrl: './appointment-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppointmentListComponent {
  private fhirDataService = inject(FhirDataService);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);

  private allAppointments = this.fhirDataService.appointments;
  patients = this.fhirDataService.patients;
  
  showAppointmentModal = signal(false);
  editingAppointment = signal<Appointment | null>(null);

  viewDate = signal(new Date());
  selectedDate = signal(new Date());
  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  calendarGrid = computed<CalendarDay[][]>(() => {
    const appointments = this.allAppointments();
    const date = this.viewDate();
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

    const endDate = new Date(lastDayOfMonth);
    endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()));

    const grid: CalendarDay[][] = [];
    let week: CalendarDay[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      if (currentDate.getDay() === 0 && week.length > 0) {
        grid.push(week);
        week = [];
      }
      
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const dayAppointments = appointments.filter(a => {
        const apptDate = new Date(a.start);
        return apptDate.getFullYear() === currentDate.getFullYear() &&
               apptDate.getMonth() === currentDate.getMonth() &&
               apptDate.getDate() === currentDate.getDate();
      });

      week.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.getTime() === today.getTime(),
        appointments: dayAppointments
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }
    grid.push(week);

    return grid;
  });

  appointmentsForSelectedDate = computed(() => {
    const selected = this.selectedDate();
    selected.setHours(0,0,0,0);
    
    return this.allAppointments()
      .filter(a => {
        const apptDate = new Date(a.start);
        apptDate.setHours(0,0,0,0);
        return apptDate.getTime() === selected.getTime();
      })
      .sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  });


  appointmentForm = this.fb.group({
    patientId: ['', Validators.required],
    start: ['', Validators.required],
    end: ['', Validators.required],
    status: ['booked' as const, Validators.required],
  });

  changeMonth(offset: number) {
    this.viewDate.update(d => {
      const newDate = new Date(d);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  }

  selectDate(date: Date) {
    this.selectedDate.set(date);
    this.viewDate.set(date);
  }

  goToToday() {
    const today = new Date();
    this.selectedDate.set(today);
    this.viewDate.set(today);
  }

  openNewAppointmentModal() {
    this.editingAppointment.set(null);
    const selected = this.selectedDate();
    // Default to a valid time slot today or selected date
    const now = new Date();
    if (selected.getFullYear() === now.getFullYear() && selected.getMonth() === now.getMonth() && selected.getDate() === now.getDate() && now.getHours() >= 9) {
      selected.setHours(now.getHours(), Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
    } else {
      selected.setHours(9,0,0,0);
    }

    this.appointmentForm.reset({ 
      patientId: '',
      start: selected.toISOString(), 
      end: '',
      status: 'booked'
    });
    this.showAppointmentModal.set(true);
  }
  
  openEditAppointmentModal(appointment: Appointment) {
    this.editingAppointment.set(appointment);
    const patientParticipant = appointment.participant.find(p => p.actor.reference.startsWith('Patient/'));
    
    this.appointmentForm.setValue({
      patientId: patientParticipant ? patientParticipant.actor.reference.split('/')[1] : '',
      start: appointment.start,
      end: appointment.end,
      status: appointment.status,
    });
    this.showAppointmentModal.set(true);
  }

  saveAppointment() {
    if (this.appointmentForm.invalid) {
      return;
    }
    const formValue = this.appointmentForm.value;
    const editing = this.editingAppointment();
    const patient = this.patients().find(p => p.id === formValue.patientId!);
    if (!patient) return;

    const appointmentData = {
      start: new Date(formValue.start!).toISOString(),
      end: new Date(formValue.end!).toISOString(),
      status: formValue.status!,
      participant: [{
        actor: {
          reference: `Patient/${patient.id}`,
          display: patient.name[0].text
        },
        status: 'accepted' as const
      }]
    };

    if (editing) {
      this.fhirDataService.updateAppointment(editing.id, appointmentData);
      this.notificationService.show('Appointment updated successfully!', 'success');
    } else {
      this.fhirDataService.addAppointment(appointmentData);
      this.notificationService.show('Appointment created successfully!', 'success');
    }
    this.showAppointmentModal.set(false);
  }

  deleteAppointment(id: string) {
    if (confirm('Are you sure you want to delete this appointment?')) {
      this.fhirDataService.deleteAppointment(id);
       this.notificationService.show('Appointment deleted.', 'info');
    }
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'booked': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'arrived': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }
}
