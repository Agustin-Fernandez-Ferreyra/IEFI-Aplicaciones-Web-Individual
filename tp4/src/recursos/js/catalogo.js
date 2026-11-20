import { formatearPrecio, normalizarTexto } from './utilidades.js';

// ---------- Render de tarjetas (catálogo, inicio, relacionados) ----------
const tarjetaProducto = (p) => `
    <article class="tarjeta-producto">
        <figure>
            <a href="./detalle_producto.html?id=${p.id}"><img src="${p.imagen}" alt="${p.nombre}"></a>
        </figure>
        <h3>${p.nombre}</h3>
        <p>${p.descripcion}</p>
        <p><strong>${formatearPrecio(p.precioFinal)}</strong></p>
        <a href="./detalle_producto.html?id=${p.id}" class="boton-principal">Ver detalle</a>
    </article>`;

export const renderizarProductos = (contenedor, lista) => {
    contenedor.innerHTML = lista.length
        ? lista.map(tarjetaProducto).join('')
        : '<p class="mensaje-vacio">No encontramos productos con esos filtros.</p>';
};

// ---------- Filtros (funciones puras, fáciles de testear) ----------
export const ordenarProductos = (criterio, lista) => {
    const copia = [...lista]; // no modifica el original
    if (criterio === 'precio-bajo') return copia.sort((a, b) => a.precioFinal - b.precioFinal);
    if (criterio === 'precio-alto') return copia.sort((a, b) => b.precioFinal - a.precioFinal);
    if (criterio === 'nombre') return copia.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return copia;
};

export const aplicarFiltros = (productos, { categoria = 'Todas', orden = 'relevancia', busqueda = '' } = {}) => {
    const sinOfertas = productos.filter(p => !p.enOferta); // las ofertas viven en ofertas.html
    const porCategoria = categoria === 'Todas' ? sinOfertas : sinOfertas.filter(p => p.categoria === categoria);
    const termino = normalizarTexto(busqueda);
    const porTexto = termino
        ? porCategoria.filter(p => normalizarTexto(`${p.nombre} ${p.marca} ${p.descripcion} ${p.sabor}`).includes(termino))
        : porCategoria;
    return ordenarProductos(orden, porTexto);
};

export const obtenerProductoPorId = (id, productos) => productos.find(p => p.id === id);

// ---------- Inicio ----------
export const renderizarDestacados = (contenedor, productos) => {
    const ids = contenedor.dataset.ids.split(',').map(Number);
    renderizarProductos(contenedor, ids.map(id => obtenerProductoPorId(id, productos)).filter(Boolean));
};

// ---------- Catálogo: eventos de filtros ----------
export const iniciarCatalogo = (productos) => {
    const contenedor = document.getElementById('contenedor-productos');
    const enlaces = document.querySelectorAll('.lista-categorias a');
    const selectOrdenar = document.getElementById('id-ordenar');
    const buscador = document.getElementById('id_buscar');

    const estado = {
        categoria: 'Todas',
        orden: 'relevancia',
        busqueda: new URLSearchParams(window.location.search).get('busqueda') ?? ''
    };
    if (buscador) buscador.value = estado.busqueda;

    const actualizar = () => {
        renderizarProductos(contenedor, aplicarFiltros(productos, estado));
        enlaces.forEach(a => {
            const activa = a.textContent.trim() === estado.categoria;
            a.classList.toggle('activa', activa);
            activa ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current');
        });
    };

    enlaces.forEach(enlace => enlace.addEventListener('click', (e) => {
        e.preventDefault();
        estado.categoria = e.target.textContent.trim();
        actualizar();
    }));
    selectOrdenar.addEventListener('change', (e) => { estado.orden = e.target.value; actualizar(); });
    if (buscador) {
        buscador.addEventListener('input', (e) => { estado.busqueda = e.target.value; actualizar(); });
    }
    actualizar();
};

// ---------- Detalle ----------
export const renderizarDetalle = (contenedor, producto, productos = []) => {
    if (!producto) {
        contenedor.innerHTML = '<h2>Producto no encontrado</h2><p><a href="./catalogo.html">Volver al catálogo</a></p>';
        return;
    }
    const filas = producto.nutricion
        .map(i => `<tr><td><strong>${i.nutriente}</strong></td><td>${i.cantidad}</td></tr>`).join('');
    const precio = producto.descuento > 0
        ? `<s>${formatearPrecio(producto.precio)}</s> <strong>${formatearPrecio(producto.precioFinal)}</strong>`
        : `<strong>${formatearPrecio(producto.precioFinal)}</strong>`;
    const relacionados = productos
        .filter(p => p.id !== producto.id && p.categoria === producto.categoria).slice(0, 3);

    document.title = `Apex Fit - ${producto.nombre}`;
    contenedor.innerHTML = `
        <h1>Detalle del Producto</h1>
        <section class="tarjeta-oferta">
            <figure><img src="${producto.imagen}" alt="${producto.nombre}" height="400"></figure>
            <div>
                <h2>${producto.nombre}</h2>
                <p><strong>Marca:</strong> ${producto.marca}</p>
                <p>${precio} ${producto.cuotas}</p>
                <p>${producto.descripcion}</p>
                <p><strong>Sabor:</strong> ${producto.sabor}</p>
                <form id="form-agregar" data-id="${producto.id}" action="#" method="post">
                    <div>
                        <label for="id-cantidad"><strong>Cantidad:</strong></label>
                        <input type="number" id="id-cantidad" name="cantidad" min="1" max="10" value="1" required>
                        <button type="submit" class="boton-principal">Agregar al carrito</button>
                    </div>
                </form>
            </div>
        </section>
        <section>
            <h3>Información Nutricional</h3>
            <table>
                <caption>Valores nutricionales por porción (${producto.porcion})</caption>
                <thead><tr><th scope="col">Nutrientes</th><th scope="col">Cantidad por porción</th></tr></thead>
                <tbody>${filas}</tbody>
            </table>
        </section>
        ${relacionados.length ? '<section><h3>Productos relacionados</h3><div id="relacionados" class="grilla-productos"></div></section>' : ''}
    `;
    if (relacionados.length) renderizarProductos(contenedor.querySelector('#relacionados'), relacionados);
};

// ---------- Ofertas ----------
const tarjetaOferta = (p) => `
    <article class="tarjeta-oferta">
        <figure class="oferta-imagen">
            <a href="./detalle_producto.html?id=${p.id}"><img src="${p.imagen}" alt="${p.nombre}"></a>
        </figure>
        <div class="oferta-contenido">
            <h3>${p.nombre}</h3>
            <div class="oferta-precio-fila">
                <span class="etiqueta-descuento">${Math.round(p.descuento * 100)}% OFF</span>
                <s>${formatearPrecio(p.precio)}</s>
                <span class="precio-final">${formatearPrecio(p.precioFinal)}</span>
            </div>
            <p>${p.descripcion}</p>
            <button type="button" class="boton-principal" data-agregar="${p.id}">Agregar al carrito</button>
        </div>
    </article>`;

export const renderizarOfertas = (contenedor, productos) => {
    const ofertas = productos.filter(p => p.enOferta);
    if (ofertas.length === 0) {
        contenedor.innerHTML = '<h1>Ofertas</h1><p>No hay ofertas disponibles por el momento.</p>';
        return;
    }
    const [combo, ...otros] = ofertas;
    contenedor.innerHTML = `
        <h1>Ofertas</h1>
        <section><h2>Combo imperdible</h2>${tarjetaOferta(combo)}</section>
        ${otros.length ? `<section><h2>Otros productos en oferta</h2>${otros.map(tarjetaOferta).join('')}</section>` : ''}`;
};
