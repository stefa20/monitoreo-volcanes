// ============================================================
// data.js
// Lectura y manejo de datos
// ============================================================


export async function cargarJSON(ruta) {

    const respuesta = await fetch(ruta);


    if (!respuesta.ok) {

        throw new Error(
            `No se pudo cargar ${ruta}. HTTP ${respuesta.status}`
        );
    }


    return await respuesta.json();
}



// ============================================================
// CATÁLOGO
// ============================================================

export async function cargarCatalogo() {

    return await cargarJSON(
        "./data/catalog.json"
    );
}



// ============================================================
// VOLCANES
// ============================================================

export async function cargarVolcanesGeoJSON() {

    return await cargarJSON(
        "./data/volcanes.geojson"
    );
}



// ============================================================
// ESTACIONES SÍSMICAS
// ============================================================

export async function cargarEstacionesSismicas() {

    return await cargarJSON(
        "./data/estaciones_sismicas.geojson"
    );
}



// ============================================================
// BUSCAR VOLCÁN
// ============================================================

export function buscarVolcan(
    catalogo,
    volcanId
) {

    if (
        !catalogo ||
        !Array.isArray(catalogo.volcanes)
    ) {
        return null;
    }


    return (
        catalogo.volcanes.find(
            volcan =>
                volcan.id === volcanId
        ) || null
    );
}



// ============================================================
// FECHAS
// ============================================================

export function obtenerFechas(volcan) {

    if (
        !volcan ||
        !Array.isArray(volcan.fechas)
    ) {
        return [];
    }


    return [...volcan.fechas].sort(
        (a, b) =>
            b.fecha.localeCompare(
                a.fecha
            )
    );
}



// ============================================================
// OBSERVACIÓN
// ============================================================

export function buscarObservacion(
    volcan,
    fecha
) {

    if (
        !volcan ||
        !Array.isArray(volcan.fechas)
    ) {
        return null;
    }


    return (
        volcan.fechas.find(
            observacion =>
                observacion.fecha === fecha
        ) || null
    );
}



// ============================================================
// METADATA
// ============================================================

export async function cargarMetadata(
    volcan
) {

    return await cargarJSON(
        volcan.metadata
    );
}



// ============================================================
// ÁREA
// ============================================================

export async function cargarArea(
    volcan
) {

    if (!volcan.area) {
        return null;
    }


    return await cargarJSON(
        volcan.area
    );
}



// ============================================================
// FLUJOS
// ============================================================

export async function cargarFlujos(
    volcan
) {

    if (!volcan.flujos) {
        return null;
    }


    return await cargarJSON(
        volcan.flujos
    );
}



// ============================================================
// ESTADÍSTICAS INSAR
// ============================================================

export async function cargarEstadisticas(
    observacion
) {

    return await cargarJSON(
        observacion.estadisticas
    );
}



// ============================================================
// CONTAR VOLCANES MONITOREADOS POR INSAR
// ============================================================

export function contarVolcanesInSAR(
    catalogo
) {

    if (
        !catalogo ||
        !Array.isArray(catalogo.volcanes)
    ) {
        return 0;
    }


    return catalogo.volcanes.filter(
        volcan =>
            Array.isArray(volcan.fechas) &&
            volcan.fechas.length > 0
    ).length;
}



// ============================================================
// CONTAR VOLCANES MONITOREADOS CON SÍSMICA
// ============================================================

export function contarVolcanesSismica(
    estaciones
) {

    if (
        !estaciones ||
        !Array.isArray(
            estaciones.features
        )
    ) {
        return 0;
    }


    const volcanes =
        new Set();


    estaciones.features.forEach(
        feature => {

            const volcanId =
                feature.properties
                    ?.volcan_id;


            if (volcanId) {

                volcanes.add(
                    volcanId
                );
            }
        }
    );


    return volcanes.size;
}
