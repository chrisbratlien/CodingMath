define(['require'], function (require) {

	//static object
	var exports = {};
	
	//private data member
	var machineStates = {};
	
	//public functions to access private data member
	exports.setMachineState = function(name, state)
	{
		machineStates[name] = state;
	}
	
	//public functions to access private data member
	exports.getMachineState = function(name)
	{
		return machineStates[name];
	}
	
	//interface is returned
	return exports;
	
});