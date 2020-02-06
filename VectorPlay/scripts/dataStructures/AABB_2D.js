define(['require', 'math/vector2D'], function (require, vector2D) {

	function AABB_2D()
	{
		this.x = 99999999999;
		this.y = 99999999999;
		this.maxX = -99999999999;
		this.maxY = -99999999999;
	}
	
	AABB_2D.prototype.dump = function()
	{
		print("AABB_2D properties");
		print("this.x = " + this.x);
		print("this.y = " + this.y);
		print("this.maxX = " + this.maxX);
		print("this.maxY = " + this.maxY);
		
		print("this.centerX = " + this.centerX);
		print("this.centerY = " + this.centerY);
		print("this.width = " + this.width);
		print("this.height = " + this.height);
		print("radius = " + this.getRadius());
	}
	
	AABB_2D.prototype.getRadius = function()
	{
		return Math.sqrt(this.width * this.width + this.height * this.height);
	}
	
	AABB_2D.prototype.empty = function()
	{
		return this.width === undefined;
	}
	
	AABB_2D.prototype.expandPoint = function(x, y, radius)
	{
		this.x = Math.min(this.x, x - radius);
		this.y = Math.min(this.y, y - radius);
		this.maxX = Math.max(this.maxX, x + radius);
		this.maxY = Math.max(this.maxY, y + radius);
		this.centerX = (this.x + this.maxX) / 2.0;
		this.centerY = (this.y + this.maxY) / 2.0;
		
		this.width = this.maxX - this.x;
		this.height = this.maxY - this.y;
	}
	
	AABB_2D.prototype.expand = function(aabb)
	{
		if (!aabb.empty())
		{
			this.x = Math.min(this.x, aabb.x);
			this.y = Math.min(this.y, aabb.y);
			this.maxX = Math.max(this.maxX, aabb.maxX);
			this.maxY = Math.max(this.maxY, aabb.maxY);
			this.centerX = (this.x + this.maxX) / 2.0;
			this.centerY = (this.y + this.maxY) / 2.0;
			
			this.width = this.maxX - this.x;
			this.height = this.maxY - this.y;
		}
	}
	
	AABB_2D.prototype.intersection = function(aabb)
	{
		if (!aabb.empty())
		{
			var diffX = Math.abs(this.centerX - aabb.centerX) * 2;
			var diffY = Math.abs(this.centerY - aabb.centerY) * 2;
			
			var sumWidth = this.width + aabb.width;
			var sumHeight = this.height + aabb.height;
			
			return (diffX < sumWidth) && (diffY < sumHeight);
		}
		
		return false;
	}
	
	AABB_2D.prototype.getDistance = function(aabb)
	{
		var centerA = {x : this.centerX, y : this.centerY};
		var centerB = {x : aabb.centerX, y : aabb.centerY};
		
		var centerDiff = vector2D.subtract(centerA, centerB);
		return vector2D.length(centerDiff);
	}
	
	AABB_2D.prototype.isSimilar = function(aabb)
	{
		if (Math.abs(this.getRadius() - aabb.getRadius()) < 20)
		{
			var distance = this.getDistance(aabb);
			if (distance < 20)
			{
				return true;
			}
		}
		
		return false;
	}
	
	return AABB_2D;
	
});