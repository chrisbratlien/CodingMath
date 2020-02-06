define(['require', 'utils/string'], function (require, stringUtil) {

	function CollisionSemaphore(index, aabb)
	{
		this.index = index;
		this.aabb = aabb;
		this.lockQueue = [];
		this.insideGroup = {};
		
		this.entityStart = {};
	}
	
	CollisionSemaphore.prototype.lock = function(entity_num)
	{
		//print("S" + this.index + ": E" + entity_num + " locking");
		
		if (this.lockQueue.length == 0)
		{
			//print("S" + this.index + ": E" + entity_num + " is now first");
			this.lockQueue.push(entity_num);
			return;
		}
		else
		{
			var queueIndex = this.lockQueue.indexOf(entity_num);
			
			//print("S" + this.index + ": E" + entity_num + " is in queue at index " + queueIndex);
			
			if (queueIndex > -1)
			{
				if (queueIndex > 0)
				{
					//print("S" + this.index + ": E" + entity_num + " is behind " + this.lockQueue[queueIndex - 1]);
					
					//another entity is in front of this
					return this.lockQueue[queueIndex - 1];
				}
				else
				{
					//print("S" + this.index + ": E" + entity_num + " is in front");
					
					//this entity is in front
					return;
				}
			}
			else
			{
				var last = this.lockQueue[this.lockQueue.length - 1];
				this.lockQueue.push(entity_num);
				
				//print("S" + this.index + ": E" + entity_num + " is now last, behind " + last);
				
				return last;
			}
		}
	}
	
	CollisionSemaphore.prototype.unlock = function(entity_num)
	{
		//print("E" + entity_num + "unlocking");
		
		//splice this entity out of the list
		var queueIndex = this.lockQueue.indexOf(entity_num);
		if (queueIndex > -1)
		{
			//print("removing E" + entity_num + " from lock queue");
			this.lockQueue.splice(queueIndex, 1);
		}
	}
	
	CollisionSemaphore.prototype.inside = function(entity_num)
	{	
		//print("S" + this.index + ": E" + entity_num + " locking");
		
		this.insideGroup[entity_num] = entity_num;
		return this.insideGroup;
	}
	
	CollisionSemaphore.prototype.outside = function(entity_num)
	{
		this.unlock(entity_num);
		
		//print("S" + this.index + ": E" + entity_num + " locking");
		if (this.insideGroup[entity_num] !== undefined)
		{
			delete this.insideGroup[entity_num];
		}
	}
	
	return CollisionSemaphore;
	
});