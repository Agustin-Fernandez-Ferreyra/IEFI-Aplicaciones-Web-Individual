// Punto de entrada: detecta en qué página estamos e inicializa solo lo necesario.
import { cargarProductos } from './productos.js';
import { iniciarCatalogo, renderizarDestacados, renderizarDetalle, renderizarOfertas, obtenerProductoPorId } from './catalogo.js';
import { agregarAlCarrito, actualizarContador, iniciarCarrito } from './carrito.js';
import { iniciarContacto } from './contacto.js';
import { notificar } from './utilidades.js';

const $ = (id) => document.getElementById(id);

// Buscador del encabezado: en el catálogo filtra en vivo; en otras páginas redirige al catálogo
const iniciarBuscador = () => {
    const formulario = document.querySelector('.barra-busqueda');
    const campo = $('id_buscar');
    if (!formulario || !campo) return;
    formulario.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!$('contenedor-productos')) {
            window.location.href = `./catalogo.html?busqueda=${encodeURIComponent(campo.value.trim())}`;
        }
    });
};

// Botones "Agregar al carrito" (ofertas y detalle) con delegación de eventos
const iniciarAgregarAlCarrito = () => {
    document.addEventListener('click', (e) => {
        const id = e.target.dataset?.agregar;
        if (!id) return;
        agregarAlCarrito(Number(id));
        notificar('Producto agregado al carrito.');
    });
    document.addEventListener('submit', (e) => {
        if (e.target.id !== 'form-agregar') return;
        e.preventDefault();
        agregarAlCarrito(Number(e.target.dataset.id), Number(e.target.cantidad.value));
        notificar('Producto agregado al carrito.');
    });
};

const iniciar = async () => {
    actualizarContador();
    iniciarBuscador();
    iniciarAgregarAlCarrito();
    if ($('formulario-contacto')) iniciarContacto();

    const necesitaProductos = ['contenedor-productos', 'contenedor-destacados', 'contenedor-detalle', 'contenedor-ofertas', 'lista-carrito'].some($);
    if (!necesitaProductos) return;

    try {
        const productos = await cargarProductos();

        if ($('contenedor-productos')) iniciarCatalogo(productos);
        if ($('contenedor-destacados')) renderizarDestacados($('contenedor-destacados'), productos);
        if ($('contenedor-ofertas')) renderizarOfertas($('contenedor-ofertas'), productos);
        if ($('lista-carrito')) iniciarCarrito(productos);
        if ($('contenedor-detalle')) {
            const id = parseInt(new URLSearchParams(window.location.search).get('id'));
            renderizarDetalle($('contenedor-detalle'), obtenerProductoPorId(id, productos), productos);
        }
    } catch (error) {
        console.error(error);
        notificar('No pudimos cargar los productos. Intentá de nuevo más tarde.', 'error');
    }
};

iniciar();
