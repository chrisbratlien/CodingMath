define(['require'], function (require) {

	var exports = {};

	function DefaultEntityData()
	{
		this.paramVelRelationship="Absolute";
		this.paramVelocity=20;
		this.paramDistanceControl="Off";
		this.paramFrontBack="Front";
		this.paramStartDist=100;
		this.paramDirection="With";
		this.paramLaneDistance="Lane";
		this.paramDesiredLane=LANE_RIGHTMOST;
		this.paramOffset=1.875;
		this.paramDistributionSet = "AmbTraffic";
		this.paramType="VW Golf Gold";
		this.paramDatum=Scenario.Subject;
		
		this.useSmarts=0;
	}


	//data structure to hold the entity information
	function EntityData(velRelationship, velocity, distanceControl, 
	frontBack, startDist, direction, 
	laneDistance, desiredLane, offset, profileType)
	{
		this.paramVelRelationship=velRelationship;
		this.paramVelocity=velocity;
		this.paramDistanceControl=distanceControl;
		this.paramFrontBack=frontBack;
		this.paramStartDist=startDist;
		this.paramDirection=direction;
		this.paramLaneDistance=laneDistance;
		this.paramDesiredLane=desiredLane;
		this.paramOffset=offset;
		this.paramType=profileType;

		this.useSmarts=0;
	}


	PlaceVehicle=function(entity,entityData,datumAhead,heading)
	{
		if (entityData.paramLaneDistance == "Lane")
		{
			entity.move(datumAhead.getDatumAt(LANE, entityData.paramDesiredLane));
		}
		else if (entityData.paramLaneDistance == "Offset")
		{
			entity.move(datumAhead.getDatumAt(ROUTEOFFSET, entityData.paramOffset));
		}
		else
		{
			entity.move(datumAhead);
		}
		
		var roadHeading = entity.getRouteHeading();
		
		if (heading > 0)
		{
			entity.setHeading(roadHeading);
		}
		else
		{
			entity.setHeading(roadHeading + 180);
		}
		
		if ((entityData.paramType == "LRV") || (entityData.paramType == "York Region Transit 40' Bus"))
		{
			if (entityData.paramDesiredLane == LANE_ONCOMING_LEFTMOST)
			{
				entity.join(-1);
			}
			else
			{
				entity.join(1);
			}
		}
		else
		{
			entity.join();
		}
		
		//for distance placement, keep the vehicle at that offset - setRoadOffset is always relative to the vehicle
		if (entityData.paramLaneDistance == "Offset")
		{
			entity.setRoadOffset(RAMP, Math.abs(entityData.paramOffset), 0);
		}
		
	};


	//this function takes the stored data and results in a Scenario.Entity that meets our needs
	exports.createActor = function(profileName, datum)
	{
		//make sure there are enough entities in the vehicle pool to support another vehicle
		if (Scenario.getAvailableEntities(ACTOR) == 0)
		{
			Report(MSG_WARNING, "There are not enough actors available, actor will not be placed!!!");
			return null;
		}
		
		var profileSet = Scenario.getEntityProfileSet("MovingObjectDB");
		var profile = profileSet.getProfile(profileName);
		
		return Scenario.createActor(profile, datum);
	}

	CreateObject=function(profileName, datum)
	{
		//make sure there are enough entities in the vehicle pool to support another vehicle
		if (Scenario.getAvailableEntities(OBJECT) == 0)
		{
			Report(MSG_WARNING, "There are not enough objects available, object will not be placed!!!");
			return null;
		}
		
		var profileSet = Scenario.getEntityProfileSet("ObstacleDB");
		var profile = profileSet.getProfile(profileName);
		
		var obj = Scenario.createObject(profile, Scenario.Subject);
		
		obj.move(datum);
		
		return obj;
	}


	//simplified function for creating vehicles on the route, either with or against it
	CreateParkedVehicle=function(profileName, aheadDist)
	{
		//check to make sure there is enough room on the route front and back
		var hasRoom = true;
		if (aheadDist > 0)
		{
			hasRoom = (Scenario.Subject.getRoutePosition() + aheadDist) < Scenario.getRouteLength();
		}
		else
		{
			hasRoom = (Scenario.Subject.getRoutePosition() + aheadDist) >  0;
		}
		
		if (!hasRoom)
		{
			Report(MSG_WARNING, "CreateParkedVehicle Error: Not enough room on the route (either ahead or behind) to create the vehicle!");
			return null;
		}
		
		//make sure there are enough entities in the vehicle pool to support another vehicle
		if (Scenario.getAvailableEntities(VEHICLE) == 0)
		{
			Report(MSG_WARNING, "CreateParkedVehicle Error: There are not enough vehicles available, vehicle will not be placed!");
			return null;
		}
		
		var vehProfile = null;
		if (profileName == "")
		{
			var profileSet = Scenario.getEntityProfileSet("VehicleDB", "AmbTraffic");
			if (profileSet == null)
			{
				Report(MSG_WARNING, "CreateParkedVehicle Error: EntityProfileSet named VehicleDB:AmbTraffic does not exist!");
				return null;
			}
			vehProfile = profileSet.getProfile();
		}
		else
		{
			var profileSet = Scenario.getEntityProfileSet("VehicleDB");
			if (profileSet == null)
			{
				Report(MSG_WARNING, "CreateParkedVehicle Error: EntityProfileSet named VehicleDB does not exist!");
				return null;
			}
			
			vehProfile = profileSet.getProfile(profileName);
		}
		
		if (vehProfile == null)
		{
			Report(MSG_WARNING, "CreateParkedVehicle Error: EntityProfile named " + profileName + " does not exist!");
			return null;
		}

		//it is recommended to create the entity sooner than later to be moving around a vehicle rather than a spatial datum
		var veh = Scenario.createVehicle(vehProfile, Scenario.Subject);
		var datumAhead = Scenario.Subject.getDatumAt(ROUTE_AHEAD, aheadDist);
		veh.move(datumAhead.getDatumAt(RIGHT, 3.5));
		
		return veh;
	}


	CreateEntitySimple=function(profile, datum)
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


	//simplified function for creating vehicles on the route, either with or against it
	CreateVehicleSimple=function(profileName, aheadDist, lane, desiredVelocity)
	{
		//check to make sure there is enough room on the route front and back
		var hasRoom = true;
		if (aheadDist > 0)
		{
			hasRoom = (Scenario.Subject.getRoutePosition() + aheadDist) < Scenario.getRouteLength();
		}
		else
		{
			hasRoom = (Scenario.Subject.getRoutePosition() + aheadDist) >  0;
		}
		
		if (!hasRoom)
		{
			Report(MSG_WARNING, "CreateVehicleSimple Error: Not enough room on the route (either ahead or behind) to create the vehicle!");
			return null;
		}
		
		//make sure there are enough entities in the vehicle pool to support another vehicle
		if (Scenario.getAvailableEntities(VEHICLE) == 0)
		{
			Report(MSG_WARNING, "CreateVehicleSimple Error: There are not enough vehicles available, vehicle will not be placed!");
			return null;
		}
		
		var vehProfile = null;
		if (profileName == "")
		{
			var profileSet = Scenario.getEntityProfileSet("VehicleDB", "AmbTraffic");
			if (profileSet == null)
			{
				Report(MSG_WARNING, "CreateVehicleSimple Error: EntityProfileSet named VehicleDB:AmbTraffic does not exist!");
				return null;
			}
			vehProfile = profileSet.getProfile();
		}
		else
		{
			var profileSet = Scenario.getEntityProfileSet("VehicleDB");
			if (profileSet == null)
			{
				Report(MSG_WARNING, "CreateVehicleSimple Error: EntityProfileSet named VehicleDB does not exist!");
				return null;
			}
			
			vehProfile = profileSet.getProfile(profileName);
		}
		
		if (vehProfile == null)
		{
			Report(MSG_WARNING, "EntityProfile named " + profileName + " does not exist!");
			return null;
		}

		//it is recommended to create the entity sooner than later to be moving around a vehicle rather than a spatial datum
		var datumAhead = Scenario.Subject.getDatumAt(ROUTE_AHEAD, aheadDist);
		
		var actualDist = GetPosition(datumAhead) - GetPosition(Scenario.Subject);
		if (Math.abs(aheadDist - actualDist) > 1.0)
		{
			print("bad spot in database");
			return null;
		}
		
		var veh = Scenario.createVehicle(vehProfile, datumAhead);
		if (veh)
		{
			if (veh.onRoad())
			{
				PlaceVehicleSimple(veh, lane, desiredVelocity);
				
				if (veh.getLane() == 0)
				{
					Report(MSG_WARNING, "CreateVehicleSimple Error: vehicle created in a bad spot, getLane() returning 0!");
					Scenario.destroyEntity(veh);
					return null;
				}
				
				return veh;
			}
			
			Scenario.destroyEntity(veh);
		}
		
		return null;
	}

	PlaceVehicleSimple=function(veh, lane, desiredVelocity)
	{
		if (veh != null)
		{
			veh.move(ROUTELANE, lane);
			veh.move(AHEAD, 0.01);

			var profileName = veh.getProfile().getName();
			if ((profileName == "LRV") || (profileName == "Street Car") || (profileName == "York Region Transit 40' Bus") || (profileName == "York Police Rail"))
			{
				var oncoming = ((lane == LANE_ONCOMING_LEFTMOST) ||
				(lane == LANE_ONCOMING_MIDDLE) ||
				(lane == LANE_ONCOMING_RIGHTMOST) ||
				(lane == LANE_ONCOMING_SIDEWALK));

				if (oncoming)
				{
					veh.join(-1);
				}
				else
				{
					veh.join(1);
				}
			}
			else
			{
				veh.join();
				
				veh.setDesiredLane(lane);
				veh.setDesiredTurn(CONTINUE_STRAIGHT);
			}
			
			//veh.setVelocityOnce(desiredVelocity);
			veh.setDesiredVelocity(VELOCITY_FIXED, desiredVelocity);
		}
	}

	//this function takes the stored data and results in a Scenario.Entity that meets our needs
	CreateVehicle=function(entityData)
	{
		//make sure there are enough entities in the vehicle pool to support another vehicle
		if (Scenario.getAvailableEntities(VEHICLE) == 0)
		{
			Report(MSG_WARNING, "There are not enough vehicles available, vehicle will not be placed!!!");
			return null;
		}
		
		var profileSet = Scenario.getEntityProfileSet("VehicleDB", entityData.paramDistributionSet);
		var behaviorSet = Scenario.getEntityBehaviorProfileSet("DriverDB");
		
		var vehProfile = null;
		if (entityData.paramType == "")
		{
			vehProfile = profileSet.getProfile();
		}
		else
		{
			vehProfile = profileSet.getProfile(entityData.paramType);
		}
		
		
		var aveBehavior = behaviorSet.getProfile("Average");
		
		var frontBack = 0; //the positioning of the vehicle relative to the ownship
		if (entityData.paramFrontBack == "Front")
		{
			frontBack = 1;
		}
		else
		{
			frontBack = -1;
		}
		
		var withTraffic = 0; //determine which way the vehicle goes relative to traffic in its lane
		if (entityData.paramDirection == "With")
		{
			withTraffic = 1;
		}
		else
		{
			withTraffic = -1;
		}
		
		var roadSide = 0; //road side relative to ownship
		if (entityData.paramLaneDistance == "Lane")
		{
			switch(entityData.paramDesiredLane)
			{
			case LANE_LEFTMOST:// - The left most lane on the road
			case LANE_MIDDLE:// - The middle most lane on the road. Middle lane is the right lane on a 2-lane road
			case LANE_RIGHTMOST:// - The right most lane on right side of the road
			case LANE_SIDEWALK:// - The sidewalk on the right side of the road
			case LANE_LEFTTURN:// - Intersection left turn lane
			case LANE_STRAIGHT:// - Intersection continue stright
			case LANE_RIGHTTURN:// - Intersection right turn lane
				roadSide = 1;
				break;
				
			case LANE_ONCOMING_LEFTMOST:// - The inside lane on the left side of the road
			case LANE_ONCOMING_MIDDLE:// - Middle lane is the right lane on a 2-lane road
			case LANE_ONCOMING_RIGHTMOST:// - The outside lane on the left side of the road
			case LANE_ONCOMING_SIDEWALK:// - The sidewalk on the left side of the road
				roadSide = -1;
				break;
				
			default:// - All others considered right side of the road
				roadSide = 1;
				break;
			}
		}
		else if (entityData.paramLaneDistance == "Offset")
		{
			if (entityData.paramOffset >= 0)
			{
				roadSide = 1;
			}
			else
			{
				roadSide = -1;
			}
		}
		
		var datumAhead = entityData.paramDatum.getDatumAt(GetAheadEnum(), entityData.paramStartDist * frontBack);
		var entity = Scenario.createVehicle(vehProfile, /*aveBehavior, */datumAhead);
		
		if (withTraffic > 0) //Case #1: With Traffic, Lane Specified
		{
			PlaceVehicle(entity, entityData, entity, roadSide);
			
			if (entityData.paramLaneDistance != "Offset")
			{
				if ((entityData.paramType != "LRV") || (entityData.paramType == "York Region Transit 40' Bus"))
					entity.setDesiredLane(entityData.paramDesiredLane);
			}
			
			//print("Case #1: With Traffic");
		}
		else //against traffic
		{
			//place the vehicle where it should be if it were going WITH traffic
			PlaceVehicle(entity, entityData, entity, -roadSide);
			
			//remember the lane and road offset
			var targetLane = entity.getLane();
			var targetOffset = entity.getRoadOffset();
			
			//now join the closest 'WITH TRAFFIC' lane instead
			
			// Move to yourself so join will work again
			entity.move(entity);
			
			if(targetLane>0)
			{
				entity.join(-1);
				
				if ((entityData.paramType != "LRV") || (entityData.paramType == "York Region Transit 40' Bus"))
					entity.setDesiredLane(1);
			}
			else
			{
				entity.join(1);
				
				if ((entityData.paramType != "LRV") || (entityData.paramType == "York Region Transit 40' Bus"))
					entity.setDesiredLane(1);
			}
			
			if ((entityData.paramType != "LRV") || (entityData.paramType == "York Region Transit 40' Bus"))
				entity.setRoadOffset(RAMP, -1 * Math.abs(targetOffset), 0);
			
			//print("Case #2: Against Traffic");
		}
		
		var vel = entityData.paramVelocity;
		if(entityData.paramVelRelationship == "Relative")
		{
			vel += Scenario.Subject.getVelocity();
		}
		
		this.useSmarts = 0;
		if ((withTraffic > 0) && (entityData.paramDistanceControl == "On"))
		{
			this.useSmarts = 1;
		}
		else
		{
			this.useSmarts = -1;
		}
		
		//set the distance control (smarts for avoiding traffic participants) and velocity
		if(this.useSmarts > 0)
		{
			entity.setVelocityOnce(vel);
			entity.setDesiredVelocity(VELOCITY_FIXED, vel);
		}  
		else
		{
			entity.setVelocity(vel);
		}
		
		//entity.dump();
		return entity;
	}


	exports.releaseActor = function(entity)
	{
		if (entity != null)
		entity.release();
	}


	ReleaseVehicle=function(entity)
	{
		if (entity != null)
		entity.release();
	}

	exports.destroyEntity = function(entity)
	{
		if (entity != null)
		Scenario.destroyEntity(entity);
	}


	return exports;

});
