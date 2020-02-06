define(['require', 'utils/string'], function (require, stringUtil) {

	var exports = {};

	function stripVisualModel(visualModel)
	{
		var words = visualModel.split("/");
		for (var j in words)
		{
			var dotIndex = words[j].indexOf(".");
			if (dotIndex > -1)
			{
				return words[j].substring(0, dotIndex);
			}
		}
		
		return visualModel;
	}


	function strip(name)
	{
		//name = stringUtil.removePrefix("xst", name);
		//name = stringUtil.removePrefix("xm_ped", name);
		//name = stringUtil.removePrefix("xm", name);
		//name = stringUtil.removePrefix("xb", name);
		//name = stringUtil.removePrefix("os", name);
		name = stringUtil.replaceAll("_", " ", name);
		name = stringUtil.replaceAll("-", " ", name);
		name = stringUtil.replaceAll("'", "", name);
		name = stringUtil.replaceAll("/w", "", name);
		name = stringUtil.replaceAll("/", "", name);
		name = stringUtil.replaceAll("(", "", name);
		name = stringUtil.replaceAll(")", "", name);
		name = stringUtil.trim(name);
		name = name.toLowerCase();
		
		return name;
	}

	
	function profileMap(profileSet)
	{
		var rtn = {};
		
		if (profileSet)
		{
			var profiles = profileSet.getProfiles();
			for (var i in profiles)
			{
				var visualModel = strip(stripVisualModel(profiles[i].getVisualModel()));
				rtn[visualModel] = profiles[i];
			}
		}
		
		return rtn;
	}

	var actorProfileMap;
	var vehicleProfileMap;
	var ownshipProfileMap;
	var objectProfileMap;

	exports.getProfile = function(visualModel)
	{
		var visualModelLower = strip(stripVisualModel(visualModel));

		actorProfileMap = actorProfileMap || profileMap(Scenario.getEntityProfileSet("MovingObjectDB"));
		var actorProfile = actorProfileMap[visualModelLower];
		if (actorProfile)
		{
			return actorProfile;
		}
		else
		{
			vehicleProfileMap = vehicleProfileMap || profileMap(Scenario.getEntityProfileSet("VehicleDB"));
			var vehicleProfile = vehicleProfileMap[visualModelLower];
			if (vehicleProfile)
			{
				return vehicleProfile;
			}
			else
			{
				ownshipProfileMap = ownshipProfileMap || profileMap(Scenario.getEntityProfileSet("OwnshipDB"));
				var ownshipProfile = ownshipProfileMap[visualModelLower];
				if (ownshipProfile)
				{
					return ownshipProfile;
				}
				else
				{
					objectProfileMap = objectProfileMap || profileMap(Scenario.getEntityProfileSet("ObstacleDB"));
					var objectProfile = objectProfileMap[visualModelLower];
					if (objectProfile)
					{
						return objectProfile;
					}
				}
			}
		}
	}
	
	function toFixed(value, precision)
	{
		var precision = precision || 0,
		power = Math.pow(10, precision),
		absValue = Math.abs(Math.round(value * power)),
		result = (value < 0 ? '-' : '') + String(Math.floor(absValue / power));

		if (precision > 0) {
			var fraction = String(absValue % power),
			padding = new Array(Math.max(precision - fraction.length, 0) + 1).join('0');
			result += '.' + padding + fraction;
		}
		return result;
	}

	function printFuzzy(name)
	{
		if (STB.fuzzySet)
		{
			var result = STB.fuzzySet.get(strip(name));
			if (result)
			{
				if (result[0])
				{
					var score = result[0][0];
					var best = result[0][1];
					
					var bestName = getProfileName(best);
					var profile = getProfile(bestName);
					if (profile)
					{
						var profileName = profile.getName();
						var visualModelStrip = stripVisualModel(profile.getVisualModel());
						
						if (score == 1)
						{
							if (name != visualModelStrip)
							score = 0.999;
						}
						
						if (score < 0.0)
						{
							if ((name.indexOf("xst_") > -1) || (name.indexOf("xb_") > -1))
							{
								profileName = "Barrel";
								visualModelStrip = "xm_barrel";
								score = 0;
							}
						}
						
						print("/*bestProfileScore " + toFixed(score, 3) + "*/\tprofileMap[\"" + name + "\"] = \"" + profileName + "\"; //" + visualModelStrip);
					}
				}
			}
		}
	}


	return exports;

});