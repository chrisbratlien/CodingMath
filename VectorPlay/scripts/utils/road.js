define(['require'], function (require) {

	var exports = {};
	
	var datum = new Scenario.SpatialDatum("query datum");
	
	function getOppositeDir(dir)
	{
		if (dir == RIGHT)
		{
			return LEFT;
		}
		else
		{
			return RIGHT;
		}
	}
	
	exports.getNeighborRoad = function(road, oncoming)
	{
		var dir = RIGHT;		
		if (oncoming)
		{
			dir = LEFT;
		}
		
		var neighbor = road;
		var nextNeighbor = road.getNeighbor(dir);
		while (nextNeighbor)
		{
			var switchDir = (neighbor.getNeighborDirection(dir) == OPPOSITE);
			if (switchDir)
			{
				dir = getOppositeDir(dir);
			}
			
			neighbor = nextNeighbor;
			nextNeighbor = neighbor.getNeighbor(dir);
		}
		
		return neighbor;
	}
	
	exports.getNeighborDistance = function(road, oncoming)
	{
		var switchedDir = false;
		
		var dir = RIGHT;		
		if (oncoming)
		{
			dir = LEFT;
		}
		
		var neighbor = road;
		var nextNeighbor = road.getNeighbor(dir);
		while (nextNeighbor)
		{
			var switchDir = (neighbor.getNeighborDirection(dir) == OPPOSITE);
			if (switchDir)
			{
				dir = getOppositeDir(dir);
				switchedDir = !switchedDir;
			}
			
			neighbor = nextNeighbor;
			nextNeighbor = neighbor.getNeighbor(dir);
		}
		
		if (switchedDir)
		{
			datum.move(road);
			datum.move(ROADPOSITION, road.getLength());
			return neighbor.getDistanceRight(datum);
		}
			
		return road.getDistanceRight(neighbor);
	}
	
	exports.getNeighborCount = function(road, oncoming)
	{
		var roadCount = 0;
		
		var dir = RIGHT;		
		if (oncoming)
		{
			dir = LEFT;
		}
		
		if (road)
		{
			roadCount++;
		}
		
		var neighbor = road;
		var nextNeighbor = road.getNeighbor(dir);
		while (nextNeighbor)
		{
			var switchDir = (neighbor.getNeighborDirection(dir) == OPPOSITE);
			if (switchDir)
			{
				dir = getOppositeDir(dir);
			}
			
			neighbor = nextNeighbor;
			nextNeighbor = neighbor.getNeighbor(dir);
			
			roadCount++;
		}
		
		return roadCount;
	}

	exports.countRoadsAcross = function(road)
	{
		var rightRoad = this.getNeighborRoad(road, false);
		return this.getNeighborCount(rightRoad, true);
	}
	
	exports.hasMedian = function(road)
	{
		var neighbor = road;
		var nextNeighbor = road.getNeighbor(LEFT);
		while (nextNeighbor)
		{
			if (neighbor.getNeighborDirection(LEFT) == OPPOSITE)
			{
				if (nextNeighbor)
				{
					datum.move(neighbor);
					datum.move(ROADPOSITION, neighbor.getLength());
					return (Math.abs(nextNeighbor.getDistanceRight(datum)) > 5.5);
				}
			}
			
			neighbor = nextNeighbor;
			nextNeighbor = neighbor.getNeighbor(LEFT);		
		}
	
		return false;
	}
	
	exports.isOneWay = function(road)
	{
		var neighbor = road;
		var nextNeighbor = road.getNeighbor(LEFT);
		while (nextNeighbor)
		{
			if (neighbor.getNeighborDirection(LEFT) == OPPOSITE)
			{
				return false;
			}
			
			neighbor = nextNeighbor;
			nextNeighbor = neighbor.getNeighbor(LEFT);		
		}
		
		return true;
	}

	return exports;

});