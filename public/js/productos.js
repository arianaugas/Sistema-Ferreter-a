document.addEventListener('DOMContentLoaded', () => {

  /* 
     REFERENCIAS AL DOM
  */

  //Tabla productos
  const tbodyProductos = document.getElementById('tabla-productos-body');
  const totalBadge = document.getElementById('productos-total-badge');
  const emptyRow = document.getElementById('productos-empty-row');

  //Filtros lista
  const filtroNombre = document.getElementById('filtro-producto-nombre');
  const filtroCategoria = document.getElementById('filtro-producto-categoria');
  const filtroSubcat = document.getElementById('filtro-producto-subcategoria');
  const filtroMarca = document.getElementById('filtro-producto-marca');
  const filtroEstado = document.getElementById('filtro-producto-estado');
  const filtroFechaDesde = document.getElementById('filtro-producto-fecha-desde');
  const filtroFechaHasta = document.getElementById('filtro-producto-fecha-hasta');
  const btnFiltrar = document.getElementById('btn-filtrar-productos');
  const btnLimpiar = document.getElementById('btn-limpiar-filtros-productos');

  //Modal Ficha
  const fichaModal = document.getElementById('modal-ficha-producto');

  //Modal Editar producto
  const editId = document.getElementById('edit-p-id');
  const editNombre = document.getElementById('edit-p-nombre');
  const editSubcat = document.getElementById('edit-p-subcategoria');
  const editPrecioCompra = document.getElementById('edit-p-precio-compra');
  const editPrecioVenta = document.getElementById('edit-p-precio-venta');
  const editStockMin = document.getElementById('edit-p-stock-minimo');
  const editStockMax = document.getElementById('edit-p-stock-maximo');
  const editUbicacion = document.getElementById('edit-p-ubicacion');
  const editLotes = document.getElementById('edit-p-maneja-lotes');
  const editActivo = document.getElementById('edit-p-activo');
  const btnGuardarEdicion = document.getElementById('btn-guardar-edicion-producto');

  //Modal Nuevo producto
  const npCodigo = document.getElementById('np-codigo');
  const npNombre = document.getElementById('np-nombre');
  const npDescripcion = document.getElementById('np-descripcion');
  const npCategoria = document.getElementById('np-categoria');
  const npSubcategoria = document.getElementById('np-subcategoria');
  const npMarca = document.getElementById('np-marca');
  const npUnidad = document.getElementById('np-unidad');
  const npUbicacion = document.getElementById('np-ubicacion');
  const npPrecioCompra = document.getElementById('np-precio-compra');
  const npPrecioVenta = document.getElementById('np-precio-venta');
  const npStockMin = document.getElementById('np-stock-minimo');
  //const npStockActual = document.getElementById('np-stock-actual');
  const npStockMax = document.getElementById('np-stock-maximo');
  const npLotes = document.getElementById('np-maneja-lotes');
  const npImagenInput = document.getElementById('np-imagen-input');
  const btnNpSiguiente = document.getElementById('btn-np-siguiente');
  const btnNpAnterior = document.getElementById('btn-np-anterior');
  const btnNpGuardar = document.getElementById('btn-np-guardar');
  const stepOne = document.getElementById('nuevo-producto-step-1');
  const stepTwo = document.getElementById('nuevo-producto-step-2');

  //Tabs catálogo
  const tbodyCategorias = document.getElementById('tabla-categorias-body');
  const tbodySubcategorias = document.getElementById('tabla-subcategorias-body');
  const tbodyMarcas = document.getElementById('tabla-marcas-body');
  const tbodyUnidades = document.getElementById('tabla-unidades-body');

  //Formulario inline Categorías
  const inputCatNombre = document.getElementById('input-categoria-nombre');
  const inputCatDescripcion = document.getElementById('input-categoria-descripcion');
  const inputCatActivo = document.getElementById('input-categoria-activo');
  const btnGuardarCat = document.getElementById('btn-guardar-categoria');
  const btnCancelarCat = document.getElementById('btn-cancelar-categoria');
  const formCatTitle = document.getElementById('form-categoria-title');

  //Modal Editar Categoría
  const editCatId = document.getElementById('edit-cat-id');
  const editCatNombre = document.getElementById('edit-cat-nombre');
  const editCatDescripcion = document.getElementById('edit-cat-descripcion');
  const editCatActivo = document.getElementById('edit-cat-activo');
  const btnGuardarEditCat = document.getElementById('btn-guardar-edicion-categoria');

  //Filtro subcategorías
  const filtroSubcatCat = document.getElementById('filtro-subcat-categoria');

  //Formulario inline Subcategorías
  const inputSubcatCat = document.getElementById('input-subcat-categoria');
  const inputSubcatNombre = document.getElementById('input-subcat-nombre');
  const inputSubcatDescripcion = document.getElementById('input-subcat-descripcion');
  const inputSubcatActivo = document.getElementById('input-subcat-activo');
  const btnGuardarSubcat = document.getElementById('btn-guardar-subcategoria');
  const btnCancelarSubcat = document.getElementById('btn-cancelar-subcategoria');
  const formSubcatTitle = document.getElementById('form-subcategoria-title');

  //Modal Editar Subcategoría
  const editSubcatId = document.getElementById('edit-subcat-id');
  const editSubcatCat = document.getElementById('edit-subcat-categoria');
  const editSubcatNombre = document.getElementById('edit-subcat-nombre');
  const editSubcatDescripcion = document.getElementById('edit-subcat-descripcion');
  const editSubcatActivo = document.getElementById('edit-subcat-activo');
  const btnGuardarEditSubcat = document.getElementById('btn-guardar-edicion-subcategoria');

  //Formulario inline Marcas
  const inputMarcaNombre = document.getElementById('input-marca-nombre');
  const inputMarcaPais = document.getElementById('input-marca-pais');
  const inputMarcaActivo = document.getElementById('input-marca-activo');
  const btnGuardarMarca = document.getElementById('btn-guardar-marca');
  const btnCancelarMarca = document.getElementById('btn-cancelar-marca');
  const formMarcaTitle = document.getElementById('card-form-marca')?.querySelector('.card-header h2');

  //Modal Editar Marca
  const editMarcaId = document.getElementById('edit-marca-id');
  const editMarcaNombre = document.getElementById('edit-marca-nombre');
  const editMarcaPais = document.getElementById('edit-marca-pais');
  const editMarcaActivo = document.getElementById('edit-marca-activo');
  const btnGuardarEditMarca = document.getElementById('btn-guardar-edicion-marca');

  //Formulario inline Unidades
  const inputUnidadNombre = document.getElementById('input-unidad-nombre');
  const inputUnidadAbrev = document.getElementById('input-unidad-abrev');
  const btnGuardarUnidad = document.getElementById('btn-guardar-unidad');
  const btnCancelarUnidad = document.getElementById('btn-cancelar-unidad');

  //Modal Editar Unidad
  const editUnidadId = document.getElementById('edit-unidad-id');
  const editUnidadNombre = document.getElementById('edit-unidad-nombre');
  const editUnidadAbrev = document.getElementById('edit-unidad-abrev');
  const btnGuardarEditUnidad = document.getElementById('btn-guardar-edicion-unidad');


  // ESTADO LOCAL
  let productosCache = [];
  let categoriasCache = [];
  let subcategoriasCache = [];
  let marcasCache = [];
  let unidadesCache = [];
  let modoEditCat = false;
  let modoEditSubcat = false;
  let modoEditMarca = false;
  let modoEditUnidad = false;


  //IMAGEN PREVIEW - Modal Nuevo Producto
  (function initImagePreview() {
    const input = document.getElementById('np-imagen-input');
    const preview = document.getElementById('np-imagen-preview');
    const wrapper = document.getElementById('np-imagen-preview-wrapper');
    const filename = document.getElementById('np-imagen-filename');
    const btnQuitar = document.getElementById('btn-np-quitar-imagen');
    if (!input || !preview) return;

    const MAX_BYTES = 2 * 1024 * 1024;

    input.addEventListener('change', function () {
      const file = this.files[0];
      if (!file) return;
      if (file.size > MAX_BYTES) {
        showToast('La imagen supera los 2 MB permitidos.', 'error');
        this.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = e => {
        preview.src = e.target.result;
        wrapper?.classList.remove('d-none');
        btnQuitar?.classList.remove('d-none');
        if (filename) filename.textContent = file.name;
      };
      reader.readAsDataURL(file);
    });

    btnQuitar?.addEventListener('click', () => {
      input.value = '';
      preview.src = '';
      wrapper?.classList.add('d-none');
      btnQuitar.classList.add('d-none');
      if (filename) filename.textContent = 'Ningún archivo seleccionado';
    });
  })();


  //CARGA INICIAL
  cargarCategorias();
  cargarMarcas();
  cargarUnidades();
  cargarProductos();


  //PRODUCTOS
  async function cargarProductos(params = {}) {
    try {
      const qs = new URLSearchParams(params).toString();
      const url = `/api/productos${qs ? '?' + qs : ''}`;
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.mensaje || 'Error al cargar productos');

      productosCache = data.productos;
      renderTablaProductos(productosCache);
    } catch (err) {
      console.error(err);
      showToast('Error al cargar productos', 'error');
    }
  }

  function renderTablaProductos(productos) {
    totalBadge.textContent = `${productos.length} producto${productos.length !== 1 ? 's' : ''}`;

    // Limpiar filas dinámicas previas (preservar el emptyRow)
    Array.from(tbodyProductos.querySelectorAll('tr:not(#productos-empty-row)')).forEach(tr => tr.remove());

    if (!productos.length) {
      emptyRow?.classList.remove('d-none');
      emptyRow.innerHTML = `<td colspan="11" class="text-center text-muted py-3">Sin resultados</td>`;
      return;
    }
    emptyRow?.classList.add('d-none');

    const fragment = document.createDocumentFragment();
    productos.forEach(p => {
      const tr = document.createElement('tr');
      tr.id = `producto-row-${p.id_producto}`;
      if (p.stock_critico) tr.classList.add('table-danger');

      tr.innerHTML = `
                <td class="font-monospace small">${p.codigo}</td>
                <td>
                    <span class="fw-semibold">${p.nombre}</span>
                    ${p.stock_critico ? '<br><span class="badge text-bg-danger">Stock crítico</span>' : ''}
                </td>
                <td class="small">${p.subcategoria}<br><span class="text-muted">${p.categoria}</span></td>
                <td class="small">${p.marca ?? '—'}</td>
                <td class="small">${p.unidad}</td>
                <td class="small">${formatMoney(p.precio_compra)}</td>
                <td class="small fw-semibold">${formatMoney(p.precio_venta)}</td>
                <td class="small">${p.stock_actual} <span class="text-muted">/ mín ${p.stock_minimo}</span></td>
                <td>${getBadge(p.activo ? 'activo' : 'inactivo')}</td>
                <td class="small text-muted">${formatDate(p.creado_en)}</td>
                <td>
                    <div class="d-flex gap-1 justify-content-end">
                        <button type="button" class="btn btn-sm"
                            data-accion="ver-producto" data-id="${p.id_producto}"
                            data-bs-toggle="modal" data-bs-target="#modal-ficha-producto"
                            aria-label="Ver ficha de ${p.nombre}">
                            <i class="fa-regular fa-eye" aria-hidden="true"></i>
                        </button>
                        <button type="button" class="btn btn-sm"
                            data-accion="editar-producto" data-id="${p.id_producto}"
                            data-bs-toggle="modal" data-bs-target="#modal-editar-producto"
                            aria-label="Editar ${p.nombre}">
                            <i class="fa-regular fa-pen-to-square" aria-hidden="true"></i>
                        </button>
                        <button type="button" class="btn btn-sm text-danger"
                            data-accion="desactivar-producto" data-id="${p.id_producto}" data-nombre="${p.nombre}"
                            aria-label="Desactivar ${p.nombre}">
                            <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
                        </button>
                    </div>
                </td>`;
      fragment.appendChild(tr);
    });
    tbodyProductos.appendChild(fragment);
  }

  // Delegación de eventos — tabla productos
  tbodyProductos.addEventListener('click', e => {
    const btn = e.target.closest('[data-accion]');
    if (!btn) return;
    const accion = btn.dataset.accion;
    const id = btn.dataset.id;

    if (accion === 'ver-producto') abrirFichaProducto(id);
    if (accion === 'editar-producto') abrirEditarProducto(id);
    if (accion === 'desactivar-producto') confirmarDesactivar(id, btn.dataset.nombre);
  });

  // Filtros
  btnFiltrar?.addEventListener('click', () => {
    const params = {};
    const nombre = filtroNombre?.value.trim();
    const cat = filtroCategoria?.value;
    const subcat = filtroSubcat?.value;
    const marca = filtroMarca?.value;
    const estado = filtroEstado?.value;
    const desde = filtroFechaDesde?.value;
    const hasta = filtroFechaHasta?.value;

    if (nombre) params.nombre = nombre;
    if (cat) params.categoria = cat;
    if (subcat) params.subcategoria = subcat;
    if (marca) params.marca = marca;
    if (estado) params.activo = estado;
    if (desde) params.fecha_desde = desde;
    if (hasta) params.fecha_hasta = hasta;

    cargarProductos(params);
  });

  btnLimpiar?.addEventListener('click', () => {
    if (filtroNombre) filtroNombre.value = '';
    if (filtroCategoria) filtroCategoria.value = '';
    if (filtroSubcat) filtroSubcat.value = '';
    if (filtroMarca) filtroMarca.value = '';
    if (filtroEstado) filtroEstado.value = '';
    if (filtroFechaDesde) filtroFechaDesde.value = '';
    if (filtroFechaHasta) filtroFechaHasta.value = '';
    cargarProductos();
  });

  // Cascada Categoría → Subcategoría en filtros
  filtroCategoria?.addEventListener('change', () => {
    const catId = filtroCategoria.value;
    const subs = catId ? subcategoriasCache.filter(s => s.id_categoria == catId) : subcategoriasCache;
    const opts = subs.map(s => `<option value="${s.id_subcategoria}">${s.nombre}</option>`).join('');
    filtroSubcat.innerHTML = `<option value="">Todas las subcategorías</option>${opts}`;
  });


  //FICHA DE PRODUCTO
  async function abrirFichaProducto(id) {
    // Limpiar ficha
    ['ficha-codigo', 'ficha-nombre', 'ficha-descripcion', 'ficha-categoria',
      'ficha-subcategoria', 'ficha-marca', 'ficha-unidad', 'ficha-ubicacion',
      'ficha-precio-compra', 'ficha-precio-venta', 'ficha-margen',
      'ficha-stock-actual', 'ficha-stock-minimo', 'ficha-stock-maximo',
      'ficha-estado'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '—';
      });
    const galeria = document.getElementById('ficha-galeria');
    const tbodyKardex = document.getElementById('tabla-ficha-kardex-body');
    if (galeria) galeria.innerHTML = '';
    if (tbodyKardex) tbodyKardex.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-2">Cargando…</td></tr>';

    try {
      const res = await fetch(`/api/productos/${id}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Error al cargar ficha');

      const p = data.producto;

      document.getElementById('ficha-codigo').textContent = p.codigo;
      document.getElementById('ficha-nombre').textContent = p.nombre;
      document.getElementById('ficha-descripcion').textContent = p.descripcion || '—';
      document.getElementById('ficha-categoria').textContent = p.categoria;
      document.getElementById('ficha-subcategoria').textContent = p.subcategoria;
      document.getElementById('ficha-marca').textContent = p.marca || '—';
      document.getElementById('ficha-unidad').textContent = p.unidad;
      document.getElementById('ficha-ubicacion').textContent = p.ubicacion;
      document.getElementById('ficha-precio-compra').textContent = formatMoney(p.precio_compra);
      document.getElementById('ficha-precio-venta').textContent = formatMoney(p.precio_venta);
      document.getElementById('ficha-stock-actual').textContent = p.stock_actual;
      document.getElementById('ficha-stock-minimo').textContent = p.stock_minimo;
      document.getElementById('ficha-stock-maximo').textContent = p.stock_maximo ?? '—';

      const estadoEl = document.getElementById('ficha-estado');
      if (estadoEl) estadoEl.innerHTML = getBadge(p.activo ? 'activo' : 'inactivo');

      const margenEl = document.getElementById('ficha-margen');
      if (margenEl && p.precio_compra > 0) {
        const margen = ((p.precio_venta - p.precio_compra) / p.precio_compra * 100).toFixed(1);
        margenEl.textContent = `${margen}%`;
        margenEl.className = 'fw-semibold mb-0 ' + (margen >= 0 ? 'text-success' : 'text-danger');
      }

      // Botón editar dentro del modal ficha
      const btnEditarFicha = fichaModal?.querySelector('[data-bs-target="#modal-editar-producto"]');
      if (btnEditarFicha) btnEditarFicha.dataset.id = p.id_producto;

      // Imagen del producto 
      if (galeria) {
        const imagen = data.imagenes[0];
        galeria.innerHTML = '';
        if (!imagen) {
          galeria.classList.add('border', 'rounded');
          galeria.innerHTML = '<i class="fa-regular fa-image fa-3x text-muted" aria-hidden="true"></i>';
        } else {
          galeria.classList.remove('border', 'rounded');
          const imgEl = document.createElement('img');
          imgEl.src = imagen.url_img;
          imgEl.alt = p.nombre;
          imgEl.className = 'rounded';
          imgEl.style.cssText = `
                max-width: 88%;
                max-height: 320px;
                width: auto;
                height: auto;
                object-fit: contain;
                cursor: pointer;
            `;
          imgEl.addEventListener('click', () => window.open(imagen.url_img, '_blank'));
          galeria.appendChild(imgEl);
        }
      }

      // Kardex
      if (tbodyKardex) {
        if (!data.kardex.length) {
          tbodyKardex.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-2">Sin movimientos</td></tr>';
        } else {
          const kFragment = document.createDocumentFragment();
          data.kardex.forEach(k => {
            const tr = document.createElement('tr');
            const refTexto = k.referencia_tipo
              ? `${k.referencia_tipo.charAt(0).toUpperCase() + k.referencia_tipo.slice(1)} #${k.referencia_id ?? '—'}`
              : '—';
            tr.innerHTML = `
                            <td>${getBadge(k.tipo_movimiento)}</td>
                            <td class="small">${k.motivo ?? '—'}</td>
                            <td class="text-end">${k.cantidad}</td>
                            <td class="text-end">${k.stock_anterior}</td>
                            <td class="text-end fw-semibold">${k.stock_posterior}</td>
                            <td class="small">${refTexto}</td>
                            <td class="small">${k.usuario}</td>
                            <td class="small text-nowrap text-muted">${formatDate(k.registrado_en, true)}</td>`;
            kFragment.appendChild(tr);
          });
          tbodyKardex.innerHTML = '';
          tbodyKardex.appendChild(kFragment);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Error al cargar la ficha del producto', 'error');
    }
  }

  // Delegación para btn editar dentro del modal ficha
  fichaModal?.addEventListener('click', e => {
    const btn = e.target.closest('[data-bs-target="#modal-editar-producto"]');
    if (btn?.dataset.id) abrirEditarProducto(btn.dataset.id);
  });


  //EDITAR PRODUCTO 
  async function abrirEditarProducto(id) {
    const producto = productosCache.find(p => String(p.id_producto) === String(id));
    if (!producto) return;

    editId.value = producto.id_producto;
    editNombre.value = producto.nombre;
    editPrecioCompra.value = producto.precio_compra;
    editPrecioVenta.value = producto.precio_venta;
    editStockMin.value = producto.stock_minimo;
    editStockMax.value = producto.stock_maximo ?? '';
    editUbicacion.value = producto.ubicacion;
    editActivo.checked = !!producto.activo;

    // Poblar select subcategorías y preseleccionar
    const opts = subcategoriasCache.map(s =>
      `<option value="${s.id_subcategoria}" ${s.id_subcategoria == producto.id_subcategoria ? 'selected' : ''}>${s.nombre}</option>`
    ).join('');
    editSubcat.innerHTML = opts || '<option value="">Sin subcategorías</option>';

    // tiene_lote, descripcion, id_marca e id_unidad no vienen en el cache de
    // la tabla, así que pedimos la ficha completa
    let tieneLote = false;
    let idMarca = '';
    let idUnidad = '';
    let descripcion = '';
    try {
      const res = await fetch(`/api/productos/${id}`, { credentials: 'include' });
      const data = await res.json();
      if (data.ok) {
        tieneLote = !!data.producto.tiene_lote;
        idMarca = data.producto.id_marca ?? '';
        idUnidad = data.producto.id_unidad ?? '';
        descripcion = data.producto.descripcion ?? '';
      }
    } catch (_) { /* silencioso */ }
    editLotes.checked = tieneLote;
    document.getElementById('edit-p-descripcion').value = descripcion;

    const optsMarca = marcasCache.map(m =>
      `<option value="${m.id_marca}" ${m.id_marca == idMarca ? 'selected' : ''}>${m.nombre}</option>`
    ).join('');
    document.getElementById('edit-p-marca').innerHTML = `<option value="">Sin marca</option>${optsMarca}`;

    const optsUnidad = unidadesCache.map(u =>
      `<option value="${u.id_unidad}" ${u.id_unidad == idUnidad ? 'selected' : ''}>${u.abreviatura} - ${u.nombre}</option>`
    ).join('');
    document.getElementById('edit-p-unidad').innerHTML = optsUnidad;

    // Limpiar selección de archivo de imagen de una edición anterior
    const inputImg = document.getElementById('edit-p-imagen-input');
    if (inputImg) inputImg.value = '';
  }

  btnGuardarEdicion?.addEventListener('click', async () => {
    const id = editId?.value;
    if (!id) return;

    const formData = new FormData();
    formData.append('nombre', editNombre.value.trim());
    formData.append('id_subcategoria', editSubcat.value);
    formData.append('id_marca', document.getElementById('edit-p-marca').value || '');
    formData.append('id_unidad', document.getElementById('edit-p-unidad').value);
    formData.append('descripcion', document.getElementById('edit-p-descripcion').value.trim());
    formData.append('precio_compra', editPrecioCompra.value);
    formData.append('precio_venta', editPrecioVenta.value);
    formData.append('stock_minimo', editStockMin.value);
    formData.append('stock_maximo', editStockMax.value);
    formData.append('ubicacion', editUbicacion.value.trim());
    formData.append('tiene_lote', editLotes.checked ? 1 : 0);
    formData.append('activo', editActivo.checked ? 1 : 0);

    const inputImg = document.getElementById('edit-p-imagen-input');
    if (inputImg?.files[0]) {
      formData.append('imagen_principal', inputImg.files[0]);
    }

    try {
      const res = await fetch(`/api/productos/${id}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData, // sin Content-Type: el navegador pone el boundary multipart
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.mensaje || 'Error al editar');

      showToast('Producto actualizado correctamente', 'success');
      bootstrap.Modal.getInstance(document.getElementById('modal-editar-producto'))?.hide();
      cargarProductos();
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    }
  });


  btnGuardarEdicion?.addEventListener('click', async () => {
    const id = editId?.value;
    if (!id) return;

    const body = {
      nombre: editNombre.value.trim(),
      id_subcategoria: editSubcat.value,
      precio_compra: editPrecioCompra.value,
      precio_venta: editPrecioVenta.value,
      stock_minimo: editStockMin.value,
      stock_maximo: editStockMax.value,
      ubicacion: editUbicacion.value.trim(),
      tiene_lote: editLotes.checked ? 1 : 0,
      activo: editActivo.checked ? 1 : 0,
    };

    try {
      const res = await fetch(`/api/productos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.mensaje || 'Error al editar');

      showToast('Producto actualizado correctamente', 'success');
      bootstrap.Modal.getInstance(document.getElementById('modal-editar-producto'))?.hide();
      cargarProductos();
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    }
  });


  //DESACTIVAR PRODUCTO
  function confirmarDesactivar(id, nombre) {
    confirmAction(`¿Desactivar el producto "${nombre}"?`, async () => {
      try {
        const res = await fetch(`/api/productos/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.mensaje || 'Error al desactivar');

        showToast('Producto desactivado', 'warning');
        cargarProductos();
      } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
      }
    });
  }


  //NUEVO PRODUCTO — wizard 2 pasos
  btnNpSiguiente?.addEventListener('click', () => {
    if (!npCodigo.value.trim() || !npNombre.value.trim() ||
      !npSubcategoria.value || !npUnidad.value || !npUbicacion.value.trim()) {
      showToast('Complete todos los campos obligatorios del paso 1', 'warning');
      return;
    }
    if (!npImagenInput?.files[0]) {
      showToast('La imagen del producto es obligatoria', 'warning');
      return;
    }
    stepOne.classList.add('d-none');
    stepTwo.classList.remove('d-none');
  });

  btnNpAnterior?.addEventListener('click', () => {
    stepTwo.classList.add('d-none');
    stepOne.classList.remove('d-none');
  });

  btnNpGuardar?.addEventListener('click', async () => {
    if (!npPrecioCompra.value || !npPrecioVenta.value ||
      npStockMin.value === '') {
      showToast('Complete todos los campos obligatorios del paso 2', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('codigo', npCodigo.value.trim());
    formData.append('nombre', npNombre.value.trim());
    formData.append('descripcion', npDescripcion.value.trim());
    formData.append('id_subcategoria', npSubcategoria.value);
    formData.append('id_marca', npMarca.value || '');
    formData.append('id_unidad', npUnidad.value);
    formData.append('ubicacion', npUbicacion.value.trim());
    formData.append('precio_compra', npPrecioCompra.value);
    formData.append('precio_venta', npPrecioVenta.value);
    formData.append('stock_minimo', npStockMin.value);
    formData.append('stock_maximo', npStockMax.value || '');
    formData.append('tiene_lote', npLotes.checked ? 1 : 0);
    formData.append('imagen_principal', npImagenInput.files[0]);

    try {
      const res = await fetch('/api/productos', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.mensaje || 'Error al crear producto');

      showToast('Producto registrado correctamente', 'success');
      bootstrap.Modal.getInstance(document.getElementById('modal-nuevo-producto'))?.hide();
      resetNuevoProducto();
      cargarProductos();
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    }
  });

  // Reset modal nuevo producto al cerrar
  document.getElementById('modal-nuevo-producto')?.addEventListener('hidden.bs.modal', resetNuevoProducto);

  function resetNuevoProducto() {
    [npCodigo, npNombre, npDescripcion, npUbicacion,
      npPrecioCompra, npPrecioVenta, npStockMin, npStockMax].forEach(el => {
        if (el) el.value = '';
      });
    if (npLotes) npLotes.checked = false;
    if (npImagenInput) npImagenInput.value = '';
    document.getElementById('np-imagen-preview-wrapper')?.classList.add('d-none');
    document.getElementById('btn-np-quitar-imagen')?.classList.add('d-none');
    const fn = document.getElementById('np-imagen-filename');
    if (fn) fn.textContent = 'Ningún archivo seleccionado';
    // Volver al step 1
    stepTwo?.classList.add('d-none');
    stepOne?.classList.remove('d-none');
  }

  // Cascada Categoría → Subcategoría en modal nuevo producto
  npCategoria?.addEventListener('change', () => {
    const catId = npCategoria.value;
    const subs = catId ? subcategoriasCache.filter(s => s.id_categoria == catId) : [];
    const opts = subs.map(s => `<option value="${s.id_subcategoria}">${s.nombre}</option>`).join('');
    npSubcategoria.innerHTML = `<option value="" disabled selected>Seleccionar subcategoría</option>${opts}`;
  });


  //CATEGORÍAS
  async function cargarCategorias() {
    try {
      const res = await fetch('/api/categorias/cat', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.mensaje || 'Error al cargar categorías');

      categoriasCache = data.categorias;
      poblarSelectsCategorias(categoriasCache);

      // Esperar subcategorías antes de renderizar para que el conteo sea correcto
      await cargarSubcategorias();

      // Ahora sí renderizar con subcategoriasCache ya lleno
      renderTablaCategorias(categoriasCache);
    } catch (err) {
      console.error(err);
      showToast('Error al cargar categorías', 'error');
    }
  }

  function renderTablaCategorias(categorias) {
    if (!tbodyCategorias) return;
    if (!categorias.length) {
      tbodyCategorias.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">Sin categorías</td></tr>`;
      return;
    }
    const fragment = document.createDocumentFragment();
    categorias.forEach((c, i) => {
      const subcuenta = subcategoriasCache.filter(s => Number(s.id_categoria) === Number(c.id_categoria)).length;
      const tr = document.createElement('tr');
      tr.id = `cat-row-${c.id_categoria}`;
      tr.innerHTML = `
            <td class="text-muted small">${i + 1}</td>
            <td class="fw-semibold">${c.nombre}</td>
            <td><span class="fw-semibold">${subcuenta}</span></td>
            <td>${getBadge(c.activo ? 'activo' : 'inactivo')}</td>
            <td>
                <div class="d-flex gap-1 justify-content-end">
                    <button type="button" class="btn btn-sm"
                        data-accion="editar-cat" data-id="${c.id_categoria}"
                        data-bs-toggle="modal" data-bs-target="#modal-editar-categoria"
                        aria-label="Editar ${c.nombre}">
                        <i class="fa-regular fa-pen-to-square" aria-hidden="true"></i>
                    </button>
                </div>
            </td>`;
      fragment.appendChild(tr);
    });
    tbodyCategorias.innerHTML = '';
    tbodyCategorias.appendChild(fragment);
  }

  function poblarSelectsCategorias(categorias) {
    const opts = categorias.map(c => `<option value="${c.id_categoria}">${c.nombre}</option>`).join('');
    // Filtro de productos
    if (filtroCategoria) filtroCategoria.innerHTML = `<option value="">Todas las categorías</option>${opts}`;
    // Modal nuevo producto
    if (npCategoria) npCategoria.innerHTML = `<option value="" disabled selected>Seleccionar categoría</option>${opts}`;
    // Form inline nuevo subcategoria
    if (inputSubcatCat) inputSubcatCat.innerHTML = `<option value="" disabled selected>Seleccionar categoría</option>${opts}`;
    // Modal editar subcategoría
    if (editSubcatCat) editSubcatCat.innerHTML = `<option value="" disabled selected>Seleccionar categoría</option>${opts}`;
    // Filtro subcategorías tab
    if (filtroSubcatCat) filtroSubcatCat.innerHTML = `<option value="">Todas las categorías</option>${opts}`;
  }

  // Delegación — tabla categorías
  tbodyCategorias?.addEventListener('click', e => {
    const btn = e.target.closest('[data-accion]');
    if (!btn) return;
    const accion = btn.dataset.accion;
    const id = btn.dataset.id;

    if (accion === 'editar-cat') {
      const cat = categoriasCache.find(c => String(c.id_categoria) === String(id));
      if (!cat) return;
      editCatId.value = cat.id_categoria;
      editCatNombre.value = cat.nombre;
      editCatDescripcion.value = cat.descripcion ?? '';
      editCatActivo.checked = !!cat.activo;
    }

    /*if (accion === 'desactivar-cat') { ignorar
      confirmAction(`¿Desactivar la categoría "${btn.dataset.nombre}"?`, async () => {
        try {
          const res = await fetch(`/api/categorias/cat/${id}`, { method: 'DELETE', credentials: 'include' });
          const data = await res.json();
          if (!res.ok || !data.ok) throw new Error(data.mensaje || 'Error');
          showToast('Categoría desactivada', 'warning');
          cargarCategorias();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }*/
  });

  // Guardar nueva categoría (form inline)
  btnGuardarCat?.addEventListener('click', async () => {
    const nombre = inputCatNombre?.value.trim();
    if (!nombre) { showToast('El nombre es obligatorio', 'warning'); return; }

    if (modoEditCat) return; // no aplica en inline (usamos el modal para editar)

    try {
      const res = await fetch('/api/categorias/cat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nombre,
          descripcion: inputCatDescripcion?.value.trim() || null,
          activo: inputCatActivo?.checked ? 1 : 0
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.mensaje || 'Error al crear categoría');
      showToast('Categoría creada', 'success');
      if (inputCatNombre) inputCatNombre.value = '';
      if (inputCatDescripcion) inputCatDescripcion.value = '';
      if (inputCatActivo) inputCatActivo.checked = true;
      cargarCategorias();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  btnCancelarCat?.addEventListener('click', () => {
    if (inputCatNombre) inputCatNombre.value = '';
    if (inputCatDescripcion) inputCatDescripcion.value = '';
    if (inputCatActivo) inputCatActivo.checked = true;
  });

  
  // Guardar edición categoría (modal)
  btnGuardarEditCat?.addEventListener('click', async () => {
    const id = editCatId?.value;
    const nombre = editCatNombre?.value.trim();
    if (!id || !nombre) { showToast('Complete los campos', 'warning'); return; }

    try {
      const res = await fetch(`/api/categorias/cat/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nombre,
          descripcion: editCatDescripcion?.value.trim() || null,
          activo: editCatActivo?.checked ? 1 : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.mensaje || 'Error al editar');
      showToast('Categoría actualizada', 'success');
      bootstrap.Modal.getInstance(document.getElementById('modal-editar-categoria'))?.hide();
      cargarCategorias();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });


  //SUBCATEGORÍAS

  async function cargarSubcategorias() {
    try {
      const res = await fetch('/api/categorias/sub', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.mensaje || 'Error al cargar subcategorías');

      subcategoriasCache = data.subcategorias;
      renderTablaSubcategorias(subcategoriasCache);

    } catch (err) {
      console.error(err);
      showToast('Error al cargar subcategorías', 'error');
    }
  }

  function renderTablaSubcategorias(subcats) {
    if (!tbodySubcategorias) return;
    if (!subcats.length) {
      tbodySubcategorias.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">Sin subcategorías</td></tr>`;
      return;
    }
    const fragment = document.createDocumentFragment();
    subcats.forEach((s, i) => {
      const catNombre = categoriasCache.find(c => Number(c.id_categoria) === Number(s.id_categoria))?.nombre ?? '—';
      const tr = document.createElement('tr');
      tr.id = `subcat-row-${s.id_subcategoria}`;
      tr.innerHTML = `
            <td class="text-muted small">${i + 1}</td>
            <td class="fw-semibold">${s.nombre}</td>
            <td><span class="fw-semibold">${catNombre}</span></td>
            <td>${getBadge(s.activo ? 'activo' : 'inactivo')}</td>
            <td>
                <div class="d-flex gap-1 justify-content-end">
                    <button type="button" class="btn btn-sm"
                        data-accion="editar-subcat" data-id="${s.id_subcategoria}"
                        data-bs-toggle="modal" data-bs-target="#modal-editar-subcategoria"
                        aria-label="Editar ${s.nombre}">
                        <i class="fa-regular fa-pen-to-square" aria-hidden="true"></i>
                    </button>
                    
                </div>
            </td>`;
      fragment.appendChild(tr);
    });
    tbodySubcategorias.innerHTML = '';
    tbodySubcategorias.appendChild(fragment);
  }

  // Filtro rápido subcategorías por categoría
  filtroSubcatCat?.addEventListener('change', () => {
    const catId = filtroSubcatCat.value;
    const filtradas = catId ? subcategoriasCache.filter(s => s.id_categoria == catId) : subcategoriasCache;
    renderTablaSubcategorias(filtradas);
  });

  // Delegación — tabla subcategorías
  tbodySubcategorias?.addEventListener('click', e => {
    const btn = e.target.closest('[data-accion]');
    if (!btn) return;
    const accion = btn.dataset.accion;
    const id = btn.dataset.id;

    if (accion === 'editar-subcat') {
      const s = subcategoriasCache.find(x => String(x.id_subcategoria) === String(id));
      if (!s) return;
      editSubcatId.value = s.id_subcategoria;
      editSubcatNombre.value = s.nombre;
      editSubcatDescripcion.value = s.descripcion ?? '';
      editSubcatActivo.checked = !!s.activo;
      // Preseleccionar categoría
      if (editSubcatCat) editSubcatCat.value = s.id_categoria;
    }

    /*if (accion === 'desactivar-subcat') {
      confirmAction(`¿Desactivar la subcategoría "${btn.dataset.nombre}"?`, async () => {
        try {
          const res = await fetch(`/api/categorias/sub/${id}`, { method: 'DELETE', credentials: 'include' });
          const data = await res.json();
          if (!res.ok || !data.ok) throw new Error(data.mensaje || 'Error');
          showToast('Subcategoría desactivada', 'warning');
          cargarSubcategorias();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }*/
  });

  // Nueva subcategoría (form inline)
  // Nueva subcategoría (form inline)
  btnGuardarSubcat?.addEventListener('click', async () => {
    const nombre = inputSubcatNombre?.value.trim();
    const catId = inputSubcatCat?.value;
    if (!nombre || !catId) { showToast('Complete todos los campos', 'warning'); return; }

    try {
      const res = await fetch('/api/categorias/sub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nombre,
          descripcion: inputSubcatDescripcion?.value.trim() || null,
          id_categoria: catId,
          activo: inputSubcatActivo?.checked ? 1 : 0
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.mensaje || 'Error al crear subcategoría');
      showToast('Subcategoría creada', 'success');
      if (inputSubcatNombre) inputSubcatNombre.value = '';
      if (inputSubcatDescripcion) inputSubcatDescripcion.value = '';
      if (inputSubcatCat) inputSubcatCat.value = '';
      if (inputSubcatActivo) inputSubcatActivo.checked = true;
      cargarSubcategorias();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  btnCancelarSubcat?.addEventListener('click', () => {
    if (inputSubcatNombre) inputSubcatNombre.value = '';
    if (inputSubcatDescripcion) inputSubcatDescripcion.value = '';
    if (inputSubcatCat) inputSubcatCat.value = '';
    if (inputSubcatActivo) inputSubcatActivo.checked = true;
  });

  // Guardar edición subcategoría (modal)
  btnGuardarEditSubcat?.addEventListener('click', async () => {
    const id = editSubcatId?.value;
    const nombre = editSubcatNombre?.value.trim();
    const catId = editSubcatCat?.value;
    if (!id || !nombre || !catId) { showToast('Complete los campos', 'warning'); return; }

    try {
      const res = await fetch(`/api/categorias/sub/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nombre,
          id_categoria: catId,
          descripcion: editSubcatDescripcion?.value.trim() || null,
          activo: editSubcatActivo?.checked ? 1 : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.mensaje || 'Error al editar');
      showToast('Subcategoría actualizada', 'success');
      bootstrap.Modal.getInstance(document.getElementById('modal-editar-subcategoria'))?.hide();
      cargarSubcategorias();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });


  //MARCAS
  async function cargarMarcas() {
    try {
      if (!productosCache.length) await cargarProductos();
      const res = await fetch('/api/catalogo/marcas', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.mensaje || 'Error al cargar marcas');

      marcasCache = data.marcas;
      renderTablaMarcas(marcasCache);
      poblarSelectMarcas(marcasCache);
    } catch (err) {
      console.error(err);
      showToast('Error al cargar marcas', 'error');
    }
  }

  function renderTablaMarcas(marcas) {
    if (!tbodyMarcas) return;
    if (!marcas.length) {
      tbodyMarcas.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">Sin marcas</td></tr>`;
      return;
    }
    const fragment = document.createDocumentFragment();
    marcas.forEach((m, i) => {
      const productosCount = productosCache.filter(p => p.marca === m.nombre).length;
      const tr = document.createElement('tr');
      tr.id = `marca-row-${m.id_marca}`;
      tr.innerHTML = `
            <td class="text-muted small">${i + 1}</td>
            <td class="fw-semibold">${m.nombre}</td>
            <td><span class="fw-semibold">${productosCount}</span></td>
            <td>${getBadge(m.activo ? 'activo' : 'inactivo')}</td>
            <td>
                <div class="d-flex gap-1 justify-content-end">
                    <button type="button" class="btn btn-sm"
                        data-accion="editar-marca" data-id="${m.id_marca}"
                        data-bs-toggle="modal" data-bs-target="#modal-editar-marca"
                        aria-label="Editar ${m.nombre}">
                        <i class="fa-regular fa-pen-to-square" aria-hidden="true"></i>
                    </button>
                    <button type="button" class="btn btn-sm text-danger"
                        data-accion="desactivar-marca" data-id="${m.id_marca}" data-nombre="${m.nombre}"
                        aria-label="Desactivar ${m.nombre}">
                        <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
                    </button>
                </div>
            </td>`;
      fragment.appendChild(tr);
    });
    tbodyMarcas.innerHTML = '';
    tbodyMarcas.appendChild(fragment);
  }

  function poblarSelectMarcas(marcas) {
    const opts = marcas.map(m => `<option value="${m.id_marca}">${m.nombre}</option>`).join('');
    if (filtroMarca) filtroMarca.innerHTML = `<option value="">Todas las marcas</option>${opts}`;
    if (npMarca) npMarca.innerHTML = `<option value="">Sin marca</option>${opts}`;
  }

  tbodyMarcas?.addEventListener('click', e => {
    const btn = e.target.closest('[data-accion]');
    if (!btn) return;
    const accion = btn.dataset.accion;
    const id = btn.dataset.id;

    if (accion === 'editar-marca') {
      const m = marcasCache.find(x => String(x.id_marca) === String(id));
      if (!m) return;
      editMarcaId.value = m.id_marca;
      editMarcaNombre.value = m.nombre;
      editMarcaPais.value = m.pais_origen ?? '';
      editMarcaActivo.checked = !!m.activo;
    }

    if (accion === 'desactivar-marca') {
      confirmAction(`¿Desactivar la marca "${btn.dataset.nombre}"?`, async () => {
        try {
          const res = await fetch(`/api/catalogo/marcas/${id}`, { method: 'DELETE', credentials: 'include' });
          const data = await res.json();
          if (!res.ok || !data.ok) throw new Error(data.mensaje || 'Error');
          showToast('Marca desactivada', 'warning');
          cargarMarcas();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }
  });

  // Nueva marca (form inline)
  btnGuardarMarca?.addEventListener('click', async () => {
    const nombre = inputMarcaNombre?.value.trim();
    if (!nombre) { showToast('El nombre es obligatorio', 'warning'); return; }

    try {
      const res = await fetch('/api/catalogo/marcas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nombre,
          pais_origen: inputMarcaPais?.value.trim() || null,
          activo: inputMarcaActivo?.checked ? 1 : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.mensaje || 'Error al crear marca');
      showToast('Marca creada', 'success');
      if (inputMarcaNombre) inputMarcaNombre.value = '';
      if (inputMarcaPais) inputMarcaPais.value = '';
      if (inputMarcaActivo) inputMarcaActivo.checked = true;
      cargarMarcas();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  btnCancelarMarca?.addEventListener('click', () => {
    if (inputMarcaNombre) inputMarcaNombre.value = '';
    if (inputMarcaPais) inputMarcaPais.value = '';
    if (inputMarcaActivo) inputMarcaActivo.checked = true;
  });

  // Guardar edición marca (modal)
  btnGuardarEditMarca?.addEventListener('click', async () => {
    const id = editMarcaId?.value;
    const nombre = editMarcaNombre?.value.trim();
    if (!id || !nombre) { showToast('Complete los campos', 'warning'); return; }

    try {
      const res = await fetch(`/api/catalogo/marcas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nombre,
          pais_origen: editMarcaPais?.value.trim() || null,
          activo: editMarcaActivo?.checked ? 1 : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.mensaje || 'Error al editar');
      showToast('Marca actualizada', 'success');
      bootstrap.Modal.getInstance(document.getElementById('modal-editar-marca'))?.hide();
      cargarMarcas();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });


  //UNIDADES DE MEDIDA
  async function cargarUnidades() {
    try {
      if (!productosCache.length) await cargarProductos();
      const res = await fetch('/api/catalogo/unidades', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.mensaje || 'Error al cargar unidades');

      unidadesCache = data.unidades;
      renderTablaUnidades(unidadesCache);
      poblarSelectUnidades(unidadesCache);
    } catch (err) {
      console.error(err);
      showToast('Error al cargar unidades', 'error');
    }
  }

  function renderTablaUnidades(unidades) {
    if (!tbodyUnidades) return;
    if (!unidades.length) {
      tbodyUnidades.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">Sin unidades</td></tr>`;
      return;
    }
    const fragment = document.createDocumentFragment();
    unidades.forEach((u, i) => {
      const productosCount = productosCache.filter(p => p.unidad === u.abreviatura).length;
      const tr = document.createElement('tr');
      tr.id = `unidad-row-${u.id_unidad}`;
      tr.innerHTML = `
            <td class="text-muted small">${i + 1}</td>
            <td class="fw-semibold">${u.nombre}</td>
            <td><span class="fw-semibold">${u.abreviatura}</span></td>
            <td><span class="fw-semibold">${productosCount}</span></td>
            <td>
                <div class="d-flex gap-1 justify-content-end">
                    <button type="button" class="btn btn-sm"
                        data-accion="editar-unidad" data-id="${u.id_unidad}"
                        data-bs-toggle="modal" data-bs-target="#modal-editar-unidad"
                        aria-label="Editar ${u.nombre}">
                        <i class="fa-regular fa-pen-to-square" aria-hidden="true"></i>
                    </button>
                    <button type="button" class="btn btn-sm text-danger"
                        data-accion="desactivar-unidad" data-id="${u.id_unidad}" data-nombre="${u.nombre}"
                        aria-label="Desactivar ${u.nombre}">
                        <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
                    </button>
                </div>
            </td>`;
      fragment.appendChild(tr);
    });
    tbodyUnidades.innerHTML = '';
    tbodyUnidades.appendChild(fragment);
  }

  function poblarSelectUnidades(unidades) {
    const opts = unidades.map(u => `<option value="${u.id_unidad}">${u.nombre} (${u.abreviatura})</option>`).join('');
    if (npUnidad) npUnidad.innerHTML = `<option value="" disabled selected>Seleccionar unidad</option>${opts}`;
  }

  tbodyUnidades?.addEventListener('click', e => {
    const btn = e.target.closest('[data-accion]');
    if (!btn) return;
    const accion = btn.dataset.accion;
    const id = btn.dataset.id;

    if (accion === 'editar-unidad') {
      const u = unidadesCache.find(x => String(x.id_unidad) === String(id));
      if (!u) return;
      editUnidadId.value = u.id_unidad;
      editUnidadNombre.value = u.nombre;
      editUnidadAbrev.value = u.abreviatura;
    }

    if (accion === 'desactivar-unidad') {
      confirmAction(`¿Desactivar la unidad "${btn.dataset.nombre}"?`, async () => {
        try {
          const res = await fetch(`/api/catalogo/unidades/${id}`, { method: 'DELETE', credentials: 'include' });
          const data = await res.json();
          if (!res.ok || !data.ok) throw new Error(data.mensaje || 'Error');
          showToast('Unidad desactivada', 'warning');
          cargarUnidades();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }
  });

  // Nueva unidad (form inline)
  btnGuardarUnidad?.addEventListener('click', async () => {
    const nombre = inputUnidadNombre?.value.trim();
    const abrev = inputUnidadAbrev?.value.trim();
    if (!nombre || !abrev) { showToast('Complete todos los campos', 'warning'); return; }

    try {
      const res = await fetch('/api/catalogo/unidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nombre, abreviatura: abrev }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.mensaje || 'Error al crear unidad');
      showToast('Unidad creada', 'success');
      if (inputUnidadNombre) inputUnidadNombre.value = '';
      if (inputUnidadAbrev) inputUnidadAbrev.value = '';
      cargarUnidades();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  btnCancelarUnidad?.addEventListener('click', () => {
    if (inputUnidadNombre) inputUnidadNombre.value = '';
    if (inputUnidadAbrev) inputUnidadAbrev.value = '';
  });

  // Guardar edición unidad (modal)
  btnGuardarEditUnidad?.addEventListener('click', async () => {
    const id = editUnidadId?.value;
    const nombre = editUnidadNombre?.value.trim();
    const abrev = editUnidadAbrev?.value.trim();
    if (!id || !nombre || !abrev) { showToast('Complete los campos', 'warning'); return; }

    try {
      const res = await fetch(`/api/catalogo/unidades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nombre, abreviatura: abrev }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.mensaje || 'Error al editar');
      showToast('Unidad actualizada', 'success');
      bootstrap.Modal.getInstance(document.getElementById('modal-editar-unidad'))?.hide();
      cargarUnidades();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

}); // fin DOMContentLoaded