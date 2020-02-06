define(['require'], function (require) {

	var exports = {};
	
	function PrintDebug(msg)
	{
		if (simCreator.PrintDebugMessages != undefined)
		{
			if (simCreator.PrintDebugMessages != false)
			{
				print(msg);
			}
		}
	}

	function PlayAudioHelper(filename)
	{
		var path = "Sounds/";
		Audio.playSample(path + filename);
	}


	function GetAheadEnum()
	{
		if (Scenario.UsingSimVista != undefined)
		{
			return AHEAD;
		}
		else
		{
			return ROUTE_AHEAD;
		}
	}

	function GetLRVPos(compartment)
	{
		if (Scenario.UsingSimVista != undefined)
		{
			return simCreator.Dynamics.LinPos;
		}
		else
		{
			return GetLRV()["LinPos" + compartment];
		}
	}

	function GetLRVOri(compartment)
	{
		if (Scenario.UsingSimVista != undefined)
		{
			return simCreator.TM2Euler.EulerAngles;
		}
		else
		{
			return GetLRV()["Orientation" + compartment];
		}
	}

	function FaultAssessmentCue(type, msg)
	{
		if (Scenario.UsingSimVista != undefined)
		{
			print(type + " : " + msg);
		}
		else
		{
			var script;

			script = "Tec.AddAssessmentCue('";
			script += type;
			script += "', 'Did the operator properly recover from the ";
			script += msg;
			script += "?');";
			Scenario.sendScriptToGUI( script );
		}
	}

	function EquipmentAssessmentCue(type, msg)
	{
		if (Scenario.UsingSimVista != undefined)
		{
			print(type + " : " + msg);
		}
		else
		{
			var script;

			script = "Tec.AddAssessmentCue('";
			script += type;
			script += "', 'Did the operator properly recover from the ";
			script += msg;
			script += "?');";
			Scenario.sendScriptToGUI( script );
		}
	}


	function GetTrainHeight()
	{
		return -0.5; //z is down
	}

	function GetVLC(sub)
	{
		return simCreator["VehicleLogic_" + sub];
	}

	function GetPed()
	{
		return simCreator["LoadLRV"];
	}

	function GetLRV()
	{
		return simCreator["SimpleLRV"];
	}

	function GetLRVMM()
	{
		return simCreator["MovingModelLRV"];
	}

	function GetMMDisabled()
	{
		return simCreator["MovingModelDisabled"];
	}

	function GetSimpleDistance()
	{
		return simCreator["Distance"];
	}

	function GetDisabledLRV()
	{
		return simCreator["DisabledLRV"];
	}

	function GetWago()
	{
		return GetVLC("Wago");
	}

	function GetFlashers(num)
	{
		return simCreator["VehicleLogic-FlasherState"][num];
	}

	function GetModuleLength(index)
	{
		//module length is numbered 1,2,3,4,5
		return simCreator.SimpleLRV_LRVKinematics["Length" + index][0];
	}

	function GetDNPState()
	{
		return GetVLC("DoNotPass").DoNotPassState[0];
	}


	function GetSideRoadDatum(icDatum, sideRoad, delta)
	{
		if (sideRoad != null)
		{
			var sideRoadHeadingError = GetHeadingError(sideRoad.getHeading(), Scenario.Subject.getHeading());
			
			//print("subject heading: " + Scenario.Subject.getHeading());
			//print("sideRoad getHeading: " + sideRoad.getHeading());
			//print("sideRoadHeadingError: " + sideRoadHeadingError);
			
			var dist = sideRoad.getDistance(icDatum);
			var length = sideRoad.getLength();
			
			var lateralDistance = Math.abs(sideRoad.getDatumAt(LANE, LANE_LEFTMOST).getRoadOffset());
			
			if (sideRoadHeadingError > 0.0)
			{
				//print("COMPLEX CASE!!!!!!");
				
				//coming out of the IC
				
				//see if the road start is to he left or the right of the ic
				
				var bearing = Scenario.Subject.getBearing(sideRoad);
				
				aheadDist = 0;
				if (bearing > 0)
				{
					//road start is adding to the resulting position, compensate by removing it
					aheadDist = Math.min(Math.max(delta - dist, 0.0), length);
				}
				else
				{
					//road distance is subtracting from the resulting position, compensate by adding it
					aheadDist = Math.min(delta + dist, length);
				}
				
				//print("distance to intersection is : " + dist);
				//print("sideRoad length is : " + sideRoad.getLength());
				
				//sideRoad is oriented away from intersection
				var datumAhead = sideRoad.getDatumAt(AHEAD, aheadDist).getDatumAt(LEFT, lateralDistance);
				datumAhead.setHeading(sideRoad.getHeading() + 180.0);
				return datumAhead;
			}
			else
			{
				//going into the IC
				
				//print("SIMPLE CASE!!!!!!");
				
				//print("distance to intersection is : " + dist);
				//print("sideRoad length is : " + sideRoad.getLength());
				
				var aheadDist = Math.min(Math.max(dist - delta, 0.0), length);
				
				//print("ahead distance : " + aheadDist);
				
				//sideRoad is oriented away from intersection
				var datumAhead = sideRoad.getDatumAt(AHEAD, aheadDist).getDatumAt(RIGHT, lateralDistance);
				return datumAhead;
			}
		}
		
		return null;
	}


	function ChangeSignal(phase, duration)
	{
		var signal = Scenario.Subject.getSignalIntersectionController();
		if (signal)
		{
			var direction = Scenario.Subject.getSignalDirection();
			
			//signal.setTransitPhase(direction, phase, duration);//"Transit"
			signal.setPhase(direction, phase, duration);//"Municipal"
		}
	}

	function GetSignalPhase()
	{
		var ic = Scenario.Subject.getSignalIntersectionController();
		if (ic)
		{
			var direction = Scenario.Subject.getSignalDirection();
			return ic.getPhase(direction);
		}
		
		return 0;
	}

	function updateLRV()
	{
		if (Scenario.tm != undefined)
		{
			Scenario.tm.update(200, Scenario.Subject.getSpeedLimit());
		}
	}

	function moveCamera(module)
	{
		//front looking at module A
		if (module == "A")
		{
			simCreator.Switch1.SigIn2[0] = 10;
			simCreator.Switch1.SigIn2[1] = 9;
			simCreator.Switch1.SigIn2[2] = -2; 
			
			simCreator.Switch2.SigIn2[0] = 0;
			simCreator.Switch2.SigIn2[1] = 0;
			simCreator.Switch2.SigIn2[2] = -140 * Math.PI / 180.0;
		}
		
		if (module == "-A")
		{
			simCreator.Switch1.SigIn2[0] = 10;
			simCreator.Switch1.SigIn2[1] = -9;
			simCreator.Switch1.SigIn2[2] = -2; 
			
			simCreator.Switch2.SigIn2[0] = 0;
			simCreator.Switch2.SigIn2[1] = 0;
			simCreator.Switch2.SigIn2[2] = 140 * Math.PI / 180.0;
		}
		
		//front looking at module D
		if (module == "D")
		{
			simCreator.Switch1.SigIn2[0] = -2.5;
			simCreator.Switch1.SigIn2[1] = 9;
			simCreator.Switch1.SigIn2[2] = -2; 
			
			simCreator.Switch2.SigIn2[0] = 0;
			simCreator.Switch2.SigIn2[1] = 0;
			simCreator.Switch2.SigIn2[2] = -120 * Math.PI / 180.0;
		}
		
		//front looking at module E
		if (module == "E")
		{
			simCreator.Switch1.SigIn2[0] = -13;
			simCreator.Switch1.SigIn2[1] = 9;
			simCreator.Switch1.SigIn2[2] = -2; 
			
			simCreator.Switch2.SigIn2[0] = 0;
			simCreator.Switch2.SigIn2[1] = 0;
			simCreator.Switch2.SigIn2[2] = -120 * Math.PI / 180.0;
		}
		
		//module b
		if (module == "B")
		{
			simCreator.Switch1.SigIn2[0] = -18;
			simCreator.Switch1.SigIn2[1] = 9;
			simCreator.Switch1.SigIn2[2] = -2; 
			
			simCreator.Switch2.SigIn2[0] = 0;
			simCreator.Switch2.SigIn2[1] = 0;
			simCreator.Switch2.SigIn2[2] = -130 * Math.PI / 180.0;
		}
		
		if (module == "Front")
		{
			simCreator.Switch1.SigIn2[0] = 10;
			simCreator.Switch1.SigIn2[1] = 0;
			simCreator.Switch1.SigIn2[2] = -2; 
			
			simCreator.Switch2.SigIn2[0] = 0;
			simCreator.Switch2.SigIn2[1] = 0;
			simCreator.Switch2.SigIn2[2] = -180 * Math.PI / 180.0;
		}
		
		if (module == "Rear")
		{
			simCreator.Switch1.SigIn2[0] = -30;
			simCreator.Switch1.SigIn2[1] = 0;
			simCreator.Switch1.SigIn2[2] = -2; 
			
			simCreator.Switch2.SigIn2[0] = 0;
			simCreator.Switch2.SigIn2[1] = 0;
			simCreator.Switch2.SigIn2[2] = 0;
		}
		
		
		if (module == "Backwards")
		{
			simCreator.Switch1.SigIn2[0] = -30;
			simCreator.Switch1.SigIn2[1] = 0;
			simCreator.Switch1.SigIn2[2] = -2; 
			
			simCreator.Switch2.SigIn2[0] = 0;
			simCreator.Switch2.SigIn2[1] = 0;
			simCreator.Switch2.SigIn2[2] = -180 * Math.PI / 180.0;
		}
		
		
		if (module == "Up")
		{
			simCreator.Switch1.SigIn2[0] = 0;
			simCreator.Switch1.SigIn2[1] = 0;
			simCreator.Switch1.SigIn2[2] = -4000; 
			
			simCreator.Switch2.SigIn2[0] = 0;
			simCreator.Switch2.SigIn2[1] = -90 * Math.PI / 180.0;
			simCreator.Switch2.SigIn2[2] = 0;
		}
		
	}

	function setPassMass( mass )
	{
		
		if (mass == "W1")
		{
			simCreator.PassengerMass.Switch[0] = 1;
			simCreator.PassengerMass.SigIn2[0] = 0.0;
		}
		
		if (mass == "W2")
		{
			simCreator.PassengerMass.Switch[0] = 1;
			simCreator.PassengerMass.SigIn2[0] = 4690.0;
		}
		
		if (mass == "W3")
		{
			simCreator.PassengerMass.Switch[0] = 1;
			simCreator.PassengerMass.SigIn2[0] = 12060.0;
		}
		
		if (mass == "W4")
		{
			simCreator.PassengerMass.Switch[0] = 1;
			simCreator.PassengerMass.SigIn2[0] = 13090.0;
		}
		
		if (mass == "W5")
		{
			simCreator.PassengerMass.Switch[0] = 1;
			simCreator.PassengerMass.SigIn2[0] = 17580.0;
		}
		
		if (mass == "Default")
		{
			simCreator.PassengerMass.Switch[0] = 0;
			simCreator.PassengerMass.SigIn2[0] = 0.0;
		}
		
	}

	//compute the lateral distance
	function ComputeLateralDist(toDatum, fromDatum, heading)
	{
		var headingR = (90 - heading + 90) * Math.PI / 180; //heading in radians

		var x = Math.cos(headingR);
		var y = Math.sin(headingR);

		var a = toDatum.getCoordinateX() - fromDatum.getCoordinateX();
		var b = toDatum.getCoordinateY() - fromDatum.getCoordinateY();

		return a * x + b * y;
	}


	function GetHeadingError(h1, h2)
	{
		var headingError = h1 - h2;
		
		if (headingError > 360.0) headingError -= 360.0;
		if (headingError < -360.0) headingError += 360.0;
		
		if (headingError > 180.0) headingError -= 360.0;
		if (headingError < -180.0) headingError += 360.0;
		
		//returns a value from -180 to 180
		return headingError;
	}


	function GetRandomProfile(databaseName, profileSetName)
	{
		var profile = null;
		
		if (profileSetName == undefined)
		{
			var profileSet = Scenario.getEntityProfileSet(databaseName, "AmbTraffic");
			if (profileSet == null)
			{
				Report(MSG_WARNING, "GetRandomProfile Error: EntityProfileSet named " + databaseName + ":AmbTraffic does not exist!");
				return "";
			}
			profile = profileSet.getProfile();
		}
		else
		{
			var profileSet = Scenario.getEntityProfileSet(databaseName, profileSetName);
			if (profileSet == null)
			{
				Report(MSG_WARNING, "GetRandomProfile Error: EntityProfileSet named " + databaseName + ":" + profileSetName + " does not exist!");
				return "";
			}
			profile = profileSet.getProfile();
		}
		
		if (profile)
		{
			return profile.getName();
		}
		else
		{
			return "";
		}
	}


	function SortString(a, b)
	{
		var nameA=a.toLowerCase();
		var nameB=b.toLowerCase();
		
		if (nameA < nameB) return -1;
		if (nameA > nameB) return 1;
		
		return 0;
	}


	function SortName(a, b)
	{
		var nameA=a.getName().toLowerCase();
		var nameB=b.getName().toLowerCase();
		
		if (nameA < nameB) return -1;
		if (nameA > nameB) return 1;
		
		return 0;
	}

	function GetFrontDNPEntity(train)
	{
		var distAhead = 3.0;
		var front = GetPosition(train) + distAhead;
		var currentRoad = train.getRoad();
		
		if (currentRoad != null)
		{
			front = Math.min(front, GetRoadEnd(currentRoad));
		}
		
		front = Math.min(front, Scenario.getRouteLength());
		
		var dnpEntity = CreateObject("Barrier", train.getDatumAt(AHEAD, front - GetPosition(train)));
		dnpEntity.move(dnpEntity.getDatumAt(RIGHT, Math.abs(train.getRoadOffset() * 2.0)));
		dnpEntity.setVisible(false);
		dnpEntity.setTrafficResponse(true);
		
		return dnpEntity;
	}

	function GetBackDNPEntity(train)
	{
		var trainLength = 10.0;
		if (train.getProfile().getName() == "LRV")
		{
			trainLength = 30.0;
		}
		
		var back = GetPosition(train) - trainLength;
		var currentRoad = train.getRoad();
		
		if (currentRoad != null)
		{
			back = Math.max(back, GetRoadStart(currentRoad));
		}
		
		back = Math.max(back, 0.0);
		
		var dnpEntity = CreateObject("Barrier", train.getDatumAt(AHEAD, back - GetPosition(train)));
		dnpEntity.move(dnpEntity.getDatumAt(RIGHT, Math.abs(train.getRoadOffset() * 2.0)));
		dnpEntity.setVisible(false);
		dnpEntity.setTrafficResponse(true);
		
		return dnpEntity;
	}

	function PlaceBarriers(entity)
	{
		RemoveBarriers(entity);
		
		entity.frontBarrier = GetFrontDNPEntity(entity);
		entity.backBarrier = GetBackDNPEntity(entity);
	}

	function RemoveBarriers(entity)
	{
		if (entity.frontBarrier != undefined)
		{
			entity.frontBarrier.setTrafficResponse(false);
			DestroyEntity(entity.frontBarrier);
			entity.frontBarrier = undefined;
		}
		
		if (entity.backBarrier != undefined)
		{
			entity.backBarrier.setTrafficResponse(false);
			DestroyEntity(entity.backBarrier);
			entity.backBarrier = undefined;
		}
	}

	function DestroyPath(path)
	{
		if (path != undefined)
		{
			if (path != null)
			{
				var entities = path.getEntities();
				if (entities != null)
				{
					for (var i in entities) DestroyEntity(entities[i]);
				}
				
				var targets = path.getTargets();
				if (targets != null)
				{
					for (var i in targets) targets[i].move(0, 0, 0, 0, 0, 0);
				}
				
				delete path;
			}
		}
	}

	return exports;

});