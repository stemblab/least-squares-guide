#littlefoot = require('littlefoot').default
#littlefoot()


#lf = littlefoot
#  activateOnHover: true
#$  hoverDelay: 250

pi = Math.PI
T = numeric.transpose
rep = numeric.rep
pow = numeric.pow
dot = numeric.dot
add = numeric.add
sub = numeric.sub
norm = numeric.norm2
linspace = numeric.linspace


class d3Object

  constructor: (id) ->

    @element = d3.select "##{id}"
    @element.selectAll("svg").remove()
    @obj = @element.append "svg"
    @initAxes()

    append: (obj) -> @obj.append obj

    initAxes: ->


class Poly

  constructor: (@k1=0.5, @k2=-0.05) ->

    @p = [1, 3]

    @xd = [-0.7, -0.5, 0.3, 0.9]
    @yd = add(@eval(@xd, [@k1, @k2]), [0, 0, 0, 0])

    @A = @eqnMatrix(@xd, @p)

    @AtA = dot(T(@A), @A)

    @Aty = dot(T(@A), @yd)

    @est = numeric.solve(@AtA,@Aty)

    K1 = (i*0.1 for i in [1..9]) #linspace(0,1,4)
    K2 = (i*0.1 for i in [1..9]) #linspace(0,1,4)
    @D = @errors(K1, K2)

  eval: (x, c) ->
    A = @eqnMatrix(x, @p)
    dot(A, c)

  eqnMatrix: (x, p) ->
    lx = x.length
    lp = p.length
    reps = T(rep([lp], x)) # [[x0, x0, ...], [x1, x1, ...], ...] (lx x lp)
    powers = rep([lx], p) # [[p0, p1, ...]], [p0, p1, ...], ...] (lx x lp)
    pow(reps, powers)

  error: (k1, k2) ->
    norm(sub(dot(@A, [k1, k2]), @yd))

  errors: (K1, K2) ->

    #E = ((@error(k1, k2) for k1 in K1) for k2 in K2)

    D = []
    for k1 in K1
      for k2 in K2
        D.push {e:@error(k1, k2), k1:k1, k2:k2}

    D


poly = new Poly


class xyPlot extends d3Object

  margin = {top: 50, right: 50, bottom: 50, left: 50}
  width = 480 - margin.left - margin.right
  height = 480 - margin.top - margin.bottom

  constructor: (@k1=1, @k2=-0.1) ->

    super "board"

    @xf = linspace(-1, 1, 100) # fine x

    @xd = poly.xd
    @yd = poly.yd

    @dd = @d3Format(@xd, @yd) # format for d3

    c0 = poly.est

    #---- d3 ----#

    # SVG
    @obj.attr("id", "svg")
      .attr('width', '100%')
      .attr('viewBox', '0 0 480 480')
      #.attr('height', '100%')
      #.attr('preserveAspectRatio', 'xMidYMid meet')

    # border
    @obj.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", 480)
      .attr("width", 480)
      .style("stroke", "blue")
      .style("fill", "none")
      .style("stroke-width", 10);


    #---- plot ----#

    @plot = @obj.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      .attr('width', width)
      .attr('height', height)
      .attr('id','plot')

    @plot.append("g")
      .attr("id","x-axis")
      .attr("class", "axis")
      .attr("transform", "translate(0, #{height+10})")
      .call(@xAxis)

    @plot.append("g")
      .attr("id","y-axis")
      .attr("class", "axis")
      .attr("transform", "translate(-10, 0)")
      .call(@yAxis)

    @plot.selectAll("dot")
      .data(@dd)
      .enter().append("circle")
      .attr("r", 5)
      .attr("cx", (d) => @x(d.x))
      .attr("cy", (d) => @y(d.y));

    @pline = d3.line()
      .x((d) => @x(d.x))
      .y((d) => @y(d.y))

    @plot.append("g")
      .append("path")
      .datum([{x:-1,y:-1},{x:1,y:1}])
      .attr("id", "poly")
      .attr("d", @pline)
      .style("stroke", "red")


  #@draw()


  update1: (k1) ->
    @k1 = k1
    @draw()

  update2: (k2) ->
    @k2 = k2
    @draw()

  draw: () ->

    coefs = [@k1, @k2]

    # polynomial values (fine)
    yf = poly.eval(@xf, coefs)
    @dp = @d3Format(@xf, yf) # format for d3

    # polynomial values (coarse)
    yc = poly.eval(@xd, coefs)
    @squareData = @squarify(@xd, @yd, yc) # format for plot

    @plot.selectAll("#poly")
      #.data(@dp)
      .transition()
      .attr("d", @pline(@dp))
      .style("stroke", "green")
      .style("fill", "none")

    @plot.selectAll(".sq")
      .data(@squareData)
      .enter()
      .append("rect")
      .attr("class", "sq")
      .style("stroke", "blue")
      .style("fill", "none")
      .style("stroke-width", 1)

    @plot.selectAll(".sq")
      .data(@squareData)
      .transition()
      .attr("x", (d) => (d.x))
      .attr("y", (d) => (d.y))
      .attr("height", (d) => (d.e))
      .attr("width", (d) => (d.e))

  d3Format: (x, y) ->
    ({x:u, y:y[idx]} for u, idx in x)

  squarify: (xd, yd, yk) ->
    w = []
    for u, idx in xd
      x = @x(u)
      y = Math.min(@y(yd[idx]),@y(yk[idx]))
      e = Math.abs(@y(yk[idx])-@y(yd[idx]))
      x = x-e if yk[idx] < yd[idx]
      w[idx] = {x:x, y:y, e:e}
    w

  initAxes: ->

    @x = d3.scaleLinear()
      .domain([-1, 1])
      .range([0, width])

    @y = d3.scaleLinear()
      .domain([-1, 1])
      .range([height, 0])

    @xAxis = d3.axisBottom()
      .scale(@x)

    @yAxis = d3.axisLeft()
      .scale(@y)


class paramPlot extends d3Object

  margin = {top: 50, right: 50, bottom: 50, left: 50}
  width = 480 - margin.left - margin.right
  height = 480 - margin.top - margin.bottom

  constructor: (@k1=0.25, @k2=0.75) ->

    super "param"

    D = poly.D

    #---- d3 ----#

    # SVG
    @obj.attr("id", "svg")
      .attr('width', 480)
      .attr('height', 480)

    # border
    @obj.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", 480)
      .attr("width", 480)
      .style("stroke", "blue")
      .style("fill", "none")
      .style("stroke-width", 10);

    #---- parameter space ----#

    @space = @obj.append('g')
      .attr('transform', "translate(#{480},#{50})")
      .attr('width', width)
      .attr('height', height)
      .attr('id','space')

    xAxis = @space.append("g")
      .attr("id","x-axis")
      .attr("class", "axis")
      .attr("transform", "translate(0, #{height+10})")
      .call(@xAxis)

    @space.append("g")
      .attr("id","y-axis")
      .attr("class", "axis")
      .attr("transform", "translate(-10, 0)")
      .call(@yAxis)


    @cursor = @space.append("circle")
      .attr("r", 5)

    A = poly.AtA
    b = poly.Aty

    @xa = -1
    @xb = 1

    line1 = [
      {
        x: @xa
        y: 1/A[0][1]*(b[0]-A[0][0]*@xa)
      },
      {
        x: @xb
        y: 1/A[0][1]*(b[0]-A[0][0]*@xb)
      }
    ]

    line2 = [
      {
        x: @xa
        y: 1/A[1][1]*(b[1]-A[1][0]*@xa)
      },
      {
        x: @xb
        y: 1/A[1][1]*(b[1]-A[1][0]*@xb)
      }
    ]


    @pline = d3.line()
      .x((d) => @x(d.x))
      .y((d) => @y(d.y))

    @space.append("g")
      .append("path")
      .datum(line1)
      .attr("id", "poly")
      .attr("d", @pline)
      .style("stroke", "red")

    @space.append("g")
      .append("path")
      .datum(line2)
      .attr("id", "poly")
      .attr("d", @pline)
      .style("stroke", "red")



    #console.log "domain", [0, d3.max(D, (d) -> d.e)]
    @z.domain([0, d3.max(D, (d) -> d.e)])

    dk1 = 0.1
    dk2 = 0.2

    @space.selectAll(".tile")
      .data(D)
      .enter().append("rect")
      .attr("class", "tile")
      .attr("x", (d) => @x(d.k1-dk1/2))
      .attr("y", (d) => @y(d.k2+dk2/2))
      .attr("width", @x(dk1)-@x(0))
      .attr("height", @y(0)-@y(dk2))
      .style("fill", (d) => @z(d.e))
      #.style("stroke", "blue")


  update1: (k1) ->
    @k1 = k1
    @draw()

  update2: (k2) ->
    @k2 = k2
    @draw()

  draw: () ->

    @cursor.attr("cx", @x(@k1)).attr("cy", @x(@k2))


  initAxes: ->

    @x = d3.scaleLinear()
      .domain([-1, 1])
      .range([0, width])

    @y = d3.scaleLinear()
      .domain([-1, 1])
      .range([height, 0])

    @z = d3.scaleLinear()
      #.domain([0, 1])
      .range(["white", "steelblue"])

    @xAxis = d3.axisBottom()
      .scale(@x)

    @yAxis = d3.axisLeft()
      .scale(@y)



class Slider

  constructor: (@id, @change) ->
    @slider = $ "##{@id}"
    @sliderDisp = $ "##{@id}-value"
    @slider.unbind()  # needed to clear event handlers
    @slider.on "change", =>
      val = @val()
      @change val
      @sliderDisp.html(val)

  val: -> @slider.val()

xyplot = new xyPlot

paramplot = new paramPlot

new Slider "k1", (v) =>
  xyplot.update1(v)
  paramplot.update1(v)

new Slider "k2", (v) =>
  xyplot.update2(v)
  paramplot.update2(v)
