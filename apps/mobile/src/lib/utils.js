/**
 * Formatea una fecha en español
 * @param {Date} fecha
 * @returns {string}
 */
export function formatearFecha(fecha) {
  return fecha.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Formatea la hora en español
 * @param {Date} fecha
 * @returns {string}
 */
export function formatearHora(fecha) {
  return fecha.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
