define(['require'], function (require) {

	var exports = {};
	
	function flashers(enable, state)
	{
		var next = (state + 1) % 2;
		
		if (!enable)
		{
			state = 0;
			next = 0;
		}
		
		if (Scenario.getTerrainSwitchState("S_GATE_L") != -1) Scenario.setTerrainSwitchState("S_GATE_L", state);
		if (Scenario.getTerrainSwitchState("S_GATE_R") != -1) Scenario.setTerrainSwitchState("S_GATE_R", next);
		
		if (Scenario.getTerrainSwitchState("S_RRX_RED_L") != -1) Scenario.setTerrainSwitchState("S_RRX_RED_L", state);
		if (Scenario.getTerrainSwitchState("S_RRX_RED_R") != -1) Scenario.setTerrainSwitchState("S_RRX_RED_R", next);
	}
	
	exports.flashersOn = function(period)
	{
		if (!this.flashersTS)
		{
			print("creating a time sensor for rail crossing switches");
			this.flashersTS = new Scenario.TimeSensor("RailCrossingSignalTS");
			this.flashersTS.setCycle(true);
			
			this.flashersTS.onActivate = function()
			{
				this.flasherState++;
				this.flasherState = this.flasherState % 2;
				
				flashers(true, this.flasherState);
			}
			
			this.flashersTS.onLeave = function()
			{
				flashers(false, 0);
			}
			
			this.flashersTS.flasherState = 0;
		}
		
		this.flashersTS.setCycleInterval(period);
		
		this.flashersTS.setStartTime(Scenario.getTime());
		this.flashersTS.setStopTime(0);
		
		this.flashersTS.enable();
	}

	exports.flashersOff = function(delay)
	{
		if (this.flashersTS)
		{
			this.flashersTS.setStopTime(Scenario.getTime() + delay);
		}
	}
	
	exports.armsDown = function(delay)
	{
		if (!this.armDownTS)
		{
			this.armDownTS = new Scenario.TimeSensor("RailCrossingArmDownTS");
			this.armDownTS.setCycle(false);
			
			this.armDownTS.onEnter = function()
			{
				if (Scenario.getTerrainSwitchState("D_GATE") != -1) Scenario.setTerrainSwitchState("D_GATE", 1);
				this.disable();
			}
		}
		
		this.armDownTS.setStartTime(Scenario.getTime() + delay);
		this.armDownTS.setStopTime(0);
		
		this.armDownTS.enable();
	}
	
	function armsUp()
	{
		if (Scenario.getTerrainSwitchState("D_GATE") != -1) Scenario.setTerrainSwitchState("D_GATE", 0);
	}
	
	
	//exports.flasherDelay = 0;
	exports.flasherPeriod = 1;
	exports.gateArmDelay = 3;
	//exports.gateArmFunc = RAMP;
	exports.gateArmSpeed = 2;
	
	exports.close = function()
	{
		print("rail crossing close called");
		
		this.flashersOn(this.flasherPeriod);
		this.armsDown(this.gateArmDelay);
	}
	
	exports.open = function()
	{
		print("rail crossing open called");
		
		armsUp();
		this.flashersOff(this.gateArmSpeed);
	}
	
	exports.reset = function()
	{
		if (this.flashersTS)
		{
			this.flashersTS.disable();
			delete this.flashersTS;
		}
		
		if (this.armDownTS)
		{
			this.armDownTS.disable();
			delete this.armDownTS;
		}
		
		armsUp();
		flashers(false, 0);
	}

	return exports;

});