// Estado
const AuditState = {
  logs: [],
  filtrados: [],
  pagina: 1,
  porPagina: 15,
};

// Fetch helper
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.mensaje || `Error ${res.status}`);
  return data;
}

// Campos que NO deben llevar separadores de miles (IDs, documentos, teléfonos)
const camposSinFormato = [
  'numero_documento', 'dni', 'telefono', 'celular', 'ruc',
  'id_cliente', 'id_empleado', 'id_producto', 'id_venta',
  'id_caja', 'id_turno', 'id_rol', 'id_cargo', 'id_config',
  'registro_id', 'id_auditoria', 'id_usuario', 'id_orden',
  'id_transferencia', 'id_lote', 'id_proveedor', 'id_categoria',
  'id_subcategoria', 'id_marca', 'id_unidad', 'id_serie',
  'id_tipo_pago', 'id_movimiento', 'id_contacto', 'id_devolucion'
];

// Etiquetas amigables para campos comunes
const campoLabels = {
  'id_producto': 'ID Producto',
  'id_venta': 'ID Venta',
  'id_empleado': 'ID Empleado',
  'id_cliente': 'ID Cliente',
  'id_caja': 'ID Caja',
  'id_turno': 'ID Turno',
  'nombre': 'Nombre',
  'codigo': 'Código',
  'descripcion': 'Descripción',
  'precio_compra': 'Precio Compra',
  'precio_venta': 'Precio Venta',
  'stock_actual': 'Stock Actual',
  'stock_minimo': 'Stock Mínimo',
  'stock_maximo': 'Stock Máximo',
  'ubicacion': 'Ubicación',
  'activo': 'Activo',
  'monto_real': 'Monto Real',
  'observacion': 'Observación',
  'estado': 'Estado',
  'numero_documento': 'Número Documento',
  'tipo_documento': 'Tipo Documento',
  'telefono': 'Teléfono',
  'correo': 'Correo',
  'hora_inicio': 'Hora Inicio',
  'hora_fin': 'Hora Fin',
  'turno': 'Turno',
  'permisos': 'Permisos',
  'direccion': 'Dirección',
  'web': 'Sitio Web',
  'condicion_pago': 'Condición de Pago',
  'es_principal': 'Principal',
  'cargo': 'Cargo',
  'es_preferido': 'Preferido',
  'tiempo_entrega_dias': 'Tiempo Entrega (días)',
  'codigo_proveedor': 'Código Proveedor',
  'numero_lote': 'Número Lote',
  'fecha_vencimiento': 'Fecha Vencimiento',
  'cantidad': 'Cantidad',
  'monto_inicial': 'Monto Inicial',
  'monto_esperado': 'Monto Esperado',
  'diferencia': 'Diferencia',
  'cerrado_por': 'Cerrado Por',
  'fecha_apertura': 'Fecha Apertura',
  'fecha_cierre': 'Fecha Cierre',
  'fecha_cierre_programada': 'Fecha Cierre Programada',
  'numero_turno': 'Número Turno',
  'tipo': 'Tipo',
  'motivo': 'Motivo',
  'monto_reembolso': 'Monto Reembolso',
};

// Función auxiliar para formatear un valor individual
function formatearValor(value, key = '') {
  if (value === null) {
    return '<span class="text-muted">—</span>';
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '<span class="text-muted fst-italic">Vacío</span>';
    }
    if (value.every(item => typeof item === 'object' && item !== null)) {
      const items = value.map(item => {
        const nombre = item.nombre || item.codigo || JSON.stringify(item);
        return `<li class="small">${nombre}</li>`;
      }).join('');
      return `<ul class="mb-0 ps-3">${items}</ul>`;
    }
    return `<span class="small">${value.join(', ')}</span>`;
  }

  if (typeof value === 'object') {
    try {
      return `<pre class="mb-0 small" style="max-width: 300px; overflow-x: auto;">${JSON.stringify(value, null, 2)}</pre>`;
    } catch {
      return '<span class="text-muted">[Objeto]</span>';
    }
  }

  if (typeof value === 'boolean') {
    return value
      ? '<span class="badge text-bg-success">Sí</span>'
      : '<span class="badge text-bg-secondary">No</span>';
  }

  if (typeof value === 'number') {
    // Timestamp de fecha (milisegundos desde 1970, entre 2000 y 2100)
    if (value > 946684800000 && value < 4102444800000) {
      const dateObj = new Date(value);
      if (!isNaN(dateObj.getTime())) {
        return `<span class="text-info">${formatDate(dateObj, true)}</span>`;
      }
    }

    // Hora en milisegundos desde medianoche (0 - 86400000)
    if (value >= 0 && value < 86400000 && (key.includes('hora') || key.includes('time'))) {
      return `<span class="text-info">${formatHora(value)}</span>`;
    }

    // Campos sin separadores de miles
    if (camposSinFormato.includes(key) || Number.isInteger(value)) {
      return `<span class="text-primary fw-semibold">${value}</span>`;
    }

    // Números decimales con formato
    return `<span class="text-primary fw-semibold">${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`;
  }

  if (typeof value === 'string') {
    // Fechas en formato string
    if (/^\d{4}-\d{2}-\d{2}/.test(value) || value.includes('T')) {
      const dateObj = new Date(value);
      if (!isNaN(dateObj.getTime())) {
        return `<span class="text-info">${formatDate(dateObj, true)}</span>`;
      }
    }

    // Valores booleanos como string
    if (value === '1' || value === 'true') {
      return '<span class="badge text-bg-success">Sí</span>';
    }
    if (value === '0' || value === 'false') {
      return '<span class="badge text-bg-secondary">No</span>';
    }

    return `<span class="text-break">${value}</span>`;
  }

  return String(value);
}

// Formatear datos como tabla legible (clave: valor)
function formatearDatosTabla(datos, datosAnteriores = null) {
  if (!datos || typeof datos !== 'object' || Object.keys(datos).length === 0) {
    return '<p class="text-muted fst-italic mb-0">Sin datos</p>';
  }

  const camposOcultos = ['id_auditoria', 'registrado_en', 'creado_en', 'actualizado_en'];

  let html = '<table class="table table-sm table-borderless mb-0" style="font-size: 13px;">';
  html += '<tbody>';

  for (const [key, value] of Object.entries(datos)) {
    if (camposOcultos.includes(key)) continue;

    const oldValue = datosAnteriores?.[key];
    const hasChanged = oldValue !== undefined && oldValue !== value;

    const displayValue = formatearValor(value, key);
    const displayOldValue = oldValue !== undefined ? formatearValor(oldValue, key) : undefined;

    const rowClass = hasChanged ? 'table-warning' : '';
    const changeIndicator = hasChanged
      ? '<i class="fa-solid fa-arrow-right text-warning ms-2" title="Modificado"></i>'
      : '';

    const label = campoLabels[key] || key.replace(/_/g, ' ').toUpperCase();

    html += `<tr class="${rowClass}">`;
    html += `<td class="text-muted font-monospace pe-3" style="min-width: 180px; vertical-align: top;">`;
    html += `<strong>${label}</strong>`;
    html += `</td>`;

    html += `<td class="text-break" style="vertical-align: top;">`;
    if (hasChanged && displayOldValue !== undefined) {
      html += `<div class="mb-1 text-muted">${displayOldValue}</div>`;
      html += `<div class="fw-semibold">${displayValue} ${changeIndicator}</div>`;
    } else {
      html += `<div>${displayValue}</div>`;
    }
    html += `</td>`;
    html += `</tr>`;
  }

  html += '</tbody></table>';
  return html;
}

// Cargar parámetros de configuración
async function cargarConfiguracion() {
  try {
    const data = await apiFetch('/api/configuracion');
    const configs = Array.isArray(data.configuracion) ? data.configuracion : [];
    configs.forEach(cfg => {
      // Input del formulario
      const input = document.getElementById(`cfg-${cfg.clave}`);
      if (input) {
        input.value = cfg.valor ?? '';
        input.dataset.clave = cfg.clave;
      }

      // Vista previa dinámica - ACTUALIZADO CON NUEVAS CLAVES
      if (cfg.clave === 'empresa_nombre') {
        const el = document.getElementById('preview-negocio');
        if (el) el.textContent = cfg.valor || '—';
      }
      if (cfg.clave === 'empresa_ruc') {
        const el = document.getElementById('preview-ruc');
        if (el) el.textContent = cfg.valor || '—';
      }
      if (cfg.clave === 'empresa_direccion') {
        const el = document.getElementById('preview-direccion');
        if (el) el.textContent = cfg.valor || '—';
      }
      if (cfg.clave === 'empresa_telefono') {
        const el = document.getElementById('preview-telefono');
        if (el) el.textContent = cfg.valor || '—';
      }
      if (cfg.clave === 'empresa_correo') {
        const el = document.getElementById('preview-email');
        if (el) el.textContent = cfg.valor || '—';
      }
      if (cfg.clave === 'igv_porcentaje') {
        const pct = document.getElementById('preview-igv-pct');
        if (pct) pct.textContent = `${cfg.valor}%` || '—';
      }
      if (cfg.clave === 'moneda') {
        const el = document.getElementById('preview-moneda');
        if (el) el.textContent = cfg.valor || '—';
      }
      if (cfg.clave === 'stock_alerta') {
        const el = document.getElementById('preview-stock-alerta');
        if (el) el.textContent = cfg.valor || '—';
      }
    });

    const tbody = document.querySelector('#tabla-configuracion tbody');
    if (tbody) {
      tbody.replaceChildren();
      const frag = document.createDocumentFragment();
      configs.forEach(cfg => {
        const tr = document.createElement('tr');

        const tdClave = document.createElement('td');
        const claveBadge = document.createElement('span');
        claveBadge.className = 'badge text-bg-light border font-monospace';
        claveBadge.textContent = cfg.clave;
        tdClave.appendChild(claveBadge);

        const tdValor = document.createElement('td');
        tdValor.className = 'fw-medium';
        tdValor.textContent = cfg.valor;

        const tdDesc = document.createElement('td');
        tdDesc.className = 'text-muted small';
        tdDesc.textContent = cfg.descripcion || '—';

        const tdAcc = document.createElement('td');
        tdAcc.className = 'text-end pe-3';
        const btnEdit = document.createElement('button');
        btnEdit.type = 'button';
        btnEdit.className = 'btn btn-sm btn-outline-primary';
        btnEdit.title = 'Editar';
        btnEdit.innerHTML = '<i class="fa-solid fa-pen fa-fw" aria-hidden="true"></i>';
        btnEdit.addEventListener('click', () => abrirEditorConfig(cfg));
        tdAcc.appendChild(btnEdit);

        tr.append(tdClave, tdValor, tdDesc, tdAcc);
        frag.appendChild(tr);
      });
      tbody.appendChild(frag);
    }
  } catch (err) {
    showToast('Error al cargar configuración: ' + err.message, 'error');
  }
}

// Abrir editor de un parámetro
function abrirEditorConfig(cfg) {
  const modal = document.getElementById('modal-editar-config');
  if (!modal) return;
  const labelEl = modal.querySelector('#edit-cfg-label');
  const inputEl = modal.querySelector('#edit-cfg-valor');
  const claveEl = modal.querySelector('#edit-cfg-clave');
  if (labelEl) labelEl.textContent = cfg.clave;
  if (inputEl) inputEl.value = cfg.valor;
  if (claveEl) claveEl.value = cfg.clave;
  new bootstrap.Modal(modal).show();
}

// Inicializar formulario de edición de config
function initFormEditarConfig() {
  const form = document.getElementById('form-editar-config');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const clave = document.getElementById('edit-cfg-clave')?.value;
    const valor = document.getElementById('edit-cfg-valor')?.value.trim();
    if (!clave || valor === undefined) return;
    try {
      await apiFetch(`/api/configuracion/${clave}`, {
        method: 'PUT',
        body: JSON.stringify({ valor }),
      });
      showToast(`Parámetro "${clave}" actualizado.`, 'success');
      bootstrap.Modal.getInstance(document.getElementById('modal-editar-config'))?.hide();
      await cargarConfiguracion();
    } catch (err) {
      showToast('Error al actualizar: ' + err.message, 'error');
    }
  });
}

// Formulario inline de configuración
function initFormConfiguracion() {
  const form = document.getElementById('form-parametros');
  if (!form) return;
  const inputIgv = document.getElementById('cfg-igv');
  const badgeIgv = document.getElementById('cfg-igv-badge');
  if (inputIgv && badgeIgv) {
    inputIgv.addEventListener('input', () => {
      const porcentaje = Number(inputIgv.value) * 100;
      badgeIgv.textContent = isNaN(porcentaje) ? '— %' : `${porcentaje} %`;
    });
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.classList.add('was-validated'); return; }
    const inputs = form.querySelectorAll('[data-clave]');
    const promesas = [];

    inputs.forEach(input => {
      const clave = input.dataset.clave;
      const valor = input.value.trim();
      if (clave && valor !== '') {
        promesas.push(
          apiFetch(`/api/configuracion/${clave}`, {
            method: 'PUT',
            body: JSON.stringify({ valor }),
          })
        );
      }
    });

    try {
      await Promise.all(promesas);
      showToast('Configuración guardada.', 'success');
    } catch (err) {
      showToast('Error al guardar: ' + err.message, 'error');
    }
  });
}

// Estilo visual según tipo de operación
function operationStyle(op) {
  const map = {
    INSERT: { border: 'border-success', iconNuevo: 'text-success', iconAnt: '' },
    UPDATE: { border: 'border-warning', iconNuevo: 'text-warning', iconAnt: '' },
    DELETE: { border: 'border-danger', iconNuevo: '', iconAnt: 'text-danger' },
  };
  return map[op] || { border: 'border-secondary', iconNuevo: '', iconAnt: '' };
}

// Fila principal (clickeable) de auditoría
function renderFilaAuditoria(log) {
  const tr = document.createElement('tr');
  tr.dataset.expandTrigger = `detalle-audit-${log.id_auditoria}`;
  tr.dataset.idAuditoria = log.id_auditoria;
  tr.style.cursor = 'pointer';
  const tdIcon = document.createElement('td');
  tdIcon.className = 'ps-3';
  tdIcon.innerHTML = '<i class="fa-solid fa-chevron-down fa-fw fa-xs text-muted" data-expand-icon aria-hidden="true"></i>';
  const tdFecha = document.createElement('td');
  tdFecha.className = 'small font-monospace text-muted';
  tdFecha.textContent = formatDate(log.registrado_en, true);
  const tdUsuario = document.createElement('td');
  tdUsuario.className = 'fw-semibold small';
  tdUsuario.textContent = log.usuario_nombre || log.empleado_nombre || '—';
  const tdTabla = document.createElement('td');
  const tablaSpan = document.createElement('span');
  tablaSpan.className = 'badge text-bg-light border font-monospace fw-normal';
  tablaSpan.textContent = log.tabla_afectada;
  tdTabla.appendChild(tablaSpan);
  const tdOp = document.createElement('td');
  tdOp.innerHTML = getBadge(log.operacion);
  const tdReg = document.createElement('td');
  tdReg.className = 'font-monospace small text-muted';
  tdReg.textContent = log.registro_id ?? '—';
  tr.append(tdIcon, tdFecha, tdUsuario, tdTabla, tdOp, tdReg);
  return tr;
}

// Fila expandible (detalle) que acompaña a cada fila principal
function crearFilaDetalle(log) {
  const tr = document.createElement('tr');
  tr.id = `detalle-audit-${log.id_auditoria}`;
  tr.className = 'detail-row collapse';
  const td = document.createElement('td');
  td.colSpan = 6;
  td.className = 'p-0 border-0';
  const style = operationStyle(log.operacion);

  td.innerHTML = `
        <div class="d-flex border-start border-4 ${style.border} mx-3 my-2 rounded-end overflow-hidden">
            <div class="row g-0 w-100">
                <div class="col-md-6 p-3 border-end">
                    <p class="text-muted small fw-semibold text-uppercase mb-2 d-flex align-items-center gap-2">
                        <i class="fa-solid fa-arrow-right-from-bracket fa-fw ${style.iconAnt}" aria-hidden="true"></i>
                        Datos anteriores
                    </p>
                    <div class="datos-container" data-campo="anteriores" style="max-height: 400px; overflow-y: auto;">
                        <span class="text-muted">Cargando…</span>
                    </div>
                </div>
                <div class="col-md-6 p-3">
                    <p class="text-muted small fw-semibold text-uppercase mb-2 d-flex align-items-center gap-2">
                        <i class="fa-solid fa-arrow-right-to-bracket fa-fw ${style.iconNuevo}" aria-hidden="true"></i>
                        Datos nuevos
                    </p>
                    <div class="datos-container" data-campo="nuevos" style="max-height: 400px; overflow-y: auto;">
                        <span class="text-muted">Cargando…</span>
                    </div>
                </div>
            </div>
        </div>
    `;

  tr.appendChild(td);
  return tr;
}

// Cargar y mostrar detalle formateado
async function cargarDetalleAuditoria(id, detailRow) {
  const containerAnt = detailRow.querySelector('[data-campo="anteriores"]');
  const containerNue = detailRow.querySelector('[data-campo="nuevos"]');

  try {
    const data = await apiFetch(`/api/configuracion/auditoria/${id}`);
    const log = data.log;

    if (containerAnt) {
      containerAnt.innerHTML = formatearDatosTabla(log.datos_anteriores, null);
    }

    if (containerNue) {
      containerNue.innerHTML = formatearDatosTabla(log.datos_nuevos, log.datos_anteriores);
    }

    detailRow.dataset.loaded = '1';
  } catch (err) {
    const errorMsg = '<span class="text-danger">Error al cargar el detalle.</span>';
    if (containerAnt) containerAnt.innerHTML = errorMsg;
    if (containerNue) containerNue.innerHTML = errorMsg;
    showToast('Error al cargar detalle: ' + err.message, 'error');
  }
}

// Inicializar filas expandibles
function initExpandableRowsLive() {
  document.querySelectorAll('#tabla-auditoria [data-expand-trigger]:not([data-expand-init])').forEach(trigger => {
    trigger.setAttribute('data-expand-init', '1');
    trigger.addEventListener('click', async () => {
      const detailRow = document.getElementById(trigger.getAttribute('data-expand-trigger'));
      if (!detailRow) return;
      const isOpen = detailRow.classList.toggle('show');
      const icon = trigger.querySelector('[data-expand-icon]');
      if (icon) {
        icon.classList.toggle('fa-chevron-down', !isOpen);
        icon.classList.toggle('fa-chevron-up', isOpen);
      }
      trigger.classList.toggle('table-active', isOpen);

      if (isOpen && detailRow.dataset.loaded !== '1') {
        await cargarDetalleAuditoria(trigger.dataset.idAuditoria, detailRow);
      }
    });
  });
}

// Renderizar tabla de auditoría
function renderTablaAuditoria() {
  const tbody = document.querySelector('#tabla-auditoria tbody');
  if (!tbody) return;
  tbody.replaceChildren();
  const inicio = (AuditState.pagina - 1) * AuditState.porPagina;
  const pagina = AuditState.filtrados.slice(inicio, inicio + AuditState.porPagina);
  const frag = document.createDocumentFragment();
  if (pagina.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.className = 'text-center text-muted py-4';
    td.textContent = 'No hay registros de auditoría.';
    tr.appendChild(td);
    frag.appendChild(tr);
  } else {
    pagina.forEach(log => {
      frag.appendChild(renderFilaAuditoria(log));
      frag.appendChild(crearFilaDetalle(log));
    });
  }
  tbody.appendChild(frag);
  initExpandableRowsLive();
  const footerSpan = document.querySelector('#section-auditoria .card-footer span');
  if (footerSpan) {
    footerSpan.innerHTML = `Mostrando <strong>${inicio + 1}–${Math.min(inicio + AuditState.porPagina, AuditState.filtrados.length)}</strong> de <strong>${AuditState.filtrados.length}</strong> registros`;
  }
  const nav = document.querySelector('#section-auditoria .card-footer nav');
  if (nav) {
    if (!nav.id) nav.id = 'pagination-auditoria';
    renderPaginacion('pagination-auditoria', AuditState.filtrados.length, AuditState.porPagina, AuditState.pagina, (p) => {
      AuditState.pagina = p;
      renderTablaAuditoria();
    });
  }
}

// Cargar logs de auditoría
async function cargarAuditoria(filtros = {}) {
  try {
    const params = new URLSearchParams();
    if (filtros.tabla) params.set('tabla', filtros.tabla);
    if (filtros.operacion) params.set('operacion', filtros.operacion);
    if (filtros.usuario) params.set('usuario', filtros.usuario);
    if (filtros.fecha_desde) params.set('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta) params.set('fecha_hasta', filtros.fecha_hasta);
    const data = await apiFetch(`/api/configuracion/auditoria?${params}`);
    AuditState.logs = Array.isArray(data.logs) ? data.logs : [];
    AuditState.filtrados = [...AuditState.logs];
    AuditState.pagina = 1;
    renderTablaAuditoria();
  } catch (err) {
    showToast('Error al cargar auditoría: ' + err.message, 'error');
  }
}

// Filtros de auditoría
let debounceAuditoria;
function getFiltrosAuditoria() {
  return {
    tabla: document.getElementById('filtro-tabla-auditoria')?.value,
    operacion: document.getElementById('filtro-operacion-auditoria')?.value,
    usuario: document.getElementById('input-buscar-auditoria')?.value.trim(),
    fecha_desde: document.getElementById('filtro-fecha-desde-audit')?.value,
    fecha_hasta: document.getElementById('filtro-fecha-hasta-audit')?.value,
  };
}

function initFiltrosAuditoria() {
  document.getElementById('filtro-tabla-auditoria')?.addEventListener('change', () => cargarAuditoria(getFiltrosAuditoria()));
  document.getElementById('filtro-operacion-auditoria')?.addEventListener('change', () => cargarAuditoria(getFiltrosAuditoria()));
  document.getElementById('filtro-fecha-desde-audit')?.addEventListener('change', () => cargarAuditoria(getFiltrosAuditoria()));
  document.getElementById('filtro-fecha-hasta-audit')?.addEventListener('change', () => cargarAuditoria(getFiltrosAuditoria()));
  document.getElementById('input-buscar-auditoria')?.addEventListener('input', () => {
    clearTimeout(debounceAuditoria);
    debounceAuditoria = setTimeout(() => cargarAuditoria(getFiltrosAuditoria()), 350);
  });
}

// Paginación genérica
function renderPaginacion(containerId, total, porPagina, paginaActual, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const totalPaginas = Math.ceil(total / porPagina) || 1;
  const ul = document.createElement('ul');
  ul.className = 'pagination pagination-sm mb-0';
  const crearLi = (content, disabled, active, pageNum, isIcon = false) => {
    const li = document.createElement('li');
    li.className = `page-item${disabled ? ' disabled' : ''}${active ? ' active' : ''}`;
    if (active) li.setAttribute('aria-current', 'page');
    const a = document.createElement('a');
    a.className = 'page-link';
    a.href = '#';
    if (isIcon) { const i = document.createElement('i'); i.className = content; i.setAttribute('aria-hidden', 'true'); a.appendChild(i); } else { a.textContent = content; }
    if (!disabled && !active) a.addEventListener('click', (e) => { e.preventDefault(); onPageChange(pageNum); });
    li.appendChild(a);
    return li;
  };
  ul.appendChild(crearLi('fa-solid fa-chevron-left fa-xs', paginaActual === 1, false, paginaActual - 1, true));
  for (let i = 1; i <= totalPaginas; i++) ul.appendChild(crearLi(String(i), false, i === paginaActual, i));
  ul.appendChild(crearLi('fa-solid fa-chevron-right fa-xs', paginaActual >= totalPaginas, false, paginaActual + 1, true));
  container.replaceChildren(ul);
}

// TURNOS
let turnosCache = [];
let editandoTurnoId = null;

async function cargarTurnos() {
  try {
    const data = await apiFetch('/api/configuracion/turnos');
    turnosCache = data.turnos || [];
    renderTablaTurnos(turnosCache);
    await cargarEmpleadosConTurno();
  } catch (err) {
    showToast('Error al cargar turnos: ' + err.message, 'error');
  }
}

function formatHora(horaSQL) {
  if (horaSQL === null || horaSQL === undefined) return '—';
  if (typeof horaSQL === 'number') {
    const totalSegundos = Math.floor(horaSQL / 1000);
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
  }
  const str = String(horaSQL);
  const soloHora = str.includes('T') ? str.split('T')[1] : str;
  const match = soloHora.match(/^(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : str;
}

function renderTablaTurnos(turnos) {
  const tbody = document.getElementById('tabla-turnos-body');
  if (!tbody) return;
  if (!turnos.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">Sin turnos registrados</td></tr>`;
    return;
  }
  tbody.innerHTML = turnos.map(t => `<tr><td class="fw-medium">${t.nombre}</td><td>${formatHora(t.hora_inicio)} – ${formatHora(t.hora_fin)}</td><td>${getBadge(t.activo ? 'activo' : 'inactivo')}</td><td class="text-end"><div class="d-flex gap-1 justify-content-end"><button type="button" class="btn btn-sm" data-accion="editar-turno" data-turno-id="${t.id_turno}" aria-label="Editar turno ${t.nombre}"><i class="fa-regular fa-pen-to-square" aria-hidden="true"></i></button><button type="button" class="btn btn-sm text-danger" data-accion="eliminar-turno" data-turno-id="${t.id_turno}" aria-label="Eliminar turno ${t.nombre}"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button></div></td></tr>`).join('');
}

function abrirEditarTurno(id) {
  const t = turnosCache.find(x => x.id_turno === id);
  if (!t) return;
  editandoTurnoId = id;
  document.getElementById('titulo-form-turno').textContent = 'Editar turno';
  document.getElementById('turno-id').value = t.id_turno;
  document.getElementById('turno-nombre').value = t.nombre;
  document.getElementById('turno-hora-inicio').value = formatHora(t.hora_inicio);
  document.getElementById('turno-hora-fin').value = formatHora(t.hora_fin);
  document.getElementById('turno-activo').checked = !!t.activo;
}

function limpiarFormTurno() {
  editandoTurnoId = null;
  document.getElementById('titulo-form-turno').textContent = 'Nuevo turno';
  const form = document.getElementById('form-turno');
  if (form) { form.reset(); form.classList.remove('was-validated'); }
  document.getElementById('turno-activo').checked = true;
}

async function eliminarTurno(id) {
  const t = turnosCache.find(x => x.id_turno === id);
  if (!t) return;
  let cantidadAfectados = 0;
  try {
    const data = await apiFetch('/api/configuracion/turnos-empleados');
    cantidadAfectados = (data.empleados || []).filter(e => e.id_turno === id).length;
  } catch (_) { }
  const aviso = cantidadAfectados > 0
    ? `Hay ${cantidadAfectados} empleado(s) con el turno "${t.nombre}" asignado. Si lo eliminas, esos empleados quedarán SIN turno asignado. ¿Deseas continuar?`
    : `¿Seguro que deseas eliminar el turno "${t.nombre}"?`;
  confirmAction(aviso, async () => {
    try {
      await apiFetch(`/api/configuracion/turnos/${id}`, { method: 'DELETE' });
      showToast('Turno eliminado correctamente', 'success');
      cargarTurnos();
    } catch (err) {
      showToast(err.message || 'Error al eliminar el turno', 'error');
    }
  });
}

function initFormTurno() {
  const form = document.getElementById('form-turno');
  const btnCancelar = document.getElementById('btn-cancelar-turno');
  const tbody = document.getElementById('tabla-turnos-body');
  if (!form || !tbody) return;
  tbody.addEventListener('click', (e) => {
    const btnEditar = e.target.closest('[data-accion="editar-turno"]');
    if (btnEditar) {
      abrirEditarTurno(parseInt(btnEditar.dataset.turnoId));
      return;
    }
    const btnEliminar = e.target.closest('[data-accion="eliminar-turno"]');
    if (btnEliminar) {
      eliminarTurno(parseInt(btnEliminar.dataset.turnoId));
      return;
    }
  });
  btnCancelar?.addEventListener('click', limpiarFormTurno);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.classList.add('was-validated'); return; }
    const body = {
      nombre: document.getElementById('turno-nombre').value.trim(),
      hora_inicio: document.getElementById('turno-hora-inicio').value,
      hora_fin: document.getElementById('turno-hora-fin').value,
      activo: document.getElementById('turno-activo').checked ? 1 : 0,
    };

    try {
      if (editandoTurnoId) {
        await apiFetch(`/api/configuracion/turnos/${editandoTurnoId}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        showToast('Turno actualizado correctamente', 'success');
      } else {
        await apiFetch('/api/configuracion/turnos', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        showToast('Turno creado correctamente', 'success');
      }
      limpiarFormTurno();
      cargarTurnos();
    } catch (err) {
      showToast(err.message || 'Error al guardar el turno', 'error');
    }
  });
}

// ASIGNACIÓN DE TURNO A EMPLEADOS
async function cargarEmpleadosConTurno() {
  const busqueda = document.getElementById('filtro-emp-turno-busqueda')?.value.trim() || '';
  const id_cargo = document.getElementById('filtro-emp-turno-cargo')?.value || '';
  const id_rol = document.getElementById('filtro-emp-turno-rol')?.value || '';
  const params = new URLSearchParams();
  if (busqueda) params.set('busqueda', busqueda);
  if (id_cargo) params.set('id_cargo', id_cargo);
  if (id_rol) params.set('id_rol', id_rol);
  try {
    const data = await apiFetch(`/api/configuracion/turnos-empleados?${params.toString()}`);
    renderTablaEmpleadosTurno(data.empleados || []);
  } catch (err) {
    showToast('Error al cargar empleados: ' + err.message, 'error');
  }
}

async function cargarFiltrosEmpleadoTurno() {
  const selCargo = document.getElementById('filtro-emp-turno-cargo');
  const selRol = document.getElementById('filtro-emp-turno-rol');
  try {
    const data = await apiFetch('/api/empleados/cargos');
    (data.cargos || []).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id_cargo;
      opt.textContent = c.nombre;
      selCargo?.appendChild(opt);
    });
  } catch (_) { }
  try {
    const data = await apiFetch('/api/auth/roles');
    (data.roles || []).forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id_rol;
      opt.textContent = r.nombre;
      selRol?.appendChild(opt);
    });
  } catch (_) { }
}

function initFiltrosEmpleadoTurno() {
  let timeoutBusqueda;
  document.getElementById('filtro-emp-turno-busqueda')?.addEventListener('input', () => {
    clearTimeout(timeoutBusqueda);
    timeoutBusqueda = setTimeout(() => cargarEmpleadosConTurno(), 300);
  });
  document.getElementById('filtro-emp-turno-cargo')?.addEventListener('change', () => cargarEmpleadosConTurno());
  document.getElementById('filtro-emp-turno-rol')?.addEventListener('change', () => cargarEmpleadosConTurno());
}

function renderTablaEmpleadosTurno(empleados) {
  const tbody = document.getElementById('tabla-turnos-empleados-body');
  if (!tbody) return;
  if (!empleados.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">No hay empleados que coincidan con el filtro</td></tr>`;
    return;
  }
  const opcionesTurno = (idActual) => {
    const sinTurno = `<option value="" ${!idActual ? 'selected' : ''}>Sin turno asignado</option>`;
    const opciones = turnosCache
      .filter(t => t.activo)
      .map(t => `<option value="${t.id_turno}" ${t.id_turno === idActual ? 'selected' : ''}>${t.nombre} (${formatHora(t.hora_inicio)}–${formatHora(t.hora_fin)})</option>`)
      .join('');
    return sinTurno + opciones;
  };
  tbody.innerHTML = empleados.map(e => `<tr><td>${e.nombre} ${e.apellido} <span class="text-muted small">(${e.dni})</span></td><td>${e.cargo_nombre || '—'}</td><td>${e.rol_nombre || '<span class="text-muted">Sin cuenta</span>'}</td><td><select class="form-select form-select-sm" data-accion="cambiar-turno" data-empleado-id="${e.id_empleado}">${opcionesTurno(e.id_turno)}</select></td><td class="text-end"><button type="button" class="btn btn-sm btn-primary" data-accion="guardar-turno-empleado" data-empleado-id="${e.id_empleado}"><i class="fa-solid fa-floppy-disk" aria-hidden="true"></i></button></td></tr>`).join('');
}

function initAsignacionTurnos() {
  const tbody = document.getElementById('tabla-turnos-empleados-body');
  if (!tbody) return;
  tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-accion="guardar-turno-empleado"]');
    if (!btn) return;
    const idEmpleado = btn.dataset.empleadoId;
    const select = tbody.querySelector(`select[data-empleado-id="${idEmpleado}"]`);
    const idTurno = select?.value ? parseInt(select.value) : null;

    try {
      await apiFetch(`/api/configuracion/turnos-empleados/${idEmpleado}`, {
        method: 'PUT',
        body: JSON.stringify({ id_turno: idTurno }),
      });
      showToast('Turno asignado correctamente', 'success');
    } catch (err) {
      showToast(err.message || 'Error al asignar el turno', 'error');
    }
  });
}

// Punto de entrada
document.addEventListener('DOMContentLoaded', () => {
  cargarConfiguracion();
  initFormConfiguracion();
  initFormEditarConfig();
  initFiltrosAuditoria();
  cargarAuditoria();
  cargarFiltrosEmpleadoTurno();
  initFiltrosEmpleadoTurno();
  cargarTurnos();
  initFormTurno();
  initAsignacionTurnos();
});