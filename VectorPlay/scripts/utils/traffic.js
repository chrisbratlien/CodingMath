define(['require', 'utils/road', 'utils/route', 'utils/entity', 'utils/logger'], function (require, roadUtils, routeUtils, entityUtils, logger) {

	//pedestrian manager class for the AmbientPed maneuver

	var datum = new Scenario.SpatialDatum("query datum");

	//traffic manager class for the AmbientTraffic maneuver

	function TrafficManager(type, name, lane, frontBack)
	{
		this.m_name = name;
		this.m_maximumNum = 1;

		this.m_currentNum = 0;
		this.m_nextTime = 0;
		
		this.m_numTries = 0;
		this.m_life = 60 * 60 * 10000;
		this.m_creationPeriod = 1;
		
		this.m_type = type;
		this.m_lane = lane;
		this.m_frontBack = frontBack;
		this.m_oncoming = ((lane == LANE_ONCOMING_LEFTMOST) ||
		(lane == LANE_ONCOMING_MIDDLE) ||
		(lane == LANE_ONCOMING_RIGHTMOST) ||
		(lane == LANE_ONCOMING_SIDEWALK));
		
		this.activeEntities = new Array();
		this.activePaths = new Array();
		
		this.m_randomNumber = new Scenario.RandomGenerator();
		this.m_randomNumber.setRange(0, 2);
	}

	TrafficManager.prototype.LOOK_FOR_STOP = 0;
	TrafficManager.prototype.APPROACH_STOP = 1;
	TrafficManager.prototype.WAIT_AT_STOP  = 2;

	TrafficManager.prototype.update = function(radius, speed)
	{
		//create a vehicle if there is room
		if (Scenario.getTime() > this.m_nextTime)
		{
			if (this.m_currentNum < this.m_maximumNum)
			{
				var innerRadius = radius * 0.75;
				
				var hasRoom = true;
				if (this.m_frontBack == "Front")
				{
					hasRoom = (Scenario.Subject.getRoutePosition() + innerRadius) < Scenario.getRouteLength();
				}
				else //"Back"
				{
					hasRoom = (Scenario.Subject.getRoutePosition() - innerRadius) >  0;
				}
				
				if (hasRoom)
				{
					if (this.m_numTries >= 10)
					{
						print("10 tries failed, resetting.");
						this.m_numTries = 0;
					}
					
					var numTriesOffset = this.m_numTries * 2.0;
					if (this.m_numTries % 2 == 1)
					{
						numTriesOffset *= -1.0;
					}
					
					if (this.placeLRV(innerRadius + numTriesOffset, speed))
					{
						this.m_numTries = 0;
						this.m_currentNum++;
					}
					else
					{
						this.m_numTries++;
					}
				}
			}
			
			this.m_nextTime = Scenario.getTime() + this.m_creationPeriod; //nextTime
		}
		
		//clean up vehicles that leave the creation radius
		for (var i in this.activeEntities)
		{
			if (this.activeEntities[i] != null)
			{
				var outerRadius = radius / 0.75;
				
				var dist = this.activeEntities[i].getDistance(Scenario.Subject);
				if (dist > outerRadius)
				{
					var entity = this.activeEntities[i];
					
					if (entity.m_sensor != undefined)
					{
						entity.m_sensor.disable();
						delete entity.m_sensor;
						entity.m_sensor = undefined;
					}
					
					RemoveBarriers(entity);
					DestroyEntity(entity);
					
					this.activeEntities.splice(i, 1);
					
					this.m_currentNum--;
					continue;
				}
				
				this.activeEntities[i].m_age++;
				if (this.activeEntities[i].m_age > this.m_life)
				{
					var entity = this.activeEntities[i];
					
					if (entity.m_sensor != undefined)
					{
						entity.m_sensor.disable();
						delete entity.m_sensor;
						entity.m_sensor = undefined;
					}
					
					RemoveBarriers(entity);
					DestroyEntity(entity);

					this.activeEntities.splice(i, 1);
					
					this.m_currentNum--;
					continue;
				}
			}
		}
		
		//stop at ped stops
		if (this.m_type == "LRV")
		{
			for (var i in this.activeEntities)
			{
				var vehicle = this.activeEntities[i];
				if (vehicle != null)
				{
					if (vehicle.m_state == this.LOOK_FOR_STOP)
					{
						this.lookForStop(vehicle);
					}
					
					if (vehicle.m_state == this.APPROACH_STOP)
					{
						this.approachStop(vehicle, speed);
					}
					
					if (vehicle.m_state == this.WAIT_AT_STOP)
					{
						this.waitAtStop(vehicle, speed);
					}
				}
			}
		}
	}


	TrafficManager.prototype.placeLRV = function(radius, speed)
	{
		speed = Math.min(speed, 11.11); //40.0 KM/H
		
		if (this.m_frontBack != "Front")
		{
			radius = radius * -1;
		}
		
		//get a random profile
		var profile = "York Region Transit 40' Bus"
		if (this.m_randomNumber.getNumber() > 1)
		{
			//profile = "Street Car"
		}
		
		var vehicle = CreateVehicleSimple(profile, radius, this.m_lane, speed);
		if (vehicle != null)
		{
			vehicle.setLightState(HEADLIGHT, AUTOMATIC);
			vehicle.m_stop = -1;
			vehicle.m_lastStop = -1;
			vehicle.m_state = this.LOOK_FOR_STOP;
			vehicle.m_age = 0;
			
			this.activeEntities.push(vehicle);
			
			print("*******************************************");
			print("LRV placed at radius : " + radius);
			print("m_numTries : " + this.m_numTries);
			print("*******************************************");
			
			vehicle.m_sensor = new Scenario.ProximitySensor("ps");
			vehicle.m_sensor.attach(vehicle);
			
			if (profile == "LRV")
			{
				vehicle.m_sensor.setSphereGeometry(30.0 * 2.0);
			}
			else  //Street Car
			{
				vehicle.m_sensor.setSphereGeometry(15.0 * 2.0);
			}
			
			vehicle.m_sensor.m_vehicle = vehicle;
			
			vehicle.m_sensor.onActivate = function(entity)
			{
				if ((vehicle.m_sensor.m_startTime + 1.0) < Scenario.getTime())
				{
					print("shutting off sensor for : " + this.m_vehicle.name);
					this.disable();
					return;
				}
				
				if (FilterEntity(entity, this.m_vehicle, Scenario.Subject, this.m_oncoming))
				{
					print(entity.name + " destroyed because it got squashed by the new LRV");
					DestroyEntity(entity);
				}
			}
			
			vehicle.m_sensor.m_startTime = Scenario.getTime();
			vehicle.m_sensor.m_oncoming = this.m_oncoming;
			
			return true;
		}
		
		return false;
	}

	function FilterEntity(entity, vehicle, subject, oncoming)
	{
		if ((entity != vehicle) && (entity != subject))
		{
			if (entity.getProfile().getType() == "Vehicle")
			{
				var headingError = GetHeadingError(entity.getHeading(), vehicle.getHeading())
				if (Math.abs(headingError) < 45)
				{
					if (Math.abs(entity.getLane()) == Math.abs(vehicle.getLane()))
					{
						var position = GetPosition(entity) - GetPosition(vehicle);
						if (oncoming)
						{
							position = -1.0 * position;
						}
						
						if ((position < 8) && (position > -28))
						{
							PrintDebug("squashing vehicle with position difference of :" + position);
							return true;
						}
					}
				}
			}
		}
		
		return false;
	}


	//get the train stop just after the given position
	function GetNextStop(position, maxStops)
	{
		for (var i = 1; i < maxStops; i++)
		{
			var nextStop = Scenario.Subject.getNextTrainStop(i);
			if (nextStop > 0)
			{
				var nextStopPos = Scenario.getTrainStopPosition(nextStop);
				
				if (nextStopPos > position)
				{
					return nextStop;
				}
			}
		}
		
		return -1;
	}

	//get the oncoming stop that is just prior to the given position
	function GetNextOncomingStop(position, maxStops)
	{
		for (var i = 1; i < maxStops; i++)
		{
			var nextStop = Scenario.Subject.getNextOncomingTrainStop(i);
			if (nextStop > 0)
			{
				var nextStopPos = Scenario.getTrainStopPosition(nextStop);
				if (nextStopPos > position)
				{
					if (i > 1)
					return Scenario.Subject.getNextOncomingTrainStop(i - 1);
					else
					return -1;
				}
			}
		}
		
		return -1;
	}

	TrafficManager.prototype.lookForStop = function(vehicle)
	{
		var nextStop = -1;
		if (this.m_oncoming)
		{
			nextStop = GetNextOncomingStop(GetPosition(vehicle), 10);
		}
		else
		{
			nextStop = GetNextStop(GetPosition(vehicle), 10);
		}
		
		if (vehicle.m_lastStop == nextStop)
		{
			return;
		}
		
		if (nextStop >= 0)
		{
			vehicle.m_stop = nextStop;
			vehicle.m_state = this.APPROACH_STOP;
			
			var eyeDistance = vehicle.getDistanceToFrontBumper() - 1.0;
			
			if (this.m_oncoming)
			{
				vehicle.m_stopPos = Scenario.getTrainStopPosition(vehicle.m_stop) + eyeDistance;
			}
			else
			{
				vehicle.m_stopPos = Scenario.getTrainStopPosition(vehicle.m_stop) - eyeDistance;
			}
			
			vehicle.m_stopType = Scenario.getTrainStopType(vehicle.m_stop);
		}
	}

	TrafficManager.prototype.approachStop = function(vehicle, speedLimit)
	{
		var routePosition = GetPosition(vehicle);
		var speed = speedLimit;
		if (this.m_oncoming)
		{
			if (vehicle.m_stopPos < routePosition)
			{
				speed = (routePosition - vehicle.m_stopPos + 1.0) / 2.0;
			}
			else
			{
				vehicle.m_lastStop = vehicle.m_stop;
				vehicle.m_state = this.LOOK_FOR_STOP;
				return;
			}
		}
		else
		{
			if (routePosition < vehicle.m_stopPos)
			{
				speed = (vehicle.m_stopPos - routePosition - 1.0) / 2.0;
			}
			else
			{
				vehicle.m_lastStop = vehicle.m_stop;
				vehicle.m_state = this.LOOK_FOR_STOP;
				return;
			}
		}
		
		var speedCap = Math.min(Math.max(speed, 0.0), speedLimit);
		
		vehicle.setDesiredVelocity(VELOCITY_FIXED, speedCap);
		//vehicle.setVelocity(RAMP, speedCap, 0.0);
		
		var atStop = false;
		if (this.m_oncoming)
		atStop = routePosition < (vehicle.m_stopPos + 1.25);
		else
		atStop = routePosition > (vehicle.m_stopPos - 1.25);
		
		if (atStop)
		{
			vehicle.setDesiredVelocity(VELOCITY_FIXED, 0.0);
			
			if (vehicle.m_stopType != "island")
			{
				//PlaceBarriers(vehicle);
			}
			
			vehicle.m_state = this.WAIT_AT_STOP;
			vehicle.m_stopTime = Scenario.getTime() + 30;
		}

	}


	TrafficManager.prototype.waitAtStop = function(vehicle, speed)
	{
		if (Scenario.getTime() < vehicle.m_stopTime)
		{
			PrintDebug("waiting at stop at a distance of : " + (vehicle.m_stopPos  - GetPosition(vehicle)));
		}
		else
		{
			vehicle.m_lastStop = vehicle.m_stop;
			vehicle.m_state = this.LOOK_FOR_STOP;
			
			vehicle.setDesiredVelocity(VELOCITY_FIXED, speed);
			
			RemoveBarriers(vehicle);
		}
	}

	TrafficManager.prototype.cancel = function()
	{
		for (var i in this.activeEntities)
		{
			var entity = this.activeEntities[i];
			
			if (entity.m_sensor != undefined)
			{
				entity.m_sensor.disable();
				delete entity.m_sensor;
				entity.m_sensor = undefined;
			}
			
			RemoveBarriers(entity);
			DestroyEntity(entity);
		}
	}

	return TrafficManager;

});