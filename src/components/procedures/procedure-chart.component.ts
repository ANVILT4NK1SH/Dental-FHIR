
import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { FhirDataService, Procedure } from '../../services/fhir-data.service';
import { DatetimePickerComponent } from '../shared/datetime-picker/datetime-picker.component';
import { NotificationService } from '../../services/notification.service';
import { GeminiService } from '../../services/gemini.service';

type Notation = 'Universal' | 'FDI';
interface Suggestion {
  procedureCode: string;
  justification: string;
}

@Component({
  selector: 'app-procedure-chart',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DatetimePickerComponent],
  templateUrl: './procedure-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProcedureChartComponent {
  private fhirDataService = inject(FhirDataService);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);
  private geminiService = inject(GeminiService);

  notation = signal<Notation>('Universal');
  selectedTooth = signal<string | null>(null);

  // AI Assistant state
  aiDescription = signal('');
  aiSuggestion = signal<Suggestion | null>(null);
  isAiLoading = signal(false);
  aiError = signal<string | null>(null);

  patients = this.fhirDataService.patients;
  private allProcedures = this.fhirDataService.procedures;
  
  procedures = computed(() => {
    return this.allProcedures().sort((a,b) => new Date(b.performedDateTime).getTime() - new Date(a.performedDateTime).getTime());
  });

  procedureForm = this.fb.group({
    patientId: ['', Validators.required],
    procedureCode: ['', Validators.required],
    tooth: [{value: '', disabled: true}, Validators.required],
    scheduledDateTime: ['', Validators.required],
  });
  
  universalUpper = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  universalLower = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];
  fdiUpper = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  fdiLower = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

  get upperArch() {
    return this.notation() === 'Universal' ? this.universalUpper : this.fdiUpper;
  }

  get lowerArch() {
    return this.notation() === 'Universal' ? this.universalLower : this.fdiLower;
  }
  
  selectTooth(tooth: number) {
    const toothStr = tooth.toString();
    this.selectedTooth.set(toothStr);
    this.procedureForm.get('tooth')?.setValue(toothStr);
  }

  setNotation(newNotation: Notation) {
    this.notation.set(newNotation);
    this.selectedTooth.set(null);
    this.procedureForm.get('tooth')?.reset('');
  }

  saveProcedure() {
    if (this.procedureForm.invalid) return;

    const formValue = this.procedureForm.getRawValue();
    const patient = this.patients().find(p => p.id === formValue.patientId!);
    if (!patient) return;

    const procedureData = {
      status: 'completed' as const, // Assuming procedures added here are completed
      subject: {
        reference: `Patient/${patient.id}`,
        display: patient.name[0].text,
      },
      code: {
        coding: [{
          system: 'http://www.ada.org/cdt',
          code: formValue.procedureCode!,
        }],
        text: `Procedure code ${formValue.procedureCode!}`
      },
      bodySite: [{
        coding: [{
          system: this.notation() === 'Universal' ? 'http://terminology.hl7.org/CodeSystem/FDI-oral-teeth-adult' : 'http://example.org/FDI-tooth-numbers',
          code: formValue.tooth!
        }]
      }],
      performedDateTime: new Date(formValue.scheduledDateTime!).toISOString()
    };
    
    this.fhirDataService.addProcedure(procedureData);
    this.procedureForm.reset();
    this.selectedTooth.set(null);
    this.notificationService.show('Procedure added successfully!', 'success');
  }

  deleteProcedure(id: string) {
    if (confirm('Are you sure you want to delete this procedure?')) {
      this.fhirDataService.deleteProcedure(id);
      this.notificationService.show('Procedure deleted.', 'info');
    }
  }

  async getAiSuggestion() {
    if (!this.aiDescription().trim()) {
      this.aiError.set('Please enter a description of the dental observation.');
      return;
    }

    this.isAiLoading.set(true);
    this.aiSuggestion.set(null);
    this.aiError.set(null);

    try {
      const resultJson = await this.geminiService.suggestProcedure(this.aiDescription());
      const parsedResult = JSON.parse(resultJson);
      this.aiSuggestion.set(parsedResult);
      this.procedureForm.patchValue({ procedureCode: parsedResult.procedureCode });
      this.notificationService.show('AI suggestion applied!', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      this.aiError.set(errorMessage);
    } finally {
      this.isAiLoading.set(false);
    }
  }
}
