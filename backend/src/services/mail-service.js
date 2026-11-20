// backend/src/services/mail-service.js
// Envío de mails con Nodemailer.
//
// - Con MAIL_USER y MAIL_PASS en el .env, manda por Gmail (MAIL_PASS es una
//   "contraseña de aplicación" de Google, no la contraseña normal).
// - Sin esas variables, usa una cuenta de prueba de Ethereal: el mail no llega
//   a nadie, pero en la consola aparece un link para verlo.
//
// enviarAsync puede tirar: quien lo llama lo envuelve en sinFallar().
import nodemailer from 'nodemailer';

let transporterPromise = null;

function getTransporter() {
    if (!transporterPromise) {
        transporterPromise = crearTransporter().catch((err) => {
            transporterPromise = null; // que el próximo envío lo reintente
            throw err;
        });
    }
    return transporterPromise;
}

async function crearTransporter() {
    if (process.env.MAIL_USER && process.env.MAIL_PASS) {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
        });
    }

    const cuenta = await nodemailer.createTestAccount();
    console.log('MAIL_USER/MAIL_PASS sin definir: los mails van a Ethereal (no llegan de verdad).');
    return nodemailer.createTransport({
        host: cuenta.smtp.host,
        port: cuenta.smtp.port,
        secure: cuenta.smtp.secure,
        auth: { user: cuenta.user, pass: cuenta.pass },
    });
}

export function escapeHtml(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export default class MailService {

    enviarAsync = async ({ para, asunto, texto, html }) => {
        if (!para) throw new Error('Falta el destinatario del mail');

        const transporter = await getTransporter();
        const info = await transporter.sendMail({
            from: `"LaburApp" <${process.env.MAIL_USER || 'no-reply@laburapp.test'}>`,
            to: para,
            subject: asunto,
            text: texto,
            html,
        });

        const preview = nodemailer.getTestMessageUrl(info);
        if (preview) console.log(`Mail de prueba a ${para}: ${preview}`);
        return info;
    }

    // Al trabajador: lo aceptaron para un trabajo.
    enviarPostulacionAceptadaAsync = async ({ email, nombre, tituloTrabajo }) => {
        const saludo = nombre ? `¡Hola, ${nombre}!` : '¡Hola!';
        const asunto = `¡Te aceptaron para "${tituloTrabajo}"!`;

        await this.enviarAsync({
            para: email,
            asunto,
            texto: `${saludo}\n\nEl contratador te aceptó para el trabajo "${tituloTrabajo}".\n`
                + 'Entrá a LaburApp para ver los detalles y coordinar con el contratador.\n\n'
                + 'El equipo de LaburApp',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #222;">
                    <h2 style="color: #2e7d32;">${escapeHtml(saludo)}</h2>
                    <p>El contratador te aceptó para el trabajo <strong>"${escapeHtml(tituloTrabajo)}"</strong>.</p>
                    <p>Entrá a LaburApp para ver los detalles y coordinar con el contratador.</p>
                    <p style="color: #777; font-size: 13px;">El equipo de LaburApp</p>
                </div>
            `,
        });
    }
}
