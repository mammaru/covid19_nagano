var LineChart = function(id) {
  this.id = id;
  this.SharpId = "#" + id;

  this.svgWidth = 1000;
  this.svgHeight = 700;
  this.lineAreaPadding = 0;
  this.xAxisPadding = 50;
  this.yAxisPadding = 50;

  this.defaultColor = ["red", "green", "blue", "yellow", "cyan", "gray"];

  this.refresh();
}

LineChart.prototype.clean = function() {
  var plotElm = document.getElementById(this.id);
  while(plotElm.firstChild) plotElm.removeChild(plotElm.firstChild);
}

LineChart.prototype.refresh = function() {
  this.clean();

  this.dataSet = null;
  this.dayWidth = null;

  this.color = null;

  this.xScale = null;
  this.yScale = null;

  this.svg = null;
}

LineChart.prototype.setData = function(data, label, color) {
  this.dataSet = data;
  this.dataLength = data.length;
  this.label = label;
  if (typeof color == "undefined") {
    this.color = this.defaultColor;
  } else if (color == null) {
    this.color = this.defaultColor;
  } else {
    this.color = color;
  }
 
  this.dayWidth = (this.svgWidth - 2*this.lineAreaPadding - this.yAxisPadding) / (data.length - 1);

  // 紛らわしいのでこれ重要
  var that = this;

  this.xScale = d3.time.scale()
    .domain([new Date(data[0][0]), new Date(data[data.length - 1][0])])
    .range([that.lineAreaPadding, that.svgWidth - that.yAxisPadding - that.lineAreaPadding]);
  this.vMax = d3.max(data, function(r) { return d3.max(r.map(function(d, ix) { return ix!=0 ? Number(d) : 0; })); });
  this.vMax = Math.ceil(that.vMax / 10) * 10;
  this.yScale = d3.scale.linear()
    .domain([0, that.vMax])
    .range([that.svgHeight - that.xAxisPadding - that.lineAreaPadding, that.xAxisPadding]);
}

LineChart.prototype.drawAxis = function() {
  var that = this;
  if (this.svg == null) {
    this.svg = d3.select(this.SharpId)
              .append("svg")
              .attr("width", this.svgWidth)
              .attr("height", this.svgHeight);
  }

  // 軸
  var xAxis = d3.svg.axis()
    .scale(that.xScale)
    .tickFormat(d3.time.format("%m/%d"))
    .ticks(that.dataSet.length);
  var yAxis = d3.svg.axis()
    .scale(that.yScale)
    .orient("left");

  this.svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + that.xAxisPadding + ", " + (that.svgHeight - that.yAxisPadding) + ")")
    .call(xAxis)
    .selectAll("text")
    .attr("x", 10)
    .attr("y", -5)
    .attr("transform", "rotate(90)")
    .style("text-anchor", "start");
  this.svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + that.xAxisPadding + ", 0)")
    .call(yAxis);
}

LineChart.prototype.drawLine = function() {
  var that = this;
  if (this.svg == null) {
    this.svg = d3.select(this.SharpId)
              .append("svg")
              .attr("width", this.svgWidth)
              .attr("height", this.svgHeight);
  }

  // 折れ線グラフ
  for (var i = 1; i < that.dataSet[0].length; i++) {
    var line = d3.svg.area()
      .x(function(d, j){
        return (j * that.dayWidth) + that.xAxisPadding + that.lineAreaPadding;
      })
      .y0(function(d){
        return that.yScale(d[i]);
      })
      .y1(that.svgHeight - that.xAxisPadding);

    //line.interpolate("monotone");

    this.svg.append("path")
      .attr("class", "high")
      .attr("d", line(that.dataSet))
      .attr("stroke", "#ed5454")
      .attr("fill", "#ed5454");
  }
}

LineChart.prototype.drawPoint = function() {
  var that = this;
  if (this.svg == null) {
    this.svg = d3.select(this.SharpId)
              .append("svg")
              .attr("width", this.svgWidth)
              .attr("height", this.svgHeight);
  }

  for (var i = 1; i < that.dataSet[0].length; i++) {
    // 散布図
    this.svg.selectAll(".circle_" + i.toString())
      .data(that.dataSet)
      .enter()
      .append("circle")
      .attr("class", ".circle_" + i.toString())
      .attr("cx", function(d, j){
        return (j * that.dayWidth) + that.xAxisPadding + that.lineAreaPadding;
      })
      .attr("cy", function(d){
        return that.yScale(d[i]);
      })
      .attr("r", 0)
      .attr("stroke", "#ed5454")
      .attr("stroke-width", "1px")
      .attr("fill", "#f8d7d7")
      .transition()
      .duration(1000)
      .attr("r", 4);

    // テキスト
    this.svg.selectAll(".text_" + i.toString())
      .data(that.dataSet)
      .enter()
      .append("text")
      .attr("class", "text_" + i.toString())
      .text(function (d) {
        return d[i];
      })
      .attr("font-size", "12px")
      .attr("fill", "#ed5454")
      .attr("x", function(d, j){
        return (j * that.dayWidth) + that.xAxisPadding + that.lineAreaPadding - 6;
      })
      .attr("y", function(d){
//        return that.svgHeight - that.lineAreaPadding - that.yAxisPadding - ((that.svgHeight - that.yAxisPadding - that.lineAreaPadding * 2) / 30 * d[i] ) + 16;
        return that.yScale(d[i]);
      });
  }
}


LineChart.prototype.drawAll = function() {
  if (this.svg == null) {
    this.svg = d3.select(this.SharpId)
              .append("svg")
              .attr("width", this.svgWidth)
              .attr("height", this.svgHeight);
  }

  this.drawAxis();
  this.drawLine();
  this.drawPoint();
}