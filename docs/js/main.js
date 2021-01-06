d3.csv("data/200000_nagano_covid19_patients_utf8.csv").then(function (data) {
    //console.log(data);

    var dates = [];
    var dataSet = [];
    data.forEach(function(d) {
        if (dates.includes(d["事例確定_年月日"])) {
	        dataSet[dates.indexOf(d["事例確定_年月日"])].value++;
        } else {
	        dataSet.push({"date": d["事例確定_年月日"], "value": 1});
            dates.push(d["事例確定_年月日"]);
        }        
    });

    console.log(dataSet);
    plotBarChart(dataSet);
});



function plotBarChart(dataSet) {
    cleanPlotArea();

    var width = 1000;
    var height = 800;
    var padding = 30;
    
    var svg = d3.select("#plot").append("svg").attr("width", width).attr("height", height);

    console.log(svg);
    
    var xScale = d3.scaleBand()
        .rangeRound([padding, width - padding])
        .padding(0.1)
        .domain(dataSet.map(function(d) { return d.date; }));
    
    var yScale = d3.scaleLinear()
        .domain([0, d3.max(dataSet, function(d) { return d.value; })])
        .range([height - padding, padding]);
    
    svg.append("g")
        .attr("transform", "translate(" + 0 + "," + (height - padding) + ")")
        .call(d3.axisBottom(xScale));
    
    svg.append("g")
        .attr("transform", "translate(" + padding + "," + 0 + ")")
        .call(d3.axisLeft(yScale));
    
    svg.append("g")
        .selectAll("rect")
        .data(dataSet)
        .enter()
        .append("rect")
        .attr("x", function(d) { return xScale(d.date); })
        .attr("y", function(d) { return yScale(d.value); })
        .attr("width", xScale.bandwidth())
        .attr("height", function(d) { return height - padding - yScale(d.value); })
        .attr("fill", "steelblue");
}

function cleanPlotArea() {
    var plotArea = document.getElementById("plot");
    while(plotArea.firstChild) plotArea.removeChild(plotArea.firstChild);
}


