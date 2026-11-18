import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import { DecodeHintType, NotFoundException } from '@zxing/library';
import { finalize } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { AsistenciaService, IngresoResult, MetodoRegistro } from '../../shared/services/asistencia.service';
import { normalizeRole } from '../../core/auth/roles';

type ViewState = 'scanner' | 'loading' | 'result' | 'permission-error' | 'error';
type CameraCapabilities = MediaTrackCapabilities & { focusMode?: string[]; torch?: boolean };

@Component({ selector: 'app-semaforo-qr', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './semaforo-qr.html', styleUrl: './semaforo-qr.css' })
export class SemaforoQrComponent implements OnDestroy {
  @ViewChild('video') video?: ElementRef<HTMLVideoElement>;
  @ViewChild('resultHeading') resultHeading?: ElementRef<HTMLElement>;
  private readonly api = inject(AsistenciaService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private reader?: BrowserQRCodeReader;
  private controls?: IScannerControls;
  private locked = false;
  private lastPayload = '';
  private lastReadAt = 0;

  state: ViewState = 'scanner';
  dni = '';
  error = '';
  result?: IngresoResult;
  cameraStarted = false;
  torchAvailable = false;
  torchEnabled = false;
  readonly isDtPortal = normalizeRole(this.auth.getRol()) === 'dt';

  async startCamera(): Promise<void> {
    this.stopCamera();
    this.state = 'loading';
    this.error = '';
    try {
      const hints = new Map<DecodeHintType, unknown>([[DecodeHintType.TRY_HARDER, true]]);
      this.reader = new BrowserQRCodeReader(hints, { delayBetweenScanAttempts: 180, delayBetweenScanSuccess: 800 });
      await new Promise((resolve) => setTimeout(resolve));
      if (!this.video) throw new Error('Visor no disponible');
      this.controls = await this.reader.decodeFromConstraints(
        { audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } } },
        this.video.nativeElement,
        (value, scanError) => {
          if (value) this.handleDetectedPayload(value.getText());
          if (scanError && !(scanError instanceof NotFoundException)) {
            this.error = 'No se pudo interpretar la imagen. Mantené el QR dentro del recuadro.';
          }
        },
      );
      await this.optimizeCameraTrack();
      this.cameraStarted = true;
      this.state = 'scanner';
    } catch (cameraError) {
      this.stopCamera();
      this.state = 'permission-error';
      this.error = cameraError instanceof DOMException && cameraError.name === 'NotAllowedError'
        ? 'El permiso de cámara fue rechazado. Habilitalo en el navegador.'
        : 'No se pudo acceder a la cámara. Revisá el permiso del navegador y usá HTTPS o localhost.';
    }
  }

  async toggleTorch(): Promise<void> {
    const track = this.cameraTrack();
    if (!track || !this.torchAvailable) return;
    const nextValue = !this.torchEnabled;
    try {
      await track.applyConstraints({ advanced: [{ torch: nextValue } as MediaTrackConstraintSet] });
      this.torchEnabled = nextValue;
    } catch {
      this.error = 'La linterna no está disponible en este dispositivo.';
    }
  }

  submitManual(): void { this.processPayload(this.dni, 'DNI_MANUAL'); }
  retry(): void {
    this.result = undefined;
    this.error = '';
    this.dni = '';
    this.locked = false;
    this.lastPayload = '';
    this.state = 'scanner';
    void this.startCamera();
  }
  logout(): void { this.stopCamera(); this.auth.logout(); location.assign('/login'); }
  returnToDtPortal(): void {
    this.stopCamera();
    void this.router.navigate(['/dt']);
  }
  ngOnDestroy(): void { this.stopCamera(); }

  private handleDetectedPayload(payload: string): void {
    const normalized = payload.trim();
    const now = Date.now();
    if (this.locked || !normalized) return;
    if (normalized === this.lastPayload && now - this.lastReadAt < 5000) return;
    this.lastPayload = normalized;
    this.lastReadAt = now;
    this.processPayload(normalized, 'QR');
  }

  private processPayload(payload: string, metodoRegistro: MetodoRegistro): void {
    const identificador = metodoRegistro === 'QR' ? payload.trim() : (payload.match(/\d{7,9}/)?.[0] ?? '').trim();
    if (!identificador) { this.error = 'El código QR o DNI no es válido.'; this.state = 'error'; return; }
    this.locked = true;
    this.stopCamera();
    this.state = 'loading';
    this.api.registrar(identificador, metodoRegistro).pipe(finalize(() => this.locked = false)).subscribe({
      next: (response) => {
        if (!response.asistenciaRegistrada && !response.yaRegistrada) { this.error = 'El servidor no confirmó el registro del intento de ingreso.'; this.state = 'error'; return; }
        this.result = response;
        this.state = 'result';
        setTimeout(() => this.resultHeading?.nativeElement.focus());
      },
      error: (requestError) => { this.error = requestError?.error?.message ?? 'No se pudo registrar el ingreso.'; this.state = 'error'; },
    });
  }

  private async optimizeCameraTrack(): Promise<void> {
    const track = this.cameraTrack();
    if (!track) return;
    const capabilities = track.getCapabilities?.() as CameraCapabilities | undefined;
    this.torchAvailable = capabilities?.torch === true;
    if (capabilities?.focusMode?.includes('continuous')) {
      try {
        await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet] });
      } catch { /* Some browsers advertise this capability but reject the constraint. */ }
    }
  }

  private cameraTrack(): MediaStreamTrack | undefined {
    const stream = this.video?.nativeElement.srcObject as MediaStream | null;
    return stream?.getVideoTracks()[0];
  }

  private stopCamera(): void {
    this.controls?.stop();
    this.controls = undefined;
    this.cameraStarted = false;
    this.torchAvailable = false;
    this.torchEnabled = false;
    const stream = this.video?.nativeElement.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    if (this.video) this.video.nativeElement.srcObject = null;
  }
}
