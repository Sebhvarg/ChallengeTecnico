import { Component, OnInit, ViewChild, TemplateRef, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditoriaService } from '../../core/services/auditoria.service';
import { LogService } from '../../core/services/log.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuditoriaItem, AuditoriaStats } from '../../core/models/auditoria.models';
import { LogItem, LogStats } from '../../core/models/log.models';
import { TableComponent, TableColumn } from '../../shared/components/table';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, TableComponent, ModalComponent],
  templateUrl: './logs.component.html'
})
export class LogsComponent implements OnInit {
  private auditoriaService = inject(AuditoriaService);
  private logService = inject(LogService);
  public authService = inject(AuthService);
  private notify = inject(NotificationService);

  // Selector de Pestaña: 'auditoria' (por usuario) o 'servidor' (trazas técnicas)
  tabActiva = signal<'auditoria' | 'servidor'>('auditoria');

  // --- Estado de Auditoría de Usuarios ---
  auditorias = signal<AuditoriaItem[]>([]);
  statsAuditoria = signal<AuditoriaStats>({ total: 0, creaciones: 0, ediciones: 0, desactivaciones: 0, iniciosSesion: 0 });
  cargandoAuditoria = signal<boolean>(false);
  totalRegistrosAuditoria = signal<number>(0);
  totalPaginasAuditoria = signal<number>(1);

  filtroAuditoria = '';
  moduloAuditoria = 'TODOS';
  accionAuditoria = 'TODOS';
  paginaAuditoria = 1;
  tamanoPaginaAuditoria = 10;

  // --- Estado de Logs del Servidor ---
  logsServidor = signal<LogItem[]>([]);
  statsServidor = signal<LogStats>({ total: 0, errores: 0, advertencias: 0, informacion: 0 });
  cargandoServidor = signal<boolean>(false);
  totalRegistrosServidor = signal<number>(0);
  totalPaginasServidor = signal<number>(1);

  filtroServidor = '';
  nivelServidor = 'TODOS';
  paginaServidor = 1;
  tamanoPaginaServidor = 12;

  // Modal de Detalle de Log
  mostrarModalDetalle = signal<boolean>(false);
  logSeleccionado: LogItem | null = null;

  // Templates de Auditoría
  @ViewChild('idAuditTpl', { static: true }) idAuditTpl!: TemplateRef<any>;
  @ViewChild('fechaAuditTpl', { static: true }) fechaAuditTpl!: TemplateRef<any>;
  @ViewChild('usuarioAuditTpl', { static: true }) usuarioAuditTpl!: TemplateRef<any>;
  @ViewChild('moduloAuditTpl', { static: true }) moduloAuditTpl!: TemplateRef<any>;
  @ViewChild('accionAuditTpl', { static: true }) accionAuditTpl!: TemplateRef<any>;
  @ViewChild('detalleAuditTpl', { static: true }) detalleAuditTpl!: TemplateRef<any>;
  @ViewChild('ipAuditTpl', { static: true }) ipAuditTpl!: TemplateRef<any>;

  // Templates de Logs de Servidor
  @ViewChild('idLogTpl', { static: true }) idLogTpl!: TemplateRef<any>;
  @ViewChild('fechaLogTpl', { static: true }) fechaLogTpl!: TemplateRef<any>;
  @ViewChild('nivelLogTpl', { static: true }) nivelLogTpl!: TemplateRef<any>;
  @ViewChild('mensajeLogTpl', { static: true }) mensajeLogTpl!: TemplateRef<any>;
  @ViewChild('accionesLogTpl', { static: true }) accionesLogTpl!: TemplateRef<any>;

  columnasAuditoria: TableColumn<AuditoriaItem>[] = [];
  columnasServidor: TableColumn<LogItem>[] = [];

  ngOnInit(): void {
    this.configurarColumnas();
    this.cargarAuditoria();
    this.cargarEstadisticasAuditoria();
  }

  configurarColumnas(): void {
    this.columnasAuditoria = [
      { key: 'id', header: 'ID', template: this.idAuditTpl, width: '70px', align: 'center' },
      { key: 'fecha', header: 'Fecha y Hora', template: this.fechaAuditTpl, width: '160px' },
      { key: 'usuario', header: 'Usuario Responsable', template: this.usuarioAuditTpl, width: '200px' },
      { key: 'modulo', header: 'Módulo', template: this.moduloAuditTpl, width: '130px', align: 'center' },
      { key: 'accion', header: 'Acción', template: this.accionAuditTpl, width: '150px', align: 'center' },
      { key: 'detalle', header: 'Detalle de la Operación', template: this.detalleAuditTpl },
      { key: 'ip', header: 'IP', template: this.ipAuditTpl, width: '110px', align: 'center' }
    ];

    this.columnasServidor = [
      { key: 'id', header: 'ID', template: this.idLogTpl, width: '70px', align: 'center' },
      { key: 'fecha', header: 'Fecha y Hora', template: this.fechaLogTpl, width: '180px' },
      { key: 'nivel', header: 'Nivel', template: this.nivelLogTpl, width: '100px', align: 'center' },
      { key: 'mensaje', header: 'Mensaje del Evento / Petición HTTP', template: this.mensajeLogTpl },
      { key: 'acciones', header: 'Detalle', template: this.accionesLogTpl, width: '100px', align: 'center' }
    ];
  }

  cambiarTab(tab: 'auditoria' | 'servidor'): void {
    this.tabActiva.set(tab);
    if (tab === 'auditoria') {
      this.cargarAuditoria();
      this.cargarEstadisticasAuditoria();
    } else {
      this.cargarLogsServidor();
      this.cargarEstadisticasServidor();
    }
  }

  // --- Operaciones de Auditoría de Usuario ---
  cargarAuditoria(): void {
    this.cargandoAuditoria.set(true);
    this.auditoriaService.getAuditoria(
      this.filtroAuditoria,
      this.moduloAuditoria,
      this.accionAuditoria,
      this.paginaAuditoria,
      this.tamanoPaginaAuditoria
    ).subscribe({
      next: (res) => {
        if (res.exito && res.datos) {
          this.auditorias.set(res.datos.items);
          this.totalRegistrosAuditoria.set(res.datos.totalRegistros);
          this.totalPaginasAuditoria.set(res.datos.totalPaginas);
        }
        this.cargandoAuditoria.set(false);
      },
      error: () => this.cargandoAuditoria.set(false)
    });
  }

  cargarEstadisticasAuditoria(): void {
    this.auditoriaService.getEstadisticas().subscribe({
      next: (res) => {
        if (res.exito && res.datos) {
          this.statsAuditoria.set(res.datos);
        }
      }
    });
  }

  buscarAuditoria(): void {
    this.paginaAuditoria = 1;
    this.cargarAuditoria();
  }

  limpiarFiltroAuditoria(): void {
    this.filtroAuditoria = '';
    this.moduloAuditoria = 'TODOS';
    this.accionAuditoria = 'TODOS';
    this.paginaAuditoria = 1;
    this.cargarAuditoria();
  }

  cambiarPaginaAuditoria(p: number): void {
    if (p >= 1 && p <= this.totalPaginasAuditoria()) {
      this.paginaAuditoria = p;
      this.cargarAuditoria();
    }
  }

  // --- Operaciones de Logs de Servidor ---
  cargarLogsServidor(): void {
    this.cargandoServidor.set(true);
    this.logService.getLogs(this.filtroServidor, this.nivelServidor, this.paginaServidor, this.tamanoPaginaServidor).subscribe({
      next: (res) => {
        if (res.exito && res.datos) {
          this.logsServidor.set(res.datos.items);
          this.totalRegistrosServidor.set(res.datos.totalRegistros);
          this.totalPaginasServidor.set(res.datos.totalPaginas);
        }
        this.cargandoServidor.set(false);
      },
      error: () => this.cargandoServidor.set(false)
    });
  }

  cargarEstadisticasServidor(): void {
    this.logService.getEstadisticas().subscribe({
      next: (res) => {
        if (res.exito && res.datos) {
          this.statsServidor.set(res.datos);
        }
      }
    });
  }

  filtrarPorNivel(nivel: string): void {
    this.nivelServidor = nivel;
    this.paginaServidor = 1;
    this.cargarLogsServidor();
  }

  buscarServidor(): void {
    this.paginaServidor = 1;
    this.cargarLogsServidor();
  }

  limpiarFiltroServidor(): void {
    this.filtroServidor = '';
    this.nivelServidor = 'TODOS';
    this.paginaServidor = 1;
    this.cargarLogsServidor();
  }

  cambiarPaginaServidor(p: number): void {
    if (p >= 1 && p <= this.totalPaginasServidor()) {
      this.paginaServidor = p;
      this.cargarLogsServidor();
    }
  }

  verDetalleLog(item: LogItem): void {
    this.logSeleccionado = item;
    this.mostrarModalDetalle.set(true);
  }

  async limpiarLogsServidor(): Promise<void> {
    const ok = await this.notify.confirm(
      '¿Limpiar registros de servidor?',
      'Esta acción vaciará el contenido de los archivos de log actuales del servidor.'
    );

    if (ok) {
      this.logService.limpiarLogs().subscribe({
        next: () => {
          this.notify.success('Archivos de logs limpiados exitosamente.');
          this.cargarLogsServidor();
          this.cargarEstadisticasServidor();
        }
      });
    }
  }

  descargarTxt(): void {
    const ahora = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const fechaStr = `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}_${pad(ahora.getHours())}-${pad(ahora.getMinutes())}-${pad(ahora.getSeconds())}`;

    if (this.tabActiva() === 'auditoria') {
      const items = this.auditorias();
      if (!items || items.length === 0) {
        this.notify.warning('No hay registros de auditoría en pantalla para descargar.');
        return;
      }

      let contenido = '================================================================================\n';
      contenido += '                    REGISTRO DE AUDITORÍA Y ACTIVIDAD DE USUARIOS\n';
      contenido += ` Fecha de Exportación: ${ahora.toLocaleString()}\n`;
      contenido += ` Total de Registros en Pantalla: ${items.length} (Página ${this.paginaAuditoria} de ${this.totalPaginasAuditoria()})\n`;
      contenido += ` Filtro de Búsqueda: ${this.filtroAuditoria || '(Ninguno)'}\n`;
      contenido += ` Módulo Filtrado: ${this.moduloAuditoria}\n`;
      contenido += ` Acción Filtrada: ${this.accionAuditoria}\n`;
      contenido += '================================================================================\n\n';

      items.forEach((item, index) => {
        contenido += `[#${index + 1}] ID: ${item.id} | Fecha: ${new Date(item.fecha).toLocaleString()} | IP: ${item.ip || '127.0.0.1'}\n`;
        contenido += `     Usuario: @${item.usuario} (${item.rol})\n`;
        contenido += `     Módulo : ${item.modulo}\n`;
        contenido += `     Acción : ${item.accion}\n`;
        contenido += `     Detalle: ${item.detalle}\n`;
        contenido += '--------------------------------------------------------------------------------\n';
      });

      this.guardarArchivo(contenido, `auditoria_usuarios_${fechaStr}.txt`);
      this.notify.success('Archivo .txt de auditoría descargado exitosamente.');
    } else {
      const items = this.logsServidor();
      if (!items || items.length === 0) {
        this.notify.warning('No hay registros de logs de servidor en pantalla para descargar.');
        return;
      }

      let contenido = '================================================================================\n';
      contenido += '                    REGISTRO DE LOGS Y TRAZAS DEL SERVIDOR\n';
      contenido += ` Fecha de Exportación: ${ahora.toLocaleString()}\n`;
      contenido += ` Total de Registros en Pantalla: ${items.length} (Página ${this.paginaServidor} de ${this.totalPaginasServidor()})\n`;
      contenido += ` Filtro de Búsqueda: ${this.filtroServidor || '(Ninguno)'}\n`;
      contenido += ` Nivel Filtrado: ${this.nivelServidor}\n`;
      contenido += '================================================================================\n\n';

      items.forEach((item, index) => {
        contenido += `[#${index + 1}] [${item.nivel}] ${new Date(item.fecha).toISOString()} (ID: ${item.id})\n`;
        contenido += `     Mensaje: ${item.mensaje}\n`;
        if (item.excepcion) {
          contenido += `     Excepción / Stack Trace:\n${item.excepcion}\n`;
        }
        contenido += '--------------------------------------------------------------------------------\n';
      });

      this.guardarArchivo(contenido, `logs_servidor_${fechaStr}.txt`);
      this.notify.success('Archivo .txt de logs descargado exitosamente.');
    }
  }

  private guardarArchivo(texto: string, nombreArchivo: string): void {
    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
