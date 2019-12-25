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
	vMouse,
	vGoal,
	vSave,
	vSeg,
	vNew,
	poly;


function vPlot(vOrigin,v) {
	context.moveTo(...vOrigin);
	context.lineTo(...v);
}

function plotPolyVecs(polyVecs) {
	polyVecs.forEach((v,i) => {
		if (i > 0) {
			vPlot(polyVecs[i-1],v)
		}
	})
	vPlot(polyVecs[polyVecs.length-1],polyVecs[0]);
}
function plotPolyMatrix(m) {
	plotPolyVecs(transpose(m));
}

function rotateT(theta) {
	return [
		[Math.cos(theta), -1 * Math.sin(theta)],
		[Math.sin(theta), Math.cos(theta)]
	];
}
function scalarScaleT(factor) {
	return [
		[factor,0],
		[0,factor]
	];
}
function scaleT(vFactor) {
	return [
		[vFactor[0],0],
		[0,vFactor[1]]
	];
}

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
		context.transform(1,0,0,-1,width/2,height/2);
		context.strokeStyle = 'rgba(255, 0, 0,0.5)';

		leftCenter = vsub(center,[width/2,0]);
		leftTop = vadd(center,[0,height/2]);
		console.log(leftTop,'left top');
		rightCenter = vadd(center,[width/2,0]);
		centerTop = vsub(center,[0,width/2]);
		centerBottom = vadd(center,[0,width/2]);


		vMouse = [0,0];
		vGoal = [0,0];
		vNew = [0,0];
		vSave = [0,0];
		vSeg = [0,0];

		context.strokeStyle = 'rgba(0, 0, 0,0.2)';
		console.log(leftCenter,rightCenter);

		axes();
		//testPlot();
		poly = [
			[10,20],
			[90,-10],
			[30,40]
		];
		poly = transpose([
			[0,0],
			[50,0],
			[50,50],
			[0,50]
		]);
		shear = [
			[1,1],
			[0,1]
		]
		rotation = [
		  [0,-1],
		  [1, 0]
		];


		context.strokeStyle = 'rgba(0, 127, 255,1)';
		context.beginPath();
		plotPolyMatrix(poly);
		context.stroke();


		context.strokeStyle = 'rgba(0, 255, 255,1)';
		context.lineWidth = 2;
		context.beginPath();
		plotPolyMatrix(
				mmult(
					poly,
					rotateT(Math.PI/3),
					scaleT([2,2])
				)
		);
		context.stroke();

		return false;

		/**
		//shear
		context.strokeStyle = 'rgba(255, 127, 127,0.5)';
		context.beginPath();
		polyPlot(poly.map(v => mmult(v2m(v),shear).flat()));
		context.stroke();

		return false;
		**/
		//rotate
		context.strokeStyle = 'rgba(255, 127, 127,0.5)';
		context.beginPath();
		var theta = Math.PI/2;
		theta = 35 * Math.PI / 180;
		//polyPlot(poly.map(v => mmult(v2m(v),rotateT(theta)).flat()));

		T = mmult(scaleT([0.2,2.5]),rotateT(theta));
		polyPlot(poly.map(v => mmult(v2m(v),T).flat()));

		context.stroke();

		return false;

		//shear then rotate
		context.strokeStyle = 'rgba(0, 255, 127,0.5)';
		context.beginPath();
		T = mmult(shear,rotation);//,rotation);
		polyPlot(poly.map(v => mmult(v2m(v),T).flat()));
		context.stroke();


		//rotate then shear
		context.strokeStyle = 'rgba(0, 127, 255,0.5)';
		context.beginPath();
		T = mmult(rotation,shear);
		polyPlot(poly.map(v => mmult(v2m(v),T).flat()));
		context.stroke();

		//rotate then shear
		context.strokeStyle = 'pink';
		context.beginPath();
		T = mmult(shear,rotation,shear);
		polyPlot(poly.map(v => mmult(v2m(v),T).flat()));
		context.stroke();

		context.strokeStyle = 'yellow';
		context.beginPath();
		T = mmult(shear,rotation,shear,rotation);
		polyPlot(poly.map(v => mmult(v2m(v),T).flat()));
		context.stroke();

		context.strokeStyle = 'black';
		context.beginPath();
		T = mmult(shear,rotation,shear,rotation,shear);
		polyPlot(poly.map(v => mmult(v2m(v),T).flat()));
		context.stroke();







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
		return false;
		//context.clearRect(0-width/2,0-height/2,width,height);

		//context.save();

	
		context.strokeStyle = 'rgba(0, 0, 0,0.2)';
		context.beginPath();


		//vPlot([0,0],mouseVec);
		//vPlot(mouseVec,[-1*width/2,height/2]);
		//vNew = [...mouseVec];

		//vPlot(vNew,mouseVec);
		//vNew = vlerp(vNew,mouseVec,0.1);

		vSave = [...vSeg];
		vSeg = vlerp(vSeg,vGoal,0.5);

		vPlot(vSave,vSeg);


		context.stroke();

		context.restore();
		requestAnimationFrame(render);
	}
	document.body.addEventListener("mouseup", function(event) {
		//eventVec = [event.clientX, event.clientY];
		vMouse = [event.clientX - width/2, height/2 - event.clientY];
		//goalVec = [event.clientX - width/2, height/2 - event.clientY];
		vGoal = [...vMouse];
		//mouseVec = eventVec;
		//mouseVec = vsub(eventVec,vcenter);
		//mouseVec = vscale(mouseVec,-1);
		//mouseVec = [mouseVec[0],-1 * mouseVec[1]];
		console.log('CLICK',vMouse,vGoal);
		//dx = event.clientX - arrowX;
		//dy = event.clientY - arrowY;
		//angle = Math.atan2(dy, dx);
	});
	document.body.addEventListener("mousemove", function(event) {
		eventVec = [event.clientX, event.clientY];
		vMouse = [event.clientX - width/2, height/2 - event.clientY]
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