import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import { DecodeHintType, NotFoundException } from '@zxing/library';
import { finalize } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { AsistenciaService, IngresoResult, MetodoRegistro } from '../../shared/services/asistencia.service';

type ViewState = 'scanner' | 'loading' | 'result' | 'permission-error' | 'error';
type CameraCapabilities = MediaTrackCapabilities & { focusMode?: string[]; torch?: boolean };

@Component({ selector: 'app-semaforo-qr', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './semaforo-qr.html', styleUrl: './semaforo-qr.css' })
export class SemaforoQrComponent implements OnDestroy {
  @ViewChild('video') video?: ElementRef<HTMLVideoElement>;
  @ViewChild('resultHeading') resultHeading?: ElementRef<HTMLElement>;
  private readonly api = inject(AsistenciaService);
  private readonly auth = inject(AuthService);
  private reader?: BrowserQRCodeReader;
  private controls?: IScannerControls;
  private locked = false;
  private lastPayload = '';
  private lastReadAt = 0;
  // Se incrementa con cada "Volver": una respuesta que llega tarde de un ingreso anterior se ignora.
  private ronda = 0;
  private iniciandoCamara = false;

  state: ViewState = 'scanner';
  dni = '';
  error = '';
  result?: IngresoResult;
  cameraStarted = false;
  torchAvailable = false;
  torchEnabled = false;

  // La pantalla está libre si no se está registrando un ingreso ni mostrando un resultado.
  private libre(): boolean { return this.state !== 'loading' && this.state !== 'result'; }

  async startCamera(): Promise<void> {
    // Activar la cámara NO bloquea la pantalla: "Procesando…" es solo para cuando se registra un ingreso. Así se puede
    // seguir ingresando el documento a mano mientras el navegador espera el permiso de la cámara.
    if (this.iniciandoCamara) return;
    this.iniciandoCamara = true;
    this.stopCamera();
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
      if (this.libre()) this.state = 'scanner';
    } catch (cameraError) {
      this.stopCamera();
      if (this.libre()) {
        this.state = 'permission-error';
        this.error = cameraError instanceof DOMException && cameraError.name === 'NotAllowedError'
          ? 'El permiso de cámara fue rechazado. Habilitalo en el navegador.'
          : 'No se pudo acceder a la cámara. Revisá el permiso del navegador y usá HTTPS o localhost.';
      }
    } finally {
      this.iniciandoCamara = false;
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

  // Verde: al día. Amarillo: con un mes de deuda o ingreso sin verificar la deuda. Rojo: sin acceso (inhabilitado o dado de baja).
  get tono(): 'green' | 'yellow' | 'red' {
    const r = this.result;
    if (!r || !r.accesoPermitido) return 'red';
    return r.verificado === false || r.estado === 'solo_entrenamientos' ? 'yellow' : 'green';
  }
  get titulo(): string {
    const r = this.result;
    if (!r) return '';
    if (!r.accesoPermitido) return r.estado === 'baja' ? 'Jugador dado de baja' : 'Jugador inhabilitado';
    if (r.verificado === false) return '¡Ingreso sin verificar!';
    if (r.yaRegistrada) return 'Ya registrado hoy';
    return r.estado === 'solo_entrenamientos' ? '¡Jugador con deuda!' : '¡Registro exitoso!';
  }
  get icono(): string { return this.tono === 'green' ? '✓' : this.tono === 'yellow' ? '!' : '×'; }

  submitManual(): void { this.processPayload(this.dni, 'DNI_MANUAL'); }
  retry(): void {
    this.ronda++;
    this.result = undefined;
    this.error = '';
    this.dni = '';
    this.locked = false;
    this.lastPayload = '';
    this.state = 'scanner';
    void this.startCamera();
  }
  logout(): void { this.stopCamera(); this.auth.logout(); location.assign('/login'); }
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
    const ronda = this.ronda;
    this.api.registrar(identificador, metodoRegistro).pipe(finalize(() => this.locked = false)).subscribe({
      next: (response) => {
        if (ronda !== this.ronda) return;
        // Un acceso denegado no se registra (no hay asistencia que confirmar); uno permitido sí tiene que venir confirmado.
        if (response.accesoPermitido && !response.asistenciaRegistrada && !response.yaRegistrada) {
          this.error = 'El servidor no confirmó el registro de asistencia.';
          this.state = 'error';
          return;
        }
        this.result = response;
        this.state = 'result';
        setTimeout(() => this.resultHeading?.nativeElement.focus());
      },
      error: (requestError) => {
        if (ronda !== this.ronda) return;
        this.error = requestError?.error?.message ?? 'No se pudo registrar el ingreso.';
        this.state = 'error';
      },
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
