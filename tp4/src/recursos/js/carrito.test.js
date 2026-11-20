import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularEnvio, detallarCarrito, construirMensajePedido } from './carrito.js';
import { validarContacto } from './contacto.js';

const productos = [{ id: 1, nombre: 'Whey', precioFinal: 20000 }, { id: 2, nombre: 'Creatina', precioFinal: 40000 }];

test('envío: sin provincia no se calcula', () => assert.equal(calcularEnvio(10000, ''), null));
test('envío: gratis desde $50.000', () => assert.equal(calcularEnvio(50000, 'salta'), 0));
test('envío: tarifa local y resto del país', () => {
    assert.equal(calcularEnvio(10000, 'cordoba'), 3500);
    assert.equal(calcularEnvio(10000, 'salta'), 6500);
});

test('detallarCarrito calcula subtotales e ignora productos inexistentes', () => {
    const r = detallarCarrito([{ id: 1, cantidad: 2 }, { id: 99, cantidad: 1 }], productos);
    assert.equal(r.length, 1);
    assert.equal(r[0].subtotal, 40000);
});

test('el mensaje de WhatsApp incluye nombre, productos y total', () => {
    const lineas = detallarCarrito([{ id: 1, cantidad: 2 }], productos);
    const m = construirMensajePedido({ nombre: 'Ana', lineas, subtotal: 40000, envio: 3500, provincia: 'Córdoba', nota: '' });
    assert.match(m, /Ana/);
    assert.match(m, /2 x Whey/);
    assert.match(m, /Total: \$43\.500/);
});

const valido = { nombre: 'Ana', apellido: 'Gómez', correo: 'ana@mail.com', telefono: '', comentario: 'Consulta de prueba larga' };
test('contacto: datos válidos no generan errores', () => assert.deepEqual(validarContacto(valido), []));
test('contacto: detecta email inválido y mensaje corto', () => {
    assert.equal(validarContacto({ ...valido, correo: 'ana@', comentario: 'hola' }).length, 2);
});
test('contacto: el teléfono es opcional pero se valida si se completa', () => {
    assert.equal(validarContacto({ ...valido, telefono: 'abc' }).length, 1);
});
