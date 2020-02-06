define(['require'], function (require) {

	function WaypointCondition()
	{
		this.todoList = [];
		this.doneList = [];
	}

	WaypointCondition.prototype.addWaypoint = function(position, condition)
	{
		if (condition)
		{
			if (condition.func && condition.context)
			{
				this.todoList.push({position : position, func : condition.func, context : condition.context});
			}
			else
			{
				print("invalid condition, there is no func or context");
			}
		}
	}

	WaypointCondition.prototype.getNext = function()
	{
		return this.todoList[0];
	}

	WaypointCondition.prototype.shift = function()
	{
		if (this.todoList.length > 0)
		{
			this.doneList.unshift(this.todoList.shift());
			
			print("shifting conditions, done list size is now " + this.doneList.length);
		}
	}

	WaypointCondition.prototype.reset = function()
	{
		while (this.doneList.length > 0)
		{
			this.todoList.unshift(this.doneList.shift());
		}
		
		print("reset conditions, todo list size is now " + this.todoList.length);
	}

	return WaypointCondition;

});