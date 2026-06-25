# Tareas de Ejecución: Reestructuración de Stock y Transferencias

- `[x]` Base de Datos: Crear tabla `productos_almacen` e insertar datos iniciales basados en lotes/productos.
- `[x]` Backend: endpoint `getAlmacenes` y `getAlmacenById` (seleccionar `id_responsable`).
- `[x]` Backend: endpoint `getStock` (leer stock filtrado por almacén, o total).
- `[ ]` Backend: endpoint `ajustarStock` (ajustar en `productos_almacen` y sincronizar en `productos`).
- `[ ]` Backend: endpoint `getTransferencias` (cambiar a `LEFT JOIN` para empleados y almacenes).
- `[ ]` Backend: Crear endpoint `getTransferenciaById` (`GET /api/inventario/transferencias/:id`).
- `[ ]` Backend: Validaciones y lógica al crear y completar transferencias (stock por almacén, restar/sumar stock, motivo obligatorio).
- `[ ]` Backend: Actualizar Ventas (`ventasController.js`) y Compras (`comprasController.js`) para descontar/sumar stock de `productos_almacen` y sincronizar stock general.
- `[ ]` Frontend: Modales y vistas (responsable de almacén, visualización de colores en alertas de stock, eliminar columna "Referencia ID" en Kardex).
- `[ ]` Frontend: Nueva transferencia (mantener cantidades, filtrar productos del almacén de origen, motivo obligatorio).
- `[ ]` Frontend: Carga de detalles de transferencias en modal y en fila desplegable de la tabla.
