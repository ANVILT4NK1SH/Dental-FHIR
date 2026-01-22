
import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FhirDataService, Patient } from '../../services/fhir-data.service';
import { NotificationService } from '../../services/notification.service';

type SortableColumn = 'identifier' | 'name' | 'birthDate';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './patient-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientListComponent {
  private fhirDataService = inject(FhirDataService);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);

  private patients = this.fhirDataService.patients;
  showAddPatientModal = signal(false);

  // Search and Sort State
  searchTerm = signal('');
  sortColumn = signal<SortableColumn>('name');
  sortDirection = signal<SortDirection>('asc');

  filteredAndSortedPatients = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const column = this.sortColumn();
    const direction = this.sortDirection();

    let filtered = this.patients();

    // 1. Filter by search term
    if (term) {
      filtered = filtered.filter(p => 
        (p.name[0]?.text || '').toLowerCase().includes(term) || 
        (p.identifier[0]?.value || '').toLowerCase().includes(term)
      );
    }

    // 2. Sort the filtered results
    return [...filtered].sort((a, b) => {
      const aValue = column === 'name' ? (a.name[0]?.text || '') : column === 'identifier' ? (a.identifier[0]?.value || '') : a.birthDate;
      const bValue = column === 'name' ? (b.name[0]?.text || '') : column === 'identifier' ? (b.identifier[0]?.value || '') : b.birthDate;
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  });

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
  
  onSearchTermChange(term: string) {
    this.searchTerm.set(term);
  }

  changeSort(column: SortableColumn) {
    if (this.sortColumn() === column) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  openAddPatientModal() {
    this.patientForm.reset();
    this.showAddPatientModal.set(true);
  }

  addPatient() {
    if (this.patientForm.invalid) {
      return;
    }
    const formValue = this.patientForm.value;
    const newPatient = {
      name: [{ text: formValue.name! }],
      birthDate: formValue.birthDate!,
      identifier: [{ use: 'official', value: formValue.identifier! }],
      telecom: [
        { system: 'phone', value: formValue.phone! },
        { system: 'email', value: formValue.email! }
      ],
      extension: {
        insurance: {
          provider: formValue.insuranceProvider || 'N/A',
          policyNumber: formValue.policyNumber || 'N/A'
        }
      },
      note: {
        medicalHistory: formValue.medicalHistory ? formValue.medicalHistory.split(',').map(s => s.trim()) : [],
        allergies: formValue.allergies ? formValue.allergies.split(',').map(s => s.trim()) : [],
      }
    };
    
    this.fhirDataService.addPatient(newPatient);
    this.showAddPatientModal.set(false);
    this.notificationService.show('Patient added successfully!', 'success');
  }

  deletePatient(id: string) {
    if (confirm('Are you sure you want to delete this patient and all their records?')) {
      this.fhirDataService.deletePatient(id);
      this.notificationService.show('Patient deleted.', 'info');
    }
  }
}
