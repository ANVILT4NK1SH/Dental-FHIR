
import { Injectable, signal, computed } from '@angular/core';

interface User {
  username: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = signal<User | null>(null);

  isAuthenticated = computed(() => this.currentUser() !== null);
  
  constructor() {
    // Check for a logged-in user in session storage on startup
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUser.set(JSON.parse(storedUser));
    }
  }

  login(username: string, password: string):boolean {
    // In a real application, this would be an API call to a backend server.
    // For this demo, we'll use hardcoded credentials.
    if (username.toLowerCase() === 'demo' && password === 'password') {
      const user: User = { username: 'demo', name: 'Demo User' };
      this.currentUser.set(user);
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  }

  logout(): void {
    this.currentUser.set(null);
    sessionStorage.removeItem('currentUser');
  }
}
