/*
   global.js — Funciones compartidas de todas las páginas
*/

document.addEventListener('DOMContentLoaded', () => {

  /* ----------------------------------------------------------
     1. SIDEBAR — Toggle colapsar/expandir
  ---------------------------------------------------------- */
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle-btn');
  const appWrapper = document.getElementById('app-wrapper');

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      const collapsed = sidebar.classList.toggle('sidebar-collapsed');
      toggleBtn.setAttribute('aria-expanded', String(!collapsed));
      appWrapper?.classList.toggle('sidebar-collapsed', collapsed);
    });
  }


  /* ----------------------------------------------------------
     2. SIDEBAR — Acordeón (un submenú abierto a la vez)
  ---------------------------------------------------------- */
  document.querySelectorAll('.sidebar-accordion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('aria-controls');
      const target = document.getElementById(targetId);
      if (!target) return;

      const isOpen = target.classList.contains('show');

      // Cerrar todos los submenús abiertos
      document.querySelectorAll('.sidebar-submenu.show').forEach(menu => {
        menu.classList.remove('show');
        const rel = document.querySelector(`[aria-controls="${menu.id}"]`);
        if (rel) {
          rel.setAttribute('aria-expanded', 'false');
          rel.classList.remove('active');
        }
      });

      // Abrir el clickeado si estaba cerrado
      if (!isOpen) {
        target.classList.add('show');
        btn.setAttribute('aria-expanded', 'true');
        btn.classList.add('active');
      }
    });
  });


  /* ----------------------------------------------------------
     3. SIDEBAR — Marcar ítem activo según URL actual
  ---------------------------------------------------------- */
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const currentHash = window.location.hash;

  document.querySelectorAll('.sidebar-nav-link, .sidebar-submenu-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    const linkFile = href.split('/').pop().split('#')[0];
    const linkHash = href.includes('#') ? '#' + href.split('#')[1] : '';

    let isActive = false;
    if (linkHash && currentHash) {
      isActive = linkFile === currentPath && linkHash === currentHash;
    } else {
      isActive = linkFile === currentPath && !linkHash;
    }

    if (isActive) {
      link.classList.add('active');
      const parentSubmenu = link.closest('.sidebar-submenu');
      if (parentSubmenu) {
        parentSubmenu.classList.add('show');
        const parentBtn = document.querySelector(`[aria-controls="${parentSubmenu.id}"]`);
        if (parentBtn) {
          parentBtn.setAttribute('aria-expanded', 'true');
          parentBtn.classList.add('active');
        }
      }
    }
  });


  /* ----------------------------------------------------------
     4. SIDEBAR — Buscador de módulos
  ---------------------------------------------------------- */
  const sidebarSearch = document.getElementById('sidebar-search');

  if (sidebarSearch) {
    sidebarSearch.addEventListener('input', function () {
      const query = this.value.trim().toLowerCase();

      document.querySelectorAll('.sidebar-submenu-link').forEach(link => {
        const text = link.textContent.trim().toLowerCase();
        const li = link.closest('li');
        const submenu = link.closest('.sidebar-submenu');
        const parentBtn = submenu
          ? document.querySelector(`[aria-controls="${submenu.id}"]`)
          : null;

        if (!query) {
          li?.classList.remove('d-none');
          submenu?.classList.remove('show');
          parentBtn?.classList.remove('active');
          parentBtn?.setAttribute('aria-expanded', 'false');
          return;
        }

        const matches = text.includes(query);
        li?.classList.toggle('d-none', !matches);

        if (matches && submenu) {
          submenu.classList.add('show');
          parentBtn?.classList.add('active');
          parentBtn?.setAttribute('aria-expanded', 'true');
        }
      });

      // Ocultar grupos de nav que queden completamente vacíos
      document.querySelectorAll('#sidebar-nav .nav.flex-column').forEach(navGroup => {
        if (!navGroup.closest('.sidebar-submenu')) {
          const visible = navGroup.querySelectorAll('li:not(.d-none)');
          const parentLi = navGroup.closest('li.nav-item');
          parentLi?.classList.toggle('d-none', visible.length === 0);
        }
      });
    });
  }


  /* ----------------------------------------------------------
     5. TOPBAR — Pantalla completa
  ---------------------------------------------------------- */
  const fullscreenBtn = document.getElementById('topbar-fullscreen-btn');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        fullscreenBtn.querySelector('i')?.classList.replace('fa-expand', 'fa-compress');
      } else {
        document.exitFullscreen();
        fullscreenBtn.querySelector('i')?.classList.replace('fa-compress', 'fa-expand');
      }
    });
  }


  /* ----------------------------------------------------------
     6. MODALES — Apilamiento de z-index
  ---------------------------------------------------------- */
  document.addEventListener('show.bs.modal', function (e) {
    const abiertos = document.querySelectorAll('.modal.show');
    if (abiertos.length > 0) {
      const zBase = 1055;
      e.target.style.zIndex = zBase + (abiertos.length * 20);
      setTimeout(() => {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        if (backdrops.length > 1) {
          backdrops[backdrops.length - 1].style.zIndex =
            zBase - 5 + (abiertos.length * 20);
        }
      }, 0);
    }
  });


  /* ----------------------------------------------------------
     7. UTILIDAD — Filas expandibles
  ---------------------------------------------------------- */
  initExpandableRows();


  /* ----------------------------------------------------------
     8. UTILIDAD — Búsquedas de tabla por página
  ---------------------------------------------------------- */
  const tableSearchPairs = [
    ['input-buscar-cliente', 'tabla-clientes'],
    ['input-buscar-proveedor', 'tabla-proveedores'],
    ['input-buscar-comparativa', 'tabla-comparativa'],
    ['input-buscar-orden', 'tabla-ordenes'],
    ['input-buscar-recepcion', 'tabla-recepciones'],
    ['input-buscar-devolucion', 'tabla-devoluciones'],
    ['input-buscar-auditoria', 'tabla-auditoria'],
  ];
  tableSearchPairs.forEach(([inp, tbl]) => initTableSearch(inp, tbl));

}); // fin DOMContentLoaded


/* ----------------------------------------------------------
   UTILIDADES — Declaradas fuera del DOMContentLoaded
   para que los JS de módulo puedan llamarlas libremente
---------------------------------------------------------- */

const BADGE_MAP = {
  activo: { cls: 'text-bg-success', label: 'Activo' },
  inactivo: { cls: 'text-bg-secondary', label: 'Inactivo' },
  bloqueado: { cls: 'text-bg-danger', label: 'Bloqueado' },
  pendiente: { cls: 'text-bg-warning', label: 'Pendiente' },
  pagada: { cls: 'text-bg-success', label: 'Pagada' },
  anulada: { cls: 'text-bg-danger', label: 'Anulada' },
  borrador: { cls: 'text-bg-secondary', label: 'Borrador' },
  enviada: { cls: 'text-bg-primary', label: 'Enviada' },
  recibida: { cls: 'text-bg-success', label: 'Recibida' },
  completada: { cls: 'text-bg-success', label: 'Completada' },
  procesada: { cls: 'text-bg-success', label: 'Procesada' },
  abierta: { cls: 'text-bg-primary', label: 'Abierta' },
  cerrada: { cls: 'text-bg-secondary', label: 'Cerrada' },
  reembolso: { cls: 'text-bg-warning', label: 'Reembolso' },
  cambio: { cls: 'text-bg-info', label: 'Cambio' },
  insert: { cls: 'text-bg-success', label: 'INSERT' },
  update: { cls: 'text-bg-warning', label: 'UPDATE' },
  delete: { cls: 'text-bg-danger', label: 'DELETE' },
};

function getBadge(key, customLabel) {
  const entry = BADGE_MAP[key?.toLowerCase()] ?? { cls: 'text-bg-secondary', label: key ?? '—' };
  return `<span class="badge rounded-pill ${entry.cls}">${customLabel ?? entry.label}</span>`;
}

function formatMoney(amount, symbol = 'S/') {
  if (isNaN(amount)) return `${symbol} 0.00`;
  return `${symbol} ${Number(amount).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr, includeTime = false) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const date = d.toLocaleDateString('es-PE');
  if (!includeTime) return date;
  const time = d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time}`;
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const map = {
    success: 'text-bg-success',
    error: 'text-bg-danger',
    warning: 'text-bg-warning',
    info: 'text-bg-primary',
  };

  const el = document.createElement('div');
  el.className = `toast align-items-center ${map[type] ?? 'text-bg-secondary'} border-0`;
  el.setAttribute('role', 'alert');
  el.setAttribute('aria-live', 'assertive');
  el.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto"
        data-bs-dismiss="toast" aria-label="Cerrar"></button>
    </div>`;

  container.appendChild(el);
  const bsToast = new bootstrap.Toast(el, { delay: 3500 });
  bsToast.show();
  el.addEventListener('hidden.bs.toast', () => el.remove());
}

function confirmAction(message, callback) {
  const modal = document.getElementById('modal-confirm');
  const modalMsg = document.getElementById('modal-confirm-message');
  const confirmBtn = document.getElementById('modal-confirm-btn');

  if (!modal || !modalMsg || !confirmBtn) {
    if (window.confirm(message)) callback();
    return;
  }

  modalMsg.textContent = message;
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();

  const handler = () => {
    callback();
    bsModal.hide();
    confirmBtn.removeEventListener('click', handler);
  };
  confirmBtn.addEventListener('click', handler);
}

function initExpandableRows() {
  document.querySelectorAll('[data-expand-trigger]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const detailRow = document.getElementById(
        trigger.getAttribute('data-expand-trigger')
      );
      if (!detailRow) return;

      const isOpen = detailRow.classList.toggle('show');
      const icon = trigger.querySelector('[data-expand-icon]');
      if (icon) {
        icon.classList.toggle('fa-chevron-down', !isOpen);
        icon.classList.toggle('fa-chevron-up', isOpen);
      }
      trigger.closest('tr')?.classList.toggle('table-active', isOpen);
    });
  });
}


function initTableSearch(inputId, tableId) {
  const input = document.getElementById(inputId);
  const table = document.getElementById(tableId);
  if (!input || !table) return;

  input.addEventListener('input', function () {
    const query = this.value.trim().toLowerCase();
    table.querySelectorAll('tbody tr:not(.detail-row)').forEach(row => {
      const matches = !query || row.textContent.toLowerCase().includes(query);
      row.classList.toggle('d-none', !matches);

      const detailId = row
        .querySelector('[data-expand-trigger]')
        ?.getAttribute('data-expand-trigger');
      if (detailId) {
        document.getElementById(detailId)?.classList.toggle('d-none', !matches);
      }
    });
  });
}


/* 
   USUARIO AUTENTICADO — Nombre real en topbar y sidebar
   Endpoint: GET /api/auth/me
   Response: { ok, usuario: { id, username, rol, nombre } }
    */

async function cargarUsuarioActual() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/login';
      }
      return;
    }
    const data = await res.json();
    if (!data.ok || !data.usuario) return;

    const { nombre, rol, username } = data.usuario;
    const nombreMostrar = nombre || username;

    // Topbar: nombre en el botón
    const btnUser = document.getElementById('topbar-user-btn');
    if (btnUser) {
      const spanNombre = btnUser.querySelector('span.fw-semibold');
      if (spanNombre) spanNombre.textContent = nombreMostrar;
    }

    // Topbar: dropdown header (nombre + rol)
    const menuUser = document.querySelector('#topbar-user-menu .dropdown-header');
    if (menuUser) {
      const ps = menuUser.querySelectorAll('p');
      if (ps[0]) ps[0].textContent = nombreMostrar;
      if (ps[1]) ps[1].textContent = rol || '';
    }

    // Sidebar footer: nombre y rol
    const elSidebarNombre = document.getElementById('sidebar-user-name');
    const elSidebarRol = document.getElementById('sidebar-user-role');
    if (elSidebarNombre) elSidebarNombre.textContent = nombreMostrar;
    if (elSidebarRol) elSidebarRol.textContent = rol || '';

    // Guardar en memoria para que otros módulos lo usen
    window._usuarioActual = data.usuario;

    // Si cambió el usuario respecto a la sesión anterior, limpiar la caja guardada
    const ultimoUsuario = sessionStorage.getItem('ultimo_usuario_id');
    if (ultimoUsuario && ultimoUsuario !== String(data.usuario.id)) {
      limpiarCajaTrabajo();
    }
    sessionStorage.setItem('ultimo_usuario_id', String(data.usuario.id));

  } catch (err) {
    console.warn('cargarUsuarioActual:', err.message);
  }
}


async function cargarNotificaciones() {
  try {
    const res = await fetch('/api/reportes/dashboard/alertas', { credentials: 'include' });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.ok) return;

    const { stock_bajo, sin_stock, ordenes_pendientes } = data.alertas;

    const items = []; // { icono, claseIcono, texto, href }

    //Sin stock (prioridad máxima, rojo) 
    if (sin_stock.length > 0) {
      if (sin_stock.length <= 3) {
        // Mostrar cada producto individualmente
        sin_stock.forEach(p => {
          items.push({
            icono: 'fa-circle-xmark',
            claseIcono: 'text-danger',
            texto: `<strong>${p.nombre}</strong> — sin stock`,
            href: '/public/pages/inventario.html',
          });
        });
      } else {
        // Agrupar si son muchos
        items.push({
          icono: 'fa-circle-xmark',
          claseIcono: 'text-danger',
          texto: `<strong>${sin_stock.length} productos</strong> sin stock`,
          href: '/public/pages/inventario.html',
        });
      }
    }

    //Stock bajo (amarillo) 
    if (stock_bajo.length > 0) {
      if (stock_bajo.length <= 3) {
        stock_bajo.forEach(p => {
          items.push({
            icono: 'fa-triangle-exclamation',
            claseIcono: 'text-warning',
            texto: `<strong>${p.nombre}</strong> — stock bajo (${p.stock_actual}/${p.stock_minimo})`,
            href: '/public/pages/inventario.html',
          });
        });
      } else {
        items.push({
          icono: 'fa-triangle-exclamation',
          claseIcono: 'text-warning',
          texto: `<strong>${stock_bajo.length} productos</strong> con stock bajo`,
          href: '/public/pages/reportes.html',
        });
      }
    }

    //Órdenes de compra pendientes (azul) 
    if (ordenes_pendientes.length > 0) {
      if (ordenes_pendientes.length <= 2) {
        ordenes_pendientes.forEach(o => {
          items.push({
            icono: 'fa-circle-info',
            claseIcono: 'text-info',
            texto: `Orden <strong>#${o.numero_orden}</strong> de ${o.proveedor} pendiente de llegada`,
            href: '/public/pages/compras.html',
          });
        });
      } else {
        items.push({
          icono: 'fa-circle-info',
          claseIcono: 'text-info',
          texto: `<strong>${ordenes_pendientes.length} órdenes</strong> pendientes de recibir`,
          href: '/public/pages/compras.html',
        });
      }
    }

    //Renderizar badge con total ─
    const badge = document.querySelector('#topbar-notifications .topbar-badge');
    if (badge) {
      if (items.length > 0) {
        badge.textContent = items.length > 99 ? '99+' : items.length;
        badge.style.display = '';
      } else {
        badge.style.display = 'none';
      }
    }

    //Renderizar lista del dropdown 
    const menu = document.getElementById('topbar-notifications-menu');
    if (!menu) return;

    // Reconstruir el menú desde cero
    menu.innerHTML = '';

    // Header
    const liHeader = document.createElement('li');
    liHeader.innerHTML = `<h6 class="dropdown-header">Notificaciones</h6>`;
    menu.appendChild(liHeader);

    if (items.length === 0) {
      const liVacio = document.createElement('li');
      liVacio.innerHTML = `
                <span class="dropdown-item text-muted small d-flex align-items-center gap-2 py-2">
                    <i class="fa-solid fa-check-circle text-success" aria-hidden="true"></i>
                    Todo en orden
                </span>`;
      menu.appendChild(liVacio);
    } else {
      // Mostrar máximo 6 ítems en el dropdown para no saturarlo
      const visibles = items.slice(0, 6);
      visibles.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
                    <a class="dropdown-item d-flex align-items-start gap-2 py-2" href="${item.href}">
                        <i class="fa-solid ${item.icono} ${item.claseIcono} mt-1 flex-shrink-0" aria-hidden="true"></i>
                        <span class="small">${item.texto}</span>
                    </a>`;
        menu.appendChild(li);
      });

      // Si hay más de 6, mostrar cuántas quedan
      if (items.length > 6) {
        const liExtra = document.createElement('li');
        liExtra.innerHTML = `
                    <span class="dropdown-item text-muted small py-1 text-center">
                        …y ${items.length - 6} más
                    </span>`;
        menu.appendChild(liExtra);
      }
    }

    // Divider + "Ver todas"
    menu.innerHTML += `
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-center small" href="/public/pages/reportes.html">Ver todas</a></li>`;

  } catch (err) {
    console.warn('cargarNotificaciones:', err.message);
  }
}

async function cerrarSesion(e) {
  if (e) e.preventDefault();
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (_) {
    // fallo de red: igual redirigimos
  } finally {
    sessionStorage.clear(); // ← limpia la caja guardada y cualquier otro dato de sesión
    window.location.href = '/login';
  }
}

function inicializarLogout() {

  //1. Dropdown del topbar (el <a id="btn-logout"> que ya existe en el HTML) 
  const btnLogoutTopbar = document.getElementById('btn-logout');
  if (btnLogoutTopbar) {
    btnLogoutTopbar.addEventListener('click', cerrarSesion);
  }

  //2. Sidebar footer — inyectar botón junto al nombre/rol 
  // El sidebar-footer tiene: [avatar] [nombre + rol]
  // Agregamos: [avatar] [nombre + rol] [botón logout]
  const sidebarFooter = document.getElementById('sidebar-footer');
  if (sidebarFooter) {
    // Evitar duplicados si global.js se ejecuta dos veces
    if (!sidebarFooter.querySelector('#btn-logout-sidebar')) {
      const btnSidebar = document.createElement('button');
      btnSidebar.id = 'btn-logout-sidebar';
      btnSidebar.type = 'button';
      btnSidebar.className = 'btn btn-sm btn-outline-danger ms-auto flex-shrink-0 sidebar-nav-text';
      btnSidebar.setAttribute('aria-label', 'Cerrar sesión');
      btnSidebar.title = 'Cerrar sesión';
      btnSidebar.innerHTML = '<i class="fa-solid fa-right-from-bracket fa-fw" aria-hidden="true"></i>';
      btnSidebar.addEventListener('click', cerrarSesion);
      sidebarFooter.appendChild(btnSidebar);
    }
  }
}

//  Caja de trabajo de la sesión (compartida entre Ventas y Devoluciones) 
// El vendedor elige UNA VEZ, al iniciar su turno, con qué caja va a
// trabajar. Se guarda en sessionStorage y se reutiliza en cualquier
// pantalla (Ventas, Devoluciones) sin volver a preguntar, hasta que esa
// caja deje de estar disponible.
const CAJA_TRABAJO_SESSION_KEY = 'caja_trabajo_sesion';

function obtenerCajaTrabajoGuardada() {
  try {
    const raw = sessionStorage.getItem(CAJA_TRABAJO_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function guardarCajaTrabajo(caja) {
  try {
    sessionStorage.setItem(CAJA_TRABAJO_SESSION_KEY, JSON.stringify(caja));
  } catch { /* sessionStorage no disponible, seguimos solo en memoria */ }
}

function limpiarCajaTrabajo() {
  try {
    sessionStorage.removeItem(CAJA_TRABAJO_SESSION_KEY);
  } catch { /* noopp */ }
}

// Muestra el modal de selección de caja (debe existir #modal-elegir-caja-venta
// y #lista-cajas-elegir en la página actual) y resuelve con la caja elegida.
function mostrarModalSeleccionCaja(cajasAbiertas) {
  return new Promise((resolve) => {
    const modalEl = document.getElementById('modal-elegir-caja-venta');
    const listaEl = document.getElementById('lista-cajas-elegir');
    if (!modalEl || !listaEl) {
      resolve(cajasAbiertas[0] || null);
      return;
    }

    listaEl.innerHTML = cajasAbiertas.map(c => `
      <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
        data-id-caja="${c.id_caja}">
        <span>
          <strong>Caja #${c.id_caja}</strong> — ${c.cajero_nombre}
          <br><span class="text-muted small">${c.turno_nombre || 'Sin turno asignado'}</span>
        </span>
        <i class="fa-solid fa-chevron-right text-muted" aria-hidden="true"></i>
      </button>
    `).join('');

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl, { backdrop: 'static', keyboard: false });

    const onClick = (e) => {
      const btn = e.target.closest('[data-id-caja]');
      if (!btn) return;
      const idCaja = parseInt(btn.dataset.idCaja);
      const caja = cajasAbiertas.find(c => c.id_caja === idCaja);
      listaEl.removeEventListener('click', onClick);
      modal.hide();
      resolve(caja || null);
    };

    listaEl.addEventListener('click', onClick);
    modal.show();
  });
}

// Punto de entrada: asegura que haya una caja de trabajo válida para esta
// sesión, preguntando al vendedor solo si hace falta. Devuelve la caja
// elegida (objeto) o null si no hay ninguna caja abierta en el sistema.
// DESPUÉS
async function asegurarCajaDeTrabajo() {
  let data;
  try {
    data = await apiFetch('/api/caja/abiertas');
  } catch {
    showToast('No se pudo verificar las cajas abiertas.', 'error');
    return null;
  }

  const cajasAbiertas = data.cajas || [];

  // Limpiar siempre la caja guardada si ya no aparece entre las abiertas
  const cajaGuardada = obtenerCajaTrabajoGuardada();
  const sigueValida = cajaGuardada && cajasAbiertas.some(c => c.id_caja === cajaGuardada.id_caja);
  if (cajaGuardada && !sigueValida) {
    limpiarCajaTrabajo();
  }

  if (cajasAbiertas.length === 0) {
    showToast('No hay ninguna caja abierta. Un cajero debe abrir su caja antes de continuar.', 'warning');
    return null;
  }

  if (sigueValida) {
    return cajaGuardada;
  }

  // Solo llega aquí si hay cajas abiertas pero ninguna guardada (o la guardada se cerró)
  const elegida = await mostrarModalSeleccionCaja(cajasAbiertas);
  if (elegida) {
    guardarCajaTrabajo(elegida);
  }
  return elegida;
}

//  Sidebar dinámico según permisos del usuario 
const SIDEBAR_SUFIJO_A_RUTA = {
  empleados: '/empleados',
  usuarios: '/usuarios',
  clientes: '/clientes',
  productos: '/productos',
  proveedores: '/proveedores',
  inventario: '/inventario',
  compras: '/compras',
  ventas: '/ventas',
  caja: '/caja',
  devoluciones: '/devoluciones',
  reportes: '/reportes',
  config: '/configuracion-auditoria',
};

async function aplicarSidebarSegunPermisos() {
  let data;
  try {
    const res = await fetch('/api/auth/mis-permisos', {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    data = await res.json();
    if (!data.ok) return;
  } catch {
    // Si falla la consulta de permisos, no ocultamos nada por seguridad
    // visual (el backend de todas formas bloquea las rutas reales).
    return;
  }

  if (data.esAdmin) return; // Administrador ve todo, no se oculta nada

  const rutasPermitidas = new Set((data.modulos || []).map(m => m.ruta));

  document.querySelectorAll('#sidebar-nav button.sidebar-accordion-btn[aria-controls^="sidebar-submenu-"]').forEach(btn => {
    const sufijo = btn.getAttribute('aria-controls').replace('sidebar-submenu-', '');
    const ruta = SIDEBAR_SUFIJO_A_RUTA[sufijo];
    if (!ruta) return; // sufijo desconocido, no tocamos nada por seguridad

    if (!rutasPermitidas.has(ruta)) {
      const li = btn.closest('li.nav-item');
      if (li) li.classList.add('d-none');
    }
  });

  // Si una sección entera (ej. "Análisis", "Sistema") se queda sin ningún
  // ítem visible, ocultamos también su título para que no quede flotando solo.
  document.querySelectorAll('#sidebar-nav p.sidebar-nav-label').forEach(label => {
    const ul = label.nextElementSibling;
    if (!ul || ul.tagName !== 'UL') return;
    const hayVisible = Array.from(ul.children).some(li => !li.classList.contains('d-none'));
    label.classList.toggle('d-none', !hayVisible);
  });
}


document.addEventListener('DOMContentLoaded', () => {
    cargarUsuarioActual();
    cargarNotificaciones();
    inicializarLogout();
    aplicarSidebarSegunPermisos();
});

// Refrescar notificaciones cada 3 minutos automáticamente
setInterval(cargarNotificaciones, 3 * 60 * 1000);