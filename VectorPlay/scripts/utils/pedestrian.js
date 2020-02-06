define(['require', 'utils/road', 'utils/route', 'utils/entity', 'utils/logger'], function (require, roadUtils, routeUtils, entityUtils, logger) {

	//pedestrian manager class for the AmbientPed maneuver

	var datum = new Scenario.SpatialDatum("query datum");

	//the purpose of this file is to maintain a list of roads between the ownship and a specified radius
	function PedestrianManager(type, lane, height)
	{
		this.m_type = type;
		this.m_oncoming = ((lane == LANE_ONCOMING_LEFTMOST)  ||
											 (lane == LANE_ONCOMING_MIDDLE)    ||
											 (lane == LANE_ONCOMING_RIGHTMOST) ||
											 (lane == LANE_ONCOMING_SIDEWALK));
		this.zOffset = height || 0.0;
		
		this.m_segmentLength = 25.0;
		
		this.m_pathPool = new Array();
		this.m_pathPointQueue = new Array();    //path points
		this.m_activePathQueue = new Array();   //path objects here
		
		this.createPathPool(10);
		
		this.m_randomNumber = new Scenario.RandomGenerator();
		this.m_randomNumber.setRange(0, 3);
		
		this.m_lastPathPair = null;
		
		this.m_activeRoads = {};
		
		this.m_safetyCity = true;
		
		if (Scenario.getNumRoadsOnRoute())
		{
			if (Scenario.getRoadOnRoute(0).getQueryType() == 3)
			{
				//more work is required for rail-routes because we want information regarding non-rail roads (and their sidewalks)
				//ultimately we want to end up with a road map that corresponds to the rail-route as much as possible
				//This requires a design decision or best guess as to what to do.  I am going to:
				//     1) place an entity down, walking the route to query for the road map
				//then 2) assume that the subject will never travel down a road that is not in the road map
				//the road map position should be checked against the 'route' position to ensure no errors occur
				//when an error does occur, I should probably depend on scenario's route position
				
				this.m_safetyCity = false;
				
				this.m_roadMap = routeUtils.getRoadsAlongRoute();
				
				//add all the roads on the route to the active list
				for (var i in this.m_roadMap)
				{
					this.addRoad(Scenario[i]);
				}
			}
			else
			{
				var laneEnum = LANE_SIDEWALK;
				if (this.m_oncoming == routeUtils.determineDirection(Scenario.getRoadOnRoute(0)))
				{
					laneEnum = LANE_ONCOMING_SIDEWALK;
				}
				
				if (Scenario.getRoadOnRoute(0).hasSidewalk(laneEnum))
				{
					this.m_roadMap = routeUtils.getRoadsAlongRoute();
					this.m_safetyCity = false;
				}
				else
				{
					this.m_roadMap = routeUtils.getRoadMap();
				}
		
				//add all the roads on the route to the active list
				for (var i = 0; i < Scenario.getNumRoadsOnRoute(); ++i)
				{
					this.addRoad(Scenario.getRoadOnRoute(i));
				}
			}
		}
		
		this.m_roadMap = this.m_roadMap || {};
	}
	
	
	//this function returns the road that the subject is on
	//if the route is on a neighboring road, that road is returned instead
	PedestrianManager.prototype.getRouteRoad = function(entity)
	{
		var subjectRoad = entity.getRoad();
		var subjectLeft;
		var subjectLeftLeft;
		var subjectRight;
		var subjectRightRight;
		
		if (subjectRoad)
		{
			if (this.m_roadMap[subjectRoad.name] !== undefined)
			{
				return subjectRoad;
			}
			
			if (subjectRoad.getNeighborDirection(LEFT) == WITH)
			{
				subjectLeft = subjectRoad.getNeighbor(LEFT);
				if (subjectLeft)
				{
					if (this.m_roadMap[subjectLeft.name] !== undefined)
					{
						return subjectLeft;
					}
					if (subjectLeft.getNeighborDirection(LEFT) == WITH)
					{
						subjectLeftLeft = subjectLeft.getNeighbor(LEFT);
						if (subjectLeftLeft)
						{
							if (this.m_roadMap[subjectLeftLeft.name] !== undefined)
							{
								return subjectLeftLeft;
							}
						}
					}
				}
			}
			
			if (subjectRoad.getNeighborDirection(RIGHT) == WITH)
			{
				subjectRight = subjectRoad.getNeighbor(RIGHT);
				if (subjectRight)
				{
					if (this.m_roadMap[subjectRight.name] !== undefined)
					{
						return subjectRight;
					}
					if (subjectRight.getNeighborDirection(RIGHT) == WITH)
					{
						subjectRightRight = subjectRight.getNeighbor(RIGHT);
						if (subjectRightRight)
						{
							if (this.m_roadMap[subjectRightRight.name] !== undefined)
							{
								return subjectRightRight;
							}
						}
					}
				}
			}
		}
	}
	
	//this function returns an accurate route position based on the road map and the road position
	//getRouteRoad is used to resolve neighbouring roads that would mess the query up
	//if the subject is in an intersection, a route position of 0 is returned.
	PedestrianManager.prototype.getPosition = function(entity)
	{
		var routeRoad = this.getRouteRoad(entity);
		if (routeRoad)
		{
			if (this.m_roadMap[routeRoad.name] !== undefined)
			{
				if (this.m_roadMap[routeRoad.name].alongRoute)
				{
					return this.m_roadMap[routeRoad.name].position + entity.getRoadPosition();
				}
				else
				{
					return this.m_roadMap[routeRoad.name].position - entity.getRoadPosition();
				}
			}
		}
		
		if (!this.m_safetyCity)
		{
			return entity.getRoutePosition();
		}
		
		return 0;
	}

	PedestrianManager.prototype.update = function(radius)
	{
		//check to see if the tail point set is behind ownship radius
		if (this.m_activePathQueue.length > 0)
		{
			var tailPos = this.m_activePathQueue[0].m_pathPoint.m_startPos;
			
			if ((this.getPosition(Scenario.Subject) - radius / 4.0) > tailPos)
			{
				this.releasePathPair(this.m_activePathQueue.shift().m_pathPair);
			}
		}
		
		if ((this.m_pathPool.length > 0) && (this.m_pathPointQueue.length > 0))
		{
			var pathPair = this.m_pathPool.shift();
			var pathPoint = this.m_pathPointQueue.shift();
			
			this.movePathPair(pathPair, pathPoint);
			this.actorPathPair(pathPair);
			
			if (this.m_activePathQueue.length > 0)
			{
				var prevPathPair = this.m_activePathQueue[this.m_activePathQueue.length - 1].m_pathPair;
				var prevPathPoint = this.m_activePathQueue[this.m_activePathQueue.length - 1].m_pathPoint;
				
				if (Math.abs(prevPathPoint.m_endPos - pathPoint.m_startPos) < 1.0)
				{
					this.connectPathPair(prevPathPair, pathPair);
				}
				else
				{
					print("failed to connect : " + prevPathPoint.m_endPos + " with " + pathPoint.m_startPos);
				}
			}
			
			this.m_activePathQueue.push({m_pathPair : pathPair, m_pathPoint : pathPoint});
		}
	}


	PedestrianManager.prototype.addRoad = function(road)
	{
		var roadLength = road.getLength();
		if (roadLength > 0)
		{
			if (this.m_activeRoads[road.name] === undefined)
			{
				this.m_activeRoads[road.name] = true;
				
				//Safety City use neighbour roads and do not have side-walks
				if (this.m_safetyCity)
					this.addPathPointsSC(road);
				else //Trian databases use lanes and have side-walks
					this.addPathPoints(road);
				
				//diff between these two functions to understand how the side-walk offsets are calculated
			}
		}
	}
	
	PedestrianManager.prototype.addPathPointsSC = function(road)
	{
		//instead of using 'road', use the rightmost road
		var neighborRoad = roadUtils.getNeighborRoad(road, this.m_oncoming);
		var neighborDist = roadUtils.getNeighborDistance(road, this.m_oncoming);
		
		var roadCount = roadUtils.countRoadsAcross(road);
		var hasMedian = roadUtils.hasMedian(road);
		var isOneWay = roadUtils.isOneWay(road);
		
		var parkingLane = 1.25;
		if (roadCount == 2)
		{
			if (!isOneWay && hasMedian)
			{
				parkingLane = 3.75;
			}
			else if (isOneWay && !hasMedian)
			{
				parkingLane = 5;
			}
		}
		if ((roadCount == 3) && isOneWay)
		{
			if (this.m_oncoming && Math.abs(road.getHeading() - 180) < 10)
			{
				parkingLane = 5;
			}
			else if (!this.m_oncoming && Math.abs(road.getHeading()) < 10)
			{
				parkingLane = 5;
			}
		}
		
		var fudgeFactor = 0;
		var sidewalkOffset = neighborDist - parkingLane - 4;
		var oncomingOffset = neighborDist + parkingLane + 3.5;
		
		if (sidewalkOffset >= 0)
		{
			sidewalkOffset += fudgeFactor;
		}
		else
		{
			sidewalkOffset -= fudgeFactor;
		}
		
		if (oncomingOffset > 0)
		{
			oncomingOffset += fudgeFactor;
		}
		else
		{
			oncomingOffset -= fudgeFactor;
		}
		
		//create paths used for peds
		var alongRoute = !this.oncoming;//routeUtils.determineDirection(road); //hack because safety city is wacky
		var position = this.m_roadMap[road.name].position;
		
		var roadLength = road.getLength();
		var numPoints = Math.floor(roadLength / this.m_segmentLength);
		
		for (var i = 0; i < numPoints; ++i)
		{
			var roadPos0 = (roadLength * i) / numPoints;
			var roadPos1 = (roadLength * (i + 1)) / numPoints;
			var routePos0 = position + roadPos0;
			var routePos1 = position + roadPos1;
			
			if (!alongRoute)
			{
				roadPos0 = road.getLength() - roadPos0;
				roadPos1 = road.getLength() - roadPos1;
				routePos0 = position - roadPos0;
				routePos1 = position - roadPos1;
			}
			
			//print("road pos " + i + ": [" + roadPos0 + ", " + roadPos1 + "]");
			
			var dirHeading = 0.0;
			var offset = oncomingOffset;
			
			if (this.m_oncoming == alongRoute)
			{
				dirHeading = 180.0;
				offset = sidewalkOffset;
			}
			
			if (this.m_oncoming)
			{
				var oppositeFudgeFactor = 0.4;
				if (alongRoute)
					offset += oppositeFudgeFactor;
				else
					offset -= oppositeFudgeFactor;
			}
			
			var datumAhead0 = datum.move(road).move(AHEAD, roadPos0);
			var lateralDatum0 = datumAhead0.getDatumAt(RIGHT, offset);
			lateralDatum0.setHeading(lateralDatum0.getHeading() + dirHeading);
			
			//instead of using 'road', use the leftmost road
			
			var datumAhead1 = datum.move(road).move(AHEAD, roadPos1);
			var lateralDatum1 = datumAhead1.getDatumAt(RIGHT, offset);
			lateralDatum1.setHeading(lateralDatum1.getHeading() + dirHeading);
			
			if ((this.getPosition(Scenario.Subject) - this.m_segmentLength * 2) < routePos0)
			{
				//this is a hack to avoid a given intersection in the Toronto database
				//if ((this.m_ignoreDatum.getDistance(lateralDatum0) > 100) && 
				//		(this.m_ignoreDatum.getDistance(lateralDatum1) > 100))
				{
					this.m_pathPointQueue.push({m_start : lateralDatum0, m_end : lateralDatum1, m_startPos : routePos0, m_endPos : routePos1});
				}
			}
		}
	}
	
	PedestrianManager.prototype.addPathPoints = function(road)
	{
		//instead of using 'road', use the rightmost road
		
		//create paths used for peds
		var alongRoute = this.m_roadMap[road.name].alongRoute;
		var position = this.m_roadMap[road.name].position;
		
		var roadLength = road.getLength() - 0.4;  //cant go all the way to the end, the ODR manager queries wrong
		var numPoints = Math.floor(roadLength / this.m_segmentLength);
		
		for (var i = 0; i < numPoints; ++i)
		{
			var roadPos0 = (roadLength * i) / numPoints + 0.2;
			var roadPos1 = (roadLength * (i + 1)) / numPoints + 0.2;
			var routePos0 = position + roadPos0;
			var routePos1 = position + roadPos1;
			
			if (!alongRoute)
			{	
				roadPos0 = road.getLength() - roadPos0;
				roadPos1 = road.getLength() - roadPos1;
				routePos0 = position - roadPos0;
				routePos1 = position - roadPos1;
			}
			
			var laneEnum = LANE_SIDEWALK;
			if (this.m_oncoming == alongRoute)
			{
				laneEnum = LANE_ONCOMING_SIDEWALK;
			}
			
			var datumAhead0 = datum.move(road).move(LANE, 1).move(AHEAD, roadPos0);
			if (datumAhead0.hasSidewalk(laneEnum))
			{
				var sidewalkWidth0 = datumAhead0.getSidewalkWidth(laneEnum);
				
				if (sidewalkWidth0 > 1.0)
				{
					var lateralDatum0 = datumAhead0.getDatumAt(LANE, laneEnum);
					
					var datumAhead1 = datum.move(road).move(LANE, 1).move(AHEAD, roadPos1);
					if (datumAhead1.hasSidewalk(laneEnum))
					{
						var sidewalkWidth1 = datumAhead1.getSidewalkWidth(laneEnum);
						if (sidewalkWidth1 > 1.0)
						{
							var lateralDatum1 = datumAhead1.getDatumAt(LANE, laneEnum);
							
							if ((this.getPosition(Scenario.Subject) - this.m_segmentLength * 2) < routePos0)
							{
								this.m_pathPointQueue.push({m_start : lateralDatum0, m_end : lateralDatum1, m_startPos : routePos0, m_endPos : routePos1});
							}
						}
					}
				}
			}
		}
	}

	PedestrianManager.prototype.createPath = function(name)
	{
		var path = new Scenario.Path(name);

		path[name + "_Start"] = new Scenario.SpatialDatum(name + "_Start");
		path[name + "_End"] = new Scenario.SpatialDatum(name + "_End");

		path.appendTarget(path[name + "_Start"]);
		path.appendTarget(path[name + "_End"]);
		
		path.onLeave = function(actor)
		{
			if (this.m_active)
			{
				if (this.m_forwardPath != null)
				{
					//logger.print("DEBUG", actor.name + " is leaving " + this.name + "... and joining " + this.m_forwardPath.name);
					actor.traverse(this.m_forwardPath, TRAVERSE_STOP);
				}
				else
				{
					//logger.print("DEBUG", actor.name + " is leaving " + this.name + "... and joining " + this.m_circlePath.name);
					actor.traverse(this.m_circlePath, TRAVERSE_STOP);
				}
			}
			else
			{
				logger.print("DEBUG", actor.name + " is leaving inactive path: " + this.name);
			}
		}
		
		path.m_active = false;
		path.m_forwardPath = null;
		path.m_prevPath = null;
		
		return path;
	}

	PedestrianManager.prototype.createPathPool = function(size)
	{
		for (var i = 0; i < size; ++i)
		{
			var path0 = this.createPath("Path" + i + "_Forward");
			var path1 = this.createPath("Path" + i + "_Backward");
			
			path0.m_circlePath = path1;
			path1.m_circlePath = path0;

			this.m_pathPool.push({m_first : path0, m_second : path1});
		}
	}


	PedestrianManager.prototype.connectPath = function(prevPath, path)
	{
		if ((prevPath != undefined) && (path != undefined))
		{
			prevPath.m_forwardPath = path;
			path.m_prevPath = prevPath;
		}
	}

	PedestrianManager.prototype.connectPathPair = function(prevPathPair, pathPair)
	{
		if ((prevPathPair != undefined) && (pathPair != undefined))
		{
			this.connectPath(prevPathPair.m_first, pathPair.m_first);
			this.connectPath(pathPair.m_second, prevPathPair.m_second);
		} 
	}

	PedestrianManager.prototype.actorPath = function(path)
	{
		if (Scenario.getAvailableEntities(ACTOR) > 0)
		{
			var targets = path.getTargets();
			if (targets != null)
			{
				if (targets.length > 0)
				{
					var startPoint = targets[0];
					var actorProfileSet = Scenario.getEntityProfileSet("MovingObjectDB", this.m_type);
					if (actorProfileSet)
					{
						if (Scenario.getAvailableEntities(ACTOR) > 0)
						{
							var actor = Scenario.createActor(actorProfileSet.getProfile(), startPoint);
							if (actor != null)
							{
								actor.setTrafficResponse(false);
								actor.traverse(path, TRAVERSE_STOP);
								//actor.setVelocity(RAMP, 1.0 + this.m_randomNumber.getNumber() / 3.0, 0.0);
								actor.setVelocity(RAMP, 1.5, 0.0);
								actor.setZOffset(-1.0 * this.zOffset);
							}
						}
						else
						{
							logger.print(MSG_WARNING, "There are not enough actors available, actor will not be placed!!!");
						}
					}
					else
					{
						logger.print(MSG_WARNING, "MovingObjectDB does not contain a profile set named: " + this.m_type);
					}
				}
			}
		}
	}


	PedestrianManager.prototype.actorPathPair = function(pathPair)
	{
		if (pathPair != undefined)
		{
			this.actorPath(pathPair.m_first);
			this.actorPath(pathPair.m_second);
		}
	}


	PedestrianManager.prototype.releasePath = function(path)
	{
		path.m_active = false;
		
		if (path != undefined)
		{
			var entities = path.getEntities();
			if (entities != null)
			{
				for (var i in entities) entityUtils.destroyEntity(entities[i]);
			}
			
			var targets = path.getTargets();
			if (targets != null)
			{
				for (var i in targets) targets[i].move(0, 0, 0, 0, 0, 0);
			}
			
			
			//disconnect from the rest of the path
			path.m_forwardPath = null;
			if (path.m_prevPath != null)
			{
				path.m_prevPath.m_forwardPath = null;
				path.m_prevPath = null;
			}
		}
	}


	PedestrianManager.prototype.releasePathPair = function(pathPair)
	{
		if (pathPair != undefined)
		{
			this.releasePath(pathPair.m_first);
			this.releasePath(pathPair.m_second);
			
			this.m_pathPool.push(pathPair);
		}
	}


	PedestrianManager.prototype.movePath = function(path, start, end)
	{
		if (path != undefined)
		{
			var entities = path.getEntities();
			
			var targets = path.getTargets();
			if (targets != null)
			{
				if (targets.length == 2)
				{
					targets[0].move(start);
					targets[1].move(end);
				}
			}
			
			if (entities != null)
			{
				for (var i in entities)
				{
					entities[i].setVisible(false);
					entities[i].move(start);
					entities[i].traverse(path, TRAVERSE_STOP);
					//entities[i].setVelocity(RAMP, 1.0 + this.m_randomNumber.getNumber() / 3.0, 0.0);
					entities[i].setVelocity(RAMP, 1.5, 0.0);
					entities[i].setVisible(true);
				}
			}
			
			path.m_active = true;
		}
	}


	PedestrianManager.prototype.movePathPair = function(pathPair, pathPoint)
	{
		if (pathPair != undefined)
		{
			this.movePath(pathPair.m_first, pathPoint.m_start, pathPoint.m_end);
			
			var start = pathPoint.m_start;
			var end = pathPoint.m_end;
			
			start.setHeading(start.getHeading() + 180.0);
			end.setHeading(end.getHeading() + 180.0);
			
			this.movePath(pathPair.m_second, end, start);
		}
	}


	PedestrianManager.prototype.deletePath = function(path)
	{
		if (path != undefined)
		{
			var targets = path.getTargets();
			if (targets != null)
			{
				for (var i in targets) delete targets[i];
			}
			
			delete path;
			path = undefined;
		}
	}

	PedestrianManager.prototype.deletePathPair = function(pathPair, pathPoint)
	{
		if (pathPair != undefined)
		{
			this.deletePath(pathPair.m_first);
			this.deletePath(pathPair.m_second);
		}
	}


	PedestrianManager.prototype.cancel = function()
	{
		logger.print("DEBUG", "PedestrianManager::cancel - deactivating active path points" + i)
		for (var i in this.m_activePathQueue)
		{
			this.releasePathPair(this.m_activePathQueue[i].m_pathPair);
		}
		
		logger.print("DEBUG", "PedestrianManager::cancel - deleting property m_activePathQueue: ");
		delete this.m_activePathQueue;
		this.m_activePathQueue = undefined;
		
		logger.print("DEBUG", "PedestrianManager::cancel - deleting property m_pathPointQueue: ");
		delete this.m_pathPointQueue;
		this.m_pathPointQueue = undefined;
		

		logger.print("DEBUG", "PedestrianManager::cancel - deleting path pool" + i)
		for (var i in this.m_pathPool)
		{
			this.deletePathPair(this.m_pathPool[i]);
		}
		
		delete this.m_pathPool;
		this.m_pathPool = undefined;

		
		for (var i in this.m_activeRoads)
		{
			if (this.m_activeRoads[i] == undefined)
			{
				continue;
			}
			
			logger.print("DEBUG", "PedestrianManager::cancel - deleting m_roadMap property: " + i)
			delete this.m_activeRoads[i];
			this.m_activeRoads[i] = undefined;
		}
		
		logger.print("DEBUG", "PedestrianManager::cancel - deleting property m_roadMap: ");
		delete this.m_activeRoads;
		this.m_activeRoads = undefined;
	}

	return PedestrianManager;

});