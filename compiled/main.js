(function() {
  var Poly, Slider, T, add, cfg, d3Object, dot, linspace, mb, mr, norm, paramPlot, paramplot, pi, poly, pow, rep, sld, sub, xyPlot, xyplot,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  pi = Math.PI;

  T = numeric.transpose;

  rep = numeric.rep;

  pow = numeric.pow;

  dot = numeric.dot;

  add = numeric.add;

  sub = numeric.sub;

  norm = numeric.norm2;

  linspace = numeric.linspace;

  mr = new Vue({
    el: "#my-range",
    data: {
      value: 20
    }
  });

  mb = new Vue({
    el: "#my-button",
    data: {
      message: "????"
    },
    methods: {
      report: function() {
        return mr.value += 1;
      }
    }
  });

  d3Object = (function() {
    function d3Object(id) {
      this.element = d3.select("#" + id);
      this.element.selectAll("svg").remove();
      this.obj = this.element.append("svg");
      this.initAxes();
      ({
        append: function(obj) {
          return this.obj.append(obj);
        },
        initAxes: function() {}
      });
    }

    return d3Object;

  })();

  Poly = (function() {
    function Poly(k11, k21) {
      var K1, K2, i;
      this.k1 = k11 != null ? k11 : 0.5;
      this.k2 = k21 != null ? k21 : -0.05;
      this.p = [1, 3];
      this.xd = [-0.7, -0.5, 0.3, 0.9];
      this.yd = add(this["eval"](this.xd, [this.k1, this.k2]), [0, 0, 0, 0]);
      this.A = this.eqnMatrix(this.xd, this.p);
      this.AtA = dot(T(this.A), this.A);
      this.Aty = dot(T(this.A), this.yd);
      this.est = numeric.solve(this.AtA, this.Aty);
      K1 = (function() {
        var j, results;
        results = [];
        for (i = j = 1; j <= 9; i = ++j) {
          results.push(i * 0.1);
        }
        return results;
      })();
      K2 = (function() {
        var j, results;
        results = [];
        for (i = j = 1; j <= 9; i = ++j) {
          results.push(i * 0.1);
        }
        return results;
      })();
      this.D = this.errors(K1, K2);
    }

    Poly.prototype["eval"] = function(x, c) {
      var A;
      A = this.eqnMatrix(x, this.p);
      return dot(A, c);
    };

    Poly.prototype.eqnMatrix = function(x, p) {
      var lp, lx, powers, reps;
      lx = x.length;
      lp = p.length;
      reps = T(rep([lp], x));
      powers = rep([lx], p);
      return pow(reps, powers);
    };

    Poly.prototype.error = function(k1, k2) {
      return norm(sub(dot(this.A, [k1, k2]), this.yd));
    };

    Poly.prototype.errors = function(K1, K2) {
      var D, j, k, k1, k2, len, len1;
      D = [];
      for (j = 0, len = K1.length; j < len; j++) {
        k1 = K1[j];
        for (k = 0, len1 = K2.length; k < len1; k++) {
          k2 = K2[k];
          D.push({
            e: this.error(k1, k2),
            k1: k1,
            k2: k2
          });
        }
      }
      return D;
    };

    return Poly;

  })();

  poly = new Poly;

  xyPlot = (function(superClass) {
    var height, margin, width;

    extend(xyPlot, superClass);

    margin = {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50
    };

    width = 480 - margin.left - margin.right;

    height = 480 - margin.top - margin.bottom;

    function xyPlot(k11, k21) {
      var c0;
      this.k1 = k11 != null ? k11 : 1;
      this.k2 = k21 != null ? k21 : -0.1;
      xyPlot.__super__.constructor.call(this, "board");
      this.xf = linspace(-1, 1, 100);
      this.xd = poly.xd;
      this.yd = poly.yd;
      this.dd = this.d3Format(this.xd, this.yd);
      c0 = poly.est;
      this.obj.attr("id", "svg").attr('width', '100%').attr('viewBox', '0 0 480 480');
      this.obj.append("rect").attr("x", 0).attr("y", 0).attr("height", 480).attr("width", 480).style("stroke", "blue").style("fill", "none").style("stroke-width", 10);
      this.plot = this.obj.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')').attr('width', width).attr('height', height).attr('id', 'plot');
      this.plot.append("g").attr("id", "x-axis").attr("class", "axis").attr("transform", "translate(0, " + (height + 10) + ")").call(this.xAxis);
      this.plot.append("g").attr("id", "y-axis").attr("class", "axis").attr("transform", "translate(-10, 0)").call(this.yAxis);
      this.plot.selectAll("dot").data(this.dd).enter().append("circle").attr("r", 5).attr("cx", (function(_this) {
        return function(d) {
          return _this.x(d.x);
        };
      })(this)).attr("cy", (function(_this) {
        return function(d) {
          return _this.y(d.y);
        };
      })(this));
      this.pline = d3.line().x((function(_this) {
        return function(d) {
          return _this.x(d.x);
        };
      })(this)).y((function(_this) {
        return function(d) {
          return _this.y(d.y);
        };
      })(this));
      this.plot.append("g").append("path").datum([
        {
          x: -1,
          y: -1
        }, {
          x: 1,
          y: 1
        }
      ]).attr("id", "poly").attr("d", this.pline).style("stroke", "red");
    }

    xyPlot.prototype.update1 = function(k1) {
      this.k1 = k1;
      return this.draw();
    };

    xyPlot.prototype.update2 = function(k2) {
      this.k2 = k2;
      return this.draw();
    };

    xyPlot.prototype.draw = function() {
      var coefs, yc, yf;
      coefs = [this.k1, this.k2];
      yf = poly["eval"](this.xf, coefs);
      this.dp = this.d3Format(this.xf, yf);
      yc = poly["eval"](this.xd, coefs);
      this.squareData = this.squarify(this.xd, this.yd, yc);
      this.plot.selectAll("#poly").transition().attr("d", this.pline(this.dp)).style("stroke", "green").style("fill", "none");
      this.plot.selectAll(".sq").data(this.squareData).enter().append("rect").attr("class", "sq").style("stroke", "blue").style("fill", "none").style("stroke-width", 1);
      return this.plot.selectAll(".sq").data(this.squareData).transition().attr("x", (function(_this) {
        return function(d) {
          return d.x;
        };
      })(this)).attr("y", (function(_this) {
        return function(d) {
          return d.y;
        };
      })(this)).attr("height", (function(_this) {
        return function(d) {
          return d.e;
        };
      })(this)).attr("width", (function(_this) {
        return function(d) {
          return d.e;
        };
      })(this));
    };

    xyPlot.prototype.d3Format = function(x, y) {
      var idx, j, len, results, u;
      results = [];
      for (idx = j = 0, len = x.length; j < len; idx = ++j) {
        u = x[idx];
        results.push({
          x: u,
          y: y[idx]
        });
      }
      return results;
    };

    xyPlot.prototype.squarify = function(xd, yd, yk) {
      var e, idx, j, len, u, w, x, y;
      w = [];
      for (idx = j = 0, len = xd.length; j < len; idx = ++j) {
        u = xd[idx];
        x = this.x(u);
        y = Math.min(this.y(yd[idx]), this.y(yk[idx]));
        e = Math.abs(this.y(yk[idx]) - this.y(yd[idx]));
        if (yk[idx] < yd[idx]) {
          x = x - e;
        }
        w[idx] = {
          x: x,
          y: y,
          e: e
        };
      }
      return w;
    };

    xyPlot.prototype.initAxes = function() {
      this.x = d3.scaleLinear().domain([-1, 1]).range([0, width]);
      this.y = d3.scaleLinear().domain([-1, 1]).range([height, 0]);
      this.xAxis = d3.axisBottom().scale(this.x);
      return this.yAxis = d3.axisLeft().scale(this.y);
    };

    return xyPlot;

  })(d3Object);

  paramPlot = (function(superClass) {
    var height, margin, width;

    extend(paramPlot, superClass);

    margin = {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50
    };

    width = 480 - margin.left - margin.right;

    height = 480 - margin.top - margin.bottom;

    function paramPlot(k11, k21) {
      var A, D, b, dk1, dk2, line1, line2, xAxis;
      this.k1 = k11 != null ? k11 : 0.25;
      this.k2 = k21 != null ? k21 : 0.75;
      paramPlot.__super__.constructor.call(this, "param");
      D = poly.D;
      this.obj.attr("id", "svg").attr('width', '100%').attr('viewBox', '0 0 480 480');
      this.obj.append("rect").attr("x", 0).attr("y", 0).attr("height", 480).attr("width", 480).style("stroke", "blue").style("fill", "none").style("stroke-width", 10);
      this.space = this.obj.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')').attr('width', width).attr('height', height).attr('id', 'space');
      xAxis = this.space.append("g").attr("id", "x-axis").attr("class", "axis").attr("transform", "translate(0, " + (height + 10) + ")").call(this.xAxis);
      this.space.append("g").attr("id", "y-axis").attr("class", "axis").attr("transform", "translate(-10, 0)").call(this.yAxis);
      this.cursor = this.space.append("circle").attr("r", 5);
      A = poly.AtA;
      b = poly.Aty;
      this.xa = -1;
      this.xb = 1;
      line1 = [
        {
          x: this.xa,
          y: 1 / A[0][1] * (b[0] - A[0][0] * this.xa)
        }, {
          x: this.xb,
          y: 1 / A[0][1] * (b[0] - A[0][0] * this.xb)
        }
      ];
      line2 = [
        {
          x: this.xa,
          y: 1 / A[1][1] * (b[1] - A[1][0] * this.xa)
        }, {
          x: this.xb,
          y: 1 / A[1][1] * (b[1] - A[1][0] * this.xb)
        }
      ];
      this.pline = d3.line().x((function(_this) {
        return function(d) {
          return _this.x(d.x);
        };
      })(this)).y((function(_this) {
        return function(d) {
          return _this.y(d.y);
        };
      })(this));
      this.space.append("g").append("path").datum(line1).attr("id", "poly").attr("d", this.pline).style("stroke", "red");
      this.space.append("g").append("path").datum(line2).attr("id", "poly").attr("d", this.pline).style("stroke", "red");
      this.z.domain([
        0, d3.max(D, function(d) {
          return d.e;
        })
      ]);
      dk1 = 0.1;
      dk2 = 0.2;
      this.space.selectAll(".tile").data(D).enter().append("rect").attr("class", "tile").attr("x", (function(_this) {
        return function(d) {
          return _this.x(d.k1 - dk1 / 2);
        };
      })(this)).attr("y", (function(_this) {
        return function(d) {
          return _this.y(d.k2 + dk2 / 2);
        };
      })(this)).attr("width", this.x(dk1) - this.x(0)).attr("height", this.y(0) - this.y(dk2)).style("fill", (function(_this) {
        return function(d) {
          return _this.z(d.e);
        };
      })(this));
    }

    paramPlot.prototype.update1 = function(k1) {
      this.k1 = k1;
      return this.draw();
    };

    paramPlot.prototype.update2 = function(k2) {
      this.k2 = k2;
      return this.draw();
    };

    paramPlot.prototype.draw = function() {
      return this.cursor.attr("cx", this.x(this.k1)).attr("cy", this.x(this.k2));
    };

    paramPlot.prototype.initAxes = function() {
      this.x = d3.scaleLinear().domain([-1, 1]).range([0, width]);
      this.y = d3.scaleLinear().domain([-1, 1]).range([height, 0]);
      this.z = d3.scaleLinear().range(["white", "steelblue"]);
      this.xAxis = d3.axisBottom().scale(this.x);
      return this.yAxis = d3.axisLeft().scale(this.y);
    };

    return paramPlot;

  })(d3Object);

  sld = document.getElementById('testy');

  cfg = {
    start: [20, 80],
    connect: true,
    range: {
      'min': 0,
      'max': 100
    }
  };

  console.log("cfg", cfg);

  noUiSlider.create(sld, cfg);

  Slider = (function() {
    function Slider(id1, change) {
      this.id = id1;
      this.change = change;
      this.slider = $("#" + this.id);
      this.sliderDisp = $("#" + this.id + "-value");
      this.slider.unbind();
      this.slider.on("change", (function(_this) {
        return function() {
          var val;
          val = _this.val();
          _this.change(val);
          return _this.sliderDisp.html(val);
        };
      })(this));
    }

    Slider.prototype.val = function() {
      return this.slider.val();
    };

    return Slider;

  })();

  xyplot = new xyPlot;

  paramplot = new paramPlot;

  new Slider("k1", (function(_this) {
    return function(v) {
      xyplot.update1(v);
      return paramplot.update1(v);
    };
  })(this));

  new Slider("k2", (function(_this) {
    return function(v) {
      xyplot.update2(v);
      return paramplot.update2(v);
    };
  })(this));

}).call(this);

//# sourceMappingURL=main.js.map
