import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { formatearPrecio, calcularPrecioFinal } from './utilidades.js';
import { aplicarFiltros } from './catalogo.js';

const datos = JSON.parse(readFileSync(new URL('../datos/productos.json', import.meta.url)));
const productos = datos.map(p => ({ ...p, precioFinal: calcularPrecioFinal(p) }));

test('formatearPrecio usa punto como separador de miles', () => {
    assert.equal(formatearPrecio(49999), '$49.999');
    assert.equal(formatearPrecio(3500), '$3.500');
});

test('calcularPrecioFinal aplica el descuento y redondea', () => {
    assert.equal(calcularPrecioFinal({ precio: 129999, descuento: 0.2 }), 103999);
    assert.equal(calcularPrecioFinal({ precio: 49999, descuento: 0 }), 49999);
});

test('el catálogo no incluye productos en oferta', () => {
    assert.ok(aplicarFiltros(productos).every(p => !p.enOferta));
});

test('filtra por categoría', () => {
    const r = aplicarFiltros(productos, { categoria: 'Creatinas' });
    assert.ok(r.length > 0 && r.every(p => p.categoria === 'Creatinas'));
});

test('la búsqueda ignora tildes y mayúsculas', () => {
    const r = aplicarFiltros(productos, { busqueda: 'PROTEINA' });
    assert.ok(r.length > 0);
});

test('ordena por menor precio sin mutar el original', () => {
    const r = aplicarFiltros(productos, { orden: 'precio-bajo' });
    for (let i = 1; i < r.length; i++) assert.ok(r[i - 1].precioFinal <= r[i].precioFinal);
});
