document.addEventListener('DOMContentLoaded', () => {

    // ─── REFERENCIAS DOM ────────────────────────────────────────────────
    const tbodyProveedores      = document.getElementById('tabla-proveedores-body');
    const tbodyContactos        = document.getElementById('tabla-contactos-proveedor');
    const tbodyProductosProv    = document.getElementById('tabla-productos-proveedor');
    const tbodyComparativa      = document.getElementById('tabla-comparativa-body');

    // Filtros lista
    const inputBuscar           = document.getElementById('input-buscar-proveedor');
    const filtroCond            = document.getElementById('filtro-condicion-pago');
    const filtroEstado          = document.getElementById('filtro-estado-proveedor');

    // Filtros comparativa
    const inputBuscarComp       = document.getElementById('input-buscar-comparativa');
    const filtroCompCat         = document.getElementById('filtro-comparativa-categoria');

    // Forms
    const formNuevo             = document.getElementById('form-nuevo-proveedor');
    const formEditar            = document.getElementById('form-editar-proveedor');
    const formNuevoContacto     = document.getElementById('form-nuevo-contacto');
    const formVincularProducto  = document.getElementById('form-vincular-producto');

    // Ficha modal
    const modalFichaNombre      = document.getElementById('modal-proveedor-nombre');
    const fichaRuc              = document.getElementById('ficha-prov-ruc');
    const fichaNombre           = document.getElementById('ficha-prov-nombre');
    const fichaDireccion        = document.getElementById('ficha-prov-direccion');
    const fichaTelefono         = document.getElementById('ficha-prov-telefono');
    const fichaCorreo           = document.getElementById('ficha-prov-correo');
    const fichaWeb              = document.getElementById('ficha-prov-web');
    const fichaCondicion        = document.getElementById('ficha-prov-condicion');
    const fichaEstado           = document.getElementById('ficha-prov-estado');
    const fichaCreado           = document.getElementById('ficha-prov-creado');

    // Offcanvas editar — inputs
    const epRuc                 = document.getElementById('ep-ruc');
    const epNombre              = document.getElementById('ep-nombre');
    const epDireccion           = document.getElementById('ep-direccion');
    const epTelefono            = document.getElementById('ep-telefono');
    const epCorreo              = document.getElementById('ep-correo');
    const epWeb                 = document.getElementById('ep-web');
    const epCondicion           = document.getElementById('ep-condicion-pago');
    const epActivo              = document.getElementById('ep-activo');

    // Vincular producto — datalist
    const vpProductoTexto       = document.getElementById('vp-producto-texto');
    const vpProductoLista       = document.getElementById('vp-producto-lista');
    const vpProductoHidden      = document.getElementById('vp-producto');

    // Tab comparativa
    const tabComparativa        = document.getElementById('tab-comparativa-btn');

    // ─── ESTADO LOCAL ───────────────────────────────────────────────────
    let proveedorActivoId = null;
    let debounceTimer     = null;

    // ─── CONSTANTES ─────────────────────────────────────────────────────
    const CONDICION_LABEL = {
        contado:   { label: 'Contado', cls: 'text-bg-secondary' },
        '30_dias': { label: '30 días', cls: 'text-bg-info'      },
        '60_dias': { label: '60 días', cls: 'text-bg-primary'   },
        '90_dias': { label: '90 días', cls: 'text-bg-warning'   },
    };

    // ─── UTILIDADES ─────────────────────────────────────────────────────
    function badgeCondicion(condicion) {
        const c = CONDICION_LABEL[condicion] ?? { label: condicion ?? '—', cls: 'text-bg-secondary' };
        return `<span class="badge rounded-pill ${c.cls}">${c.label}</span>`;
    }

    function linkTel(tel) {
        if (!tel) return '—';
        return `<a href="tel:${tel}" class="text-decoration-none">
                    <i class="fa-solid fa-phone fa-xs me-1 text-muted" aria-hidden="true"></i>${tel}
                </a>`;
    }

    function limpiarForm(formEl) {
        formEl.reset();
        formEl.classList.remove('was-validated');
    }

    // ─── CARGA INICIAL ──────────────────────────────────────────────────
    cargarProveedores();
    cargarProductosParaVincular();
    cargarCategoriasComparativa();

    // ════════════════════════════════════════════════════════════════════
    // LISTA DE PROVEEDORES
    // ════════════════════════════════════════════════════════════════════

    async function cargarProveedores() {
        const params = new URLSearchParams();
        const buscar = inputBuscar?.value.trim();
        const cond   = filtroCond?.value;
        const estado = filtroEstado?.value;

        if (buscar)            params.set('buscar', buscar);
        if (cond)              params.set('condicion_pago', cond);
        if (estado !== '')     params.set('activo', estado);

        try {
            const res  = await fetch(`/api/proveedores?${params}`, { credentials: 'include' });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.mensaje || 'Error al cargar proveedores');
            renderTablaProveedores(data.proveedores);
        } catch (err) {
            console.error(err);
            showToast('Error al cargar proveedores', 'error');
        }
    }

    function renderTablaProveedores(proveedores) {
        if (!tbodyProveedores) return;

        if (!proveedores.length) {
            tbodyProveedores.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">Sin proveedores registrados</td></tr>`;
            return;
        }

        const fragment = document.createDocumentFragment();

        proveedores.forEach(p => {
            const trMain = document.createElement('tr');
            trMain.setAttribute('data-expand-trigger', `detalle-prov-${p.id_proveedor}`);
            trMain.setAttribute('data-id', p.id_proveedor);
            trMain.style.cursor = 'pointer';
            trMain.innerHTML = `
                <td class="ps-3">
                    <i class="fa-solid fa-chevron-down fa-fw fa-xs" data-expand-icon aria-hidden="true"></i>
                </td>
                <td><span class="fw-medium font-monospace">${p.ruc}</span></td>
                <td class="fw-semibold">${p.nombre}</td>
                <td>${linkTel(p.telefono)}</td>
                <td>${badgeCondicion(p.condicion_pago)}</td>
                <td class="text-muted small">${formatDate(p.creado_en)}</td>
                <td>${getBadge(p.activo ? 'activo' : 'inactivo')}</td>
                <td class="text-end pe-3">
                    <div class="d-flex justify-content-end gap-1">
                        <button class="btn btn-sm btn-outline-primary"
                            data-accion="ver-ficha" data-id="${p.id_proveedor}"
                            aria-label="Ver ficha de ${p.nombre}">
                            <i class="fa-solid fa-eye fa-fw" aria-hidden="true"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary"
                            data-accion="abrir-editar" data-id="${p.id_proveedor}"
                            aria-label="Editar ${p.nombre}">
                            <i class="fa-solid fa-pen fa-fw" aria-hidden="true"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger"
                            data-accion="desactivar" data-id="${p.id_proveedor}"
                            data-nombre="${p.nombre}"
                            aria-label="Desactivar ${p.nombre}"
                            ${!p.activo ? 'disabled' : ''}>
                            <i class="fa-solid fa-ban fa-fw" aria-hidden="true"></i>
                        </button>
                    </div>
                </td>`;

            const trDetail = document.createElement('tr');
            trDetail.id        = `detalle-prov-${p.id_proveedor}`;
            trDetail.className = 'detail-row collapse';
            trDetail.innerHTML = `
                <td colspan="8" class="bg-body-tertiary px-4 py-3">
                    <div class="row g-4">
                        <div class="col-md-4">
                            <p class="text-muted small fw-semibold text-uppercase mb-2">Datos de contacto</p>
                            <ul class="list-unstyled small mb-0">
                                <li class="mb-1">
                                    <i class="fa-solid fa-location-dot fa-fw text-muted me-1" aria-hidden="true"></i>
                                    ${p.direccion || '—'}
                                </li>
                                <li class="mb-1">
                                    <i class="fa-solid fa-envelope fa-fw text-muted me-1" aria-hidden="true"></i>
                                    ${p.correo || '—'}
                                </li>
                                <li>
                                    <i class="fa-solid fa-globe fa-fw text-muted me-1" aria-hidden="true"></i>
                                    ${p.web
                                        ? `<a href="${p.web}" target="_blank" rel="noopener" class="text-decoration-none">${p.web}</a>`
                                        : '—'}
                                </li>
                            </ul>
                        </div>
                        <div class="col-md-4">
                            <p class="text-muted small fw-semibold text-uppercase mb-2">Resumen</p>
                            <ul class="list-unstyled small mb-0">
                                <li class="mb-1">
                                    <i class="fa-solid fa-boxes-stacked fa-fw text-muted me-1" aria-hidden="true"></i>
                                    <span class="fw-medium">${p.total_productos ?? 0}</span> productos suministrados
                                </li>
                                <li>
                                    <i class="fa-solid fa-user-tie fa-fw text-muted me-1" aria-hidden="true"></i>
                                    <span class="fw-medium">${p.total_contactos ?? 0}</span> contactos registrados
                                </li>
                            </ul>
                        </div>
                        <div class="col-md-4 d-flex align-items-end">
                            <button class="btn btn-sm btn-link p-0"
                                data-accion="ver-ficha" data-id="${p.id_proveedor}" type="button">
                                Ver ficha completa
                                <i class="fa-solid fa-arrow-right fa-xs ms-1" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                </td>`;

            fragment.appendChild(trMain);
            fragment.appendChild(trDetail);
        });

        tbodyProveedores.innerHTML = '';
        tbodyProveedores.appendChild(fragment);
        initExpandableRows();
    }

    // ─── Delegación tabla proveedores ────────────────────────────────────
    tbodyProveedores?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-accion]');
        if (!btn) return;

        const { accion, id, nombre } = btn.dataset;

        if (accion === 'ver-ficha')    abrirFicha(id);
        if (accion === 'abrir-editar') abrirEditar(id);
        if (accion === 'desactivar') {
            confirmAction(`¿Desactivar a "${nombre}"?`, () => desactivarProveedor(id));
        }
    });

    // ════════════════════════════════════════════════════════════════════
    // FICHA DE PROVEEDOR (modal)
    // ════════════════════════════════════════════════════════════════════

    async function abrirFicha(id) {
        proveedorActivoId = id;
        try {
            const res  = await fetch(`/api/proveedores/${id}`, { credentials: 'include' });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.mensaje);

            const p = data.proveedor;

            if (modalFichaNombre) modalFichaNombre.textContent  = p.nombre;
            if (fichaRuc)         fichaRuc.textContent          = p.ruc;
            if (fichaNombre)      fichaNombre.textContent       = p.nombre;
            if (fichaDireccion)   fichaDireccion.textContent    = p.direccion  || '—';
            if (fichaTelefono)    fichaTelefono.textContent     = p.telefono   || '—';
            if (fichaCorreo)      fichaCorreo.textContent       = p.correo     || '—';

            if (fichaWeb) {
                fichaWeb.innerHTML = p.web
                    ? `<a href="${p.web}" target="_blank" rel="noopener" class="text-decoration-none">${p.web}</a>`
                    : '—';
            }

            if (fichaCondicion) {
                const c = CONDICION_LABEL[p.condicion_pago] ?? { label: p.condicion_pago, cls: 'text-bg-secondary' };
                fichaCondicion.className   = `badge rounded-pill ${c.cls}`;
                fichaCondicion.textContent = c.label;
            }

            if (fichaEstado) {
                const ok = p.activo;
                fichaEstado.className   = `badge rounded-pill ${ok ? 'text-bg-success' : 'text-bg-secondary'}`;
                fichaEstado.textContent = ok ? 'Activo' : 'Inactivo';
            }

            if (fichaCreado) fichaCreado.textContent = formatDate(p.creado_en);

            renderTablaContactos(data.contactos);
            renderTablaProductosProv(data.productos);

            bootstrap.Modal.getOrCreateInstance(
                document.getElementById('modal-ficha-proveedor')
            ).show();

        } catch (err) {
            console.error(err);
            showToast('Error al cargar la ficha del proveedor', 'error');
        }
    }

    // ─── Render contactos (dentro del modal ficha) ───────────────────────
    function renderTablaContactos(contactos) {
        if (!tbodyContactos) return;

        if (!contactos?.length) {
            tbodyContactos.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">Sin contactos registrados</td></tr>`;
            return;
        }

        const fragment = document.createDocumentFragment();
        contactos.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-semibold">${c.nombre}</td>
                <td class="text-muted small">${c.cargo || '—'}</td>
                <td>${c.telefono || '—'}</td>
                <td>${c.correo   || '—'}</td>
                <td>
                    ${c.es_principal
                        ? `<span class="badge text-bg-success rounded-pill">
                               <i class="fa-solid fa-star fa-xs me-1" aria-hidden="true"></i>Principal
                           </span>`
                        : `<span class="badge text-bg-secondary rounded-pill">Secundario</span>`}
                </td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger"
                        data-accion="eliminar-contacto" data-id="${c.id_contacto}"
                        aria-label="Eliminar contacto ${c.nombre}">
                        <i class="fa-solid fa-trash fa-fw" aria-hidden="true"></i>
                    </button>
                </td>`;
            fragment.appendChild(tr);
        });

        tbodyContactos.innerHTML = '';
        tbodyContactos.appendChild(fragment);
    }

    // ─── Render productos del proveedor (dentro del modal ficha) ─────────
    function renderTablaProductosProv(productos) {
        if (!tbodyProductosProv) return;

        if (!productos?.length) {
            tbodyProductosProv.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-3">Sin productos vinculados</td></tr>`;
            return;
        }

        const fragment = document.createDocumentFragment();
        productos.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="font-monospace small">${p.codigo || '—'}</td>
                <td class="fw-medium">${p.producto}</td>
                <td class="font-monospace small text-muted">${p.codigo_proveedor || '—'}</td>
                <td class="fw-semibold">${formatMoney(p.precio_compra)}</td>
                <td class="text-center">${p.tiempo_entrega_dias ?? '—'}</td>
                <td>
                    ${p.es_preferido
                        ? `<span class="badge text-bg-warning rounded-pill">
                               <i class="fa-solid fa-star fa-xs me-1" aria-hidden="true"></i>Preferido
                           </span>`
                        : `<span class="badge text-bg-secondary rounded-pill">No</span>`}
                </td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger"
                        data-accion="desvincular-producto" data-id="${p.id_producto}"
                        aria-label="Desvincular ${p.producto}">
                        <i class="fa-solid fa-unlink fa-fw" aria-hidden="true"></i>
                    </button>
                </td>`;
            fragment.appendChild(tr);
        });

        tbodyProductosProv.innerHTML = '';
        tbodyProductosProv.appendChild(fragment);
    }

    // ─── Delegación: contactos ────────────────────────────────────────────
    tbodyContactos?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-accion="eliminar-contacto"]');
        if (!btn) return;
        confirmAction('¿Eliminar este contacto?', async () => {
            try {
                const res  = await fetch(
                    `/api/proveedores/${proveedorActivoId}/contactos/${btn.dataset.id}`,
                    { method: 'DELETE', credentials: 'include' }
                );
                const data = await res.json();
                if (!res.ok || !data.ok) throw new Error(data.mensaje);
                showToast('Contacto eliminado');
                abrirFicha(proveedorActivoId);
            } catch (err) {
                showToast(err.message || 'Error al eliminar contacto', 'error');
            }
        });
    });

    // ─── Delegación: productos del proveedor ─────────────────────────────
    tbodyProductosProv?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-accion="desvincular-producto"]');
        if (!btn) return;
        confirmAction('¿Desvincular este producto del proveedor?', async () => {
            try {
                const res  = await fetch(
                    `/api/proveedores/${proveedorActivoId}/productos/${btn.dataset.id}`,
                    { method: 'DELETE', credentials: 'include' }
                );
                const data = await res.json();
                if (!res.ok || !data.ok) throw new Error(data.mensaje);
                showToast('Producto desvinculado');
                abrirFicha(proveedorActivoId);
            } catch (err) {
                showToast(err.message || 'Error al desvincular producto', 'error');
            }
        });
    });

    // ════════════════════════════════════════════════════════════════════
    // OFFCANVAS EDITAR
    // ════════════════════════════════════════════════════════════════════

    async function abrirEditar(id) {
        proveedorActivoId = id;
        try {
            const res  = await fetch(`/api/proveedores/${id}`, { credentials: 'include' });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.mensaje);

            const p = data.proveedor;
            if (epRuc)       epRuc.value       = p.ruc             || '';
            if (epNombre)    epNombre.value     = p.nombre          || '';
            if (epDireccion) epDireccion.value  = p.direccion       || '';
            if (epTelefono)  epTelefono.value   = p.telefono        || '';
            if (epCorreo)    epCorreo.value     = p.correo          || '';
            if (epWeb)       epWeb.value        = p.web             || '';
            if (epCondicion) epCondicion.value  = p.condicion_pago  || 'contado';
            if (epActivo)    epActivo.checked   = !!p.activo;

            bootstrap.Offcanvas.getOrCreateInstance(
                document.getElementById('offcanvas-editar-proveedor')
            ).show();

        } catch (err) {
            showToast('Error al cargar datos del proveedor', 'error');
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // FORMS
    // ════════════════════════════════════════════════════════════════════

    // ─── Nuevo proveedor ─────────────────────────────────────────────────
    formNuevo?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!formNuevo.checkValidity()) { formNuevo.classList.add('was-validated'); return; }

        const body = {
            ruc:            document.getElementById('np-ruc').value.trim(),
            nombre:         document.getElementById('np-nombre').value.trim(),
            direccion:      document.getElementById('np-direccion').value.trim(),
            telefono:       document.getElementById('np-telefono').value.trim(),
            correo:         document.getElementById('np-correo').value.trim(),
            web:            document.getElementById('np-web').value.trim(),
            condicion_pago: document.getElementById('np-condicion-pago').value,
        };

        try {
            const res  = await fetch('/api/proveedores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.mensaje);

            showToast('Proveedor creado correctamente');
            limpiarForm(formNuevo);
            bootstrap.Offcanvas.getInstance(
                document.getElementById('offcanvas-nuevo-proveedor')
            )?.hide();
            cargarProveedores();
        } catch (err) {
            showToast(err.message || 'Error al crear proveedor', 'error');
        }
    });

    // ─── Editar proveedor ────────────────────────────────────────────────
    formEditar?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!formEditar.checkValidity()) { formEditar.classList.add('was-validated'); return; }

        const body = {
            ruc:            epRuc?.value.trim(),
            nombre:         epNombre?.value.trim(),
            direccion:      epDireccion?.value.trim(),
            telefono:       epTelefono?.value.trim(),
            correo:         epCorreo?.value.trim(),
            web:            epWeb?.value.trim(),
            condicion_pago: epCondicion?.value,
        };

        try {
            const res  = await fetch(`/api/proveedores/${proveedorActivoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.mensaje);

            showToast('Proveedor actualizado');
            bootstrap.Offcanvas.getInstance(
                document.getElementById('offcanvas-editar-proveedor')
            )?.hide();
            cargarProveedores();
        } catch (err) {
            showToast(err.message || 'Error al actualizar proveedor', 'error');
        }
    });

    // ─── Desactivar proveedor ────────────────────────────────────────────
    async function desactivarProveedor(id) {
        try {
            const res  = await fetch(`/api/proveedores/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.mensaje);
            showToast('Proveedor desactivado');
            cargarProveedores();
        } catch (err) {
            showToast(err.message || 'Error al desactivar proveedor', 'error');
        }
    }

    // ─── Nuevo contacto ──────────────────────────────────────────────────
    formNuevoContacto?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!formNuevoContacto.checkValidity()) { formNuevoContacto.classList.add('was-validated'); return; }

        const body = {
            nombre:       document.getElementById('nc-prov-nombre').value.trim(),
            cargo:        document.getElementById('nc-prov-cargo').value.trim(),
            telefono:     document.getElementById('nc-prov-telefono').value.trim(),
            correo:       document.getElementById('nc-prov-correo').value.trim(),
            es_principal: document.getElementById('nc-prov-principal').checked,
        };

        try {
            const res  = await fetch(`/api/proveedores/${proveedorActivoId}/contactos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.mensaje);

            showToast('Contacto agregado');
            limpiarForm(formNuevoContacto);
            bootstrap.Modal.getInstance(
                document.getElementById('modal-nuevo-contacto')
            )?.hide();
            abrirFicha(proveedorActivoId);
        } catch (err) {
            showToast(err.message || 'Error al agregar contacto', 'error');
        }
    });

    // ─── Vincular producto ───────────────────────────────────────────────
    formVincularProducto?.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!vpProductoHidden?.value) {
            vpProductoTexto?.classList.add('is-invalid');
            return;
        }

        if (!formVincularProducto.checkValidity()) {
            formVincularProducto.classList.add('was-validated');
            return;
        }

        const body = {
            id_producto:         parseInt(vpProductoHidden.value),
            codigo_proveedor:    document.getElementById('vp-codigo-prov').value.trim(),
            precio_compra:       parseFloat(document.getElementById('vp-precio').value),
            tiempo_entrega_dias: parseInt(document.getElementById('vp-entrega').value) || null,
            es_preferido:        document.getElementById('vp-preferido').checked,
        };

        try {
            const res  = await fetch(`/api/proveedores/${proveedorActivoId}/productos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.mensaje);

            showToast('Producto vinculado correctamente');
            limpiarForm(formVincularProducto);
            bootstrap.Modal.getInstance(
                document.getElementById('modal-vincular-producto')
            )?.hide();
            abrirFicha(proveedorActivoId);
        } catch (err) {
            showToast(err.message || 'Error al vincular producto', 'error');
        }
    });

    // ════════════════════════════════════════════════════════════════════
    // DATALIST DE PRODUCTOS (para vincular)
    // ════════════════════════════════════════════════════════════════════

    async function cargarProductosParaVincular() {
        try {
            const res  = await fetch('/api/productos?activo=1', { credentials: 'include' });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.mensaje || 'Error al cargar productos');

            if (!vpProductoLista) return;

            const fragment = document.createDocumentFragment();
            data.productos.forEach(p => {
                const option    = document.createElement('option');
                option.value    = `${p.nombre} (${p.codigo})`;
                option.dataset.id = p.id_producto;
                fragment.appendChild(option);
            });

            vpProductoLista.innerHTML = '';
            vpProductoLista.appendChild(fragment);
        } catch (err) {
            console.error('No se pudieron cargar productos para vincular:', err);
        }
    }

    // Resolver id_producto oculto cuando el usuario selecciona del datalist
    vpProductoTexto?.addEventListener('input', function () {
        const opciones = vpProductoLista ? Array.from(vpProductoLista.options) : [];
        const match    = opciones.find(o => o.value === this.value);
        if (vpProductoHidden) vpProductoHidden.value = match ? (match.dataset.id || '') : '';
        this.classList.toggle('is-invalid', !!this.value && !match);
        if (match) this.classList.remove('is-invalid');
    });

    // ════════════════════════════════════════════════════════════════════
    // FILTROS
    // ════════════════════════════════════════════════════════════════════

    inputBuscar?.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(cargarProveedores, 350);
    });
    filtroCond?.addEventListener('change', cargarProveedores);
    filtroEstado?.addEventListener('change', cargarProveedores);

    
    // ════════════════════════════════════════════════════════════════════
    // COMPARATIVA
    // ════════════════════════════════════════════════════════════════════

    async function cargarCategoriasComparativa() {
    try {
        const res  = await fetch('/api/categorias/cat', { credentials: 'include' });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.mensaje);

        if (!filtroCompCat) return;

        const fragment = document.createDocumentFragment();
        const opcionTodas = document.createElement('option');
        opcionTodas.value       = '';
        opcionTodas.textContent = 'Todas las categorías';
        fragment.appendChild(opcionTodas);

        data.categorias.forEach(c => {
            const option       = document.createElement('option');
            option.value       = c.id_categoria;
            option.textContent = c.nombre;
            fragment.appendChild(option);
        });

        filtroCompCat.innerHTML = '';
        filtroCompCat.appendChild(fragment);
    } catch (err) {
        console.error('Error al cargar categorías:', err);
    }
}
    tabComparativa?.addEventListener('shown.bs.tab', cargarComparativa);

    inputBuscarComp?.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(cargarComparativa, 350);
    });
    filtroCompCat?.addEventListener('change', cargarComparativa);

    async function cargarComparativa() {
        const params = new URLSearchParams();
        const buscar = inputBuscarComp?.value.trim();
        const cat    = filtroCompCat?.value;
        if (buscar) params.set('buscar', buscar);
        if (cat)    params.set('categoria', cat);

        try {
            const res  = await fetch(`/api/proveedores/comparativa?${params}`, { credentials: 'include' });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.mensaje || 'Error en comparativa');
            renderComparativa(data.comparativa);
        } catch (err) {
            console.error(err);
            showToast('Error al cargar comparativa', 'error');
        }
    }

    function renderComparativa(productos) {
        if (!tbodyComparativa) return;

        if (!productos?.length) {
            tbodyComparativa.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Sin datos de comparativa</td></tr>`;
            return;
        }

        const fragment = document.createDocumentFragment();

        productos.forEach(prod => {
            const rowId = `comp-row-${prod.id_producto}`;

            const trMain = document.createElement('tr');
            trMain.setAttribute('data-expand-trigger', rowId);
            trMain.style.cursor = 'pointer';
            trMain.innerHTML = `
                <td class="ps-3">
                    <i class="fa-solid fa-chevron-down fa-xs text-muted" data-expand-icon aria-hidden="true"></i>
                </td>
                <td><span class="font-monospace small fw-semibold">${prod.codigo || '—'}</span></td>
                <td class="fw-semibold">${prod.producto}</td>
                <td><span class="badge text-bg-secondary">${prod.categoria} / ${prod.subcategoria}</span></td>
                <td><span class="badge rounded-pill text-bg-primary">
                    ${prod.total_proveedores} proveedor${prod.total_proveedores !== 1 ? 'es' : ''}
                </span></td>
                <td class="fw-semibold text-success">${formatMoney(prod.mejor_precio)} / ${prod.unidad}</td>`;

            const filasProv = prod.proveedores.map(pv => {
                const esMejor = parseFloat(pv.precio_compra) === parseFloat(prod.mejor_precio);
                return `<tr class="${esMejor ? 'table-success' : ''}">
                    <td class="fw-semibold">${pv.proveedor}</td>
                    <td class="${esMejor ? 'fw-semibold' : ''}">${formatMoney(pv.precio_compra)} / ${prod.unidad}</td>
                    <td>${pv.tiempo_entrega_dias ? pv.tiempo_entrega_dias + ' días' : '—'}</td>
                    <td class="font-monospace small text-muted">${pv.codigo_proveedor || '—'}</td>
                    <td>
                        ${pv.es_preferido
                            ? `<span class="badge text-bg-warning"><i class="fa-solid fa-star fa-xs me-1" aria-hidden="true"></i>Sí</span>`
                            : `<span class="badge text-bg-secondary">No</span>`}
                    </td>
                </tr>`;
            }).join('');

            const trDetail = document.createElement('tr');
            trDetail.id        = rowId;
            trDetail.className = 'detail-row collapse';
            trDetail.innerHTML = `
                <td colspan="6" class="bg-body-secondary px-4 py-3">
                    <p class="text-muted small fw-semibold text-uppercase mb-2">
                        Proveedores que suministran este producto
                    </p>
                    <div class="table-responsive">
                        <table class="table table-sm table-bordered bg-body mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Proveedor</th>
                                    <th>Precio unitario</th>
                                    <th>Tiempo entrega</th>
                                    <th>Cód. proveedor</th>
                                    <th>Preferido</th>
                                </tr>
                            </thead>
                            <tbody>${filasProv}</tbody>
                        </table>
                    </div>
                </td>`;

            fragment.appendChild(trMain);
            fragment.appendChild(trDetail);
        });

        tbodyComparativa.innerHTML = '';
        tbodyComparativa.appendChild(fragment);
        initExpandableRows();
    }

});