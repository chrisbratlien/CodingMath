define(['require', 'utils/string'], function (require, stringUtil) {

	var exports = {};
	
	exports.getComponent = function(defaultName)
	{
		var defaultNameL = defaultName.toLowerCase();
		
		for (var i in simCreator)
		{
			var compL = i.toLowerCase();
			if (compL.indexOf(defaultNameL) > -1)
			{
				return simCreator[i];
			}
		}
		
		print("Error: there is no component named " + defaultName + " in model");
	}
	
	return exports;

});