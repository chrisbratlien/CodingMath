define(['require', 'utils/simCreator', 'utils/string'], function (require, simCreatorUtil, stringUtil) {

	var exports = {};
	
	var component = simCreatorUtil.getComponent("VCGenericTitler");
	
	function checkModel()
	{
		if (component === undefined)
		{
			print("simObserver.js : no VCGenericTitler component in model");
		}
	}
	
	exports.record = function()
	{
		checkModel();
		
		component.vcRecord.Call();
	}
	
	exports.pause = function()
	{
		checkModel();
		
		component.vcPause.Call();
	}
	
	exports.resume = function()
	{
		checkModel();
		
		component.vcResume.Call();
	}
	
	exports.markEvent = function(event)
	{
		checkModel();
		
		if (event !== undefined)
		{
			event = stringUtil.replaceAll(" ", "_", "" + event);
			component.EventString[0] = event;
			component.vcEvent.Call();
		}
		else
		{
			component.vcEvent.Call();
		}
	}
	
	exports.connect = function(ip, lcl)
	{
		checkModel();
		
		if (ip)
		{
			component.TitlerIP[0] = ip;
		}
		
		if (lcl)
		{
			component.LocalIP[0] = lcl;
		}
		
		component.vcConnect.Call();
	}
	
	exports.disconnect = function()
	{
		checkModel();
		
		component.vcDisconnect.Call();
	}
	
		
	exports.setConfig = function(basename, tcx)
	{
		checkModel();
		
		if (basename)
		{
			component.BaseName[0] = basename;
		}
		
		if (tcx)
		{
			component.TCFFile[0] = tcx;
		}
		
		component.vcSetConfig.Call();
	}
	
	exports.stop = function()
	{
		checkModel();
		
		component.vcStop.Call();
	}
	
	exports.startCigiCapture = function()
	{
		checkModel();
		
		component.vcStartCigiCapture.Call();
	}
	
	return exports;

});