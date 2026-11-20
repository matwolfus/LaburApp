// backend/src/domain/fechas.js
// Reglas de fechas del dominio. programado_para se guarda en hora argentina
// sin zona horaria ('YYYY-MM-DDTHH:MM:SS'), así que todo se compara contra
// "ahora" en hora argentina, nunca contra la hora del servidor (UTC).
import { ZONA_HORARIA } from '../repositories/sql-fechas.js';

// 'YYYY-MM-DDTHH:MM:SS' de ahora en hora argentina.
export function ahoraArgentina() {
    return new Date().toLocaleString('sv-SE', { timeZone: ZONA_HORARIA }).replace(' ', 'T');
}

// ¿Ya pasó la fecha programada? Sin horario elegido (00:00) vence recién
// cuando termina el día: misma regla que expirarVencidos() en trabajos-repository.
export function esFechaPasada(programadoPara) {
    if (programadoPara == null) return false;
    const ahora = ahoraArgentina();
    const [fecha, hora] = String(programadoPara).split('T');
    const sinHorario = !hora || hora.startsWith('00:00');
    return sinHorario ? fecha < ahora.slice(0, 10) : String(programadoPara) < ahora;
}

// 'YYYY-MM-DDTHH:MM' (sin segundos) para comparar una fecha del form contra la base.
export function normalizarFecha(valor) {
    if (valor == null) return null;
    return String(valor).replace(' ', 'T').slice(0, 16);
}
