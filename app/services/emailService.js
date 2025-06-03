export const sendPresupuestoEmail = async (userData, planData) => {
  try {
    console.log('Iniciando envío de presupuesto:', { userData, planData });
    
    // Determinar la URL base según el entorno
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://tfg-lime.vercel.app';
    const apiUrl = `${baseUrl}/api/send`;
    
    console.log('Enviando petición a:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify({ userData, planData }),
    });

    console.log('Respuesta recibida:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('Datos de respuesta:', data);

    if (!response.ok) {
      // Manejar diferentes tipos de errores
      if (response.status === 400) {
        throw new Error(data.error || 'El correo electrónico no es válido');
      }
      if (response.status === 429) {
        throw new Error('Demasiados intentos de envío. Por favor, espera unos minutos antes de intentarlo de nuevo.');
      }
      if (response.status === 500) {
        if (data.error?.includes('dominio')) {
          throw new Error('Error de configuración del servicio de correo. Por favor, contacta con soporte.');
        }
        throw new Error(data.error || 'Error interno del servidor al enviar el correo');
      }
      throw new Error(data.error || 'Error al enviar el correo');
    }

    return data;
  } catch (error) {
    console.error('Error detallado al enviar el correo:', error);
    throw new Error(`Error al enviar el presupuesto: ${error.message}`);
  }
}; 