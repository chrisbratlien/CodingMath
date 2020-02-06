define(['require', 'stb/parseScripts'], function (require, parseScripts) {

	function WaypointEvent()
	{
		this.todoList = [];
		this.doneList = [];
	}

	WaypointEvent.prototype.addWaypoint = function(position, scripts)
	{
		if (scripts)
		{
			var events = parseScripts(scripts);
			if (events.length > 0)
			{
				this.todoList.push({position : position, events : events});
			}
		}
	}
	
	
	function parseManeuver(maneuver)
	{
		maneuver.setRecycle(true);

		return function(entities)
		{
			if (maneuver)
			{
				maneuver.m_pathEntity = this.entityObj;
				maneuver.setStartTime(-0.016667);
				maneuver.enable();
			}
		}
	}
	
	function parseManeuvers(maneuvers)
	{
		//"Maneuver" : [{ "Weather" : "Fog" }, { "EmergencyVehicle" : "EmergencyVehicle" }, { "PlayAudioSample" : "Proceed Left" } ]
		var events = [];
		
		for (var i in maneuvers)
		{
			var result = parseManeuver(maneuvers[i]);
			if (result.constructor === Array)
			{
				events = events.concat(result);
			}
			else
			{
				events.push(result);
			}
		}
		
		return events;
	}
	
	WaypointEvent.prototype.addManeuver = function(position, maneuvers)
	{
		if (maneuvers)
		{
			var events = parseManeuvers(maneuvers);
			if (events.length > 0)
			{
				this.todoList.push({position : position, events : events});
			}
		}
	}

	WaypointEvent.prototype.getNext = function()
	{
		return this.todoList[0];
	}

	WaypointEvent.prototype.shift = function()
	{
		if (this.todoList.length > 0)
		{
			this.doneList.unshift(this.todoList.shift());
			
			print("shifting events, done list size is now " + this.doneList.length);
		}
	}

	WaypointEvent.prototype.reset = function()
	{
		while (this.doneList.length > 0)
		{
			this.todoList.unshift(this.doneList.shift());
		}
		
		print("reset events, todo list size is now " + this.todoList.length);
	}

	return WaypointEvent;

});