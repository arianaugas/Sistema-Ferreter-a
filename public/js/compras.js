
// Estado 
const ComprasState = {
  ordenes: [],
  filtradas: [],
  pagina: 1,
  porPagina: 10,
  productosOrden: [],// líneas del formulario nueva orden
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
  numSpan.className = 'badge text-bg-light border font-monospace';
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
  const divAcc = document.createElement('div');
  divAcc.className = 'd-flex gap-1 justify-content-end';

  if (o.estado === 'borrador') {
    const btnEnviar = document.createElement('button');
    btnEnviar.type = 'button';
    btnEnviar.className = 'btn btn-sm btn-outline-primary';
    btnEnviar.title = 'Enviar orden';
    btnEnviar.innerHTML = '<i class="fa-solid fa-paper-plane fa-fw" aria-hidden="true"></i>';
    btnEnviar.addEventListener('click', (e) => { e.stopPropagation(); enviarOrden(o.id_orden, o.numero_orden); });
    divAcc.appendChild(btnEnviar);
  }

  if (['borrador', 'enviada'].includes(o.estado)) {
    const btnAnular = document.createElement('button');
    btnAnular.type = 'button';
    btnAnular.className = 'btn btn-sm btn-outline-danger';
    btnAnular.title = 'Anular orden';
    btnAnular.innerHTML = '<i class="fa-solid fa-ban fa-fw" aria-hidden="true"></i>';
    btnAnular.addEventListener('click', (e) => { e.stopPropagation(); anularOrden(o.id_orden, o.numero_orden); });
    divAcc.appendChild(btnAnular);
  }

  if (o.estado === 'enviada') {
    const btnRecep = document.createElement('button');
    btnRecep.type = 'button';
    btnRecep.className = 'btn btn-sm btn-outline-success';
    btnRecep.title = 'Registrar recepción';
    btnRecep.innerHTML = '<i class="fa-solid fa-truck-ramp-box fa-fw" aria-hidden="true"></i>';
    btnRecep.setAttribute('data-bs-toggle', 'offcanvas');
    btnRecep.setAttribute('data-bs-target', '#offcanvas-nueva-recepcion');
    btnRecep.addEventListener('click', (e) => { e.stopPropagation(); prepararRecepcion(o.id_orden); });
    divAcc.appendChild(btnRecep);
  }

  tdAcciones.appendChild(divAcc);

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

// Líneas de producto para nueva orden
function agregarLineaProducto(producto = null) {
  const container = document.getElementById('tbody-lineas-orden');
  if (!container) return;

  const idx = container.querySelectorAll('.linea-orden').length;
  const div = document.createElement('div');
  div.className = 'row g-2 mb-2 align-items-end linea-orden';

  const col1 = document.createElement('div');
  col1.className = 'col-5';
  const labelP = document.createElement('label');
  labelP.className = 'form-label form-label-sm mb-1';
  labelP.textContent = 'Producto';
  const inputP = document.createElement('input');
  inputP.type = 'text';
  inputP.className = 'form-control form-control-sm linea-producto-nombre';
  inputP.placeholder = 'Nombre del producto...';
  inputP.list = 'productos-datalist';
  inputP.value = producto?.nombre || '';
  inputP.dataset.idProducto = producto?.id_producto || '';
  inputP.setAttribute('aria-label', `Producto línea ${idx + 1}`);
  inputP.addEventListener('change', () => {
    const cache = window._productosCache || [];
    const found = cache.find(p => p.nombre === inputP.value);
    if (found) {
      inputP.dataset.idProducto = found.id_producto;
      const linea = inputP.closest('.linea-orden');
      const precioInput = linea?.querySelector('.linea-precio');
      if (precioInput && found.precio_compra) precioInput.value = found.precio_compra;
    }
  });
  col1.appendChild(labelP);
  col1.appendChild(inputP);

  const col2 = document.createElement('div');
  col2.className = 'col-3';
  const labelC = document.createElement('label');
  labelC.className = 'form-label form-label-sm mb-1';
  labelC.textContent = 'Cantidad';
  const inputC = document.createElement('input');
  inputC.type = 'number';
  inputC.className = 'form-control form-control-sm linea-cantidad';
  inputC.placeholder = '0';
  inputC.min = '0.01';
  inputC.step = '0.01';
  inputC.value = '';
  inputC.setAttribute('aria-label', `Cantidad línea ${idx + 1}`);
  col2.appendChild(labelC);
  col2.appendChild(inputC);

  const col3 = document.createElement('div');
  col3.className = 'col-3';
  const labelPr = document.createElement('label');
  labelPr.className = 'form-label form-label-sm mb-1';
  labelPr.textContent = 'P. Unitario';
  const inputPr = document.createElement('input');
  inputPr.type = 'number';
  inputPr.className = 'form-control form-control-sm linea-precio';
  inputPr.placeholder = '0.00';
  inputPr.min = '0.01';
  inputPr.step = '0.01';
  inputPr.setAttribute('aria-label', `Precio unitario línea ${idx + 1}`);
  col3.appendChild(labelPr);
  col3.appendChild(inputPr);

  const col4 = document.createElement('div');
  col4.className = 'col-1';
  const btnElim = document.createElement('button');
  btnElim.type = 'button';
  btnElim.className = 'btn btn-sm btn-outline-danger';
  btnElim.setAttribute('aria-label', 'Quitar línea');
  btnElim.innerHTML = '<i class="fa-solid fa-minus" aria-hidden="true"></i>';
  btnElim.addEventListener('click', () => {
    if (container.querySelectorAll('.linea-orden').length > 1) {
      div.remove();
    } else {
      showToast('Debe haber al menos una línea de producto.', 'warning');
    }
  });
  col4.appendChild(btnElim);

  div.appendChild(col1);
  div.appendChild(col2);
  div.appendChild(col3);
  div.appendChild(col4);
  container.appendChild(div);
}

// Cargar productos en datalist
async function cargarProductosDatalist(id_proveedor = '') {
  let datalist = document.getElementById('productos-datalist');
  if (!datalist) {
    datalist = document.createElement('datalist');
    datalist.id = 'productos-datalist';
    document.body.appendChild(datalist);
  }
  try {
    const url = id_proveedor
      ? `/api/proveedores/${id_proveedor}/productos`
      : '/api/productos';
    const data = await apiFetch(url);
    const productos = Array.isArray(data) ? data : (data.productos || data.productos_proveedor || []);
    window._productosCache = productos;
    datalist.replaceChildren();
    const frag = document.createDocumentFragment();
    productos.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.nombre;
      opt.dataset.id = p.id_producto;
      frag.appendChild(opt);
    });
    datalist.appendChild(frag);
  } catch { /* no crítico */ }
}

// Formulario: nueva orden de compra
function initFormNuevaOrden() {
  const form = document.getElementById('form-nueva-orden');
  if (!form) return;

  const btnAgrLinea = document.getElementById('btn-agregar-linea-orden');
  if (btnAgrLinea) btnAgrLinea.addEventListener('click', () => agregarLineaProducto());

  const selProv = document.getElementById('no-proveedor');
  if (selProv) {
    selProv.addEventListener('change', () => cargarProductosDatalist(selProv.value));
  }

  // Añadir primera línea
  if (document.getElementById('tbody-lineas-orden') && document.querySelectorAll('.linea-orden').length === 0) {
    agregarLineaProducto();
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
    document.querySelectorAll('.linea-orden').forEach(row => {
      const inputNom = row.querySelector('.linea-producto-nombre');
      const inputCant = row.querySelector('.linea-cantidad');
      const inputPr = row.querySelector('.linea-precio');
      const id_producto = parseInt(inputNom?.dataset.idProducto);
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
}

// Preparar formulario de recepción
async function prepararRecepcion(id_orden) {
  const inputOrden = document.getElementById('nr-orden');
  const tbody = document.querySelector('#tabla-recepcion-productos tbody');
  if (inputOrden) inputOrden.value = id_orden;

  if (!tbody) return;
  try {
    const data = await apiFetch(`/api/compras/${id_orden}`);
    const lineas = (data.detalle || []).filter(d => d.cantidad_solicitada > d.cantidad_recibida);

    tbody.replaceChildren();
    const frag = document.createDocumentFragment();
    if (lineas.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
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

      const tdNom = document.createElement('td');
      tdNom.textContent = l.producto_nombre;
      tdNom.dataset.idProducto = l.id_producto;

      const tdPend = document.createElement('td');
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

      const tdLote = document.createElement('td');
      const inputLote = document.createElement('input');
      inputLote.type = 'text';
      inputLote.className = 'form-control form-control-sm rec-lote';
      inputLote.placeholder = 'Opcional';
      inputLote.dataset.idProducto = l.id_producto;
      tdLote.appendChild(inputLote);

      const tdVenc = document.createElement('td');
      const inputVenc = document.createElement('input');
      inputVenc.type = 'date';
      inputVenc.className = 'form-control form-control-sm rec-vencimiento';
      inputVenc.dataset.idProducto = l.id_producto;
      tdVenc.appendChild(inputVenc);

      tr.append(tdNom, tdPend, tdCant, tdLote, tdVenc);
      frag.appendChild(tr);
    });
    tbody.appendChild(frag);
  } catch (err) {
    showToast('Error al cargar orden: ' + err.message, 'error');
  }
}

// Formulario: registrar recepción
function initFormRecepcion() {
  const form = document.getElementById('form-nueva-recepcion');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id_orden = document.getElementById('nr-orden')?.value;
    const guia = document.getElementById('nr-guia')?.value.trim() || null;
    const id_almacen = parseInt(document.getElementById('nr-almacen')?.value) || 1;

    const productos = [];
    document.querySelectorAll('#tabla-recepcion-productos tbody tr').forEach(row => {
      const inputCant = row.querySelector('.rec-cantidad');
      const inputLote = row.querySelector('.rec-lote');
      const inputVenc = row.querySelector('.rec-vencimiento');
      const tdNom = row.querySelector('td[data-id-producto]');
      const id_producto = parseInt(tdNom?.dataset.idProducto || inputCant?.dataset.idProducto);
      const cantidad = parseFloat(inputCant?.value);
      if (id_producto && !isNaN(cantidad) && cantidad > 0) {
        productos.push({
          id_producto,
          cantidad,
          numero_lote: inputLote?.value.trim() || null,
          fecha_vencimiento: inputVenc?.value || null,
        });
      }
    });

    if (productos.length === 0) {
      showToast('Ingresa cantidades para al menos un producto.', 'warning');
      return;
    }

    try {
      await apiFetch(`/api/compras/${id_orden}/recepciones`, {
        method: 'POST',
        body: JSON.stringify({ productos, id_almacen, guia_remision: guia }),
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
  const btnFiltrar = document.getElementById('btn-filtrar-ordenes');  
  const btnLimpiar = document.getElementById('btn-limpiar-filtros-ordenes'); 

  const getFiltros = () => ({
    estado: document.getElementById('filtro-estado-orden')?.value,
    fecha_desde: document.getElementById('filtro-fecha-desde-orden')?.value,
    fecha_hasta: document.getElementById('filtro-fecha-hasta-orden')?.value,
  });

  if (btnFiltrar) btnFiltrar.addEventListener('click', () => cargarOrdenes(getFiltros()));
  if (btnLimpiar) {
    btnLimpiar.addEventListener('click', () => {
      ['filtro-estado-orden', 'filtro-fecha-desde-orden', 'filtro-fecha-hasta-orden'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });
      cargarOrdenes();
    });
  }

  // Filtros de recepciones
  const btnFiltrarRec = document.getElementById('btn-filtrar-recepciones');
  if (btnFiltrarRec) {
    btnFiltrarRec.addEventListener('click', () => cargarRecepciones({
      fecha_desde: document.getElementById('filtro-fecha-desde-rec')?.value,
      fecha_hasta: document.getElementById('filtro-fecha-hasta-rec')?.value,
      busqueda: document.getElementById('input-buscar-recepcion')?.value.trim(),
    }));
  }

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
  numSpan.className = 'badge text-bg-light border font-monospace';
  numSpan.textContent = `REC-${String(r.id_recepcion).padStart(4,'0')}`;
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
  tdGuia.textContent = r.guia_remision || '—';

  const tdFecha = document.createElement('td');
  tdFecha.className = 'text-muted small';
  tdFecha.textContent = formatDate(r.fecha, false);

  const tdAcc = document.createElement('td');
  tdAcc.className = 'text-end pe-3';

  tr.append(tdIco, tdNum, tdOrden, tdProv, tdAlm, tdGuia, tdFecha, tdAcc);

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
  tdDetail.colSpan = 8;
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
      [p.producto_nombre, p.cantidad, formatMoney(p.precio_unitario), p.numero_lote || '—', p.fecha_vencimiento ? formatDate(p.fecha_vencimiento) : '—'].forEach(v => {
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
  tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted"><i class="fa-solid fa-spinner fa-spin me-2"></i>Cargando...</td></tr>';
  try {
    const baseParams = new URLSearchParams();
    if (filtros.fecha_desde) baseParams.set('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta) baseParams.set('fecha_hasta', filtros.fecha_hasta);
    if (filtros.busqueda) baseParams.set('proveedor', filtros.busqueda);

    const [dataRec, dataEnv] = await Promise.all([
      apiFetch(`/api/compras?${new URLSearchParams({...Object.fromEntries(baseParams), estado: 'recibida'})}`),
      apiFetch(`/api/compras?${new URLSearchParams({...Object.fromEntries(baseParams), estado: 'enviada'})}`),
    ]);

    const ordenes = [
      ...(Array.isArray(dataRec.ordenes) ? dataRec.ordenes : []),
      ...(Array.isArray(dataEnv.ordenes) ? dataEnv.ordenes : []),
    ];

    // Para cada orden, cargar sus recepciones
    const todasRecepciones = [];
    await Promise.all(ordenes.map(async o => {
      try {
        const r = await apiFetch(`/api/compras/${o.id_orden}/recepciones`);
        (r.recepciones || []).forEach(rec => {
          todasRecepciones.push({ ...rec, numero_orden: o.numero_orden, proveedor_nombre: o.proveedor_nombre });
        });
      } catch { /* orden sin recepciones */ }
    }));

    todasRecepciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    tbody.replaceChildren();
    if (todasRecepciones.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No hay recepciones registradas.</td></tr>';
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
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-danger">Error: ${err.message}</td></tr>`;
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
  await Promise.all([
    cargarProveedoresSelect(),
    cargarProductosDatalist(),
  ]);
  initFiltros();
  initFormNuevaOrden();
  initFormRecepcion();
  cargarOrdenes();
  cargarRecepciones();
  cargarAlmacenesSelect();
});
