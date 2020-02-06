define(['require'], function (require) {

	var exports = {};
	
	var datum = new Scenario.SpatialDatum("query datum");
	
	function getLanesPosition()
	{
		for (var i = 0; i < 8; i++)
		{
			{
				datum.move(LANE, i);
				var rp = datum.getRoutePosition();
				if (rp != 0)
					return rp;
			}
			{
				datum.move(LANE, -i);
				var rp = datum.getRoutePosition();
				if (rp != 0)
					return rp;
			}
		}
		
		return 0;
	}
	
	//road map is an ordered mapping of road names associated with the road's route position
	//when a rail-route is placed in exacct, use the road utils version
	exports.getRoadMap = function()
	{
		var roadMap = {};
		
		if (Scenario.getRouteLength() > 0)
		{
			var route = Scenario.getRoute();
			if (route.length > 0)
			{
				var routeLength = -route[0][1];
				datum.move(Scenario.getRoadOnRoute(0));
				
				for (var i = 0; i < Scenario.getNumRoadsOnRoute(); ++i)
				{
					var road = Scenario.getRoadOnRoute(i);
					if (road)
					{
						if (roadMap[road.name] === undefined)
						{
							//extend the route by the length of the road plus any gap from intersections
							roadMap[road.name] = {alongRoute : true, position : routeLength + road.getDistance2D(datum)};
							
							routeLength = (roadMap[road.name].position + road.getLength());
							
							datum.move(road);
							datum.move(ROADPOSITION, road.getLength());
						}
					}
				}
			}
		}
		
		return roadMap;
	}
	
	exports.getRoadsAlongRoute = function()
	{
		var roads = Scenario.getRoadsOnRoute();
		var roadsAlongRoute = [];
		
		for (var i in roads)
		{
			if (roads[i].getType() == 5)
			{
				continue;
			}
			
			var roadLength = roads[i].getLength();
			if (roadLength > 6.0)
			{
				datum.move(roads[i]);
				datum.move(ROADPOSITION, 3.0);
				
				var startPos = getLanesPosition();
				
				datum.move(ROADPOSITION, roads[i].getLength() - 3.0);
				
				var endPos = getLanesPosition();
				
				if ((startPos != 0) && (endPos != 0))
				{
					var routeLength = Math.abs(endPos - startPos);
					
					//if (Math.abs(routeLength - roadLength) < 50)
					{
						roadsAlongRoute.push({road : roads[i], alongRoute : (endPos > startPos), position : Math.min(startPos, endPos)});
						//print("road : " + roads[i].name + ", [" + startPos + ", " + endPos + "]");
					}
				}
			}
		}
		
		roadsAlongRoute.sort(function(x, y) { return x.position - y.position; });
		
		if (roadsAlongRoute.length > 0)
		{
			var routeLength = roadsAlongRoute[0].position;
			datum.move(roadsAlongRoute[0].road);
			
			var roadMap = {};
			
			//figure out where each road's route position is, 
			//since I had to rely on the getRoutePosition, 
			//might as well do the same thing here.
			
			for (var i in roadsAlongRoute)
			{
				var road = roadsAlongRoute[i].road;		
				var alongRoute = roadsAlongRoute[i].alongRoute;
				
				if (roadMap[road.name] === undefined)
				{
					datum.move(road);
					datum.move(ROADPOSITION, 3.0);
					
					var routePosition = getLanesPosition();
					if (routePosition)
					{
						if (alongRoute)
						{
							roadMap[road.name] = {alongRoute : alongRoute, position : datum.getRoutePosition() - 3.0};
						}
						else
						{
							roadMap[road.name] = {alongRoute : alongRoute, position : datum.getRoutePosition() + 3.0};
						}
						
						print("roadMap : " + road.name + ", [" + roadMap[road.name].position + "], " + alongRoute);
					}
				}
			}
			
			return roadMap;
		}
	}
	
	
	exports.getPosition = function(entity)
	{
		//return entity.getRoutePosition();
		return entity.getRoadPosition();
	}
	
	exports.getRoadPosition = function(entity)
	{
		return entity.getRoadPosition();
	}
	
	//returns true if road is with route, false for against it
	exports.determineDirection = function(road)
	{
		//hacked out for SafetyCity, changing this method will break maneuvres for Safety City
		
		//datum.move(road).move(AHEAD, 1.0);
		//return (this.getPosition(road) < this.getPosition(datum));
		return true;
	}

	exports.getRoadStart = function(road)
	{
		if (this.determineDirection(road))
		{
			return Math.min(Math.max(GetPosition(road), 0.0), Scenario.getRouteLength());
		}
		else
		{
			return Math.min(Math.max(GetPosition(road) - road.getLength(), 0.0), Scenario.getRouteLength());
		}
	}

	exports.getRoadEnd = function(road)
	{
		if (!this.determineDirection(road))
		{
			return Math.min(GetPosition(road), Scenario.getRouteLength());
		}
		else
		{
			return Math.min(GetPosition(road) + road.getLength(), Scenario.getRouteLength());
		}
	}

	exports.getNextRoad = function(ic, currentRoad)
	{
		//I believe there is a bug that prevents road.getRoutePosition()
		//from returning a good value until something drives on it first??
		
		var straightRoad = ic.getRoad(currentRoad, CONTINUE_STRAIGHT);
		if (straightRoad != null)
		{
			if (GetPosition(straightRoad) > 0)
			{
				return straightRoad;
			}
		}
		
		var leftRoad = ic.getRoad(currentRoad, TURN_LEFT);
		if (leftRoad != null)
		{
			if (GetPosition(leftRoad) > 0)
			{
				return leftRoad;
			}
		}
		
		var rightRoad = ic.getRoad(currentRoad, TURN_RIGHT);
		if (rightRoad != null)
		{
			if (GetPosition(rightRoad) > 0)
			{
				return rightRoad;
			}
		}
		
		return null;
	}


	exports.getIntersectionSize = function(entity)
	{
		//this function assumes you're not in the intersection, it returns a size otherwise a -1
		
		var currentRoad = entity.getRoad();
		if (currentRoad == null)
		{
			print("GetIntersectionSize Error : entity is not on a road, perhaps in an intersection.");
			return -1;
		}
		
		var ic = entity.getIntersectionController();
		if (ic == null)
		{
			print("GetIntersectionSize Error : No Intersection Controller ahead of entity.");
			return -1;
		}
		
		var nextRoad = this.getNextRoad(ic, currentRoad);
		if (nextRoad == null)
		{
			print("GetIntersectionSize Error : Unable to find the next road after the intersection.");
			return -1;
		}
		
		return GetRoadStart(nextRoad) - GetRoadEnd(currentRoad);
	}

	exports.moveToNextRoad = function(entity, lane)
	{
		//this function assumes you're not in the intersection, it returns a size otherwise a -1
		
		var currentRoad = entity.getRoad();
		if (currentRoad == null)
		{
			print("MoveToNextRoad Error : entity is not on a road, perhaps in an intersection.");
			return -1;
		}
		
		if ((lane == LANE_ONCOMING_LEFTMOST) && (GetRoadStart(currentRoad) <= 0))
		{
			print("MoveToNextRoad Error : There are no more roads before this on the current route.");
			return -1;
		}
		
		if ((lane == LANE_LEFTMOST) && (GetRoadEnd(currentRoad) >= Scenario.getRouteLength()))
		{
			print("MoveToNextRoad Error : There are no more roads beyond this on the current route.");
			return -1;
		}
		
		var ic = entity.getIntersectionController();
		if (ic == null)
		{
			print("MoveToNextRoad Error : No Intersection Controller ahead of entity.");
			return -1;
		}
		
		var nextRoad = this.getNextRoad(ic, currentRoad);
		if (nextRoad == null)
		{
			print("uh oh - tell rich that road.getRoutePosition() returns zero unless someone drives it first??");
			
			//assume that the intersection is not larger than 40 meters
			var bestGuess = GetRoadEnd(currentRoad) + 40;
			if (bestGuess < Scenario.getRouteLength())
			{
				var datumAhead = Scenario.Subject.getDatumAt(ROUTE_AHEAD, bestGuess - GetPosition(Scenario.Subject));
				entity.move(datumAhead);
				
				entity.move(ROUTELANE, lane);
				
				nextRoad = this.getNextRoad(ic, currentRoad);
			}
		}
		
		if (nextRoad == null)
		{
			print("MoveToNextRoad Error : Unable to find the next road after the intersection.");
			return -1;
		}
		
		var routePosition = (GetRoadEnd(nextRoad) - GetRoadStart(nextRoad)) / 2.0 + GetRoadStart(nextRoad);
		
		var datumAhead = Scenario.Subject.getDatumAt(ROUTE_AHEAD, routePosition - GetPosition(Scenario.Subject));
		entity.move(datumAhead);
		
		PlaceVehicleSimple(entity, lane, 0.0);
		
		return routePosition;
	}

	//returns a decent road for placing entities at the desired position
	exports.getRoad = function(position)
	{
		var minLength = 30;
		
		var lane = LANE_LEFTMOST;
		if (position < GetPosition(Scenario.Subject))
		{
			lane = LANE_ONCOMING_LEFTMOST;
		}
		
		//this function assumes you're not in the intersection, it returns a size otherwise a -1
		var currentRoad = Scenario.Subject.getRoad();
		if (currentRoad == null)
		{
			return null;
		}
		
		//base case, the road the subject is on is the ideal road
		if ((GetRoadEnd(currentRoad) - GetRoadStart(currentRoad)) > minLength)
		{
			if (((lane == LANE_LEFTMOST)          && (position < GetRoadEnd(currentRoad))) || 
					((lane == LANE_ONCOMING_LEFTMOST) && (position > GetRoadStart(currentRoad))))
			{
				print("returning subject's road");
				return currentRoad;
			}
		}
		
		var veh = CreateVehicleSimple(GetRandomProfile("VehicleDB", "One Vehicle"), 0.0, LANE_LEFTMOST, 0.0);
		if (veh != null)
		{
			print("created dummy vehicle");
			veh.setVisible(false);
			
			for (var i = 0; i < 10; i++)
			{
				var rtn = MoveToNextRoad(veh, lane);
				if (rtn > 0)
				{
					var nextRoad = veh.getRoad();
					if (nextRoad != null)
					{ 
						//only return roads that are longer than 30 meters
						//I dont use road.getLength() here because the road might be half on the route
						if ((GetRoadEnd(nextRoad) - GetRoadStart(nextRoad)) > minLength)
						{
							if (((lane == LANE_LEFTMOST)          && (position < GetRoadEnd(nextRoad))) || 
									((lane == LANE_ONCOMING_LEFTMOST) && (position > GetRoadStart(nextRoad))))
							{
								Scenario.destroyEntity(veh);
								return nextRoad;
							}
						}
					}
				}
				else
				{
					print("some type of error occurred with getting the next road");
					Scenario.destroyEntity(veh);
					return null;
				}
			}
			
			print("ran through the entire route and found nothing beyond that distance");
			Scenario.destroyEntity(veh);
			return null;
		}
	}


	exports.sortPosition = function(a, b)
	{
		return this.getPosition(b) - this.getPosition(a);
	}

	exports.sortVelocity = function(a, b)
	{
		return b.getVelocity() - a.getVelocity();
	}

	exports.getEntities = function(road, lane, sort)
	{
		var vehicles = null;
		var entities = road.getEntities();
		if (entities == null)
		{
			return null;
		}
		
		if (entities.length > 0)
		{
			
			for (var i in entities)
			{
				var entity = entities[i];
				if (entity.getProfile().getType() == "Vehicle")
				{
					if (entity.getLane() == lane)
					{
						if (vehicles == null)
						{
							vehicles = new Array();
						}
						
						vehicles.push(entity);
					}
				}
			}
		}
		
		if (vehicles)
		{
			vehicles.sort(sort);
			for (var i in vehicles)
			{
				//print(vehicles[i].getProfile().getName());
			}
		}
		
		return vehicles;
	}

	return exports;

});