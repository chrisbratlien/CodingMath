define(['require', 'utils/string', 'utils/path', 'stb'], function (require, stringUtil, pathUtil, STB) {

	Scenario.createManeuverType("PathScenario");
	
	var stbInstance;
	
	PathScenario.prototype.onEnter=function()
	{
		print("starting PathScenario");
	}
	
	PathScenario.prototype.onActivate=function()
	{
		if (stbInstance)
		{
			if (stbInstance.update() == false)
			{
				this.leave();
			}
		}
		else
		{
			this.leave();
		}
	};

	PathScenario.prototype.onLeave=function()
	{
		if (stbInstance)
		{
			stbInstance.end();
			delete stbInstance;
			stbInstance = undefined;
		}
		
		print("leaving PathScenario");
	};

	PathScenario.prototype.onCancel=function()
	{
		if (stbInstance)
		{
			stbInstance.end();
			delete stbInstance;
			stbInstance = undefined;
		}
		
		print("cancelling PathScenario");
	};
		
	var pathSingleton;
		
	return function (addWaypointsCB, scenarioName, autonomous)
	{		
		if (pathSingleton)
		{
			pathSingleton.destroy();
			delete pathSingleton;
			pathSingleton = undefined;
		}
		
		if (stbInstance)
		{
			stbInstance.end();
			delete stbInstance;
			stbInstance = undefined;
		}
		
		var experimentDir = pathUtil.getDirectory(Scenario.getExperimentFilename());
		var experimentPath = pathUtil.normalize(experimentDir);
		
		if (addWaypointsCB)
		{
			print("New STB instance\n");
			
			var soundPath = experimentPath + "/sounds/" + scenarioName;
			stbInstance = new STB(soundPath);
			addWaypointsCB(stbInstance);
			stbInstance.create(autonomous); //autonomous
			stbInstance.join(autonomous);
		
			pathSingleton = new PathScenario("pathSingleton");
			pathSingleton.setRecycle(false);
			pathSingleton.setStartTime(0);
			pathSingleton.enable();
			
			return true;
		}
		
		return false;
	}
	
});