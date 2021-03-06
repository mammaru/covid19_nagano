var AreaChart = function(id, size) {
  this.id = id;
  this.SharpId = "#" + id;

  var defaultSvgWidth = 1400;
  var defaultSvgHeight = 700;
  if (typeof size == "undefined") {
    this.svgWidth = defaultSvgWidth;
    this.svgHeight = defaultSvgHeight;
  } else {
    if (size.hasOwnProperty("width")) {
      this.svgWidth = size.width;
    } else {
      this.svgWidth = defaultSvgWidth;
    }
    if (size.hasOwnProperty("height")) {
      this.svgHeight = size.height;
    } else {
      this.svgHeight = defaultSvgHeight;
    }
  }
  this.svgPadding = {"top": 10, "bottom": 10, "left": 10, "right": 10};
  this.xAxisPadding = 40;
  this.yAxisPadding = 40;

  this.container = null;

  this.top = 0;
  this.bottom = 0;
  this.left = 0;
  this.right = 0;

  this.color = ["red", "green", "blue", "yellow", "cyan", "gray"];

  this.interpolate = "monotone";
  //this.interpolate = "cardinal";

  this.refresh();
}

AreaChart.prototype.cleanView = function() {
  if (this.container != null) {
    while(this.container.firstChild) this.container.removeChild(this.container.firstChild);
  }
}

AreaChart.prototype.refresh = function(force) {
  this.cleanView();

  this.dataSet = null;
  this.domain = null;
  this.span = null;

  this.dayWidth = null;

  this.xScale = null;
  this.yScale = null;

  if (this.container == null) {
    this.container = d3.select(this.SharpId)
      .append("svg")
      .style("position", "relative")
      .attr("top", this.top)
      .attr("bottom", this.bottom)
      .attr("left", this.left)
      .attr("right", this.right)
      .attr("width", this.svgWidth)
      .attr("height", this.svgHeight);
  }

  if (!this.hasOwnProperty("axisLayer") || force == true) {
    this.axisLayer = this.container.append("svg")
      .attr("width", this.svgWidth)
      .attr("height", this.svgHeight);
  }

  if (!this.hasOwnProperty("graphLayer") || force == true) {
    this.graphLayer = this.container.append("svg")
      .attr("width", this.svgWidth)
      .attr("height", this.svgHeight);
  }
}

AreaChart.prototype.setData = function(data, label, color) {
  this.data = data;
  this.domain = [new Date(data[0][0]), new Date(data[data.length - 1][0])];

  this.dataSet = this.createStackData();
  this.dataLength = data.length;
  this.label = label;
  if (typeof color != "undefined") {
    this.color = color;
  }

  this.setScale();
}

AreaChart.prototype.setScale = function(domain) {
  // 紛らわしいのでこれ重要
  var that = this;

  if (typeof domain != "undefined") {
    this.domain = domain;
    this.dataSet = this.createStackData(this.currentData);
  }

  this.span = this.dataSet[0].length;
  //this.span = Math.ceil((this.domain[1].getTime() - this.domain[0].getTime())/(1000*60*60*24)) + 1;

  this.dayWidth = (this.svgWidth - (this.svgPadding.left + this.svgPadding.right) - this.yAxisPadding) / (this.span - 1);

  this.xScale = d3.time.scale()
    .domain(this.domain)
    .nice(this.span)
    .range([that.svgPadding.left + that.yAxisPadding, that.svgWidth - that.svgPadding.right]);

  //this.vMax = d3.max(data, function(r) { return d3.max(r.map(function(d, ix) { return ix!=0 ? Number(d) : 0; })); });
  //this.vMax = Math.ceil(that.vMax / 10) * 10;
  this.vMax = d3.max(this.data, function(r) {
    if (new Date(r[0]) >= that.domain[0] && new Date(r[0]) <= that.domain[1]) {
      return r.reduce(function (previous, current, ix, array) {
        return (ix == 1) ? current : previous + current;
      });
    } else {
      return 0;
    }
  });
  this.vMax = Math.ceil(that.vMax / 10) * 10;
  this.yScale = d3.scale.linear()
    .domain([0, that.vMax])
    .range([that.svgHeight - that.xAxisPadding - that.svgPadding.bottom, that.svgPadding.top]);
}

AreaChart.prototype.drawAxis = function() {
  var that = this;

  // 軸
  var xAxis = d3.svg.axis()
    .scale(that.xScale)
//    .ticks(Math.ceil(that.span/30))
    .ticks(that.span)
    .tickFormat(d3.time.format("%m/%d"));
  var yAxis = d3.svg.axis()
    .scale(that.yScale)
    .orient("left");

  this.axisLayer.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0, " + (that.svgHeight - that.svgPadding.bottom - that.xAxisPadding) + ")")
    .call(xAxis)
    .selectAll("text")
    .attr("x", 10)
    .attr("y", -5)
    .attr("transform", "rotate(90)")
    .style("text-anchor", "start");
  this.axisLayer.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + (that.yAxisPadding + that.svgPadding.left) + ", 0)")
    .call(yAxis);
}

AreaChart.prototype.drawArea = function() {
  var that = this;

  var area = d3.svg.area()
    .x(function(d, j){
      //console.log(d, j);
      return j * that.dayWidth + that.yAxisPadding + that.svgPadding.left;
      //return that.xScale(d.x);
    })
    .y0(function(d, j){
       //console.log(d, j, i);
      return that.yScale(d.y0);
    })
    .y1(function(d, j){
      //console.log(d, j);
      return that.yScale(d.y0 + d.y);
    });

  if (this.interpolate) area.interpolate(this.interpolate);

  var layer = this.graphLayer.selectAll("path")  // グループ化するので、それらを対象にする
    .data(that.dataSet)
    .enter().append("path")    // グループ追加
    .attr("class", "layer")
    .style("fill", function(d, i){   // ここでグラフの色を設定する
      return that.color[i];
    })
    .attr("d", function(d) { 
      //console.log(d);
      return area(d);
    });
}


AreaChart.prototype.drawAll = function() {
  this.drawAxis();
  this.drawArea();
}

AreaChart.prototype.createStackData = function() {
  // 紛らわしいのでこれ重要
  var that = this;
  //console.log(this.domain);

  var currentData = this.data.filter(function(d) {
    if (new Date(d[0]) >= that.domain[0] && new Date(d[0]) <= that.domain[1]) {
      return true;
    } else {
      return false;
    }
  });
  //console.log(that.domain, currentData);

  if (currentData.length > 0) {
    var list = currentData[0].map(function(d) { return [];});
    list.pop();
  } else {
    var list = [[]];
  }

  currentData.map(function(r) {
    r.map(function(d, ix) {
      if (ix != 0) list[ix - 1].push({"x": r[0], "y": d});
    });
  });

  var stack = d3.layout.stack();
  var dataSet = stack(list);
  //throw new Error("aa");
  //alert(dataSet)

  return dataSet;
}