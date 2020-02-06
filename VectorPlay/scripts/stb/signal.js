define(['require'], function (require) {

	var exports = {};
	
	function getCurrent(dir)
	{
		var i = 0;
		var cs = Scenario["ConnectorSet" + i];
		while(cs)
		{
			if (cs.getType() == SIGNAL)
			{
				return Scenario["ConnectorSet" + i].getPhase(dir);
			}
			
			i++;
			cs = Scenario["ConnectorSet" + i];
		}
	}

	exports.greenToRed = function(dir)
	{
		var current = getCurrent(dir);
		if (current == PHASE_RED)
		{
			this.immediate(dir, PHASE_RED);
			return;
		}
		
		this.transitionTS = this.transitionTS || new Scenario.TimeSensor("SignalTransitionTS");
		
		this.transitionTS.onLeave = function()
		{
			exports.immediate(dir, PHASE_RED);
			this.disable();
		}
		
		exports.immediate(dir, PHASE_YELLOW);
		this.transitionTS.setStartTime(0);
		this.transitionTS.setStopTime(-8);
		
		this.transitionTS.enable();
	}
	
	exports.immediate = function(dir, phase)
	{
		var i = 0;
		var cs = Scenario["ConnectorSet" + i];
		while(cs)
		{
			if (cs.getType() == SIGNAL)
			{
				//Scenario["ConnectorSet" + i].setDefaultTime(dir, 0, 0, 0, 0);
				Scenario["ConnectorSet" + i].setPhase(dir, phase, 99999);
			}
			
			i++;
			cs = Scenario["ConnectorSet" + i];
		}
		
		print("call to setSignalPhase");
	}

	exports.reset = function()
	{
		var i = 0;
		var cs = Scenario["ConnectorSet" + i];
		while(cs)
		{
			if (cs.getType() == SIGNAL)
			{
				Scenario["ConnectorSet" + i].reset();
			}
			
			i++;
			cs = Scenario["ConnectorSet" + i];
		}
		
		print("call to reset SignalPhase");
		
		if (this.transitionTS)
		{
			this.transitionTS.disable();
			delete this.transitionTS;
		}
	}

	exports.setLightControl = function(enable)
	{
		var i = 0;
		var cs = Scenario["ConnectorSet" + i];
		while(cs)
		{
			if (cs.getType() == SIGNAL)
			{
				Scenario["ConnectorSet" + i].setLightControl(enable);
			}
			
			i++;
			cs = Scenario["ConnectorSet" + i];
		}
		
		print("call to reset SignalPhase");
		
		if (this.transitionTS)
		{
			this.transitionTS.disable();
			delete this.transitionTS;
		}
	}
	
	
	return exports;

});