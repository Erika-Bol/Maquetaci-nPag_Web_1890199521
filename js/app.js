document.addEventListener('DOMContentLoaded', () => {
    const contenedorProductos = document.getElementById('contenedor-productos');
    const apiUrl = 'https://backservicetest-g8emcvdff0fqe2b8.canadacentral-01.azurewebsites.net/api/producto';

    async function cargarProductos() {
        try {
            const respuesta = await fetch(apiUrl);
            if (!respuesta.ok) {
                throw new Error(`Error en la petición: ${respuesta.status}`);
            }
            const productos = await respuesta.json();
            renderizarProductos(productos);
        } catch (error) {
            console.error('Error al obtener los productos:', error);
            contenedorProductos.innerHTML = `<div class="col-12"><div class="alert alert-danger" role="alert">
                Hubo un error al cargar los productos. Por favor, intenta más tarde.
            </div></div>`;
        }
    }

    function renderizarProductos(productos) {
        contenedorProductos.innerHTML = '';
        
        productos.forEach(producto => {
            // Soportar tanto minúsculas (de la API) como mayúsculas (de la consigna)
            const nombre = producto.nombre || producto.Nombre || '';
            const imagen = producto.imagen || producto.Imagen || '';
            const descripcion = producto.descripcion || producto.Descripcion || '';
            const precio = producto.precio !== undefined ? producto.precio : producto.Precio;
            const enOferta = producto.enOferta !== undefined ? producto.enOferta : producto.EnOferta;
            const precioOferta = producto.precioOferta !== undefined ? producto.precioOferta : producto.PrecioOferta;

            let precioHtml = `<div class="fw-bold fs-5 mb-3">Q${parseFloat(precio).toFixed(2)}</div>`;
            
            // Validar si está en oferta y si tiene un precio de oferta válido
            if (enOferta && precioOferta !== null && precioOferta !== undefined) {
                precioHtml = `
                    <div class="mb-3">
                        <span class="text-muted text-decoration-line-through me-2">Q${parseFloat(precio).toFixed(2)}</span>
                        <span class="fw-bold fs-5 text-danger">Q${parseFloat(precioOferta).toFixed(2)}</span>
                    </div>
                `;
            }

            const productoHtml = `
                <div class="col-sm-12 col-md-4 mb-4">
                    <div class="card h-100 d-flex flex-column shadow-sm">
                        <img src="${imagen}" class="card-img-top img-fluid" alt="${nombre}">
                        <div class="card-body d-flex flex-column p-4">
                            <h5 class="card-title">${nombre}</h5>
                            <p class="card-text text-muted mb-4 small">${descripcion}</p>
                            <div class="mt-auto">
                                ${precioHtml}
                                <button class="btn btn-premium w-100 py-2">Agregar al carrito</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            contenedorProductos.innerHTML += productoHtml;
        });
    }

    cargarProductos();
});
