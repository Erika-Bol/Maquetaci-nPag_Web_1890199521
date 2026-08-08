document.addEventListener('DOMContentLoaded', () => {
    // Variables y Constantes
    const apiUrl = 'https://backservicetest-g8emcvdff0fqe2b8.canadacentral-01.azurewebsites.net/api/producto';
    let productosData = []; // Estado global
    let categoriaActual = null;
    let productoAEliminarId = null;

    // Elementos del DOM
    const contenedorProductos = document.getElementById('contenedor-productos');
    const contenedorCategorias = document.getElementById('contenedor-categorias');
    const inputBusqueda = document.getElementById('inputBusqueda');
    const filtroOfertas = document.getElementById('filtroOfertas');
    
    // Modal Elementos Formulario
    const modalProducto = new bootstrap.Modal(document.getElementById('modalProducto'));
    const formProducto = document.getElementById('formProducto');
    const btnGuardar = document.getElementById('btnGuardar');
    const checkOferta = document.getElementById('enOferta');
    const contenedorPrecioOferta = document.getElementById('contenedorPrecioOferta');

    // Modales Extras
    const modalDetalle = new bootstrap.Modal(document.getElementById('modalDetalle'));
    const modalEliminar = new bootstrap.Modal(document.getElementById('modalEliminar'));
    const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');

    // Inicializar
    cargarProductos();

    // Eventos
    inputBusqueda.addEventListener('input', renderizarProductos);
    filtroOfertas.addEventListener('change', renderizarProductos);
    
    checkOferta.addEventListener('change', () => {
        if (checkOferta.checked) {
            contenedorPrecioOferta.classList.remove("d-none");
        } else {
            contenedorPrecioOferta.classList.add("d-none");
            document.getElementById("precioOferta").value = "";
        }
    });

    formProducto.addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarProducto();
    });

    btnConfirmarEliminar.addEventListener('click', async () => {
        if (productoAEliminarId) {
            await eliminarProductoConfirmado(productoAEliminarId);
        }
    });

    // --- Funciones Principales ---

    async function cargarProductos() {
        contenedorProductos.innerHTML = `<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div><p class="mt-2 text-muted">Cargando catálogo...</p></div>`;
        try {
            const respuesta = await fetch(apiUrl);
            if (!respuesta.ok) throw new Error(`Error en la petición: ${respuesta.status}`);
            
            productosData = await respuesta.json();
            
            extraerCategorias();
            renderizarProductos();
        } catch (error) {
            console.error('Error al obtener los productos:', error);
            contenedorProductos.innerHTML = `<div class="col-12"><div class="alert alert-danger" role="alert">Hubo un error al cargar los productos. Por favor, intenta más tarde.</div></div>`;
        }
    }

    function extraerCategorias() {
        // Encontrar categorías únicas usando Set y Map
        const categoriasMap = new Map();
        
        productosData.forEach(prod => {
            const catId = prod.categoriaId !== undefined ? prod.categoriaId : prod.CategoriaId;
            const catNombre = prod.categoriaNombre || prod.CategoriaNombre;
            if (catId !== undefined && catNombre && !categoriasMap.has(catId)) {
                categoriasMap.set(catId, catNombre);
            }
        });

        // Limpiar el contenedor (dejando solo 'Todo')
        contenedorCategorias.innerHTML = `
            <button class="list-group-item list-group-item-action active text-start" onclick="filtrarCategoria(null, this)">
                <i class="bi bi-grid-fill me-2"></i> Todo
            </button>
        `;

        // Añadir al select del formulario
        const categoriaSelect = document.getElementById('categoriaSelect');
        categoriaSelect.innerHTML = '<option value="">Seleccione una...</option>';

        const iconos = ['bi-laptop', 'bi-bag-heart', 'bi-house-door', 'bi-dribbble', 'bi-star', 'bi-tag'];
        let idx = 0;

        categoriasMap.forEach((nombre, id) => {
            const icon = iconos[idx % iconos.length];
            idx++;
            
            // Inyectar en el menú lateral
            contenedorCategorias.innerHTML += `
                <button class="list-group-item list-group-item-action text-start" onclick="filtrarCategoria(${id}, this)">
                    <i class="bi ${icon} me-2"></i> ${nombre}
                </button>
            `;

            // Inyectar en el select del modal
            categoriaSelect.innerHTML += `<option value="${id}|${nombre}">${nombre}</option>`;
        });
    }

    window.filtrarCategoria = (id, element) => {
        categoriaActual = id;
        
        // Actualizar UI del menú
        document.querySelectorAll('#contenedor-categorias button').forEach(btn => {
            btn.classList.remove('active');
        });
        element.classList.add('active');

        renderizarProductos();
    };

    function renderizarProductos() {
        const textoBusqueda = inputBusqueda.value.toLowerCase().trim();
        const soloOfertas = filtroOfertas.checked;

        let productosFiltrados = productosData.filter(prod => {
            const nombre = (prod.nombre || prod.Nombre || '').toLowerCase();
            const catId = prod.categoriaId !== undefined ? prod.categoriaId : prod.CategoriaId;
            const enOferta = prod.enOferta !== undefined ? prod.enOferta : prod.EnOferta;

            // Filtro por nombre
            const cumpleBusqueda = nombre.includes(textoBusqueda);
            // Filtro por categoría
            const cumpleCategoria = categoriaActual === null || catId === categoriaActual;
            // Filtro por oferta
            const cumpleOferta = !soloOfertas || enOferta;

            return cumpleBusqueda && cumpleCategoria && cumpleOferta;
        });

        contenedorProductos.innerHTML = '';

        if (productosFiltrados.length === 0) {
            contenedorProductos.innerHTML = `<div class="col-12 text-center py-5 text-muted"><i class="bi bi-search fs-1"></i><p class="mt-3">No se encontraron productos que coincidan con los filtros.</p></div>`;
            return;
        }

        productosFiltrados.forEach(producto => {
            const id = producto.id !== undefined ? producto.id : producto.Id;
            const nombre = producto.nombre || producto.Nombre || '';
            const imagen = producto.imagen || producto.Imagen || '';
            const descripcion = producto.descripcion || producto.Descripcion || '';
            const precio = producto.precio !== undefined ? producto.precio : producto.Precio;
            const enOferta = producto.enOferta !== undefined ? producto.enOferta : producto.EnOferta;
            const precioOferta = producto.precioOferta !== undefined ? producto.precioOferta : producto.PrecioOferta;

            let precioHtml = `<div class="fw-bold fs-5 mb-3">Q${parseFloat(precio).toFixed(2)}</div>`;
            let badgeOferta = '';
            
            if (enOferta && precioOferta !== null && precioOferta !== undefined) {
                precioHtml = `
                    <div class="mb-3">
                        <span class="text-muted text-decoration-line-through me-2">Q${parseFloat(precio).toFixed(2)}</span>
                        <span class="fw-bold fs-5 text-danger">Q${parseFloat(precioOferta).toFixed(2)}</span>
                    </div>
                `;
                badgeOferta = `<span class="position-absolute top-0 end-0 m-3 badge rounded-pill bg-danger fs-6 shadow">¡Oferta!</span>`;
            }

            const productoHtml = `
                <div class="col-sm-12 col-md-6 col-lg-4 mb-4">
                    <div class="card h-100 d-flex flex-column shadow-sm position-relative">
                        ${badgeOferta}
                        <img src="${imagen}" class="card-img-top img-fluid bg-light" alt="${nombre}" style="object-fit: contain; cursor: pointer; height: 220px;" onclick="verDetalle(${id})">
                        <div class="card-body d-flex flex-column p-4">
                            <h5 class="card-title text-truncate" title="${nombre}">${nombre}</h5>
                            <p class="card-text text-muted mb-4 small text-truncate" title="${descripcion}">${descripcion}</p>
                            <div class="mt-auto">
                                ${precioHtml}
                                <div class="d-flex gap-2">
                                    <button class="btn btn-outline-dark flex-grow-1 py-2" onclick="verDetalle(${id})"><i class="bi bi-eye"></i></button>
                                    <button class="btn btn-outline-primary py-2 px-3" onclick="abrirModalEditar(${id})"><i class="bi bi-pencil"></i></button>
                                    <button class="btn btn-outline-danger py-2 px-3" onclick="confirmarEliminar(${id})"><i class="bi bi-trash"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            contenedorProductos.innerHTML += productoHtml;
        });
    }

    // --- CRUD ---

    window.abrirModalCrear = () => {
        formProducto.reset();
        document.getElementById('productoId').value = 0;
        document.getElementById('modalProductoLabel').textContent = 'Registrar Nuevo Producto';
        contenedorPrecioOferta.classList.add("d-none");
    };

    window.abrirModalEditar = (id) => {
        const prod = productosData.find(p => (p.id !== undefined ? p.id : p.Id) === id);
        if (!prod) return;

        document.getElementById('productoId').value = id;
        document.getElementById('modalProductoLabel').textContent = 'Editar Producto';

        document.getElementById('nombre').value = prod.nombre || prod.Nombre || '';
        document.getElementById('descripcion').value = prod.descripcion || prod.Descripcion || '';
        document.getElementById('precio').value = prod.precio !== undefined ? prod.precio : prod.Precio;
        document.getElementById('imagen').value = prod.imagen || prod.Imagen || '';
        
        const catId = prod.categoriaId !== undefined ? prod.categoriaId : prod.CategoriaId;
        const catNombre = prod.categoriaNombre || prod.CategoriaNombre;
        document.getElementById('categoriaSelect').value = `${catId}|${catNombre}`;

        const enOferta = prod.enOferta !== undefined ? prod.enOferta : prod.EnOferta;
        checkOferta.checked = enOferta;
        
        if (enOferta) {
            contenedorPrecioOferta.classList.remove("d-none");
            document.getElementById('precioOferta').value = prod.precioOferta !== undefined ? prod.precioOferta : prod.PrecioOferta;
        } else {
            contenedorPrecioOferta.classList.add("d-none");
            document.getElementById('precioOferta').value = '';
        }

        modalProducto.show();
    };

    async function guardarProducto() {
        const id = parseInt(document.getElementById('productoId').value);
        const catVal = document.getElementById("categoriaSelect").value;
        if (!catVal) {
            mostrarToast('Debe seleccionar una categoría.', 'warning');
            return;
        }
        const [catIdStr, catNombre] = catVal.split("|");
        
        const payload = {
            id: id,
            nombre: document.getElementById("nombre").value.trim(),
            descripcion: document.getElementById("descripcion").value.trim(),
            precio: parseFloat(document.getElementById("precio").value),
            enOferta: checkOferta.checked,
            precioOferta: checkOferta.checked ? parseFloat(document.getElementById("precioOferta").value) : null,
            imagen: document.getElementById("imagen").value.trim(),
            categoriaId: parseInt(catIdStr),
            categoriaNombre: catNombre
        };

        const esEdicion = id > 0;
        const url = esEdicion ? `${apiUrl}/${id}` : apiUrl;
        const method = esEdicion ? 'PUT' : 'POST';

        btnGuardar.disabled = true;
        btnGuardar.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...`;

        try {
            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                mostrarToast(`Producto ${esEdicion ? 'actualizado' : 'creado'} con éxito!`, 'success');
                modalProducto.hide();
                await cargarProductos(); // Recargar todo para asegurar consistencia
            } else {
                mostrarToast('Error al guardar el producto.', 'danger');
            }
        } catch (error) {
            console.error(error);
            mostrarToast('Error de conexión.', 'danger');
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.textContent = 'Guardar Producto';
        }
    }

    window.confirmarEliminar = (id) => {
        productoAEliminarId = id;
        modalEliminar.show();
    };

    async function eliminarProductoConfirmado(id) {
        btnConfirmarEliminar.disabled = true;
        btnConfirmarEliminar.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;

        try {
            const response = await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
            if (response.ok || response.status === 204) {
                mostrarToast('Producto eliminado correctamente.', 'success');
                modalEliminar.hide();
                await cargarProductos();
            } else {
                mostrarToast('No se pudo eliminar el producto.', 'danger');
            }
        } catch (error) {
            console.error(error);
            mostrarToast('Error al conectar con la API.', 'danger');
        } finally {
            btnConfirmarEliminar.disabled = false;
            btnConfirmarEliminar.textContent = 'Eliminar';
            productoAEliminarId = null;
        }
    }

    window.verDetalle = async (id) => {
        const prod = productosData.find(p => (p.id !== undefined ? p.id : p.Id) === id);
        if (!prod) return;

        const nombre = prod.nombre || prod.Nombre || '';
        const imagen = prod.imagen || prod.Imagen || '';
        const descripcion = prod.descripcion || prod.Descripcion || '';
        const precio = prod.precio !== undefined ? prod.precio : prod.Precio;
        const enOferta = prod.enOferta !== undefined ? prod.enOferta : prod.EnOferta;
        const precioOferta = prod.precioOferta !== undefined ? prod.precioOferta : prod.PrecioOferta;
        const catNombre = prod.categoriaNombre || prod.CategoriaNombre || '';

        let precioHtml = `<h2 class="fw-bold mb-4">Q${parseFloat(precio).toFixed(2)}</h2>`;
        if (enOferta && precioOferta !== null) {
            precioHtml = `
                <div class="mb-4">
                    <span class="text-muted text-decoration-line-through fs-5 me-2">Q${parseFloat(precio).toFixed(2)}</span>
                    <span class="fw-bold text-danger fs-2">Q${parseFloat(precioOferta).toFixed(2)}</span>
                </div>
            `;
        }

        const modalBody = document.getElementById('detalleContenido');
        modalBody.innerHTML = `
            <div class="row g-0">
                <div class="col-md-6 bg-light d-flex align-items-center justify-content-center p-4">
                    <img src="${imagen}" class="img-fluid rounded-4 shadow-sm" alt="${nombre}" style="max-height: 400px; object-fit: contain;">
                </div>
                <div class="col-md-6 p-5 d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge bg-dark text-white rounded-pill px-3 py-2">${catNombre}</span>
                        <button type="button" class="btn-close shadow-none" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <h3 class="fw-bold mt-3">${nombre}</h3>
                    <p class="text-muted mt-3 mb-4 lh-lg">${descripcion}</p>
                    <div class="mt-auto border-top pt-4">
                        ${precioHtml}
                        <button class="btn btn-premium btn-lg w-100 rounded-pill shadow" onclick="mostrarToast('Añadido al carrito', 'info')">
                            <i class="bi bi-cart-plus me-2"></i> Añadir al Carrito
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        modalDetalle.show();
    };

    function mostrarToast(mensaje, tipo = 'primary') {
        const toastEl = document.getElementById('appToast');
        toastEl.className = `toast align-items-center text-white bg-${tipo} border-0`;
        document.getElementById('toastMensaje').textContent = mensaje;
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }
});
