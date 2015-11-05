'use strict';

_.mixin({ 'flatMap': _.compose(_.flatten, _.map) });
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

		svg.classed('line', true);
		var drawing = svg.append('g').classed('base', true);
		var gridlineChart = drawing.chart('Gridlines');

		var lines = drawing.append('g').classed('lines', true);

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

		//Create a layer that is responsible for each mark
		self.layer('marks', lines, {
			dataBind: function (dataIn)
			{

				var lineData = getLineData(dataIn);
				if (self._chart.stackOffset)
				{
					lineData = stackLayout.offset(self._chart.stackOffset)(lineData);
				}

				xAxis.scale().domain([new Date(dataIn.stats.min), new Date(dataIn.stats.max)]);
				xAxis.label = self._chart.xAxisLabel;

				//Determine space for labels
				var labelSizer = lines.append('g').classed('linegrp', true);
				_.forEach(lineData, function (line)
				{
					labelSizer.append('text').attr('dx', -300).attr('class', 'linelabel').text(line.label);
				});

				//Configure Y axis
				var yMarks = _.flatMap(lineData, function (line){
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
				var margins = {top: 10, bottom: 0, left: 5, right: labelPadding - 5};
				drawingSize = AxisHelper.drawAxis([xAxis, yAxis], drawing, self._width, self._height, pad, margins);

				//Gridlines
				gridlineChart.draw([{axis: yAxis, drawingPos: drawingSize}]);

				return this.selectAll('g.marks').data(lineData);
			},
			insert: function ()
			{
				var lineGrp = this.append('g').classed('marks', true);
				lineGrp.append('path').classed('line', true);
				lineGrp.append('text').classed('linelabel', true)
						.attr('text-anchor', 'start')
						.attr('dy', 5);
				return lineGrp;
			},
			events: {
				'merge:transition': function ()
				{
					var pathFunction = self._chart.stackOffset ? area : line;

					var labelX = xAxis.scale().range()[1];

					this.select('text')
						.text(function (l){ return l.label; })
						.attr('x', labelX)
						.attr('y', function (l)
						{
							var yVal = l.marks[l.marks.length - 1];
							return yAxis.scale()(yVal.y0 ? yVal.y / 2 + yVal.y0 : yVal.y);
						})
						.attr('class', 'linelabel '+ (self._chart.stackOffset ? 'area' : 'line'));


					this.select('path')
						.attr('stroke', applyLineColor)
						.attr('fill', applyLineColor)
						.attr('d', function (l)
						{
							return pathFunction(l.marks);
						})
						.attr('class', self._chart.stackOffset ? 'area' : 'line');

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
