'use strict';

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

};

var applyToData = _.curry(function(fn, data){
	return fn(data[1])
});

var g = _.curry(function(x, selection){
	var lines = selection.selectAll('line').data(_.identity);

	// update
	lines.classed('update', true);

	// enter
	lines.enter().append('line')
		.attr('stroke', 'red')
		.attr('y1', 0)
		.attr('y2', 300);

	// enter + update
	lines
		.classed('update', false)
		.transition(500)
		.attr('x1', applyToData(x))
		.attr('x2', applyToData(x));

	// exit
	lines.exit().remove()
});

var l = _.curry(function (x, y, selection) {
	var circles = selection.selectAll('circle').data(_.identity);

	// update
	circles.classed('update', true);

	// enter
	circles.enter().append('circle')
		.attr('r', '5')
		.attr('stroke', 'blue');

	// enter + update
	circles
		.classed('update', false)
		.transition(500)
		.attr('cx', applyToData(x))
		.attr('cy', applyToData(y));

});



function t0(data){
	var svg = d3.select('#test2');
	var domain = d3.extent(data.map((d)=>d[1]));
	var x = d3.scale.linear().range([0,600]).domain([0, 6]);
	var y = d3.scale.linear().range([0,300]).domain([0, 6]);
	svg
		.datum(data)
		.call(g(x))
		.call(l(x,y));
}

function t1(data){
	var svg = d3.select('#test2');
	var domain = d3.extent(data.map((d)=>d[1]));
	var x = d3.scale.linear().range([0,600]).domain([0, 6]);
	var y = d3.scale.linear().range([0,300]).domain([0, 6]);

	var layerFns = [g(x), l(x,y)];
	var layers = svg.selectAll('g')
			.data(layerFns);

	layers.enter().append('g');

	layers.each(function(d){
		d3.select(this).datum(data).call(d);
	});

	layers.exit().remove();
}

function t(data){
	var svg = d3.select('#test2');
	var domain = d3.extent(data.map((d)=>d[1]));
	var x = d3.scale.linear().range([0,600]).domain([0, 6]);
	var y = d3.scale.linear().range([0,300]).domain([0, 6]);

	var grid = svg.selectAll('g.grid').data([data]);
	grid.enter().append('g').classed('grid',true);
	grid.call(g(x));
	grid.exit().remove();

	var circles = svg.selectAll('g.circles').data([data]);
	circles.enter().append('g').classed('circles',true);
	circles.call(l(x,y));
	circles.exit().remove();

}