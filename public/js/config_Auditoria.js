
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

      // Badge IGV en el formulario
      if (cfg.clave === 'igv') {
        const badge = document.getElementById('cfg-igv-badge');
        if (badge) {
          const porcentaje = Number(cfg.valor) * 100;
          badge.textContent = isNaN(porcentaje) ? '— %' : `${porcentaje} %`;
        }
      }

      // Vista previa dinámica
      if (cfg.clave === 'negocio') {
        const el = document.getElementById('preview-negocio');
        if (el) el.textContent = cfg.valor || '—';
      }
      if (cfg.clave === 'igv') {
        const pct = document.getElementById('preview-igv-pct');
        const dec = document.getElementById('preview-igv-dec');
        const porcentaje = Number(cfg.valor) * 100;
        if (pct) pct.textContent = isNaN(porcentaje) ? '—' : `${porcentaje}%`;
        if (dec) dec.textContent = isNaN(porcentaje) ? '' : `(${cfg.valor})`;
      }
      if (cfg.clave === 'moneda') {
        const el = document.getElementById('preview-moneda');
        if (el) el.textContent = cfg.valor || '—';
      }
      if (cfg.clave === 'simbolo') {
        const el = document.getElementById('preview-simbolo');
        if (el) el.textContent = cfg.valor || '—';
      }
    });

    // Renderizar tabla de parámetros si existe
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

  // Actualiza el badge "X %" en vivo mientras se edita el campo IGV
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
    DELETE: { border: 'border-danger',  iconNuevo: '',              iconAnt: 'text-danger' },
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
            <code class="text-muted fw-normal text-lowercase">datos_anteriores</code>
          </p>
          <pre class="rounded p-3 small mb-0 lh-lg" data-campo="anteriores">Cargando…</pre>
        </div>
        <div class="col-md-6 p-3">
          <p class="text-muted small fw-semibold text-uppercase mb-2 d-flex align-items-center gap-2">
            <i class="fa-solid fa-arrow-right-to-bracket fa-fw ${style.iconNuevo}" aria-hidden="true"></i>
            Datos nuevos
            <code class="text-muted fw-normal text-lowercase">datos_nuevos</code>
          </p>
          <pre class="rounded p-3 small mb-0 lh-lg" data-campo="nuevos">Cargando…</pre>
        </div>
      </div>
    </div>`;

  tr.appendChild(td);
  return tr;
}

// Carga el detalle (datos_anteriores/datos_nuevos) solo la primera vez que se expande
async function cargarDetalleAuditoria(id, detailRow) {
  const preAnt = detailRow.querySelector('[data-campo="anteriores"]');
  const preNue = detailRow.querySelector('[data-campo="nuevos"]');
  try {
    const data = await apiFetch(`/api/configuracion/auditoria/${id}`);
    const log = data.log;
    if (preAnt) preAnt.textContent = log.datos_anteriores ? JSON.stringify(log.datos_anteriores, null, 2) : '—';
    if (preNue) preNue.textContent = log.datos_nuevos ? JSON.stringify(log.datos_nuevos, null, 2) : '—';
    detailRow.dataset.loaded = '1';
  } catch (err) {
    if (preAnt) preAnt.textContent = 'Error al cargar el detalle.';
    if (preNue) preNue.textContent = '—';
    showToast('Error al cargar detalle: ' + err.message, 'error');
  }
}

// Mismo patrón que initExpandableRowsLive() de inventario.js
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

// Renderizar tabla de auditoria
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

// Filtros de auditoría — se aplican solos al cambiar (igual que en proveedores.js/clientes.js)
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
//  TURNOS 

let turnosCache = [];
let editandoTurnoId = null;

async function cargarTurnos() {
  try {
    const data = await apiFetch('/api/configuracion/turnos');
    turnosCache = data.turnos || [];
    renderTablaTurnos(turnosCache);
    await cargarEmpleadosConTurno(); // refresca selects que dependen de los turnos
  } catch (err) {
    showToast('Error al cargar turnos: ' + err.message, 'error');
  }
}


//ESTO ESTA MAL
function formatHora(horaSQL) {
  if (horaSQL === null || horaSQL === undefined) return '—';

  // El driver msnodesqlv8 devuelve las columnas TIME como milisegundos
  // transcurridos desde medianoche (ej: 28200000 = 07:50:00), no como
  // string. Lo manejamos como caso principal, con un respaldo por si
  // alguna vez llega como string 'HH:mm:ss' (otro driver, u otra ruta).
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
}//////////////////////////

function renderTablaTurnos(turnos) {
  const tbody = document.getElementById('tabla-turnos-body');
  if (!tbody) return;

  if (!turnos.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">Sin turnos registrados</td></tr>`;
    return;
  }

  tbody.innerHTML = turnos.map(t => `
    <tr>
      <td class="fw-medium">${t.nombre}</td>
      <td>${formatHora(t.hora_inicio)} – ${formatHora(t.hora_fin)}</td>
      <td>${getBadge(t.activo ? 'activo' : 'inactivo')}</td>
      <td class="text-end">
        <div class="d-flex gap-1 justify-content-end">
          <button type="button" class="btn btn-sm" data-accion="editar-turno" data-turno-id="${t.id_turno}"
            aria-label="Editar turno ${t.nombre}">
            <i class="fa-regular fa-pen-to-square" aria-hidden="true"></i>
          </button>
          <button type="button" class="btn btn-sm text-danger" data-accion="eliminar-turno" data-turno-id="${t.id_turno}"
            aria-label="Eliminar turno ${t.nombre}">
            <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
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

  // Antes de preguntar, revisamos cuántos empleados tienen ESTE turno
  // asignado para avisar exactamente qué va a pasar.
  let cantidadAfectados = 0;
  try {
    const data = await apiFetch('/api/configuracion/turnos-empleados');
    cantidadAfectados = (data.empleados || []).filter(e => e.id_turno === id).length;
  } catch (_) { /* si falla, seguimos con el aviso genérico */ }

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

//  ASIGNACIÓN DE TURNO A EMPLEADOS 

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

// Carga las opciones de los selects de filtro (cargo y rol)
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
  } catch (_) { /* el select se queda con "Todos los cargos" */ }

  try {
    const data = await apiFetch('/api/auth/roles');
    (data.roles || []).forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id_rol;
      opt.textContent = r.nombre;
      selRol?.appendChild(opt);
    });
  } catch (_) { /* el select se queda con "Todos los roles" */ }
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
      .filter(t => t.activo) // solo se asignan turnos activos
      .map(t => `<option value="${t.id_turno}" ${t.id_turno === idActual ? 'selected' : ''}>${t.nombre} (${formatHora(t.hora_inicio)}–${formatHora(t.hora_fin)})</option>`)
      .join('');
    return sinTurno + opciones;
  };

  tbody.innerHTML = empleados.map(e => `
    <tr>
      <td>${e.nombre} ${e.apellido} <span class="text-muted small">(${e.dni})</span></td>
      <td>${e.cargo_nombre || '—'}</td>
      <td>${e.rol_nombre || '<span class="text-muted">Sin cuenta</span>'}</td>
      <td>
        <select class="form-select form-select-sm" data-accion="cambiar-turno" data-empleado-id="${e.id_empleado}">
          ${opcionesTurno(e.id_turno)}
        </select>
      </td>
      <td class="text-end">
        <button type="button" class="btn btn-sm btn-primary" data-accion="guardar-turno-empleado" data-empleado-id="${e.id_empleado}">
          <i class="fa-solid fa-floppy-disk" aria-hidden="true"></i>
        </button>
      </td>
    </tr>
  `).join('');
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