define(['require', 'utils/string'], function (require, stringUtil) {

	//this utility class expects that objects passed into the function contain x and y properties
	
	var vector2D = {};

	vector2D.dot = function(a, b)
	{
		return a.x * b.x + a.y * b.y;
	};
	
	vector2D.cross = function(a, b)
	{
		return a.x * b.y - a.y * b.x;
	};
	
	vector2D.length = function(a)
	{
		return Math.sqrt(vector2D.dot(a, a));
	};

	vector2D.negative = function(a, b)
	{
		b = b || {};
		
		b.x = -a.x;
		b.y = -a.y;
		
		return b;
	};
	
	vector2D.add = function(a, b, c)
	{
		c = c || {};
		
		c.x = a.x + b.x;
		c.y = a.y + b.y;
		
		return c;
	};
	
	vector2D.subtract = function(a, b, c)
	{
		c = c || {};
		
		c.x = a.x - b.x;
		c.y = a.y - b.y;
		
		return c;
	};
	
	vector2D.multiply = function(a, b, c)
	{
		c = c || {};
		
		c.x = a.x * b.x;
		c.y = a.y * b.y;
		
		return c;
	};
	
	vector2D.divide = function(a, b, c)
	{
		c = c || {};
		
		c.x = a.x / b.x;
		c.y = a.y / b.y;
		
		return c;
	};
	
	
	vector2D.scale = function(a, b, c)
	{
		c = c || {};
		
		c.x = a.x * b;
		c.y = a.y * b;
		
		return c;
	};
	
	vector2D.scaleInv = function(a, b, c)
	{
		c = c || {};
		
		c.x = a.x / b;
		c.y = a.y / b;
		
		return c;
	};
	
	vector2D.unit = function(a, b)
	{
		b = b || {};
		
		var length = vector2D.length(a);
		
		b.x = a.x / length;
		b.y = a.y / length;
		
		return b;
	};
	
	vector2D.fromAngles = function(phi, a)
	{
		var a = a || {};
		
		//dont forget to transform from simcreator coordinates (90 - h / 180 * PI)
		
		a.x = Math.cos(phi);
		a.y = Math.sin(phi);
		
		return a;
	};
	
	vector2D.min = function(a, b, c)
	{
		var c = c || {};
		
		c.x = Math.min(a.x, b.x);
		c.y = Math.min(a.y, b.y)
		
		return c;
	};
	
	vector2D.max = function(a, b, c)
	{
		var c = c || {};
		
		c.x = Math.max(a.x, b.x);
		c.y = Math.max(a.y, b.y)
		
		return c;
	};
	
	//performs linear interpolation between two vectors.
	vector2D.lerp = function(a, b, fraction, c)
	{
		var c = c || {};
		
		c = vector2D.subtract(a, b, c);
		c = vector2D.scale(c, fraction, c);
		c = vector2D.add(b, c, c);
		
		return c;
	};
	
	vector2D.fromArray = function(a, b)
	{
		var b = b || {};
		
		b.x = a[0];
		b.y = a[1];
		
		return b;
	};
	
	//returns a vector with a length of 1 and a statistically uniform direction.
	vector2D.randomDirection = function()
	{
		return vector2D.fromAngles(Math.random() * Math.PI * 2, Math.asin(Math.random() * 2 - 1));
	};
	
	vector2D.angleBetween = function(a, b) 
	{
		return Math.acos(vector2D.dot(a, b) / (vector2D.length(a) * vector2D.length(b)));
	};

	return vector2D;

});