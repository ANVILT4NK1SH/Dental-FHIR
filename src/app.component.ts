
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { NotificationComponent } from './components/shared/notifications/notification.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationComponent]
})
export class AppComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private themeService = inject(ThemeService);

  isAuthenticated = this.authService.isAuthenticated;
  currentTheme = this.themeService.theme;

  navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/patients', label: 'Patients' },
    { path: '/appointments', label: 'Appointments' },
    { path: '/procedures', label: 'Procedures' },
    { path: '/imaging', label: 'Imaging' },
    { path: '/webhooks', label: 'Webhooks' },
  ];

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
