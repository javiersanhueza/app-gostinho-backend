const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Configuración del transportador de Nodemailer.
 * Si las variables SMTP_* no están en el .env, usa Ethereal Mail para pruebas locales.
 */
let transporter;

const iniciarTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    // Usar SMTP real (ej. Gmail, SendGrid, etc.)
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465, // true para puerto 465, false para otros
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('✉️ Servicio de correos inicializado (SMTP Real)');
  } else {
    // Usar Ethereal de prueba si no hay credenciales (Local dev o Render sin configurar)
    console.warn('⚠️ No se encontraron variables SMTP en el entorno. Creando cuenta Ethereal de prueba...');
    let testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('✉️ Servicio de correos inicializado (Ethereal Prueba)');
  }
};

// Inicializamos al cargar
iniciarTransporter();

/**
 * Envía el correo de recuperación
 * @param {string} email Destinatario
 * @param {string} token Token generado
 * @param {string} id ID del usuario
 */
const enviarCorreoRecuperacion = async (email, token, id) => {
  // Asegurarnos de que está inicializado
  if (!transporter) await iniciarTransporter();

  // URL del frontend. Puede cambiar entre dev y prod.
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:9000';
  const enlaceRecuperacion = `${frontendUrl}/reset-password?token=${token}&id=${id}`;

  const mailOptions = {
    from: '"Soporte Gostinho" <no-reply@gostinho.com>',
    to: email,
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
  };

  const info = await transporter.sendMail(mailOptions);
  
  // Si estamos usando Ethereal, imprimimos la URL para ver el correo
  if (!process.env.SMTP_HOST) {
    console.log('📧 Correo de prueba enviado. Puedes verlo aquí:', nodemailer.getTestMessageUrl(info));
  }

  return info;
};

module.exports = {
  enviarCorreoRecuperacion
};
