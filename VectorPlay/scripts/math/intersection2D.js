define(['require', 'math/vector2D'], function (require, vector2D) {

	//this utility class expects that objects passed into the function contain x, y and r properties
	var intersection2D = {};
	
	//if the lines intersect, (x, y) is returned
	//whether line segment 1 or line segment 2 contain the point (onLine1, onLine2)
	//scale factors used to determine the point (a, b)
	//algorithm found here : http://jsfiddle.net/justin_c_rounds/Gd2S2/
	//cleaned up to use vector math
	intersection2D.lineLine = function(line1Start, line1End, line2Start, line2End)
	{
		var result = {};
		
		var line1Diff = vector2D.subtract(line1End, line1Start);
		var line2Diff = vector2D.subtract(line2End, line2Start);
				
		var denominator = vector2D.cross(line1Diff, line2Diff);
		if (denominator == 0)
		{
			return result;
		}
		
		var lineStartDiff = vector2D.subtract(line1Start, line2Start);
		var numerator1 = vector2D.cross(line2Diff, lineStartDiff);
		var numerator2 = vector2D.cross(line1Diff, lineStartDiff);
		
		
		
		result.a = numerator1 / denominator;
		result.b = numerator2 / denominator;
		
		//if we cast these lines infinitely in both directions, they intersect here:	
		result = vector2D.lerp(line1End, line1Start, result.a, result);
		
		//it is worth noting that this should be the same as:
		//result = vector2D.lerp(line2End, line2Start, result.b, result);
					
		// if line1 is a segment and line2 is infinite, they intersect if:
		if (result.a > 0 && result.a < 1)
		{
			result.onLine1 = true;
		}
		
		//if line2 is a segment and line1 is infinite, they intersect if:
		if (result.b > 0 && result.b < 1)
		{
			result.onLine2 = true;
		}
		
		// if line1 and line2 are segments, they intersect if both of the above are true
		return result;
	};	

	intersection2D.circleCircle = function(circle1, circle2)
	{
		var result = {};
		
		var x0 = circle1.x;
		var y0 = circle1.y;
		var r0 = circle1.r;
		var x1 = circle2.x;
		var y1 = circle2.y;
		var r1 = circle2.r;

		//dx and dy are the vertical and horizontal distances between the circle centers.
		var dx = x1 - x0;
		var dy = y1 - y0;

		//determine the straight-line distance between the centers.
		var d = Math.sqrt((dy*dy) + (dx*dx));

		//check for solvability.
		if (d > (r0 + r1))
		{
			//no solution. circles do not intersect.
			return result;
		}
		if (d < Math.abs(r0 - r1))
		{
			//no solution. one circle is contained in the other
			result.contained = true;
			return result;
		}

		//'point 2' is the point where the line through the circle intersection points crosses the line between the circle centers.  

		//determine the distance from point 0 to point 2.
		var a = ((r0 * r0) - (r1 * r1) + (d * d)) / (2.0 * d);
		
		//determine the coordinates of point 2. */
		var x2 = x0 + (dx * a / d);
		var y2 = y0 + (dy * a / d);
		
		//one solution
		if (a >= r0)
		{
			result.solution1 = {x : x2, y : y2};
			return result;
		}

		//two solutions
		
		//determine the distance from point 2 to either of the intersection points.
		//Pythagorean on the right triangle between center0, point2 and the intersection points.
		var h = Math.sqrt((r0 * r0) - (a * a));

		//now determine the offsets of the intersection points from point 2.
		var rx = -dy * (h / d);
		var ry = dx * (h / d);

		//determine the absolute intersection points.
		var xi = x2 + rx;
		var yi = y2 + ry;
		var xi_prime = x2 - rx;
		var yi_prime = y2 - ry;

		result.solution1 = {x : xi, y : yi};
		result.solution2 = {x : xi_prime, y : yi_prime};
		return result;
	}
	
	return intersection2D;
	
});