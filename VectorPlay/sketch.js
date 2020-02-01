var canvas,
	context,
	ctx,
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
	m345,
	yAngGoal,
	yAngDiff,
	yAng;

	var dx, dy,
	angle = 0,
	da = 0;
	a = 0;

	xAng = 0;
	xAngDiff = 0;
	xAngGoal = 0;

	yAng = 0;
	yAngDiff = 0;
	yAngGoal = 0;


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
	let colors = [
		'white',
		'teal',
		'magenta',
		'orange',
		'pink'
	];
	polyVecs.forEach((v,i) => {
		if (i > 0) {
			context.strokeStyle = colors[i];

			vPlot(polyVecs[i-1],v)
		}
	})
	context.strokeStyle = colors[colors.length-1];
	vPlot(polyVecs[polyVecs.length-1],polyVecs[0]);
}

function plotPolyMatrix(m) {


	if (debug) {
		console.log('plotPolyMatrix m');
		console.table(m)		
	}
	if (isNaN(m[0][0])) {
		throw "NONANANA";
	}
	plotPolyVecs(m);
}

		shear = [
			[1,1],
			[0,1]
		]
		rotation = [
		  [0,-1],
		  [1, 0]
		];



 var axes = {


 };

function funGraph (ctx,axes,func,color,thick) {
	var xx, yy, 
	dx=4, 
	x0=center[0], 
	y0=center[1], 
	scale=axes.scale;

	//var iMax = Math.round((ctx.canvas.width-x0)/dx);
	var iMax = Math.round(
		vsub(rightCenter,leftCenter)[0] / dx
	);
	iMin = 0;
	if (axes.doNegativeX) {
		iMin = leftCenter[0] / dx;
		//x0 = leftCenter[0];
		//y0 = centerBottom[1];
	}
	//var iMin = axes.doNegativeX ? Math.round(-x0/dx) : 0;
	ctx.beginPath();
	ctx.lineWidth = thick;
	ctx.strokeStyle = color;

	for (var i=iMin;i<=iMax;i++) {
		xx = dx*i; yy = scale*func(xx/scale);
		if (i==iMin) {
			ctx.moveTo(x0+xx,y0+yy);
		}
		else {
	      ctx.lineTo(x0+xx,y0+yy);			
		}   
	}
	ctx.stroke();
}

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
		//debug = true;
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
Tr.xyzw.rotate = function(vTheta) {
	return mmult(
		Tr.xyzw.rotateX(vTheta[0]),
		Tr.xyzw.rotateY(vTheta[1]),
		Tr.xyzw.rotateZ(vTheta[2])
	)
};

Tr.xyzw.translateXYZ = function(v) {
	return transpose([
		[1, 0, 0, v[0]],
		[0, 1, 0, v[1]],
		[0, 0, 1, v[2]],
		[0, 0, 0,    1]
	]);
}


Tr.xyzw.toXY = transpose([
		[1, 0, 0, 0],
		[0, 1, 0, 0]
]);

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


function test() {


}

window.onload = function() {
		canvas = document.getElementById("canvas"),
		context = canvas.getContext("2d"),
		ctx = context,
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


		//graphic calculator stuff.
		axes.x0 = .5 + .5*canvas.width;  // x0 pixels from left to x=0
		//axes.x0 = 0;
		axes.y0 = .5 + .5*canvas.height; // y0 pixels from top to y=0
		axes.scale = 40;                 // 40 pixels from x=0 to x=1
		axes.doNegativeX = true;
		//axes.doNegativeX = false;



		leftCenter = vsub(center,[width/2,0]);
		leftTop = vadd(center,[0,height/2]);
		console.log(leftTop,'left top');
		rightCenter = vadd(center,[width/2,0]);
		centerTop = vadd(center,[0,height/2]);
		centerBottom = vsub(center,[0,height/2]);


		vMouse = [0,0];
		vGoal = [0,0];
		vNew = [0,0];
		vSave = [0,0];
		vSeg = [0,0];

		context.strokeStyle = 'rgba(0, 0, 0,0.2)';
		console.log(leftCenter,rightCenter);

		plotAxes();
		//testPlot();

		//make these matrices arrays of COLUMN vectors,
		//so each JS row is a COLUMN vector

		wasPoly = [
			[10,20],
			[90,-10],
			[30,40]
		];
		poly = [
			[0,0],
			[50,0],
			[50,50],
			[0,50]
		];
		poly3D = [
			[0,0,0], //bottom left
			[50,0,0],//bottom right
			[50,50,0], //top right
			[0,50,0] //top left
		];
		poly3DW = [
			[10,10,0,1],//BL
			[50,10,0,1],//BR
			[50,50,0,1],//TR
			[10,50,0,1] //TL
		];


		linaz = [
			[130,80,0],
			[-20,90,0],
			[30,60,0]
		];

		v345 = [[3,4,5]];
		m345 = transpose(v345);

		v012345 = [
			[0,10,20],
			[30,40,50]
		];
		m012345 = transpose(v012345);



		/***
		context.strokeStyle = getRandomColor();
		context.beginPath();
		plotPolyMatrix(poly);
		context.stroke();
		***/

		context.strokeStyle = getRandomColor();
		context.lineWidth = 1;
		//context.beginPath();
		plotPolyMatrix(
				mmult(
					Tr.xy.rotate(Math.random() * 2 * Math.PI),
					Tr.xy.scale([2,2]),
					poly,
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
		polyPlot(poly.map(v => mmult(T,v2m(v)).flat()));

		context.stroke();

		return false;

		//shear then rotate
		context.strokeStyle = 'rgba(0, 255, 127,0.5)';
		context.beginPath();
		T = mmult(shear,rotation);//,rotation);
		polyPlot(poly.map(v => mmult(T,v2m(v)).flat()));
		context.stroke();


		//rotate then shear
		context.strokeStyle = 'rgba(0, 127, 255,0.5)';
		context.beginPath();
		T = mmult(rotation,shear);
		polyPlot(poly.map(v => mmult(T,v2m(v)).flat()));
		context.stroke();

		//rotate then shear
		context.strokeStyle = 'pink';
		context.beginPath();
		T = mmult(shear,rotation,shear);
		polyPlot(poly.map(v => mmult(T,v2m(v)).flat()));
		context.stroke();

		context.strokeStyle = 'yellow';
		context.beginPath();
		T = mmult(shear,rotation,shear,rotation);
		polyPlot(poly.map(v => mmult(T,v2m(v)).flat()));
		context.stroke();

		context.strokeStyle = 'black';
		context.beginPath();
		T = mmult(shear,rotation,shear,rotation,shear);
		polyPlot(poly.map(v => mmult(T,v2m(v)).flat()));
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


normalize = (val,min,max) => { return (val - min) / (max - min); }


	function testMult() {

		let a = [[2,4],[-1,-2]];
		let b = [[3,1],[0,2]];
		let c = [[1,2],[-2,-4]];

		var rab = mmultAB(a,b);
		if (rab.toString() !== [[5,10],[-2,-4]].toString()) { 
			throw "OOPS AB"; 
		}

		var rba = mmultAB(b,a);
		if (rba.toString() !== [[6,10],[-3,-5]].toString()) { 
			throw "OOPS BA"; 
		}

		var rac = mmultAB(a,c);
		if (rac.toString() !== [[0,0],[0,0]].toString()) { 
			throw "OOPS AC"; 
		}

		console.log('PASSES TEST');
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
			Tr.xy.rotate(da),
			poly
		);


		linaz = mmult(
			//Tr.xyz.rotateZ(da),					
			Tr.xyz.rotateY(2*da),
			Tr.xyz.rotateX(da),
			linaz,
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


		[xAng] = vlerp([xAng],[xAngGoal],0.5);//0.5);
		xAngDiff = xAngGoal - xAng;
		debug && console.log('xAngGoal,xAng,xAngDiff',xAngGoal,xAng,xAngDiff);

		[yAng] = vlerp([yAng],[yAngGoal],0.5);
		yAngDiff = yAngGoal - yAng;
		debug && console.log('yAngGoal,yAng,yAngDiff',yAngGoal,yAng,yAngDiff);




		let poly3DWXY,saveXYZ,toOrigin;
 		poly3DWXY = [
			poly3DW[0][0],
			poly3DW[0][1]
		];
		saveXYZ = [poly3DWXY[0],poly3DWXY[1],0];
		toOrigin = vscale(saveXYZ,-1);


		if (xAngDiff + yAngDiff !== 0) {
			poly3DW = mmult(
				//go to origin
				Tr.xyzw.translateXYZ(toOrigin),
				Tr.xyzw.rotate([-xAngDiff,yAngDiff,0]),
				//return to save
				Tr.xyzw.translateXYZ(saveXYZ),
				poly3DW
			);
		}



		lerped = vlerp(poly3DWXY,vGoal,0.33);
		lerpDiff = vdiff(lerped,poly3DWXY);

		/*
		console.log('goal',vGoal);
		console.log('poly',poly3DWXY);
		console.log('lerped',lerped);
		console.log('lerpDiff',lerpDiff);
		*/
		var lerpDiffXYZ = [...lerpDiff,0];
		debug && console.log('lerpDiffXYZ',lerpDiffXYZ);



		/**
		console.log('BEFORE');
		console.table(poly3DW);
		**/

 		poly3DWXY = [
			poly3DW[0][0],
			poly3DW[0][1]
		];
		saveXYZ = [poly3DWXY[0],poly3DWXY[1],0];
		toOrigin = vscale(saveXYZ,-1);

		poly3DW = mmult(
			Tr.xyzw.translateXYZ(toOrigin),
			Tr.xyzw.translateXYZ(lerpDiffXYZ),
			Tr.xyzw.translateXYZ(saveXYZ),
			poly3DW,
		);
		/**
		console.log('AFTER');
		console.table(poly3DW);
		**/



		context.clearRect(0-width/2,0-height/2,width,height);

		context.save();

		context.beginPath();
		//plotPolyMatrix(poly);
		plotPolyMatrix(
			mmult(
				//Tr.xyzw.translateXYZ([0,-1,0]),
				Tr.xyzw.toXY,
				linaz.map(r => [...r,1]),
			)
		);



		plotPolyMatrix(
			mmult(
				Tr.xyzw.toXY,
				poly3DW
			)
		);
		context.stroke();
		context.restore();

		if (!paused) {
			setTimeout(function(){
				requestAnimationFrame(render);
			},10);
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
		},1500);
	};//render


	setup();
	plotiHat();
	plotjHat();
	testMult();
	//render();
	let yEqualsX = (x) => x;
	funGraph(ctx,axes,yEqualsX,getRandomColor(),2);






	document.body.addEventListener("mouseup", function(event) {
		//eventVec = [event.clientX, event.clientY];
		vMouse = [event.clientX - width/2, height/2 - event.clientY];
		vGoal = [...vMouse];
		console.log('CLICK',vMouse,vGoal);
		//debug = true;
		//requestAnimationFrame(render);
	});

	document.body.addEventListener("mousemove", function(event) {
		//eventVec = [event.clientX, event.clientY];
		vMouse = [event.clientX - width/2, height/2 - event.clientY];
		[vX,vY] = vMouse;
		var nX = Math.PI * (normalize(vX,leftCenter[0],rightCenter[0]) - 0.5);
		var nY = Math.PI * (normalize(vY,-height/2,height/2) - 0.5);
		///console.log(vX,'vmouse',nX);
		yAngGoal = nX; //yes, flip the mouse motion with the axis of rotation
		xAngGoal = nY;
	});

	//setTimeout(render,3000);

};