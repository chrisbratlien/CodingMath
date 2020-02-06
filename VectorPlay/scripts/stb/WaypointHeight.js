define(['require', 'stb/parseScripts'], function (require, parseScripts) {

	function WaypointHeight()
	{
		this.todoList = [];
		this.doneList = [];
	}

	WaypointHeight.prototype.addWaypoint = function(position, height)
	{
		if (height === undefined)
		{
			height = 0;
		}
		
		if (this.todoList.length > 0)
		{
			if (this.todoList[this.todoList.length - 1] == height)
			{
				return;
			}
		}
		
		this.todoList.push({position : position, height : height});
	}

	WaypointHeight.prototype.getNext = function()
	{
		return this.todoList[0];
	}

	WaypointHeight.prototype.shift = function()
	{
		if (this.todoList.length > 0)
		{
			this.doneList.unshift(this.todoList.shift());
			
			//print("shifting height, done list size is now " + this.doneList.length);
		}
	}

	WaypointHeight.prototype.reset = function()
	{
		while (this.doneList.length > 0)
		{
			this.todoList.unshift(this.doneList.shift());
		}
		
		print("reset height, todo list size is now " + this.todoList.length);
	}

	return WaypointHeight;

});