const CLAVE_USUARIOS = 'apexfit_usuarios';
const CLAVE_SESION_LOCAL = 'apexfit_sesion';
const CLAVE_SESION_TEMPORAL = 'apexfit_sesion_temporal';

const normalizarEmail = (email) => String(email).trim().toLowerCase().normalize('NFC');

const leerUsuarios = () => {
    try {
        const usuarios = JSON.parse(localStorage.getItem(CLAVE_USUARIOS));
        return Array.isArray(usuarios) ? usuarios : [];
    } catch (error) {
        console.error('No se pudieron leer las cuentas locales', error);
        return [];
    }
};

const guardarUsuarios = (usuarios) => {
    localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios));
};

const encriptarContraseña = async (email, password) => {
    if (!window.crypto?.subtle) {
        throw new Error('Tu navegador no permite guardar contraseñas de forma segura.');
    }
    const bytes = new TextEncoder().encode(`${email}:apexfit:${password}`);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
};

const mostrarMensaje = (tipo, mensaje) => {
    const contenedor = document.getElementById('auth-mensaje');
    contenedor.innerHTML = `<p class="${tipo === 'error' ? 'mensaje-error' : 'mensaje-exito'}">${mensaje}</p>`;
};

const limpiarMensaje = () => {
    document.getElementById('auth-mensaje').innerHTML = '';
};

const obtenerSesion = () => {
    try {
        const datos = localStorage.getItem(CLAVE_SESION_LOCAL)
            ?? sessionStorage.getItem(CLAVE_SESION_TEMPORAL);
        return datos ? JSON.parse(datos) : null;
    } catch (error) {
        console.error('No se pudo recuperar la sesión', error);
        return null;
    }
};

const guardarSesion = (usuario, recordar) => {
    const sesion = { id: usuario.id, nombre: usuario.nombre, email: usuario.email };
    localStorage.removeItem(CLAVE_SESION_LOCAL);
    sessionStorage.removeItem(CLAVE_SESION_TEMPORAL);
    if (recordar) localStorage.setItem(CLAVE_SESION_LOCAL, JSON.stringify(sesion));
    else sessionStorage.setItem(CLAVE_SESION_TEMPORAL, JSON.stringify(sesion));
};

const cerrarSesion = () => {
    localStorage.removeItem(CLAVE_SESION_LOCAL);
    sessionStorage.removeItem(CLAVE_SESION_TEMPORAL);
};

const mostrarVista = (vista) => {
    const nombres = ['login', 'registro', 'recuperacion', 'perfil'];
    nombres.forEach(nombre => {
        const panel = document.getElementById(`panel-${nombre}`);
        if (panel) panel.hidden = nombre !== vista;
    });

    document.getElementById('auth-pestañas').hidden = !['login', 'registro'].includes(vista);
    document.querySelectorAll('.auth-pestaña').forEach(pestaña => {
        const activa = pestaña.dataset.vista === vista;
        pestaña.classList.toggle('activa', activa);
        pestaña.setAttribute('aria-selected', String(activa));
    });
    limpiarMensaje();
};

const mostrarPerfil = (sesion) => {
    mostrarVista('perfil');
    document.getElementById('perfil-nombre').textContent = sesion.nombre;
    document.getElementById('perfil-email').textContent = sesion.email;
    const inicial = sesion.nombre.trim().charAt(0).toUpperCase() || 'A';
    document.querySelector('.perfil-avatar').textContent = inicial;

    const enlacePerfil = document.querySelector('.iconos-derecha a[href="./login.html"]');
    if (enlacePerfil) {
        enlacePerfil.setAttribute('aria-label', `Sesión iniciada como ${sesion.nombre}`);
        enlacePerfil.title = sesion.nombre;
    }
};

export const iniciarAutenticacion = () => {
    const sesion = obtenerSesion();
    if (sesion) mostrarPerfil(sesion);
    else mostrarVista('login');

    document.querySelectorAll('[data-vista]').forEach(control => {
        control.addEventListener('click', () => mostrarVista(control.dataset.vista));
    });

    document.getElementById('cerrar-sesion').addEventListener('click', () => {
        cerrarSesion();
        const enlacePerfil = document.querySelector('.iconos-derecha a[href="./login.html"]');
        if (enlacePerfil) {
            enlacePerfil.removeAttribute('title');
            enlacePerfil.setAttribute('aria-label', 'Ir al perfil de usuario');
        }
        mostrarVista('login');
        mostrarMensaje('exito', 'Sesión cerrada correctamente.');
    });

    document.getElementById('formulario-login').addEventListener('submit', async (event) => {
        event.preventDefault();
        const datos = new FormData(event.currentTarget);
        const email = normalizarEmail(datos.get('email'));
        const password = String(datos.get('password'));
        const recordar = datos.get('recordar') === 'on';

        try {
            const passwordHash = await encriptarContraseña(email, password);
            const usuario = leerUsuarios().find(cuenta =>
                cuenta.email === email && cuenta.passwordHash === passwordHash
            );

            if (!usuario) {
                mostrarMensaje('error', 'El correo o la contraseña no son correctos.');
                return;
            }

            guardarSesion(usuario, recordar);
            mostrarPerfil(obtenerSesion());
            mostrarMensaje('exito', `Bienvenido, ${usuario.nombre}.`);
        } catch (error) {
            console.error(error);
            mostrarMensaje('error', error.message);
        }
    });

    document.getElementById('formulario-registro').addEventListener('submit', async (event) => {
        event.preventDefault();
        const datos = new FormData(event.currentTarget);
        const nombre = String(datos.get('nombre')).trim();
        const email = normalizarEmail(datos.get('email'));
        const password = String(datos.get('password'));
        const confirmar = String(datos.get('confirmar'));

        if (nombre.length < 2) {
            mostrarMensaje('error', 'Ingresá tu nombre y apellido.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            mostrarMensaje('error', 'Ingresá un correo electrónico válido.');
            return;
        }
        if (password.length < 8) {
            mostrarMensaje('error', 'La contraseña debe tener al menos 8 caracteres.');
            return;
        }
        if (password !== confirmar) {
            mostrarMensaje('error', 'Las contraseñas no coinciden.');
            return;
        }

        try {
            const usuarios = leerUsuarios();
            if (usuarios.some(usuario => usuario.email === email)) {
                mostrarMensaje('error', 'Ya existe una cuenta con ese correo.');
                return;
            }

            const usuario = {
                id: globalThis.crypto?.randomUUID?.() ?? `usuario-${Date.now()}`,
                nombre,
                email,
                passwordHash: await encriptarContraseña(email, password),
                creadoEn: new Date().toISOString()
            };
            usuarios.push(usuario);
            guardarUsuarios(usuarios);
            event.currentTarget.reset();
            mostrarVista('login');
            document.getElementById('id_email').value = email;
            mostrarMensaje('exito', 'Cuenta creada correctamente. Ya podés iniciar sesión.');
        } catch (error) {
            console.error(error);
            mostrarMensaje('error', error.message);
        }
    });

    document.getElementById('formulario-recuperacion').addEventListener('submit', async (event) => {
        event.preventDefault();
        const datos = new FormData(event.currentTarget);
        const email = normalizarEmail(datos.get('email'));
        const password = String(datos.get('password'));
        const confirmar = String(datos.get('confirmar'));

        if (password.length < 8) {
            mostrarMensaje('error', 'La nueva contraseña debe tener al menos 8 caracteres.');
            return;
        }
        if (password !== confirmar) {
            mostrarMensaje('error', 'Las contraseñas no coinciden.');
            return;
        }

        try {
            const usuarios = leerUsuarios();
            const usuario = usuarios.find(cuenta => cuenta.email === email);
            if (!usuario) {
                mostrarMensaje('error', 'No existe una cuenta local con ese correo.');
                return;
            }

            usuario.passwordHash = await encriptarContraseña(email, password);
            usuario.actualizadaEn = new Date().toISOString();
            guardarUsuarios(usuarios);
            event.currentTarget.reset();
            mostrarVista('login');
            document.getElementById('id_email').value = email;
            mostrarMensaje('exito', 'Contraseña restablecida correctamente.');
        } catch (error) {
            console.error(error);
            mostrarMensaje('error', error.message);
        }
    });
};
