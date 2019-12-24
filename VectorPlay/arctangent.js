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


		context.strokeStyle = 'rgba(0, 0, 0,0.2)';
		console.log(leftCenter,rightCenter);
		///X axis
		context.beginPath();
		context.moveTo(...[0-width/2,0]);
		context.lineTo(...[width/2,0]);
		context.stroke();

		///Y axis
		context.beginPath();
		context.moveTo(...centerBottom);
		context.lineTo(...centerTop);
		context.stroke();

		return false;
		context.moveTo(20, 0);
		context.lineTo(10, -10);
		context.moveTo(20, 0);
		context.lineTo(10, 10);
		context.stroke();		


	}

	function axes() {

		//test plot
		context.strokeStyle = 'rgba(255, 127, 0,0.5)';
		context.beginPath();
		context.moveTo(0,0);
		context.lineTo(-200, -200);

		//x
		context.moveTo(0-width/2,0);
		context.lineTo(width/2,0);

		//y
		context.moveTo(0,0-height/2);
		context.lineTo(0,height/2);

		context.stroke();


	}

	function render() {
		//arrowX = width / 2 + Math.cos(a) * height * .4;
		//arrowY = height / 2 + Math.sin(a) * height * .4;

		//context.clearRect(0, 0, width, height);
		//context.clearRect(...leftTop,width,height);

		//context.clearRect(-1 * width,height/2,width,height);
		context.clearRect(0-width/2,0-height/2,width,height);

		context.save();

		axes();

		//test plot
		context.strokeStyle = 'rgba(255, 0, 0,0.5)';
		context.beginPath();
		context.moveTo(0,0);//width, height);
		context.lineTo(-200, -200);
		context.stroke();






		context.strokeStyle = 'rgba(0, 0, 0,0.2)';
		context.beginPath();
		//context.moveTo(...center);
		context.moveTo(0,0);
		context.lineTo(...mouseVec);
		context.stroke();
		/*
		context.beginPath();
		context.moveTo(20, 0);
		context.lineTo(-20, 0);
		context.moveTo(20, 0);
		context.lineTo(10, -10);
		context.moveTo(20, 0);
		context.lineTo(10, 10);
		context.stroke();
		**/
		context.restore();
		requestAnimationFrame(render);
	}

	document.body.addEventListener("mousemove", function(event) {
		eventVec = [event.clientX, event.clientY];
		mouseVec = [event.clientX - width/2, height/2 - event.clientY]
		//mouseVec = eventVec;
		//mouseVec = vsub(eventVec,vcenter);
		//mouseVec = vscale(mouseVec,-1);
		//mouseVec = [mouseVec[0],-1 * mouseVec[1]];
		console.log('eV',eventVec,'mV',mouseVec);
		//dx = event.clientX - arrowX;
		//dy = event.clientY - arrowY;
		//angle = Math.atan2(dy, dx);
	});


};