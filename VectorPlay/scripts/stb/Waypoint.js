define(['require', 'math/vector2D', 'math/intersection2D', 'dataStructures/AABB_2D', 'utils/string'], function (require, vector2D, intersection2D, AABB_2D, stringUtil) {

	function Waypoint(entity_num, index, x, y, warpNext)
	{	
		this.entity_num = entity_num;
		this.index = index;
		this.x = x;
		this.y = y;
		this.warpNext = warpNext;
		
		this.name = "E" + entity_num + "_Waypoint" + index;
		this.totalLength = 0;
		
		this.datum = new Scenario.SpatialDatum(this.name, x, y, 0, 0, 0, 0);
		this.aabb = new AABB_2D();
		this.aabb.expandPoint(x, y, 5.0);
		
		this.collisionMap = {};
	}
	
	Waypoint.prototype.dump = function(next)
	{
		print("Waypoint properties");
		print("this.entity_num = " + this.entity_num);
		print("this.index = " + this.index);
		print("this.x = " + this.x);
		print("this.y = " + this.y);
		print("this.warpNext = " + this.warpNext);
		
		print("this.name = " + this.name);
		print("this.totalLength = " + this.totalLength);
		print("this.segmentLength = " + this.segmentLength);
		
		this.aabb.dump();
		
		if (this.next && next)
		{
			print("this.next properties");
			print("this.dir.x = " + this.dir.x);
			print("this.dir.y = " + this.dir.y);
			this.next.dump(false);
		}
	}
	
	
	Waypoint.prototype.getDistance2D = function(wp)
	{
		var diff = vector2D.subtract(wp, this);
		return vector2D.length(diff);
	}

	//BTW: this should be called getLongitudinalDistance since it is a projection on the line
	Waypoint.prototype.getDistance = function(wp)
	{
		if (this.dir)
		{
			var diff = vector2D.subtract(wp, this);
			return vector2D.dot(this.dir, diff);
		}
		else
		{
			var diff = vector2D.subtract(wp, this);
			return vector2D.length(diff);
		}
	}

	Waypoint.prototype.getLateralDistance = function(wp)
	{   
		if (this.dir)
		{
			var diff = vector2D.subtract(wp, this);
			return Math.abs(vector2D.cross(this.dir, diff));
		}
		else
		{
			var diff = vector2D.subtract(wp, this);
			return vector2D.length(diff);
		}
	}

	Waypoint.prototype.pointTo = function(wp)
	{
		this.dir = vector2D.subtract(wp, this);
		var length = vector2D.length(this.dir);
		if (length)
		{
			this.dir = vector2D.scaleInv(this.dir, length);
			this.segmentLength = length;
			
			this.datum.setHeading(0);
			var bearing = this.datum.getBearing(wp.datum);
			
			this.datum.setHeading(bearing);
			wp.datum.setHeading(bearing);
			
			this.next = wp;
			wp.prev = this;
			
			this.aabb.expand(wp.getAABB());
		}
		
		return wp;
	}
	
	Waypoint.prototype.getAABB = function()
	{
		return this.aabb;
	}
	
	Waypoint.prototype.reverseLookup = function(position)
	{
		var v = vector2D.scale(this.dir, position - this.totalLength);
		return vector2D.add(this, v);
	}
	
	function movePoint(point, dir, amount)
	{
		var v = vector2D.scale(dir, amount);
		return vector2D.add(point, v);
	}
	
	function updateResult(value, result)
	{
		if (result)
		{
			result.start = Math.min(result.start, value);
			result.end = Math.max(result.end, value);
			
			//print("result is now : {" + stringUtil.toFixed(result.start, 3) + ", " + stringUtil.toFixed(result.end, 3) + "}");
		}
		else
		{
			result = {start : value, end : value};
			
			//print("result is started : {" + stringUtil.toFixed(result.start, 3) + ", " + stringUtil.toFixed(result.end, 3) + "}");
		}
		
		
		return result;
	}
	
	function updateResultRadius(value, radius, result)
	{
		if (result)
		{
			result.start = Math.min(result.start, value - radius);
			result.end = Math.max(result.end, value + radius);
			
			//print("result is now : {" + stringUtil.toFixed(result.start, 3) + ", " + stringUtil.toFixed(result.end, 3) + "}");
		}
		else
		{
			result = {start : value - radius, end : value + radius};
			
			//print("result is started : {" + stringUtil.toFixed(result.start, 3) + ", " + stringUtil.toFixed(result.end, 3) + "}");
		}
		
		
		return result;
	}
	
	function isResultFull(length, result)
	{
		if (result)
		{
			return (result.start <= 0 && result.end >= length);
		}
		
		return false;
	}
		
	function updateIntersection(a, b, a_length, a_radius, b_length, b_radius, result)
	{
		//print("a * a_length : " + stringUtil.toFixed(a * a_length, 3) + ", a_length : " + stringUtil.toFixed(a_length, 3) + ", a_radius : " + stringUtil.toFixed(a_radius, 3));
		//print("b * b_length : " + stringUtil.toFixed(b * b_length, 3) + ", b_length : " + stringUtil.toFixed(b_length, 3) + ", b_radius : " + stringUtil.toFixed(b_radius, 3));
		
		if ((a * a_length + a_radius) < 0) return result;
		
		//print("intersection point is within lower bounds to a");
		
		if ((a * a_length - a_radius) > a_length) return result;
		
		//print("intersection point is within upper bounds to a");
		
		if ((b * b_length + b_radius) < 0) return result;
		
		//print("intersection point is within lower bounds to b");
		
		if ((b * b_length - b_radius) > b_length) return result;
		
		//print("intersection point is within upper bounds to b");
		
		//print("updating result from line intersection code : " + (a * a_length) + ", " + (b * b_length));
		
		result = updateResult(a * a_length, result);
		
		return result;
	}
	
	Waypoint.prototype.compare = function(wp, radius, wp_radius)
	{
		//print("Starting compare " + this.name + " with " + wp.name + " using radius " + radius + " and " + wp_radius);
		
		//E4_Waypoint2 with E9_Waypoint11
		/*if (((this.entity_num == 4) && (this.index == 2)) &&
				((wp.entity_num == 9) &&	(wp.index == 11)))
		{
			print("E4_Waypoint2.dump()");
			this.dump(true);
			
			print("E9_Waypoint11.dump()");
			wp.dump(true);
		}*/
		
		//vertex-edge, catches parallel case too
		
		var result;
		
		var total_radius = radius + wp_radius;
		
		//print("segment length is : " + this.segmentLength);
		
		//print("first test is wp lateral to this");
			
		
		if (this.getLateralDistance(wp) < total_radius)
		{
			result = updateResultRadius(this.getDistance(wp), wp_radius, result);
		}
		
		//print("second test is wp.next lateral to this");
		
		if (this.getLateralDistance(wp.next) < total_radius)
		{
			result = updateResultRadius(this.getDistance(wp.next), wp_radius, result);
		}
		
		//print("third test is this lateral to wp");
		
		var this_close = wp.getLateralDistance(this) < total_radius;
		var this_next_close = wp.getLateralDistance(this.next) < total_radius;
		
		if (this_close && this_next_close)
		{
			//print("segments treated as parallel");
			
			//treat as parallel
			result = updateResultRadius(this.getDistance(wp), wp_radius, result);
			result = updateResultRadius(this.getDistance(wp.next), wp_radius, result);
		}
		else if ((wp.getLateralDistance(this) < total_radius) || (wp.getLateralDistance(this.next) < total_radius))
		{
			//this is the T case, where the intersection is on line2 (wp)
			
			var dist_sq_p0 = 99999999999;
			var p0 = intersection2D.lineLine(this, this.next, wp, wp.next);
			if ((p0.x !== undefined) && (p0.y !== undefined))
			{
				if (((p0.b * wp.segmentLength + total_radius > 0)) && ((p0.b * wp.segmentLength - total_radius) < wp.segmentLength))
				{
					var diff_sq_p0 = vector2D.subtract(p0, this.next);
					dist_sq_p0 = vector2D.dot(diff_sq_p0, diff_sq_p0);
					
					result = updateResultRadius(this.getDistance(p0), wp_radius, result);
				}
			}			
		}
		
		if (!isResultFull(this.segmentLength, result))
		{
			//print("moving onto intersection tests");
			
			//start with a line intersection between the two lines		
			var p0 = intersection2D.lineLine(this, this.next, wp, wp.next);
			if ((p0.a !== undefined) && (p0.b !== undefined))
			{
				//print("they are not parallel : " + stringUtil.toFixed(p0.a, 3) + ", " + stringUtil.toFixed(p0.b, 3));
				
				result = updateIntersection(p0.a, p0.b, this.segmentLength, radius, wp.segmentLength, wp_radius, result);
				
				//lines are not parallel and have a valid intersection
				
				var normal = {x : -1 * this.dir.y, y : this.dir.x};
				var wp_normal = {x : -1 * wp.dir.y, y : wp.dir.x};
				
				var radius_n = -1 * radius;
				var wp_radius_n = -1 * wp_radius;

				var this_move = movePoint(this, normal, radius);
				var this_next_move = movePoint(this.next, normal, radius);
				var this_move_n = movePoint(this, normal, radius_n);
				var this_next_move_n = movePoint(this.next, normal, radius_n);
				
				var wp_move = movePoint(wp, wp_normal, wp_radius);
				var wp_next_move = movePoint(wp.next, wp_normal, wp_radius);
				var wp_move_n = movePoint(wp, wp_normal, wp_radius_n);
				var wp_next_move_n = movePoint(wp.next, wp_normal, wp_radius_n);

				//print("first padded line test");
				
				var p1 = intersection2D.lineLine(this_move, this_next_move, wp_move, wp_next_move);
				result = updateIntersection(p1.a, p1.b, this.segmentLength, radius, wp.segmentLength, wp_radius, result);
				
				//print("second padded line test");
				
				var p2 = intersection2D.lineLine(this_move, this_next_move, wp_move_n, wp_next_move_n);
				result = updateIntersection(p2.a, p2.b, this.segmentLength, radius, wp.segmentLength, wp_radius, result);
				
				//print("third padded line test");
				
				var p3 = intersection2D.lineLine(this_move_n, this_next_move_n, wp_move, wp_next_move);
				result = updateIntersection(p3.a, p3.b, this.segmentLength, radius, wp.segmentLength, wp_radius, result);
				
				//print("fourth padded line test");
				
				var p4 = intersection2D.lineLine(this_move_n, this_next_move_n, wp_move_n, wp_next_move_n);
				result = updateIntersection(p4.a, p4.b, this.segmentLength, radius, wp.segmentLength, wp_radius, result);
			}
		}
		
		if (result)
		{
			//expand to fill radius, clamp from 0 to segmentLength
			
			result.start = Math.max(result.start - radius, 0);
			result.end = Math.min(result.end + radius, this.segmentLength);
			
			if ((result.start < this.segmentLength) && (result.end > 0))
			{
				//print("Result relative to segment " + this.name + " with " + wp.name + " at { " + stringUtil.toFixed(result.start, 3) + ", " + stringUtil.toFixed(result.end, 3) + " }");
				
				result.start += this.totalLength;
				result.end += this.totalLength;
				
				//print("Result relative to path " + this.name + " with " + wp.name + " at { " + stringUtil.toFixed(result.start, 3) + ", " + stringUtil.toFixed(result.end, 3) + " }");
				
				this.collisionMap[wp.entity_num] = this.collisionMap[wp.entity_num] || [];

				result.index = wp.index;
				this.collisionMap[wp.entity_num].push(result);
				
				return true;
			}
		}
		
		return false;
	}
	
	Waypoint.prototype.cleanCollisions = function()
	{
		for (var i in this.collisionMap)
		{
			delete this.collisionMap[i];
		}
		
		delete this.collisionMap;
		
		if (this.aabb)
		{
			delete this.aabb;
		}
	}

	return Waypoint;

});