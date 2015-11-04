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

		var line, stackLayout, area, minYVal, maxYVal;

		var _intersect = function (yPos, labelPositions)
		{
			if (labelPositions.length === 0)
			{
				labelPositions.push(yPos);
				return false;
			}
			var intersect = false;
			_.forEach(labelPositions, function (pos)
			{
				if (!(yPos > pos + labelHeight || yPos + labelHeight < pos))
				{
					intersect = true;
				}
			});
			if (!intersect)
			{
				labelPositions.push(yPos);
			}

			return intersect;
		};


		//Create a layer that is responsible for each mark
		self.layer('lines', lines, {
			dataBind: function (dataIn)
			{

				line = d3.svg.line()
					.x(function (d)
					{
						return xAxis.scale()(d.x);
					})
					.y(function (d)
					{
						return yAxis.scale()(d.y);
					});


				stackLayout = d3.layout.stack()
					.offset(self._chart.stackType)
					.values(function (d)
					{
						return d.marks;
					});


				area = d3.svg.area()
					.x(function (d)
					{
						return xAxis.scale()(d.x);
					})
					.y0(function (d)
					{
						return yAxis.scale()(d.y0 + minYVal);
					})
					.y1(function (d)
					{
						return yAxis.scale()(d.y0 + minYVal + d.y);
					});


				var lineData = dataIn.marks.map(function(mark){
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


				//Configure X axis
				var xMarks = _.flatMap(_.map(lineData, function (line)
				{
					return _.pluck(line.marks, 'x');
				}));
				xAxis.scale().domain(d3.extent(xMarks));
				xAxis.scale().nice();
				xAxis.label = self._chart.xAxisLabel;

				//Compute a rough height to see if labels will fit
				var margins = {top: 0, bottom: 0, left: 0, right: 0};


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

				margins = {top: 10, bottom: 0, left: 5, right: labelPadding - 5};

				if (self._chart.lineType === 'stack')
				{
					lineData = stackLayout(lineData);
				}

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

				//reset brush
//                    brush.draw(drawingSize);


				return this.selectAll('g.lines').data(lineData);
			},
			insert: function ()
			{
				var lineGrp = this.append('g').classed('lines', true);
				lineGrp.append('path').classed('line', true);
				lineGrp.append('text').classed('linelabel', true).attr('text-anchor', 'start');
				lineGrp
					.on('mouseover', function (d)
					{
						lines.selectAll('g.lines').select('path.line').attr('stroke', '#ddd').attr('stroke-opacity', 0.5);
						lines.selectAll('g.lines').select('text.linelabel').attr('style', 'display:none');
						d3.select(this).select('path')
							.attr('stroke', lineColor(d.label))
							.attr('stroke-width', '3px');
						d3.select(this).select('text.linelabel')
							.attr('style', 'display: block')
							.attr('stroke-opacity', 1);
					})
					.on('mouseout', function (d)
					{
						lines.selectAll('g.lines').select('path.line')
							.attr('stroke', function (d)
							{
								return lineColor(d.label);
							})
							.attr('stroke-width', '2px');
						lines.selectAll('g.lines').select('text.linelabel')
							.attr('style', '')
							.attr('stroke-opacity', 1);
					});
				return lineGrp;
			},
			events: {
				'merge:transition': function ()
				{
					var labelPositions = [];
					var label = this.select('text');
					label.text(function (l)
					{
						return l.label;
					})
						.attr('x', xAxis.scale()(xAxis.scale().domain()[1]))
						.attr('dy', 5)
						.attr('y', function (l)
						{
							var yVal = l.marks[l.marks.length - 1];
							return yAxis.scale()(yVal.y0 ? yVal.y / 2 + yVal.y0 : yVal.y);
						})
						.attr('class', function (l)
						{
							var yVal = l.marks[l.marks.length - 1];
							var yPos = yAxis.scale()(yVal.y0 ? yVal.y / 2 + yVal.y0 : yVal.y);
							if (_intersect(yPos, labelPositions))
							{
								return 'label-hidden linelabel';
							}
							return 'linelabel';
						});

					var lineSelection = this.select('path');
					switch (self._chart.lineType)
					{
						case 'line' :
							lineSelection
								.attr('stroke', function (l)
								{
									return l === '' ? 'steelblue' : lineColor(l.label);
								})
								.attr('stroke-width', '2px')
								.attr('fill', 'none')
								.attr('d', function (l)
								{
									return line(l.marks);
								});

							break;
						case 'stack':
							lineSelection.attr('stroke', function (l)
							{
								return l === '' ? 'steelblue' : lineColor(l.label);
							})
								.attr('d', function (l)
								{
									return area(l.marks);
								});
							lineSelection.attr('fill', function (l)
							{
								return lineColor(l.label);
							});
							break;
					}

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
