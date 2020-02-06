define(['require'], function (require) {

	function WaypointDriverCue()
	{
		this.todoList = [];
		this.doneList = [];
	}

	WaypointDriverCue.prototype.addWaypoint = function(position, wav_file, condition)
	{
		this.todoList.push({position : position, wav_file : wav_file, condition : condition});
	}

	WaypointDriverCue.prototype.getNext = function()
	{
		return this.todoList[0];
	}

	WaypointDriverCue.prototype.shift = function()
	{
		if (this.todoList.length > 0)
		{
			this.doneList.unshift(this.todoList.shift());
			
			print("shifting speed change, done list size is now " + this.doneList.length);
		}
	}

	WaypointDriverCue.prototype.reset = function()
	{
		while (this.doneList.length > 0)
		{
			this.todoList.unshift(this.doneList.shift());
		}
		
		print("reset speed changes, todo list size is now " + this.todoList.length);
	}

	return WaypointDriverCue;

});