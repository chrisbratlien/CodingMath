define(['require'], function (require) {

	Scenario.createManeuverType("FollowTarget");
	
	//FollowTarget.prototype.m_entity = undefined;
	//FollowTarget.prototype.m_targets = undefined;
	
	FollowTarget.prototype.onInitialize = function()
	{
	}
	
	FollowTarget.prototype.getNextTarget = function()
	{
		if (this.m_targets)
		{
			if (this.m_targets.length !== undefined)
			{
				if (this.m_targets.length > 0)
				{
					this.m_currentTargetIndex = this.m_currentTargetIndex || 0;
					return this.m_targets[this.m_currentTargetIndex++];
				}
			}
		}
		
		return this.m_targets;
	}
	
	FollowTarget.prototype.peekNextTarget = function()
	{
		if (this.m_targets)
		{
			if (this.m_targets.length !== undefined)
			{
				if (this.m_targets.length > 0)
				{
					return this.m_targets[this.m_currentTargetIndex];
				}
			}
		}
	}
	
	FollowTarget.prototype.onEnter = function()
	{
		if (this.m_entity)
		{
			this.prevTarget = this.m_entity;
			this.nextTarget = this.getNextTarget();
			if (this.nextTarget)
			{
				if (this.startPathCB)
				{
					this.startPathCB.apply(this.m_entity, [this.prevTarget, this.nextTarget]);
				}
				
				return;
			}
		}
		
		this.leave();
	}
	
	FollowTarget.prototype.onActivate = function()
	{
		if (this.updateWaypointCB)
		{
			if (this.updateWaypointCB.apply(this.m_entity, [this.prevTarget, this.nextTarget]))
			{
				if (this.peekNextTarget())
				{
					this.prevTarget = this.nextTarget;
					this.nextTarget = this.getNextTarget();

					this.m_entity.follow(this.nextTarget);
					if (this.startWaypointCB)
					{
						this.startWaypointCB.apply(this.m_entity, [this.prevTarget, this.nextTarget]);
					}
				}
				else
				{
					this.leave();
				}
			}
		}
		else
		{
			this.leave();
		}
	}
	
	FollowTarget.prototype.onLeave = function()
	{
		print("FollowTarget (" + this.name + " ) onLeave");
		if (this.nextTarget)
		{
			if (this.endPathCB)
			{
				this.endPathCB.apply(this.m_entity, [this.nextTarget]);
			}
		}
	}
	
	FollowTarget.prototype.onCancel = function()
	{
		print("FollowTarget (" + this.name + " ) onCancel");
	}

});