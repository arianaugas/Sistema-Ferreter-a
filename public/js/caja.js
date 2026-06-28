/*
  caja.js — Lógica del módulo de Caja
  Conecta con las APIs: /api/caja/*
*/



// Estado global del módulo 
const Caja = {
  cajaActiva: null, // objeto de la caja abierta (o null)
  movimientos: [], // lista completa del turno
  movFiltrados: [], // movimientos filtrados para paginación
  movPagina: 1,
  movPorPagina: 10,
  historialPagina: 1,
  historialPorPagina: 10,
  historialTotal: [],
};

// Fetch helper con credenciales 
async function apiFetch(url, options = {}) {
  const defaults = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
  const res = await fetch(url, { ...defaults, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.mensaje || `Error ${res.status}`);
  return data;
}

//  Renderizado del estado de la caja 
function renderEstadoCaja(caja) {
  const badge = document.getElementById('badge-estado-caja');
  const cajeroEl = document.getElementById('caja-cajero');
  const horaEl = document.getElementById('caja-hora-apertura');
  const montoInicialEl = document.getElementById('caja-monto-inicial');
  const ingresosEl = document.getElementById('caja-total-ingresos');
  const egresosEl = document.getElementById('caja-total-egresos');
  const esperadoEl = document.getElementById('caja-monto-esperado');

  // Botones de acción
  const btnEgreso = document.querySelector('[data-bs-target="#offcanvas-egreso-manual"]');
  const btnCerrar = document.querySelector('[data-bs-target="#modal-cierre-caja"]');
  const btnAbrir = document.querySelector('[data-bs-target="#modal-abrir-caja"]');

  if (!caja) {
    // Caja cerrada / sin turno abierto
    if (badge) { badge.className = 'badge rounded-pill text-bg-danger fs-6 px-3 py-2 mb-2'; badge.textContent = 'Cerrada'; }
    if (cajeroEl) cajeroEl.textContent = '—';
    if (horaEl) horaEl.innerHTML = '<i class="fa-regular fa-clock fa-fw me-1" aria-hidden="true"></i> Sin turno activo';
    if (montoInicialEl) montoInicialEl.textContent = 'S/ 0.00';
    if (ingresosEl) ingresosEl.textContent = 'S/ 0.00';
    if (egresosEl) egresosEl.textContent = 'S/ 0.00';
    if (esperadoEl) esperadoEl.textContent = 'S/ 0.00';
    if (btnEgreso) btnEgreso.classList.add('d-none');
    if (btnCerrar) btnCerrar.classList.add('d-none');
    if (btnAbrir) btnAbrir.classList.remove('d-none');
    return;
  }

  if (caja.estado === 'vencida') {
    // El turno terminó, pero sigue pendiente el cierre real con conteo físico
    if (badge) { badge.className = 'badge rounded-pill text-bg-warning fs-6 px-3 py-2 mb-2'; badge.innerHTML = '<i class="fa-solid fa-triangle-exclamation fa-xs me-1" aria-hidden="true"></i>Turno vencido'; }
    if (cajeroEl) cajeroEl.textContent = caja.cajero_nombre || '—';
    if (horaEl) horaEl.innerHTML = `<i class="fa-regular fa-clock fa-fw me-1" aria-hidden="true"></i> Tu turno (${caja.turno_nombre || 'sin turno'}) ya terminó. Debes cerrar la caja.`;
    if (montoInicialEl) montoInicialEl.textContent = formatMoney(caja.monto_inicial);
    // Ya no puede registrar más movimientos, solo cerrar con el conteo real
    if (btnEgreso) btnEgreso.classList.add('d-none');
    if (btnCerrar) btnCerrar.classList.remove('d-none');
    if (btnAbrir) btnAbrir.classList.add('d-none');
    return;
  }

  // Caja abierta
  if (badge) { badge.className = 'badge rounded-pill text-bg-success fs-6 px-3 py-2 mb-2'; badge.innerHTML = '<i class="fa-solid fa-circle fa-xs me-1" aria-hidden="true"></i>Abierta'; }
  if (cajeroEl) cajeroEl.textContent = caja.cajero_nombre || '—';
  if (horaEl) horaEl.innerHTML = `<i class="fa-regular fa-clock fa-fw me-1" aria-hidden="true"></i> Desde ${formatDate(caja.fecha_apertura, true)}`;
  if (montoInicialEl) montoInicialEl.textContent = formatMoney(caja.monto_inicial);
  if (btnEgreso) btnEgreso.classList.remove('d-none');
  if (btnCerrar) btnCerrar.classList.remove('d-none');
  if (btnAbrir) btnAbrir.classList.add('d-none');
}

//  Cargar resumen de la caja activa 
async function cargarResumenCaja(idCaja) {
  try {
    const data = await apiFetch(`/api/caja/${idCaja}/resumen`);
    const ingresosEl = document.getElementById('caja-total-ingresos');
    const egresosEl = document.getElementById('caja-total-egresos');
    const esperadoEl = document.getElementById('caja-monto-esperado');
    if (ingresosEl) ingresosEl.textContent = formatMoney(data.total_ingresos);
    if (egresosEl) egresosEl.textContent = formatMoney(data.total_egresos);
    if (esperadoEl) esperadoEl.textContent = formatMoney(data.monto_esperado_final);

    // Llenar también el modal de cierre con los datos reales
    const cierreIni = document.getElementById('cierre-monto-inicial');
    const cierreIng = document.getElementById('cierre-ingresos');
    const cierreEgr = document.getElementById('cierre-egresos');
    const cierreEsp = document.getElementById('cierre-esperado');
    if (cierreIni) cierreIni.textContent = formatMoney(data.monto_inicial);
    if (cierreIng) cierreIng.textContent = formatMoney(data.total_ingresos);
    if (cierreEgr) cierreEgr.textContent = formatMoney(data.total_egresos);
    if (cierreEsp) cierreEsp.textContent = formatMoney(data.monto_esperado_final);
  } catch (err) {
    console.error('Error al cargar resumen de caja:', err);
  }
}

// Renderizar filas de movimientos
function renderFilaMovimiento(mov) {
  const tr = document.createElement('tr');

  const esTipo = mov.tipo === 'ingreso';
  const badgeCls = esTipo ? 'text-bg-success' : 'text-bg-danger';
  const icono = esTipo ? 'fa-arrow-down' : 'fa-arrow-up';
  const label = esTipo ? 'Ingreso' : 'Egreso';
  const signo = esTipo ? '+' : '−';
  const montoCls = esTipo ? 'text-success' : 'text-danger';

  const tdTipo = document.createElement('td');
  tdTipo.className = 'ps-3';
  const span = document.createElement('span');
  span.className = `badge rounded-pill ${badgeCls}`;
  const i = document.createElement('i');
  i.className = `fa-solid ${icono} fa-xs me-1`;
  i.setAttribute('aria-hidden', 'true');
  span.appendChild(i);
  span.appendChild(document.createTextNode(label));
  tdTipo.appendChild(span);

  const tdConcepto = document.createElement('td');
  tdConcepto.className = 'fw-medium';
  tdConcepto.textContent = mov.concepto || '—';

  const tdRef = document.createElement('td');
  if (mov.referencia_id) {
    const refSpan = document.createElement('span');
    refSpan.className = 'badge text-bg-light border font-monospace';
    refSpan.textContent = `#${mov.referencia_id}`;
    tdRef.appendChild(refSpan);
  } else {
    const refSpan = document.createElement('span');
    refSpan.className = 'text-muted small';
    refSpan.textContent = 'Operativo';
    tdRef.appendChild(refSpan);
  }

  const tdHora = document.createElement('td');
  tdHora.className = 'text-muted small';
  tdHora.textContent = formatDate(mov.registrado_en, true);

  const tdMonto = document.createElement('td');
  tdMonto.className = `text-end pe-3 fw-semibold ${montoCls}`;
  tdMonto.textContent = `${signo} ${formatMoney(mov.monto)}`;

  tr.append(tdTipo, tdConcepto, tdRef, tdHora, tdMonto);
  return tr;
}

// Pintar tabla de movimientos con paginación 
function renderTablaMovimientos() {
  const tbody = document.querySelector('#tabla-movimientos-caja tbody');
  const countEl = document.getElementById('mov-total-count');
  if (!tbody) return;

  tbody.replaceChildren(); // limpia sin reflow repetido

  const inicio = (Caja.movPagina - 1) * Caja.movPorPagina;
  const pagina = Caja.movFiltrados.slice(inicio, inicio + Caja.movPorPagina);

  if (pagina.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.className = 'text-center text-muted py-4';
    td.textContent = 'No hay movimientos en este turno.';
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    const fragment = document.createDocumentFragment();
    pagina.forEach(mov => fragment.appendChild(renderFilaMovimiento(mov)));
    tbody.appendChild(fragment);
  }

  if (countEl) countEl.textContent = Caja.movFiltrados.length;
  renderPaginacion('pagination-movimientos', Caja.movFiltrados.length, Caja.movPorPagina, Caja.movPagina, (p) => {
    Caja.movPagina = p;
    renderTablaMovimientos();
  });
}

//  Cargar movimientos del turno 
async function cargarMovimientos(idCaja) {
  try {
    const data = await apiFetch(`/api/caja/${idCaja}/movimientos`);
    Caja.movimientos = Array.isArray(data) ? data : [];
    Caja.movFiltrados = [...Caja.movimientos];
    Caja.movPagina = 1;
    renderTablaMovimientos();
  } catch (err) {
    console.error('Error al cargar movimientos:', err);
    showToast('No se pudieron cargar los movimientos.', 'error');
  }
}

// Filtro de tipo de movimiento 
function initFiltroMovimientos() {
  const sel = document.getElementById('filtro-tipo-movimiento');
  if (!sel) return;
  sel.addEventListener('change', () => {
    const tipo = sel.value;
    Caja.movFiltrados = tipo
      ? Caja.movimientos.filter(m => m.tipo === tipo)
      : [...Caja.movimientos];
    Caja.movPagina = 1;
    renderTablaMovimientos();
  });
}

// Renderizar fila del historial de cajas
function renderFilaHistorial(caja, idx) {
  const detailId = `detalle-hist-caja-${caja.id_caja}`;

  const tr = document.createElement('tr');
  tr.dataset.expandTrigger = detailId;
  tr.style.cursor = 'pointer';

  const tdIcon = document.createElement('td');
  tdIcon.className = 'ps-3';
  const iIcon = document.createElement('i');
  iIcon.className = 'fa-solid fa-chevron-down fa-fw fa-xs';
  iIcon.setAttribute('data-expand-icon', '');
  iIcon.setAttribute('aria-hidden', 'true');
  tdIcon.appendChild(iIcon);

  const tdTurno = document.createElement('td');
  const turnoSpan = document.createElement('span');
  turnoSpan.className = 'fw-medium font-monospace';
  turnoSpan.textContent = `#${String(caja.numero_turno).padStart(5, '0')}`;
  tdTurno.appendChild(turnoSpan);

  const tdCajero = document.createElement('td');
  tdCajero.className = 'fw-medium';
  tdCajero.textContent = caja.cajero_nombre || caja.cajero || '—';

  const tdApertura = document.createElement('td');
  tdApertura.className = 'text-muted small';
  tdApertura.textContent = formatDate(caja.fecha_apertura, true);

  const tdCierre = document.createElement('td');
  tdCierre.className = 'text-muted small';
  tdCierre.textContent = caja.fecha_cierre ? formatDate(caja.fecha_cierre, true) : '—';

  const tdIni = document.createElement('td');
  tdIni.textContent = formatMoney(caja.monto_inicial);

  const tdEsp = document.createElement('td');
  tdEsp.textContent = formatMoney(caja.monto_esperado);

  const tdReal = document.createElement('td');
  tdReal.textContent = caja.monto_real !== null && caja.monto_real !== undefined ? formatMoney(caja.monto_real) : '—';

  const tdDif = document.createElement('td');
  if (caja.diferencia !== null && caja.diferencia !== undefined) {
    const difSpan = document.createElement('span');
    const dif = parseFloat(caja.diferencia);
    difSpan.className = `badge rounded-pill ${dif < 0 ? 'text-bg-warning' : dif > 0 ? 'text-bg-success' : 'text-bg-secondary'}`;
    difSpan.textContent = formatMoney(dif);
    tdDif.appendChild(difSpan);
  } else {
    tdDif.textContent = '—';
  }

  const tdEstado = document.createElement('td');
  const estadoLabel = caja.estado === 'cerrada' ? 'Cerrada' : caja.estado === 'abierta' ? 'Abierta' : caja.estado;
  const estadoClass = caja.estado === 'cerrada' ? 'text-bg-secondary' : 'text-bg-success';
  const spanEst = document.createElement('span');
  spanEst.className = `badge rounded-pill ${estadoClass}`;
  spanEst.textContent = estadoLabel;
  tdEstado.appendChild(spanEst);

  tr.append(tdIcon, tdTurno, tdCajero, tdApertura, tdCierre, tdIni, tdEsp, tdReal, tdDif, tdEstado);
  tr.addEventListener('click', () => {
    const detailRow = document.getElementById(detailId);
    if (!detailRow) return;
    const isOpen = detailRow.classList.toggle('show');
    iIcon.classList.toggle('fa-chevron-down', !isOpen);
    iIcon.classList.toggle('fa-chevron-up', isOpen);
    tr.classList.toggle('table-active', isOpen);
  });

  // Fila de detalle expandible
  const trDetail = document.createElement('tr');
  trDetail.id = detailId;
  trDetail.className = 'detail-row collapse';

  const tdDetail = document.createElement('td');
  tdDetail.colSpan = 10;
  tdDetail.className = 'bg-body-tertiary px-4 py-3';

  const dif = caja.diferencia !== null && caja.diferencia !== undefined ? parseFloat(caja.diferencia) : null;
  const difTexto = dif === null ? '—'
    : dif < 0 ? `Faltante de ${formatMoney(Math.abs(dif))}`
      : dif > 0 ? `Sobrante de ${formatMoney(dif)}`
        : 'Cuadrado';
  const difCls = dif === null ? '' : dif < 0 ? 'text-warning' : dif > 0 ? 'text-success' : 'text-muted';

  tdDetail.innerHTML = `
    <div class="row g-3">
      <div class="col-md-4">
        <p class="text-muted small fw-semibold text-uppercase mb-2">Resumen del turno</p>
        <ul class="list-unstyled small mb-0">
          <li class="mb-1"><i class="fa-solid fa-arrow-down fa-fw text-success me-1" aria-hidden="true"></i>M. inicial: <span class="fw-medium">${formatMoney(caja.monto_inicial)}</span></li>
          <li class="mb-1"><i class="fa-solid fa-arrow-up fa-fw text-danger me-1" aria-hidden="true"></i>M. esperado: <span class="fw-medium">${formatMoney(caja.monto_esperado)}</span></li>
          <li><i class="fa-solid fa-receipt fa-fw text-muted me-1" aria-hidden="true"></i>M. real: <span class="fw-medium">${caja.monto_real !== null ? formatMoney(caja.monto_real) : '—'}</span></li>
        </ul>
      </div>
      <div class="col-md-4">
        <p class="text-muted small fw-semibold text-uppercase mb-2">Diferencia</p>
        <p class="small mb-0 fw-semibold ${difCls}">${difTexto}</p>
        ${caja.observacion ? `<p class="small text-muted mt-1 mb-0"><em>${caja.observacion}</em></p>` : ''}
      </div>
    </div>`;

  trDetail.appendChild(tdDetail);
  return [tr, trDetail];
}

// Renderizar historial de cajas
function renderHistorial() {
  const tbody = document.querySelector('#tabla-historial-cajas tbody');
  if (!tbody) return;

  tbody.replaceChildren();

  let lista = [...Caja.historialTotal];

  // Filtros de fecha
  const desde = document.getElementById('filtro-hist-desde')?.value;
  const hasta = document.getElementById('filtro-hist-hasta')?.value;
  if (desde) lista = lista.filter(c => new Date(c.fecha_apertura) >= new Date(desde));
  if (hasta) lista = lista.filter(c => new Date(c.fecha_apertura) <= new Date(hasta + 'T23:59:59'));

  const inicio = (Caja.historialPagina - 1) * Caja.historialPorPagina;
  const pagina = lista.slice(inicio, inicio + Caja.historialPorPagina);
  const fragment = document.createDocumentFragment();

  if (pagina.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 10;
    td.className = 'text-center text-muted py-4';
    td.textContent = 'No hay turnos registrados.';
    tr.appendChild(td);
    fragment.appendChild(tr);
  } else {
    pagina.forEach((caja, idx) => {
      const [trMain, trDetail] = renderFilaHistorial(caja, idx);
      fragment.appendChild(trMain);
      fragment.appendChild(trDetail);
    });
  }

  tbody.appendChild(fragment);

  const footerSpan = document.querySelector('#section-historial-cajas .card-footer span');
  if (footerSpan) footerSpan.innerHTML = `Mostrando <strong>${inicio + 1}–${Math.min(inicio + Caja.historialPorPagina, lista.length)}</strong> de <strong>${lista.length}</strong> turnos`;

  renderPaginacion('pagination-historial', lista.length, Caja.historialPorPagina, Caja.historialPagina, (p) => {
    Caja.historialPagina = p;
    renderHistorial();
  });
}

// Cargar historial de cajas 
async function cargarHistorial() {
  // El backend no tiene endpoint de historial directo, usamos el de activa
  // Para historial completo, consultamos /api/reportes/caja (si existe) o construimos
  // En este caso, si no hay endpoint de historial de cajas, mostramos aviso
  // Usamos el endpoint de caja activa para obtener todas (enviando estado != activa no es posible con la API actual)
  // Como alternativa, se puede agregar un endpoint; por ahora, ocultamos filas estáticas y mostramos mensaje informativo
  const tbody = document.querySelector('#tabla-historial-cajas tbody');
  if (!tbody) return;

  // ARREGLAR
  try {
    const data = await apiFetch('/api/reportes/cierres-caja');
    if (data && data.datos) {
      Caja.historialTotal = data.datos;
    } else {
      Caja.historialTotal = [];
    }
  } catch {
    Caja.historialTotal = [];
  }
  renderHistorial();
}

// Paginación genérica 
function renderPaginacion(containerId, total, porPagina, paginaActual, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const totalPaginas = Math.ceil(total / porPagina);
  const ul = container.querySelector('ul.pagination') || container;

  // Reconstruir lista
  const ulEl = document.createElement('ul');
  ulEl.className = 'pagination pagination-sm mb-0';

  const crearLi = (label, disabled, active, pageNum, isArrow = false) => {
    const li = document.createElement('li');
    li.className = `page-item${disabled ? ' disabled' : ''}${active ? ' active' : ''}`;
    if (active) li.setAttribute('aria-current', 'page');
    const a = document.createElement('a');
    a.className = 'page-link';
    a.href = '#';
    if (isArrow) {
      const icon = document.createElement('i');
      icon.className = label;
      icon.setAttribute('aria-hidden', 'true');
      a.appendChild(icon);
    } else {
      a.textContent = label;
    }
    if (!disabled && !active) {
      a.addEventListener('click', (e) => { e.preventDefault(); onPageChange(pageNum); });
    }
    li.appendChild(a);
    return li;
  };

  ulEl.appendChild(crearLi('fa-solid fa-chevron-left fa-xs', paginaActual === 1, false, paginaActual - 1, true));

  for (let i = 1; i <= totalPaginas; i++) {
    ulEl.appendChild(crearLi(String(i), false, i === paginaActual, i));
  }

  ulEl.appendChild(crearLi('fa-solid fa-chevron-right fa-xs', paginaActual === totalPaginas || totalPaginas === 0, false, paginaActual + 1, true));

  container.replaceChildren(ulEl);
}

// Formulario: Abrir caja 
function initFormAbrirCaja() {
  const form = document.getElementById('form-abrir-caja');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.classList.add('was-validated'); return; }

    const montoInicial = parseFloat(document.getElementById('ac-monto-inicial')?.value);
    try {
      await apiFetch('/api/caja/abrir', {
        method: 'POST',
        body: JSON.stringify({ monto_inicial: montoInicial }),
      });
      showToast('Caja abierta correctamente.', 'success');
      bootstrap.Modal.getInstance(document.getElementById('modal-abrir-caja'))?.hide();
      form.reset();
      form.classList.remove('was-validated');
      await iniciarModulo();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

//  Formulario: Egreso manual 
function initFormEgresoManual() {
  const form = document.getElementById('form-egreso-manual');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.classList.add('was-validated'); return; }
    if (!Caja.cajaActiva) { showToast('No hay una caja activa.', 'error'); return; }

    const concepto = document.getElementById('em-concepto')?.value.trim();
    const monto = parseFloat(document.getElementById('em-monto')?.value);

    try {
      await apiFetch(`/api/caja/${Caja.cajaActiva.id_caja}/movimientos`, {
        method: 'POST',
        body: JSON.stringify({ tipo: 'egreso', concepto, monto }),
      });
      showToast('Egreso registrado.', 'success');
      bootstrap.Offcanvas.getInstance(document.getElementById('offcanvas-egreso-manual'))?.hide();
      form.reset();
      form.classList.remove('was-validated');
      await cargarMovimientos(Caja.cajaActiva.id_caja);
      await cargarResumenCaja(Caja.cajaActiva.id_caja);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

//  Formulario: Cierre de caja 
function initFormCierreCaja() {
  const form = document.getElementById('form-cierre-caja');
  const inputReal = document.getElementById('cierre-monto-real');
  const panelDif = document.getElementById('cierre-diferencia-panel');
  const valorDif = document.getElementById('cierre-diferencia-valor');
  const cierreEsp = document.getElementById('cierre-esperado');

  if (!form) return;

  // Calcular diferencia en tiempo real
  if (inputReal) {
    inputReal.addEventListener('input', () => {
      const real = parseFloat(inputReal.value) || 0;
      const esperado = parseFloat(cierreEsp?.textContent?.replace(/[^0-9.-]/g, '')) || 0;
      const dif = real - esperado;

      if (valorDif) valorDif.textContent = formatMoney(dif);
      if (panelDif) {
        panelDif.className = `alert d-flex justify-content-between align-items-center py-2 ${dif < 0 ? 'alert-warning' : dif > 0 ? 'alert-success' : 'alert-secondary'}`;
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.classList.add('was-validated'); return; }
    if (!Caja.cajaActiva) { showToast('No hay caja activa.', 'error'); return; }

    const monto_real = parseFloat(inputReal?.value);
    const observacion = document.getElementById('cierre-observacion')?.value.trim() || null;
    confirmAction('¿Confirmas el cierre de caja? Esta acción no se puede deshacer.', async () => {
      try {
        await apiFetch(`/api/caja/${Caja.cajaActiva.id_caja}/cerrar`, {
          method: 'PATCH',
          body: JSON.stringify({ monto_real, observacion }),
        });
        showToast('Caja cerrada correctamente.', 'success');
        bootstrap.Modal.getInstance(document.getElementById('modal-cierre-caja'))?.hide();
        form.reset();
        form.classList.remove('was-validated');
        await iniciarModulo();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });
}

// Filtros de historial 
function initFiltrosHistorial() {
  const desde = document.getElementById('filtro-hist-desde');
  const hasta = document.getElementById('filtro-hist-hasta');
  if (desde) desde.addEventListener('change', () => { Caja.historialPagina = 1; renderHistorial(); });
  if (hasta) hasta.addEventListener('change', () => { Caja.historialPagina = 1; renderHistorial(); });
}

// Paginación nav containers (añadir IDs en HTML o usar data attributes) 
function asegurarContenedoresPaginacion() {
  // Crear contenedor de paginación para movimientos si no existe
  const footerMov = document.querySelector('#section-movimientos-turno .card-footer nav[aria-label]');
  if (footerMov && !footerMov.id) footerMov.id = 'pagination-movimientos';

  const footerHist = document.querySelector('#section-historial-cajas .card-footer nav[aria-label]');
  if (footerHist && !footerHist.id) footerHist.id = 'pagination-historial';
}

//  Inicializar módulo principal
async function iniciarModulo() {
  try {
    const data = await apiFetch('/api/caja/activa');
    Caja.cajaActiva = data.tieneCajaActiva ? data.caja : null;
    renderEstadoCaja(Caja.cajaActiva);

    if (Caja.cajaActiva) {
      await Promise.all([
        cargarResumenCaja(Caja.cajaActiva.id_caja),
        cargarMovimientos(Caja.cajaActiva.id_caja),
      ]);
    } else {
      const tbody = document.querySelector('#tabla-movimientos-caja tbody');
      if (tbody) {
        tbody.replaceChildren();
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 5;
        td.className = 'text-center text-muted py-4';
        td.textContent = 'No hay un turno activo. Abre la caja para comenzar.';
        tr.appendChild(td);
        tbody.appendChild(tr);
      }
    }

    await cargarHistorial();
  } catch (err) {
    // 403 = el usuario no es Cajero ni Admin, simplemente no tiene caja propia
    if (err.message.includes('403') || err.message.toLowerCase().includes('permiso')) {
      renderEstadoCaja(null); // mostrar estado "Cerrada" sin toast de error
    } else {
      console.error('Error al iniciar módulo de caja:', err);
      showToast('No se pudo cargar el estado de la caja.', 'error');
    }
    await cargarHistorial();
  }
}

// Punto de entrada
document.addEventListener('DOMContentLoaded', () => {
  asegurarContenedoresPaginacion();
  initFormAbrirCaja();
  initFormEgresoManual();
  initFormCierreCaja();
  initFiltroMovimientos();
  initFiltrosHistorial();
  iniciarModulo();
});
