var canvas,
	context,
	width,
	height,
	arrowX,
	arrowY,
	vcenter,
	center,
	leftCenter,
	rightCenter,
	centerTop,
	centerBottom,
	mouseVec;

window.onload = function() {
		canvas = document.getElementById("canvas"),
		context = canvas.getContext("2d"),
		width = canvas.width = window.innerWidth,
		height = canvas.height = window.innerHeight,
		arrowX = width / 2,
		arrowY = height / 2,
		vcenter = [width / 2, height / 2],
		center = [0,0];
		var dx, dy,
		angle = 0,
		a = 0;



	setup();
	render();

	function setup() {
		//context.translate(arrowX, arrowY);
		//context.translate(width/2, height/2);

		//context.translate(...vcenter);

		//context.rotate(Math.PI);//make +Y UP

		context.transform(1,0,0,-1,width/2,height/2);//width/2,height/2);

		context.strokeStyle = 'rgba(255, 0, 0,0.5)';



		leftCenter = vsub(center,[width/2,0]);
		leftTop = vadd(center,[0,height/2]);
		console.log(leftTop,'left top');
		rightCenter = vadd(center,[width/2,0]);
		centerTop = vsub(center,[0,width/2]);
		centerBottom = vadd(center,[0,width/2]);


		mouseVec = [0,0];
		vNew = [0,0];

		context.strokeStyle = 'rgba(0, 0, 0,0.2)';
		console.log(leftCenter,rightCenter);
	}

	function axes() {

		//test plot
		context.strokeStyle = 'rgba(255, 127, 0,0.5)';
		context.beginPath();
		//x
		context.moveTo(0-width/2,0);
		context.lineTo(width/2,0);

		//y
		context.moveTo(0,0-height/2);
		context.lineTo(0,height/2);

		context.stroke();
	}


	function vPlot(vOrigin,v) {
		context.moveTo(...vOrigin);
		context.lineTo(...v);
	}

	function testPlot() {
		context.strokeStyle = 'rgba(255, 0, 0,0.5)';
		context.beginPath();

		vPlot([0,0],[-200,-200]);
		vPlot([0,0],[-200, 200]);
		vPlot([0,0],[200, -200]);
		vPlot([0,0],[200, 200]);
		context.stroke();
	}


	function render() {
		
		//context.clearRect(0-width/2,0-height/2,width,height);

		context.save();

		axes();
		testPlot();

		context.strokeStyle = 'rgba(0, 0, 0,0.2)';
		context.beginPath();


		//vPlot([0,0],mouseVec);
		//vPlot(mouseVec,[-1*width/2,height/2]);
		vPlot(vNew,mouseVec);
		vNew = [...mouseVec];



		context.stroke();

		context.restore();
		requestAnimationFrame(render);
	}
	document.body.addEventListener("mouseup", function(event) {
		//eventVec = [event.clientX, event.clientY];
		mouseVec = [event.clientX - width/2, height/2 - event.clientY];
		//mouseVec = eventVec;
		//mouseVec = vsub(eventVec,vcenter);
		//mouseVec = vscale(mouseVec,-1);
		//mouseVec = [mouseVec[0],-1 * mouseVec[1]];
		console.log('CLICK',mouseVec);
		//dx = event.clientX - arrowX;
		//dy = event.clientY - arrowY;
		//angle = Math.atan2(dy, dx);
	});
	document.body.addEventListener("mousemove", function(event) {
		eventVec = [event.clientX, event.clientY];
		mouseVec = [event.clientX - width/2, height/2 - event.clientY]
		//mouseVec = eventVec;
		//mouseVec = vsub(eventVec,vcenter);
		//mouseVec = vscale(mouseVec,-1);
		//mouseVec = [mouseVec[0],-1 * mouseVec[1]];
		///console.log('eV',eventVec,'mV',mouseVec);
		//dx = event.clientX - arrowX;
		//dy = event.clientY - arrowY;
		//angle = Math.atan2(dy, dx);
	});


};