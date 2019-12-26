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
	poly,
	paused,
	setup,
	render,
	v345,
	m345;


function vPlot(vOrigin,v) {
	context.strokeStyle = getRandomColor();
	context.beginPath();
	context.moveTo(...vOrigin);
	context.lineTo(...v);
	context.stroke();
}

function plotVecs(ovPairs) {
	ovPairs.forEach((pair,i) => {
		vPlot(pair[0],pair[1])
	});
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

function rotateMemo(theta) {
	let cos = Math.cos(theta),
	sin = Math.sin(theta),
	negSin = -1 * sin
	return [cos,sin,negSin];
}

function rotateT(theta) {
	return [
		[Math.cos(theta), -1 * Math.sin(theta)],
		[Math.sin(theta), Math.cos(theta)]
	];
}

function rotateZT(theta) { //around Z axis
	let [cos,sin,negSin] = rotateMemo(theta);
	return [
		[cos, negSin, 0],
		[sin,    cos, 0],
		[  0,      0, 1]
	];
}
function rotateXT(theta) { // around X axis
	let [cos,sin,negSin] = rotateMemo(theta);
	return [
		[1,   0,      0],
		[0, cos, negSin],
		[0, sin,    cos]
	];
}
function rotateYT(theta) { // around Y axis
	let [cos,sin,negSin] = rotateMemo(theta);
	return [
		[   cos, 0, sin],
		[     0, 1,   0],
		[negSin, 0, cos]
	];
}


project3Dto2D = [
		[1,0,0],
		[0,1,0]
];

wasproject3Dto2D =[
		[1,0],
		[0,1],
		[0,0]
	];

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


function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
function getRandomColor() {
	var rgb = [192,192,192].map(max => getRandomInt(max) + 63);
	var a = Math.random() * (1 - 0.9) + 0.9;
	a = Math.round(a*100) / 100;
	var result = `rgba(${rgb.join(',')},${a})`;
	///console.log(result);
	return result;
}

function plotBasisVector(vecs,style) {
	context.lineWidth = 2;
	context.strokeStyle = style;
	context.beginPath();
	plotVecs(vecs);
	context.stroke();
}


function plotiHat() {
	plotBasisVector([
		[[0,0],[30,0]],
		[[23,5],[30,0]],
		[[23,-5],[30,0]],
	],'rgba(63,255,0,1)');
}

function plotjHat() {
	plotBasisVector([
		[[0,0],[0,30]],
		[[5,23],[0,30]],
		[[-5,23],[0,30]],
	],'rgba(192,31,31,1)');
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

	//orientation
	context.transform(1,0,0,-1,width/2,height/2);
	context.strokeStyle = 'rgba(255, 0, 0,0.5)';


	setup = function() {

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

		plotAxes();
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


		linaz = transpose([
			[130,80,0],
			[-20,90,0],
			[30,60,0]
		]);

		v345 = [[3,4,5]];
		m345 = transpose(v345);

		context.strokeStyle = getRandomColor();
		context.beginPath();
		plotPolyMatrix(poly);
		context.stroke();


		context.strokeStyle = getRandomColor();
		context.lineWidth = 1;
		context.beginPath();
		plotPolyMatrix(
				mmult(
					poly,
					rotateT(Math.random() * 2 * Math.PI),
					scaleT([2,2])
				)
		);
		context.stroke();


		context.strokeStyle = getRandomColor();
		context.beginPath();
		plotPolyMatrix(linaz);
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



	setup();
	plotiHat();
	plotjHat();
	//render();



	function plotAxes() {

		//test plot
		context.strokeStyle = getRandomColor();
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
		context.strokeStyle = getRandomColor();
		context.beginPath();

		vPlot([0,0],[-200,-200]);
		vPlot([0,0],[-200, 200]);
		vPlot([0,0],[200, -200]);
		vPlot([0,0],[200, 200]);
		context.stroke();
	}

	render = function() {
		a = .01;
		poly = mmult(
			poly,
			rotateT(a)					
		);


		linaz = mmult(
			linaz,
			rotateZTa(a/2)					
		);



		
		context.clearRect(0-width/2,0-height/2,width,height);

		context.save();

		context.beginPath();
		plotPolyMatrix(poly);
		plotPolyMatrix(linaz);
		context.stroke();

		context.restore();

		if (!paused) {
			requestAnimationFrame(render);
		}
		return false;
	
		context.strokeStyle = 'rgba(0, 0, 0,0.2)';
		context.beginPath();
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
		vGoal = [...vMouse];
		console.log('CLICK',vMouse,vGoal);
	});
	document.body.addEventListener("mousemove", function(event) {
		eventVec = [event.clientX, event.clientY];
		vMouse = [event.clientX - width/2, height/2 - event.clientY];
	});


};