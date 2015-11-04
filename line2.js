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
		self.layer('lines', lines, {
			dataBind: function (dataIn)
			{

				var lineData = getLineData(dataIn);
				if (self._chart.stackOffset)
				{
					lineData = stackLayout.offset(self._chart.stackOffset)(lineData);
					// @todo: also need to do a missing value strategy here
				}

				xAxis.scale().domain([new Date(dataIn.stats.min), new Date(dataIn.stats.max)]);
				xAxis.scale().nice();
				xAxis.label = self._chart.xAxisLabel;

				//Determine space for labels
				var labelSizer = lines.append('g').classed('linegrp', true);
				_.forEach(lineData, function (line)
				{
					labelSizer.append('text').attr('dx', -300).attr('class', 'linelabel').text(line.label);
				});

				var labelBBox = labelSizer[0][0].getBBox();
				var labelPadding = labelBBox.width;
				labelHeight = labelBBox.height;
				labelSizer.remove();

				var margins = {top: 10, bottom: 0, left: 5, right: labelPadding - 5};



				//Configure Y axis
				var yMarks = [];
				_.forEach(lineData, function (line)
				{
					_.forEach(line.marks, function (mark)
					{
						yMarks.push(mark.y0 ? mark.y + mark.y0 : mark.y);
					});
				});

				minYVal = _.min(yMarks);
				maxYVal = _.max(yMarks); // + minYVal;
				yAxis.scale().domain([maxYVal, minYVal]);

				//Pass it to axis helper to move it into place
				var pad = {top: 0, bottom: 5, left: 0, right: 0};
				drawingSize = AxisHelper.drawAxis([xAxis, yAxis], drawing, self._width, self._height, pad, margins);

				//Gridlines
				gridlineChart.draw([{axis: yAxis, drawingPos: drawingSize}]);


				return this.selectAll('g.lines').data(lineData);
			},
			insert: function ()
			{
				var lineGrp = this.append('g').classed('lines', true);
				lineGrp.append('path').classed('line', true);
				lineGrp.append('text').classed('linelabel', true).attr('text-anchor', 'start');
				return lineGrp;
			},
			events: {
				'merge:transition': function ()
				{
					var pathFunction = self._chart.stackOffset ? area : line;


					this.select('text')
						.text(function (l){ return l.label; })
						.attr('x', xAxis.scale()(xAxis.scale().domain()[1]))
						.attr('dy', 5)
						.attr('y', function (l)
						{
							var yVal = l.marks[l.marks.length - 1];
							return yAxis.scale()(yVal.y0 ? yVal.y / 2 + yVal.y0 : yVal.y);
						})
						.attr('class', 'linelabel');

					var lineSelection = this.select('path');
					lineSelection
							.attr('stroke', function (l)
							{
								return l === '' ? 'steelblue' : lineColor(l.label);
							})
							.attr('stroke-width', '2px')
							.attr('fill', 'none')
							.attr('d', function (l)
							{
								return pathFunction(l.marks);
							});

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
