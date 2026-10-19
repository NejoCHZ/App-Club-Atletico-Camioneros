import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { finalize } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { AsistenciaService, IngresoResult } from '../../shared/services/asistencia.service';

type ViewState = 'scanner'|'loading'|'result'|'permission-error'|'error';
@Component({selector:'app-semaforo-qr',standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./semaforo-qr.html',styleUrl:'./semaforo-qr.css'})
export class SemaforoQrComponent implements OnDestroy {
  @ViewChild('video') video?: ElementRef<HTMLVideoElement>;
  @ViewChild('resultHeading') resultHeading?: ElementRef<HTMLElement>;
  private readonly api=inject(AsistenciaService); private readonly auth=inject(AuthService);
  private reader?:BrowserMultiFormatReader; private controls?:IScannerControls; private locked=false;
  state:ViewState='scanner'; dni=''; error=''; result?:IngresoResult; cameraStarted=false;
  async startCamera():Promise<void>{
    this.stopCamera(); this.state='loading'; this.error='';
    try{ this.reader=new BrowserMultiFormatReader(); await new Promise(r=>setTimeout(r));
      if(!this.video) throw new Error('Visor no disponible');
      this.controls=await this.reader.decodeFromConstraints({audio:false,video:{facingMode:{ideal:'environment'}}},this.video.nativeElement,(value)=>{if(value&&!this.locked)this.processPayload(value.getText())});
      this.cameraStarted=true; this.state='scanner';
    }catch{this.state='permission-error';this.error='No se pudo acceder a la cámara. Revisá el permiso del navegador y usá HTTPS o localhost.'}
  }
  // Verde: al día. Amarillo: con un mes de deuda o ingreso sin verificar la deuda. Rojo: sin acceso (inhabilitado o dado de baja).
  get tono():'green'|'yellow'|'red'{const r=this.result;if(!r||!r.accesoPermitido)return 'red';return r.verificado===false||r.estado==='solo_entrenamientos'?'yellow':'green'}
  get titulo():string{const r=this.result;if(!r)return '';if(!r.accesoPermitido)return r.estado==='baja'?'Jugador dado de baja':'Jugador inhabilitado';if(r.verificado===false)return '¡Ingreso sin verificar!';return r.estado==='solo_entrenamientos'?'¡Jugador con deuda!':'¡Registro exitoso!'}
  get icono():string{return this.tono==='green'?'✓':this.tono==='yellow'?'!':'×'}
  submitManual():void{this.processPayload(this.dni)}
  retry():void{this.result=undefined;this.error='';this.dni='';this.locked=false;this.state='scanner';void this.startCamera()}
  logout():void{this.stopCamera();this.auth.logout();location.assign('/login')}
  ngOnDestroy():void{this.stopCamera()}
  private processPayload(payload:string):void{const dni=(payload.match(/\d{7,9}/)?.[0]??'').trim();if(!dni){this.error='El código QR o DNI no es válido.';this.state='error';return}this.locked=true;this.stopCamera();this.state='loading';this.api.registrar(dni).pipe(finalize(()=>this.locked=false)).subscribe({next:r=>{if(r.accesoPermitido&&!r.asistenciaRegistrada&&!r.yaRegistrada){this.error='El servidor no confirmó el registro de asistencia.';this.state='error';return}this.result=r;this.state='result';setTimeout(()=>this.resultHeading?.nativeElement.focus())},error:e=>{this.error=e?.error?.message??'No se pudo registrar el ingreso.';this.state='error'}})}
  private stopCamera():void{this.controls?.stop();this.controls=undefined;this.cameraStarted=false;this.video?.nativeElement.srcObject&&Array.from((this.video.nativeElement.srcObject as MediaStream).getTracks()).forEach(t=>t.stop())}
}
