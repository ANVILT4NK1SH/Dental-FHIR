
import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  notifications = signal<Notification[]>([]);
  private nextId = 0;

  show(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 4000) {
    const id = this.nextId++;
    const notification: Notification = { id, message, type };
    this.notifications.update(current => [...current, notification]);

    setTimeout(() => this.hide(id), duration);
  }

  hide(id: number) {
    this.notifications.update(current => current.filter(n => n.id !== id));
  }
}
