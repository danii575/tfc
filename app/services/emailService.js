import { Resend } from 'resend';

const resend = new Resend('re_cgK6Yqpy_Ffcjo1jHTbJaoX4yd7R8EWZ6');

// Implementación del servicio de correo usando Firebase Functions
export const sendPresupuestoEmail = async (userData, planData) => {
  try {
    const response = await fetch('/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userData, planData }),
    });

    if (!response.ok) {
      throw new Error('Error al enviar el correo');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    throw error;
  }
}; 