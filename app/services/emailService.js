import { Resend } from 'resend';

const resend = new Resend('re_NKsXJ8rk_BTWigTH4WFTAhKiVnnoiYnMe');

// Implementación del servicio de correo usando Firebase Functions
export const sendPresupuestoEmail = async (userData, planData) => {
  try {
    const response = await fetch('https://tfg-seguros-mascota-2u6ew1ec1.vercel.app/api/send', {
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