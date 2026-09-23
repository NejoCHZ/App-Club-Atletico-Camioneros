import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-popup-credencial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-popup-credencial.html',
  styleUrl: './admin-popup-credencial.css'
})
export class AdminPopupCredencial {
  @Input() isVisible = false;
  @Input() nombre = 'Nombre y apellido';
  @Input() documento = 'Documento Nro';

  @Output() close = new EventEmitter<void>();
  @Output() descargar = new EventEmitter<void>();

  onCancelar() {
    this.close.emit();
  }

  onDescargar() {
    this.descargar.emit();
    this.close.emit();
  }
}
