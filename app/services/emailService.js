export const sendPresupuestoEmail = async (userData, planData) => {
  try {
    console.log('Iniciando envío de presupuesto:', { userData, planData });
    
    const response = await fetch('https://tfg-seguros-mascota-2u6ew1ec1.vercel.app/api/send', {
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
      throw new Error(data.error || 'Error al enviar el correo');
    }

    return data;
  } catch (error) {
    console.error('Error detallado al enviar el correo:', error);
    throw new Error(`Error al enviar el presupuesto: ${error.message}`);
  }
}; 