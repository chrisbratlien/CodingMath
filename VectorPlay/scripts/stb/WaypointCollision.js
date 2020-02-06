define(['require', 'dataStructures/AABB_2D', 'utils/string'], function (require, AABB_2D, stringUtil) {

	function WaypointCollision(entity_num)
	{
		this.entity_num = entity_num;
		
		this.todoList = [];
		this.doneList = [];
	}
	
	WaypointCollision.prototype.addWaypoint = function(result)
	{
		//this some-what complicated code takes many small segments and combines them into a single long segment, if possible
		var last = this.getLast();
		if (last)
		{
			var lastEnd = last.end;
			
			if (result.start < lastEnd)
			{
				result.start = lastEnd;
			}
			
			if (result.end < lastEnd)
			{
				result.end = lastEnd;
			}
			
			if (result.end < result.start)
			{
				result.end = result.start;
			}
			
			if (result.end > result.start)
			{
				if (result.start == lastEnd)
				{
					this.setLast(last.start, result.end);
				}
				else
				{
					result.aabb = new AABB_2D();
					this.todoList.push(result);
				}
			}
		}
		else
		{
			result.aabb = new AABB_2D();
			this.todoList.push(result);
		}
		
		if (this.todoList.length > 0)
		{
			//update or create the AABB associated with the latest collision result
			this.todoList[this.todoList.length - 1].aabb.expandPoint(result.startPos.x, result.startPos.y, 0);
			this.todoList[this.todoList.length - 1].aabb.expandPoint(result.endPos.x, result.endPos.y, 0);
		}
	}
	
	WaypointCollision.prototype.wrapLoops = function(length)
	{
		if (this.todoList.length > 1)
		{
			var first = this.getNext();
			var last = this.getLast();
			
			var epsilon = 0.1;
			
			if ((first.start < epsilon) && ((last.end + epsilon) > length))
			{
				//extend boundries to before and after the route for the position math to work as entities repeat the path
				this.todoList[0].start = last.start - length;
				this.todoList[this.todoList.length - 1].end = first.end + length;
				
				this.todoList[0].aabb.expand(last.aabb);
				this.todoList[this.todoList.length - 1].aabb.expand(first.aabb);
			}
		}
	}
	
	WaypointCollision.prototype.getNext = function()
	{
		return this.todoList[0];
	}
	
	WaypointCollision.prototype.getLast = function()
	{
		if (this.todoList.length > 0)
		{
			return this.todoList[this.todoList.length - 1];
		}
	}
	
	WaypointCollision.prototype.setLast = function(start, end)
	{
		if (this.todoList.length > 0)
		{
			this.todoList[this.todoList.length - 1].start = start;
			this.todoList[this.todoList.length - 1].end = end;
		}
	}

	WaypointCollision.prototype.shift = function()
	{
		if (this.todoList.length > 0)
		{
			if (this.todoList[0])
			{
				if (this.todoList[0].semaphore)
				{
					//take this entity out of the shared entity queue
					this.todoList[0].semaphore.unlock(this.entity_num);
				}
			}
			
			this.doneList.unshift(this.todoList.shift());
			
			//print("shifting collision, done list size is now " + this.doneList.length);
		}
	}
	
	WaypointCollision.prototype.reset = function()
	{
		//there is a corner case here when an entity is at the end/start of his looping path
		//the entity might hold a lock on the 'end' when he starts the path again
		//by not shifting the old lock and just unshifting back to reset, the entity still holds the lock
		//whether the lock is held switches to the 'start' collision tests which is correct
		
		while (this.doneList.length > 0)
		{
			this.todoList.unshift(this.doneList.shift());
		}
		
		print("reset collision, todo list size is now " + this.todoList.length);
	}

	return WaypointCollision;

});