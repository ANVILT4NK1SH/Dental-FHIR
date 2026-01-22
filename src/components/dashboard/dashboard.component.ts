
import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FhirDataService, Appointment } from '../../services/fhir-data.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private fhirDataService = inject(FhirDataService);

  stats = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // In a real app, creation date would be a dedicated field. Here we simulate it from the ID.
    const oneWeekAgoTimestamp = today.getTime() - 7 * 24 * 60 * 60 * 1000;

    const appointments = this.fhirDataService.appointments();
    const patients = this.fhirDataService.patients();
    const procedures = this.fhirDataService.procedures();

    const appointmentsToday = appointments.filter(a => {
      const apptDate = new Date(a.start);
      return apptDate.getFullYear() === today.getFullYear() &&
             apptDate.getMonth() === today.getMonth() &&
             apptDate.getDate() === today.getDate();
    });

    const newPatientsThisWeek = patients.filter(p => {
        const creationTimestamp = parseInt(p.id);
        return !isNaN(creationTimestamp) && creationTimestamp >= oneWeekAgoTimestamp;
    }).length;

    const pendingProcedures = procedures.filter(p => p.status === 'in-progress').length;

    return {
      appointmentsTodayCount: appointmentsToday.length,
      newPatientsThisWeek,
      pendingProcedures,
    };
  });

  todaysAppointments = computed(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return this.fhirDataService.appointments()
      .filter(a => {
        const apptDate = new Date(a.start);
        apptDate.setHours(0,0,0,0);
        return apptDate.getTime() === today.getTime();
      })
      .sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  });

  getAppointmentStatusClass(status: string) {
    switch (status) {
      case 'booked': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
      case 'arrived': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }
}
