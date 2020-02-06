define(['require', 'utils/string', 'stb/signal', 'stb/railCrossing', 'utils/passenger'], function (require, stringUtil, signal, railCrossing, passenger) {

	function parseTrafficLightsScriptTransition(script)
	{
		if (script == "NSGreen")
		{
			return function()	{ signal.greenToRed(0); }
		}
		else if (script == "NSRed")
		{
			return function()	{ signal.greenToRed(1); }
		}
		else if (script == "NSYellow")
		{
			return function()	{ signal.immediate(1, PHASE_YELLOW); }
		}
		else if (script == "EWYellow")
		{
			return function()	{ signal.immediate(0, PHASE_YELLOW); }
		}
		else if (script == "NextState")
		{
		}
		
		return function () { print("Executing unsupported traffic lights transition script: " + script); };
	}

	function parseTrafficLightsScriptImmediate(script)
	{
		if (script == "NSGreen")
		{
			return function()	{ signal.immediate(1, PHASE_GREEN); }
		}
		else if (script == "NSRed")
		{
			return function()	{ signal.immediate(1, PHASE_RED); }
		}
		else if (script == "NSYellow")
		{
			return function()	{ signal.immediate(1, PHASE_YELLOW); }
		}
		else if (script == "EWYellow")
		{
			return function()	{ signal.immediate(0, PHASE_YELLOW); }
		}
		
		return function () { print("Executing unsupported traffic lights immediate script: " + script); };
	}

	function parseTrafficLightsScriptFlashing(script)
	{
		if (script == "NSRedEWRed")
		{
			return function() { signal.immediate(0, PHASE_FLASHING_RED); signal.immediate(1, PHASE_FLASHING_RED); }
		}
		else if (script == "NSRedEWYellow")
		{
			return function() { signal.immediate(1, PHASE_FLASHING_RED); }
		}
		else if (script == "NSYellowEWRed")
		{
			return function() { signal.immediate(1, PHASE_FLASHING_YELLOW); }
		}
		
		return function () { print("Executing unsupported traffic lights flashing script: " + script); };
	}

	function parseTrafficLightsScript(script)
	{
		if (script)
		{
			if (script == "AutoLights")
			{
				return function()	{ signal.reset(); }
			}
			else
			{			
				var transition = "transition";
				var transitionIndex = script.indexOf(transition);
				
				var immediate = "immediate";
				var immediateIndex = script.indexOf(immediate);
				
				var flashing = "flashing";
				var flashingIndex = script.indexOf(flashing);
				
				if (transitionIndex > -1)
				{
					var subscript = script.substring(transitionIndex + transition.length);
					print("script : " + script);
					print("subscript : " + subscript);
					return parseTrafficLightsScriptTransition(subscript);
				}
				else if (immediateIndex > -1)
				{
					var subscript = script.substring(immediateIndex + immediate.length);
					print("script : " + script);
					print("subscript : " + subscript);
					return parseTrafficLightsScriptImmediate(subscript);
				}
				else if (flashingIndex > -1)
				{
					var subscript = script.substring(flashingIndex + flashing.length);
					print("script : " + script);
					print("subscript : " + subscript);
					return parseTrafficLightsScriptFlashing(subscript);
				}
			}
		}
		
		return function () { print("Executing unsupported traffic lights script: " + script); };
	}


	function parseApplyInputScript(entity_num, action, fsmName)
	{
		//Scenario vehicles light states are
		//{ BRAKE: ON, OFF, AUTOMATIC, ADAPTIVE },
		//{ SIGNAL: LEFT, RIGHT, HAZARD, OFF, AUTOMATIC },
		//{ HEADLIGHT: LOW, HIGH, OFF, AUTOMATIC }

		if (fsmName == "Sign")
		{
			//TODO Scripts:
			//this is supposed to "Stop" or "Slow" the given entity
		}
		else if ((fsmName == "LeftTurnSignals") && (action == "On"))
		{
			return function (entities) { if (entity_num != 0) entities[entity_num].entityObj.setLightState(SIGNAL, LEFT); else this.entityObj.setLightState(SIGNAL, LEFT); }
		}
		else if ((fsmName == "LeftTurnSignals") && (action == "Off"))
		{
			return function (entities) { if (entity_num != 0) entities[entity_num].entityObj.setLightState(SIGNAL, OFF); else this.entityObj.setLightState(SIGNAL, OFF); }
		}
		else if ((fsmName == "RightTurnSignals") && (action == "On"))
		{
			return function (entities) { if (entity_num != 0) entities[entity_num].entityObj.setLightState(SIGNAL, RIGHT); else this.entityObj.setLightState(SIGNAL, RIGHT); }
		}
		else if ((fsmName == "RightTurnSignals") && (action == "Off"))
		{
			return function (entities) { if (entity_num != 0) entities[entity_num].entityObj.setLightState(SIGNAL, OFF); else this.entityObj.setLightState(SIGNAL, OFF); }
		}
		else if ((fsmName == "BrakeLights") && (action == "On"))
		{
			return function (entities) { if (entity_num != 0) entities[entity_num].entityObj.setLightState(BRAKE, ON); else this.entityObj.setLightState(BRAKE, ON); }
		}
		else if ((fsmName == "BrakeLights") && (action == "Off"))
		{
			return function (entities) { if (entity_num != 0) entities[entity_num].entityObj.setLightState(BRAKE, OFF); else this.entityObj.setLightState(BRAKE, OFF); }
		}
		else
		{
			print("preparing generic action : " + fsmName + " - " + action);
			return function (entities) { entities[entity_num].entityObj.executeAction(fsmName, action); }
		}
		
		return function () { print("ERROR: Unsupported ApplyInput Script : {" + fsmName + ", " + action + "}"); }
	}

	function parseTransitionScript(fsmName, action)
	{
		if (fsmName == "RailRoadCrossing")
		{
			if (action == "Close")
			{
				return function()	{ railCrossing.close(); }
			}
			else if (action == "Open")
			{
				return function()	{ railCrossing.open(); }
			}
			else
			{
				return function () { print("ERROR: Unsupported RailRoadCrossing action : {" + action + "}"); }
			}
		}
		
		//probably implement some slew of a Scenario.setTerrainSwitchState call
		return function () { print("ERROR: Unsupported Transition Script : {" + fsmName + ", " + action + "}"); }
	}


	var animationMap = {};
	
	animationMap["ACT_SIT_DOWN"] = "sit_down";
	animationMap["ACT_STAND_UP"] = "stand_up";
	animationMap["ACT_FIGHT1"] = "bring_it_on";
	animationMap["ACT_FIGHT2"] = "fight";
	animationMap["ACT_STAND_PHONE"] = "stand_phone";
	animationMap["ACT_WALK_PHONE"] = "walk_phone";
	animationMap["ACT_STAND_TEXT"] = "stand_text";
	animationMap["ACT_WALK_TEXT"] = "walk_text";
	animationMap["ACT_STAND"] = "stand";
	animationMap["ACT_FALL_BACK"] = "fall_back";
	animationMap["ACT_FALL_FRONT"] = "fall_front";
	animationMap["ACT_FRANTIC_WAVE"] = "wave";
	animationMap["ACT_WAVE"] = "wave";
	animationMap["ACT_HORIZ_FLAG_LEFT_HAND"] = "horiz_flag_left";
	animationMap["ACT_HORIZ_FLASHLIGHT_LEFT_HAND"] = "horiz_flashlight_left";
	animationMap["ACT_VERT_FLAG_LEFT_HAND"] = "vert_flag_left";
	animationMap["ACT_VERT_FLASHLIGHT_LEFT_HAND"] = "vert_flashlight_left";
	animationMap["ACT_HORIZ_FLAG_RIGHT_HAND"] = "horiz_flag_right";
	animationMap["ACT_HORIZ_FLASHLIGHT_RIGHT_HAND"] = "horiz_flashlight_right";
	animationMap["ACT_VERT_FLAG_RIGHT_HAND"] = "vert_flag_right";
	animationMap["ACT_VERT_FLASHLIGHT_RIGHT_HAND"] = "vert_flashlight_right";

	var animationTypeMap = {};

	animationTypeMap["WALK"] = "walk";
	animationTypeMap["RUN"] = "run";
	animationTypeMap["SIT_DOWN"] = "sit_down";
	animationTypeMap["BRING_IT_ON"] = "bring_it_on";


	/*missing animations {

AV

ACT_FIRE_GUN;ACT_FIRE_GUN_RS;ACT_PickUp;ACT_PickUp_Hold;ACT_PickUp_Stand;
ACT_RAISE_GUN;ACT_RAISE_GUN_RS;ACT_RAISE_GUN_TWO_HANDED;ACT_RAISE_GUN_TWO_HANDED_KNEELING;
ACT_RUN;ACT_SHOOT_GUN;ACT_SHOOT_GUN_RS;ACT_SIGN_HOLD;ACT_WAVE_HOLD;


PED

ACT_FIRE_GUN;ACT_LOWER_GUN;ACT_SHOOT_GUN

}*/

	var postureMap = {};

	postureMap["ACT_STAND"] = "stand_walk_run";
	postureMap["ACT_WALK"] = "stand_walk_run";
	postureMap["ACT_RUN"] = "stand_walk_run";
	postureMap["ACT_SITTING"] = "sit_sit_sit";
	postureMap["ACT_STAND_PHONE"] = "stand_walk_phone";
	postureMap["ACT_WALK_PHONE"] = "stand_walk_phone";
	postureMap["ACT_STAND_TEXT"] = "stand_walk_text";
	postureMap["ACT_WALK_TEXT"] = "stand_walk_text";


	function parseSelectAnimationNameScript(entity_num, animation)
	{
		var rtiAnimation = animationMap[animation];
		if (rtiAnimation)
		{
			return function (entities) { entities[entity_num].entityObj.executeAction(rtiAnimation); }
		}
		else
		{
			var rtiPosture = postureMap[animation];
			if (rtiPosture)
			{
				return function (entities) { entities[entity_num].entityObj.setPosture(rtiPosture) };
			}
			else
			{
				var animationType = animationTypeMap[animation];
				if (animationType)
				{
					//not sure if this is a posture or an action
					return function (entities) { /*entities[entity_num].entityObj.executeAction(animationType)*/ };
				}
			}
		}
		
		return function () { print("Error: Unsupported animation : " + animation); };
	}

	function parseScriptedMMLScript(script)
	{
		var words = script.split(" ");
		if (words.length > 1)
		{
			var entity_num = parseInt(words[0]);
			var ApplyInput = words[1];
			
			if (entity_num > -1)
			{
				if (words[1] == "ApplyInput")
				{
					return parseApplyInputScript(entity_num, words[2], words[3]);
				}
				else if (words[1] == "SelectAnimationName")
				{
					return parseSelectAnimationNameScript(entity_num, words[2]);
				}
				else if (words[1] == "SelectAnimationType")
				{
					return parseSelectAnimationNameScript(entity_num, words[2]);
				}
				else if (words[1] == "AdjustHeightAboveTerrain")
				{
					var height = parseFloat(words[2]) * -1.0;
					return function (entities) { entities[entity_num].entityObj.setZOffset(height); }
				}
			}
		}
		
		return function () { print("Error: Unsupported ScriptedMML Model script : " + script); };
	}


	function parseStaticModelScript(script)
	{
		var words = script.split(" ");
		if (words.length > 0)
		{
			if (words[0] == "Transition")
			{
				return parseTransitionScript(words[1], words[2]);
			}
		}
		
		return function () { print("Error: Unsupported ScriptedMML Model script : " + script); };
	}
	
	function parseWaitScript(script)
	{
		var duration = parseInt(script);
		
		print("adding a delay to script of : " + duration + " seconds");
		
		return function(entities, event)
		{
			this.activeEvents[event] = this.activeEvents[event] || [];
			this.activeEvents[event].push(new Delay(duration));
		};
	}
	
	function parseBeginAdjustOnOwnshipScript(script)
	{
		var words = script.split(" ");
		if (words.length > 3)
		{
			var target_num = parseInt(words[0]);
			var affect_num = parseInt(words[1]);
			var min_factor = parseInt(words[2]);
			var max_factor = parseInt(words[3]);
			
			if ((target_num > -1) && (affect_num > -1))
			{
				return function (entities)
				{
					entities[affect_num].matchSpeedEntityNum = target_num;
					entities[affect_num].matchSpeedMin = min_factor;
					entities[affect_num].matchSpeedMax = max_factor;
				}
			}
		}
			
		return function () { print("Error with BeginAdjustOnOwnship script : " + script); };
	}
	
	function parseStopAdjustOnOwnshipScript(script)
	{
		var affect_num = parseInt(script);
		if (affect_num > -1)
		{
			return function (entities)
			{
				delete entities[affect_num].matchSpeedEntityNum;
				delete entities[affect_num].matchSpeedMin;
				delete entities[affect_num].matchSpeedMax;
			}
		}
		
		return function () { print("Error with StopAdjustOnOwnship script : " + script); };
	}
	
	
	function parseEdeSystemScript(script)
	{
		var beginAdjustOnOwnship = stringUtil.removePrefix("BeginAdjustOnOwnship ", script);
		if (beginAdjustOnOwnship != script)
		{
			return parseBeginAdjustOnOwnshipScript(beginAdjustOnOwnship);
		}
		
		var stopAdjustOnOwnship = stringUtil.removePrefix("StopAdjustOnOwnship ", script);
		if (stopAdjustOnOwnship != script)
		{
			return parseStopAdjustOnOwnshipScript(stopAdjustOnOwnship);
		}
		
		return function () { print("Error: Unsupported EdeSystem script : " + script); };
	}
	
	function BusStopPassenger(profile, entity, action, index, dest, path, door)
	{
		var p = new Passenger("BusStopPassenger");
		
		p.m_entity = entity;
		p.m_subjectProfile = profile;
		p.m_action = action;
		p.m_dest = dest;
		p.m_path = path;
		p.m_door = door;
		p.m_index = index;
		
		p.setRecycle(false);
		p.setStartTime(0);
		p.enable();
		
		Scenario.passengerStopManeuvers = Scenario.passengerStopManeuvers || [];
		Scenario.passengerStopManeuvers.push(p);
	}
	
	var pedIndex = 0;
	
	function resetPedIndex() { pedIndex = 0; }
	
	function parseBusPedContainer(bus_num, actor_num, action, location)
	{
		return function (entities) {
			var profileName = entities[bus_num].name;
			var entity = entities[actor_num].entityObj;
			
			BusStopPassenger(profileName, entity, action, pedIndex++, location);
		}
	}
	
	function parseBusStartFightContainer(bus_num, actor_num, actor_num2)
	{
		return function (entities) {
			var profileName = entities[bus_num].name;
			var entity = entities[actor_num].entityObj;
			var entity2 = entities[actor_num2].entityObj;
			
			BusStopPassenger(profileName, entity, "StartFight", 0);
			BusStopPassenger(profileName, entity2, "StartFight", 1);
		}
	}
	
	function parseBusStopFightContainer(bus_num, actor_num)
	{
		return function (entities) {
			var profileName = entities[bus_num].name;
			var entity = entities[actor_num].entityObj;
			
			if (entity.m_dest == "Fall")
			{
				entity.executeAction("stand_up");
				entity.setPosture("stand_walk_run");
				entities[actor_num].entityObj.m_dest = "Stand1";
			}
			else
			{
				BusStopPassenger(profileName, entity, "StopFight");
			}
		}
	}
	
	function parseScriptedSE(script)
	{
		//Entity 2 Manage PedestrianManager
		//Entity 0 BusPedContainer GetOn 2 Stand1
		
		//Entity 0 BusPedContainer GetOff 6
		//Entity 0 BusPedContainer Fight 1 1
		//Entity 1 ActionManager ClearAllActions
		
		var entity = stringUtil.removePrefix("Entity ", script);
		if (entity != script)
		{
			var words = script.split(" ");
			if (words.length == 4)
			{
				if (words[3] == "ClearAllActions")
				{
					var actor_num = parseInt(words[1]);
					return parseBusStopFightContainer(0, actor_num);
				}
				
				var actor_num = parseInt(words[0]);
				return function () {};  //do nothing
			}
			else if (words.length == 5)
			{
				var bus_num = parseInt(words[1]);
				var actor_num = parseInt(words[4]);
				return parseBusPedContainer(bus_num, actor_num, words[3]);
			}
			else if (words.length == 6)
			{
				var bus_num = parseInt(words[1]);
				var actor_num = parseInt(words[4]);
				
				if (words[3] == "Fight")
				{
					var actor_num2 = parseInt(words[5])
					return parseBusStartFightContainer(bus_num, actor_num, actor_num2);
				}
				else
				{			
					return parseBusPedContainer(bus_num, actor_num, words[3], words[5]);
				}
			}
		}
		
		return function () { print("Error: Unsupported script : " + script); };
	}
	
	function parseSetEnvironment(script)
	{
		//tod 8
		var words = script.split(" ");
		if (words.length == 2)
		{
			if (words[0] == "tod")
			{
				var time = parseInt(words[1]);
				var tod;
				switch (time)
				{
				case 0: tod = 1915; break; //DUSK - 7:15 PM
				case 1: tod = 0000; break; //MIDNIGHT - 12:00 AM
				case 2: tod = 1200; break; //NOON - 12:00PM
				case 3: tod = 1300; break; //AFTERNOON - 1:00 PM
				case 4: tod = 1600; break; //LATE_AFTERNOON - 3:00 PM
				case 5: tod = 1700; break; //EVENING - 5:00 PM
				case 6: tod = 1845; break; //SUNSET - 6:45 PM
				case 7: tod = 1900; break; //TWILIGHT - 7:00 PM
				case 8: tod = 2100; break; //EARLYNIGHT - 9:00 PM
				case 9: tod = 2200; break; //NIGHT - 10:00 PM
				}
				
				var slewTime = 1.0;
		
				return function() { Environment.setTimeOfDay(RAMP, tod, slewTime); };
			}
		}
		
	}

	function parseScript(script)
	{
		var ScriptedMMLModelAV = stringUtil.removePrefix("ScriptedMML Model AV ", script);
		if (ScriptedMMLModelAV != script)
		{
			return parseScriptedMMLScript(ScriptedMMLModelAV);
		}
		
		var ScriptedMMLModelPED = stringUtil.removePrefix("ScriptedMML Model PED ", script);
		if (ScriptedMMLModelPED != script)
		{
			return parseScriptedMMLScript(ScriptedMMLModelPED);
		}
		
		var trafficLights = stringUtil.removePrefix("trafficLights ", script);
		if (trafficLights != script)
		{
			return parseTrafficLightsScript(trafficLights);
		}
		
		var staticModelLib = stringUtil.removePrefix("StaticModelLib ", script);
		if (staticModelLib != script)
		{
			return parseStaticModelScript(staticModelLib);
		}
		
		var wait = stringUtil.removePrefix("Wait ", script);
		if (wait != script)
		{
			return parseWaitScript(wait);
		}
		
		var edeSystem = stringUtil.removePrefix("edeSystem ", script);
		if (edeSystem != script)
		{
			return parseEdeSystemScript(edeSystem);
		}
		
		var scriptedSE = stringUtil.removePrefix("ScriptedSE ", script)
		if (scriptedSE != script)
		{
			return parseScriptedSE(scriptedSE);
		}
		
		var setEnvironment = stringUtil.removePrefix("SetEnvironment ", script)
		if (setEnvironment != script)
		{
			return parseSetEnvironment(setEnvironment);
		}
		
		return function () { print("Error: Unsupported script : " + script); };
	}

	return function (scripts)
	{
		var events = [];
		
		events.push(resetPedIndex);
		
		for (var i in scripts)
		{
			var result = parseScript(stringUtil.trim(scripts[i]));
			if (result.constructor === Array)
			{
				events = events.concat(result);
			}
			else
			{
				events.push(result);
			}
		}
		
		return events;
	}
	
});