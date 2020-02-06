define(['require'], function (require) {


	function Particle(userData, time, duration)
	{
		this.m_userData = userData;
		
		this.m_timeOfBirth = time;
		this.m_timeOfDeath = time + duration;
	}

	function ParticleEffect(context, args, maxParticles, particleLife)
	{
		this.m_context = context;
		this.m_args = args;
		this.m_maxParticles = maxParticles;
		this.m_particleLife = particleLife;
		
		this.m_particles = new Array();
		this.m_numBorn = 0;
		this.m_numDied = 0;
	}


	ParticleEffect.prototype.update = function()
	{
		// Generate particles
		if (this.m_numBorn < this.m_maxParticles)
		{
			var userData = this.m_context["birth"].call(this.m_context, this.m_args);
			
			if (userData != null)
			{
				this.m_particles.push(new Particle(userData, Scenario.getTime(), this.m_particleLife));
				this.m_numBorn++;      
			}
		}
	
		for(var i = this.m_particles.length - 1; i >= 0; i--)
		{
			var particle = this.m_particles[i];
			
			//	this.m_context["death"].call(this.m_context, particle.m_userData);
			if (Scenario.getRouteLength() > 0)
			{
				if (GetPosition(Scenario.Subject) > GetPosition(particle.m_userData))
				{
					this.m_context["death"].call(this.m_context, particle.m_userData);
					this.m_particles.splice(i, 1);
					this.m_numDied++;
				}
			}
			else 
			{
				if (particle.m_timeOfDeath < Scenario.getTime())
				{
					this.m_context["death"].call(this.m_context, particle.m_userData);
					this.m_particles.splice(i, 1);
					this.m_numDied++;
				}
				else
				{
					var slew = Scenario.interFunction(RAMP, particle.m_timeOfBirth, particle.m_timeOfDeath, Scenario.getTime());
					this.m_context["update"].call(this.m_context, this.m_args, particle.m_userData, slew);
				}
			}
		}
	}


	ParticleEffect.prototype.cancel = function()
	{
		for(var i = this.m_particles.length - 1; i >= 0; i--)
		{
			var particle = this.m_particles[i];
			if (particle)
			{
				this.m_context["death"].call(this.m_context, particle.m_userData);
				this.m_particles.splice(i, 1);
				this.m_numDied++;
			}
		}
	}

	ParticleEffect.prototype.isComplete = function() { return this.m_numDied >= this.m_maxParticles; }
	
	return ParticleEffect;
	
});