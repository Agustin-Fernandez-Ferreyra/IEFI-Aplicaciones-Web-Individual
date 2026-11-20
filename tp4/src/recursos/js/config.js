// Configuración central del sitio. Modificá solo este archivo.
export const CONFIG = {
    whatsapp: '543511234567',          // Número con código de país, sin + ni espacios
    maxPorProducto: 10,
    envio: {
        gratisDesde: 50000,            // Envío gratis desde este monto (coincide con el texto del inicio)
        tarifaLocal: 3500,             // Tarifa para la provincia local
        tarifaResto: 6500,             // Tarifa para el resto del país
        provinciaLocal: 'cordoba'
    },
    // Credenciales de EmailJS (https://www.emailjs.com). La Public Key está pensada para ser pública.
    emailjs: {
        serviceId: 'TU_SERVICE_ID',
        templateId: 'TU_TEMPLATE_ID',
        publicKey: 'TU_PUBLIC_KEY'
    }
};
