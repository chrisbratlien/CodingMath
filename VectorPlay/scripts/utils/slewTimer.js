define(['require'], function (require) {

	//associated list of timers, only grows when new names are added
	var timers = {};
	
	//cb is the callback assumed to take two functions as parameters name and slew value
	return function (name, func, min, max, duration, cb)
	{
		timers[name] = timers[name] || new Scenario.TimeSensor(name + "_TimeSensor");
	
		timers[name].onEnter = function()	{ cb(name, min); }
		timers[name].onActivate = function()
		{
			//slews between 0 and 1 based on sim time and duration of this timer
			var timeNorm = Scenario.interFunction(func, this.getStartTime(), this.getStopTime(), Scenario.getTime());
			
			//scale/bias the normalized value
			cb(name, (max - min) * timeNorm + min);
		}
		timers[name].onLeave = function()	{ cb(name, max); }
		
		timers[name].setCycleInterval(0.01667);
		timers[name].setCycle(true);
		timers[name].setStartTime(Scenario.getTime());
		timers[name].setStopTime(Scenario.getTime() + duration);	
		timers[name].enable();
	}

});