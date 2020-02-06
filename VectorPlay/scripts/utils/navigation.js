define(['require', 'utils/route'], function (require, routeUtils) {
	
	function Navigation()
	{
		this.m_roadMap = routeUtils.getRoadsAlongRoute();
		
		var lastRoad;
		for (var i in this.m_roadMap)
		{
			if (lastRoad)
			{
				this.m_roadMap[lastRoad].nextRoad = i;
			}
			lastRoad = i;
		}
	
		//this.m_currentIC;
		//this.m_currentIncomingRoad;
		//this.m_currentOutgoingRoad;
	
		this.m_nextPosition = Scenario.getRouteLength();
		this.m_nextTurn = CONTINUE_STRAIGHT;
	}
		
	Navigation.prototype.update=function(ic, road)
	{
		//if you have a valid intersection
		if (ic)
		{
			//only update once per intersection
			if (this.m_currentIC != ic)
			{
				//if you have a valid road
				if (road)
				{
					if (this.m_roadMap[road.name])
					{
						//find the incoming and outgoing roads
						var incomingRoad = road.name;
						var outgoingRoad = this.m_roadMap[incomingRoad].nextRoad;
						
						if (incomingRoad && outgoingRoad)
						{
							//traverse the route looking for incoming and outgoing roads that encompass the intersection
							while (incomingRoad && outgoingRoad)
							{
								if ((this.m_roadMap[incomingRoad].position < ic.getRoutePosition()) && (this.m_roadMap[outgoingRoad].position > ic.getRoutePosition()))
								{
									break;
								}
								
								incomingRoad = outgoingRoad;
								outgoingRoad = this.m_roadMap[incomingRoad].nextRoad;
								
								//print("incomingRoad : " + incomingRoad);
								//print("outgoingRoad : " + outgoingRoad);
							}
							

							if (incomingRoad && outgoingRoad)
							{							
								if (this.m_roadMap[incomingRoad].alongRoute)
								{
									this.m_nextPosition = this.m_roadMap[incomingRoad].position;
								}
								else
								{
									this.m_nextPosition = this.m_roadMap[incomingRoad].position - Scenario[incomingRoad].getLength();
								}
								
								//there is a minimum distance before the incoming road to setDesiredVehicle (on the ghost vehicle) to acknowledge the upcoming turn
								//vehicles get added to upcoming connectors (like the intersection) within their stoping distance
								
								//vehicleIn->veh->getVel()*vehicleIn->veh->getVel())/2.0/diffPos
								
								//scenario uses decel = v^2 / 2 / stoppingDistance
								//since its impossible to know how fast we're going to be going when approaching the next intersection
								//this stopping distance assumes slower than 50.0m, if the vehicle exceeds this speed, they will miss the turn
								
								var stoppingDistance = 250.0;							
								
								//adjust the trigger distance to be the stopping distance to the incoming road
								this.m_nextPosition -= stoppingDistance;
								
								this.m_currentIC = ic;
								this.m_currentIncomingRoad = incomingRoad;
								this.m_currentOutgoingRoad = outgoingRoad;
								
								this.m_nextTurn = Scenario.getRouteTurn(ic.getRoutePosition() - ic.getSize());
								
								print("Prepare to " + EnumToString(this.m_nextTurn) + " at route position : " + this.m_nextPosition + ", " + Math.floor(ic.getRoutePosition() - this.m_nextPosition) + "m before the next intersection");
								
								return true;
							}
							else
							{
								if ((ic.getRoutePosition() == 0) || (ic.getRoutePosition() > Scenario.getRouteLength()))
								{
									//print("Navigation: route completed");
								}
								else
								{
									print("Navigation following route: Unexpected to encouter an intersection that is not between roads");
								}
							}
						}
					}
				}
			}
		}
		
		return false;
	}
	
	Navigation.prototype.getNextTurn=function()	{ return this.m_nextTurn; }
	Navigation.prototype.getNextPosition=function() { return this.m_nextPosition; }
	Navigation.prototype.getUpcomingRoad=function(turn)	{ return this.m_currentIC.getRoad(Scenario[this.m_currentIncomingRoad], turn); }
	
	
	return Navigation;
});