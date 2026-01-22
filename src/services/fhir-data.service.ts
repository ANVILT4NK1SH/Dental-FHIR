
import { Injectable, signal } from '@angular/core';

// Simplified FHIR-like Interfaces
export interface Identifier { use: string; value: string; }
export interface HumanName { text: string; }
export interface ContactPoint { system: 'phone' | 'email'; value: string; }
export interface Reference { reference: string; display: string; }
export interface CodeableConcept { coding: { system: string; code: string; }[]; text: string; }
export interface Annotation { text: string; }

export interface Patient {
  resourceType: 'Patient';
  id: string;
  identifier: Identifier[];
  name: HumanName[];
  telecom: ContactPoint[];
  birthDate: string; // YYYY-MM-DD
  note: {
      medicalHistory: string[];
      allergies: string[];
  };
  extension: {
    insurance: {
      provider: string;
      policyNumber: string;
    }
  };
}

export interface Appointment {
  resourceType: 'Appointment';
  id: string;
  status: 'booked' | 'arrived' | 'cancelled';
  start: string; // ISO string
  end: string; // ISO string
  participant: {
    actor: Reference;
    status: 'accepted' | 'declined' | 'tentative';
  }[];
}

export interface Procedure {
  resourceType: 'Procedure';
  id: string;
  status: 'in-progress' | 'completed';
  code: CodeableConcept;
  subject: Reference;
  performedDateTime: string; // ISO string
  bodySite: {
      coding: {
          system: string;
          code: string;
      }[];
  }[];
}

export interface ImagingStudy {
  resourceType: 'ImagingStudy';
  id: string;
  subject: Reference;
  modality: { system: string; code: string; };
  note: Annotation[];
  series: {
    bodySite: { system: string; code: string; display: string };
    instance: {
      uid: string;
      sopClass: { system: string; code: string; };
    }[];
  }[];
}

// Helper to generate future dates for mock data
const getFutureDate = (days: number, hour: number, minute: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(hour, minute, 0, 0);
    return date;
};

@Injectable({
  providedIn: 'root'
})
export class FhirDataService {
  patients = signal<Patient[]>([
    { 
      resourceType: 'Patient',
      id: '1', 
      name: [{ text: 'John Doe' }], 
      birthDate: '1985-05-20', 
      identifier: [{ use: 'official', value: 'P001' }],
      telecom: [{ system: 'phone', value: '555-123-4567' }, { system: 'email', value: 'john.doe@example.com' }],
      extension: { insurance: { provider: 'MetLife Dental', policyNumber: 'MET123456789' } },
      note: { medicalHistory: ['Hypertension, controlled with medication.'], allergies: ['Penicillin'] }
    },
    { 
      resourceType: 'Patient',
      id: '2', 
      name: [{ text: 'Jane Smith' }], 
      birthDate: '1992-08-15', 
      identifier: [{ use: 'official', value: 'P002' }],
      telecom: [{ system: 'phone', value: '555-987-6543' }, { system: 'email', value: 'jane.smith@example.com' }],
      extension: { insurance: { provider: 'Delta Dental', policyNumber: 'DD987654321' } },
      note: { medicalHistory: ['No significant medical history.'], allergies: [] }
    },
    { 
      resourceType: 'Patient',
      id: '3', 
      name: [{ text: 'Peter Jones' }], 
      birthDate: '1978-11-30', 
      identifier: [{ use: 'official', value: 'P003' }],
      telecom: [{ system: 'phone', value: '555-555-5555' }, { system: 'email', value: 'peter.jones@example.com' }],
      extension: { insurance: { provider: 'Cigna', policyNumber: 'CIG555444333' } },
      note: { medicalHistory: ['Type 2 Diabetes.'], allergies: ['Latex', 'Codeine'] }
    }
  ]);

  appointments = signal<Appointment[]>([
    { id: '1', resourceType: 'Appointment', participant: [{ actor: { reference: 'Patient/1', display: 'John Doe'}, status: 'accepted' }], start: '2024-08-01T09:00:00Z', end: '2024-08-01T09:30:00Z', status: 'booked' },
    { id: '2', resourceType: 'Appointment', participant: [{ actor: { reference: 'Patient/2', display: 'Jane Smith'}, status: 'accepted' }], start: '2024-08-01T10:00:00Z', end: '2024-08-01T11:00:00Z', status: 'booked' },
    { id: '3', resourceType: 'Appointment', participant: [{ actor: { reference: 'Patient/3', display: 'Peter Jones'}, status: 'accepted' }], start: '2024-08-01T11:30:00Z', end: '2024-08-01T12:00:00Z', status: 'arrived' },
    { id: '4', resourceType: 'Appointment', participant: [{ actor: { reference: 'Patient/1', display: 'John Doe'}, status: 'accepted' }], start: getFutureDate(2, 9, 0).toISOString(), end: getFutureDate(2, 10, 0).toISOString(), status: 'booked' },
    { id: '5', resourceType: 'Appointment', participant: [{ actor: { reference: 'Patient/2', display: 'Jane Smith'}, status: 'accepted' }], start: getFutureDate(2, 11, 0).toISOString(), end: getFutureDate(2, 11, 30).toISOString(), status: 'booked' },
  ]);

  procedures = signal<Procedure[]>([
    { id: '1', resourceType: 'Procedure', subject: { reference: 'Patient/1', display: 'John Doe' }, code: { coding: [{ system: 'CDT', code: 'D2740' }], text: 'Crown - porcelain/ceramic' }, bodySite: [{ coding: [{ system: 'Universal', code: '30' }] }], status: 'completed', performedDateTime: '2024-07-15T10:00:00Z' },
    { id: '2', resourceType: 'Procedure', subject: { reference: 'Patient/2', display: 'Jane Smith' }, code: { coding: [{ system: 'CDT', code: 'D1110' }], text: 'Prophylaxis - adult' }, bodySite: [{ coding: [{ system: 'Universal', code: '14' }] }], status: 'completed', performedDateTime: '2024-07-18T11:30:00Z' },
    { id: '3', resourceType: 'Procedure', subject: { reference: 'Patient/1', display: 'John Doe' }, code: { coding: [{ system: 'CDT', code: 'D0120' }], text: 'Periodic oral evaluation' }, bodySite: [{ coding: [{ system: 'Universal', code: 'N/A' }] }], status: 'in-progress', performedDateTime: getFutureDate(7, 15, 0).toISOString() },
  ]);

  imagingStudies = signal<ImagingStudy[]>([
    { id: '1', resourceType: 'ImagingStudy', subject: { reference: 'Patient/1', display: 'John Doe' }, modality: { system: 'DCM', code: 'X-Ray' }, note: [{ text: 'Periapical - Tooth #30' }], series: [{ bodySite: { system: 'SNOMED', code: '44567001', display: 'Oral' }, instance: [{ uid: '1', sopClass: { system: 'URL', code: 'https://picsum.photos/seed/img1/800/600' } }] }] },
    { id: '2', resourceType: 'ImagingStudy', subject: { reference: 'Patient/2', display: 'Jane Smith' }, modality: { system: 'DCM', code: 'CT' }, note: [{ text: 'CBCT - Full Arch' }], series: [{ bodySite: { system: 'SNOMED', code: '44567001', display: 'Oral' }, instance: [{ uid: '2', sopClass: { system: 'URL', code: 'https://picsum.photos/seed/img2/800/600' } }] }] },
  ]);

  addPatient(patientData: Omit<Patient, 'id' | 'resourceType'>) {
    const newPatient: Patient = {
      ...patientData,
      id: Date.now().toString(),
      resourceType: 'Patient'
    };
    this.patients.update(patients => [...patients, newPatient]);
  }

  updatePatient(patientId: string, updatedData: Omit<Patient, 'id' | 'resourceType'>) {
    this.patients.update(patients => 
      patients.map(p => p.id === patientId ? { ...p, ...updatedData, id: p.id, resourceType: 'Patient' } : p)
    );
  }

  deletePatient(patientId: string) {
    this.patients.update(patients => patients.filter(p => p.id !== patientId));
    this.appointments.update(appts => appts.filter(a => !a.participant.some(p => p.actor.reference === `Patient/${patientId}`)));
    this.procedures.update(procs => procs.filter(p => p.subject.reference !== `Patient/${patientId}`));
    this.imagingStudies.update(studies => studies.filter(s => s.subject.reference !== `Patient/${patientId}`));
  }

  addAppointment(appointmentData: Omit<Appointment, 'id' | 'resourceType'>) {
    const newAppointment: Appointment = {
      ...appointmentData,
      id: Date.now().toString(),
      resourceType: 'Appointment'
    };
    this.appointments.update(appointments => [...appointments, newAppointment]);
  }

  updateAppointment(appointmentId: string, updatedData: Partial<Omit<Appointment, 'id' | 'resourceType'>>) {
    this.appointments.update(appointments =>
      appointments.map(a => a.id === appointmentId ? { ...a, ...updatedData, id: a.id, resourceType: 'Appointment' } : a)
    );
  }

  deleteAppointment(appointmentId: string) {
    this.appointments.update(appointments => appointments.filter(a => a.id !== appointmentId));
  }

  addProcedure(procedureData: Omit<Procedure, 'id' | 'resourceType'>) {
    const newProcedure: Procedure = {
        ...procedureData,
        id: Date.now().toString(),
        resourceType: 'Procedure'
    };
    this.procedures.update(procedures => [...procedures, newProcedure]);
  }

  deleteProcedure(procedureId: string) {
    this.procedures.update(procedures => procedures.filter(p => p.id !== procedureId));
  }

  addImagingStudy(studyData: Omit<ImagingStudy, 'id' | 'resourceType'>) {
    const newStudy: ImagingStudy = {
      ...studyData,
      id: Date.now().toString(),
      resourceType: 'ImagingStudy',
    };
    this.imagingStudies.update(studies => [...studies, newStudy]);
  }
}
