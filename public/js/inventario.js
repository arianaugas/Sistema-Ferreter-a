
//  CONSTANTES 
const API = '/api/inventario';

// Cache de datos cargados (evita re-fetches innecesarios)
let _stockCache    = [];   // array completo de stock
let _almacenesCache = [];  // array de almacenes activos

// Paginación
const PAGE_SIZE = 20;
let stockPage = 1;
let kardexPage= 1;
let transfPage= 1;
let lotesPage = 1;

// Producto seleccionado en kardex y ajuste
let kardexProductoId = null;
let ajusteProductoData = null;

// INIT 
document.addEventListener('DOMContentLoaded', () => {
    cargarAlmacenes();
    cargarCategorias();
    cargarStock();
    initTabListeners();
    initStockFiltros();
    initAjusteOffcanvas();
    initTransferenciaOffcanvas();
    initAlmacenesCrud();
    initKardexBusqueda();
    initTransferenciasFiltros();
    initLotesFiltros();
    initExpandableRowsLive();
});


// HELPERS DE FETCH 

async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.mensaje || 'Error del servidor');
    return data;
}


// ALMACENES — carga inicial 

async function cargarAlmacenes() {
    try {
        const data = await apiFetch(`${API}/almacenes`);
        _almacenesCache = data.almacenes;
        poblarSelectsAlmacen(data.almacenes);
        renderTablaAlmacenes(data.almacenes);
    } catch (err) {
        showToast('No se pudieron cargar los almacenes.', 'error');
    }
}

function poblarSelectsAlmacen(almacenes) {
    // Todos los <select> que filtran por almacén
    const selects = [
        'filtro-stock-almacen',
        'kardex-almacen',
        'filtro-lote-almacen',
        'ajuste-almacen',
        'transf-origen',
        'transf-destino',
        'nuevo-alm-responsable',  // este es de empleados, se ignora si no existe
    ];
    const almacenSelects = ['filtro-stock-almacen', 'kardex-almacen', 'filtro-lote-almacen'];
    almacenSelects.forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        // Mantener primer option "Todos"
        while (sel.options.length > 1) sel.remove(1);
        almacenes.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.id_almacen;
            opt.textContent = a.nombre;
            sel.appendChild(opt);
        });
    });

    // Selects de transferencia (sin opción "Todos")
    ['transf-origen', 'transf-destino', 'ajuste-almacen'].forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        while (sel.options.length > 1) sel.remove(1);
        almacenes.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.id_almacen;
            opt.textContent = a.nombre;
            sel.appendChild(opt);
        });
    });
}


//  CATEGORÍAS — carga para filtro stock 

async function cargarCategorias() {
    try {
        const data = await apiFetch('/api/categorias/cat');
        const sel = document.getElementById('filtro-stock-categoria');
        if (!sel) return;
        while (sel.options.length > 1) sel.remove(1);
        data.categorias.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id_categoria;
            opt.textContent = c.nombre;
            sel.appendChild(opt);
        });
    } catch {
        // Silencioso: si falla, el filtro de categoría queda vacío
    }
}


// STOCK 

async function cargarStock(params = {}) {
    try {
        const qs = new URLSearchParams();
        if (params.buscar)      qs.set('buscar',      params.buscar);
        if (params.id_almacen)  qs.set('id_almacen',  params.id_almacen);
        if (params.estado)      qs.set('estado',       params.estado);
        if (params.id_categoria) qs.set('id_categoria', params.id_categoria);

        const data = await apiFetch(`${API}/stock?${qs}`);
        _stockCache = data.stock;
        stockPage = 1;
        renderStock(_stockCache);
        actualizarAlertas(_stockCache);
        poblarDatalistProductos(_stockCache);
    } catch (err) {
        showToast('No se pudo cargar el stock.', 'error');
    }
}

function renderStock(stock) {
    const tbody     = document.getElementById('tabla-stock-body');
    const emptyRow  = document.getElementById('stock-empty-row');
    const badge     = document.getElementById('stock-total-badge');
    const infoEl    = document.getElementById('stock-paginacion-info');

    // Limpiar filas anteriores (excepto la empty-row estática y las de ejemplo)
    tbody.querySelectorAll('tr.stock-dyn').forEach(r => r.remove());

    const inicio = (stockPage - 1) * PAGE_SIZE;
    const pagina = stock.slice(inicio, inicio + PAGE_SIZE);

    if (stock.length === 0) {
        emptyRow.classList.remove('d-none');
        badge.textContent = '0 productos';
        infoEl.textContent = 'Sin resultados';
        renderPaginacion('stock', stock.length);
        return;
    }

    emptyRow.classList.add('d-none');
    badge.textContent = `${stock.length} producto${stock.length !== 1 ? 's' : ''}`;
    infoEl.textContent = `Mostrando ${inicio + 1}–${Math.min(inicio + PAGE_SIZE, stock.length)} de ${stock.length}`;

    pagina.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = 'stock-dyn' + (item.estado_stock === 'critico' ? ' table-danger' : item.estado_stock === 'sobrestock' ? ' table-warning' : '');
        tr.dataset.productoId = item.id_producto;

        // Celda código
        const tdCodigo = document.createElement('td');
        tdCodigo.innerHTML = `<span class="fw-semibold font-monospace">${item.codigo}</span>`;

        // Celda nombre
        const tdNombre = document.createElement('td');
        tdNombre.innerHTML = `<span class="fw-semibold d-block">${item.nombre}</span><span class="small text-muted">${item.subcategoria ?? ''}</span>`;

        // Celda categoría
        const tdCat = document.createElement('td');
        tdCat.textContent = item.categoria;

        // Celda unidad
        const tdUnidad = document.createElement('td');
        tdUnidad.textContent = item.unidad;

        // Celda stock actual
        const tdActual = document.createElement('td');
        tdActual.className = 'text-end fw-bold' + (item.estado_stock === 'critico' ? ' text-danger' : '');
        tdActual.textContent = Number(item.stock_actual).toFixed(2);

        // Celda mín
        const tdMin = document.createElement('td');
        tdMin.className = 'text-end text-muted';
        tdMin.textContent = Number(item.stock_minimo).toFixed(2);

        // Celda máx
        const tdMax = document.createElement('td');
        tdMax.className = 'text-end text-muted';
        tdMax.textContent = item.stock_maximo != null ? Number(item.stock_maximo).toFixed(2) : '—';

        // Celda ubicación
        const tdUbic = document.createElement('td');
        tdUbic.innerHTML = `<span class="small">${item.ubicacion ?? '—'}</span>`;

        // Celda estado
        const tdEstado = document.createElement('td');
        const badgeEstado = _badgeEstadoStock(item.estado_stock);
        tdEstado.appendChild(badgeEstado);

        // Celda acciones
        const tdAcciones = document.createElement('td');
        tdAcciones.className = 'text-end';
        const btnKardex = document.createElement('button');
        btnKardex.type = 'button';
        btnKardex.className = 'btn btn-sm me-1';
        btnKardex.dataset.productoId = item.id_producto;
        btnKardex.dataset.productoNombre = item.nombre;
        btnKardex.setAttribute('aria-label', `Ver kardex de ${item.nombre}`);
        btnKardex.innerHTML = '<i class="fa-solid fa-timeline" aria-hidden="true"></i>';
        btnKardex.addEventListener('click', () => abrirKardexDesdeStock(item));

        const btnAjuste = document.createElement('button');
        btnAjuste.type = 'button';
        btnAjuste.className = 'btn btn-sm btn-warning';
        btnAjuste.dataset.productoId = item.id_producto;
        btnAjuste.setAttribute('aria-label', `Ajustar stock de ${item.nombre}`);
        btnAjuste.innerHTML = '<i class="fa-solid fa-sliders" aria-hidden="true"></i>';
        btnAjuste.setAttribute('data-bs-toggle', 'offcanvas');
        btnAjuste.setAttribute('data-bs-target', '#offcanvas-ajuste');
        btnAjuste.addEventListener('click', () => precargarAjuste(item));

        const wrap = document.createElement('div');
        wrap.className = 'd-flex gap-1 justify-content-end';
        wrap.appendChild(btnKardex);
        wrap.appendChild(btnAjuste);
        tdAcciones.appendChild(wrap);

        tr.appendChild(tdCodigo);
        tr.appendChild(tdNombre);
        tr.appendChild(tdCat);
        tr.appendChild(tdUnidad);
        tr.appendChild(tdActual);
        tr.appendChild(tdMin);
        tr.appendChild(tdMax);
        tr.appendChild(tdUbic);
        tr.appendChild(tdEstado);
        tr.appendChild(tdAcciones);
        tbody.appendChild(tr);
    });

    renderPaginacion('stock', stock.length);
}

function _badgeEstadoStock(estado) {
    const span = document.createElement('span');
    span.className = 'd-flex align-items-center gap-1';
    span.style.width = 'fit-content';
    const i = document.createElement('i');
    i.setAttribute('aria-hidden', 'true');
    if (estado === 'critico') {
        span.classList.add('badge', 'text-bg-danger');
        i.className = 'fa-solid fa-triangle-exclamation fa-xs';
        span.appendChild(i);
        span.appendChild(document.createTextNode('Crítico'));
    } else if (estado === 'sobrestock') {
        span.classList.add('badge', 'text-bg-warning', 'text-dark');
        i.className = 'fa-solid fa-arrow-up fa-xs';
        span.appendChild(i);
        span.appendChild(document.createTextNode('Sobrestock'));
    } else {
        span.classList.add('badge', 'text-bg-success');
        i.className = 'fa-solid fa-circle-check fa-xs';
        span.appendChild(i);
        span.appendChild(document.createTextNode('Normal'));
    }
    return span;
}

function actualizarAlertas(stock) {
    const critico    = stock.filter(s => s.estado_stock === 'critico').length;
    const normal     = stock.filter(s => s.estado_stock === 'normal').length;
    const sobrestock = stock.filter(s => s.estado_stock === 'sobrestock').length;

    document.getElementById('alerta-critico-count').textContent    = critico;
    document.getElementById('alerta-normal-count').textContent     = normal;
    document.getElementById('alerta-sobrestock-count').textContent = sobrestock;
    document.getElementById('alerta-total-count').textContent      = stock.length;
}

function poblarDatalistProductos(stock) {
    // Datalist para offcanvas ajuste
    let dl = document.getElementById('ajuste-productos-lista');
    if (dl) {
        dl.innerHTML = '';
        stock.forEach(p => {
            const opt = document.createElement('option');
            opt.value = `${p.codigo} — ${p.nombre}`;
            opt.dataset.id = p.id_producto;
            dl.appendChild(opt);
        });
    }
    // Datalist para transferencia
    let dlT = document.getElementById('transf-productos-lista');
    if (dlT) {
        dlT.innerHTML = '';
        stock.forEach(p => {
            const opt = document.createElement('option');
            opt.value = `${p.codigo} — ${p.nombre}`;
            opt.dataset.id = p.id_producto;
            dlT.appendChild(opt);
        });
    }
    // Datalist para kardex (usa id distinto según la corrección de HTML)
    let dlK = document.getElementById('kardex-productos-lista');
    if (dlK) {
        dlK.innerHTML = '';
        stock.forEach(p => {
            const opt = document.createElement('option');
            opt.value = `${p.codigo} — ${p.nombre}`;
            opt.dataset.id = p.id_producto;
            dlK.appendChild(opt);
        });
    }
}


//  STOCK FILTROS 

function initStockFiltros() {
    document.getElementById('btn-filtrar-stock')?.addEventListener('click', aplicarFiltrosStock);
    document.getElementById('btn-limpiar-stock')?.addEventListener('click', () => {
        document.getElementById('filtro-stock-buscar').value    = '';
        document.getElementById('filtro-stock-categoria').value = '';
        document.getElementById('filtro-stock-almacen').value   = '';
        document.getElementById('filtro-stock-estado').value    = '';
        cargarStock();
    });
    // Filtrar al presionar Enter en búsqueda
    document.getElementById('filtro-stock-buscar')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') aplicarFiltrosStock();
    });
}

function aplicarFiltrosStock() {
    const params = {
        buscar:      document.getElementById('filtro-stock-buscar')?.value.trim()  || '',
        id_categoria: document.getElementById('filtro-stock-categoria')?.value     || '',
        id_almacen:  document.getElementById('filtro-stock-almacen')?.value        || '',
        estado:      document.getElementById('filtro-stock-estado')?.value         || '',
    };
    // Limpiar vacíos
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
    cargarStock(params);
}


//  PAGINACIÓN 

function renderPaginacion(seccion, total) {
    const pageMap = { stock: stockPage, kardex: kardexPage, transf: transfPage, lotes: lotesPage };
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const current = pageMap[seccion] ?? 1;

    // IDs de paginación en el HTML siguen el patrón: stock-paginacion-info, etc.
    // Los nav de paginación están dentro de card-footer de cada tabla
    // Buscamos el nav dentro de la sección activa
    const sectionMap = {
        stock:  'stock-tabla-card',
        kardex: 'kardex-tabla-card',
        transf: 'transferencias-tabla-card',
        lotes:  'lotes-tabla-card',
    };
    const card = document.getElementById(sectionMap[seccion]);
    if (!card) return;
    const nav = card.querySelector('nav[aria-label]');
    if (!nav) return;
    const ul = nav.querySelector('ul.pagination');
    if (!ul) return;

    ul.innerHTML = '';

    // Anterior
    const liPrev = document.createElement('li');
    liPrev.className = 'page-item' + (current <= 1 ? ' disabled' : '');
    const aPrev = document.createElement('a');
    aPrev.className = 'page-link';
    aPrev.href = '#';
    aPrev.setAttribute('aria-label', 'Anterior');
    aPrev.innerHTML = '<i class="fa-solid fa-chevron-left fa-xs" aria-hidden="true"></i>';
    if (current > 1) {
        aPrev.addEventListener('click', e => { e.preventDefault(); cambiarPagina(seccion, current - 1, total); });
    }
    liPrev.appendChild(aPrev);
    ul.appendChild(liPrev);

    // Números (máx 5 páginas visibles)
    const start = Math.max(1, current - 2);
    const end   = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) {
        const li = document.createElement('li');
        li.className = 'page-item' + (i === current ? ' active' : '');
        if (i === current) li.setAttribute('aria-current', 'page');
        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = '#';
        a.textContent = i;
        const page = i;
        a.addEventListener('click', e => { e.preventDefault(); cambiarPagina(seccion, page, total); });
        li.appendChild(a);
        ul.appendChild(li);
    }

    // Siguiente
    const liNext = document.createElement('li');
    liNext.className = 'page-item' + (current >= totalPages ? ' disabled' : '');
    const aNext = document.createElement('a');
    aNext.className = 'page-link';
    aNext.href = '#';
    aNext.setAttribute('aria-label', 'Siguiente');
    aNext.innerHTML = '<i class="fa-solid fa-chevron-right fa-xs" aria-hidden="true"></i>';
    if (current < totalPages) {
        aNext.addEventListener('click', e => { e.preventDefault(); cambiarPagina(seccion, current + 1, total); });
    }
    liNext.appendChild(aNext);
    ul.appendChild(liNext);
}

function cambiarPagina(seccion, page, total) {
    if (seccion === 'stock')  { stockPage  = page; renderStock(_stockCache); }
    if (seccion === 'kardex') { kardexPage = page; /* renderKardex usa su propio cache */ }
    if (seccion === 'transf') { transfPage = page; }
    if (seccion === 'lotes')  { lotesPage  = page; }
}


//  TAB LISTENERS 

function initTabListeners() {
    // Cuando se activa el tab de transferencias, cargar la lista
    document.getElementById('tab-transferencias')?.addEventListener('shown.bs.tab', () => {
        cargarTransferencias();
    });
    // Tab de almacenes ya se carga en init, pero refresca si vuelves
    document.getElementById('tab-almacenes')?.addEventListener('shown.bs.tab', () => {
        cargarAlmacenes();
    });
}


//  KARDEX 

function initKardexBusqueda() {
    // Asegurar que el datalist de productos esté poblado incluso sin pasar por stock
    const dlK = document.getElementById('kardex-productos-lista');
    if (dlK && dlK.options.length === 0) {
        apiFetch(`${API}/stock`).then(data => {
            const items = Array.isArray(data) ? data : (data.stock || []);
            cache.stock = items;
            items.forEach(item => {
                const opt = document.createElement('option');
                opt.value = `${item.codigo} — ${item.nombre}`;
                opt.dataset.id = item.id_producto;
                dlK.appendChild(opt);
            });
        }).catch(() => {});
    }

    document.getElementById('btn-buscar-kardex')?.addEventListener('click', buscarKardex);
    document.getElementById('btn-limpiar-kardex')?.addEventListener('click', () => {
        const input = document.getElementById('kardex-producto-input');
        if (input) input.value = '';
        kardexProductoId = null;
        document.getElementById('kardex-almacen').value    = '';
        document.getElementById('kardex-tipo').value       = '';
        document.getElementById('kardex-fecha-desde').value = '';
        document.getElementById('kardex-fecha-hasta').value = '';
        limpiarTablaKardex();
    });

    const inputKardex = document.getElementById('kardex-producto-input');
    if (inputKardex) {
        inputKardex.addEventListener('change', () => {
            const val = inputKardex.value.trim();
            const producto = cache.stock?.find(p => `${p.codigo} — ${p.nombre}` === val);
            kardexProductoId = producto ? producto.id_producto : null;
        });
    }
}

function resolverProductoPorTexto(texto) {
    if (!texto || !_stockCache.length) return null;
    const t = texto.toLowerCase();
    // Busca coincidencia exacta con "codigo — nombre" del datalist, o por código, o por nombre
    return _stockCache.find(p =>
        `${p.codigo} — ${p.nombre}`.toLowerCase() === t ||
        p.codigo.toLowerCase() === t ||
        p.nombre.toLowerCase() === t
    ) || _stockCache.find(p =>
        p.nombre.toLowerCase().includes(t) || p.codigo.toLowerCase().includes(t)
    ) || null;
}

async function buscarKardex() {
    if (!kardexProductoId) {
        // Intentar resolver de nuevo por el texto actual
        const input = document.getElementById('kardex-producto-input');
        const producto = resolverProductoPorTexto(input?.value.trim() ?? '');
        if (!producto) {
            showToast('Seleccione un producto válido para consultar el kardex.', 'warning');
            return;
        }
        kardexProductoId = producto.id_producto;
    }

    const qs = new URLSearchParams();
    const almacen    = document.getElementById('kardex-almacen')?.value;
    const tipo       = document.getElementById('kardex-tipo')?.value;
    const fechaDesde = document.getElementById('kardex-fecha-desde')?.value;
    const fechaHasta = document.getElementById('kardex-fecha-hasta')?.value;

    if (almacen)    qs.set('id_almacen',  almacen);
    if (tipo)       qs.set('tipo',        tipo);
    if (fechaDesde) qs.set('fecha_desde', fechaDesde);
    if (fechaHasta) qs.set('fecha_hasta', fechaHasta);

    try {
        const data = await apiFetch(`${API}/kardex/${kardexProductoId}?${qs}`);
        renderTablaKardex(data.kardex);
    } catch (err) {
        showToast(err.message || 'Error al consultar el kardex.', 'error');
    }
}

function limpiarTablaKardex() {
    const tbody    = document.getElementById('tabla-kardex-body');
    const emptyRow = document.getElementById('kardex-empty-row');
    tbody.querySelectorAll('tr.kardex-dyn').forEach(r => r.remove());
    emptyRow.classList.remove('d-none');
    document.getElementById('kardex-total-badge').textContent = '0 movimientos';
    document.getElementById('kardex-paginacion-info').textContent = '';
}

function renderTablaKardex(movimientos) {
    const tbody    = document.getElementById('tabla-kardex-body');
    const emptyRow = document.getElementById('kardex-empty-row');
    const badge    = document.getElementById('kardex-total-badge');
    const info     = document.getElementById('kardex-paginacion-info');

    tbody.querySelectorAll('tr.kardex-dyn').forEach(r => r.remove());

    badge.textContent = `${movimientos.length} movimiento${movimientos.length !== 1 ? 's' : ''}`;

    if (movimientos.length === 0) {
        emptyRow.classList.remove('d-none');
        info.textContent = 'Sin resultados';
        return;
    }

    emptyRow.classList.add('d-none');
    info.textContent = `${movimientos.length} movimiento${movimientos.length !== 1 ? 's' : ''}`;

    movimientos.forEach((mov, idx) => {
        const rowId    = `kardex-dyn-row-${idx}`;
        const detailId = `kardex-dyn-detail-${idx}`;

        // Fila principal
        const tr = document.createElement('tr');
        tr.id = rowId;
        tr.className = 'kardex-dyn cursor-pointer';
        tr.setAttribute('data-expand-trigger', detailId);
        tr.setAttribute('role', 'button');
        tr.setAttribute('tabindex', '0');
        tr.setAttribute('aria-expanded', 'false');

        const cantidad = parseFloat(mov.cantidad);
        const signo    = cantidad >= 0 ? '+' : '';
        const colorCantidad = cantidad > 0 ? 'text-success' : cantidad < 0 ? 'text-danger' : 'text-muted';

        tr.innerHTML = `
            <td class="ps-3"><i class="fa-solid fa-chevron-down fa-xs text-muted" data-expand-icon aria-hidden="true"></i></td>
            <td>${_badgeKardexTipo(mov.tipo_movimiento)}</td>
            <td><time datetime="${mov.registrado_en}">${formatDate(mov.registrado_en, true)}</time></td>
            <td>${mov.almacen}</td>
            <td>${mov.motivo ?? '—'}${mov.referencia_tipo ? ` · <span class="text-muted small">${mov.referencia_tipo}${mov.referencia_id ? ' #' + mov.referencia_id : ''}</span>` : ''}</td>
            <td class="text-end fw-semibold ${colorCantidad}">${signo}${Number(mov.cantidad).toFixed(2)}</td>
            <td class="text-end text-muted">${Number(mov.stock_anterior).toFixed(2)}</td>
            <td class="text-end fw-semibold">${Number(mov.stock_posterior).toFixed(2)}</td>
            <td><span class="small">${mov.empleado}</span></td>
        `;

        // Fila detalle expandible
        const trDetail = document.createElement('tr');
        trDetail.id = detailId;
        trDetail.className = 'kardex-dyn detail-row collapse';
        trDetail.setAttribute('aria-hidden', 'true');
        trDetail.innerHTML = `
            <td colspan="9" class="px-4 py-3">
                <div class="row g-3">
                    <div class="col-12 col-md-6">
                        <dl class="row g-1 mb-0">
                            <dt class="col-5 text-muted small fw-normal">Tipo de movimiento</dt>
                            <dd class="col-7 mb-0 small">${mov.tipo_movimiento}</dd>
                            <dt class="col-5 text-muted small fw-normal">Motivo</dt>
                            <dd class="col-7 mb-0 small">${mov.motivo ?? '—'}</dd>
                            <dt class="col-5 text-muted small fw-normal">Referencia tipo</dt>
                            <dd class="col-7 mb-0 small">${mov.referencia_tipo ?? '—'}</dd>
                            <dt class="col-5 text-muted small fw-normal">Referencia ID</dt>
                            <dd class="col-7 mb-0 small font-monospace">${mov.referencia_id ?? '—'}</dd>
                        </dl>
                    </div>
                    <div class="col-12 col-md-6">
                        <dl class="row g-1 mb-0">
                            <dt class="col-5 text-muted small fw-normal">Empleado</dt>
                            <dd class="col-7 mb-0 small">${mov.empleado}</dd>
                            <dt class="col-5 text-muted small fw-normal">Registrado en</dt>
                            <dd class="col-7 mb-0 small"><time datetime="${mov.registrado_en}">${formatDate(mov.registrado_en, true)}</time></dd>
                        </dl>
                    </div>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
        tbody.appendChild(trDetail);
    });

    // Activar expansión en las filas recién creadas
    initExpandableRowsLive();
}

function _badgeKardexTipo(tipo) {
    const map = {
        entrada:      { cls: 'text-bg-success',              icon: 'fa-arrow-down',  label: 'Entrada'      },
        salida:       { cls: 'text-bg-danger',               icon: 'fa-arrow-up',    label: 'Salida'       },
        ajuste:       { cls: 'text-bg-warning text-dark',    icon: 'fa-sliders',     label: 'Ajuste'       },
        transferencia:{ cls: 'text-bg-info text-dark',       icon: 'fa-right-left',  label: 'Transferencia'},
    };
    const entry = map[tipo?.toLowerCase()] ?? { cls: 'text-bg-secondary', icon: 'fa-circle', label: tipo ?? '—' };
    return `<span class="badge ${entry.cls}"><i class="fa-solid ${entry.icon} fa-xs me-1" aria-hidden="true"></i>${entry.label}</span>`;
}

function abrirKardexDesdeStock(item) {
    // Cambiar al tab kardex
    const tabKardex = document.getElementById('tab-kardex');
    if (tabKardex) bootstrap.Tab.getOrCreateInstance(tabKardex).show();

    // Poner el nombre en el input de kardex y disparar búsqueda
    const input = document.getElementById('kardex-producto-input');
    if (input) {
        input.value = `${item.codigo} — ${item.nombre}`;
    }
    kardexProductoId = item.id_producto;
    buscarKardex();
}


//  AJUSTE DE INVENTARIO 

function initAjusteOffcanvas() {
    const inputProducto  = document.getElementById('ajuste-producto');
    const inputStockNuevo = document.getElementById('ajuste-stock-nuevo');
    const form = document.getElementById('form-ajuste');

    // Resolver producto al escribir
    inputProducto?.addEventListener('change', () => {
        const prod = resolverProductoPorTexto(inputProducto.value.trim());
        if (prod) {
            precargarAjuste(prod);
        } else {
            limpiarInfoAjuste();
        }
    });

    // Calcular diferencia al cambiar el stock nuevo
    inputStockNuevo?.addEventListener('input', calcularDiferenciaAjuste);

    // Submit
    form?.addEventListener('submit', e => {
        e.preventDefault();
        guardarAjuste();
    });

    // Limpiar al cerrar
    document.getElementById('offcanvas-ajuste')?.addEventListener('hidden.bs.offcanvas', limpiarFormAjuste);
}

function precargarAjuste(item) {
    ajusteProductoData = item;
    const inputProducto = document.getElementById('ajuste-producto');
    if (inputProducto) inputProducto.value = `${item.codigo} — ${item.nombre}`;
    document.getElementById('ajuste-producto-id').value = item.id_producto;
    document.getElementById('ajuste-stock-actual').textContent = Number(item.stock_actual).toFixed(2);
    document.getElementById('ajuste-unidad').textContent       = item.unidad ?? '—';
    document.getElementById('ajuste-stock-min').textContent    = Number(item.stock_minimo).toFixed(2);
    document.getElementById('ajuste-stock-max').textContent    = item.stock_maximo != null ? Number(item.stock_maximo).toFixed(2) : '—';
    document.getElementById('ajuste-stock-nuevo').value = '';
    document.getElementById('ajuste-diferencia').value  = '';
}

function limpiarInfoAjuste() {
    ajusteProductoData = null;
    document.getElementById('ajuste-producto-id').value        = '';
    document.getElementById('ajuste-stock-actual').textContent = '—';
    document.getElementById('ajuste-unidad').textContent       = '—';
    document.getElementById('ajuste-stock-min').textContent    = '—';
    document.getElementById('ajuste-stock-max').textContent    = '—';
    document.getElementById('ajuste-diferencia').value         = '';
}

function limpiarFormAjuste() {
    document.getElementById('form-ajuste')?.reset();
    limpiarInfoAjuste();
    ajusteProductoData = null;
}

function calcularDiferenciaAjuste() {
    const stockActualEl = document.getElementById('ajuste-stock-actual');
    const stockNuevoEl  = document.getElementById('ajuste-stock-nuevo');
    const difEl         = document.getElementById('ajuste-diferencia');
    if (!stockActualEl || !stockNuevoEl || !difEl) return;

    const actual = parseFloat(stockActualEl.textContent);
    const nuevo  = parseFloat(stockNuevoEl.value);

    if (isNaN(actual) || isNaN(nuevo)) {
        difEl.value = '';
        return;
    }

    const dif = nuevo - actual;
    difEl.value = (dif >= 0 ? '+' : '') + dif.toFixed(2);
}

async function guardarAjuste() {
    const productoId  = document.getElementById('ajuste-producto-id').value;
    const almacenId   = document.getElementById('ajuste-almacen').value;
    const stockNuevo  = parseFloat(document.getElementById('ajuste-stock-nuevo').value);
    const motivo      = document.getElementById('ajuste-motivo').value.trim();
    const stockActual = parseFloat(document.getElementById('ajuste-stock-actual').textContent);

    if (!productoId || !almacenId || isNaN(stockNuevo) || !motivo) {
        showToast('Complete todos los campos obligatorios.', 'warning');
        return;
    }
    if (stockNuevo < 0) {
        showToast('El stock contado no puede ser negativo.', 'warning');
        return;
    }

    // La diferencia es lo que enviamos como "cantidad"
    const cantidad = stockNuevo - stockActual;

    const btn = document.getElementById('btn-confirmar-ajuste');
    btn.disabled = true;

    try {
        await apiFetch(`${API}/ajuste`, {
            method: 'POST',
            body: JSON.stringify({ id_producto: productoId, id_almacen: almacenId, cantidad, motivo }),
        });
        showToast('Ajuste registrado correctamente.', 'success');
        bootstrap.Offcanvas.getInstance(document.getElementById('offcanvas-ajuste'))?.hide();
        cargarStock({}); // Refrescar stock
    } catch (err) {
        showToast(err.message || 'Error al registrar el ajuste.', 'error');
    } finally {
        btn.disabled = false;
    }
}


// ALMACENES — CRUD 

function renderTablaAlmacenes(almacenes) {
    const tbody    = document.getElementById('tabla-almacenes-body');
    const emptyRow = almacenes.length === 0
        ? '<tr><td colspan="6" class="text-center text-muted py-5">No hay almacenes registrados</td></tr>'
        : '';

    tbody.querySelectorAll('tr.almacen-dyn').forEach(r => r.remove());

    if (almacenes.length === 0) {
        tbody.innerHTML = emptyRow;
        return;
    }

    // Poblar selects de responsable
    _poblarSelectsResponsable();

    almacenes.forEach(alm => {
        const tr = document.createElement('tr');
        tr.className = 'almacen-dyn';
        tr.dataset.almacenId = alm.id_almacen;

        const tdId = document.createElement('td');
        tdId.textContent = alm.id_almacen;

        const tdNombre = document.createElement('td');
        tdNombre.innerHTML = `<span class="fw-semibold">${alm.nombre}</span>`;

        const tdDir = document.createElement('td');
        tdDir.textContent = alm.direccion ?? '—';

        const tdResp = document.createElement('td');
        tdResp.textContent = alm.responsable ?? '—';

        const tdEstado = document.createElement('td');
        tdEstado.innerHTML = `<span class="badge text-bg-success">Activo</span>`;

        const tdAcciones = document.createElement('td');
        tdAcciones.className = 'text-end';

        const btnEditar = document.createElement('button');
        btnEditar.type = 'button';
        btnEditar.className = 'btn btn-sm me-1';
        btnEditar.setAttribute('aria-label', `Editar ${alm.nombre}`);
        btnEditar.innerHTML = '<i class="fa-regular fa-pen-to-square" aria-hidden="true"></i>';
        btnEditar.setAttribute('data-bs-toggle', 'modal');
        btnEditar.setAttribute('data-bs-target', '#modal-editar-almacen');
        btnEditar.addEventListener('click', () => abrirModalEditarAlmacen(alm));

        const btnDesactivar = document.createElement('button');
        btnDesactivar.type = 'button';
        btnDesactivar.className = 'btn btn-sm text-danger';
        btnDesactivar.setAttribute('aria-label', `Desactivar ${alm.nombre}`);
        btnDesactivar.innerHTML = '<i class="fa-solid fa-ban" aria-hidden="true"></i>';
        btnDesactivar.addEventListener('click', () => confirmarDesactivarAlmacen(alm));

        const wrap = document.createElement('div');
        wrap.className = 'd-flex gap-1 justify-content-end';
        wrap.appendChild(btnEditar);
        wrap.appendChild(btnDesactivar);
        tdAcciones.appendChild(wrap);

        tr.appendChild(tdId);
        tr.appendChild(tdNombre);
        tr.appendChild(tdDir);
        tr.appendChild(tdResp);
        tr.appendChild(tdEstado);
        tr.appendChild(tdAcciones);
        tbody.appendChild(tr);
    });
}

async function _poblarSelectsResponsable() {
    // Intenta cargar empleados para el select de responsable en modales
    try {
        const data = await apiFetch('/api/empleados');
        const empleados = data.empleados ?? [];
        ['nuevo-alm-responsable', 'editar-alm-responsable'].forEach(id => {
            const sel = document.getElementById(id);
            if (!sel) return;
            while (sel.options.length > 1) sel.remove(1);
            empleados.forEach(e => {
                const opt = document.createElement('option');
                opt.value = e.id_empleado;
                opt.textContent = `${e.nombre} ${e.apellido}`;
                sel.appendChild(opt);
            });
        });
    } catch {
        // Silencioso si no hay ruta de empleados disponible
    }
}

function initAlmacenesCrud() {
    // Nuevo almacén
    document.getElementById('form-nuevo-almacen')?.addEventListener('submit', e => {
        e.preventDefault();
        guardarNuevoAlmacen();
    });

    // Editar almacén
    document.getElementById('form-editar-almacen')?.addEventListener('submit', e => {
        e.preventDefault();
        guardarEditarAlmacen();
    });

    // Confirmar desactivar
    document.getElementById('btn-confirmar-desactivar-almacen')?.addEventListener('click', ejecutarDesactivarAlmacen);
}

async function guardarNuevoAlmacen() {
    const nombre     = document.getElementById('nuevo-alm-nombre').value.trim();
    const direccion  = document.getElementById('nuevo-alm-direccion').value.trim();
    const responsable = document.getElementById('nuevo-alm-responsable').value;

    if (!nombre) {
        showToast('El nombre del almacén es obligatorio.', 'warning');
        return;
    }

    const btn = document.getElementById('btn-guardar-nuevo-almacen');
    btn.disabled = true;

    try {
        await apiFetch(`${API}/almacenes`, {
            method: 'POST',
            body: JSON.stringify({ nombre, direccion: direccion || null, responsable: responsable || null }),
        });
        showToast('Almacén creado correctamente.', 'success');
        bootstrap.Modal.getInstance(document.getElementById('modal-nuevo-almacen'))?.hide();
        document.getElementById('form-nuevo-almacen').reset();
        cargarAlmacenes();
    } catch (err) {
        showToast(err.message || 'Error al crear el almacén.', 'error');
    } finally {
        btn.disabled = false;
    }
}

function abrirModalEditarAlmacen(alm) {
    document.getElementById('editar-alm-id').value         = alm.id_almacen;
    document.getElementById('editar-alm-nombre').value     = alm.nombre;
    document.getElementById('editar-alm-direccion').value  = alm.direccion ?? '';
    document.getElementById('editar-alm-responsable').value = alm.id_responsable ?? '';
}

async function guardarEditarAlmacen() {
    const id        = document.getElementById('editar-alm-id').value;
    const nombre    = document.getElementById('editar-alm-nombre').value.trim();
    const direccion = document.getElementById('editar-alm-direccion').value.trim();
    const responsable = document.getElementById('editar-alm-responsable').value;

    if (!nombre) {
        showToast('El nombre del almacén es obligatorio.', 'warning');
        return;
    }

    const btn = document.getElementById('btn-guardar-editar-almacen');
    btn.disabled = true;

    try {
        await apiFetch(`${API}/almacenes/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ nombre, direccion: direccion || null, responsable: responsable || null }),
        });
        showToast('Almacén actualizado correctamente.', 'success');
        bootstrap.Modal.getInstance(document.getElementById('modal-editar-almacen'))?.hide();
        cargarAlmacenes();
    } catch (err) {
        showToast(err.message || 'Error al editar el almacén.', 'error');
    } finally {
        btn.disabled = false;
    }
}

function confirmarDesactivarAlmacen(alm) {
    document.getElementById('desactivar-alm-nombre').textContent = alm.nombre;
    document.getElementById('btn-confirmar-desactivar-almacen').dataset.almacenId = alm.id_almacen;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modal-desactivar-almacen')).show();
}

async function ejecutarDesactivarAlmacen() {
    const id  = document.getElementById('btn-confirmar-desactivar-almacen').dataset.almacenId;
    const btn = document.getElementById('btn-confirmar-desactivar-almacen');
    btn.disabled = true;

    try {
        await apiFetch(`${API}/almacenes/${id}`, { method: 'DELETE' });
        showToast('Almacén desactivado.', 'success');
        bootstrap.Modal.getInstance(document.getElementById('modal-desactivar-almacen'))?.hide();
        cargarAlmacenes();
    } catch (err) {
        showToast(err.message || 'Error al desactivar el almacén.', 'error');
    } finally {
        btn.disabled = false;
    }
}


//  TRANSFERENCIAS 

function initTransferenciasFiltros() {
    document.getElementById('btn-filtrar-transf')?.addEventListener('click', cargarTransferencias);
    document.getElementById('btn-limpiar-transf')?.addEventListener('click', () => {
        document.getElementById('filtro-transf-estado').value = '';
        document.getElementById('filtro-transf-desde').value  = '';
        document.getElementById('filtro-transf-hasta').value  = '';
        cargarTransferencias();
    });
}

async function cargarTransferencias() {
    const qs = new URLSearchParams();
    const estado = document.getElementById('filtro-transf-estado')?.value;
    const desde  = document.getElementById('filtro-transf-desde')?.value;
    const hasta  = document.getElementById('filtro-transf-hasta')?.value;

    if (estado) qs.set('estado',      estado);
    if (desde)  qs.set('fecha_desde', desde);
    if (hasta)  qs.set('fecha_hasta', hasta);

    try {
        const data = await apiFetch(`${API}/transferencias?${qs}`);
        renderTablaTransferencias(data.transferencias);
    } catch (err) {
        showToast('Error al cargar transferencias.', 'error');
    }
}

function renderTablaTransferencias(transferencias) {
    const tbody    = document.getElementById('tabla-transferencias-body');
    const emptyRow = document.getElementById('transf-empty-row');
    const badge    = document.getElementById('transf-total-badge');
    const info     = document.getElementById('transf-paginacion-info');

    tbody.querySelectorAll('tr.transf-dyn').forEach(r => r.remove());
    badge.textContent = `${transferencias.length} transferencia${transferencias.length !== 1 ? 's' : ''}`;

    if (transferencias.length === 0) {
        emptyRow.classList.remove('d-none');
        info.textContent = '';
        return;
    }

    emptyRow.classList.add('d-none');
    info.textContent = `${transferencias.length} transferencia${transferencias.length !== 1 ? 's' : ''}`;

    transferencias.forEach((t, idx) => {
        const rowId    = `transf-dyn-row-${idx}`;
        const detailId = `transf-dyn-detail-${idx}`;

        const tr = document.createElement('tr');
        tr.id = rowId;
        tr.className = 'transf-dyn cursor-pointer';
        tr.setAttribute('data-expand-trigger', detailId);
        tr.setAttribute('role', 'button');
        tr.setAttribute('tabindex', '0');
        tr.setAttribute('aria-expanded', 'false');

        const badgeEstado = _badgeTransfEstado(t.estado);

        tr.innerHTML = `
            <td class="ps-3"><i class="fa-solid fa-chevron-down fa-xs text-muted" data-expand-icon aria-hidden="true"></i></td>
            <td><span class="fw-semibold font-monospace">TRF-${String(t.id_transferencia).padStart(3,'0')}</span></td>
            <td><time datetime="${t.fecha}">${formatDate(t.fecha)}</time></td>
            <td>${t.almacen_origen}</td>
            <td>${t.almacen_destino}</td>
            <td>${t.empleado}</td>
            <td><span class="small text-muted">${t.motivo ?? '—'}</span></td>
            <td>${badgeEstado}</td>
            <td class="text-end">
                <button type="button" class="btn btn-sm btn-ver-transf"
                    data-transf-id="${t.id_transferencia}"
                    aria-label="Ver detalle de transferencia">
                    <i class="fa-regular fa-eye" aria-hidden="true"></i>
                </button>
            </td>
        `;

        // Fila detalle (cargada dinámicamente al expandir)
        const trDetail = document.createElement('tr');
        trDetail.id = detailId;
        trDetail.className = 'transf-dyn detail-row collapse';
        trDetail.setAttribute('aria-hidden', 'true');
        trDetail.dataset.transfId = t.id_transferencia;
        trDetail.dataset.loaded = 'false';
        trDetail.innerHTML = `<td colspan="9" class="px-4 py-2">
            <div class="d-flex align-items-center gap-2 text-muted small">
                <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                <span>Cargando productos…</span>
            </div>
        </td>`;

        tbody.appendChild(tr);
        tbody.appendChild(trDetail);

        // Listener del botón ver
        tr.querySelector('.btn-ver-transf').addEventListener('click', e => {
            e.stopPropagation();
            abrirDetalleTransferencia(t);
        });
    });

    initExpandableRowsLive();

    // Carga dinámica de detalle en filas desplegables
    document.querySelectorAll('tr.transf-dyn.detail-row[data-transf-id]').forEach(trDet => {
        const trigger = document.querySelector(`[data-expand-trigger="${trDet.id}"]`);
        if (!trigger) return;
        trigger.addEventListener('click', async () => {
            if (trDet.dataset.loaded === 'true') return;
            try {
                const data = await apiFetch(`${API}/transferencias/${trDet.dataset.transfId}`);
                const productos = data.detalle || [];
                if (productos.length === 0) {
                    trDet.querySelector('td').innerHTML = `<span class="text-muted small">Sin productos registrados.</span>`;
                } else {
                    trDet.querySelector('td').innerHTML = `
                        <table class="table table-sm table-borderless mb-0" style="max-width:600px">
                            <thead class="text-muted small">
                                <tr><th>Código</th><th>Producto</th><th class="text-end">Cantidad</th><th>Unidad</th></tr>
                            </thead>
                            <tbody>
                                ${productos.map(p => `
                                    <tr>
                                        <td class="font-monospace small">${p.producto_codigo}</td>
                                        <td class="small">${p.producto_nombre}</td>
                                        <td class="text-end small fw-semibold">${Number(p.cantidad).toFixed(2)}</td>
                                        <td class="small text-muted">${p.unidad ?? ''}</td>
                                    </tr>`).join('')}
                            </tbody>
                        </table>`;
                }
                trDet.dataset.loaded = 'true';
            } catch {
                trDet.querySelector('td').innerHTML = `<span class="text-danger small">Error al cargar los productos.</span>`;
            }
        }, { once: true });
    });
}

function _badgeTransfEstado(estado) {
    const map = {
        pendiente:  '<span class="badge text-bg-warning text-dark">Pendiente</span>',
        completada: '<span class="badge text-bg-success">Completada</span>',
        anulada:    '<span class="badge text-bg-danger">Anulada</span>',
    };
    return map[estado] ?? `<span class="badge text-bg-secondary">${estado}</span>`;
}

function abrirDetalleTransferencia(t) {
    document.getElementById('transf-det-numero').textContent  = `TRF-${String(t.id_transferencia).padStart(3,'0')}`;
    document.getElementById('transf-det-fecha').textContent   = formatDate(t.fecha);
    document.getElementById('transf-det-origen').textContent  = t.almacen_origen;
    document.getElementById('transf-det-destino').textContent = t.almacen_destino;
    document.getElementById('transf-det-empleado').textContent = t.empleado;
    document.getElementById('transf-det-motivo').textContent  = t.motivo ?? '—';
    document.getElementById('transf-det-estado').outerHTML    =
        `<span id="transf-det-estado">${_badgeTransfEstado(t.estado)}</span>`;

    // Cargar tabla de productos del detalle
    const tbodyProductos = document.getElementById('tabla-transf-det-productos-body');
    if (tbodyProductos) {
        tbodyProductos.innerHTML = `<tr><td colspan="4" class="text-center text-muted small py-3">
            <i class="fa-solid fa-spinner fa-spin me-1" aria-hidden="true"></i>Cargando…
        </td></tr>`;
        apiFetch(`${API}/transferencias/${t.id_transferencia}`)
            .then(data => {
                const productos = data.detalle || [];
                if (productos.length === 0) {
                    tbodyProductos.innerHTML = `<tr><td colspan="4" class="text-center text-muted small">Sin productos registrados.</td></tr>`;
                } else {
                    tbodyProductos.innerHTML = productos.map(p => `
                        <tr>
                            <td class="font-monospace small">${p.producto_codigo}</td>
                            <td class="small">${p.producto_nombre}</td>
                            <td class="text-end small fw-semibold">${Number(p.cantidad).toFixed(2)}</td>
                            <td class="small text-muted">${p.unidad ?? ''}</td>
                        </tr>`).join('');
                }
            })
            .catch(() => {
                tbodyProductos.innerHTML = `<tr><td colspan="4" class="text-danger small text-center">Error al cargar los productos.</td></tr>`;
            });
    }

    // Botones de acción según estado
    const fieldset = document.getElementById('transf-cambiar-estado-fieldset');

    if (t.estado !== 'pendiente') {
        fieldset.innerHTML = `<p class="small text-muted mb-0">Esta transferencia ya está <strong>${t.estado}</strong> y no puede modificarse.</p>`;
    } else {
        // Restaurar botones si el fieldset fue modificado antes
        fieldset.innerHTML = `
            <legend class="visually-hidden">Cambiar estado de la transferencia</legend>
            <div class="d-flex gap-2 flex-wrap">
                <button type="button" class="btn btn-sm btn-success" id="btn-completar-transf"
                    data-transf-id="${t.id_transferencia}" aria-label="Marcar como completada">
                    <i class="fa-solid fa-circle-check me-1" aria-hidden="true"></i>Marcar como completada
                </button>
                <button type="button" class="btn btn-sm btn-secondary" id="btn-anular-transf"
                    disabled title="Función no disponible aún" aria-disabled="true"
                    aria-label="Anular transferencia (no disponible)">
                    <i class="fa-solid fa-ban me-1" aria-hidden="true"></i>Anular transferencia
                </button>
            </div>`;

        document.getElementById('btn-completar-transf').addEventListener('click', () => {
            confirmAction('¿Marcar esta transferencia como completada? Se actualizará el stock.', () => {
                completarTransferencia(t.id_transferencia);
            });
        });
    }

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modal-detalle-transferencia')).show();
}


async function completarTransferencia(id) {
    try {
        await apiFetch(`${API}/transferencias/${id}/completar`, { method: 'PATCH' });
        showToast('Transferencia completada correctamente.', 'success');
        bootstrap.Modal.getInstance(document.getElementById('modal-detalle-transferencia'))?.hide();
        cargarTransferencias();
        cargarStock({});
    } catch (err) {
        showToast(err.message || 'Error al completar la transferencia.', 'error');
    }
}



// Items agregados al detalle de la transferencia
let _transfDetalle = [];

function initTransferenciaOffcanvas() {
    document.getElementById('btn-agregar-producto-transf')?.addEventListener('click', agregarProductoTransf);
    document.getElementById('form-transferencia')?.addEventListener('submit', e => {
        e.preventDefault();
        guardarTransferencia();
    });
    document.getElementById('offcanvas-transferencia')?.addEventListener('hidden.bs.offcanvas', limpiarFormTransferencia);
}

function agregarProductoTransf() {
    const input = document.getElementById('transf-buscar-producto');
    const texto = input?.value.trim();
    if (!texto) return;

    const prod = resolverProductoPorTexto(texto);
    if (!prod) {
        showToast('Producto no encontrado. Intente con el código o nombre exacto.', 'warning');
        return;
    }
    if (_transfDetalle.find(i => i.id_producto === prod.id_producto)) {
        showToast('Este producto ya fue agregado.', 'warning');
        return;
    }

    _transfDetalle.push({ id_producto: prod.id_producto, nombre: prod.nombre, stock_actual: prod.stock_actual, unidad: prod.unidad });
    input.value = '';
    renderDetalleTransf();
}

function renderDetalleTransf() {
    const lista    = document.getElementById('transf-detalle-lista');
    const emptyMsg = document.getElementById('transf-detalle-empty');

    // Eliminar items anteriores
    lista.querySelectorAll('.transf-item-dyn').forEach(el => el.remove());

    if (_transfDetalle.length === 0) {
        emptyMsg.classList.remove('d-none');
        return;
    }

    emptyMsg.classList.add('d-none');

    _transfDetalle.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'transf-item-dyn d-flex align-items-center gap-2 mb-2 p-2 border rounded';
        div.dataset.idx = idx;

        const info = document.createElement('div');
        info.className = 'flex-grow-1';
        info.innerHTML = `<p class="mb-0 small fw-semibold">${item.nombre}</p>
                          <p class="mb-0 small text-muted">Disponible: ${Number(item.stock_actual).toFixed(2)} ${item.unidad ?? ''}</p>`;

        const inputCant = document.createElement('input');
        inputCant.type = 'number';
        inputCant.className = 'form-control form-control-sm';
        inputCant.style.width = '100px';
        inputCant.placeholder = '0.00';
        inputCant.min = '0.01';
        inputCant.step = '0.01';
        inputCant.required = true;
        inputCant.setAttribute('aria-label', `Cantidad a transferir de ${item.nombre}`);
        // Preservar cantidad si ya fue ingresada
        inputCant.value = item.cantidad > 0 ? item.cantidad : '';
        inputCant.addEventListener('input', () => { _transfDetalle[idx].cantidad = parseFloat(inputCant.value) || 0; });

        const btnElim = document.createElement('button');
        btnElim.type = 'button';
        btnElim.className = 'btn btn-sm text-danger flex-shrink-0';
        btnElim.setAttribute('aria-label', `Eliminar ${item.nombre} de la transferencia`);
        btnElim.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
        btnElim.addEventListener('click', () => {
            _transfDetalle.splice(idx, 1);
            renderDetalleTransf();
        });

        div.appendChild(info);
        div.appendChild(inputCant);
        div.appendChild(btnElim);
        lista.appendChild(div);
    });
}

async function guardarTransferencia() {
    const origen  = document.getElementById('transf-origen').value;
    const destino = document.getElementById('transf-destino').value;
    const motivo  = document.getElementById('transf-motivo').value.trim();

    if (!origen || !destino) {
        showToast('Seleccione almacén origen y destino.', 'warning');
        return;
    }
    if (parseInt(origen) === parseInt(destino)) {
        showToast('El origen y destino deben ser almacenes distintos.', 'warning');
        return;
    }
    if (!motivo) {
        showToast('El motivo de la transferencia es obligatorio.', 'warning');
        document.getElementById('transf-motivo')?.focus();
        return;
    }
    const detalle = _transfDetalle.filter(i => i.cantidad > 0);
    if (detalle.length === 0) {
        showToast('Agregue al menos un producto con cantidad válida.', 'warning');
        return;
    }


    const btn = document.getElementById('btn-confirmar-transferencia');
    btn.disabled = true;

    try {
        await apiFetch(`${API}/transferencias`, {
            method: 'POST',
            body: JSON.stringify({
                id_almacen_origen:  parseInt(origen),
                id_almacen_destino: parseInt(destino),
                motivo: motivo || null,
                detalle: detalle.map(i => ({ id_producto: i.id_producto, cantidad: i.cantidad })),
            }),
        });
        showToast('Transferencia creada correctamente.', 'success');
        bootstrap.Offcanvas.getInstance(document.getElementById('offcanvas-transferencia'))?.hide();
        cargarTransferencias();
    } catch (err) {
        showToast(err.message || 'Error al crear la transferencia.', 'error');
    } finally {
        btn.disabled = false;
    }
}

function limpiarFormTransferencia() {
    document.getElementById('form-transferencia')?.reset();
    _transfDetalle = [];
    renderDetalleTransf();
}



function initLotesFiltros() {
    document.getElementById('btn-filtrar-lotes')?.addEventListener('click', aplicarFiltrosLotes);
    document.getElementById('btn-limpiar-lotes')?.addEventListener('click', () => {
        document.getElementById('filtro-lote-producto').value = '';
        document.getElementById('filtro-lote-almacen').value  = '';
        document.getElementById('filtro-lote-estado').value   = '';
        limpiarTablaLotes();
    });
}

function aplicarFiltrosLotes() {
    const producto = document.getElementById('filtro-lote-producto')?.value?.trim() || '';
    const almacen = document.getElementById('filtro-lote-almacen')?.value || '';
    const estado = document.getElementById('filtro-lote-vencimiento')?.value || '';
    cargarLotes(producto, almacen, estado);
}

async function cargarLotes(producto, idAlmacen, estadoVencimiento) {
    try {
        const qs = new URLSearchParams();
        if (producto) qs.set('producto', producto);
        if (idAlmacen) qs.set('id_almacen', idAlmacen);
        if (estadoVencimiento) qs.set('estado_vencimiento', estadoVencimiento);
        const data = await apiFetch(`${API}/lotes?${qs}`);
        renderTablaLotes(data.lotes);
    } catch (err) {
        showToast(err.message || 'Error al cargar lotes.', 'error');
    }
}

function limpiarTablaLotes() {
    const tbody = document.getElementById('tabla-lotes-body');
    const emptyRow = document.getElementById('lotes-empty-row');
    tbody.querySelectorAll('tr.lote-dyn').forEach(r => r.remove());
    emptyRow.classList.remove('d-none');
    document.getElementById('lotes-total-badge').textContent = '0 lotes';
    document.getElementById('lotes-paginacion-info').textContent = '';
}

function renderTablaLotes(lotes) {
    const tbody = document.getElementById('tabla-lotes-body');
    const emptyRow = document.getElementById('lotes-empty-row');
    const badge = document.getElementById('lotes-total-badge');
    const info = document.getElementById('lotes-paginacion-info');

    tbody.querySelectorAll('tr.lote-dyn').forEach(r => r.remove());
    badge.textContent = `${lotes.length} lote${lotes.length !== 1 ? 's' : ''}`;

    if (lotes.length === 0) {
        emptyRow.classList.remove('d-none');
        info.textContent = '';
        return;
    }

    emptyRow.classList.add('d-none');
    info.textContent = `${lotes.length} lote${lotes.length !== 1 ? 's' : ''}`;

    lotes.forEach(l => {
        const tr = document.createElement('tr');
        tr.className = 'lote-dyn' + (l.estado_vencimiento === 'vencido' ? ' table-danger' : l.estado_vencimiento === 'proximo' ? ' table-warning' : '');

        tr.innerHTML = `
            <td><span class="fw-semibold font-monospace">${l.numero_lote}</span></td>
            <td>${l.producto ?? '—'}</td>
            <td>${l.almacen}</td> 
            <td class="text-end">${Number(l.cantidad).toFixed(2)}</td>
            <td>${l.fecha_vencimiento ? `<time datetime="${l.fecha_vencimiento}">${formatDate(l.fecha_vencimiento)}</time>` : '—'}</td>
            <td>${_badgeLoteEstado(l.estado_vencimiento)}</td>
            <td><time datetime="${l.creado_en}">${formatDate(l.creado_en)}</time></td>
        `;

        tbody.appendChild(tr);
    });
}

function _badgeLoteEstado(estado) {
    const map = {
        vencido:         '<span class="badge text-bg-danger d-flex align-items-center gap-1" style="width:fit-content"><i class="fa-solid fa-calendar-xmark fa-xs" aria-hidden="true"></i>Vencido</span>',
        proximo:         '<span class="badge text-bg-warning text-dark d-flex align-items-center gap-1" style="width:fit-content"><i class="fa-solid fa-clock fa-xs" aria-hidden="true"></i>Próx. vencer</span>',
        vigente:         '<span class="badge text-bg-success d-flex align-items-center gap-1" style="width:fit-content"><i class="fa-solid fa-circle-check fa-xs" aria-hidden="true"></i>Vigente</span>',
        sin_vencimiento: '<span class="badge text-bg-secondary d-flex align-items-center gap-1" style="width:fit-content"><i class="fa-solid fa-infinity fa-xs" aria-hidden="true"></i>Sin vencimiento</span>',
    };
    return map[estado] ?? `<span class="badge text-bg-secondary">${estado}</span>`;
}



function initExpandableRowsLive() {
    // Solo las filas dinámicas que aún no tienen listener
    document.querySelectorAll('[data-expand-trigger]:not([data-expand-init])').forEach(trigger => {
        trigger.setAttribute('data-expand-init', '1');
        trigger.addEventListener('click', () => {
            const detailRow = document.getElementById(trigger.getAttribute('data-expand-trigger'));
            if (!detailRow) return;
            const isOpen = detailRow.classList.toggle('show');
            const icon = trigger.querySelector('[data-expand-icon]');
            if (icon) {
                icon.classList.toggle('fa-chevron-down', !isOpen);
                icon.classList.toggle('fa-chevron-up', isOpen);
            }
            trigger.closest('tr')?.classList.toggle('table-active', isOpen);
            trigger.setAttribute('aria-expanded', String(isOpen));
            detailRow.setAttribute('aria-hidden', String(!isOpen));
        });
        // Accesibilidad: teclado
        trigger.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                trigger.click();
            }
        });
    });
}