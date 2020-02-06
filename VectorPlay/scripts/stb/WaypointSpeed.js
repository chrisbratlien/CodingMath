define(['require'], function (require) {

	function WaypointSpeed()
	{
		this.todoList = [];
		this.doneList = [];
	}

	WaypointSpeed.prototype.addWaypoint = function(position, speed)
	{
		//update the previous speed end point
		if (this.todoList.length > 0)
		{
			this.todoList[this.todoList.length - 1].end = position;
		}
		
		this.todoList.push({start : position, speed : speed});
	}

	WaypointSpeed.prototype.getNext = function()
	{
		return this.todoList[0];
	}

	WaypointSpeed.prototype.shift = function()
	{
		if (this.todoList.length > 0)
		{
			this.doneList.unshift(this.todoList.shift());
			
			//print("shifting speed change, done list size is now " + this.doneList.length);
		}
	}

	WaypointSpeed.prototype.reset = function()
	{
		while (this.doneList.length > 0)
		{
			this.todoList.unshift(this.doneList.shift());
		}
		
		print("reset speed changes, todo list size is now " + this.todoList.length);
	}

	return WaypointSpeed;

});