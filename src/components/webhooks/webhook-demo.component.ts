
import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface WebhookEvent {
  id: string;
  resourceType: string;
  resourceId: string;
  eventType: 'create' | 'update' | 'delete';
  timestamp: Date;
}

@Component({
  selector: 'app-webhook-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './webhook-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WebhookDemoComponent {
  webhookUrl = signal('https://api.example.com/webhook-receiver');
  subscriptions = signal<string[]>([]);
  events = signal<WebhookEvent[]>([]);

  constructor() {
    // Simulate receiving webhook events
    setInterval(() => {
      this.addMockEvent();
    }, 5000);
  }

  addSubscription() {
    if (this.webhookUrl().trim() && !this.subscriptions().includes(this.webhookUrl())) {
      this.subscriptions.update(s => [...s, this.webhookUrl()]);
    }
  }

  addMockEvent() {
    if (this.subscriptions().length === 0) return;

    const resourceTypes = ['Patient', 'Appointment', 'Procedure'];
    const eventTypes: Array<'create' | 'update' | 'delete'> = ['create', 'update', 'delete'];
    const newEvent: WebhookEvent = {
      id: `evt_${Date.now()}`,
      resourceType: resourceTypes[Math.floor(Math.random() * resourceTypes.length)],
      resourceId: Math.random().toString(36).substring(2, 10),
      eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      timestamp: new Date()
    };
    this.events.update(e => [newEvent, ...e.slice(0, 9)]); // Keep last 10 events
  }

  getEventClass(eventType: string) {
    switch (eventType) {
      case 'create': return 'bg-green-100 border-green-500';
      case 'update': return 'bg-yellow-100 border-yellow-500';
      case 'delete': return 'bg-red-100 border-red-500';
      default: return 'bg-gray-100 border-gray-500';
    }
  }
}
