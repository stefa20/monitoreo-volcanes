// ============================================================
// charts.js
// Gráfica de distribución
// ============================================================


let graficaDistribucion =
    null;



const coloresPorCategoria = {

    "< -6 cm":
        "#440154",

    "-6 a -4 cm":
        "#482878",

    "-4 a -2 cm":
        "#3E4989",

    "-2 a -1 cm":
        "#31688E",

    "-1 a +1 cm":
        "#26828E",

    "+1 a +2 cm":
        "#1F9E89",

    "+2 a +4 cm":
        "#6CCE59",

    "+4 a +6 cm":
        "#B6DE2B",

    "> +6 cm":
        "#FDE725"

};



export function crearGraficaDistribucion(
    canvasId,
    estadisticas
) {

    const canvas =
        document.getElementById(
            canvasId
        );


    if (!canvas) {

        console.warn(
            `No existe #${canvasId}`
        );

        return;
    }


    if (
        !estadisticas ||
        !Array.isArray(
            estadisticas.categorias
        )
    ) {

        console.warn(
            "No hay categorías para graficar."
        );

        return;
    }



    if (graficaDistribucion) {

        graficaDistribucion
            .destroy();

        graficaDistribucion =
            null;
    }



    const etiquetas =
        estadisticas.categorias.map(
            categoria =>
                categoria.nombre
        );


    const valores =
        estadisticas.categorias.map(
            categoria =>
                categoria.pixeles
        );


    const colores =
        estadisticas.categorias.map(
            categoria =>
                coloresPorCategoria[
                    categoria.nombre
                ] ||
                "#607286"
        );



    graficaDistribucion =
        new Chart(
            canvas,
            {

                type:
                    "bar",


                data: {

                    labels:
                        etiquetas,


                    datasets: [
                        {

                            label:
                                "Número de píxeles",

                            data:
                                valores,

                            backgroundColor:
                                colores,

                            borderWidth:
                                0
                        }
                    ]
                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,


                    plugins: {

                        legend: {
                            display:
                                false
                        },


                        tooltip: {

                            callbacks: {

                                label:
                                    function (
                                        context
                                    ) {

                                        return (
                                            `${Number(
                                                context.raw
                                            ).toLocaleString(
                                                "es-CO"
                                            )} píxeles`
                                        );
                                    }
                            }
                        }
                    },


                    scales: {

                        x: {

                            title: {

                                display:
                                    true,

                                text:
                                    "Cambio observado en la superficie"
                            }
                        },


                        y: {

                            beginAtZero:
                                true,

                            title: {

                                display:
                                    true,

                                text:
                                    "Número de píxeles"
                            }
                        }
                    }
                }
            }
        );


    return graficaDistribucion;
}
