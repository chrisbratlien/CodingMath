define(['require'], function (require) {

	function ParticleSystem()
	{
		this.m_effects = new Array();  //children of ParticleSystem
	}

	//public functions
	ParticleSystem.prototype.update = function()
	{
		//update all the particle's positions of each effect
		for (var i in this.m_effects)
		{
			this.m_effects[i].update();
		}

		//remove the effects as emitters are deactivated and contain only dead particles
		this.removeCompletedEffects();
	}

	ParticleSystem.prototype.addNewEffect = function(effect) { this.m_effects.push(effect); }
	ParticleSystem.prototype.isComplete = function() { return (this.m_effects.length == 0); }

	ParticleSystem.prototype.removeCompletedEffects = function()
	{
		for(var i = this.m_effects.length - 1; i >= 0; i--)
		{
			if(this.m_effects[i].isComplete())
			{
				this.m_effects.splice(i, 1);
			}
		}
	}

	ParticleSystem.prototype.cancel = function()
	{
		for(var i = this.m_effects.length - 1; i >= 0; i--)
		{
			if(this.m_effects[i].cancel())
			{
				this.m_effects.splice(i, 1);
			}
		}
	}

	return ParticleSystem;

});
