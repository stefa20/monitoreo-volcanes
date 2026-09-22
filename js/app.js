const VMIN_CM = -6;
const VMAX_CM = 4;

const map = L.map("map").setView(
    [7.5, -75.5],
    8
);


// ============================================================
// MAPA BASE
// ============================================================

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap"
    }
).addTo(map);


// ============================================================
// VARIABLES
// ============================================================

let catalogo = null;

let rasterLayer = null;
let flujoLayer = null;

const volcanLayer = L.layerGroup().addTo(map);


const volcanSelect =
    document.getElementById("volcanSelect");

const fechaSelect =
    document.getElementById("fechaSelect");

const fechaSlider =
    document.getElementById("fechaSlider");

const fechaLabel =
    document.getElementById("fechaLabel");

const opacitySlider =
    document.getElementById("opacitySlider");


// ============================================================
// INICIALIZACION
// ============================================================

async function iniciar() {

    const respuesta = await fetch(
        "./data/catalog.json"
    );

    catalogo = await respuesta.json();


    for (const [id, volcan] of Object.entries(catalogo)) {

        const option =
            document.createElement("option");

        option.value = id;
        option.textContent = volcan.nombre;

        volcanSelect.appendChild(option);


        const marker = L.marker(
            [volcan.lat, volcan.lon]
        );

        marker.bindPopup(
            `<b>${volcan.nombre}</b>`
        );

        marker.on(
            "click",
            () => seleccionarVolcan(id)
        );

        marker.addTo(volcanLayer);
    }


    const primerVolcan =
        Object.keys(catalogo)[0];

    seleccionarVolcan(
        primerVolcan
    );
}


// ============================================================
// SELECCIONAR VOLCAN
// ============================================================

async function seleccionarVolcan(id) {

    volcanSelect.value = id;

    const volcan =
        catalogo[id];


    map.setView(
        [volcan.lat, volcan.lon],
        13
    );


    fechaSelect.innerHTML = "";


    const rasters =
        volcan.rasters.sort(
            (a, b) =>
                a.fecha.localeCompare(b.fecha)
        );


    rasters.forEach(
        (raster, index) => {

            const option =
                document.createElement("option");

            option.value = raster.fecha;

            option.textContent =
                formatearFecha(raster.fecha);

            fechaSelect.appendChild(option);
        }
    );


    fechaSlider.min = 0;

    fechaSlider.max =
        rasters.length - 1;

    fechaSlider.value =
        rasters.length - 1;


    const ultimaFecha =
        rasters[
            rasters.length - 1
        ].fecha;


    fechaSelect.value =
        ultimaFecha;


    await cargarFlujos(id);

    await cargarRaster(
        id,
        ultimaFecha
    );
}


// ============================================================
// CARGAR RASTER
// ============================================================

async function cargarRaster(
    volcanId,
    fecha
) {

    if (rasterLayer) {

        map.removeLayer(
            rasterLayer
        );
    }


    const volcan =
        catalogo[volcanId];


    const rasterInfo =
        volcan.rasters.find(
            item =>
                item.fecha === fecha
        );


    if (!rasterInfo) {
        return;
    }


    fechaLabel.textContent =
        formatearFecha(fecha);


    const respuesta =
        await fetch(
            rasterInfo.url
        );


    const arrayBuffer =
        await respuesta.arrayBuffer();


    const georaster =
        await parseGeoraster(
            arrayBuffer
        );


    const escala =
        chroma.scale("viridis");


    const nodata =
        georaster.noDataValue;


    rasterLayer =
        new GeoRasterLayer({

            georaster: georaster,

            opacity:
                Number(
                    opacitySlider.value
                ),

            resolution: 256,

            pixelValuesToColorFn:
                values => {

                    const valor_m =
                        values[0];


                    if (
                        valor_m === null ||
                        valor_m === undefined ||
                        Number.isNaN(valor_m) ||
                        valor_m === nodata
                    ) {
                        return null;
                    }


                    // MintPy almacena displacement en m
                    const valor_cm =
                        valor_m * 100;


                    let normalizado =
                        (
                            valor_cm
                            - VMIN_CM
                        )
                        /
                        (
                            VMAX_CM
                            - VMIN_CM
                        );


                    normalizado =
                        Math.max(
                            0,
                            Math.min(
                                1,
                                normalizado
                            )
                        );


                    return escala(
                        normalizado
                    ).hex();
                }
        });


    rasterLayer.addTo(
        map
    );


    map.fitBounds(
        rasterLayer.getBounds()
    );
}


// ============================================================
// FLUJOS HISTORICOS
// ============================================================

async function cargarFlujos(
    volcanId
) {

    if (flujoLayer) {

        map.removeLayer(
            flujoLayer
        );
    }


    const url =
        catalogo[
            volcanId
        ].flujos;


    if (!url) {
        return;
    }


    const respuesta =
        await fetch(url);


    const geojson =
        await respuesta.json();


    flujoLayer =
        L.geoJSON(
            geojson,
            {
                style: {
                    color: "#e53935",
                    weight: 2,
                    fillOpacity: 0.12
                }
            }
        );


    flujoLayer.addTo(
        map
    );
}


// ============================================================
// EVENTOS
// ============================================================

volcanSelect.addEventListener(
    "change",
    () => {

        seleccionarVolcan(
            volcanSelect.value
        );
    }
);


fechaSelect.addEventListener(
    "change",
    () => {

        const volcanId =
            volcanSelect.value;

        const fecha =
            fechaSelect.value;


        const rasters =
            catalogo[
                volcanId
            ].rasters;


        const index =
            rasters.findIndex(
                r =>
                    r.fecha === fecha
            );


        fechaSlider.value =
            index;


        cargarRaster(
            volcanId,
            fecha
        );
    }
);


fechaSlider.addEventListener(
    "input",
    () => {

        const volcanId =
            volcanSelect.value;


        const rasters =
            catalogo[
                volcanId
            ].rasters;


        const raster =
            rasters[
                Number(
                    fechaSlider.value
                )
            ];


        fechaSelect.value =
            raster.fecha;


        cargarRaster(
            volcanId,
            raster.fecha
        );
    }
);


opacitySlider.addEventListener(
    "input",
    () => {

        if (rasterLayer) {

            rasterLayer.setOpacity(
                Number(
                    opacitySlider.value
                )
            );
        }
    }
);


// ============================================================
// FECHAS
// ============================================================

function formatearFecha(
    fecha
) {

    return (
        fecha.slice(6, 8)
        + "/"
        + fecha.slice(4, 6)
        + "/"
        + fecha.slice(0, 4)
    );
}


// ============================================================
// INICIAR
// ============================================================

iniciar();
