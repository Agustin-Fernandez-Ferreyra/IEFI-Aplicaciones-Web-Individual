const formato = new Intl.NumberFormat('es-AR', { useGrouping: 'always' });

// 49999 -> "$49.999"
export const formatearPrecio = (numero) => `$${formato.format(numero)}`;

export const calcularPrecioFinal = (producto) =>
    Math.round(producto.precio * (1 - producto.descuento));

// Minúsculas y sin tildes, para buscar "proteina" y encontrar "Proteínas"
export const normalizarTexto = (texto) =>
    String(texto).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

// Notificación en la interfaz (toast)
export const notificar = (mensaje, tipo = 'exito') => {
    let contenedor = document.getElementById('notificaciones');
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.id = 'notificaciones';
        contenedor.setAttribute('role', 'status');
        contenedor.setAttribute('aria-live', 'polite');
        document.body.appendChild(contenedor);
    }
    const aviso = document.createElement('p');
    aviso.className = `notificacion notificacion-${tipo}`;
    aviso.textContent = mensaje;
    contenedor.appendChild(aviso);
    setTimeout(() => aviso.remove(), 3500);
};
