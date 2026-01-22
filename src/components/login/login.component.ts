
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  error = signal<string | null>(null);

  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  login(): void {
    this.error.set(null);
    if (this.loginForm.invalid) {
      return;
    }

    const { username, password } = this.loginForm.value;
    const success = this.authService.login(username!, password!);

    if (success) {
      this.router.navigate(['/dashboard']);
    } else {
      this.error.set('Invalid username or password. Please try again.');
    }
  }
}
