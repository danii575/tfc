const { Resend } = require('resend');

// Verificar que la API key existe
if (!process.env.RESEND_API_KEY) {
  console.error('ERROR: RESEND_API_KEY no está definida en las variables de entorno');
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Función para validar email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

module.exports = async (req, res) => {
  console.log('=== INICIO DE LA PETICIÓN DE ENVÍO DE CORREO ===');
  console.log('Headers recibidos:', req.headers);
  console.log('Método:', req.method);
  console.log('Body recibido:', JSON.stringify(req.body, null, 2));
  
  // Configurar headers CORS para permitir múltiples orígenes
  const allowedOrigins = [
    'http://localhost:8081',
    'http://localhost:3000',
    'https://tfg-lime.vercel.app',
    'https://petcareseguros.vercel.app'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejar preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { userData, planData } = req.body;
    const { nombre, apellidos, email, telefono, mascotas } = userData;
    const { nombre: planNombre, precio, features } = planData;

    if (!email) {
      return res.status(400).json({ error: 'No se ha proporcionado un correo electrónico' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'El formato del correo electrónico no es válido' });
    }

    const mascotasHtml = mascotas.map(mascota => `
      <div style="margin-bottom: 10px;">
        <p><strong>Nombre:</strong> ${mascota.nombre}</p>
        <p><strong>Especie:</strong> ${mascota.especie}</p>
        <p><strong>Raza:</strong> ${mascota.raza}</p>
      </div>
    `).join('');

    const featuresHtml = features.map(feature => `
      <li style="padding: 5px 0; display: flex; align-items: center;">
        <span style="color: #2A9D8F; margin-right: 10px;">✓</span>
        ${feature}
      </li>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Presupuesto PetCareSeguros</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #2A9D8F; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; text-align: center;">PetCareSeguros</h1>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #264653; margin-top: 0;">¡Gracias por tu interés en PetCareSeguros!</h2>
              <p>Hola ${nombre} ${apellidos},</p>
              <p>Adjunto encontrarás el presupuesto detallado para tu seguro de mascotas.</p>
            </div>

            <div style="background-color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #dee2e6;">
              <h3 style="color: #264653; margin-top: 0;">Datos del Cliente</h3>
              <p><strong>Nombre:</strong> ${nombre} ${apellidos}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Teléfono:</strong> ${telefono}</p>
            </div>

            <div style="background-color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #dee2e6;">
              <h3 style="color: #264653; margin-top: 0;">Mascotas Aseguradas</h3>
              ${mascotasHtml}
            </div>

            <div style="background-color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #dee2e6;">
              <h3 style="color: #264653; margin-top: 0;">Plan Seleccionado: ${planNombre}</h3>
              <p style="font-size: 24px; color: #2A9D8F; font-weight: bold;">${precio}</p>
              
              <h4 style="color: #264653;">Coberturas Incluidas:</h4>
              <ul style="list-style-type: none; padding: 0;">
                ${featuresHtml}
              </ul>
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center;">
              <p style="margin: 0;">Si tienes alguna pregunta, no dudes en contactarnos:</p>
              <p style="margin: 10px 0 0 0;">
                <strong>Email:</strong> info@resend.dev<br>
                <strong>Teléfono:</strong> +34 900 123 456
              </p>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
              <p>© ${new Date().getFullYear()} PetCareSeguros S.L. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log('Intentando enviar correo a:', email);
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: [email],
      subject: `Presupuesto PetCareSeguros - Plan ${planNombre}`,
      html: htmlContent,
    });

    if (error) {
      console.error('Error detallado al enviar el correo:', error);
      return res.status(500).json({ error: 'Error al enviar el correo', details: error });
    }

    console.log('Correo enviado exitosamente:', data);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error completo:', error);
    return res.status(500).json({ error: 'Error al enviar el correo', details: error.message });
  }
}; 