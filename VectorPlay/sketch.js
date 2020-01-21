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
	poly3D,
	poly3DW,
	paused,
	setup,
	render,
	v345,
	m345;

	var dx, dy,
	angle = 0,
	da = 0;
	a = 0;

function vPlot(vOrigin,v) {
	//context.strokeStyle = getRandomColor();
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

		shear = [
			[1,1],
			[0,1]
		]
		rotation = [
		  [0,-1],
		  [1, 0]
		];


Tr = {
	rotateMemo: function(theta) {
		let cos = Math.cos(theta),
		sin = Math.sin(theta),
		negSin = -1 * sin
		return [cos,sin,negSin];
	},
	xy: {},
	xyw: {},
	xyz: {},
	xyzw: {}
};

Tr.xy.rotate = function(theta) {
	let [cos,sin,negSin] = Tr.rotateMemo(theta);
	return [
		[cos, negSin],
		[sin,    cos]
	];
}

Tr.xy.scalarScale = function(factor) {
	return [
		[factor,0],
		[0,factor]
	];
}
Tr.xy.scale = function(vFactor) {
	return [
		[vFactor[0],0],
		[0,vFactor[1]]
	];
}




Tr.xyw.rotate = function(theta) {
	let [cos,sin,negSin] = Tr.rotateMemo(theta);
	return [
		[cos, negSin, 0],
		[sin,    cos, 0],
		[  0,      0, 1]
	];
}


Tr.xyzw.translateXYZ = function(v) {
	return [
		[1, 0, 0, v[0]],
		[0, 1, 0, v[1]],
		[0, 0, 1, v[2]],
		[0, 0, 0,    1]
	];
}


Tr.xyz.rotateZ = function(theta) { //around Z axis
	let [cos,sin,negSin] = Tr.rotateMemo(theta);
	return [
		[cos, negSin, 0],
		[sin,    cos, 0],
		[  0,      0, 1]
	];
}

Tr.xyz.rotateX = function(theta) { // around X axis
	let [cos,sin,negSin] = Tr.rotateMemo(theta);
	return [
		[1,   0,      0],
		[0, cos, negSin],
		[0, sin,    cos]
	];
}

Tr.xyz.rotateY = function(theta) { // around Y axis
	let [cos,sin,negSin] = Tr.rotateMemo(theta);
	return [
		[   cos, 0, sin],
		[     0, 1,   0],
		[negSin, 0, cos]
	];
}


Tr.xyz.toXY = [
		[1, 0, 0],
		[0, 1, 0]
];



Tr.toW = function (v) {
	var result = v.map( (row,ri) => {
		return [...row, 0];
	});
	var last = result[result.length-1];
	result.push(last.map( (el,i) => i == last.length-1 ? 1 : 0));
	return result;
}

Tr.xyzw.rotateZ = function(theta) { //around Z axis
	let [cos,sin,negSin] = Tr.rotateMemo(theta);
	return [
		[cos, negSin, 0, 0],
		[sin,    cos, 0, 0],
		[  0,      0, 1, 0],
		[  0,      0, 0, 1]
	];
}

Tr.xyzw.rotateX = function(theta) { // around X axis
	let [cos,sin,negSin] = Tr.rotateMemo(theta);
	let result = [
		[1,   0,      0, 0],
		[0, cos, negSin, 0],
		[0, sin,    cos, 0],
		[0,   0,      0, 1]
	];
	if (debug) {
		console.log('Tr.xyzw.rotateX theta:',theta);
		console.table(result);
		debug = true;
	}
	return result;
}

Tr.xyzw.rotateY = function(theta) { // around Y axis
	let [cos,sin,negSin] = Tr.rotateMemo(theta);
	return [
		[   cos, 0, sin, 0],
		[     0, 1,   0, 0],
		[negSin, 0, cos, 0],
		[     0, 0,   0, 1]
	];
}

Tr.xyzw.translateXYZ = function(v) {
	return [
		[1, 0, 0, v[0]],
		[0, 1, 0, v[1]],
		[0, 0, 1, v[2]],
		[0, 0, 0,    1]
	];
}

Tr.xyzw.toXY = [
		[1, 0, 0, 0],
		[0, 1, 0, 0]
];

Tr.xyzw.toXYZ = [
		[1, 0, 0, 0],
		[0, 1, 0, 0],
		[0, 0, 1, 0]
];




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


function plotMe(f) {
	context.beginPath();
	f();
	context.stroke();
}

function polyMatrixToW(m) {
	return transpose(transpose(m).map(r => [...r,1]));
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

		wasPoly = [
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
		poly3D = transpose([
			[0,0,0], //bottom left
			[50,0,0],//bottom right
			[50,50,0], //top right
			[0,50,0] //top left
		]);
		poly3DW = transpose([
			[0,0,0,1],//BL
			[50,0,0,1],//BR
			[50,50,0,1],//TR
			[0,50,0,1] //TL
		]);


		linaz = transpose([
			[130,80,0],
			[-20,90,0],
			[30,60,0]
		]);

		v345 = [[3,4,5]];
		m345 = transpose(v345);

		v012345 = [
			[0,10,20],
			[30,40,50]
		];
		m012345 = transpose(v012345);


		context.strokeStyle = getRandomColor();
		context.beginPath();
		plotPolyMatrix(poly);
		context.stroke();


		context.strokeStyle = getRandomColor();
		context.lineWidth = 1;
		//context.beginPath();
		plotPolyMatrix(
				mmult(
					poly,
					Tr.xy.rotate(Math.random() * 2 * Math.PI),
					Tr.xy.scale([2,2])
				)
		);
		//context.stroke();


		context.strokeStyle = getRandomColor();
		//context.beginPath();
		plotPolyMatrix(linaz);

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
		//polyPlot(poly.map(v => mmult(v2m(v),Tr.xy.rotate(theta)).flat()));

		T = mmult(
			Tr.xy.scale([0.2,2.5]),
			Tr.xy.rotate(theta)
		);
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
		da = .01;
		a += da;
		poly = mmult(
			poly,
			Tr.xy.rotate(da)					
		);


		linaz = mmult(
			linaz,
			//Tr.xyz.rotateZ(da),					
			Tr.xyz.rotateY(2*da),
			Tr.xyz.rotateX(da)		
		);


		/*
		poly3D = mmult(
			//polyMatrixToW(poly3D),
			poly3D,
			//Tr.xyz.rotateZ(a),					
			//Tr.xyzw.translateXYZ([0,-1,0]),
			Tr.xyz.rotateY(2*a),
			///Tr.xyz.toXY
			//Tr.xyzw.rotateX(a)
		);
		**/


		poly3DW = mmult2(
			poly3DW,
			Tr.xyzw.rotateX(-2*da),
			//poly3DW
			//Tr.xyzw.rotateY(0.2*da),
			//Tr.xyzw.rotateZ(0.5*da),
			//////Tr.xyzw.translateXYZ([1,-1*a,0])
		);


		let poly3DWXY = [
			poly3DW[0][0],
			poly3DW[1][0]
		];

		lerped = vlerp(poly3DWXY,vGoal,0.33);
		lerpDiff = vdiff(lerped,poly3DWXY);
		console.log('goal',vGoal);
		console.log('poly',poly3DWXY);
		console.log('lerped',lerped);
		console.log('lerpDiff',lerpDiff);

		var lerpDiffXYZ = [...lerpDiff,0];
		console.log('lerpDiffXYZ',lerpDiffXYZ);


		console.log('BEFORE');
		console.table(poly3DW);
		poly3DW = mmult2(
			poly3DW,
			Tr.xyzw.translateXYZ(lerpDiffXYZ)
		);
		console.log('AFTER');
		console.table(poly3DW);
		
		context.clearRect(0-width/2,0-height/2,width,height);

		context.save();

		context.beginPath();
		//plotPolyMatrix(poly);
		plotPolyMatrix(
			mmult(
				transpose(transpose(linaz).map(r => [...r,1])),
				Tr.xyzw.translateXYZ([0,-1,0]),
				Tr.xyzw.toXY
			)
		);
		plotPolyMatrix(
			mmult2(
				poly3DW,
				Tr.xyzw.toXY
			)
		);
		context.stroke();
		context.restore();

		if (!paused) {
			setTimeout(function(){
				requestAnimationFrame(render);
			},1);
		}
		return false;//BAIL OUT EARLY
	
		context.strokeStyle = 'rgba(255, 255, 0,0.2)';
		context.beginPath();
		vSave = [...vSeg];
		vSeg = vlerp(vSeg,vGoal,0.5);
		vPlot(vSave,vSeg);
		context.stroke();
		context.restore();
		setTimeout(function() {
			requestAnimationFrame(render);
		},5);
	};//render


	setup();
	plotiHat();
	plotjHat();
	render();






	document.body.addEventListener("mouseup", function(event) {
		//eventVec = [event.clientX, event.clientY];
		vMouse = [event.clientX - width/2, height/2 - event.clientY];
		vGoal = [...vMouse];
		console.log('CLICK',vMouse,vGoal);
		debug = true;
		//requestAnimationFrame(render);
	});
	document.body.addEventListener("mousemove", function(event) {
		eventVec = [event.clientX, event.clientY];
		vMouse = [event.clientX - width/2, height/2 - event.clientY];
	});


};