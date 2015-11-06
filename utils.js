'use strict';

/**
 * @param {Date[]} times - sorted
 * @return {Date[]} the value between each item in times. an array with length times.length - 1
 */
var midPoints = function(times) {
	var l = times[0];
	return _.reduce(times.slice(1), function (acc, t) {
		var next = t.getTime();
		var last = l.getTime();
		l = t;
		var between = last + ((next - last) / 2);
		acc.push(new Date(between));
		return acc;
	}, []);
};

/**
 * puts a transparent rect as the background of the selection
 * @param {d3.scale} x
 * @param {d3.scale} y
 * @param {d3.selection} selection
 */
var giveMouseMove = _.curry(function(x, y, fn, selection){
	var style = 'mouse-move-shim';
	var bg = selection.selectAll('rect.'+style).data([1]);

	bg.enter().insert('rect',':first-child')
		.attr('class', style);

	var rectX = x.range()[0];
	var rectWidth = x.range()[1] - x.range()[0];
	var rectY = y.range()[0];
	var rectHeight = y.range()[1] - y.range()[0];
	bg
		.attr('x', rectX)
		.attr('width', rectWidth)
		.attr('y', rectY)
		.attr('height', rectHeight)
		.attr('fill', 'transparent');

	selection.on('mousemove.giveMouseMove', fn);
});

/**
 * @param {Object} a - point 1
 * @param {Object} b - point 2
 * @param {String[]} d - dimensions to compare
 * @return {number} - distance
 */
var squareEuclideanDistanceObject = function(a, b, d){
	var sum = 0;
	for (var n=0; n < d.length; n++) {
		sum += Math.pow( a[d[n]] - b[d[n]], 2);
	}
	return sum;
};

/**
 * @param {Object} a - point 1
 * @param {Object} b - point 2
 * @param {String[]} d - dimensions to compare
 * @return {number} - distance
 */
var squareEuclideanDistanceObject = function(a, b, d){
	return Math.sqrt(squareEuclideanDistanceObject(a, b, d));
};

/**
 * @param {Object|Array} point
 * @param {Object[]|Array[]} data
 * @param {String[]|Number[]} dims - dimensions to compare
 * @return {Object|Array} - closest
 */
var findClosestMarkMultiDimension = function(point, data, dims){
	var min = undefined;
	var minDist = Math.POSITIVE_INFINITY;
	for(var i=0; i<data.length; i++){
		var dist = squareEuclideanDistanceObject(point, data[i], dims);
		if(dist<minDist){
			min = data[i];
			minDist = dist;
		}
	}
};

/**
 *
 * @param {String|Number} point
 * @param {Object[]|Array[]} data - sorted by dim
 * @param {String} dim - how to get the value from the dim
 */
var findClosestMarkBinarySearch = function(value, data, dim){
	var val = value[dim];
	var start = 0;
	var end = data.length;
	while(start <= end){
		var mid = ~~((start + end)/2);
		var midVal = data[mid][dim];
		if(val === midVal)
		{
			return data[mid];
		}
		else if(midVal < val)
		{
			start = midVal + 1;
		}
		else
		{
			end = midVal - 1;
		}
	}

	// @todo: check either side to see whats closest
	return data[start]
};