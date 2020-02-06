define(['require', 'utils/simCreator'], function (require, scUtils) {

	var component = scUtils.getComponent("Visuals_FrodoXMLVisuals");
	if (!component)
	{
		print("frodoXMLVisuals is being imported without a component named FrodoXMLVisuals in the model");
		return;
	}

	var textHandle = 0;
	var imgHandle = 0;

	//////////
	// TEXT //
	//////////

	function TextClass(text, x, y, duration, red, green, blue, alpha, size, justification, flash, fade, channel)
	{
		this.id = textHandle++;

		this.text = text;
		this.x = x;
		this.y = y;
		this.z = 0.0;
		this.duration = duration; //ignored or now is visibility
		this.red = red; //red || 1.0;  <<=default value example
		this.green = green;
		this.blue = blue;
		this.alpha = alpha;
		this.size = size;
		this.justification = justification;
		this.flash = flash;
		this.fade = fade;
		this.channel = channel;
		this.isVisible = true;
		this.create();
	}

	TextClass.prototype.getText = function() { return this.text; }
	TextClass.prototype.setText = function(text)
	{
		this.text = text;
		this.update();
	}

	TextClass.prototype.getPosition = function() { return this; }
	TextClass.prototype.setPosition = function(x, y)
	{
		this.x = x;
		this.y = y;
		this.update();
	}

	TextClass.prototype.getLayer = function() { return this.z; }
	TextClass.prototype.setLayer = function(layer) {
		this.z = layer;
		this.update();
	}

	TextClass.prototype.getDuration = function() { return this.duration; }
	TextClass.prototype.setDuration = function(duration)
	{
		this.duration = duration;
		this.update();
	}

	TextClass.prototype.getColor = function() { return this; }
	TextClass.prototype.setColor = function(r, g, b, a)
	{
		this.red = r;
		this.green = g;
		this.blue = b;
		this.alpha = a;
		this.update();
	}

	TextClass.prototype.getSize = function() { return this.size; }
	TextClass.prototype.setSize = function(size)
	{
		this.size = size;
		this.update();
	}

	TextClass.prototype.getJustification = function() { return this.justification; }
	TextClass.prototype.setJustification = function(justification)
	{
		this.justification = justification;
		this.update();
	}

	TextClass.prototype.getFlash = function() { return this.flash; }
	TextClass.prototype.setFlash = function(flash)
	{
		this.flash = flash;
		this.update();
	}

	TextClass.prototype.getFade = function() { return this.fade; }
	TextClass.prototype.setFade = function(fade)
	{
		this.fade = fade;
		this.update();
	}

	TextClass.prototype.getChannel = function() { this.channel; }
	TextClass.prototype.setChannel = function(channel)
	{
		this.channel = channel;
		this.update();
	}

	TextClass.prototype.getVisible = function() { this.isVisible; }
	TextClass.prototype.setVisible = function(visibility)
	{
		this.isVisible = visibility;
		this.update();
	}
	

	TextClass.prototype.update = function()
	{
		component.UpdateOverlay.Call(this);
	}

	TextClass.prototype.create = function()
	{
		component.CreateOverlay.Call(this);
	}

	TextClass.prototype.clear = function()
	{
		component.ClearText.Call(this);
	}

	////////////
	// IMAGES //
	////////////

	function ImageClass(image, x, y, width, height, duration, red, green, blue, alpha, flash, fade, channel)
	{
		this.id = imgHandle++;

		this.image = image;
		this.x = x;
		this.y = y;
		this.z = 0.0;
		this.width = width;
		this.height = height;
		this.duration = duration;
		this.red = red;
		this.green = green;
		this.blue = blue;
		this.alpha = alpha;
		this.flash = flash;
		this.fade = fade;
		this.channel = channel;
		this.isVisible = true;
		this.origin_x = 0;
		this.origin_y = 0;
		this.create();
	}

	ImageClass.prototype.getPosition = function() { return this; }
	ImageClass.prototype.setPosition = function(x, y)
	{
		this.x = x - this.origin_x;
		this.y = y - this.origin_y;
		this.update();
	}

	ImageClass.prototype.getLayer = function() { return this.z; }
	ImageClass.prototype.setLayer = function(layer) {
		this.z = layer;
		this.update();
	}

	ImageClass.prototype.getSize = function() { return this; }
	ImageClass.prototype.setSize = function(width, height)
	{
		this.width = width;
		this.height = height;
		this.update();
	}

	ImageClass.prototype.getOrigin = function() { return this; }
	ImageClass.prototype.setOrigin = function(origin_x, origin_y)
	{
		this.origin_x = origin_x;
		this.origin_y = origin_y;
		this.update();
	}

	ImageClass.prototype.getDuration = function() { return this.duration; }
	ImageClass.prototype.setDuration = function(duration)
	{
		this.duration = duration;
		this.update();
	}

	ImageClass.prototype.getColor = function() { return this; }
	ImageClass.prototype.setColor = function(r, g, b, a)
	{
		this.red = r;
		this.green = g;
		this.blue = b;
		this.alpha = a;
		this.update();
	}

	ImageClass.prototype.getFlash = function() { return this.flash; }
	ImageClass.prototype.setFlash = function(flash)
	{
		this.flash = flash;
		this.update();
	}

	ImageClass.prototype.getFade = function() { return this.fade; }
	ImageClass.prototype.setFade = function(fade)
	{
		this.fade = fade;
		this.update();
	}

	ImageClass.prototype.getChannel = function() { return this.channel; }
	ImageClass.prototype.setChannel = function(channel)
	{
		this.channel = channel;
		this.update();
	}

	ImageClass.prototype.getVisible = function() { return this.isVisible; }
	ImageClass.prototype.setVisible = function(visibility)
	{
		this.isVisible = visibility;
		this.update();
	}

	/*ImageClass.prototype.getImage = function() { return this.image; }
	ImageClass.prototype.setImage = function(image)
	{
		this.image = image;
		this.update();
	}*/

	ImageClass.prototype.update = function()
	{
		component.UpdateOverlay.Call(this);
	}

	ImageClass.prototype.create = function()
	{
		component.CreateOverlay.Call(this);
	}

	ImageClass.prototype.clear = function()
	{
		component.ClearImage.Call(this);
	}

	////////////
	// EXPORT //
	////////////

	exports = new Object();
	exports.Text = TextClass;
	exports.Image = ImageClass;

	exports.displayText = function(text, x, y, duration, red, green, blue, alpha, size, justification, flash, fade, channel)
	{
		print("Visuals.display text is different in Fusion. Please refer to the Scenario API");
	}

	exports.clearAll = function()
	{
		component.ClearAll();
	}

	return exports;
});
