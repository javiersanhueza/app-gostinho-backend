const { Resend } = require('resend');
require('dotenv').config();

let resend;

const iniciarServicio = () => {
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_')) {
    resend = new Resend(process.env.RESEND_API_KEY);
    console.log('✉️ Servicio de correos inicializado (Resend SDK)');
  } else {
    console.warn('⚠️ No se encontró RESEND_API_KEY válido en el .env. Los correos no se enviarán.');
  }
};

iniciarServicio();

/**
 * Envía el correo de recuperación
 * @param {string} email Destinatario
 * @param {string} token Token generado
 * @param {string} id ID del usuario
 */
const enviarCorreoRecuperacion = async (email, token, id) => {
  if (!resend) {
    console.error('❌ Error: Resend no está configurado. Simulación de correo a:', email);
    return;
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:9000';
  const enlaceRecuperacion = `${frontendUrl}/reset-password?token=${token}&id=${id}`;

  try {
    const data = await resend.emails.send({
      from: 'Soporte Gostinho <onboarding@resend.dev>',
      to: [email],
      subject: 'Recuperación de Contraseña - Gostinho',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6a1b9a;">Hola,</h2>
          <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <b>Gostinho</b>.</p>
          <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${enlaceRecuperacion}" style="background-color: #6a1b9a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Restablecer Contraseña
            </a>
          </div>
          <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #555;">${enlaceRecuperacion}</p>
          <br>
          <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888; text-align: center;">© 2026 Gostinho Orders. Todos los derechos reservados.</p>
        </div>
      `,
    });

    console.log('📧 Correo enviado con Resend SDK:', data);
    return data;
  } catch (error) {
    console.error('❌ Error enviando correo con Resend:', error);
    throw error;
  }
};

module.exports = {
  enviarCorreoRecuperacion
};
