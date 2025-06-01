export const sendPresupuestoEmail = async (userData, planData) => {
  try {
    console.log('Iniciando envío de presupuesto:', { userData, planData });
    
    const response = await fetch('https://tfg-lime.vercel.app/api/send', {
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
      throw new Error(data.error || 'Error al enviar el correo');
    }

    return data;
  } catch (error) {
    console.error('Error detallado al enviar el correo:', error);
    throw new Error(`Error al enviar el presupuesto: ${error.message}`);
  }
}; 