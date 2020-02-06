define(['require'], function (require) {

return function()
{
	function shuffle(v)
	{
		for(var j, x, i = v.length; i; j = parseInt(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x);
		return v;
	};
	
	if (arguments.length > 0)
	{
		shuffle(arguments);
		return arguments[0];
	}
}

});