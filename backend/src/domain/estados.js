// backend/src/domain/estados.js
// Única definición de los estados del dominio y de qué cambios de estado
// están permitidos. Los servicios consultan esto en vez de repetir listas
// de estados ('abierto', 'activa'...) en cada archivo.
//
// Si se agrega un estado nuevo, también hay que sumarlo al CHECK de la tabla
// (ver db/migracion-p3-dominio.sql).
import { HttpError } from '../helpers/http-error.js';

// =========================================================
// TRABAJOS
// =========================================================

export const ESTADO_TRABAJO = Object.freeze({
    ABIERTO:    'abierto',     // publicado, recibe postulaciones (DEFAULT de la tabla)
    ACTIVA:     'activa',      // hay un trabajador aceptado (contrato activo)
    EN_ESPERA:  'en_espera',   // el aceptado se bajó: el contratador decide si reabre
    FINALIZADO: 'finalizado',  // el contratador lo marcó como completado
    CANCELADO:  'cancelado',   // el contratador lo canceló
    VENCIDO:    'vencido',     // pasó la fecha sin que se aceptara a nadie
});

// Máquina de estados: desde cada estado, a cuáles se puede pasar.
//   abierto   -> activa (aceptar) | cancelado | vencido (pasa la fecha)
//   activa    -> finalizado (completar) | cancelado | en_espera (el aceptado se baja)
//   en_espera -> abierto (reabrir) | cancelado
//   vencido   -> abierto (editar con fecha nueva) | cancelado
//   finalizado, cancelado -> nada (estados finales)
const TRANSICIONES_TRABAJO = Object.freeze({
    abierto:    ['activa', 'cancelado', 'vencido'],
    activa:     ['finalizado', 'cancelado', 'en_espera'],
    en_espera:  ['abierto', 'cancelado'],
    vencido:    ['abierto', 'cancelado'],
    finalizado: [],
    cancelado:  [],
});

export function puedeCambiarEstadoTrabajo(desde, hacia) {
    return TRANSICIONES_TRABAJO[desde]?.includes(hacia) ?? false;
}

// Mensaje para el usuario cuando una acción no aplica al estado actual.
const MOTIVO_ESTADO_TRABAJO = Object.freeze({
    abierto:    'todavía está buscando trabajador',
    activa:     'ya tiene un trabajador aceptado',
    en_espera:  'está en espera',
    finalizado: 'ya fue completado',
    cancelado:  'fue cancelado',
    vencido:    'venció',
});

// Tira 409 si el trabajo no puede pasar de `desde` a `hacia`.
// `accion` arma el mensaje: "No se puede {accion}: el trabajo {motivo}".
export function exigirCambioEstadoTrabajo(desde, hacia, accion) {
    if (!puedeCambiarEstadoTrabajo(desde, hacia)) {
        const motivo = MOTIVO_ESTADO_TRABAJO[desde] ?? `está en estado '${desde}'`;
        throw new HttpError(409, `No se puede ${accion}: el trabajo ${motivo}`);
    }
}

// Estados en los que el trabajo recibe postulaciones nuevas y se puede aceptar.
export const recibePostulaciones = (estado) => estado === ESTADO_TRABAJO.ABIERTO;

// Estados finales: el trabajo ya no se edita.
export const esTrabajoCerrado = (estado) =>
    estado === ESTADO_TRABAJO.FINALIZADO || estado === ESTADO_TRABAJO.CANCELADO;

export const PRIORIDADES = Object.freeze(['normal', 'urgente']);

// =========================================================
// POSTULACIONES
// =========================================================

export const ESTADO_POSTULACION = Object.freeze({
    PENDIENTE:       'pendiente',
    ACEPTADO:        'aceptado',
    RECHAZADO:       'rechazado',
    RETIRADO:        'retirado',
    POR_RECONFIRMAR: 'por_reconfirmar',
});

// Para cancelar una postulación, el trabajo tiene que estar en uno de estos
// estados según el estado de la postulación (si no, el aviso al contratador
// sería incorrecto, ej. "podés reabrir" sobre un trabajo ya cancelado).
const ESTADOS_TRABAJO_PARA_CANCELAR = Object.freeze({
    pendiente:       ['abierto'],
    por_reconfirmar: ['abierto'],
    aceptado:        ['activa'],
});

export function exigirPuedeCancelarPostulacion(estadoPostulacion, estadoTrabajo) {
    if (estadoPostulacion === ESTADO_POSTULACION.RETIRADO) {
        throw new HttpError(409, 'Esta postulación ya fue cancelada');
    }
    const validos = ESTADOS_TRABAJO_PARA_CANCELAR[estadoPostulacion];
    if (!validos) {
        throw new HttpError(400, `No se puede cancelar una postulación en estado '${estadoPostulacion}'`);
    }
    if (!validos.includes(estadoTrabajo)) {
        const motivo = MOTIVO_ESTADO_TRABAJO[estadoTrabajo] ?? 'ya no admite cambios';
        throw new HttpError(409, `No se puede cancelar: el trabajo ${motivo}`);
    }
}

// Estados de la postulación en los que el chat sigue abierto para escribir.
export const ESTADOS_CHAT_ABIERTO = Object.freeze(['pendiente', 'aceptado', 'por_reconfirmar']);

// Días que tiene un postulante para reconfirmar cuando se reabre un trabajo.
export const PLAZO_RECONFIRMACION_DIAS = 2;

// =========================================================
// CONTRATOS
// =========================================================

export const ESTADO_CONTRATO = Object.freeze({
    ACTIVO:     'activo',
    COMPLETADO: 'completado',
    CANCELADO:  'cancelado',
});
