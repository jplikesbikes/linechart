'use strict';

var flatMap = _.compose(_.flatten, _.map);
d3.chart('dv-line', {
	initialize: function ()
	{

		var self = this;
		var svg = self.base;

		//Configure this chart
		var xAxis = d3.svg.axis();
		xAxis.scale(d3.time.scale());
		xAxis.orient('bottom');

		var yAxis = d3.svg.axis();
		yAxis.scale(d3.scale.linear());
		yAxis.orient('left');

		var lineColor = d3.scale.category20c();
		function applyLineColor(d)
		{
			return lineColor(d.label);
		}

		var drawTimeIndex = _.curry(function(x, y, selection){
			var lines = selection.selectAll('line.time-index').data(_.identity);

			// enter
			lines.enter().append('line').classed('time-index', true);

			// enter + update
			lines
				.transition(500)
				.attr('y1', y.range()[0])
				.attr('y2', y.range()[1])
				.attr('x1', x)
				.attr('x2', x);

			// exit
			lines.exit().remove()
		});

		svg.classed('line', true);
		var drawing = svg.append('g').classed('base', true);
		var gridlineChart = drawing.chart('Gridlines');

		var lines = drawing.append('g').classed('lines', true);
		var dots = drawing.append('g').classed('dots', true);

		var timeIndexGroup = drawing.append('g').classed('time-index', true);

		var drawingSize, labelHeight;

		var minYVal, maxYVal;

		var line = d3.svg.line()
				.x(function (d){ return xAxis.scale()(d.x); })
				.y(function (d){ return yAxis.scale()(d.y); });

		var area = d3.svg.area()
				.x(function (d){ return xAxis.scale()(d.x); })
				.y0(function (d){ return yAxis.scale()(d.y0 + minYVal); })
				.y1(function (d){ return yAxis.scale()(d.y0 + minYVal + d.y); });

		var stackLayout = d3.layout.stack()
				.values(function (d)
				{
					return d.marks;
				});

		var draw = function(selection){
			var pathFunction = self._chart.stackOffset ? area : line;
			var labelX = xAxis.scale().range()[1];
			selection.select('text')
					.transition()
					.text(function (l){
						return l.label;
					})
					.attr('x', labelX)
					.attr('y', function (l)
					{
						var yVal = l.marks[l.marks.length - 1];
						return yAxis.scale()(yVal.y0 ? yVal.y / 2 + yVal.y0 : yVal.y);
					})
					.attr('class', 'linelabel '+ (self._chart.stackOffset ? 'area' : 'line'));

			selection.select('path')
					.transition()
					.attr('stroke', applyLineColor)
					.attr('fill', applyLineColor)
					.attr('d', function (l)
					{
						return pathFunction(l.marks);
					})
					.attr('class', self._chart.stackOffset ? 'area' : 'line');
		};

		var lastClosestTime;
		var timeThresholdScale = d3.scale.threshold();
		function mouseForTime(){
			if(self._chart.relativeToMoment) {
				var cursorAt = xAxis.scale().invert(d3.mouse(this)[0]).getTime();
				var closestTime = timeThresholdScale(cursorAt).getTime();
				if(closestTime !== lastClosestTime) {

					// update the timeIndex line
					timeIndexGroup.datum([closestTime]);
					drawTimeIndex(xAxis.scale(), yAxis.scale(), timeIndexGroup);

					lastClosestTime = closestTime;
					var d = _.cloneDeep(self.baseData);
					d.marks.forEach(function (mark) {
						mark[1] = timeFunctions[self._chart.relativeToMoment](closestTime, [mark[1]])[0];
					});
					var lineData = databind(d);

					lines.datum(lineData).selectAll('g.marks').data(_.identity).call(draw);
				}
			}
		}

		var circles = _.curry(function (x, y, selection) {
			var circles = selection.selectAll('circle').data(_.identity);

			// enter
			circles.enter().append('circle');

			// enter + update
			circles
				//.transition(500)
				.attr('stroke', applyLineColor)
				.attr('cx', function(d){
					return x(d.x);
				})
				.attr('cy', function(d){
					return y(d.y + (d.y0 || 0));
				});

			circles.exit().remove();
		});

		var mt = giveMouseMove(xAxis.scale(), yAxis.scale(), mouseForTime);

		var lastClosestTimeDot;
		function mouseDots() {
			var cursorAt = xAxis.scale().invert(d3.mouse(this)[0]).getTime();
			var closestTime = timeThresholdScale(cursorAt).getTime();
			if (closestTime !== lastClosestTimeDot) {
				lastClosestTimeDot = closestTime;
				var lineData = lines.selectAll('g.marks').data();
				var dotsData = _.reduce(lineData, function(agg, d){
					var idx = _.findIndex(d.marks, function(m){ return m.x.getTime() === closestTime });
					if(idx !== -1) {
						var c = _.cloneDeep(d.marks[idx]);
						c.label = d.label;
						agg.push(c);
					}
					return agg;
				}, []);

				dots.datum(dotsData);
				circles(xAxis.scale(), yAxis.scale(), dots);
			}
		}
		var md = giveMouseMove(xAxis.scale(), yAxis.scale(), mouseDots);

		function getLineData(dataIn){
			return dataIn.marks.map(function(mark){
				var points = mark[mark.length-1];
				return {
					label: mark.slice(0,mark.length-1).join(', '),
					marks: points.map(function(p){
						return {
							x: new Date(p[1]),
							y: p[0]
						}
					})
				}
			});
		}

		var databind = function(dataIn){
			var lineData = getLineData(dataIn);
			if (self._chart.stackOffset)
			{
				lineData = stackLayout.offset(self._chart.stackOffset)(lineData);
			}

			xAxis.label = self._chart.xAxisLabel;
			xAxis.scale().domain([new Date(dataIn.stats.min), new Date(dataIn.stats.max)]);

			function getTime(t){ return t.getTime(); }
			var at = _.sortBy(flatMap(lineData, function(d){ return _.pluck(d.marks, 'x')}), getTime);
			var times = _.uniq(at, getTime, true);
			timeThresholdScale.domain(midPoints(times)).range(times);

			//Determine space for labels
			var labelSizer = lines.append('g').classed('linegrp', true);
			_.forEach(lineData, function (line)
			{
				labelSizer.append('text').attr('dx', -300).attr('class', 'linelabel').text(line.label);
			});

			//Configure Y axis
			var yMarks =flatMap(lineData, function (line){
				return _.map(line.marks, function (mark)
				{
					return mark.y + (mark.y0 || 0);
				});
			});

			minYVal = _.min(yMarks);
			maxYVal = _.max(yMarks);
			yAxis.scale().domain([maxYVal, minYVal]);

			//Pass it to axis helper to move it into place
			var labelBBox = labelSizer[0][0].getBBox();
			var labelPadding = labelBBox.width;
			labelHeight = labelBBox.height;
			labelSizer.remove();
			var pad = {top: 0, bottom: 5, left: 0, right: 0};
			var margins = {top: 0, bottom: 0, left: 5, right: labelPadding + 10};
			drawingSize = AxisHelper.drawAxis([xAxis, yAxis], drawing, self._width, self._height, pad, margins);

			//Gridlines
			gridlineChart.draw([{axis: yAxis, drawingPos: drawingSize}]);
			return lineData;
		};

		function selectLine(d, i){
			if(self._chart.relativeToTimeSeries) {

				var d = _.cloneDeep(self.baseData);
				var ts = d.marks[i][1];
				d.marks.forEach(function (mark) {
					mark[1] = timeFunctions[self._chart.relativeToTimeSeries](ts, [mark[1]])[0];
				});
				var lineData = databind(d);

				lines.datum(lineData).selectAll('g.marks').data(_.identity).call(draw);
			}
		}

		//Create a layer that is responsible for each mark
		self.layer('marks', lines, {
			dataBind: function (dataIn)
			{
				self.baseData = dataIn;
				var lineData = databind(dataIn);
				return this.selectAll('g.marks').data(lineData);
			},
			insert: function ()
			{
				var lineGrp = this.append('g').classed('marks', true);
				lineGrp.append('path').classed('line', true)
						.attr('stroke', applyLineColor)
						.attr('fill', applyLineColor);
				lineGrp.append('text').classed('linelabel', true)
						.attr('text-anchor', 'start')
						.attr('dy', 5)
						.attr('dx', 5)
						.on('click', selectLine);
				return lineGrp;
			},
			events: {
				'merge:transition': function ()
				{

					mt(drawing.select('.all-axis .bottom'));
					md(dots);


					draw(this);

					return this;
				},
				'exit': function ()
				{
					return this.remove();
				}
			}
		});
	},
	width: function (w)
	{
		if (!w)
		{
			return this._width;
		}
		this._width = w;
		return this;
	},
	height: function (h)
	{
		if (!h)
		{
			return this._height;
		}
		this._height = h;
		return this;
	},
	config: function (c)
	{
		if (!c)
		{
			return this._chart;
		}
		this._chart = c;
		return this;
	},
	interactionMode: function (m)
	{
		if (!m)
		{
			return this._interactionMode;
		}
		this._interactionMode = m;
		return this;
	},
	addEventHandler: function(event, callback){
		this.on(event, callback);
		return this;
	},
	drawChart: function(data){
		this.draw(data);
	}
});
