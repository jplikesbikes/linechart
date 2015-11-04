
	var AxisHelper = {
		drawAxis: function (axisArray, base, width, height, padding, margin)
		{
			padding = !padding ? {
				top: 0,
				left: 0,
				bottom: 0,
				right: 0
			} : padding;
			margin = !margin ? {top: 0, left: 2, bottom: 5, right: 0} : margin;         //Margin support is busted. the drawing area requires an additional transform to account for the margins

			var w = width - margin.left - margin.right;
			var h = height - margin.top - margin.bottom;

			var axisLayer = base.selectAll('g.all-axis');
			if (axisLayer.empty())
			{
				axisLayer = base.append('g').classed('all-axis', true);
				axisLayer.append('g').classed('top axis', true);
				axisLayer.append('g').classed('bottom axis', true);
				axisLayer.append('g').classed('left axis', true);
				axisLayer.append('g').classed('right axis', true);
				axisLayer.append('g').classed('top axis-label', true).append('text');
				axisLayer.append('g').classed('bottom axis-label', true).append('text');
				axisLayer.append('g').classed('left axis-label', true).append('text');
				axisLayer.append('g').classed('right axis-label', true).append('text');
			}

			//Reset ranges
			_.forEach(axisArray, function (ax)
			{
				switch (ax.orient())
				{
					case 'top':
					case 'bottom' :
						ax.scale().range([0, w]);
						break;
					case 'left':
					case 'right':
						ax.scale().range([0, h]);
						break;
				}
			});

			// render axis (dont display). collect boundingBox sizes
			var labelHeight = 0;

			var axisSizes = _.map(axisArray, function (ax)
			{
				// now render hidden somewhere in the page
				var sizer = d3.select('body').append('svg');
				var tempEl = sizer.append('g');
				tempEl.style('display', 'hidden');
				tempEl.call(ax);
				var bbox = tempEl[0][0].getBBox();

				var bbbb = {
					height: bbox.height,
					width: bbox.width,
					x: bbox.x,
					y: bbox.y
				};

				// if labels are required, compute the space required for them
				if (ax.label && ax.label !== '')
				{
					var tempLabelEl = tempEl.append('g').append('text');
					tempLabelEl.text(ax.label);
					labelHeight = tempLabelEl[0][0].getBBox().height;
					switch (ax.orient())
					{
						case 'top':
						case 'bottom':
							bbbb.height = bbbb.height + labelHeight;
							break;
						case 'left':
						case 'right':
							bbbb.width = bbbb.width + labelHeight;
							bbbb.x = bbbb.x - labelHeight;
							break;
					}
				}

				//collect size and clean up. sizes are max adjustments need for each axis
				var renderAdjust = {
					orient: ax.orient(),
					height: 0,
					width: 0,
					x: 0,
					y: 0
				};
				switch (ax.orient())
				{
					case 'top':
						//require a height adjust
						renderAdjust.height = -bbbb.height;
						renderAdjust.y = bbbb.height;
						//require a left and right adjust
						renderAdjust.x = -bbbb.x;
						renderAdjust.width = w - bbbb.width - bbbb.x;
						break;
					case 'bottom':
						//require a height adjust
						renderAdjust.height = -bbbb.height;
						renderAdjust.y = 0;
						//require a left and right adjust
						renderAdjust.x = -bbbb.x;
						renderAdjust.width = w - bbbb.width - bbbb.x;
						break;
					case 'left':
						//require an x and width adjustment
						renderAdjust.x = -bbbb.x;
						renderAdjust.y = -bbbb.y;
						renderAdjust.width = w - bbbb.width - bbbb.x;
						renderAdjust.height = h - bbbb.height;
						break;
					case 'right':
						renderAdjust.x = 0;
						renderAdjust.y = -bbbb.y;
						renderAdjust.width = -bbbb.width;
						renderAdjust.height = h - bbbb.height;
						break;
				}
				sizer.remove();
				return renderAdjust;

			});

			var adjust = {x: 0, y: 0, width: 0, height: 0};
			if (axisSizes.length > 0)
			{
				adjust.x += _.max(_.map(axisSizes, function (ax)
				{
					return ax.x;
				}));
				adjust.y += _.max(_.map(axisSizes, function (ax)
				{
					return ax.y;
				}));
				adjust.width += _.min(_.map(axisSizes, function (ax)
				{
					return ax.width;
				}));
				adjust.height += _.min(_.map(axisSizes, function (ax)
				{
					return ax.height;
				}));
			}

			//Pad drawing area
			adjust.x = adjust.x + padding.left;
			adjust.y = adjust.y + padding.top;
			adjust.width = adjust.width - padding.right;
			adjust.height = adjust.height - padding.bottom;

			//size and move the axis into position, determine number of ticks
			_.forEach(axisArray, function (ax)
			{
				var orient = ax.orient();
				var scale = ax.scale();
				if (orient === 'top' || orient === 'bottom')
				{
					scale.range([adjust.x, w + adjust.width]);
				}
				else
				{
					scale.range([adjust.y, h + adjust.height]);
				}
			});

			//Draw the axis
			_.forEach(axisArray, function (ax)
			{
				switch (ax.orient())
				{
					case 'top':
						ax.ticks(parseInt(w / 80));
						var topAxisArea = axisLayer.select('.top.axis');
						topAxisArea.transition().duration(250).call(ax);
						topAxisArea.attr('transform', 'translate(0,' + (adjust.y - padding.top) + ')');
						break;
					case 'bottom':
//                        ax.ticks([parseInt(w / 80)] );
						ax.ticks(parseInt(w / 80));
						var bottomAxisArea = axisLayer.select('.bottom.axis');
						bottomAxisArea.transition().duration(250).ease('sin-in-out').call(ax);
						bottomAxisArea.attr('transform', 'translate(0,' + (h + adjust.height + padding.bottom) + ')');
						break;
					case 'left':
						ax.ticks(parseInt(h / 50));
						var leftAxisArea = axisLayer.select('.left.axis');
						leftAxisArea.transition().duration(250).call(ax);
						leftAxisArea.attr('transform', 'translate(' + (adjust.x - padding.left) + ',0)');
						break;
					case 'right':
						ax.ticks(parseInt(h / 50));
						var rightAxisArea = axisLayer.select('.right.axis');
						rightAxisArea.transition().duration(250).call(ax);
						rightAxisArea.attr('transform', 'translate(' + (w + adjust.width + padding.right) + ',0)');
						break;
				}
			});

			//Draw axis labels.  We made space for them
			_.forEach(axisArray, function (ax)
			{
				if (ax.label && ax.label !== '')
				{
					switch (ax.orient())
					{
						case 'top':
							axisLayer.select('.top.axis-label').select('text')
								.transition().duration(250)
								.attr('dy', labelHeight - 5).attr('text-anchor', 'middle')
								.attr('x', w / 2)
								.attr('y', 0)
								.text(ax.label);
							break;
						case 'bottom':
							axisLayer.select('.bottom.axis-label').select('text')
								.transition().duration(250)
								.attr('dy', -1).attr('text-anchor', 'middle')
								.attr('x', w / 2)
								.attr('y', h)
								.text(ax.label);
							break;
						case 'left':
							axisLayer.select('.left.axis-label').select('text')
								.transition().duration(250)
								.attr('text-anchor', 'middle')
								.attr('x', 0)
								.attr('y', 0)
								.attr('transform', 'rotate(-90)')
								.attr('dx', -h / 2)
								.attr('dy', labelHeight - 5)
								.text(ax.label);
							break;
						case 'right':
							axisLayer.select('.right.axis-label').select('text')
								.transition().duration(250)
								.attr('text-anchor', 'middle')
								.attr('x', 0)
								.attr('y', 0)
								.attr('transform', 'rotate(-90)')
								.attr('dx', -h / 2)
								.attr('dy', w - 1)
								.text(ax.label);
							break;
					}
				}
			});

			//if margins (move transform the base to account for the margins
			base.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

			return {
				x: adjust.x,
				y: adjust.y,
				width: w + adjust.width - adjust.x,
				height: h + adjust.height - adjust.y
			};

		}
	};

