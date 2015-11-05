'use strict';


	/**
	 * @typedef {number[]} TimeSeries
	 * @prop 0 - value
	 * @prop 1 - time
	 */

	/**
	 * Map an array of TimeSeries to be relative to a shared `t0`.
	 *
	 * Assumes each TimeSeries line up by index and time.
	 *
	 * @param t0 - Reference time to base off of
	 * @param {TimeSeries[]} listOfTimeSeries - The TimeSeries arrays to transform
	 * @returns {TimeSeries[]} - new array of TimeSeries, all relative to t0
	 */
	var relativeToMoment = function(t0, listOfTimeSeries)
	{
		var basisIndex = _.findIndex(listOfTimeSeries[0], {1: t0});

		return listOfTimeSeries.map(function(ts)
		{
			var basis = ts[basisIndex][0];
			return ts.map(function(tuple)
			{
				return [tuple[0] - basis, tuple[1]];
			})
		});
	};



	var relativePercentToMoment = function(t0, listOfTimeSeries)
	{
		var basisIndex = _.findIndex(listOfTimeSeries[0], {1: t0});

		return listOfTimeSeries.map(function(ts)
		{
			var basis = ts[basisIndex][0];
			return ts.map(function(tuple)
			{
				return [(tuple[0] - basis) / basis, tuple[1]];
			});
		});
	};


	/**
	 * Bases series on other series
	 * @param {TimeSeries} timeSeries0 - Reference time series
	 * @param {TimeSeries[]} listOfTimeSeries -
	 * @returns {TimeSeries[]}
	 */
	var relativeToSeries = function(timeSeries0, listOfTimeSeries)
	{
		return listOfTimeSeries.map(function(ts)
		{
			return ts.map(function(tuple, index)
			{
				return [tuple[0] - timeSeries0[index][0], tuple[1]];
			});
		});
	};

	/**
	 * Transforms listOfTimeSeries into percentage differences from timeSeries0.
	 *
	 * Can be thought of as indexing listOfTimeSeries by timeSeries0.
	 *
	 * @param {TimeSeries} timeSeries0 - Base value
	 * @param {TimeSeries[]} listOfTimeSeries
	 * @return {TimeSeries[]} - Reindexed array of TimeSeries
	 */
	var relativeRateSeries = function(timeSeries0, listOfTimeSeries)
	{
		return listOfTimeSeries.map(function(ts)
		{
			return ts.map(function(tuple, index)
			{
				var basis = timeSeries0[index][0];
				return [(tuple[0] - basis) / basis, tuple[1]];
			});
		});
	};

	var timeFunctions = {
		relativePercentToMoment: relativePercentToMoment,
		relativeToMoment: relativeToMoment,
		relativeToSeries: relativeToSeries,
		relativeRateSeries: relativeRateSeries
	};
