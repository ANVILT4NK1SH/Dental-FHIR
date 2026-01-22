
import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-viewer.component.html',
  styleUrl: './image-viewer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageViewerComponent {
  imageUrl = input.required<string>();
  close = output<void>();

  onClose() {
    this.close.emit();
  }
}
