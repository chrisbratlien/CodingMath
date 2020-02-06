define(['require'], function (require) {

	var exports = {};
	
	var debugPrints;
	
	exports.enableDebugPrints = function()
	{
		debugPrints = true;
	}
	
	exports.print = function(severity, msg)
	{
		//MSG_ERROR,
		//MSG_MESSAGE,
		//MSG_WARNING,
		
		if (severity == "DEBUG")
		{
			if (debugPrints)
			{
				Report(MSG_WARNING, msg);
			}
		}
		else if (severity == "ERROR")
		{
			Report(MSG_ERROR, msg);
		}
		else
		{
			Report(MSG_MESSAGE, msg);
		}
	}
	
	return exports;

});