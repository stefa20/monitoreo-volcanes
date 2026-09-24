// ============================================================
// app.js
// Control principal del Geoportal
// ============================================================


import {

    cargarCatalogo,

    cargarVolcanesGeoJSON,

    cargarEstacionesSismicas,

    contarVolcanesInSAR,

    contarVolcanesSismica,

    buscarVolcan,

    obtenerFechas,

    buscarObservacion,

    cargarMetadata,

    cargarArea,

    cargarFlujos,

    cargarEstadisticas

}
from "./data.js";



import {

    crearMapaGeneral,

    crearMapaBoletin

}
from "./map.js";



import {

    crearGraficaDistribucion

}
from "./charts.js";



// ============================================================
// CONFIGURACIÓN GENERAL
// ============================================================

const EDIFICIOS_VOLCANICOS_REGISTRADOS =
    26;



// ============================================================
// ELEMENTOS PRINCIPALES
// ============================================================

const homeView =
    document.getElementById(
        "home-view"
    );


const bulletinView =
    document.getElementById(
        "bulletin-view"
    );



// ============================================================
// INICIO
// ============================================================

async function iniciar() {

    try {

        const parametros =
            new URLSearchParams(
                window.location.search
            );


        const volcanId =
            parametros.get(
                "volcan"
            );


        const catalogo =
            await cargarCatalogo();


        if (!volcanId) {

            await mostrarMapaGeneral(
                catalogo
            );

            return;
        }


        await mostrarBoletin(
            catalogo,
            volcanId
        );

    }
    catch (error) {

        console.error(
            "Error al iniciar el Geoportal:",
            error
        );
    }
}



// ============================================================
// MAPA GENERAL
// ============================================================

async function mostrarMapaGeneral(
    catalogo
) {

    homeView.hidden =
        false;


    bulletinView.hidden =
        true;



    const [
        volcanes,
        estaciones
    ] =
        await Promise.all([
            cargarVolcanesGeoJSON(),
            cargarEstacionesSismicas()
        ]);



    // ========================================================
    // TARJETAS
    // ========================================================

    colocarTexto(
        "stat-volcanic-buildings",
        EDIFICIOS_VOLCANICOS_REGISTRADOS
    );


    colocarTexto(
        "stat-insar",
        contarVolcanesInSAR(
            catalogo
        )
    );


    colocarTexto(
        "stat-seismic",
        contarVolcanesSismica(
            estaciones
        )
    );



    // ========================================================
    // MAPA
    // ========================================================

    crearMapaGeneral(

        volcanes,

        estaciones,

        volcanId => {

            window.location.href =
                `?volcan=${encodeURIComponent(
                    volcanId
                )}`;
        }
    );
}



// ============================================================
// BOLETÍN
// ============================================================

async function mostrarBoletin(
    catalogo,
    volcanId
) {

    const volcan =
        buscarVolcan(
            catalogo,
            volcanId
        );


    if (!volcan) {

        throw new Error(
            `No existe el volcán ${volcanId}`
        );
    }



    homeView.hidden =
        true;


    bulletinView.hidden =
        false;



    colocarTexto(
        "volcano-name",
        volcan.nombre
    );



    // ========================================================
    // METADATA
    // ========================================================

    const metadata =
        await cargarMetadata(
            volcan
        );


    colocarTexto(
        "technical-sensor",
        metadata.sensor
    );


    colocarTexto(
        "technical-method",
        metadata.metodo
    );


    colocarTexto(
        "technical-processing",
        metadata.procesamiento
    );


    colocarTexto(
        "technical-geometry",
        metadata.geometria
    );



    // ========================================================
    // FECHAS
    // ========================================================

    const fechas =
        obtenerFechas(
            volcan
        );


    if (fechas.length === 0) {

        throw new Error(
            "El volcán no tiene fechas disponibles."
        );
    }



    const selector =
        document.getElementById(
            "date-select"
        );


    selector.innerHTML =
        "";



    fechas.forEach(
        observacion => {

            const opcion =
                document.createElement(
                    "option"
                );


            opcion.value =
                observacion.fecha;


            opcion.textContent =
                formatearFecha(
                    observacion.fecha
                );


            selector.appendChild(
                opcion
            );
        }
    );



    // ========================================================
    // FECHA DESDE URL
    // ========================================================

    const parametros =
        new URLSearchParams(
            window.location.search
        );


    const fechaURL =
        parametros.get(
            "fecha"
        );


    const observacionInicial =
        buscarObservacion(
            volcan,
            fechaURL
        ) ||
        fechas[0];


    selector.value =
        observacionInicial.fecha;



    // ========================================================
    // CAPAS VECTORIALES
    // ========================================================

    const [
        area,
        flujos
    ] =
        await Promise.all([
            cargarArea(
                volcan
            ),
            cargarFlujos(
                volcan
            )
        ]);



    await cargarObservacion(
        observacionInicial,
        area,
        flujos
    );



    // ========================================================
    // CAMBIO DE FECHA
    // ========================================================

    selector.addEventListener(
        "change",
        async event => {

            const fecha =
                event.target.value;


            const observacion =
                buscarObservacion(
                    volcan,
                    fecha
                );


            if (!observacion) {
                return;
            }



            const nuevaURL =
                new URL(
                    window.location
                );


            nuevaURL.searchParams.set(
                "volcan",
                volcan.id
            );


            nuevaURL.searchParams.set(
                "fecha",
                fecha
            );


            window.history.replaceState(
                {},
                "",
                nuevaURL
            );


            await cargarObservacion(
                observacion,
                area,
                flujos
            );
        }
    );



    // ========================================================
    // VOLVER
    // ========================================================

    document
        .getElementById(
            "back-button"
        )
        .addEventListener(
            "click",
            () => {

                window.location.href =
                    window.location.pathname;
            }
        );
}



// ============================================================
// CARGAR OBSERVACIÓN
// ============================================================

async function cargarObservacion(
    observacion,
    area,
    flujos
) {

    console.log(
        "Cargando observación:",
        observacion.fecha
    );



    const estadisticas =
        await cargarEstadisticas(
            observacion
        );



    colocarTexto(
        "stat-min",
        formatoCm(
            estadisticas.minimo_cm
        )
    );


    colocarTexto(
        "stat-max",
        formatoCm(
            estadisticas.maximo_cm
        )
    );


    colocarTexto(
        "stat-mean",
        formatoCm(
            estadisticas.promedio_cm
        )
    );


    colocarTexto(
        "stat-pixels",
        Number(
            estadisticas.pixeles_validos
        ).toLocaleString(
            "es-CO"
        )
    );



    await crearMapaBoletin({

        rasterUrl:
            observacion.raster,

        areaGeoJSON:
            area,

        flujosGeoJSON:
            flujos

    });



    crearGraficaDistribucion(
        "distribution-chart",
        estadisticas
    );
}



// ============================================================
// UTILIDADES
// ============================================================

function colocarTexto(
    id,
    valor
) {

    const elemento =
        document.getElementById(
            id
        );


    if (elemento) {

        elemento.textContent =
            valor ?? "--";
    }
}



function formatoCm(
    valor
) {

    const numero =
        Number(valor);


    if (
        !Number.isFinite(
            numero
        )
    ) {
        return "--";
    }


    const signo =
        numero > 0
            ? "+"
            : "";


    return (
        `${signo}${numero.toFixed(2)} cm`
    );
}



function formatearFecha(
    fecha
) {

    if (
        !fecha ||
        fecha.length !== 8
    ) {
        return fecha;
    }


    return (
        `${fecha.slice(6, 8)}/` +
        `${fecha.slice(4, 6)}/` +
        `${fecha.slice(0, 4)}`
    );
}



// ============================================================
// EJECUTAR
// ============================================================

iniciar();
