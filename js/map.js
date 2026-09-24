// ============================================================
// map.js
// Mapas del Geoportal
// ============================================================


let mapaGeneral = null;
let mapaBoletin = null;



// ============================================================
// MAPA BASE
// ============================================================

function agregarMapaBase(mapa) {

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,

            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(mapa);
}



// ============================================================
// MAPA GENERAL
// ============================================================

export function crearMapaGeneral(
    volcanesGeoJSON,
    estacionesGeoJSON,
    onVolcanClick
) {

    const contenedor =
        document.getElementById(
            "general-map"
        );


    if (!contenedor) {

        throw new Error(
            "No existe #general-map"
        );
    }


    if (mapaGeneral) {

        mapaGeneral.remove();

        mapaGeneral = null;
    }


    mapaGeneral =
        L.map(
            "general-map",
            {
                zoomControl: true
            }
        );


    agregarMapaBase(
        mapaGeneral
    );



    // ========================================================
    // VOLCANES DE LODO
    // ========================================================

    const capaVolcanes =
        L.geoJSON(
            volcanesGeoJSON,
            {

                pointToLayer:
                    function (
                        feature,
                        latlng
                    ) {

                        return L.circleMarker(
                            latlng,
                            {
                                radius: 8,

                                weight: 2,

                                color:
                                    "#ffffff",

                                fillColor:
                                    "#d95f02",

                                fillOpacity:
                                    1
                            }
                        );
                    },


                onEachFeature:
                    function (
                        feature,
                        layer
                    ) {

                        const propiedades =
                            feature.properties ||
                            {};


                        const nombre =
                            propiedades.nombre ||
                            "Volcán de lodo";


                        const id =
                            propiedades.id;


                        layer.bindTooltip(
                            nombre,
                            {
                                direction:
                                    "top",

                                offset:
                                    [0, -7]
                            }
                        );


                        layer.on(
                            "click",
                            function () {

                                if (
                                    id &&
                                    typeof onVolcanClick ===
                                    "function"
                                ) {

                                    onVolcanClick(
                                        id
                                    );
                                }
                            }
                        );
                    }

            }
        )
        .addTo(
            mapaGeneral
        );



    // ========================================================
    // ESTACIONES SÍSMICAS
    // ========================================================

    let capaEstaciones =
        null;


    if (
        estacionesGeoJSON &&
        Array.isArray(
            estacionesGeoJSON.features
        )
    ) {

        capaEstaciones =
            L.geoJSON(
                estacionesGeoJSON,
                {

                    pointToLayer:
                        function (
                            feature,
                            latlng
                        ) {

                            return L.circleMarker(
                                latlng,
                                {
                                    radius: 6,

                                    weight: 2,

                                    color:
                                        "#ffffff",

                                    fillColor:
                                        "#176b87",

                                    fillOpacity:
                                        1
                                }
                            );
                        },


                    onEachFeature:
                        function (
                            feature,
                            layer
                        ) {

                            const propiedades =
                                feature.properties ||
                                {};


                            const nombre =
                                propiedades.nombre ||
                                "Estación sísmica";


                            const codigo =
                                propiedades.id ||
                                "";


                            layer.bindTooltip(
                                nombre,
                                {
                                    direction:
                                        "top"
                                }
                            );


                            layer.bindPopup(
                                `
                                <strong>
                                    ${nombre}
                                </strong>
                                <br>
                                Estación sísmica
                                ${
                                    codigo
                                        ? `<br>${codigo}`
                                        : ""
                                }
                                `
                            );
                        }

                }
            )
            .addTo(
                mapaGeneral
            );
    }



    // ========================================================
    // CONTROL DE CAPAS
    // ========================================================

    const capasSuperpuestas = {

        "Volcanes de lodo":
            capaVolcanes

    };


    if (capaEstaciones) {

        capasSuperpuestas[
            "Estaciones sísmicas"
        ] =
            capaEstaciones;
    }


    L.control.layers(
        null,
        capasSuperpuestas,
        {
            collapsed: false
        }
    ).addTo(
        mapaGeneral
    );



    // ========================================================
    // EXTENSIÓN DEL MAPA
    // ========================================================

    const bounds =
        capaVolcanes.getBounds();


    if (
        capaEstaciones &&
        capaEstaciones
            .getBounds()
            .isValid()
    ) {

        bounds.extend(
            capaEstaciones.getBounds()
        );
    }


    if (bounds.isValid()) {

        mapaGeneral.fitBounds(
            bounds,
            {
                padding:
                    [45, 45],

                maxZoom:
                    11
            }
        );

    } else {

        mapaGeneral.setView(
            [7.0, -75.5],
            7
        );
    }


    setTimeout(
        () => {

            mapaGeneral.invalidateSize();

        },
        120
    );


    return mapaGeneral;
}



// ============================================================
// COLOR DEL RASTER INSAR
// ============================================================

function colorDesplazamiento(
    valorMetros
) {

    if (
        valorMetros === null ||
        valorMetros === undefined ||
        !Number.isFinite(
            valorMetros
        )
    ) {
        return null;
    }


    const cm =
        valorMetros * 100;


    if (cm < -6) {
        return "#440154";
    }

    if (cm < -4) {
        return "#482878";
    }

    if (cm < -2) {
        return "#3E4989";
    }

    if (cm < -1) {
        return "#31688E";
    }

    if (cm < 1) {
        return "#26828E";
    }

    if (cm < 2) {
        return "#1F9E89";
    }

    if (cm < 4) {
        return "#6CCE59";
    }

    if (cm < 6) {
        return "#B6DE2B";
    }


    return "#FDE725";
}



// ============================================================
// MAPA DEL BOLETÍN
// ============================================================

export async function crearMapaBoletin({
    rasterUrl,
    areaGeoJSON = null,
    flujosGeoJSON = null
}) {

    const contenedor =
        document.getElementById(
            "bulletin-map"
        );


    if (!contenedor) {

        throw new Error(
            "No existe #bulletin-map"
        );
    }


    if (mapaBoletin) {

        mapaBoletin.remove();

        mapaBoletin = null;
    }


    mapaBoletin =
        L.map(
            "bulletin-map"
        );


    agregarMapaBase(
        mapaBoletin
    );



    // Pane del raster:
    // queda debajo de los vectores

    mapaBoletin.createPane(
        "rasterPane"
    );

    mapaBoletin.getPane(
        "rasterPane"
    ).style.zIndex =
        250;



    const capasControl = {};



    // ========================================================
    // RASTER INSAR
    // ========================================================

    if (rasterUrl) {

        const respuesta =
            await fetch(
                rasterUrl
            );


        if (!respuesta.ok) {

            throw new Error(
                `No se pudo cargar el raster ${rasterUrl}`
            );
        }


        const arrayBuffer =
            await respuesta
                .arrayBuffer();


        const georaster =
            await parseGeoraster(
                arrayBuffer
            );


        const capaRaster =
            new GeoRasterLayer(
                {

                    georaster:
                        georaster,

                    opacity:
                        0.78,

                    resolution:
                        128,

                    pane:
                        "rasterPane",

                    pixelValuesToColorFn:
                        values => {

                            const valor =
                                values[0];


                            return colorDesplazamiento(
                                valor
                            );
                        }
                }
            );


        capaRaster.addTo(
            mapaBoletin
        );


        capasControl[
            "Cambio observado"
        ] =
            capaRaster;


        const rasterBounds =
            capaRaster.getBounds();


        if (rasterBounds) {

            mapaBoletin.fitBounds(
                rasterBounds,
                {
                    padding:
                        [25, 25]
                }
            );
        }
    }



    // ========================================================
    // ÁREA DE ESTUDIO
    // ========================================================

    if (areaGeoJSON) {

        const capaArea =
            L.geoJSON(
                areaGeoJSON,
                {
                    style: {
                        color:
                            "#333333",

                        weight:
                            2,

                        dashArray:
                            "6,6",

                        fillOpacity:
                            0.03
                    }
                }
            )
            .addTo(
                mapaBoletin
            );


        capasControl[
            "Área de estudio"
        ] =
            capaArea;
    }



    // ========================================================
    // FLUJOS HISTÓRICOS
    // ========================================================

    if (flujosGeoJSON) {

        const capaFlujos =
            L.geoJSON(
                flujosGeoJSON,
                {
                    style: {
                        color:
                            "#8b4513",

                        weight:
                            2,

                        fillOpacity:
                            0.14
                    }
                }
            )
            .addTo(
                mapaBoletin
            );


        capasControl[
            "Flujos históricos"
        ] =
            capaFlujos;
    }



    // ========================================================
    // CONTROL
    // ========================================================

    if (
        Object.keys(
            capasControl
        ).length > 0
    ) {

        L.control.layers(
            null,
            capasControl,
            {
                collapsed: false
            }
        ).addTo(
            mapaBoletin
        );
    }



    setTimeout(
        () => {

            mapaBoletin.invalidateSize();

        },
        150
    );


    return mapaBoletin;
}
