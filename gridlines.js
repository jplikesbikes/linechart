'use strict';


	d3.chart('Gridlines', {
		initialize: function ()
		{
			var chart = this;
			var gridlayer = chart.base.append('g').classed('gridlines', true);

			chart.layer('gridlines', gridlayer, {
				dataBind: function (data)
				{  //data = [{axis: xAxis, drawingPos: chartBase.drawingPos}]

					var lineData = _.flatten(_.map(data, function (d)
					{
						var scale = d.axis.scale();
						var drawingPos = d.drawingPos;
//                      console.log("gridlinePosIn",drawingPos);

						var ticklines = _.map(scale.ticks(), function (tick)
						{
							var isZero = scale(0) === scale(tick);

							switch (d.axis.orient())
							{
								case 'top' :
									return {
										zero: isZero,
										x1: scale(tick),
										y1: drawingPos.y,
										x2: scale(tick),
										y2: drawingPos.height + drawingPos.y
									};
								case 'bottom' :
									return {
										zero: isZero,
										x1: scale(tick),
										y1: drawingPos.y,
										x2: scale(tick),
										y2: drawingPos.height + drawingPos.y
									};
								case 'left' :
									return {
										zero: isZero,
										x1: drawingPos.x,
										y1: scale(tick),
										x2: drawingPos.width + drawingPos.x,
										y2: scale(tick)
									};
								case 'right' :
									return {
										zero: isZero,
										x1: drawingPos.x,
										y1: scale(tick),
										x2: drawingPos.width + drawingPos.x,
										y2: scale(tick)
									};
							}
						});
						return ticklines;
					}));

					return this.selectAll('.gridline').data(lineData);
				},
				insert: function ()
				{
					return this.append('line').classed('gridline', true);
				},
				events: {
					'merge:transition': function ()
					{
						this.attr('x1', function (d)
						{
							return d.x1;
						})
							.attr('y1', function (d)
							{
								return d.y1;
							})
							.attr('x2', function (d)
							{
								return d.x2;
							})
							.attr('y2', function (d)
							{
								return d.y2;
							});
						this.attr('class', function (d)
						{
							return d.zero ? 'gridline zero' : 'gridline';
						});
						return this;
					},
					'exit': function ()
					{
						return this.remove();
					}
				}
			});

		}
	});


