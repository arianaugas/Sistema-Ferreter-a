# Plan de Implementación: Reestructuración de Stock y Corrección de Transferencias

Este plan aborda la transición de un modelo de stock global a un modelo de **stock por almacén**, además de solucionar diversos errores de la gestión de almacenes y transferencias en el módulo de Inventario.

---

## 👥 Decisiones y Preguntas Abiertas (Revisión del Usuario Requerida)

> [!IMPORTANT]
> **Cambio Arquitectónico Principal: Stock por Almacén**
> Actualmente, la tabla `productos` tiene un `stock_actual` global. Si migramos a stock por almacén:
> 1. Crearemos la tabla `productos_almacen` (`id_producto`, `id_almacen`, `stock`).
> 2. Las **Ventas** deberán especificar un almacén para descontar stock. En [ventasController.js](file:///d:/Bases%20de%20datos/FERRETERIA1/server/controllers/ventasController.js), ya existe un parámetro `id_almacen` en el body, por lo que usaremos ese almacén.
> 3. Las **Compras (Recepciones)** deberán especificar a qué almacén ingresa el stock.
> 4. Los **Ajustes** y las **Transferencias** operarán sobre `productos_almacen`.
> 
> *Pregunta para el usuario:* ¿Estás de acuerdo con este diseño? ¿Deseas mantener una columna `stock_actual` en la tabla `productos` que represente la suma de todos los almacenes (como caché automática), o la removemos por completo y calculamos la suma dinámicamente?

---

## 🛠️ Cambios Propuestos

### Módulo: Base de Datos

#### [MODIFY] [sqlFerreteria.sql](file:///d:/Bases%20de%20datos/FERRETERIA1/database/sqlFerreteria.sql)
- Agregar la tabla `productos_almacen`:
  ```sql
  CREATE TABLE productos_almacen (
      id_producto INT NOT NULL,
      id_almacen INT NOT NULL,
      stock DECIMAL(10,2) NOT NULL DEFAULT 0,
      CONSTRAINT pk_productos_almacen PRIMARY KEY (id_producto, id_almacen),
      CONSTRAINT fk_prod_alm_prod FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
      CONSTRAINT fk_prod_alm_alm FOREIGN KEY (id_almacen) REFERENCES almacenes(id_almacen)
  );
  ```
- Si se mantiene `stock_actual` en `productos` como suma, crearemos un trigger o actualizaremos la lógica del backend para mantenerlo sincronizado.

---

### Módulo: Backend (API REST)

#### [MODIFY] [inventarioController.js](file:///d:/Bases%20de%20datos/FERRETERIA1/server/controllers/inventarioController.js)
1. **`getAlmacenes` / `getAlmacenById`**: Seleccionar `a.responsable AS id_responsable` además de la concatenación del nombre, para corregir el bug donde el modal de edición no precargaba el responsable.
2. **`getStock`**: Modificar para que, si se filtra por almacén, traiga el stock de `productos_almacen`. Si no se filtra, traerá el stock total sumado.
3. **`ajustarStock`**:
   - Actualizar el stock en `productos_almacen` para el almacén y producto seleccionados.
   - Si no existe el registro en `productos_almacen`, crearlo con stock = 0 antes de sumar/restar.
4. **`getTransferencias`**: Cambiar a `LEFT JOIN empleados` y `LEFT JOIN almacenes` para que las transferencias históricas no se filtren si un empleado o almacén se desactiva.
5. **[NEW] `getTransferenciaById`**: Crear el endpoint para obtener una transferencia y sus productos asociados:
   - `GET /api/inventario/transferencias/:id`
6. **`crearTransferencia`**: 
   - Validar que el `motivo` no sea nulo o vacío.
   - Validar en base de datos que el almacén de origen tenga stock suficiente para todos los productos de la transferencia.
7. **`completarTransferencia`**:
   - Restar stock del almacén de origen en `productos_almacen`.
   - Sumar stock en el almacén de destino en `productos_almacen`.

#### [MODIFY] [inventarioRoutes.js](file:///d:/Bases%20de%20datos/FERRETERIA1/server/routes/subRutas/inventarioRoutes.js)
- Registrar la ruta `GET /transferencias/:id` que apunte a `invCtrl.getTransferenciaById`.

#### [MODIFY] [ventasController.js](file:///d:/Bases%20de%20datos/FERRETERIA1/server/controllers/ventasController.js)
- Actualizar la deducción de stock en `create` y devolución de stock en `anular` para que operen sobre `productos_almacen` usando el `id_almacen` proveído.

#### [MODIFY] [comprasController.js](file:///d:/Bases%20de%20datos/FERRETERIA1/server/controllers/comprasController.js)
- Actualizar el ingreso de stock en recepciones para que opere sobre `productos_almacen` usando el `id_almacen` de la recepción.

---

### Módulo: Frontend (HTML & JavaScript)

#### [MODIFY] [inventario.html](file:///d:/Bases%20de%20datos/FERRETERIA1/public/pages/inventario.html)
- Agregar clases o atributos CSS a `#alerta-critico-card`, `#alerta-normal-card`, y `#alerta-sobrestock-card` para que tengan colores de fondo/borde premium (Rojo para crítico, Verde para normal, Amarillo para sobrestock).

#### [MODIFY] [inventario.js](file:///d:/Bases%20de%20datos/FERRETERIA1/public/js/inventario.js)
1. **Modal Editar Almacén (`abrirModalEditarAlmacen`)**: Corregir para asignar el valor del select responsable a partir de `alm.id_responsable`.
2. **Kardex**: Ocultar o eliminar la columna visual de "Referencia ID" en la fila principal y estilizar mejor la información del movimiento con insignias de colores.
3. **Nueva Transferencia - Datalist de productos**:
   - Al seleccionar un almacén de origen, filtrar la lista de productos disponibles en el buscador para incluir únicamente aquellos que tengan stock actual mayor a 0 en ese almacén.
4. **Detalle Dinámico de Transferencia (Fila Desplegable)**:
   - Modificar la fila desplegable (`trDetail`) de transferencias en la tabla para que, al expandirse, cargue dinámicamente los productos transferidos mediante fetch a `GET /api/inventario/transferencias/:id` y los muestre en una mini-tabla, evitando la necesidad de abrir el modal visual.
5. **Modal Detalle Transferencia**:
   - Corregir `abrirDetalleTransferencia` para que realice fetch al nuevo endpoint de detalle y pinte las filas de productos transferidos en `#tabla-transf-det-productos-body` (actualmente queda vacío).
6. **Nueva Transferencia - Preservar cantidades (`renderDetalleTransf`)**:
   - Corregir el renderizador para asignar `inputCant.value = item.cantidad || ''` al reconstruir el listado, evitando que se borren las cantidades de los demás productos al eliminar un ítem.

---

## 🧪 Plan de Verificación

### Pruebas Manuales
1.  **Edición de Almacenes**: Validar que al abrir el modal de edición se autoseleccione el empleado responsable correcto.
2.  **Cantidades en Transferencia**: Agregar varios productos a una transferencia, llenar cantidades, eliminar uno y comprobar que las cantidades de los demás se mantengan intactas.
3.  **Validaciones de Stock por Almacén**:
    *   Registrar un ajuste de stock para el Producto A únicamente en el Almacén 1.
    *   Intentar crear una transferencia del Producto A desde el Almacén 2 (debe dar error de stock insuficiente).
    *   Completar la transferencia desde el Almacén 1 al Almacén 2 y validar que el stock disminuya en Almacén 1 y aumente en Almacén 2.
4.  **Detalle de Transferencia**: Desplegar una transferencia en la tabla y abrir el modal para certificar que la lista de productos transferidos se cargue y visualice correctamente.
