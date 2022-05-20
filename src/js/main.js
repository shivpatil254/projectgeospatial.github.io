var width = (850),  // to change width and height please change size here
    height = Math.max(400);

/*var width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
    height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);*/

const svg = d3.select("body")
    .append("svg")
    .style("cursor", "move");

svg.attr("viewBox", "50 10 " + width + " " + height)
    .attr("preserveAspectRatio", "xMinYMin");

var zoom = d3.zoom()
    .on("zoom", function () {
        var transform = d3.zoomTransform(this);
        map.attr("transform", transform);
    });

svg.call(zoom);

var map = svg.append("g")
    .attr("class", "map");

d3.queue()
    .defer(d3.json, "src/data/50m.json")
    .defer(d3.json, "src/data/coviddata.json")
    .await(function (error, world, data) {
        if (error) {
            console.error('Oh dear, something went wrong: ' + error);
        }
        else {
            drawMap(world, data);
        }
    });

function drawMap(world, data) {
    // geoMercator projection
    //  var projection = d3.geoMercator() //d3.geoOrthographic()
    const projection = d3.geoEquirectangular()
     .scale(128)
    //  .translate([width / 2, height / 1.5]);


    // geoPath projection
    const path = d3.geoPath().projection(projection);

    // const g = svg.append('g');


    /*  g.append('path')
        .attr('class', 'sphere')
        .attr('d', path({type:'Sphere'})); */

    //colors for population metrics
    var color = d3.scaleThreshold()
    // .domain([1, 100])
    // .range(["#feffe8", "#21442c"]); 

    var features = topojson.feature(world, world.objects.countries).features;
    var covidById = {};

    data.forEach(function (d) {
        covidById[d.country] = {
            total: +d.total,
            ccases: +d.ccases,
            dcases: +d.dcases,
            vaccinationinfo: +d.vaccinationinfo
        }
    });
    features.forEach(function (d) {
        d.details = covidById[d.properties.name] ? covidById[d.properties.name] : {};
    });

    map.append("g")
        .selectAll("path")
        .data(features)
        .enter().append("path")

        .attr("name", function (d) {
            return d.properties.name;
        })
        .attr("id", function (d) {
            return d.id;
        })
        .attr("d", path)
        .style("fill", function (d) {
            return d.details && d.details.total ? color(d.details.total) : undefined;
        })
        .on('mouseover', function (d) {
            d3.select(this)
                .style("stroke", "white")
                .style("stroke-width", 1)
                .style("cursor", "pointer");

            d3.select(".country")
                .text(d.properties.name);

            d3.select(".ccases")
                .text(d.details && d.details.ccases && "Confirmed Cases Per Million People: " + d.details.ccases || "No data found");

            d3.select(".vaccinationinfo")
                .text(d.details && d.details.vaccinationinfo ? `Share of Fully Vaccinated People : ${d.details.vaccinationinfo}%` : "No data found");

            d3.select(".dcases")
                .text(d.details && d.details.dcases && "Confirmed Deaths Per Million People: " + d.details.dcases || "No data found");



            d3.select('.details')
                .style('visibility', "visible")

        })
        .on('mouseout', function (d) {
            d3.select(this)
                .style("stroke", null)
                .style("stroke-width", 0.25);

            d3.select('.details')
                .style('visibility', "hidden");
        });
}