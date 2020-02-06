define(['require'], function (require) {

	function Delay(time)
	{
		this.endTime = Scenario.getTime() + time;
	}
	
	Delay.prototype.blocking = true;
	
	//returns true if this event is done
	Delay.prototype.update = function()
	{
		if (Scenario.getTime() > endTime)
		{
			return true;
		}
		
		return false;
	}

});