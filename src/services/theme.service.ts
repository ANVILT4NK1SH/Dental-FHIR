
import { Injectable, signal, effect, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  theme = signal<Theme>('light');

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      const storedTheme = localStorage.getItem('app-theme') as Theme | null;
      const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      this.theme.set(storedTheme || preferredTheme);
    }
    
    effect(() => {
        if (isPlatformBrowser(this.platformId)) {
            const currentTheme = this.theme();
            localStorage.setItem('app-theme', currentTheme);
            if (currentTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    });
  }

  toggleTheme() {
    this.theme.update(current => current === 'light' ? 'dark' : 'light');
  }
}
