
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
      // Intentar encontrar un input con id = cfg-<clave>
      const input = document.getElementById(`cfg-${cfg.clave}`);
      if (input) {
        input.value = cfg.valor ?? '';
        input.dataset.clave = cfg.clave;
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
  const form = document.getElementById('form-configuracion');
  if (!form) return;

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

// Punto de entrada
document.addEventListener('DOMContentLoaded', () => {
  cargarConfiguracion();
  initFormConfiguracion();
  initFormEditarConfig();
  initFiltrosAuditoria();
  cargarAuditoria();
});