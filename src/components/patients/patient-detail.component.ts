
import { Component, ChangeDetectionStrategy, computed, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FhirDataService, Patient, Appointment, Procedure } from '../../services/fhir-data.service';
import { ImageViewerComponent } from '../shared/image-viewer.component';
import { DatetimePickerComponent } from '../shared/datetime-picker/datetime-picker.component';
import { NotificationService } from '../../services/notification.service';
import { GeminiService } from '../../services/gemini.service';

type ActiveTab = 'details' | 'timeline';

interface TimelineItem {
    date: Date;
    type: 'Appointment' | 'Procedure' | 'Imaging';
    title: string;
    details: string;
    status?: string;
}

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ImageViewerComponent, DatetimePickerComponent],
  templateUrl: './patient-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientDetailComponent {
  private route = inject(ActivatedRoute);
  private fhirDataService = inject(FhirDataService);
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);
  private geminiService = inject(GeminiService);

  patientId = signal<string | null>(null);
  activeTab = signal<ActiveTab>('details');
  
  // Modals and state
  showEditPatientModal = signal(false);
  showAppointmentModal = signal(false);
  editingAppointment = signal<Appointment | null>(null);
  showProcedureModal = signal(false);
  editingProcedure = signal<Procedure | null>(null);
  fullscreenImageUrl = signal<string | null>(null);
  showReferralModal = signal(false);
  showExplanationModal = signal(false);
  explanation = signal<{title: string, text: string, isLoading: boolean, error?: string} | null>(null);

  // Forms
  patientForm = this.fb.group({
    name: ['', Validators.required],
    birthDate: ['', Validators.required],
    identifier: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    insuranceProvider: [''],
    policyNumber: [''],
    medicalHistory: [''],
    allergies: [''],
  });

  appointmentForm = this.fb.group({
    start: ['', Validators.required],
    end: ['', Validators.required],
    status: ['booked' as const, Validators.required],
  });

  procedureForm = this.fb.group({
    procedureCode: ['', Validators.required],
    tooth: [''],
    notation: ['Universal' as const, Validators.required],
    status: ['completed' as const, Validators.required],
    scheduledDateTime: ['', Validators.required],
  });

  referralForm = this.fb.group({
    recipientName: ['', Validators.required],
    recipientEmail: ['', [Validators.required, Validators.email]],
    reason: ['', Validators.required],
  });

  // Computed data signals
  patient = computed(() => {
    const id = this.patientId();
    if (!id) return null;
    return this.fhirDataService.patients().find(p => p.id === id) ?? null;
  });
  
  patientPhone = computed(() => {
    const p = this.patient();
    if (!p) return 'N/A';
    return p.telecom.find(t => t.system === 'phone')?.value || 'N/A';
  });

  patientEmail = computed(() => {
    const p = this.patient();
    if (!p) return 'N/A';
    return p.telecom.find(t => t.system === 'email')?.value || 'N/A';
  });

  patientAppointments = computed(() => {
    const id = this.patientId();
    if (!id) return [];
    return this.fhirDataService.appointments().filter(a => a.participant.some(p => p.actor.reference === `Patient/${id}`))
      .sort((a,b) => new Date(b.start).getTime() - new Date(a.start).getTime());
  });

  patientProcedures = computed(() => {
    const id = this.patientId();
    if (!id) return [];
    return this.fhirDataService.procedures().filter(p => p.subject.reference === `Patient/${id}`);
  });
  
  patientImagingStudies = computed(() => {
    const id = this.patientId();
    if (!id) return [];
    return this.fhirDataService.imagingStudies().filter(s => s.subject.reference === `Patient/${id}`);
  });

  timelineItems = computed<TimelineItem[]>(() => {
    const appointments = this.patientAppointments().map(a => ({
        date: new Date(a.start),
        type: 'Appointment' as const,
        title: 'Appointment',
        details: `Scheduled from ${formatDate(a.start, 'shortTime', 'en-US')} to ${formatDate(a.end, 'shortTime', 'en-US')}`,
        status: a.status
    }));

    const procedures = this.patientProcedures().map(p => ({
        date: new Date(p.performedDateTime),
        type: 'Procedure' as const,
        title: `${p.code.coding[0].code} - ${p.code.text}`,
        details: `Tooth: ${p.bodySite[0].coding[0].code}`,
        status: p.status
    }));
    
    const imaging = this.patientImagingStudies().map(i => ({
        date: new Date(parseInt(i.id)), // Using ID as timestamp for mock
        type: 'Imaging' as const,
        title: `Imaging Study - ${i.modality.code}`,
        details: i.note[0].text,
        status: 'completed'
    }));

    return [...appointments, ...procedures, ...imaging].sort((a,b) => b.date.getTime() - a.date.getTime());
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.patientId.set(params.get('id'));
    });
  }

  openEditPatientModal() {
    const p = this.patient();
    if (!p) return;
    this.patientForm.setValue({
      name: p.name[0]?.text || '',
      birthDate: p.birthDate,
      identifier: p.identifier[0]?.value || '',
      phone: this.patientPhone(),
      email: this.patientEmail(),
      insuranceProvider: p.extension.insurance.provider,
      policyNumber: p.extension.insurance.policyNumber,
      medicalHistory: p.note.medicalHistory.join(', '),
      allergies: p.note.allergies.join(', '),
    });
    this.showEditPatientModal.set(true);
  }

  updatePatient() {
    if (this.patientForm.invalid || !this.patientId()) return;
    const formValue = this.patientForm.value;
    const updatedPatient: Omit<Patient, 'id' | 'resourceType'> = {
        name: [{ text: formValue.name! }],
        birthDate: formValue.birthDate!,
        identifier: [{ use: 'official', value: formValue.identifier! }],
        telecom: [
            { system: 'phone', value: formValue.phone! },
            { system: 'email', value: formValue.email! }
        ],
        extension: { insurance: { provider: formValue.insuranceProvider!, policyNumber: formValue.policyNumber! } },
        note: {
          medicalHistory: formValue.medicalHistory ? formValue.medicalHistory.split(',').map(s => s.trim()) : [],
          allergies: formValue.allergies ? formValue.allergies.split(',').map(s => s.trim()) : [],
        }
    };
    this.fhirDataService.updatePatient(this.patientId()!, updatedPatient);
    this.showEditPatientModal.set(false);
    this.notificationService.show('Patient details updated!', 'success');
  }

  saveAppointment() {
    if (this.appointmentForm.invalid || !this.patient()) return;
    const formValue = this.appointmentForm.value;
    const patient = this.patient()!;
    const appointmentData = {
      start: new Date(formValue.start!).toISOString(),
      end: new Date(formValue.end!).toISOString(),
      status: formValue.status!,
      participant: [{
        actor: { reference: `Patient/${patient.id}`, display: patient.name[0].text },
        status: 'accepted' as const
      }]
    };
    
    const editing = this.editingAppointment();
    if (editing) {
      this.fhirDataService.updateAppointment(editing.id, appointmentData);
       this.notificationService.show('Appointment updated!', 'success');
    } else {
      this.fhirDataService.addAppointment(appointmentData);
      this.notificationService.show('Appointment created!', 'success');
    }
    this.showAppointmentModal.set(false);
  }

  sendReferral() {
    if (this.referralForm.invalid || !this.patient()) return;
    const formValue = this.referralForm.value;
    const patientData = this.patient();
    alert(`Referral for ${patientData?.name[0].text} has been securely sent to ${formValue.recipientName}.`);
    this.showReferralModal.set(false);
    this.notificationService.show('Referral sent successfully!', 'success');
  }

  async openExplanationModal(procedure: Procedure) {
    this.showExplanationModal.set(true);
    this.explanation.set({ title: procedure.code.text, text: '', isLoading: true });
    try {
        const explanationText = await this.geminiService.explainProcedure(procedure.code.coding[0].code, procedure.code.text);
        this.explanation.update(e => e ? {...e, text: explanationText, isLoading: false} : null);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.explanation.update(e => e ? {...e, error: message, isLoading: false} : null);
    }
  }

  getAppointmentStatusClass(status: string) {
    switch (status) {
      case 'booked': return 'bg-blue-100 text-blue-800';
      case 'arrived': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getTimelineIcon(type: TimelineItem['type']): string {
    switch(type) {
        case 'Appointment': return `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`;
        case 'Procedure': return `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>`;
        case 'Imaging': return `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`;
    }
  }

  getTimelineColor(type: TimelineItem['type']): string {
    switch(type) {
        case 'Appointment': return 'bg-blue-500';
        case 'Procedure': return 'bg-green-500';
        case 'Imaging': return 'bg-indigo-500';
    }
  }
}
