define(['require'], function (require) {

	var exports = {};
	
	var muted = false;
	
	exports.playSample = function(sample)
	{
		if (!muted)
		{
			Audio.setGlobalVolume(20.0);
			Audio.playSample(sample,4.0);
			//Audio.playSample("hurtLeg.wav");
		}
	}
	
	exports.mute = function()
	{
		muted = true;
	}
	
	exports.unmute = function()
	{
		muted = false;
	}
	
	return exports;
	
});