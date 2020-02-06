define(['require', 'utils/string'], function (require, stringUtil) {

	Scenario.createManeuverType("Joystick");
	
	Joystick.prototype.onEnter = function()
	{
		this.states = this.states || [];
		for (var i = 0; i < simCreator.JoystickButtons.SigOut.Columns; ++i)
		{
			this.states.push(simCreator.JoystickButtons.SigOut[i]);
		}
	}
	
	Joystick.prototype.onActivate = function()
	{
		for (var i = 0; i < simCreator.JoystickButtons.SigOut.Columns; ++i)
		{
			if (this.states[i] != simCreator.JoystickButtons.SigOut[i])
			{
				if (this["Button" + i])
				{
					this["Button" + i].apply(this.m_context, undefined)
				}
				else
				{
					print("Unmapped Joystick Button Pressed : " + i);
				}
			}
			
			this.states[i] = simCreator.JoystickButtons.SigOut[i];
		}
	}

});