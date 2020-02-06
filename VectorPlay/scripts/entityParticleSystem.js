define(['require', 'utils/particleSystem', 'utils/particleEffect'], function (require, ParticleSystem, ParticleEffect) {

	function createEntitySimple(profile, datum)
	{
		var type = profile.getType();
		
		if ((type == "Vehicle") && (Scenario.getAvailableEntities(VEHICLE) > 0))
		return Scenario.createVehicle(profile, datum);
		
		if ((type == "Object") && (Scenario.getAvailableEntities(OBJECT) > 0))
		return Scenario.createObject(profile, datum);
		
		if ((type == "Actor") && (Scenario.getAvailableEntities(ACTOR) > 0))
		return Scenario.createActor(profile, datum);
		
		return null;
	}
	
	function getVehicleSize(profile)
	{
		var fb = profile.getParameter("DistToFrontBumper") 	|| "0.1";
		var ls = profile.getParameter("DistToLeftSide") 		|| "0.1";
		var rb = profile.getParameter("DistToRearBumper") 	|| "0.1";
		var rs = profile.getParameter("DistToRightSide") 		|| "0.1";
		
		var maxBumper = Math.max(parseFloat(fb), parseFloat(rb));
		//var maxSide = Math.max(parseFloat(ls), parseFloat(rs));
		
		return maxBumper//Math.max(maxBumper, maxSide);
	}
	
	function SortSize(a,b)
	{
		var sizeA = getVehicleSize(a);
		var sizeB = getVehicleSize(b);
		
		if (sizeA < sizeB)
			return -1;
			
		if (sizeA > sizeB)
			return 1;
			
		return 0;
	}

	function getProfiles(profileSetName)
	{
		var typeProfiles = new Array();
		
		var profileSet = Scenario.getEntityProfileSet(profileSetName);
		if (profileSet == null)
		{
			print("LoadModels Error: EntityProfileSet named " + profileSetName + " does not exist!");
			return typeProfiles;
		}
		
		var profiles = profileSet.getProfiles();
		if (profiles == null)
		{
			print("LoadModels Error: Unable to get profiles from EntityProfileSet");
			return typeProfiles;
		}
		
		//[className, profiles]
		var entityKeys = new Array();
		var classProfiles = new Object();
		
		for (var i in profiles)
		{
			var profile = profiles[i];
			if (profile)
			{
				if (classProfiles[profile.getClassName()] == undefined)
				{
					classProfiles[profile.getClassName()] = new Array();
					entityKeys.push(profile.getClassName());
				}
				
				classProfiles[profile.getClassName()].push(profile);
			}
		}
		
		print(profileSetName + " has " + entityKeys.length + " classes in it.");
		
		entityKeys.sort(SortString);
		
		for (var i in entityKeys)
		{
			classProfiles[entityKeys[i]].sort(SortName);
			
			print("    " + entityKeys[i] + " has " + classProfiles[entityKeys[i]].length + " profiles in it.");
			
			typeProfiles = typeProfiles.concat(classProfiles[entityKeys[i]]);
		}
		
		return typeProfiles;
	}

	function EntityParticleSystem()
	{
		this.m_lastBirthV = 0;
		this.m_lastBirthO = 0;
		this.m_lastBirthA = 0;
		
		this.m_entityCountV = 0;
		this.m_entityCountO = 0;
		this.m_entityCountA = 0;
		
		this.m_totalCountV = 0;
		this.m_totalCountO = 0;
		this.m_totalCountA = 0;
		
		this.m_startPosition = 0;
		if (Scenario.getRouteLength())
		{
			this.m_startPosition = GetPosition(Scenario.Subject)+100;
		}

		this.m_particleSystem = new ParticleSystem();

		this.m_profilesV = getProfiles("VehicleDB").sort(SortSize);
		this.m_profilesO = getProfiles("ObstacleDB");
		this.m_profilesA = getProfiles("MovingObjectDB");
		
		//this.m_profilesA = this.m_profilesA.concat(this.m_profilesO.splice(0, this.m_profilesO.length / 2));
		//this.m_profilesA.offset = true;
		
		
		var duration = 2.0;
		
		this.m_particleSystem.addNewEffect(new ParticleEffect(this, this.m_profilesV, this.m_profilesV.length, duration));
		this.m_particleSystem.addNewEffect(new ParticleEffect(this, this.m_profilesO, this.m_profilesO.length, duration));
		this.m_particleSystem.addNewEffect(new ParticleEffect(this, this.m_profilesA, this.m_profilesA.length, duration));
		
		this.m_datum = new Scenario.SpatialDatum("entity particle system datum");
	}

	//helper function for creating entities
	EntityParticleSystem.prototype.checkPool=function(type)
	{
		var cap = 0.5;
		var num = 100;
		if (Scenario.getRouteLength() > 0)
		{
			cap = 0.25;
			num = 10;
		}
		
		if ((type == "Vehicle") && (this.m_entityCountV < num) && ((Scenario.getTime() - this.m_lastBirthV) > cap)) return true;
		if ((type == "Object")  && (this.m_entityCountO < num) && ((Scenario.getTime() - this.m_lastBirthO) > cap)) return true;
		if ((type == "Actor")   && (this.m_entityCountA < num) && ((Scenario.getTime() - this.m_lastBirthA) > cap)) return true;
		
		return false;
	}

	//callback for creating entities
	EntityParticleSystem.prototype.birth=function(profiles)
	{
		if (profiles.length == 0)
		{
			Report(MSG_WARNING, "LoadModels Error: Ran out of profiles, this is bad!");
			return null;
		}
		
		var profile = profiles[0];
		if (profile)
		{
			if (this.checkPool(profile.getType()))
			{
				var aheadEnum = FORWARD;
				var aheadDist = 0.0;
				var spacing = 4.0;
				var aheadFurther = 20.0;
				
				var offset = 2.8;
				var heading = 0;
				var up = 0;
				
				if ((profile.getType() == "Vehicle") && (Scenario.getAvailableEntities(VEHICLE) > 0))
				{
					aheadDist = this.m_startPosition + this.m_totalCountV * spacing + aheadFurther;
					offset = offset * 2;
					heading = -135;
					up = 10;
				}
				else if ((profile.getType() == "Object") && (Scenario.getAvailableEntities(OBJECT)  > 0))
				{
					aheadDist = this.m_startPosition + this.m_totalCountO * spacing + aheadFurther;
					if (profile.getClassName() == "Parked Vehicles")
						offset = offset * -2;
					else
						offset = offset * -1;
					heading = 135;
					
					if ((profile.getClassName() == "Wreckage") || (profile.getClassName() == "Building"))
						up = 80;
				}
				else if ((profile.getType() == "Actor") && (Scenario.getAvailableEntities(ACTOR)   > 0))
				{
					aheadDist = this.m_startPosition + this.m_totalCountA * spacing + aheadFurther;
					offset = offset * 1;
					heading = -135;
					up = -10;
				}
				else
				{
					return;
				}
				
				if (Scenario.getRouteLength() > 0)
				{
					aheadDist -= GetPosition(Scenario.Subject);
					
					//check to make sure there is enough room on the route front and back
					var hasRoom = true;
					if (aheadDist > 0)
					{
						hasRoom = (aheadDist < Scenario.getRouteLength());
					}
					else
					{
						hasRoom = (aheadDist >  0);
					}
					
					if (!hasRoom)
					{
						Report(MSG_WARNING, "LoadModels Error: Not enough room on the route (either ahead or behind) to create the vehicle!");
						return false;
					}
					
					aheadEnum = ROUTE_AHEAD;
				}
				else
				{
					aheadDist = 0;
				}
				
				print("attempts to create an entity : " + profile.getName());
				
				// if (profile.getName() == "Signal Man")
				// {
				// var profileSet = Scenario.getEntityProfileSet("MovingObjectDB");
				// var profile = profileSet.getProfile("Construction Worker");
				// }
				
				this.m_datum.move(Scenario.Subject);
				this.m_datum.move(aheadEnum, aheadDist);
				this.m_datum.move(RIGHT, offset);
				
				var entity = createEntitySimple(profile, this.m_datum);
				if (entity == null)
				{
					Report(MSG_WARNING, "LoadModels Error: Failed to create entity!");
					return null;
				}
				
				entity.setHeading(entity.getHeading() + heading);
				
				entity.m_aheadDist = aheadDist;
				entity.m_aheadEnum = aheadEnum;
				entity.m_offset = offset;
				entity.m_heading = heading;
				entity.m_up = up;
				
				if (profile.getType() == "Vehicle")
				{
					this.m_lastBirthV = Scenario.getTime();
					this.m_entityCountV++;
					this.m_totalCountV++;
				}
				
				if (profile.getType() == "Object")
				{
					this.m_lastBirthO = Scenario.getTime();
					this.m_entityCountO++;
					this.m_totalCountO++;
				}
				
				if (profile.getType() == "Actor")
				{
					this.m_lastBirthA = Scenario.getTime();
					this.m_entityCountA++;
					this.m_totalCountA++;
				}
				
				
				profiles.splice(0, 1);
				
				print("num profiles left: " + profiles.length);
				
				
				return entity;
			}
		}
	}

	//callback for destroying entities
	EntityParticleSystem.prototype.death=function(entity)
	{
		var profile = entity.getProfile();
		if (profile)
		{
			var type = profile.getType();
			
			if (type == "Vehicle") this.m_entityCountV--;
			if (type == "Object") this.m_entityCountO--;
			if (type == "Actor") this.m_entityCountA--;
		}
		
		DestroyEntity(entity);
	}

	//callback for updating entities
	EntityParticleSystem.prototype.update=function(profiles, entity, slew)
	{
		var aheadDist = entity.m_aheadDist;
		var up = entity.m_up;
		var offset = 10 + up / 2.0;
		
		entity.move(Scenario.Subject);
		entity.move(FORWARD, 20 + up);
		entity.move(LEFT, (offset * 2) - (slew * (offset * 4)));
		
		var spin = 360;
		
		if (up < -5) spin = 540;
		
		entity.setHeading(entity.getHeading() + slew * spin);
	}
	
	EntityParticleSystem.prototype.isComplete=function()
	{
		this.m_particleSystem.update();
		return this.m_particleSystem.isComplete();
	}
	
	EntityParticleSystem.prototype.leave=function()
	{
		delete this.m_datum;
	}
	
	EntityParticleSystem.prototype.cancel=function()
	{
		delete this.m_datum;
		this.m_particleSystem.cancel();
	}
	
	return EntityParticleSystem;
	
});