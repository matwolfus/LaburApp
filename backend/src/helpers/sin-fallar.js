// backend/src/helpers/sin-fallar.js
// Corre tareas secundarias que van DESPUÉS de una acción ya confirmada en la
// base (típicamente las notificaciones). Si fallan, se loguea y listo: un
// problema al avisar no puede convertir en error algo que ya se guardó bien.
export async function sinFallar(contexto, tarea) {
    try {
        await tarea();
    } catch (err) {
        console.error(`Error (no bloqueante) en ${contexto}:`, err);
    }
}
