import { CONFIG } from './config.js';
import { notificar } from './utilidades.js';

// Construye el objeto JSON con los datos del formulario
export const construirJSONContacto = (formulario) => {
    const datos = new FormData(formulario);
    return {
        nombre: datos.get('nombre').trim(),
        apellido: datos.get('apellido').trim(),
        correo: datos.get('correo').trim(),
        telefono: datos.get('telefono').trim(),
        comentario: datos.get('comentario').trim(),
        fecha: new Date().toISOString()
    };
};

// Validación por JavaScript (segunda capa, además de los atributos HTML)
export const validarContacto = (datos) => {
    const errores = [];
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const regexTelefono = /^[0-9+\s()-]{8,15}$/;

    if (datos.nombre.length < 2) errores.push('El nombre debe tener al menos 2 caracteres.');
    if (datos.apellido.length < 2) errores.push('El apellido debe tener al menos 2 caracteres.');
    if (!regexEmail.test(datos.correo)) errores.push('Ingresá un correo electrónico válido.');
    if (datos.telefono !== '' && !regexTelefono.test(datos.telefono)) {
        errores.push('El teléfono solo puede tener números, espacios, +, ( ) y -, entre 8 y 15 caracteres.');
    }
    if (datos.comentario.length < 10) errores.push('El mensaje debe tener al menos 10 caracteres.');
    return errores;
};

// Envío real de email con EmailJS (API REST + fetch)
export const enviarContacto = async (datos) => {
    const { serviceId, templateId, publicKey } = CONFIG.emailjs;
    if (serviceId.startsWith('TU_')) {
        throw new Error('EmailJS no está configurado. Completá las credenciales en config.js');
    }
    const respuesta = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            service_id: serviceId,
            template_id: templateId,
            user_id: publicKey,
            template_params: {
                nombre: `${datos.nombre} ${datos.apellido}`,
                correo: datos.correo,
                telefono: datos.telefono || 'No indicado',
                comentario: datos.comentario,
                fecha: datos.fecha
            }
        })
    });
    if (!respuesta.ok) {
        throw new Error(`Error del servidor: ${respuesta.status} ${await respuesta.text()}`);
    }
    return await respuesta.text(); // EmailJS responde "OK"
};

export const mostrarMensajeContacto = (contenedor, mensajes, esError) => {
    contenedor.innerHTML = `<ul class="${esError ? 'mensaje-error' : 'mensaje-exito'}">
        ${mensajes.map(m => `<li>${m}</li>`).join('')}</ul>`;
};

export const iniciarContacto = () => {
    const formulario = document.getElementById('formulario-contacto');
    const mensaje = document.getElementById('mensaje-formulario');
    const boton = formulario.querySelector('button[type="submit"]');

    formulario.addEventListener('submit', async (e) => {
        e.preventDefault();
        const datos = construirJSONContacto(formulario);
        const errores = validarContacto(datos);
        if (errores.length > 0) return mostrarMensajeContacto(mensaje, errores, true);

        boton.disabled = true;
        boton.textContent = 'Enviando...';
        try {
            await enviarContacto(datos);
            mostrarMensajeContacto(mensaje, ['¡Gracias! Tu consulta fue enviada correctamente.'], false);
            notificar('Consulta enviada correctamente.');
            formulario.reset();
        } catch (error) {
            console.error(error);
            mostrarMensajeContacto(mensaje, ['No pudimos enviar tu consulta. Intentá de nuevo más tarde.'], true);
            notificar('No se pudo enviar la consulta.', 'error');
        } finally {
            boton.disabled = false;
            boton.textContent = 'Enviar';
        }
    });
    formulario.addEventListener('reset', () => { mensaje.innerHTML = ''; });
};
