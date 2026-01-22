
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../services/notification.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationComponent {
  notificationService = inject(NotificationService);
  private sanitizer = inject(DomSanitizer);
  notifications = this.notificationService.notifications;

  getIcon(type: 'success' | 'error' | 'info'): SafeHtml {
    let svg = '';
    switch (type) {
      case 'success': 
        svg = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
        break;
      case 'error': 
        svg = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
        break;
      case 'info': 
        svg = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
        break;
    }
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  getContainerClass(type: 'success' | 'error' | 'info'): string {
     switch (type) {
      case 'success': return 'bg-green-100 border-green-400 text-green-700 dark:bg-green-900/50 dark:border-green-600 dark:text-green-200';
      case 'error': return 'bg-red-100 border-red-400 text-red-700 dark:bg-red-900/50 dark:border-red-600 dark:text-red-200';
      case 'info': return 'bg-blue-100 border-blue-400 text-blue-700 dark:bg-blue-900/50 dark:border-blue-600 dark:text-blue-200';
    }
  }

  close(id: number) {
    this.notificationService.hide(id);
  }
}
