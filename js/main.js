var DATA = {};
var currentDate;
d3.csv("data/200000_nagano_covid19_patients_utf8.csv", function (data) {
    //console.log(data);

    cleanPlotArea();

    if (DATA.hasOwnProperty(data["事例確定_年月日"])) {
	DATA[data["事例確定_年月日"]]++;
    } else {
	DATA[data["事例確定_年月日"]] = 1;
    }
    
});

var tmpDATA = [];
for (var d in DATA) {
    console.log(DATA[d]);
    tmpDATA.push([d[0], d[1]]);
}
console.log(tmpDATA);

//plotBarChart();


function plotBarChart() {
    cleanPlotArea();

    var keysWanted = ["a", "b", "c", "d"];
    var color = ["#2244FF", "#555555", "#777777", "#DDDDDD"];
    plotBarArea(keysWanted, color);
}

function cleanPlotArea() {
    var plotArea = document.getElementById("plot");
    while(plotArea.firstChild) plotArea.removeChild(plotArea.firstChild);
}


function plotBarArea(keysWanted, color) {
    var domain = sortData();
    var data = getData(keysWanted);

    var plotElm = document.getElementById("plot");
    var barPlotElm = document.createElement("div");
    barPlotElm.id = "focus";
    plotElm.appendChild(barPlotElm);
    var barChart = new BarChart("focus");
    barChart.setData(data, keysWanted, color);
    barChart.setScale(domain);
    barChart.draw();

    //var padding = document.createElement("div");
    //padding.style.height = "50px";
    //plotElm.appendChild(padding);

    var areaPlotElm = document.createElement("div");
    areaPlotElm.id = "context";
    plotElm.appendChild(areaPlotElm);
    var areaChart = new AreaChart("context", {"height": 200});
    //areaChart.interpolate = false; // 補完しない
    areaChart.interpolate = "cardinal";
    areaChart.setData(data, keysWanted, color);
    areaChart.drawAxis();
    areaChart.drawArea();

    var context = areaChart.graphLayer.append("g")
        .attr("transform", "translate(0,0)")

    var brush = d3.svg.brush()
        .x(areaChart.xScale)
        .on("brush", function() {
	    //console.log(brush.extent());
	    barChart.update(brush.empty() ? domain : brush.extent());
	}
	   );

    context.append("g")
        .attr("class", "brush")
        .call(brush)
        .selectAll("rect")
        .attr("y", -6)
        .attr("height", areaChart.svgHeight);

}

// DATAを時系列でソートする
var sorted = false;
function sortData() {
    if (!sorted) {
	DATA.sort(function(a, b) {
	    return (new Date(a[0])).getTime() < (new Date(b[0])).getTime() ? -1 : 1;
	});
	sorted = true;
    }
    if (DATA.length > 30) {
	return [new Date(DATA[DATA.length - 31][0]), new Date(DATA[DATA.length - 1][0])];
    } else {
	return [new Date(DATA[0][0]), new Date(DATA[DATA.length - 1][0])];
    }
}

function getIndex(keysWanted) {
    var index = {};
    for (var i = 0; i < keysWanted.length; i++) {
	for (var j = 0; j < LABEL.length; j++) {
	    if (keysWanted[i] == LABEL[j]) index[keysWanted[i]] = j + 1;
	}
    }
    return index;
}

function getData(keysWanted) {
    var index = getIndex(keysWanted);
    var data = [];
    //  for (var i = DATA.length - 1; i >= 0; i--) {
    for (var i = DATA.length - 1; i >= DATA.length - 90; i--) {
	var d = [];
	d.push(DATA[i][0]);
	for (var key in index) d.push(DATA[i][index[key]]);
	data.unshift(d);
    }
    return data;
}
