define(['require', 'stb/Entity', 'stb/CollisionSemaphore', 'stb/signal', 'stb/railCrossing', 'utils/simCreator', 'utils/vehicleLogic', 'dataStructures/AABB_2D', 'algorithms/Quadtree'], function (require, Entity, CollisionSemaphore, signal, railCrossing, simCreatorUtil, vehicleLogic, AABB_2D, Quadtree) {

	function STB(sound_path)
	{
		this.sound_path = sound_path;
		
		this.entities = {};
		this.collisionSemaphores = [];
		
		this.autonomous = false;
	}

	STB.prototype.setEnvironment = function(fog, rain, snow, snow_acc, dust, time, wind_dir, wind_mag, optionalArguments)
	{
		print("setEnvironment implementation called");
		
		//shadows are on between 800 and 1800
		
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
		
		var FOGGY_VISIBILITY = 100;
		var CLEAR_VISIBILITY = 3000;
		
		var fogFactor = fog / 9.0;
		var visibility = (1.0 - fogFactor) * CLEAR_VISIBILITY + fogFactor * FOGGY_VISIBILITY;
		
		if (fog == 0)
		{
			visibility = 30000;
		}
		
		if (snow > 5)
		{
			visibility = Math.min(visibility, FOGGY_VISIBILITY * 2);
		}
		
		var slewTime = 1.0;
		
		//Environment.setTraction(RAMP, traction, slewTime);
		
		Environment.setVisibility(RAMP, visibility, slewTime);
		Environment.setRain(RAMP, rain / 9.0, slewTime);
		Environment.setSnow(RAMP, snow / 9.0, slewTime);
		//Environment.setHail(RAMP, hail / 9.0, slewTime);
		Environment.setWind(wind_mag, wind_mag, wind_mag);
		Environment.setTimeOfDay(RAMP, tod, slewTime);
		
		//simCreator.Visuals_Visuals.SetSunGlare.Call({EffectType: sunGlare});
	}
	
	STB.prototype.loadEntity = function(name, entity_num, optionalArguments)
	{
		optionalArguments = optionalArguments || {};
		if (optionalArguments.EntityType == 13)
		{
			return;
		}
		
		this.entities[entity_num] = new Entity(name, entity_num, optionalArguments);
	}
	
	STB.prototype.loadObject = STB.prototype.loadEntity;
	STB.prototype.loadPed = STB.prototype.loadEntity;
	STB.prototype.loadVehicle = STB.prototype.loadEntity;
	STB.prototype.loadOwnship = function(name, entity_num, optionalArguments)
	{
		this.loadEntity(name, entity_num, optionalArguments);
		this.ownshipID = entity_num;
	};
	
	STB.prototype.addWaypoint = function(entity_num, x, y, speed, optionalArguments)
	{
		optionalArguments = optionalArguments || {};
		
		var this_entity = this.entities[entity_num];
		if (this_entity)
		{
			//add the waypoint to the latest of next's
			while(this_entity.nextEntity)
			{
				this_entity = this_entity.nextEntity;
			}
			
			this_entity.addWaypoint(x, y, optionalArguments.Heading, optionalArguments.WarpNext);
			this_entity.addSpeedLimit(speed);
			this_entity.addSpeedCondition(optionalArguments.SpeedCondition);
			this_entity.addScriptedEvent(optionalArguments.Script);
			this_entity.addManeuver(optionalArguments.Maneuver);
			
			if (this.ownshipID != entity_num)
			{
				this_entity.addHeightOffset(optionalArguments.ZOffset);
			}
			
			if (optionalArguments.WarpNext)
			{
				this_entity.nextEntity = new Entity(this_entity.name, this_entity.entity_num, this_entity.optionalArguments);
				if (this.entities[entity_num].Repeat)
				{
					//remember the first entity for WarpNext + Repeat
					this_entity.nextEntity.prevEntity = this_entity;
				}
			}
		}
	}

	STB.prototype.addDistanceToGoWaypoint = function(entity_num, x, y, speed, go_x, go_y, distance, optionalArguments)
	{
		function distanceTest()
		{
			if (this.entities[this.ownshipID])
			{
				var pos = this.entities[this.ownshipID].getCoordinates();
				if (pos)
				{
					var dx = go_x - pos.x;
					var dy = go_y - pos.y;
					
					return Math.sqrt(dx * dx + dy * dy) < distance;
				}
			}
		}
		
		optionalArguments = optionalArguments || {};
		optionalArguments.SpeedCondition = {func : distanceTest, context : this};
		this.addWaypoint(entity_num, x, y, speed, optionalArguments);
	}

	STB.prototype.addTimeToGoWaypoint = function(entity_num, x, y, speed, go_x, go_y, time, optionalArguments)
	{
		function ttcTest()
		{
			if (this.entities[this.ownshipID])
			{
				//print("ttcTest called with : " + x + ", " + y + ", " + time);
				
				var dx = go_x - this.entities[this.ownshipID].entityObj.getCoordinateX();
				var dy = go_y - this.entities[this.ownshipID].entityObj.getCoordinateY();
				var distance = Math.sqrt(dx * dx + dy * dy);
				
				var ttc = distance / Math.max(this.entities[this.ownshipID].entityObj.getVelocity(), 1.0);
				
				//print("ttc = " + ttc);
				
				if (ttc > 0)
				{
					return ttc < time;
				}
			}
		}
		
		optionalArguments = optionalArguments || {};
		optionalArguments.SpeedCondition = {func : ttcTest, context : this};
		this.addWaypoint(entity_num, x, y, speed, optionalArguments);
	}

	
	STB.prototype.addWaitWaypoint = function(entity_num, x, y, speed, time, optionalArguments)
	{
		//the condition must be checked for 'this_entity'
		//additional warps will increment that
		var this_entity = this.entities[entity_num];
		if (this_entity)
		{
			//add the waypoint to the latest of next's
			while(this_entity.nextEntity)
			{
				this_entity = this_entity.nextEntity;
			}
		}
			
		function waitTest(entityDistance)
		{
			if (this_entity.entityObj)
			{
				if (this_entity.waitTestStartTime)
				{
					var elapsed = Scenario.getTime() - this_entity.waitTestStartTime;
					if (elapsed > time)
					{
						delete this_entity.waitTestStartTime;
						return true;
					}
				}
				else
				{
					if (entityDistance < 0.01)
					{
						this_entity.waitTestStartTime = Scenario.getTime();
						print("entity" + entity_num + " waiting for " + time + " seconds");
					}
				}
			}
		}
		
		optionalArguments = optionalArguments || {};
		optionalArguments.SpeedCondition = {func : waitTest, context : this};
		this.addWaypoint(entity_num, x, y, speed, optionalArguments);
	}
	
	STB.prototype.addTimeToGoDriverCueWave = function(entity_num, cue_x, cue_y, wav_file, time, optionalArguments)
	{
		print("addTimeToGoDriverCueWaveImpl called : " + wav_file);
		
		var this_entity = this.entities[entity_num];
		if (this_entity)
		{
			//add the waypoint to the latest of next's
			while(this_entity.nextEntity)
			{
				this_entity = this_entity.nextEntity;
			}
		
			function ttcTest(distance, velocity)
			{
				var velocity = Math.max(velocity, 1);		
				var ttc = Math.max(distance, 0) / velocity;
				return ttc < time;
			}
			
			function distTest(distance)
			{
				return Math.max(distance, 0) < dist;
			}
			
			this_entity.addDriverCue(cue_x, cue_y, this.sound_path + "/" + wav_file, ttcTest);
		}
	}
	
	
	STB.prototype.getSemaphoreIndex = function(aabb)
	{
		//E4 has 3 collisions for E9
		//{ 680.266, -388.373 } - 122.652
		//{ 711.068, -495.079 } - 53.721
		//{ 614.996, -451.789 } - 6.361
		//E9 has 3 collisions for E4
		//{ 710.349, -495.133 } - 53.449
		//{ 615.058, -451.824 } - 5.996
		//{ 680.797, -390.908 } - 119.680
		//comparing E4 to E9 : 2,0,1
		//comparing E9 to E4 : 1,2,0
		
		var bestDistance = 99999999999;
		var bestIndex = -1;
		
		for (var index in this.collisionSemaphores)
		{
			var this_aabb = this.collisionSemaphores[index].aabb;
			if (this_aabb.isSimilar(aabb))
			{
				var distance = this_aabb.getDistance(aabb);
				if (distance < bestDistance)
				{
					bestDistance = distance;
					bestIndex = index;
				}
			}
		}
		
		if (bestIndex < 0)
		{
			this.collisionSemaphores.push(new CollisionSemaphore(this.collisionSemaphores.length, aabb))
			return this.collisionSemaphores.length - 1;
		}
		else
		{
			this.collisionSemaphores[bestIndex].aabb.expand(aabb);
			return bestIndex;
		}
	}
	
	
	STB.prototype.calculateCollisions = function(autonomous)
	{
		//calculate the AABB of the entire scenario
		var aabb = new AABB_2D();
		for (var entity_num in this.entities)
		{
			var isSubject = (entity_num == this.ownshipID) && (!autonomous);
			if (isSubject == false)
			{
				var this_entity = this.entities[entity_num];
				while(this_entity)
				{
					aabb.expand(this_entity.getAABB());
					this_entity = this_entity.nextEntity;
				}
			}
		}
		
		//insert all the line segments into the tree
		
		var quadtree = new Quadtree(aabb);
		for (var entity_num in this.entities)
		{
			var isSubject = (entity_num == this.ownshipID) && (!autonomous);
			if (isSubject == false)
			{
				var this_entity = this.entities[entity_num];
				while(this_entity)
				{
					this_entity.insert(quadtree);
					this_entity = this_entity.nextEntity;
				}
			}
		}
		
		var numberCompares = 0;
		
		//compute all the neighbors for each path segment
		for (var entity_num in this.entities)
		{
			var isSubject = (entity_num == this.ownshipID) && (!autonomous);
			if (isSubject == false)
			{
				var this_entity = this.entities[entity_num];
				while(this_entity)
				{
					numberCompares += this_entity.retrieve(this.entities, quadtree);
					this_entity = this_entity.nextEntity;
				}
			}
		}
		
		print("number of compares : " + numberCompares);
		
		//create a list of semaphores by position / size
		
		//correlate potential collisions between entities with each other
		for (var entity_num in this.entities)
		{
			var isSubject = (entity_num == this.ownshipID) && (!autonomous);
			if (isSubject == false)
			{
				var this_entity = this.entities[entity_num];
				while(this_entity)
				{
					for (var other_entity in this_entity.waypointCollision)
					{
						//for each collision object, create or point to the matching semaphore
						for (var index in this_entity.waypointCollision[other_entity].todoList)
						{
							var aabb = this_entity.waypointCollision[other_entity].todoList[index].aabb;
							var semaphoreIndex = this.getSemaphoreIndex(aabb);
							this_entity.waypointCollision[other_entity].todoList[index].semaphore = this.collisionSemaphores[semaphoreIndex];
							print("E" + entity_num + " > E" + other_entity + "[" + index + "] uses semaphore " + semaphoreIndex + 
							" (" + this.collisionSemaphores[semaphoreIndex].aabb.centerX + ", " + this.collisionSemaphores[semaphoreIndex].aabb.centerY + ")");
						}
					}
					this_entity = this_entity.nextEntity;
				}
			}
		}
		
		
		for (var entity_num in this.entities)
		{
			var isSubject = (entity_num == this.ownshipID) && (!autonomous);
			if (isSubject == false)
			{
				var this_entity = this.entities[entity_num];
				while(this_entity)
				{
					this_entity.cleanCollisions();
					this_entity = this_entity.nextEntity;
				}
			}
		}
		
		delete quadtree;
	}

	STB.prototype.create = function(autonomous)
	{
		this.autonomous = autonomous;
		
		signal.reset();
		railCrossing.reset();
		
		//for repeating paths, clone the starting waypoint and add it to the end to complete a cyclic path
		//we're done adding waypoints, so now we need to 'close the loop' for those entities who repeat
		for (var entity_num in this.entities)
		{
			var isSubject = (entity_num == this.ownshipID) && (!autonomous);
			if (isSubject == false)
			{
				this.entities[entity_num].closeLoop();
			}
		}
		
		//pre-compute possible collisions for all entities
		this.calculateCollisions(autonomous);
		
		//create all the entities and join their paths
		for (var entity_num in this.entities)
		{
			var isSubject = (entity_num == this.ownshipID) && (!autonomous);
			this.entities[entity_num].create(isSubject);
		}
	}
	
	STB.prototype.join = function(autonomous)
	{
		//create all the entities and join their paths
		for (var entity_num in this.entities)
		{
			var isSubject = (entity_num == this.ownshipID) && (!autonomous);
			this.entities[entity_num].join(isSubject);
		}
	}
	
	STB.prototype.update = function()
	{
		for (var entity_num in this.entities)
		{
			var isSubject = (entity_num == this.ownshipID) && (!this.autonomous);
			if (isSubject == false)
			{
				this.entities[entity_num].updateCollisions(this.ownshipID, this.autonomous);
			}
		}
		
		for (var entity_num in this.entities)
		{
			this.entities[entity_num].update(this.entities);
		}
	}

	STB.prototype.end = function()
	{
		for (var entity_num in this.entities)
		{
			var this_entity = this.entities[entity_num];
			while(this_entity)
			{
				var old_entity = this_entity;
				this_entity.destroy();
				this_entity = this_entity.nextEntity;
				delete old_entity;
			}
		}
		
		vehicleLogic.setMachineState("numOccupants", 0);
		var audio = simCreatorUtil.getComponent("Audio");
		if (audio)
		{
			if (audio.PassengerConversation)
			{
				audio.PassengerConversation[0] = 0;
			}
			if (audio.FightOnBus)
			{
				audio.FightOnBus[0] = 0;
			}
		}
		signal.reset();
		railCrossing.reset();
		this.setEnvironment(0, 0, 0, 0, 0, 2, 0, 0);
	}

	return STB;
	
});
