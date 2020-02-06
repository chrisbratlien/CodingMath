define(['require', 'utils/simCreator','utils/followTarget', 'utils/profile', 'utils/vehicleLogic'], function (require, simCreatorUtils, followTarget, profileUtils, vehicleLogic) {
	

	vehicleLogic.setMachineState("numOccupants", 0);
	
	function turnToFace(prevTarget, nextTarget)
	{
		this.setHeading(this.getHeading() + this.getBearing(nextTarget));
		this.follow(nextTarget);
	}
	
	function justFollow(prevTarget, nextTarget)
	{
		this.follow(nextTarget);
	}
	
	function detachFollow(prevTarget, nextTarget)
	{
		var distRight = Scenario.Subject.getDistanceRight(prevTarget);
		var distForward = Scenario.Subject.getDistanceForward(prevTarget);
		var distUp = this.getCoordinateZ();
		
		this.detach();
		
		this.move(Scenario.Subject);
		this.move(RIGHT, distRight);
		this.move(FORWARD, distForward);
		this.setZOffset(distUp * -1.0);
		this.setHeading(this.getHeading() + this.getBearing(nextTarget));
		
		this.follow(nextTarget);
	}
	
	function attachSubject(prevTarget, nextTarget)
	{
		var distRight = Scenario.Subject.getDistanceRight(prevTarget);
		var distForward = Scenario.Subject.getDistanceForward(prevTarget);
		var distUp = this.getCoordinateZ() - Scenario.Subject.getCoordinateZ();
		var diffH = this.getHeading() - Scenario.Subject.getHeading();
		
		this.attach(Scenario.Subject);
		
		this.move(RIGHT, distRight);
		this.move(FORWARD, distForward);
		this.move(UP, distUp);
		this.setHeading(diffH);
	}
	
	function updateHeight(prevTarget, nextTarget)
	{
		var targetZ = prevTarget.getCoordinateZ();
		if (prevTarget.hasParent())
		{
			targetZ += Scenario.Subject.getCoordinateZ();
		}
		
		var actorZ = this.getCoordinateZ() + Scenario.Subject.getCoordinateZ();
		
		var distUp = targetZ - actorZ;
		
		this.move(UP, distUp);
	}
	
	function slowWalk(prevTarget, nextTarget)
	{
		//wait for the entity to stand up before moving
		if (this.m_waitTime)
		{
			if (Scenario.getTime() < this.m_waitTime)
			{
				return;
			}
			else
			{
				this.follow(nextTarget);
				delete this.m_waitTime;
			}
		}
		
		if (nextTarget)
		{
			var nextDist = this.getDistance2D(nextTarget);
			
			var maxSpeedLimit = 1;
			
			var decel = 1;
			var maxVel = Math.min(maxSpeedLimit, Math.sqrt(nextDist * 2 * decel));
						
			this.setVelocity(RAMP, maxVel, 0);
			
			var prevDist = this.getDistance2D(prevTarget);
			var percent = prevDist / (prevDist + nextDist);
			
			if ((percent > 0.99) || (nextDist < 0.1))
			{
				return true;
			}
		}
	}
	
	function calmWalk(prevTarget, nextTarget)
	{
		//wait for the entity to stand up before moving
		if (this.m_waitTime)
		{
			if (Scenario.getTime() < this.m_waitTime)
			{
				return;
			}
			else
			{
				this.follow(nextTarget);
				delete this.m_waitTime;
			}
		}
		
		if (nextTarget)
		{
			var nextDist = this.getDistance2D(nextTarget);
			
			var maxSpeedLimit = 2;
			
			var decel = 2;
			var maxVel = Math.min(maxSpeedLimit, Math.sqrt(nextDist * 2 * decel));
						
			this.setVelocity(RAMP, maxVel, 0);
			
			var prevDist = this.getDistance2D(prevTarget);
			var percent = prevDist / (prevDist + nextDist);
			
			if ((percent > 0.99) || (nextDist < 0.2))
			{
				return true;
			}
		}
	}
	
	function madRun(prevTarget, nextTarget)
	{
		if (nextTarget)
		{
			var nextDist = this.getDistance2D(nextTarget);
			
			var maxSpeedLimit = 8;
			
			var decel = 2;
			var maxVel = Math.min(maxSpeedLimit, Math.sqrt(nextDist * 2 * decel));
			
			this.setVelocity(RAMP, maxVel, 0);
			
			var prevDist = this.getDistance2D(prevTarget);
			var percent = prevDist / (prevDist + nextDist);
			
			if ((percent > 0.99) || (nextDist < 0.1))
			{
				return true;
			}
		}
	}
	
	function stop(lastTarget)
	{
		this.unfollow();
		this.setVelocity(RAMP, 0, 0);			
		
		this.detach();
		
		this.move(lastTarget);
	}
	
	function stopToFace(lastTarget)
	{
		this.unfollow();
		this.setVelocity(RAMP, 0, 0);			
		
		this.detach();
		
		this.move(lastTarget);
		this.follow(Scenario.Subject);
	}
	
	function sitDown(prevTarget)
	{
		this.unfollow();
		this.setVelocity(RAMP, 0, 0);
		
		this.attach(Scenario.Subject);
		
		this.move(RIGHT, Scenario.Subject.getDistanceRight(prevTarget));
		this.move(FORWARD, Scenario.Subject.getDistanceForward(prevTarget));
		this.move(UP, prevTarget.getCoordinateZ());
		this.setHeading(prevTarget.getHeading() - Scenario.Subject.getHeading());
		
		this.executeAction("sit_down");
		this.setPosture("sit_sit_sit");
	}
	
	function stand(prevTarget)
	{
		this.unfollow();
		this.setVelocity(RAMP, 0, 0);
		
		this.attach(Scenario.Subject);
		
		this.move(RIGHT, Scenario.Subject.getDistanceRight(prevTarget));
		this.move(FORWARD, Scenario.Subject.getDistanceForward(prevTarget));
		this.move(UP, prevTarget.getCoordinateZ());
		this.setHeading(prevTarget.getHeading() - Scenario.Subject.getHeading());
	}
	
	function fight1(prevTarget)
	{
		this.unfollow();
		this.setVelocity(RAMP, 0, 0);
		
		this.attach(Scenario.Subject);
		
		this.move(RIGHT, Scenario.Subject.getDistanceRight(prevTarget));
		this.move(FORWARD, Scenario.Subject.getDistanceForward(prevTarget));
		this.move(UP, prevTarget.getCoordinateZ());
		this.setHeading(prevTarget.getHeading() - Scenario.Subject.getHeading());
		
		this.executeAction("bring_it_on");
		
		//start fight sound
		
		var audio = simCreatorUtil.getComponent("Audio");
		if (audio)
		{
			if (audio.FightOnBus)
			{
				audio.FightOnBus[0] = 1;
			}
		}
	}
	
	function fight2(prevTarget)
	{
		this.unfollow();
		this.setVelocity(RAMP, 0, 0);
		
		this.attach(Scenario.Subject);
		
		this.move(RIGHT, Scenario.Subject.getDistanceRight(prevTarget));
		this.move(FORWARD, Scenario.Subject.getDistanceForward(prevTarget));
		this.move(UP, prevTarget.getCoordinateZ());
		this.setHeading(prevTarget.getHeading() - Scenario.Subject.getHeading());
		
		this.executeAction("fight");
	}
	
	function standUp(prevTarget, nextTarget)
	{
		this.executeAction("stand_up");
		this.setPosture("stand_walk_run");
		
		this.m_waitTime = Scenario.getTime() + 1;
	}
	
	Scenario.createManeuverType("Passenger");
	
	
	function getDatum(point, attached)
	{
		var datum = new Scenario.SpatialDatum("Passenger Datum");

		if (attached)
		{
			datum.attach(Scenario.Subject);
		}
		else
		{
			datum.move(Scenario.Subject);
		}
		
		datum.move(RIGHT, point[0]);
		datum.move(FORWARD, point[1]);
		datum.move(UP, point[2]);
		datum.setHeading(point[3]);
		
		return datum;
	}
	
	function getOnDoorTarget(profileName, door, index)
	{
		var subjectProfile = profileUtils.getProfile(profileName);
		if (subjectProfile)
		{
			var doorPoint = subjectProfile.getAttachedPoint(door);
			if (doorPoint)
			{
				doorPoint[0] += (0.5 + 1 * index);
				
				return getDatum(doorPoint, true);
			}
			else
			{
				print("Passenger Error - door target " + door + " does not exist in profile " + profileName);
				return;
			}
		}
		else
		{
			print("profileUtils Error : Unable to find profile : " + profileName);
		}
	}
	
	function getOnDestTargets(profileName, door, path, dest)
	{
		var subjectProfile = profileUtils.getProfile(profileName);
		if (subjectProfile)
		{
			var doorPoint = subjectProfile.getAttachedPoint(door);
			if (!doorPoint)
			{
				print("Passenger Error - door target " + door + " does not exist in profile " + profileName);
				return;
			}
			
			var pathPoints = subjectProfile.getModelPath(path);
			if (!pathPoints)
			{
				print("Passenger Error - model path " + path + " does not exist in profile " + profileName);
				return;
			}
			
			var destPoint = subjectProfile.getAttachedPoint(dest)
			if (!destPoint)
			{
				print("Passenger Error - dest target " + dest + " does not exist in profile " + profileName);
				return;
			}
			
			var targets = [];
			
			doorPoint[2] = 0;
			targets.push(getDatum(doorPoint, true));
			
			for (var i in pathPoints)
			{
				targets.push(getDatum(pathPoints[i], true));
			}
			
			targets.push(getDatum(destPoint, true));
			
			return targets;
		}
		else
		{
			print("profileUtils Error : Unable to find profile : " + profileName);
		}
	}
	
	function getOnFightTargets(profileName, door, path, dest, index)
	{
		var subjectProfile = profileUtils.getProfile(profileName);
		if (subjectProfile)
		{
			var doorPoint = subjectProfile.getAttachedPoint(door);
			if (!doorPoint)
			{
				print("Passenger Error - door target " + door + " does not exist in profile " + profileName);
				return;
			}
			
			var pathPoints = subjectProfile.getModelPath(path);
			if (!pathPoints)
			{
				print("Passenger Error - model path " + path + " does not exist in profile " + profileName);
				return;
			}
			
			var destPoint = subjectProfile.getAttachedPoint(dest)
			if (!destPoint)
			{
				print("Passenger Error - dest target " + dest + " does not exist in profile " + profileName);
				return;
			}
			
			var targets = [];
			
			//doorPoint[2] = 0;
			targets.push(getDatum(doorPoint, true));
			
			for (var i in pathPoints)
			{
				targets.push(getDatum(pathPoints[i], true));
			}
			
			if (index == 0)
			{
				destPoint[3] = 90;
			}
			else
			{
				destPoint[3] = -90;
			}
			
			targets.push(getDatum(destPoint, true));
			
			return targets;
		}
		else
		{
			print("profileUtils Error : Unable to find profile : " + profileName);
		}
	}
	
	function getOffFightTargets(profileName, door, path, dest, index)
	{
		var subjectProfile = profileUtils.getProfile(profileName);
		if (subjectProfile)
		{
			var doorPoint = subjectProfile.getAttachedPoint(door);
			if (!doorPoint)
			{
				print("Passenger Error - door target " + door + " does not exist in profile " + profileName);
				return;
			}
			
			var pathPoints = subjectProfile.getModelPath(path);
			if (!pathPoints)
			{
				print("Passenger Error - model path " + path + " does not exist in profile " + profileName);
				return;
			}
			
			var destPoint = subjectProfile.getAttachedPoint(dest)
			if (!destPoint)
			{
				print("Passenger Error - dest target " + dest + " does not exist in profile " + profileName);
				return;
			}
			
			var targets = [];
			
			if (index == 0)
			{
				targets.push(getDatum(doorPoint, true));
			}
			else
			{
				targets.push(getDatum(doorPoint, true));
				
				for (var i in pathPoints)
				{
					targets.push(getDatum(pathPoints[i], true));
				}
				
				targets.push(getDatum(destPoint, true));
			}
			
			return targets;
		}
		else
		{
			print("profileUtils Error : Unable to find profile : " + profileName);
		}
	}
	
	function getOffDoorTargets(profileName, door, dest, index)
	{
		var subjectProfile = profileUtils.getProfile(profileName);
		if (subjectProfile)
		{
			var doorPoint = subjectProfile.getAttachedPoint(door);
			if (!doorPoint)
			{
				print("Passenger Error - door target " + door + " does not exist in profile " + profileName);
				return;
			}
			
			var destPoint = subjectProfile.getAttachedPoint(dest);
			if (!destPoint)
			{
				print("Passenger Error - dest target " + dest + " does not exist in profile " + profileName);
				return;
			}
			
			//doorPoint[2] = 0.348142;
			var doorDatum = getDatum(doorPoint, true);
			
			destPoint[1] += (0.5 + index);
			var destDatum = getDatum(destPoint, false);
			
			return [doorDatum, destDatum];
		}
		else
		{
			print("profileUtils Error : Unable to find profile : " + profileName);
		}
	}

	function getOffDestTargets(profileName, path, index)
	{
		var subjectProfile = profileUtils.getProfile(profileName);
		if (subjectProfile)
		{
			var pathPoints = subjectProfile.getModelPath(path);
			if (!pathPoints)
			{
				print("Passenger Error - model path " + path + " does not exist in profile " + profileName);
				return;
			}
			
			var targets = [];
			
			if (pathPoints.length > 2)
			{
				pathPoints[pathPoints.length - 2][0] = pathPoints[pathPoints.length - 3][0];
				
				pathPoints[pathPoints.length - 2][2] = pathPoints[pathPoints.length - 3][2];
				pathPoints[pathPoints.length - 1][2] = pathPoints[pathPoints.length - 2][2];
			}
			else if (pathPoints.length > 1)
			{
				pathPoints[pathPoints.length - 1][2] = pathPoints[pathPoints.length - 2][2];
			}

			if (pathPoints.length > 0)
			{
				pathPoints[pathPoints.length - 1][0] -= (0.3 + 0.4 * index);
				pathPoints[pathPoints.length - 1][3] = 90;
			}
			
			for (var i in pathPoints)
			{
				targets.push(getDatum(pathPoints[i], true));
			}
			
			return targets;
		}
		else
		{
			print("profileUtils Error : Unable to find profile : " + profileName);
		}
	}
	
	Passenger.prototype.onInitialize = function()
	{
		print("new Passenger called");
	}
		
	Passenger.prototype.onEnter = function()
	{
		if (this.m_action === undefined)
		{
			print("m_action is : " + this.m_action);
			this.leave();
			return;
		}
		
		if (this.m_entity === undefined)
		{
			print("m_entity is : " + this.m_entity);
			this.leave();
			return;
		}
		
		//action looks like : 
		
		//GetOn Dest2
		//GetOn 0 Wheelchair
		//GetOn 0 Stand1
		//Fight 0 0
		//GetOff 0
		//PlayAnimation ACT_WAVE
		
		//EntranceToWheelchair
		//
		
		if (this.m_action == "GetOn")
		{
			if (this.m_door === undefined)
			{
				this.m_door = "EntranceDoor";
			}
			
			if (this.m_path === undefined)
			{
				if (this.m_dest)
				{
					this.m_path = "EntranceTo" + this.m_dest;
				}
			}
			
			//make two so we can use one later
			this.m_doorTarget = getOnDoorTarget(this.m_subjectProfile, this.m_door, this.m_index);
			this.ROOTtargets = getOnDoorTarget(this.m_subjectProfile, this.m_door, this.m_index);
			
			this.m_entity.setHeading(this.m_entity.getHeading() + this.m_entity.getBearing(this.m_doorTarget));
			this.m_entity.follow(this.m_doorTarget);
			
			this.setCurrentState("waitForBusToArrive");
		}
		else if (this.m_action == "GetOff")
		{
			vehicleLogic.setMachineState("StopRequested", true);
			
			if (this.m_door === undefined)
			{
				this.m_door = "ExitDoor";
			}
			
			if (this.m_path === undefined)
			{
				if (this.m_entity.m_dest)
				{
					this.m_path = this.m_entity.m_dest + "ToExit";
				}
				else
				{
					print("entity is not on a vehicle, skipping this action");
					this.leave();
					return;
				}
			}
			
			if (this.m_dest === undefined)
			{
				this.m_dest = "AwayFromBus";
			}
			
			this.ROOTtargets = getOffDestTargets(this.m_subjectProfile, this.m_path, this.m_index);
			
			if (this.m_path.indexOf("Seat") > -1)
			{
				this.switchTraversal("Walk To " + this.m_door, this.m_entity, standUp, updateHeight, slowWalk, stand, this.ROOTtargets);
			}
			else
			{
				this.switchTraversal("Walk To " + this.m_door, this.m_entity, turnToFace, updateHeight, slowWalk, stand, this.ROOTtargets);
			}
			
			this.setCurrentState("waitToArriveAtExitDoor");
		}
		else if (this.m_action == "StartFight")
		{
			if (this.m_dest === undefined)
			{
				if (this.m_index !== undefined)
				{
					if (this.m_index == 0)
					{
						this.m_dest = "Fight1";
					}
					else
					{
						this.m_dest = "Fight2";
					}
				}
			}
			
			if (this.m_path === undefined)
			{
				if (this.m_entity.m_dest)
				{
					this.m_path = this.m_entity.m_dest + "To" + this.m_dest;
				}
			}
			
			//this.m_dest is either "Fight1" or "Fight2";
			this.ROOTtargets = getOnFightTargets(this.m_subjectProfile, this.m_entity.m_dest, this.m_path, this.m_dest, this.m_index);
			
			if (this.m_path.indexOf("Seat") > -1)
			{
				if (this.m_index == 0)
				{
					this.switchTraversal("Start " + this.m_dest, this.m_entity, standUp, updateHeight, slowWalk, fight1, this.ROOTtargets);
				}
				else
				{
					this.switchTraversal("Start " + this.m_dest, this.m_entity, standUp, updateHeight, slowWalk, fight2, this.ROOTtargets);
				}
			}
			else
			{
				if (this.m_index == 0)
				{
					this.switchTraversal("Start " + this.m_dest, this.m_entity, turnToFace, updateHeight, slowWalk, fight1, this.ROOTtargets);
				}
				else
				{
					this.switchTraversal("Start " + this.m_dest, this.m_entity, turnToFace, updateHeight, slowWalk, fight2, this.ROOTtargets);
				}
			}
			
			this.setCurrentState("waitToArrive");
		}
		else if (this.m_action == "StopFight")
		{
		
			//stop fight sound

			var audio = simCreatorUtil.getComponent("Audio");
			if (audio)
			{
				if (audio.FightOnBus)
				{
					audio.FightOnBus[0] = 0;
				}
			}
		
			if (this.m_dest === undefined)
			{
				if (this.m_entity.m_dest !== undefined)
				{
					if (this.m_entity.m_dest == "Fight1")
					{
						this.m_dest = "Fight1";
						if (this.m_path === undefined)
						{
							this.m_path = this.m_entity.m_dest + "ToExit";
						}
					}
					else
					{
						this.m_dest = "FightSeat";
						if (this.m_path === undefined)
						{
							this.m_path = this.m_entity.m_dest + "To" + this.m_dest;
						}
					}
				}
			}
			
			
			
			this.ROOTtargets = getOffFightTargets(this.m_subjectProfile, this.m_entity.m_dest, this.m_path, this.m_dest, this.m_index);
			
			if (this.m_path.indexOf("Seat") > -1)
			{
				this.switchTraversal("Stop " + this.m_entity.m_dest, this.m_entity, turnToFace, updateHeight, slowWalk, sitDown, this.ROOTtargets);
			}
			else
			{
				stand.apply(this.m_entity, [this.ROOTtargets[0]]);
				this.m_entity.m_dest = this.m_dest;
				this.leave();
			}
			
			this.setCurrentState("waitToArrive");
		}
	}
	
	Passenger.prototype.switchTraversal = function(name, entity, startCB, startWaypointCB, updateCB, endCB, targets)
	{
		if (this.currentTraversal)
		{
			if (this.currentTraversal.active)
			{
				this.currentTraversal.leave();
				this.currentTraversal.destroy();
			}
		}
		
		this.currentTraversal = new FollowTarget(name);

		this.currentTraversal.m_entity = entity;
		this.currentTraversal.startPathCB = startCB;
		this.currentTraversal.startWaypointCB = startWaypointCB;
		this.currentTraversal.updateWaypointCB = updateCB;
		this.currentTraversal.endPathCB = endCB;
		
		this.currentTraversal.m_targets = targets;			
		
		this.currentTraversal.setRecycle(false);
		this.currentTraversal.setStartTime(0);
		this.currentTraversal.enable();
	}
	
	Passenger.prototype.onActivate = function()
	{

	}
	
	Passenger.prototype.waitForBusToArrive = function()
	{
		if (this.m_doorTarget.getDistance2D(this.m_entity) < 20 && (Math.abs(Scenario.Subject.getVelocity()) < 1.0))
		{
			this.switchTraversal("Walk To " + this.m_door, this.m_entity, turnToFace, undefined, calmWalk, stop, this.ROOTtargets);
			this.setCurrentState("waitToArriveAtEntranceDoor");
		}
	}
	
	Passenger.prototype.waitToArriveAtEntranceDoor = function()
	{
		if ((this.currentTraversal.enabled == false) && (this.currentTraversal.active == false))
		{
			this.setCurrentState("waitForEntranceDoorToOpen");
		}
	}
	
	Passenger.prototype.waitToArriveAtExitDoor = function()
	{
		if ((this.currentTraversal.enabled == false) && (this.currentTraversal.active == false))
		{
			this.setCurrentState("waitForExitDoorToOpen");
		}
	}
	
	Passenger.prototype.waitForEntranceDoorToOpen = function()
	{
		if (vehicleLogic.getMachineState("EntranceDoor") == "Open" && (this.m_entity.getProfile().getName().indexOf("heelchair") < 0 || vehicleLogic.getMachineState("Ramp") == "Down"))
		{
			this.ROOTtargets3 = getOnDestTargets(this.m_subjectProfile, this.m_door, this.m_path, this.m_dest);
			
			this.m_entity.setHeading(this.m_entity.getHeading() + this.m_entity.getBearing(this.ROOTtargets3[0]));
			this.m_entity.follow(this.ROOTtargets3[0]);
			
			if (this.m_dest.indexOf("Seat") > -1)
			{
				this.switchTraversal("Walk To Seat", this.m_entity, attachSubject, updateHeight, calmWalk, sitDown, this.ROOTtargets3);
			}
			else
			{
				this.switchTraversal("Walk To Stand", this.m_entity, attachSubject, updateHeight, calmWalk, stand, this.ROOTtargets3);
			}
			
			this.setCurrentState("waitToArrive");
		}
		
		//check speed and location of bus to see if ped should chase or be mad
		if (this.m_doorTarget.getDistance2D(this.m_entity) > 2)
		{
			this.switchTraversal("Run To EntranceDoor", this.m_entity, turnToFace, undefined, madRun, stop, this.m_doorTarget);
			
			this.m_entity.setHeading(this.m_entity.getHeading() + this.m_entity.getBearing(this.m_doorTarget));
			this.m_entity.follow(this.m_doorTarget);
			
			this.setCurrentState("waitToArriveAtEntranceDoor");
		}
	}

	Passenger.prototype.waitForExitDoorToOpen = function()
	{
		if ((vehicleLogic.getMachineState("ExitDoor") == "Open" && (this.m_entity.getProfile().getName().indexOf("heelchair") < 0)) || (vehicleLogic.getMachineState("Ramp") == "Down"))
		{
			this.ROOTtargets2 = getOffDoorTargets(this.m_subjectProfile, this.m_door, this.m_dest, this.m_index)
			this.switchTraversal("Exit the Vehicle", this.m_entity, justFollow, updateHeight, calmWalk, stopToFace, this.ROOTtargets2);
			
			this.setCurrentState("waitToArrive");
		}
	}
	
	Passenger.prototype.waitToArrive = function()
	{
		if ((this.currentTraversal.enabled == false) && (this.currentTraversal.active == false))
		{
			if (this.m_dest == "AwayFromBus")
			{
				var num = vehicleLogic.getMachineState("numOccupants");
				vehicleLogic.setMachineState("numOccupants", num-1);
				
				if (this.m_entity.m_dest)
				{
					delete this.m_entity.m_dest;
				}
			}
			else
			{
				var num = vehicleLogic.getMachineState("numOccupants");
				vehicleLogic.setMachineState("numOccupants", num+1);
				this.m_entity.m_dest = this.m_dest;
			}
			
			var audio = simCreatorUtil.getComponent("Audio");
			if (audio.PassengerConversation)
			{
				if (vehicleLogic.getMachineState("numOccupants") > 1)
					audio.PassengerConversation[0] = 1;
				else
					audio.PassengerConversation[0] = 0;
			}
			
			this.leave();
		}
	}
	
	Passenger.prototype.onLeave = function()
	{
		if (this.currentTraversal)
		{
			if ((this.currentTraversal.enabled) || (this.currentTraversal.active))
			{
				this.currentTraversal.leave();
			}
		}
		
		if (this.m_doorTarget)
		{
			delete this.m_doorTarget;
		}
	}
	
	Passenger.prototype.onCancel = function()
	{
		if (this.currentTraversal)
		{
			if ((this.currentTraversal.enabled) || (this.currentTraversal.active))
			{
				this.currentTraversal.cancel();
			}
		}
		
		if (this.m_doorTarget)
		{
			delete this.m_doorTarget;
		}
	}
	
	
});