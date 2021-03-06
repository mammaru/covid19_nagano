/*********************************************************************************
* クラス BarChart
*
*
*
*
**********************************************************************************/

// コンストラクタ
var BarChart = function(id, size) {
  this.id = id;
  this.SharpId = "#" + id;
  this.parent = d3.select(this.SharpId);

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

  this.svgPadding = {"top": 50, "bottom": 50, "left": 20, "right": 20};
  this.xAxisPadding = 50;
  this.yAxisPadding = 50;
  this.color = ["red", "green", "blue", "yellow", "cyan", "gray"];   // 積み上げ棒グラフの色

  this.top = 0;
  this.bottom = 0;
  this.left = 0;
  this.right = 0;

  this.refresh();
}

// 表示内容を削除
BarChart.prototype.cleanView = function() {
  if (this.container != null) {
    while(this.container.firstChild) this.container.removeChild(this.container.firstChild);
    this.container = null;
  }
}

// データ、表示内容すべてをリセット
BarChart.prototype.refresh = function() {
  this.cleanView();

  this.dataSet = null;
  this.domain = null;
  this.span = null;
  this.color = null;

  this.dayWidth = null;
  this.slit = null;
  this.barWidth = null;

  this.xScale = null;
  this.yScale = null;

  if (!this.hasOwnProperty("container")) {
    this.container = this.parent.append("svg")
                .style("position", "relative")
                .attr("top", this.top)
                .attr("bottom", this.bottom)
                .attr("left", this.left)
                .attr("right", this.right)
                .attr("width", this.svgWidth)
                .attr("height", this.svgHeight);
  }

  if (!this.hasOwnProperty("axisLayer")) {
    this.axisLayer = this.container.append("svg")
      .attr("width", this.svgWidth)
      .attr("height", this.svgHeight)
  }

  if (!this.hasOwnProperty("graphLayer")) {
    this.graphLayer = this.container.append("svg")
      .attr("width", this.svgWidth)
      .attr("height", this.svgHeight)
  }
}


/********************************************************************
* データ
*/

// データをスタック形式に変換
BarChart.prototype.createStackData = function() {
  // 紛らわしいのでこれ重要
  var that = this;
  //console.log(that.domain[0].getFullYear() + "/" + (that.domain[0].getMonth() + 1) + "/" + that.domain[0].getDate());

  if (Math.abs(this.domain[1].getTime() - this.domain[0].getTime()) < 1000*60*60*24*2 &&
      this.domain[0].getDate() == this.domain[1].getDate()) {
    var currentData = this.data.filter(function(d) {
      if (d[0] == that.domain[0].getFullYear() + "/"
                + ("0" + (that.domain[0].getMonth() + 1)).slice(-2) + "/"
                + ("0" + that.domain[0].getDate()).slice(-2)) {
        return true;
      } else {
        return false;
      }
    });    
  } else {
    var currentData = this.data.filter(function(d) {
      //console.log(new Date(d[0]) >= that.domain[0], new Date(d[0]), that.domain[0]);
      if (new Date(d[0]) >= that.domain[0] && new Date(d[0]) <= that.domain[1]) {
        return true;
      } else {
        return false;
      }
    });
    //console.log(that.domain, currentData);
  }

  if (currentData.length > 0) {
    var list = currentData[0].map(function(d, i) { return []; } );
    list.pop();
  } else {
    console.log("aaaaaaaaa", currentData,this.domain)
    var list = [[]];
  }

  currentData.map(function(r) {
    r.map(function(d, ix) {
      if (ix != 0) list[ix - 1].push({"id": r[0] + "_" + ix, "x": r[0], "y": d});
    });
  });

  var stack = d3.layout.stack();
  var dataSet = stack(list);
  //throw new Error("aa");
  //alert(dataSet)

  //console.log(dataSet);

  return dataSet;
}

// プロパティにデータをセットし、スケールを設定
BarChart.prototype.setData = function(data, label, color) {
  this.data = data;
  this.setDomain([new Date(data[0][0]), new Date(data[data.length - 1][0])]);

  this.dataSet = this.createStackData();

  this.label = label;
  if (typeof color != "undefined") {
    this.color = color;
  }

  //console.log("data", data);
  //console.log("dataSet", this.dataSet);
 
  // スケールを設定
  this.setScale();
}


/********************************************************************
* スケールを設定
*/

BarChart.prototype.setDomain = function(domain) {
  this.domain = domain;

  if (domain[0].getHours() > 0 || domain[0].getMinutes() > 0 || domain[0].getSeconds() > 0) {
    var dt = new Date(domain[0].getFullYear(), domain[0].getMonth(), domain[0].getDate());
    //dt.setDate(dt.getDate() + 1);
    this.domain[0] = dt;
  }

  if (domain[1].getHours() > 0 || domain[1].getMinutes() > 0 || domain[1].getSeconds() > 0) {
    var dt = new Date(domain[1].getFullYear(), domain[1].getMonth(), domain[1].getDate());
    //dt.setDate(dt.getDate() + 1);
    this.domain[1] = dt;
  }

}

BarChart.prototype.setScale = function(domain) {
  // 紛らわしいのでこれ重要
  var that = this;

  if (typeof domain != "undefined") {
    this.setDomain(domain);
    this.dataSet = this.createStackData();
  }

  this.span = this.dataSet[0].length;
  //this.span = Math.ceil((this.domain[1].getTime() - this.domain[0].getTime())/(1000*60*60*24)) + 1;

  //console.log("span", this.span);
  this.dayWidth = (this.svgWidth - this.svgPadding.left - this.svgPadding.right - this.yAxisPadding) / this.span;
  this.slit = 0;//this.dayWidth*0.02;
  this.barWidth = this.dayWidth - this.slit;

  this.xScale = d3.time.scale()
    .domain(this.domain)
    .nice(this.span)
//    .range([that.svgPadding.left + that.yAxisPadding, that.svgWidth - that.svgPadding.right - that.svgPadding.left - that.yAxisPadding]);
//    .range([that.svgPadding.left + that.yAxisPadding, that.svgWidth - that.svgPadding.right]);
    .range([that.svgPadding.left + that.yAxisPadding, that.dayWidth*that.span]);
//i*that.dayWidth + (i - 1)*that.slit + that.svgPadding.left + that.yAxisPadding


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


/********************************************************************
* 描画
*
*
*********************************************************************/
// 新規に全て描画
BarChart.prototype.draw = function() {
  this.drawLegend();
  this.drawAxis();
  this.drawGraph();
}

// 捨てに描画済みの表示を更新
BarChart.prototype.update = function(domain) {
  this.setScale(domain);

  // 軸を更新
  this.updateAxis();

  // グラフを更新
  this.enterBar();
  this.exitBar();
}


/********************************************************************
* 凡例
*/
BarChart.prototype.drawLegend = function() {
  // 紛らわしいのでこれ重要
  var that = this;

  // 凡例
  var legend = this.container.append("svg")
    .attr("width", that.svgWidth)
    .attr("height", 50)
    .selectAll("g")
      .data(that.label)
      .enter()
    .append("g")
      .attr("class", "legend");

  legend.append("rect")
    .attr("x", 0)
    .attr("y", 7)
    .attr("width", 15)
    .attr("height", 15)
    .style("fill", function(d, i) { return that.color[i]; });

  legend.append("text")
    .attr("x", 20)
    .attr("y", 20)
    .text(function(d, i) { return d; })
    .attr("class", "textselected")
    .style("text-anchor", "start")
    .style("font-size", "1em");

  legend.attr("transform", function(d, i) {
    return "translate(" + (d3.sum(that.label, function(e, j) {
      if (j < i) {
        return legend[0][j].getBBox().width;
      } else {
        return 0;
      }
    }) + 20*i) + ", 0)";
  });
}


/********************************************************************
* 軸
*/

// 軸を新規に描画
BarChart.prototype.drawAxis = function() {
  // 紛らわしいのでこれ重要
  var that = this;

  // x軸
  var xAxis = d3.svg.axis()
    .scale(that.xScale)
    .ticks(that.span)
    .tickFormat(d3.time.format("%m/%d"))
    .tickSize(0)
//    .tickPadding([50])
//    .tickSize([0])
    .orient("bottom");

  this.axisLayer.append("g")
    .attr("class", "x axis")
//    .attr("transform", "translate(0, " + (that.svgHeight - that.xAxisPadding - that.svgPadding.bottom) + ")")
    .attr("transform", "translate(" + (that.dayWidth/2) + ", " + (that.svgHeight - that.xAxisPadding - that.svgPadding.bottom) + ")")
    .call(xAxis)
    .selectAll("text")
    .attr("transform", "rotate(90)")
    .attr("x", 10)
    .attr("y", "-0.5em")
//    .attr("y", -that.dayWidth/6)
    .style("text-anchor", "start")
    .style("font-size", "1em")
    .attr("fill", function(d) {
      var dt = new Date(d);
      if (dt.getDay() == 0) return "red";
      if (dt.getDay() == 6) return "blue";     
      return "black";
    });

  // y軸
  var yAxis = d3.svg.axis()
    .scale(that.yScale)
    //.tickSize(0)
    .tickFormat(function(d, i) {
        if (d==that.vMax) return d + "(枚)";
        return d;
    })
    .tickSize(0)
    .orient("left");
  //yAxis.select(".domain").remove();
  //yAxis.selectAll(".tick line").remove();

  this.axisLayer.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + (that.yAxisPadding + that.svgPadding.left) + ", 0)")
    .call(yAxis)
    .selectAll("text")
    .attr("x", -8)
    .attr("y", -8)
    .style("text-anchor", "end")
    .style("font-size", "1em");

  this.axisLayer.selectAll(".domain")
    .remove();

//  this.axisLayer.select(".y.axis")
//    .append("text")
//    .attr("transform", "rotate(-90)")
//    .attr("text-anchor", "end")
//    .style("font-size", "1em")
//    .attr("y", -(that.yAxisPadding/2))
//    .attr("x", -((that.svgHeight-that.xAxisPadding)/2))
//    .text("枚数")
//    .selectAll(".domain").remove();

  // grid
  var yGrid = d3.svg.axis()
    .scale(that.yScale)
    .tickSize(that.svgWidth)
    .tickFormat(function(d, i) {
        return d;
    });
  this.axisLayer.append("g")
    .attr("class", "y grid")
    .attr("transform", "translate(" + that.svgPadding.left + ", " + (that.svgHeight - that.svgPadding.bottom) + "),rotate(-90)")
    //.attr("transform", "rotate(-50)")
    .call(yGrid)
    .selectAll(".domain").remove();
}

// すでに描画済みの軸を更新
BarChart.prototype.updateAxis = function() {

  // 紛らわしいのでこれ重要
  var that = this;

  //console.log(that.xScale);
  // x軸
  var xAxis = d3.svg.axis()
    .scale(that.xScale)
    .ticks(that.span)
    .tickFormat(d3.time.format("%m/%d"))
    .tickSize(0)
//    .tickPadding([50])
//    .tickSize([0])
    .orient("bottom");
  this.axisLayer.select(".x.axis")
//    .attr("transform", "translate(0, " + (that.svgHeight - that.xAxisPadding - that.svgPadding.bottom) + ")")
    .attr("transform", "translate(" + (that.dayWidth/2) + ", " + (that.svgHeight - that.xAxisPadding - that.svgPadding.bottom) + ")")
    .call(xAxis)
    .selectAll("text")
    .attr("x", 10)
    .attr("y", "-0.5em")
//    .attr("y", -that.dayWidth/2)
    .attr("transform", "rotate(90)")
    .style("text-anchor", "start")
    .style("font-size", "1em")
    .attr("fill", function(d) {
      var dt = new Date(d);
      //alert(dt.getDay());
      if (dt.getDay() == 0) return "red";
      if (dt.getDay() == 6) return "blue";     
      return "black";
    });

  // y軸
  var yAxis = d3.svg.axis()
    .scale(that.yScale)
    .tickFormat(function(d, i) {
      if (d==that.vMax) return d + "(枚)";
      return d;
    })
    .tickSize(0)
    .orient("left");
  this.axisLayer.select(".y.axis")
    .attr("transform", "translate(" + (that.yAxisPadding + that.svgPadding.left) + ", 0)")
    .call(yAxis)
    .selectAll("text")
    .attr("x", -8)
    .attr("y", -8)
    .style("text-anchor", "end")
    .style("font-size", "1em");

  this.axisLayer.selectAll(".domain")
    .remove();


  // grid
  var yGrid = d3.svg.axis()
    .scale(that.yScale)
    .tickSize(that.svgWidth)
    .tickFormat(function(d, i) {
        return d;
    });
  this.axisLayer.select(".y.grid")
    .attr("transform", "translate(" + that.svgPadding.left + ", " + (that.svgHeight - that.svgPadding.bottom) + "),rotate(-90)")
    //.attr("transform", "rotate(-50)")
    .call(yGrid)
    .selectAll(".domain").remove();
}



/********************************************************************
* グラフ本体
*/

// グラフを新規に描画
BarChart.prototype.drawGraph = function() {
  // ツールチップ用
  this.tooltip = this.parent.append("div")
    .attr("class", "tooltip");

  this.enterBar();
}


// 新規データを描画
BarChart.prototype.enterBar = function() {
  // 紛らわしいのでこれ重要
  var that = this;

  var gEnter = this.graphLayer.selectAll("g")  // グループ化するので、それらを対象にする
    .data(that.dataSet)
    .enter()
    .append("g")    // グループ追加

  var gAll = this.graphLayer.selectAll("g");

  gAll
    .attr("fill", function(d, i){   // ここでグラフの色を設定する
        return that.color[i];
    });

  var barEnter = gAll.selectAll("rect")  // 棒グラフ1つを対象にする
    .data(function(d) {
      return d; 
    }) // 1つのデータを読み込む
    .enter()
    .append("rect"); // 棒グラフ1つ1つを生成する

  var barAll = gAll.selectAll("rect")  // 棒グラフ1つを対象にする

  barAll
    .attr("x", function(d, i) {  // X座標を計算
        //console.log("aaaa", d, i);
        //return that.xScale(new Date(d.x));
        return i*that.dayWidth + (i - 1)*that.slit + that.svgPadding.left + that.yAxisPadding;
    })
    .attr("y", function(d, i) { // 下から積み上げるための座標を計算
        //console.log("aaaa", d, i);
        return that.yScale(d.y0 + d.y);
    })
    .attr("width", that.barWidth)  // 棒グラフの横幅
    .attr("height", function(d) {    // 棒グラフの高さ
        return that.svgHeight - that.svgPadding.bottom - that.xAxisPadding - that.yScale(d.y);
    })
    .on("mouseover", function(d, i, labelIndex) {
      d3.select(this).style("opacity", 0.5);
      that.tooltip
        .style("visibility", "visible")
        .html(d.x + "<br/>" + that.label[labelIndex] + ":" + d.y);
    })
    .on("mousemove", function(d, i) {
      that.tooltip
        .style("top", (d3.event.pageY - 20) + "px")
        .style("left", (d3.event.pageX + 10) + "px");
    })
    .on("mouseout", function(d, i) {
      d3.select(this).style("opacity", 1);
      that.tooltip.style("visibility", "hidden");
    })
    .on("click", function(d, i) {
      var dt = new Date(d.x);
      var yyyymmdd = dt.getFullYear() + ("0" + (dt.getMonth() + 1)).slice(-2) + ("0" + dt.getDate()).slice(-2);
      window.open("./data/daily/" + yyyymmdd + ".html");
    });
}

// 不要なバーを削除
BarChart.prototype.exitBar = function() {
  var stack = this.graphLayer.selectAll("g")
    .data(this.dataSet);

  var bars = stack.selectAll("rect")
    .data(function(d) {
      //console.log("2", d);
      return d;
    }) // 1つのデータを読み込む
    .exit()
    .remove();
}









