
import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FhirDataService } from '../../services/fhir-data.service';
import { ImageViewerComponent } from '../shared/image-viewer.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-imaging-study',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageViewerComponent],
  templateUrl: './imaging-study.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImagingStudyComponent {
  private fhirDataService = inject(FhirDataService);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);

  studies = this.fhirDataService.imagingStudies;
  patients = this.fhirDataService.patients;
  
  selectedFile = signal<File | null>(null);
  fullscreenImageUrl = signal<string | null>(null);

  imagingForm = this.fb.group({
    patientId: ['', Validators.required],
    modality: ['', Validators.required],
  });

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile.set(input.files[0]);
    }
  }

  uploadStudy(): void {
    if (this.imagingForm.invalid || !this.selectedFile()) {
      return;
    }
    
    const formValue = this.imagingForm.value;
    const patient = this.patients().find(p => p.id === formValue.patientId!);
    if (!patient) return;

    const newStudy = {
      subject: {
        reference: `Patient/${patient.id}`,
        display: patient.name[0].text
      },
      modality: {
        system: "http://dicom.nema.org/resources/ontology/DCM",
        code: formValue.modality!,
      },
      note: [{
        text: this.selectedFile()?.name || 'New Image',
      }],
      series: [{
          bodySite: {
            system: "http://snomed.info/sct",
            code: "44567001",
            display: "Oral region"
          },
          instance: [{
              uid: `urn:oid:${Date.now()}`,
              sopClass: {
                  system: "urn:ietf:rfc:3986",
                  code: `https://picsum.photos/seed/img${Date.now()}/800/600`
              }
          }]
      }]
    };
    
    this.fhirDataService.addImagingStudy(newStudy);
    this.notificationService.show('Imaging study uploaded!', 'success');

    this.imagingForm.reset();
    this.selectedFile.set(null);
    // This is a workaround to clear the file input visually, as its value is read-only
    const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
    }
  }
}
