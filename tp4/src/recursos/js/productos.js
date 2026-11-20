import { calcularPrecioFinal } from './utilidades.js';

const URL_PRODUCTOS = './recursos/datos/productos.json';
let cache = null;

// Obtiene los productos desde el JSON con fetch. Lanza error si falla (se captura en index.js).
export const cargarProductos = async () => {
    if (cache) return cache;

    const respuesta = await fetch(URL_PRODUCTOS);
    if (!respuesta.ok) {
        throw new Error(`No se pudo cargar el catálogo (HTTP ${respuesta.status})`);
    }
    const datos = await respuesta.json();
    cache = datos.map(producto => ({ ...producto, precioFinal: calcularPrecioFinal(producto) }));
    return cache;
};
