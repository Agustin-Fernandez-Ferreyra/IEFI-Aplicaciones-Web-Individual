import { CONFIG } from './config.js';
import { formatearPrecio, notificar } from './utilidades.js';

const CLAVE = 'apexfit_carrito';

// ---------- Persistencia (localStorage) ----------
export const obtenerCarrito = () => {
    try {
        const datos = JSON.parse(localStorage.getItem(CLAVE));
        return Array.isArray(datos) ? datos : [];
    } catch (error) {
        console.error('No se pudo leer el carrito guardado', error);
        return [];
    }
};

const guardarCarrito = (carrito) => {
    try {
        localStorage.setItem(CLAVE, JSON.stringify(carrito));
    } catch (error) {
        console.error(error);
        notificar('No pudimos guardar tu carrito en el navegador.', 'error');
    }
    actualizarContador();
};

const limitar = (n) => Math.min(CONFIG.maxPorProducto, Math.max(1, Math.floor(Number(n)) || 1));

export const agregarAlCarrito = (id, cantidad = 1) => {
    const carrito = obtenerCarrito();
    const item = carrito.find(i => i.id === id);
    if (item) item.cantidad = limitar(item.cantidad + cantidad);
    else carrito.push({ id, cantidad: limitar(cantidad) });
    guardarCarrito(carrito);
};

export const actualizarCantidad = (id, cantidad) =>
    guardarCarrito(obtenerCarrito().map(i => i.id === id ? { ...i, cantidad: limitar(cantidad) } : i));

export const quitarDelCarrito = (id) =>
    guardarCarrito(obtenerCarrito().filter(i => i.id !== id));

export const vaciarCarrito = () => guardarCarrito([]);

// Globito con la cantidad de ítems sobre el ícono del carrito (en todas las páginas)
export const actualizarContador = () => {
    const enlace = document.querySelector('.iconos-derecha a[href="./carrito.html"]');
    if (!enlace) return;
    let badge = enlace.querySelector('.badge-carrito');
    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'badge-carrito';
        enlace.appendChild(badge);
    }
    const total = obtenerCarrito().reduce((suma, i) => suma + i.cantidad, 0);
    badge.textContent = total;
    badge.hidden = total === 0;
};

// ---------- Cálculos (funciones puras) ----------
export const detallarCarrito = (carrito, productos) =>
    carrito
        .map(({ id, cantidad }) => {
            const producto = productos.find(p => p.id === id);
            return producto ? { producto, cantidad, subtotal: producto.precioFinal * cantidad } : null;
        })
        .filter(Boolean);

export const calcularEnvio = (subtotal, provincia) => {
    if (!provincia) return null; // todavía no se calculó
    if (subtotal >= CONFIG.envio.gratisDesde) return 0;
    return provincia === CONFIG.envio.provinciaLocal ? CONFIG.envio.tarifaLocal : CONFIG.envio.tarifaResto;
};

export const construirMensajePedido = ({ nombre, lineas, subtotal, envio, provincia, nota }) => {
    const detalle = lineas
        .map(l => `• ${l.cantidad} x ${l.producto.nombre} - ${formatearPrecio(l.subtotal)}`)
        .join('\n');
    return [
        `¡Hola Apex Fit! Soy ${nombre} y quiero hacer este pedido:`,
        '',
        detalle,
        '',
        `Subtotal: ${formatearPrecio(subtotal)}`,
        `Envío (${provincia}): ${envio === 0 ? 'Gratis' : formatearPrecio(envio)}`,
        `Total: ${formatearPrecio(subtotal + envio)}`,
        nota ? `\nNota: ${nota}` : ''
    ].join('\n');
};

// ---------- Vista del carrito (carrito.html) ----------
const itemHTML = ({ producto: p, cantidad, subtotal }) => `
    <article class="producto-carrito">
        <img src="${p.imagen}" alt="${p.nombre}" width="100">
        <div class="info-producto-carrito">
            <h3>${p.nombre}</h3>
            <p>${p.marca} - ${formatearPrecio(p.precioFinal)} c/u</p>
            <p><strong>Subtotal: ${formatearPrecio(subtotal)}</strong></p>
        </div>
        <div class="cantidad-carrito">
            <div class="campo-form">
                <label for="cant-${p.id}">Cantidad</label>
                <input type="number" id="cant-${p.id}" min="1" max="${CONFIG.maxPorProducto}" value="${cantidad}" data-cantidad="${p.id}">
            </div>
            <button type="button" class="boton-secundario" data-quitar="${p.id}">Quitar</button>
        </div>
    </article>`;

export const iniciarCarrito = (productos) => {
    const $ = (id) => document.getElementById(id);
    const lista = $('lista-carrito');
    const selectProvincia = $('id-provincia');
    let provinciaCalculada = '';

    const render = () => {
        const lineas = detallarCarrito(obtenerCarrito(), productos);
        const subtotal = lineas.reduce((suma, l) => suma + l.subtotal, 0);
        const envio = calcularEnvio(subtotal, provinciaCalculada);

        lista.innerHTML = lineas.length
            ? lineas.map(itemHTML).join('')
            : '<p class="mensaje-vacio">Tu carrito está vacío. <a href="./catalogo.html">Ver el catálogo</a></p>';
        $('resumen-subtotal').textContent = formatearPrecio(subtotal);
        $('resumen-envio').textContent = envio === null ? 'A calcular' : envio === 0 ? 'Gratis' : formatearPrecio(envio);
        $('resumen-total').textContent = formatearPrecio(subtotal + (envio ?? 0));
        $('formulario-pedido').querySelector('button[type="submit"]').disabled = lineas.length === 0;
    };

    lista.addEventListener('click', (e) => {
        const id = e.target.dataset.quitar;
        if (!id) return;
        quitarDelCarrito(Number(id));
        notificar('Producto quitado del carrito.');
        render();
    });
    lista.addEventListener('change', (e) => {
        const id = e.target.dataset.cantidad;
        if (!id) return;
        actualizarCantidad(Number(id), e.target.value);
        render();
    });

    $('formulario-envio').addEventListener('submit', (e) => {
        e.preventDefault();
        provinciaCalculada = selectProvincia.value;
        render();
        notificar('Envío calculado.');
    });

    $('formulario-pedido').addEventListener('submit', (e) => {
        e.preventDefault();
        const lineas = detallarCarrito(obtenerCarrito(), productos);
        const subtotal = lineas.reduce((suma, l) => suma + l.subtotal, 0);
        const envio = calcularEnvio(subtotal, provinciaCalculada);
        const datos = new FormData(e.target);
        const nombre = datos.get('nombre').trim();

        if (lineas.length === 0) return notificar('Tu carrito está vacío.', 'error');
        if (nombre.length < 2) return notificar('Ingresá tu nombre para continuar.', 'error');
        if (envio === null) return notificar('Calculá el envío antes de finalizar la compra.', 'error');

        const mensaje = construirMensajePedido({
            nombre, lineas, subtotal, envio,
            provincia: selectProvincia.selectedOptions[0].textContent,
            nota: datos.get('nota').trim()
        });
        window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener');
        notificar('¡Pedido listo! Te llevamos a WhatsApp para confirmarlo.');
        vaciarCarrito();
        e.target.reset();
        render();
    });

    render();
};
