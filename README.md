🐾 PetCare Seguros
🌐 Demo en línea

🔗 https://aseguradora1.netlify.app

🧭 Descripción (ES)

PetCare Seguros es una aplicación web desarrollada como Trabajo Fin de Ciclo (TFC) del grado superior en Desarrollo de Aplicaciones Multiplataforma.
Su objetivo es digitalizar la gestión de seguros veterinarios para pequeñas y medianas empresas, ofreciendo una plataforma moderna, intuitiva y completamente funcional.

La aplicación permite visualizar planes de seguros, gestionar usuarios autenticados, simular compras con pasarela de pago (modo prueba) y enviar notificaciones automáticas por correo electrónico.

🎯 Objetivos principales

Desarrollar una web funcional, accesible y moderna.

Permitir la gestión digital de usuarios y pólizas mediante una interfaz intuitiva.

Implementar un sistema de autenticación seguro con Firebase Authentication.

Gestionar datos de usuarios, productos y carritos en Firebase Firestore.

Integrar una pasarela de pago simulada con Stripe (modo test).

Configurar notificaciones automáticas mediante el servicio Resend (via endpoint serverless en Vercel).

Desplegar la aplicación en Netlify, con integración continua desde GitHub.

Garantizar responsividad y compatibilidad multiplataforma (React Native for Web + NativeWind).

⚙️ Tecnologías utilizadas

Frontend: React Native for Web + Expo + TypeScript

Estilos: NativeWind (Tailwind CSS adaptado a React Native)

Backend / Servicios: Firebase (Authentication + Firestore)

Pagos simulados: Stripe (modo prueba)

Notificaciones: Resend + Endpoint Serverless (Vercel)

Despliegue: Netlify

Control de versiones: Git & GitHub

Gestión del proyecto: JIRA + metodología Scrum

🧠 Desarrollo

El proyecto se planificó y ejecutó en fases semanales siguiendo un flujo Scrum:

Investigación y diseño de interfaz (UI/UX)

Desarrollo del frontend con React Native for Web

Integración del backend y configuración de Firebase

Implementación de pasarela de pago y notificaciones

Pruebas de integración, usabilidad y responsividad

Documentación y despliegue final en Netlify

La aplicación ha sido testeada en diferentes navegadores y resoluciones, garantizando una experiencia óptima en todos los dispositivos.

🧩 Problemas y soluciones aplicadas

Gestión del estado global en React Native for Web con múltiples componentes interdependientes.
🟢 Solución: Implementación de hooks personalizados y separación de contexto global.

Responsividad precisa con Tailwind (NativeWind) en distintos navegadores.
🟢 Solución: Ajuste de breakpoints y media queries específicas.

Errores en la API de Stripe y manejo de respuestas al usuario.
🟢 Solución: Validación de payloads y mensajes controlados de error.

Seguridad en variables de entorno y funciones serverless.
🟢 Solución: Configuración cifrada mediante Vercel Environment Variables.

Integración de Resend (correo) y manejo de errores de envío.
🟢 Solución: Control de estado y reintentos automáticos mediante hooks asíncronos.

💰 Coste académico y viabilidad

Horas totales estimadas: 320 h

Valor/hora (estimado académico): 25 €/h

Coste teórico total: ≈ 8.000 €

El proyecto demuestra la viabilidad técnica y económica de una transformación digital en el sector de seguros veterinarios.

🔒 Futuras mejoras

Migración a Firebase Blaze Plan para soportar mayor volumen de usuarios y datos.

Portal de administración avanzado para gestionar notificaciones y siniestros online.

Auditorías de seguridad con WAF y políticas CSP más estrictas.

Automatización de correos mediante Firebase Cloud Functions.

👤 Autor

Daniel Moreno Herrezuelo
📧 danielmorenoherrezuelo@gmail.com

🌍 GitHub: danii575

📍 Madrid, España

🌍 English Version
🧭 Overview

PetCare Seguros is a web application developed as a Final Degree Project (TFC) for the Multiplatform Application Development program.
Its goal is to digitally transform pet insurance management for small and medium-sized companies through an accessible, efficient, and modern web platform.

The app allows users to view insurance plans, manage accounts with secure authentication, simulate purchases using a test payment gateway, and receive automatic email notifications.

🎯 Main objectives

Build a functional, responsive, and user-friendly web app.

Enable digital user and policy management.

Implement Firebase Authentication for secure login and registration.

Store and manage data using Firebase Firestore.

Integrate a test payment gateway (Stripe).

Configure automatic email notifications via Resend + Vercel Serverless.

Deploy the application on Netlify with CI/CD from GitHub.

Ensure cross-platform responsiveness using React Native for Web + NativeWind.

⚙️ Technologies
Frontend	Backend	Services	Deployment
React Native for Web (Expo, TypeScript)	Firebase (Auth, Firestore)	Stripe (test), Resend (via Vercel)	Netlify
🚀 Development Process

Built following an agile Scrum methodology, covering all stages: design, implementation, testing, and deployment.
Extensive testing ensured compatibility across major browsers and screen sizes.

🧩 Key Challenges and Solutions

Global state management: solved via custom hooks and modular contexts.

Cross-browser responsiveness: improved via tailored Tailwind breakpoints.

Stripe integration: handled API errors and user feedback with validations.

Environment variables security: implemented encrypted configs in Vercel.

Email notifications: improved reliability with async retry logic.

🔮 Future Improvements

Upgrade to Firebase Blaze Plan.

Add admin portal for claim management and notifications.

Strengthen security audits and content policies.

Automate email system using Firebase Cloud Functions.

👨‍💻 Author

Daniel Moreno Herrezuelo
📧 danielmorenoherrezuelo@gmail.com

🌍 GitHub: danii575

📍 Madrid, Spain
