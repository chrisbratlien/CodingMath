define([
'require', 'utils/string', 'utils/profile', 'utils/simCreator', 'utils/vehicleLogic', 'utils/audio', 'math/vector2D', 'dataStructures/AABB_2D', 
'stb/WaypointPath', 'stb/WaypointSpeed', 'stb/WaypointHeight', 'stb/WaypointCondition', 
'stb/WaypointEvent', 'stb/WaypointDriverCue', 'stb/WaypointCollision'
], 
function (
require, stringUtil, profileUtil, simCreatorUtil, vehicleLogic, audioUtils, vector2D, AABB_2D, 
WaypointPath, WaypointSpeed, WaypointHeight, WaypointCondition, 
WaypointEvent, WaypointDriverCue, WaypointCollision
){

	function Entity(name, entity_num, optionalArguments)
	{
		this.name = name;
		this.entity_num = entity_num;
		this.optionalArguments = optionalArguments;
		
		for (var i in optionalArguments)
		{
			this[i] = optionalArguments[i];
		}
		
		this.waypointPath = new WaypointPath(entity_num);
		this.waypointSpeed = new WaypointSpeed();
		this.waypointHeight = new WaypointHeight();
		this.waypointCondition = new WaypointCondition();
		this.waypointEvent = new WaypointEvent();
		this.waypointDriverCue = new WaypointDriverCue();
		
		this.waypointCollision = {};
		this.collisionEntity = {};
		this.activeEvents = {};
				
		//override / hard code the width for collision purposes
		var profile = profileUtil.getProfile(name);
		if (profile)
		{
			var profileType = profile.getType();
			var	profileEnum = GetEnumeration(profileType.toUpperCase());
			if (profileEnum == VEHICLE)
			{
				this.Width = 2.0;
			}
			else
			{
				this.Width = 0.2;  //ACTOR
			}
			
			this.type = profileEnum;
		}
	}

	Entity.prototype.addWaypoint = function(x, y, heading, warpNext)
	{
		//waypointPath data controls where the entities go
		this.waypointPath.addWaypoint(x, y, heading, warpNext);
	}
	
	Entity.prototype.addSpeedLimit = function(speed)
	{
		var pathLength = this.waypointPath.getLength();
		this.waypointSpeed.addWaypoint(pathLength, speed);
	}
	
	Entity.prototype.addHeightOffset = function(height)
	{
		if (this.type != VEHICLE)
		{
			var pathLength = this.waypointPath.getLength();
			this.waypointHeight.addWaypoint(pathLength, height || 0.0);
		}
	}
	
	Entity.prototype.addSpeedCondition = function(condition)
	{
		var pathLength = this.waypointPath.getLength();
		this.waypointCondition.addWaypoint(pathLength, condition);
	}
	
	Entity.prototype.addScriptedEvent = function(scripts)
	{
		var pathLength = this.waypointPath.getLength();
		this.waypointEvent.addWaypoint(pathLength, scripts);
	}
	
	Entity.prototype.addManeuver = function(maneuvers)
	{
		var pathLength = this.waypointPath.getLength();
		this.waypointEvent.addManeuver(pathLength, maneuvers);
	}
	
	Entity.prototype.addDriverCue = function(x, y, filename, condition)
	{
		var pathClosest = this.waypointPath.getClosest({x : x, y : y});
		
		if (pathClosest.s < this.waypointPath.getLength())
		{
			print("adding driver cue at position : " + pathClosest.s + " for " + filename);
			this.waypointDriverCue.addWaypoint(pathClosest.s, filename, condition);
		}
		else
		{
			this.waypointPath.addWaypoint(x, y);
			this.waypointDriverCue.addWaypoint(this.waypointPath.getLength(), filename, condition);
			
			print("adding driver cue at end of path : " + filename);
		}
	}
	
	Entity.prototype.getCoordinates = function()
	{
		if (this.entityObj)
		{
			return {x : this.entityObj.getCoordinateX(), y : this.entityObj.getCoordinateY()};
		}
	}
	
	Entity.prototype.getPathPosition = function()
	{
		if (this.entityObj == Scenario.Subject)
		{
			//return this.waypointPath.getPosition(this.getCoordinates());
			return this.waypointPath.getClosest(this.getCoordinates()).s;
		}
		else if (this.entityObj)
		{
			if (this.entityObj.complete)
			{
				return this.waypointPath.getLength();
			}
			
			return this.entityObj.getRoadPosition();
		}
		
		return 0;
	}
	
	function MPH_2_MPS(speed)
	{
		return speed * 0.44704;
	}

	function G_2_MPSS(accel)
	{
		return accel * 9.80665;
	}

	Entity.prototype.getAcceleration = function()
	{
		//acceleration is in g's (or 9.80665 m/s/s or 21.9368513 m/h/s)
		
		//var accel = this.NominalAccel || 0.2;
		//var accel = this.MaxAccel || 0.3;

		var accel = 0.2;  //in gs
		
		return G_2_MPSS(accel);	
	}
	
	Entity.prototype.getDeceleration = function()
	{
		//acceleration is in g's (or 9.80665 m/s/s or 21.9368513 m/h/s)
		
		//var decel = this.NominalDecel || 0.0455853936;  //(1 mile per hour per second)
		//var decel = this.MaxDecel || 1;
		
		var decel = 0.2;  //in gs
		
		return G_2_MPSS(decel);
	}
	
	
	//we're done adding waypoints, so now we need to 'close the loop' for those entities who repeat
	//for repeating paths, clone the starting waypoint and add it to the end to complete a cyclic path
	Entity.prototype.closeLoop = function()
	{
		if (this.Repeat)
		{
			var last_entity = this;
			while (last_entity.nextEntity)
			{
				last_entity = last_entity.nextEntity;
			}
			
			//if the last entity warps to the beginning as in a repeat, it wont have any waypoints
			if (last_entity.waypointPath.waypoints.length > 0)
			{
				//if the last waypoint is a warpNext waypoint, skip this since it will just warp past it
				if (!last_entity.waypointPath.waypoints[last_entity.waypointPath.waypoints.length - 1].warpNext)
				{
					var first_waypoint = this.waypointPath.waypoints[0];
					if (first_waypoint)
					{
						var x = first_waypoint.datum.getCoordinateX();
						var y = first_waypoint.datum.getCoordinateY();
						var heading = first_waypoint.datum.getHeading();
						var warpNext = first_waypoint.warpNext;

						var newLength = last_entity.waypointPath.closeLoop(x, y, heading, warpNext);
						
						var first_speed = this.waypointSpeed.todoList[0];
						if (first_speed)
						{
							last_entity.waypointSpeed.addWaypoint(newLength, first_speed.speed);
						}
						
						var first_condition = this.waypointCondition.todoList[0];
						if (first_condition)
						{
							if (first_condition.position == 0)
							{
								function stop(entityDistance)
								{
									if (entityDistance < 0.01)
									{
										return true;
									}
									else
									{
										return false;
									}
								}
								
								print("adding stop condition to end of path at length " + newLength);
								last_entity.waypointCondition.addWaypoint(newLength, {func : stop, context : this});
							}
						}
					}
				}
			}
		}
	}
	
	Entity.prototype.getAABB = function()
	{
		return this.waypointPath.getAABB();
	}
	
	Entity.prototype.insert = function(quadtree)
	{
		this.waypointPath.insert(quadtree);
	}
	
	Entity.prototype.retrieve = function(entities, quadtree)
	{
		//BTW: a distance check of 2 meter radius is probably OK for most cars, but will detect for 3 meters total
		var radius = 1.5;
		if (this.Width < .5)
		{
			radius = 1.0;
		}
		
		var numberCompares = this.waypointPath.retrieve(entities, quadtree, radius);
		if (numberCompares > 0)
		{
			var collatedMap = this.waypointPath.collateCollisions(entities);
			for (var entity_num in collatedMap)
			{
				for (var index in collatedMap[entity_num])
				{
					var result = collatedMap[entity_num][index];
					result.startPos = this.waypointPath.reverseLookup(result.start);
					result.endPos = this.waypointPath.reverseLookup(result.end);
					
					this.waypointCollision[entity_num] = this.waypointCollision[entity_num] || new WaypointCollision(this.entity_num);
					this.waypointCollision[entity_num].addWaypoint(result);
				}
				
				this.waypointCollision[entity_num].wrapLoops(this.waypointPath.getLength());
			}
		}
		
		//print the waypointCollision data for debugging
		for (var entity_num in this.waypointCollision)
		{
			var wpCollision = this.waypointCollision[entity_num];
			print("E" + this.entity_num + " has " + wpCollision.todoList.length + " collisions for E" + entity_num);
			for (var index in wpCollision.todoList)
			{
				var result = wpCollision.todoList[index];
				
				//print some stats for debugging
				print("Route { " + stringUtil.toFixed(result.start, 3) + ", " + 
													 stringUtil.toFixed(result.end, 3) + " } - length: " + 
													 stringUtil.toFixed(result.end - result.start, 3));
				
				print("AABB  { " + stringUtil.toFixed(wpCollision.todoList[index].aabb.centerX, 3) + ", " + 
													 stringUtil.toFixed(wpCollision.todoList[index].aabb.centerY, 3) + " } - radius:" + 
													 stringUtil.toFixed(wpCollision.todoList[index].aabb.getRadius(), 3));
			}
		}
		
		//print("total path length : " + stringUtil.toFixed(this.waypointPath.getLength(), 3));
		
		return numberCompares;
	}
	
	Entity.prototype.cleanCollisions = function()
	{
		if (this.waypointPath)
		{
			this.waypointPath.cleanCollisions();
		}
	}

	Entity.prototype.create = function(isSubject)
	{
		if (this.entityObj === undefined)
		{
			var profileName = this.name;
			
			if (!isSubject && profileName.indexOf("os_") == 0)
			{
				profileName = profileName.replace("os_", "xm_");
			}
			
			if (!isSubject)
			{
				var profile = profileUtil.getProfile(profileName);
				if (profile === undefined)
				{
					print("Unable to located profile for model : " + profileName + ", expect errors!");
					return;
				}
			}
			else
			{
				var mmoComponent = simCreatorUtil.getComponent("MovingModelOwnship");
				if (mmoComponent)
				{
					var ownshipSelect = vehicleLogic.getMachineState("Ownship Select");
					var mmoProfile = profileUtil.getProfile(mmoComponent.modelName[0]);
					if (ownshipSelect !== undefined)
					{
						mmoProfile = profileUtil.getProfile(mmoComponent.modelName[ownshipSelect]);
					}
				
					if (mmoProfile)
					{
						profile = mmoProfile;
					}
					else
					{
						print("MovingModelOwnship profile is not in the profile databases : " + mmoComponent.modelName[0]);
					}
				}
				else
				{
					print("Cannot locate the MovingModelOwnship component, please rename it, using default profile.");
				}
				
				print("Ownship profile : " + profile.getName());
				
				var profileType = profile.getType();
				var	profileEnum = GetEnumeration(profileType.toUpperCase());
				this.type = profileEnum;
				this.name = profile.getVisualModel();
				
				this.entityObj = Scenario.Subject;
				Scenario.Subject.setProfile(profile);
				return;
			}
			
			if (profile)
			{
				var profileType = profile.getType();
				var	profileEnum = GetEnumeration(profileType.toUpperCase());
				this.type = profileEnum;
				
				//make sure there are enough entities in the vehicle pool to support another vehicle
				if (Scenario.getAvailableEntities(profileEnum) > 0)
				{
					if (profileEnum == OBJECT)
					{
						this.entityObj = Scenario.createObject(profile, this.waypointPath.getStartDatum());
						if (this.waypointPath.path)
						{
							var ghostProfile = profileUtil.getProfile("xm_bmw325_blu");
							if (ghostProfile)
							{
								this.corporealObj = this.entityObj;
								this.entityObj = Scenario.createVehicle(ghostProfile, this.waypointPath.getStartDatum());
								this.entityObj.setVisible(false);
								this.type = VEHICLE;
								this.corporealObj.attach(this.entityObj);
							}
							else
							{
								print("Unable to get object ghost profile : xm_bmw325_blu");
							}
						}
						
						this.updateHeight(undefined, 0.0);
					}
					else if (profileEnum == ACTOR)
					{
						this.entityObj = Scenario.createActor(profile, this.waypointPath.getStartDatum());
						if (this.waypointPath.path)
						{
							this.waypointPath.path.useLaneOffset(false);
						}
					}
					else if (profileEnum == VEHICLE)
					{
						this.entityObj = Scenario.createVehicle(profile, this.waypointPath.getStartDatum());
						if (this.waypointPath.waypoints.length <= 1)
						{
							this.entityObj.setLightState(BRAKE, OFF);
						}
					}
					else
					{
						Report(MSG_WARNING, "Error: Scenario.create" + profileType + " does not exist");
					}
				}
				else
				{
					Report(MSG_WARNING, "Error: No available " + EnumToString(profileEnum) + " entities");
				}
			}
		}
	}
	
	
	Entity.prototype.join = function(isSubject)
	{
		if (this.waypointPath.path && this.entityObj && !isSubject)
		{
			this.entityObj.complete = false; //will become true when the entity has finished traversing this path
						
			if (this.Join)
			{
				this.entityObj.traverse(this.waypointPath.path, TRAVERSE_JOIN);
			}
			else
			{
				this.entityObj.traverse(this.waypointPath.path, TRAVERSE_STOP);
			}
		}
	}

	Entity.prototype.destroy = function(isSubject)
	{
		this.cancelEvent();
		
		this.waypointPath.destroy();
		
		if (this.entityObj && !isSubject)
		{
			if (this.corporealObj)
			{
				Scenario.destroyEntity(this.corporealObj);
			}
			
			Scenario.destroyEntity(this.entityObj);
		}
		
		delete this.waypointPath;
		delete this.waypointSpeed;
		delete this.waypointHeight;
		delete this.waypointCondition;
		delete this.waypointEvent;
		delete this.waypointDriverCue;
		for (var entity_num in this.waypointCollision) delete this.waypointCollision[entity_num];
	}	
	
	Entity.prototype.updateSpeed = function(entities, position)
	{
		//algorithm taken from ACDA
		//http://en.wikipedia.org/wiki/Assured_Clear_Distance_Ahead
		
		var maxSpeedLimit = 0;
		
		var nextSpeed = this.waypointSpeed.getNext();
		if (nextSpeed)
		{
			maxSpeedLimit = MPH_2_MPS(nextSpeed.speed);
			
			var start = nextSpeed.start;
			var end = nextSpeed.end;
			
			if (end)
			{
				var middle = (start + end) / 2.0;
				
				if (position > middle)
				{
					this.waypointSpeed.shift();
				}
			}
			else if (position > start)
			{
				this.waypointSpeed.shift();
			}
		}
		
		//if this entity is supposed to match the velocity of another entity, do so here:
		if (this.matchSpeedEntityNum !== undefined)
		{
			if (entities[this.matchSpeedEntityNum])
			{
				if (entities[this.matchSpeedEntityNum].entityObj)
				{
					var matchVelocity = entities[this.matchSpeedEntityNum].entityObj.getVelocity();
					var matchSpeedMin = maxSpeedLimit * this.matchSpeedMin;
					var matchSpeedMax = maxSpeedLimit * this.matchSpeedMax;
					if ((matchVelocity >= matchSpeedMin) && (matchVelocity <= matchSpeedMax))
					{
						maxSpeedLimit = matchVelocity;
					}
				}
			}
		}
		
		//get distance to closest static entity
		
		var closestObstaclePos = this.waypointPath.getLength();
		
		if (this.Repeat || this.nextEntity || this.Join)
		{
			closestObstaclePos = 99999999999;
		}
		else
		{
			closestObstaclePos = Math.min(closestObstaclePos, this.waypointPath.getLength());
		}
		
		var nextCondition = this.waypointCondition.getNext();
		while (nextCondition)
		{
			if (nextCondition.func.apply(nextCondition.context, [nextCondition.position - position]) == true)
			{
				this.waypointCondition.shift();
				nextCondition = this.waypointCondition.getNext();
			}
			else
			{
				closestObstaclePos = Math.min(closestObstaclePos, nextCondition.position);
				break;
			}
		}
		
		//TODO: check for the nearest signal and if read, get the distance to stopline
		
		var closestEntityPos = 99999999999;
		
		
		var followDistance = 2.0;
		if (this.type == VEHICLE)
		{
			followDistance = 10.0;
		}
		
		var testDist = followDistance * 2;
		var heading = vector2D.fromAngles((90 - this.entityObj.getHeading()) / 180 * Math.PI);
		var selfPos = this.getCoordinates();
		var query = vector2D.add(selfPos, vector2D.scale(heading, testDist));
		
		for (var entity_num in this.collisionEntity)
		{
			//find the closest one too me
			if (this.collisionEntity[entity_num] !== undefined)
			{
				if (this.collisionEntity[entity_num] != this.entity_num)
				{
					var otherPos = entities[this.collisionEntity[entity_num]].getCoordinates();
					
					var closest = this.waypointPath.getClosest(otherPos);
					
					//print("E" + this.entity_num + " has E" + entity_num + " in collisionEntity - closest.t : " + closest.t + " vs distance : " + followDistance);
					if (closest.t < followDistance)
					{
						var pos = closest.s;
						
						//print("pos ahead : " + stringUtil.toFixed(pos - position, 3));
						
						if ((pos < position) || ((pos - position) > testDist))
						{
							
							var dist = vector2D.length(vector2D.subtract(otherPos, query));
							if (dist < testDist)
							{
								//project the other position onto a vector defined by this entities heading and use that distance for collision
								pos = vector2D.dot(vector2D.subtract(otherPos, selfPos), heading) + position;
								//print("new pos ahead : " + stringUtil.toFixed(pos - position, 3));
							}
						}	
						
						if (this.Repeat)
						{
							if ((position + followDistance) > this.waypointPath.getLength())
							{
								if (pos < followDistance)
								{
									pos += this.waypointPath.getLength();
								}
							}
						}
						
						//ignore entities behind you
						if (pos > position)
						{
							closestEntityPos = Math.min(pos - followDistance, closestEntityPos);
							//print("E" + this.collisionEntity[entity_num] + " is " + stringUtil.toFixed(pos - position, 3) + " from E" + this.entity_num);
						}
					}
				}
			}
		}
		
		//compute max velocity for braking distance
		//http://en.wikipedia.org/wiki/Braking_distance
		
		var decel = this.getDeceleration();
		var tprt = 1.5; //(reaction time, usually between 1.0 and 2.5)
		var td = 2.0 //follow time, usually the two or three second rule
		
		maxVelS = Math.sqrt(Math.max(closestObstaclePos - position, 0) * 2 * decel);
		maxVelD = Math.sqrt(Math.max(closestEntityPos - position, 0) * 2 * decel);
		
		//print("E" + this.entity_num + " S : " + stringUtil.toFixed(maxVelS, 3));
		//print("E" + this.entity_num + " D : " + stringUtil.toFixed(maxVelD, 3));
		//print("E" + this.entity_num + " C : " + stringUtil.toFixed(maxSpeedLimit, 3));
		
		var maxVel = maxSpeedLimit;
		maxVel = Math.min(maxVel, maxVelS);
		maxVel = Math.min(maxVel, maxVelD);
		
		//might need to limit acceleration or deceleration
		if (this.type == VEHICLE)
		{
			var updateRate = 60.0;
			var deltaV = maxVel - this.entityObj.getVelocity();		
			
			//this is my attempt to smooth out the accel/braking of the entities
			if (deltaV > 0)
			{
				var a = this.getAcceleration();
				var slewTime = deltaV / a;
				if (slewTime > (1 / updateRate))
				{
					maxVel = this.entityObj.getVelocity() + a / updateRate;
				}
			}
			else if (maxVel == maxSpeedLimit)
			{
				var d = 10.0;//this.getDeceleration();  MAX BRAKING!
				var slewTime = deltaV / d * -1.0;
				if (slewTime > (1.0 / updateRate))
				{
					maxVel = this.entityObj.getVelocity() - d / updateRate;
				}
			}
		}
		
		//entity has completed the path and we should no longer control it
		if (this.Join && (position >= this.waypointPath.getLength()))
		{
			return;
		}
		
		//print("maxVel : " + maxVel + ", entityVel : " + this.entityObj.getVelocity());
			
		if (this.type == ACTOR)
		{
			if (((maxVel > 2.0) && (Math.abs(maxVel - this.entityObj.getVelocity()) > 2)) ||
				((maxVel <= 2.0) && (Math.abs(maxVel - this.entityObj.getVelocity()) > 0)))
			{
				this.entityObj.setVelocity(RAMP, maxVel, 0);
				//print("changing actor speed to " + maxVel + " mph");
			}
		}
		else
		{
			this.entityObj.setVelocity(RAMP, maxVel, 0);
		}
	}
	
	Entity.prototype.setHeightOffset = function(zOffset)
	{
		if (this.entityObj == Scenario.Subject)
		{
			return;
		}
		
		if (this.corporealObj)
		{
			var distUp = this.corporealObj.getCoordinateZ();
			var offsetUp = zOffset - distUp;
			this.corporealObj.move(UP, offsetUp);
		}
		else if (this.type == ACTOR)
		{
			this.entityObj.setZOffset(-1 * zOffset); 
			
			//BTW: its unclear which entity types use setZOffset or move(UP)
			// negative z is up apparently..
			// its worth noting that attaching entities to another entity must use .move(UP)
			//actors walking on the ground would use setZOffset
			//the rest is unsupported for now
		}
	}
	
	Entity.prototype.updateHeight = function(entities, position)
	{
		var nextHeightOffset = this.waypointHeight.getNext();
		if (nextHeightOffset)
		{
			if (position >= nextHeightOffset.position)
			{
				this.setHeightOffset(nextHeightOffset.height);
				this.waypointHeight.shift();
			}
		}
	}

	Entity.prototype.updateEvent = function(entities, position)
	{
		var nextEvent = this.waypointEvent.getNext();
		if (nextEvent)
		{
			if (position >= nextEvent.position)
			{
				for (var i in nextEvent.events)
				{
					var event = nextEvent.events[i];
					if (event)
					{
						event.apply(this, [entities, event]);
					}
				}
				
				this.waypointEvent.shift();
			}
		}
		
		var deletedEvents = [];
		for (var event in this.activeEvents)
		{
			var eventList = this.activeEvents[event];
			var deletedList = [];
			
			for (var i in eventList)
			{
				if (eventList[i].update())
				{
					deletedList.unshift(i);
				}
				else if (eventList[i].blocking)
				{
					break;
				}
			}
			
			for (var i in deletedList)
			{
				delete this.activeEvents[event][i];							
				this.activeEvents[event].splice(deletedList[i], 1);
			}
			
			print("this.activeEvents[event] : " + this.activeEvents[event].length);
			if (this.activeEvents[event].length == 0)
			{
				deletedEvents.push(event);
			}
		}
		
		for (var i in deletedEvents)
		{
			delete this.activeEvents[deletedEvents[i]];
		}
	}
	
	Entity.prototype.cancelEvent = function()
	{
		for (var event in this.activeEvents)
		{
			for (var i in this.activeEvents[event])
			{
				this.activeEvents[event][i].cancel();
				delete this.activeEvents[event][i];
			}
			
			delete this.activeEvents[event];
		}
		
		delete this.activeEvents;
	}
	
	Entity.prototype.updateDriverCue = function(entities, position)
	{
		var nextDriverCue = this.waypointDriverCue.getNext();
		if (nextDriverCue)
		{
			if (nextDriverCue.condition)
			{
				if (nextDriverCue.condition(nextDriverCue.position - position, this.entityObj.getVelocity()))
				{
					audioUtils.playSample(nextDriverCue.wav_file);
					this.waypointDriverCue.shift();
				}
			}
		}
	}

	//This function serves as a way to determine who gets to the locking semaphores first
	//who has control of them and when do they unlock them
	Entity.prototype.updateCollisions = function(ownshipID, autonomous)
	{
		//update collisions
		if (this.waypointPath.path)
		{
			if (this.entityObj)
			{
				var unlockPosition = this.getPathPosition();
				var lockPosition = unlockPosition + 20;

				// flag comes from DX, 1=stop before collision, 2=Do not stop
				if (this.CollisionAvoidanceFlag == 1)
				{
					//get distance to closest dynamic vehicle - in front
					for (var entity_num in this.waypointCollision)
					{
						//print("E" + this.entity_num + " checking collision with " + entity_num);
						var nextCollision = this.waypointCollision[entity_num].getNext();
						if (nextCollision)
						{
							if (nextCollision.semaphore)
							{
								//print("E" + this.entity_num + " > E" + entity_num + " {" + nextCollision.start + ", " + nextCollision.end + "} S" + nextCollision.semaphore.index);
							}
							
							//TODO: need to look ahead if collision semaphores are back-to-back
							if (unlockPosition > nextCollision.end)
							{
								//print("removing knowing that : " + this.collisionEntity[entity_num] + " is ahead of " + this.entity_num);
								if (nextCollision.semaphore)
								{
									nextCollision.semaphore.outside(this.entity_num);
								}
								
								//tell the other entity to ignore this one
								delete this.collisionEntity[entity_num];
								
								//release claiming being ahead of the other entities
								this.waypointCollision[entity_num].shift();
							}
							else if (unlockPosition > nextCollision.start)
							{
								if (nextCollision.semaphore)
								{
									var group = nextCollision.semaphore.inside(this.entity_num);
									for (var group_num in group)
									{
										this.collisionEntity[group_num] = group_num;
									}
								}
							}
							else if (lockPosition > nextCollision.start)
							{
								if (nextCollision.semaphore)
								{
									this.collisionEntity[entity_num] = nextCollision.semaphore.lock(this.entity_num);
									
									if (this.collisionEntity[entity_num] !== undefined)
									{
										//print("adding E" + this.collisionEntity[entity_num] + " is ahead of E" + this.entity_num  + " as per S" + nextCollision.semaphore.index);
									}
								}
							}
						}
					}
				}
				
				if (!this.autonomous)
				{
					//check for the ownship
					var closest = this.waypointPath.getClosest({x : Scenario.Subject.getCoordinateX(), y : Scenario.Subject.getCoordinateY()}, 25.0);
					if (closest.t < 3.0)
					{
						//print("Ownship is on E" + this.entity_num + " path");
						this.collisionEntity[ownshipID] = ownshipID;
					}
					else
					{
						delete this.collisionEntity[ownshipID];
					}
				}
			}
			else if (this.nextEntity)
			{
				return this.nextEntity.updateCollisions(ownshipID, autonomous);
			}
		}
	}
	
	Entity.prototype.update = function(entities)
	{
		//don't update static entities
		if ((this.type == VEHICLE) || (this.type == ACTOR))
		{
			if (this.entityObj)
			{
				if (this.entityObj.m_dest == "Stand1")
				{
					var jerk = simCreatorUtil.getComponent("Dynamics_Jerk");
					if (jerk)
					{
						if (jerk.SigOut[0] > 7.75)
						{
							this.entityObj.executeAction("fall_back");
							this.entityObj.setPosture("fall_back_fall");
							this.entityObj.m_dest = "Fall";
							Audio.playSample("hurtLeg.wav");
						}
						else if (jerk.SigOut[0] < -7.75)
						{
							this.entityObj.executeAction("fall_front");
							this.entityObj.setPosture("fall_front_fall");
							this.entityObj.m_dest = "Fall";
							Audio.playSample("hurtLeg.wav");
						}
					}
				}
			}
			
			if (this.entityObj)
			{
				var position = this.getPathPosition();
				
				//print("position : " + position);
				
				if (this.entityObj != Scenario.Subject)
				{
					this.updateSpeed(entities, position);
				}
				
				this.updateHeight(entities, position);
				
				this.updateEvent(entities, position);
				
				this.updateDriverCue(entities, position);
				
				var hasNext = false;
				if (this.nextEntity)
				{
					hasNext = this.nextEntity.waypointPath.waypoints.length > 0;
				}
				
				//wait until this entity has completed all constraints and triggers before warping/repeating
				if (this.waypointCondition.getNext() || this.waypointEvent.getNext())
					return;
				
				if (this.Repeat && !hasNext && (position >= this.waypointPath.getLength()))
				{
					this.waypointPath.reset();
					this.waypointSpeed.reset();
					this.waypointHeight.reset();
					this.waypointCondition.reset();
					this.waypointEvent.reset();
					this.waypointDriverCue.reset();
					for (var entity_num in this.waypointCollision) this.waypointCollision[entity_num].reset();
					
					var first_entity = this;
					while(first_entity.prevEntity)
					{
						first_entity = first_entity.prevEntity;
						
						first_entity.waypointPath.reset();
						first_entity.waypointSpeed.reset();
						first_entity.waypointHeight.reset();
						first_entity.waypointCondition.reset();
						first_entity.waypointEvent.reset();
						first_entity.waypointDriverCue.reset();
						for (var entity_num in this.waypointCollision) this.waypointCollision[entity_num].reset();
					}
					
					if ((first_entity !== this) || this.nextEntity)
					{
						var current_speed = this.entityObj.getVelocity();
						if (this.corporealObj)
						{
							Scenario.destroyEntity(this.corporealObj);
						}
						Scenario.destroyEntity(this.entityObj);
						delete this.entityObj;
						
						first_entity.create(false);
						first_entity.join(false);
						first_entity.entityObj.setVelocity(RAMP, current_speed, 0);
						return;// first_entity.update(entities);
					}
					else
					{
						this.join(false);
					}
				}
				
				//special case for when Repeat and the last waypoint warps the entity back to the start
				
				if (hasNext && (position >= this.waypointPath.getLength()))
				{
					var current_speed = this.entityObj.getVelocity();
					if (this.corporealObj)
					{
						Scenario.destroyEntity(this.corporealObj);
					}
					Scenario.destroyEntity(this.entityObj);
					delete this.entityObj;
					
					this.nextEntity.create(false);
					this.nextEntity.join(false);
					this.nextEntity.entityObj.setVelocity(RAMP, current_speed, 0);
					return;// this.nextEntity.update(entities);
				}
			}
			else if (this.nextEntity)
			{
				return this.nextEntity.update(entities);
			}
		}
	}
	
	return Entity;

});