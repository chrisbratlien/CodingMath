define(['require', 'dataStructures/AABB_2D', 'stb/Waypoint', 'utils/string'], function (require, AABB_2D, Waypoint, stringUtil) {

	function WaypointPath(entity_num)
	{
		this.entity_num = entity_num;
		
		this.waypoints = [];
		this.totalLength = 0;
		
		this.aabb = new AABB_2D();
	}
	
	WaypointPath.prototype.dump = function()
	{
		print("WaypointPath properties");
		print("totalLength = " + this.totalLength);
		
		for (var i in this.waypoints)
		{
			print("Waypoint Index " + i);
			this.waypoints[i].dump();
		}
	}

	WaypointPath.prototype.getStartDatum = function()
	{
		return this.waypoints[0].datum;
	}

	WaypointPath.prototype.getLength = function()
	{
		return this.totalLength;
	}
	
	WaypointPath.prototype.getAABB = function()
	{
		return this.aabb;
	}
	
	WaypointPath.prototype.insert = function(quadtree)
	{
		for (var i in this.waypoints)
		{
			if (this.waypoints[i].segmentLength)
			{
				var aabb = this.waypoints[i].getAABB();
				if (!aabb.empty())
				{
					var item = aabb;
					item.entity_num = this.entity_num;
					item.index = i;
					quadtree.insert(item);
				}
			}
		}
	}
	
	WaypointPath.prototype.retrieve = function(entities, quadtree, radius)
	{
		var numberCompares = 0;
		
		if (this.path)
		{
			for (var i in this.waypoints)
			{
				if (this.waypoints[i].segmentLength)
				{
					//for (var entity_num in entities) //brute force method
					{
						//for (var index in entities[entity_num].waypointPath.waypoints) //brute force method
						{
							var neighbors = quadtree.retrieve(this.waypoints[i].getAABB()); //quadtree method
							for (var neighbor in neighbors) //quadtree method
							{
								var entity_num = neighbors[neighbor].entity_num; //quadtree method
								var index = neighbors[neighbor].index; //quadtree method
								
								//if (entity_num > 0) //brute force method
								{
									if (this.entity_num != entity_num)
									{
										var wp = entities[entity_num].waypointPath.waypoints[index];
										
										if (wp.segmentLength)
										{
											if (this.waypoints[i].getAABB().intersection(wp.getAABB()))
											{
												var wp_radius = 1.5;
												if (entities[entity_num].Width < 0.5)
												{
													wp_radius = 1.0;
												}
												
												if (this.waypoints[i].compare(wp, radius, wp_radius))
												{
													//print("Found collision with : " + this.waypoints[i].name + " & " + wp.name);
												}
												
												numberCompares++;
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
		
		return numberCompares;
	}
	
	WaypointPath.prototype.collateCollisions = function(entities)
	{
		var collatedMap = {};
		var exclusionMap = {};
		
		for (var i in this.waypoints)
		{
			for (var entity_num in this.waypoints[i].collisionMap)
			{
				if (exclusionMap[entity_num] === undefined)
				{
					for (var index in this.waypoints[i].collisionMap[entity_num])
					{
						var result = this.waypoints[i].collisionMap[entity_num][index];
						
						collatedMap[entity_num] = collatedMap[entity_num] || [];
						collatedMap[entity_num].push(result);
					}
				}
			}
		}
		
		//sort each collision by their starting position
		
		function sortByStart(x, y)
		{ 
			if (x.start < y.start)
			{
				return -1;
			}
			
			if (x.start > y.start)
			{
				return 1;
			}
			
			return 0;
		}
		
		for (var entity_num in collatedMap)
		{
			collatedMap[entity_num].sort(sortByStart);
		}
		
		return collatedMap;
	}
	
	WaypointPath.prototype.cleanCollisions = function()
	{
		for (var i in this.waypoints)
		{
			this.waypoints[i].cleanCollisions();
		}
		
		if (this.aabb)
		{
			delete this.aabb;
		}
	}

	//this function is intended to work 'ok' for an entity that starts at the beginning and traverses the entire route
	WaypointPath.prototype.getPosition = function(wp)
	{
		var cur = this.waypoint || this.waypoints[0];
		
		while (cur)
		{
			if (cur.next)
			{
				var segmentDistance = cur.getDistance(wp);
				if (segmentDistance >= cur.segmentLength)
				{
					//print(cur.name + " > " + cur.next.name);
					cur = cur.next;
					this.waypoint = cur;					
				}
				else
				{
					if (segmentDistance < 0)
					{
						segmentDistance = 0;
					}
					
					//between segments
					return segmentDistance + cur.totalLength;
				}
			}
			else if (cur.prev)
			{
				//at the end of the route
				return cur.prev.getDistance(wp) + cur.prev.totalLength;
			}
			else
			{
				return cur.getDistance(wp);
			}
		}
		
		return 0;
	}
	
	
	//this function is intended to work 'ok' for a position that arbitrarily is placed near the route
	//since this traverses the entire route each time, it is not meant to be fast for runtime
	WaypointPath.prototype.getClosest = function(pos, maxDist)
	{
		var bestLatDist = 99999999999;
		var closestPosition = 99999999999;
		
		for (var i in this.waypoints)
		{
			var cur = this.waypoints[i];
			
			//check the distance to the waypoint
			var dist2D = cur.getDistance2D(pos);
			if (dist2D <= bestLatDist)
			{
				bestLatDist = dist2D;
				closestPosition = cur.totalLength;
			}
			
			//next project the point onto each line segment to see which is closest
			var segmentLength = cur.segmentLength;
			if (segmentLength)
			{
				if (maxDist !== undefined)
				{
					if (i >= (this.waypoints.length - 2))
					{
						segmentLength += maxDist;
					}
				}
			
				//check to see if within segment
				var dist = cur.getDistance(pos);
				if ((dist >= 0) && (dist <= segmentLength))
				{
					var latDist = cur.getLateralDistance(pos);
					if (latDist <= bestLatDist)
					{
						bestLatDist = latDist;
						closestPosition = cur.totalLength + dist;
					}
				}
			}
		}
		
		return {s : closestPosition, t : bestLatDist};
	}
	
	WaypointPath.prototype.reverseLookup = function(position)
	{
		var orig = position;
		
		while (position > this.totalLength)
		{
			position -= this.totalLength;
		}
		
		while (position < 0)
		{
			position += this.totalLength;
		}
		
		for (var index in this.waypoints)
		{
			if (position > this.waypoints[index].totalLength)
			{
				if (this.waypoints[index].next)
				{
					if (position < this.waypoints[index].next.totalLength)
					{
						return this.waypoints[index].reverseLookup(position);
					}
				}
				else
				{
					return this.waypoints[index].reverseLookup(position);
				}
			}
			else if (position == this.waypoints[index].totalLength)
			{
				return this.waypoints[index];
			}
		}
		
		print("Error : unable to perform reverseLookup on E" + this.entity_num + "Path at " + orig);
	}

	WaypointPath.prototype.addWaypoint = function(x, y, heading, warpNext)
	{
		if (this.waypoints.length > 0)
		{
			var length = this.waypoints[this.waypoints.length - 1].getDistance({x : x, y : y});
			if (length < 0.05)
			{
				print("WaypointPath - addWaypoint: points too similar, skipping: " + x + ", " + y);
				return;
			}
			
			var B = new Waypoint(this.entity_num, this.waypoints.length, x, y, warpNext);
						
			//A always points to B
			B = this.waypoints[this.waypoints.length - 1].pointTo(B);
			
			this.aabb.expand(this.waypoints[this.waypoints.length - 1].getAABB());
			
			this.totalLength += this.waypoints[this.waypoints.length - 1].segmentLength;
			B.totalLength = this.totalLength;
			
			if (this.waypoints.length == 1)
			{
				this.path = new Scenario.Path("E" + this.entity_num + "_Path");
				this.path.appendTarget(this.waypoints[this.waypoints.length - 1].datum);
				
				this.path.onLeave = function(entity)	{	entity.complete = true;	}
			}
			
			this.path.appendTarget(B.datum);
			this.waypoints.push(B);
		}
		else
		{
			var A = new Waypoint(this.entity_num, this.waypoints.length, x, y, warpNext);
			
			if (heading !== undefined)
			{
				A.datum.setHeading(heading * -1);
			}
			
			this.waypoints.push(A);
		}
	}
	
	WaypointPath.prototype.closeLoop = function(x, y, heading, warpNext)
	{
		this.addWaypoint(x, y, undefined, warpNext);
			
		//set the last waypoint heading to match the first
		this.waypoints[this.waypoints.length - 1].datum.setHeading(heading);
		
		return this.totalLength;
	}
	
	WaypointPath.prototype.reset = function()
	{
		if (this.waypoint)
			delete this.waypoint;
	}

	WaypointPath.prototype.destroy = function()
	{
		if (this.path)
		{
			var entities = this.path.getEntities();
			if (entities)
			{
				for (var i in entities)
				{
					entities[i].move(entities[i]);
				}
			}
			
			var targets = this.path.getTargets();
			if (targets)
			{
				for (var i in targets)
				{
					targets[i].move(0, 0, 0, 0, 0, 0);
					delete targets[i];
				}
			}
			
			delete this.path;
		}
	}

	return WaypointPath;

});