
// Estado 
const ComprasState = {
  ordenes: [],
  filtradas: [],
  pagina: 1,
  porPagina: 10,
  productosOrden: [],// líneas del formulario nueva orden
  cajaActiva: null,
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

// Renderizar fila de orden de compra
function renderFilaOrden(o) {
  const detailId = `orden-detail-${o.id_orden}`;
  const tr = document.createElement('tr');
  tr.style.cursor = 'pointer';

  const tdIco = document.createElement('td');
  tdIco.className = 'ps-3';
  const iIco = document.createElement('i');
  iIco.className = 'fa-solid fa-chevron-down fa-fw fa-xs';
  iIco.setAttribute('aria-hidden', 'true');
  tdIco.appendChild(iIco);

  const tdNum = document.createElement('td');
  const numSpan = document.createElement('span');
  numSpan.className = 'fw-semibold font-monospace';
  numSpan.textContent = o.numero_orden;
  tdNum.appendChild(numSpan);

  const tdProv = document.createElement('td');
  tdProv.className = 'fw-medium';
  tdProv.textContent = o.proveedor_nombre || '—';

  const tdEmp = document.createElement('td');
  tdEmp.className = 'text-muted small';
  tdEmp.textContent = o.empleado_nombre || '—';

  const tdFecha = document.createElement('td');
  tdFecha.className = 'text-muted small';
  tdFecha.textContent = formatDate(o.fecha, false);

  const tdFEsp = document.createElement('td');
  tdFEsp.className = 'text-muted small';
  tdFEsp.textContent = o.fecha_esperada ? formatDate(o.fecha_esperada, false) : '—';

  const tdTotal = document.createElement('td');
  tdTotal.className = 'fw-semibold';
  tdTotal.textContent = formatMoney(o.total);

  const tdEstado = document.createElement('td');
  tdEstado.innerHTML = getBadge(o.estado);

  const tdAcciones = document.createElement('td');
  tdAcciones.className = 'text-end pe-3';
  if (o.estado === 'borrador') {
    tdAcciones.innerHTML = `
      <button type="button" class="btn btn-sm btn-outline-success me-1" data-accion="enviar-orden" title="Marcar como enviada">
        <i class="fa-solid fa-paper-plane" aria-hidden="true"></i>
      </button>
      <button type="button" class="btn btn-sm btn-outline-danger" data-accion="anular-orden" title="Anular orden">
        <i class="fa-solid fa-ban" aria-hidden="true"></i>
      </button>
    `;
  } else if (o.estado === 'enviada') {
    tdAcciones.innerHTML = `
      <button type="button" class="btn btn-sm btn-outline-danger" data-accion="anular-orden" title="Anular orden">
        <i class="fa-solid fa-ban" aria-hidden="true"></i>
      </button>
    `;
  } else {
    tdAcciones.innerHTML = '<span class="text-muted small">Sin acciones</span>';
  }
  tdAcciones.querySelector('[data-accion="enviar-orden"]')?.addEventListener('click', () => enviarOrden(o.id_orden, o.numero_orden));
  tdAcciones.querySelector('[data-accion="anular-orden"]')?.addEventListener('click', () => anularOrden(o.id_orden, o.numero_orden));

  tr.append(tdIco, tdNum, tdProv, tdEmp, tdFecha, tdFEsp, tdTotal, tdEstado, tdAcciones);

  // Click para expandir
  tr.addEventListener('click', (e) => {
    if (e.target.closest('button, a')) return;
    const detailRow = document.getElementById(detailId);
    if (!detailRow) return;
    const isOpen = detailRow.classList.toggle('show');
    iIco.classList.toggle('fa-chevron-down', !isOpen);
    iIco.classList.toggle('fa-chevron-up', isOpen);
    tr.classList.toggle('table-active', isOpen);
    if (isOpen && !detailRow.dataset.loaded) cargarDetalleOrdenExpandible(o.id_orden, detailId);
  });

  // Fila de detalle
  const trDetail = document.createElement('tr');
  trDetail.id = detailId;
  trDetail.className = 'detail-row collapse';
  const tdDetail = document.createElement('td');
  tdDetail.colSpan = 9;
  tdDetail.className = 'p-0';
  tdDetail.innerHTML = '<div class="px-4 py-3 text-muted small"><i class="fa-solid fa-spinner fa-spin me-1"></i> Cargando...</div>';
  trDetail.appendChild(tdDetail);

  return [tr, trDetail];
}

// Renderizar tabla
function renderTablaOrdenes() {
  const tbody = document.querySelector('#tabla-ordenes tbody');
  if (!tbody) return;
  tbody.replaceChildren();

  const inicio = (ComprasState.pagina - 1) * ComprasState.porPagina;
  const pagina = ComprasState.filtradas.slice(inicio, inicio + ComprasState.porPagina);
  const frag = document.createDocumentFragment();

  if (pagina.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 9;
    td.className = 'text-center text-muted py-4';
    td.textContent = 'No hay órdenes de compra.';
    tr.appendChild(td);
    frag.appendChild(tr);
  } else {
    pagina.forEach(o => {
      const [trMain, trDetail] = renderFilaOrden(o);
      frag.appendChild(trMain);
      frag.appendChild(trDetail);
    });
  }
  tbody.appendChild(frag);

  const nav = document.querySelector('#section-ordenes .card-footer nav');
  if (nav) {
    if (!nav.id) nav.id = 'pagination-ordenes';
    renderPaginacion('pagination-ordenes', ComprasState.filtradas.length, ComprasState.porPagina, ComprasState.pagina, (p) => {
      ComprasState.pagina = p;
      renderTablaOrdenes();
    });
  }
}

// Cargar detalle de orden en fila expandible
async function cargarDetalleOrdenExpandible(id_orden, detailId) {
  const trDetail = document.getElementById(detailId);
  if (!trDetail) return;
  const td = trDetail.querySelector('td');
  try {
    const data = await apiFetch(`/api/compras/${id_orden}`);
    trDetail.dataset.loaded = '1';
    const div = document.createElement('div');
    div.className = 'px-4 py-3';

    const row = document.createElement('div');
    row.className = 'row g-3';

    // Detalle de productos
    const colProd = document.createElement('div');
    colProd.className = 'col-12 col-md-8';
    const pTit = document.createElement('p');
    pTit.className = 'small fw-semibold mb-2';
    pTit.textContent = 'Líneas de la orden';
    const tbl = document.createElement('table');
    tbl.className = 'table table-sm mb-0';
    tbl.innerHTML = '<thead><tr><th>Producto</th><th>Solicitado</th><th>Recibido</th><th>P. Unit.</th><th>Subtotal</th></tr></thead>';
    const tbody2 = document.createElement('tbody');
    (data.detalle || []).forEach(d => {
      const tr2 = document.createElement('tr');
      [d.producto_nombre, d.cantidad_solicitada, d.cantidad_recibida, formatMoney(d.precio_unitario), formatMoney(d.subtotal)].forEach(v => {
        const td2 = document.createElement('td');
        td2.textContent = v;
        tr2.appendChild(td2);
      });
      tbody2.appendChild(tr2);
    });
    tbl.appendChild(tbody2);
    colProd.appendChild(pTit);
    colProd.appendChild(tbl);

    // Resumen
    const colRes = document.createElement('div');
    colRes.className = 'col-12 col-md-4';
    const pTitR = document.createElement('p');
    pTitR.className = 'small fw-semibold mb-2';
    pTitR.textContent = 'Resumen';
    const ulRes = document.createElement('ul');
    ulRes.className = 'list-unstyled small';
    [
      ['Subtotal', formatMoney(data.orden?.subtotal)],
      ['IGV', formatMoney(data.orden?.igv)],
      ['Total', formatMoney(data.orden?.total)],
      ['Observación', data.orden?.observacion || '—'],
    ].forEach(([lbl, val]) => {
      const li = document.createElement('li');
      li.className = 'd-flex justify-content-between';
      li.innerHTML = `<span class="text-muted">${lbl}</span><strong>${val}</strong>`;
      ulRes.appendChild(li);
    });
    colRes.appendChild(pTitR);
    colRes.appendChild(ulRes);

    row.appendChild(colProd);
    row.appendChild(colRes);
    div.appendChild(row);
    if (td) td.replaceChildren(div);
  } catch (err) {
    if (td) td.innerHTML = `<div class="px-4 py-2 text-danger small">Error: ${err.message}</div>`;
  }
}

// Cargar órdenes
async function cargarOrdenes(filtros = {}) {
  try {
    const params = new URLSearchParams();
    if (filtros.proveedor) params.set('proveedor', filtros.proveedor);
    if (filtros.estado) params.set('estado', filtros.estado);
    if (filtros.fecha_desde) params.set('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta) params.set('fecha_hasta', filtros.fecha_hasta);

    const data = await apiFetch(`/api/compras?${params}`);
    ComprasState.ordenes = Array.isArray(data.ordenes) ? data.ordenes : [];
    ComprasState.filtradas = [...ComprasState.ordenes];
    ComprasState.pagina = 1;
    renderTablaOrdenes();
  } catch (err) {
    showToast('Error al cargar órdenes: ' + err.message, 'error');
  }
}

// Enviar orden
async function enviarOrden(id, numero) {
  confirmAction(`¿Marcar la orden ${numero} como enviada al proveedor?`, async () => {
    try {
      await apiFetch(`/api/compras/${id}/enviar`, { method: 'PATCH' });
      showToast('Orden enviada.', 'success');
      cargarOrdenes();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// Anular orden
async function anularOrden(id, numero) {
  confirmAction(`¿Anular la orden ${numero}?`, async () => {
    try {
      await apiFetch(`/api/compras/${id}/anular`, { method: 'PATCH' });
      showToast('Orden anulada.', 'warning');
      cargarOrdenes();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// Cargar proveedores en select
async function cargarProveedoresSelect() {
  const sel = document.getElementById('no-proveedor');
  if (!sel) return;
  try {
    const data = await apiFetch('/api/proveedores');
    const proveedores = Array.isArray(data) ? data : (data.proveedores || []);
    sel.replaceChildren();
    const optDefault = document.createElement('option');
    optDefault.value = '';
    optDefault.textContent = 'Seleccionar proveedor...';
    sel.appendChild(optDefault);
    const frag = document.createDocumentFragment();
    proveedores.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id_proveedor;
      opt.textContent = `${p.nombre} — ${p.ruc || '—'}`;
      frag.appendChild(opt);
    });
    sel.appendChild(frag);
  } catch {
    // No crítico
  }
}

// REEMPLAZAR la función completa:
function agregarLineaProducto(producto = null) {
  const container = document.getElementById('tbody-lineas-orden');
  if (!container) return;

  const productos = window._productosCache || [];

  const tr = document.createElement('tr');
  tr.className = 'linea-orden';

  // Columna PRODUCTO — select con los productos del proveedor
  const tdProd = document.createElement('td');
  const sel = document.createElement('select');
  sel.className = 'form-select form-select-sm linea-producto-nombre';
  sel.setAttribute('aria-label', 'Producto');

  const optDefault = document.createElement('option');
  optDefault.value = '';
  optDefault.textContent = 'Seleccionar producto...';
  sel.appendChild(optDefault);

  productos.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id_producto;
    opt.textContent = p.nombre;
    opt.dataset.precio = p.precio_compra || '';
    sel.appendChild(opt);
  });

  if (producto) sel.value = producto.id_producto;

  sel.addEventListener('change', () => {
    const selected = sel.options[sel.selectedIndex];
    const precioInput = tr.querySelector('.linea-precio');
    if (precioInput && selected?.dataset.precio) {
      precioInput.value = selected.dataset.precio;
      precioInput.dispatchEvent(new Event('input'));
    }
    actualizarTotalesOrden();
  });

  tdProd.appendChild(sel);

  // Columna CANTIDAD
  const tdCant = document.createElement('td');
  const inputC = document.createElement('input');
  inputC.type = 'number';
  inputC.className = 'form-control form-control-sm linea-cantidad';
  inputC.placeholder = '0';
  inputC.min = '0.01';
  inputC.step = '0.01';
  inputC.value = producto?.cantidad || '';
  inputC.addEventListener('input', actualizarTotalesOrden);
  tdCant.appendChild(inputC);

  // Columna P. UNITARIO
  const tdPrecio = document.createElement('td');
  const inputPr = document.createElement('input');
  inputPr.type = 'number';
  inputPr.className = 'form-control form-control-sm linea-precio';
  inputPr.placeholder = '0.00';
  inputPr.min = '0.01';
  inputPr.step = '0.01';
  inputPr.value = producto?.precio_compra || '';
  inputPr.addEventListener('input', actualizarTotalesOrden);
  tdPrecio.appendChild(inputPr);

  // Columna SUBTOTAL
  const tdSub = document.createElement('td');
  tdSub.className = 'linea-subtotal text-end text-muted small';
  tdSub.textContent = '—';

  // Columna ELIMINAR
  const tdElim = document.createElement('td');
  const btnElim = document.createElement('button');
  btnElim.type = 'button';
  btnElim.className = 'btn btn-sm btn-outline-danger';
  btnElim.setAttribute('aria-label', 'Quitar línea');
  btnElim.innerHTML = '<i class="fa-solid fa-minus" aria-hidden="true"></i>';
  btnElim.addEventListener('click', () => {
    if (container.querySelectorAll('.linea-orden').length > 1) {
      tr.remove();
      actualizarTotalesOrden();
    } else {
      showToast('Debe haber al menos una línea de producto.', 'warning');
    }
  });
  tdElim.appendChild(btnElim);

  tr.append(tdProd, tdCant, tdPrecio, tdSub, tdElim);
  container.appendChild(tr);
}

function actualizarTotalesOrden() {
  let subtotal = 0;
  document.querySelectorAll('.linea-orden').forEach(tr => {
    const cant = parseFloat(tr.querySelector('.linea-cantidad')?.value) || 0;
    const precio = parseFloat(tr.querySelector('.linea-precio')?.value) || 0;
    const sub = cant * precio;
    const tdSub = tr.querySelector('.linea-subtotal');
    if (tdSub) tdSub.textContent = sub > 0 ? formatMoney(sub) : '—';
    subtotal += sub;
  });
  const igv = subtotal * 0.18;
  const total = subtotal + igv;
  const fmt = v => formatMoney(v);
  document.getElementById('no-subtotal').textContent = fmt(subtotal);
  document.getElementById('no-igv').textContent = fmt(igv);
  document.getElementById('no-total').textContent = fmt(total);
}

async function cargarProductosProveedor(id_proveedor = '') {
  window._productosCache = [];
  // Limpiar líneas existentes y poner una vacía
  const container = document.getElementById('tbody-lineas-orden');
  if (container) { container.replaceChildren(); }

  // Ocultar alerta hasta que carguemos
  const alerta = document.getElementById('alerta-stock-critico');
  if (alerta) alerta.classList.add('d-none');

  if (!id_proveedor) return;

  try {
    // Cargar productos del proveedor
    const data = await apiFetch(`/api/proveedores/${id_proveedor}/productos`);
    window._productosCache = data.productos || [];

    // Cargar productos con stock bajo de este proveedor
    const stockData = await apiFetch('/api/reportes/stock-bajo');
    const idsProveedor = new Set(window._productosCache.map(p => p.id_producto));
    window._stockBajoCache = (stockData.datos || []).filter(p => idsProveedor.has(p.id_producto));

    // Mostrar alerta si hay productos con stock bajo del proveedor seleccionado
    if (window._stockBajoCache.length > 0 && alerta) {
      document.getElementById('alerta-stock-count').textContent = window._stockBajoCache.length;
      alerta.classList.remove('d-none');
    }

    // Agregar primera línea vacía
    agregarLineaProducto();
  } catch (err) {
    showToast('Error al cargar productos del proveedor: ' + err.message, 'error');
  }
}

// Formulario: nueva orden de compra
function initFormNuevaOrden() {
  const form = document.getElementById('form-nueva-orden');
  if (!form) return;

  const btnAgrLinea = document.getElementById('btn-agregar-linea-orden');
  if (btnAgrLinea) btnAgrLinea.addEventListener('click', () => agregarLineaProducto());

  const selProv = document.getElementById('no-proveedor');
  if (selProv) {
    selProv.addEventListener('change', () => cargarProductosProveedor(selProv.value));
  }


  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.classList.add('was-validated'); return; }

    const id_proveedor = document.getElementById('no-proveedor')?.value;
    const fecha_esperada = document.getElementById('no-fecha-esperada')?.value || null;
    const observacion = document.getElementById('no-observacion')?.value.trim() || null;

    if (!id_proveedor) { showToast('Selecciona un proveedor.', 'warning'); return; }

    const lineas = [];
    let error = false;
    document.querySelectorAll('.linea-orden').forEach(tr => {
      const sel = tr.querySelector('.linea-producto-nombre');
      const inputCant = tr.querySelector('.linea-cantidad');
      const inputPr = tr.querySelector('.linea-precio');
      const id_producto = parseInt(sel?.value);
      const cantidad = parseFloat(inputCant?.value);
      const precio = parseFloat(inputPr?.value);

      if (!id_producto || isNaN(cantidad) || cantidad <= 0 || isNaN(precio) || precio <= 0) {
        error = true; return;
      }
      lineas.push({ id_producto, cantidad, precio_unitario: precio });
    });

    if (error || lineas.length === 0) {
      showToast('Completa todos los campos de las líneas de producto.', 'warning');
      return;
    }

    try {
      await apiFetch('/api/compras', {
        method: 'POST',
        body: JSON.stringify({ id_proveedor: parseInt(id_proveedor), fecha_esperada, observacion, productos: lineas }),
      });
      showToast('Orden de compra creada.', 'success');
      bootstrap.Offcanvas.getInstance(document.getElementById('offcanvas-nueva-orden'))?.hide();
      form.reset();
      form.classList.remove('was-validated');
      // Limpiar líneas y reiniciar
      const container = document.getElementById('tbody-lineas-orden');
      if (container) { container.replaceChildren(); agregarLineaProducto(); }
      cargarOrdenes();
    } catch (err) {
      showToast('Error al crear orden: ' + err.message, 'error');
    }
  });


  document.getElementById('btn-cargar-stock-critico')?.addEventListener('click', () => {
    const container = document.getElementById('tbody-lineas-orden');
    if (!container) return;

    // Limpiar líneas vacías antes de agregar
    container.querySelectorAll('.linea-orden').forEach(tr => {
      const val = tr.querySelector('.linea-producto-nombre')?.value;
      if (!val) tr.remove();
    });

    (window._stockBajoCache || []).forEach(p => {
      // Evitar duplicados
      const yaAgregado = Array.from(container.querySelectorAll('.linea-producto-nombre'))
        .some(sel => sel.value === String(p.id_producto));
      if (!yaAgregado) {
        agregarLineaProducto({
          id_producto: p.id_producto,
          cantidad: p.diferencia, // cantidad sugerida = lo que falta para llegar al mínimo
          precio_compra: null // precio viene del select onChange
        });
      }
    });

    // Cerrar la alerta
    document.getElementById('alerta-stock-critico')?.classList.add('d-none');
    actualizarTotalesOrden();
  });

}


async function cargarOrdenesPendientesSelect(idOrdenPreseleccionada = null) {
  const sel = document.getElementById('nr-orden');
  if (!sel) return;
  try {
    const data = await apiFetch('/api/compras?estado=enviada');
    const ordenes = Array.isArray(data.ordenes) ? data.ordenes : [];

    sel.replaceChildren();
    const optDefault = document.createElement('option');
    optDefault.value = '';
    optDefault.disabled = true;
    optDefault.textContent = ordenes.length
      ? 'Seleccionar orden…'
      : 'No hay órdenes enviadas pendientes de recibir';
    sel.appendChild(optDefault);

    ordenes.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.id_orden;
      opt.textContent = `${o.numero_orden} — ${o.proveedor_nombre || 'Proveedor no disponible'}`;
      sel.appendChild(opt);
    });

    if (idOrdenPreseleccionada) {
      sel.value = idOrdenPreseleccionada;
    } else {
      optDefault.selected = true;
    }
  } catch (err) {
    showToast('No se pudieron cargar las órdenes pendientes: ' + err.message, 'error');
  }
}


async function prepararRecepcion(id_orden) {
  const tbody = document.getElementById('tbody-lineas-recepcion');
  if (!tbody) return;

  if (!id_orden) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3 small">Selecciona una orden de compra para ver sus productos pendientes.</td></tr>';
    return;
  }

  tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3"><i class="fa-solid fa-spinner fa-spin me-2"></i>Cargando productos…</td></tr>';

  try {
    const data = await apiFetch(`/api/compras/${id_orden}`);
    const lineas = (data.detalle || []).filter(d => d.cantidad_solicitada > d.cantidad_recibida);

    tbody.replaceChildren();
    const frag = document.createDocumentFragment();
    if (lineas.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 6;
      td.className = 'text-center text-muted py-3';
      td.textContent = 'Esta orden ya está totalmente recibida.';
      tr.appendChild(td);
      frag.appendChild(tr);
      tbody.appendChild(frag);
      return;
    }

    lineas.forEach(l => {
      const pendiente = l.cantidad_solicitada - l.cantidad_recibida;
      const tr = document.createElement('tr');
      tr.dataset.idProducto = l.id_producto;

      const tdNom = document.createElement('td');
      tdNom.textContent = l.producto_nombre;
      tdNom.className = 'fw-medium';
      tdNom.dataset.idProducto = l.id_producto;

      const tdPend = document.createElement('td');
      tdPend.className = 'text-muted small';
      tdPend.textContent = pendiente;

      const tdCant = document.createElement('td');
      const inputCant = document.createElement('input');
      inputCant.type = 'number';
      inputCant.className = 'form-control form-control-sm rec-cantidad';
      inputCant.value = pendiente;
      inputCant.max = pendiente;
      inputCant.min = '0';
      inputCant.step = '0.01';
      inputCant.dataset.idProducto = l.id_producto;
      inputCant.setAttribute('aria-label', `Cantidad recibida de ${l.producto_nombre}`);
      tdCant.appendChild(inputCant);

      const tdPrecio = document.createElement('td');
      const inputGroup = document.createElement('div');
      inputGroup.className = 'input-group input-group-sm';
      const spanPrefix = document.createElement('span');
      spanPrefix.className = 'input-group-text';
      spanPrefix.textContent = 'S/';
      const inputPrecio = document.createElement('input');
      inputPrecio.type = 'number';
      inputPrecio.className = 'form-control rec-precio';
      inputPrecio.min = '0';
      inputPrecio.step = '0.01';
      inputPrecio.value = l.precio_unitario ?? '';
      inputPrecio.dataset.idProducto = l.id_producto;
      inputPrecio.setAttribute('aria-label', `Precio unitario de ${l.producto_nombre}`);
      inputGroup.append(spanPrefix, inputPrecio);
      tdPrecio.appendChild(inputGroup);

      const tdLote = document.createElement('td');
      const tdVenc = document.createElement('td');

      if (l.tiene_lote) {
        const inputLote = document.createElement('input');
        inputLote.type = 'text';
        inputLote.className = 'form-control form-control-sm rec-lote font-monospace';
        inputLote.placeholder = 'Ej: L2026-045';
        inputLote.maxLength = 50;
        inputLote.dataset.idProducto = l.id_producto;
        tdLote.appendChild(inputLote);

        const inputVenc = document.createElement('input');
        inputVenc.type = 'date';
        inputVenc.className = 'form-control form-control-sm rec-vencimiento';
        inputVenc.dataset.idProducto = l.id_producto;
        tdVenc.appendChild(inputVenc);
      } else {
        // Este producto no maneja lotes/vencimiento, no tiene sentido pedírselo
        tdLote.innerHTML = '<span class="text-muted small">No aplica</span>';
        tdVenc.innerHTML = '<span class="text-muted small">No aplica</span>';
      }

      tr.append(tdNom, tdPend, tdCant, tdPrecio, tdLote, tdVenc);
      frag.appendChild(tr);
    });
    tbody.appendChild(frag);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-3 small">Error al cargar la orden: ${err.message}</td></tr>`;
  }
}

// Formulario: registrar recepción
function initFormRecepcion() {
  const form = document.getElementById('form-nueva-recepcion');
  if (!form) return;

  document.getElementById('offcanvas-nueva-recepcion')?.addEventListener('show.bs.offcanvas', () => {
    cargarOrdenesPendientesSelect();
    cargarAlmacenesSelect();
    prepararRecepcion(null);
  });

  // Cambiar manualmente la orden en el select recarga sus productos pendientes
  document.getElementById('nr-orden')?.addEventListener('change', (e) => {
    prepararRecepcion(e.target.value || null);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id_orden = document.getElementById('nr-orden')?.value;
    const guia = document.getElementById('nr-guia')?.value.trim() || null;
    const id_almacen = parseInt(document.getElementById('nr-almacen')?.value) || 1;

    const productos = [];
    document.querySelectorAll('#tabla-recepcion-productos tbody tr[data-id-producto]').forEach(row => {
      const inputCant = row.querySelector('.rec-cantidad');
      const inputPrecio = row.querySelector('.rec-precio');
      const inputLote = row.querySelector('.rec-lote');
      const inputVenc = row.querySelector('.rec-vencimiento');
      const id_producto = parseInt(row.dataset.idProducto);
      const cantidad = parseFloat(inputCant?.value);
      const precio_unitario = parseFloat(inputPrecio?.value);
      if (id_producto && !isNaN(cantidad) && cantidad > 0) {
        productos.push({
          id_producto,
          cantidad,
          precio_unitario: isNaN(precio_unitario) ? undefined : precio_unitario,
          numero_lote: inputLote?.value.trim() || null,
          fecha_vencimiento: inputVenc?.value || null,
        });
      }
    });

    if (productos.length === 0) {
      showToast('Ingresa cantidades para al menos un producto.', 'warning');
      return;
    }

    if (!ComprasState.cajaActiva) {
      showToast('Necesitas una caja abierta para registrar el pago al proveedor.', 'error');
      return;
    }

    try {
      await apiFetch(`/api/compras/${id_orden}/recepciones`, {
        method: 'POST',
        body: JSON.stringify({
          productos, id_almacen, guia_remision: guia,
          id_caja: ComprasState.cajaActiva.id_caja,
        }),
      });
      showToast('Recepción registrada exitosamente.', 'success');
      bootstrap.Offcanvas.getInstance(document.getElementById('offcanvas-nueva-recepcion'))?.hide();
      form.reset();
      cargarOrdenes();
    } catch (err) {
      showToast('Error al registrar recepción: ' + err.message, 'error');
    }
  });
}

// Filtros
function initFiltros() {
  // Filtros de órdenes — se aplican solos, no hay botón "Filtrar" en esta barra
  const getFiltros = () => ({
    proveedor: document.getElementById('input-buscar-orden')?.value.trim(),
    estado: document.getElementById('filtro-estado-orden')?.value,
    fecha_desde: document.getElementById('filtro-fecha-desde-orden')?.value,
    fecha_hasta: document.getElementById('filtro-fecha-hasta-orden')?.value,
  });

  let timeoutBusquedaOrden;
  document.getElementById('input-buscar-orden')?.addEventListener('input', () => {
    clearTimeout(timeoutBusquedaOrden);
    timeoutBusquedaOrden = setTimeout(() => cargarOrdenes(getFiltros()), 300);
  });
  document.getElementById('filtro-estado-orden')?.addEventListener('change', () => cargarOrdenes(getFiltros()));
  document.getElementById('filtro-fecha-desde-orden')?.addEventListener('change', () => cargarOrdenes(getFiltros()));
  document.getElementById('filtro-fecha-hasta-orden')?.addEventListener('change', () => cargarOrdenes(getFiltros()));

  // Filtros de recepciones
  const getFiltrosRec = () => ({
    fecha_desde: document.getElementById('filtro-fecha-desde-rec')?.value,
    fecha_hasta: document.getElementById('filtro-fecha-hasta-rec')?.value,
    busqueda: document.getElementById('input-buscar-recepcion')?.value.trim(),
  });

  let timeoutBusquedaRec;
  document.getElementById('input-buscar-recepcion')?.addEventListener('input', () => {
    clearTimeout(timeoutBusquedaRec);
    timeoutBusquedaRec = setTimeout(() => cargarRecepciones(getFiltrosRec()), 300);
  });
  document.getElementById('filtro-fecha-desde-rec')?.addEventListener('change', () => cargarRecepciones(getFiltrosRec()));
  document.getElementById('filtro-fecha-hasta-rec')?.addEventListener('change', () => cargarRecepciones(getFiltrosRec()));

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

// Renderizar fila de recepción
function renderFilaRecepcion(r) {
  const detailId = `rec-detail-${r.id_recepcion}`;
  const tr = document.createElement('tr');
  tr.style.cursor = 'pointer';

  const tdIco = document.createElement('td');
  tdIco.className = 'ps-3';
  const iIco = document.createElement('i');
  iIco.className = 'fa-solid fa-chevron-down fa-fw fa-xs';
  iIco.setAttribute('aria-hidden', 'true');
  tdIco.appendChild(iIco);

  const tdNum = document.createElement('td');
  const numSpan = document.createElement('span');
  numSpan.className = 'fw-semibold font-monospace';
  numSpan.textContent = `REC-${String(r.id_recepcion).padStart(4, '0')}`;
  tdNum.appendChild(numSpan);

  const tdOrden = document.createElement('td');
  tdOrden.className = 'text-muted small';
  tdOrden.textContent = r.numero_orden || `OC-${r.id_orden}`;

  const tdProv = document.createElement('td');
  tdProv.className = 'fw-medium';
  tdProv.textContent = r.proveedor_nombre || '—';

  const tdAlm = document.createElement('td');
  tdAlm.className = 'text-muted small';
  tdAlm.textContent = r.almacen_nombre || '—';

  const tdGuia = document.createElement('td');
  tdGuia.className = 'font-monospace small';
  tdGuia.textContent = r.numero_guia || '—';

  const tdFecha = document.createElement('td');
  tdFecha.className = 'text-muted small';
  tdFecha.textContent = formatDate(r.fecha, false);

  tr.append(tdIco, tdNum, tdOrden, tdProv, tdAlm, tdGuia, tdFecha);

  tr.addEventListener('click', () => {
    const detailRow = document.getElementById(detailId);
    if (!detailRow) return;
    const isOpen = detailRow.classList.toggle('show');
    iIco.classList.toggle('fa-chevron-down', !isOpen);
    iIco.classList.toggle('fa-chevron-up', isOpen);
    tr.classList.toggle('table-active', isOpen);
  });

  // Fila de detalle con productos
  const trDetail = document.createElement('tr');
  trDetail.id = detailId;
  trDetail.className = 'detail-row collapse';
  const tdDetail = document.createElement('td');
  tdDetail.colSpan = 7;
  tdDetail.className = 'p-0';

  if (r.productos && r.productos.length > 0) {
    const div = document.createElement('div');
    div.className = 'px-4 py-3';
    const tbl = document.createElement('table');
    tbl.className = 'table table-sm mb-0';
    tbl.innerHTML = '<thead><tr><th>Producto</th><th>Cant. recibida</th><th>P. unitario</th><th>N° Lote</th><th>Vence</th></tr></thead>';
    const tb = document.createElement('tbody');
    r.productos.forEach(p => {
      const tr2 = document.createElement('tr');
      [p.producto_nombre, p.cantidad_recibida, formatMoney(p.precio_unitario), p.numero_lote || '—', p.fecha_vencimiento ? formatDate(p.fecha_vencimiento) : '—'].forEach(v => {
        const td2 = document.createElement('td'); td2.textContent = v; tr2.appendChild(td2);
      });
      tb.appendChild(tr2);
    });
    tbl.appendChild(tb);
    div.appendChild(tbl);
    tdDetail.appendChild(div);
  } else {
    tdDetail.innerHTML = '<div class="px-4 py-2 text-muted small">Sin detalle de productos.</div>';
  }
  trDetail.appendChild(tdDetail);

  return [tr, trDetail];
}

// Cargar recepciones (todas las órdenes recibidas)
async function cargarRecepciones(filtros = {}) {
  const tbody = document.querySelector('#tabla-recepciones tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted"><i class="fa-solid fa-spinner fa-spin me-2"></i>Cargando...</td></tr>';
  try {
    // Traemos TODAS las órdenes recibidas/enviadas sin filtrar acá — el
    // filtro real (guía, proveedor, fecha de recepción) se aplica abajo,
    // sobre las recepciones, no sobre las órdenes.
    const [dataRec, dataEnv] = await Promise.all([
      apiFetch(`/api/compras?estado=recibida`),
      apiFetch(`/api/compras?estado=enviada`),
    ]);

    const ordenes = [
      ...(Array.isArray(dataRec.ordenes) ? dataRec.ordenes : []),
      ...(Array.isArray(dataEnv.ordenes) ? dataEnv.ordenes : []),
    ];

    // Para cada orden, cargar sus recepciones
    let todasRecepciones = [];
    await Promise.all(ordenes.map(async o => {
      try {
        const r = await apiFetch(`/api/compras/${o.id_orden}/recepciones`);
        (r.recepciones || []).forEach(rec => {
          todasRecepciones.push({ ...rec, numero_orden: o.numero_orden, proveedor_nombre: o.proveedor_nombre });
        });
      } catch { /* orden sin recepciones */ }
    }));

    // Filtro por texto: busca en N° de guía o nombre del proveedor
    if (filtros.busqueda) {
      const texto = filtros.busqueda.toLowerCase();
      todasRecepciones = todasRecepciones.filter(r =>
        (r.numero_guia || '').toLowerCase().includes(texto) ||
        (r.proveedor_nombre || '').toLowerCase().includes(texto)
      );
    }

    // Filtro por rango de fechas: sobre la fecha real de la recepción
    if (filtros.fecha_desde) {
      const desde = new Date(filtros.fecha_desde);
      todasRecepciones = todasRecepciones.filter(r => new Date(r.fecha) >= desde);
    }
    if (filtros.fecha_hasta) {
      const hasta = new Date(filtros.fecha_hasta);
      hasta.setHours(23, 59, 59, 999); // incluir todo el día "hasta"
      todasRecepciones = todasRecepciones.filter(r => new Date(r.fecha) <= hasta);
    }

    todasRecepciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    tbody.replaceChildren();
    if (todasRecepciones.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No hay recepciones que coincidan con el filtro.</td></tr>';
      return;
    }
    const frag = document.createDocumentFragment();
    todasRecepciones.forEach(r => {
      const [trMain, trDetail] = renderFilaRecepcion(r);
      frag.appendChild(trMain);
      frag.appendChild(trDetail);
    });
    tbody.appendChild(frag);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">Error: ${err.message}</td></tr>`;
  }
}

async function cargarAlmacenesSelect() {
  const sel = document.getElementById('nr-almacen');
  if (!sel) return;
  try {
    const data = await apiFetch('/api/inventario/almacenes');
    const almacenes = Array.isArray(data) ? data : (data.almacenes || []);
    sel.replaceChildren();
    const optDefault = document.createElement('option');
    optDefault.value = '';
    optDefault.textContent = 'Seleccionar almacén...';
    sel.appendChild(optDefault);
    almacenes.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.id_almacen;
      opt.textContent = a.nombre;
      sel.appendChild(opt);
    });
  } catch { /* no crítico */ }
}

// Punto de entrada
document.addEventListener('DOMContentLoaded', async () => {
    ComprasState.cajaActiva = await asegurarCajaDeTrabajo();
    await cargarProveedoresSelect();
    initFiltros();
    initFormNuevaOrden();
    initFormRecepcion();
    cargarOrdenes();
    cargarRecepciones();
});