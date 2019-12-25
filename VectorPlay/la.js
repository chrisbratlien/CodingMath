vscale = (v,factor) => v.map(n => n * factor)
vadd = (a,b) => a.map((asubi,i) => asubi + b[i]) // a-> + b-> 
vdiff = (a,b) => vadd(a,vscale(b,-1));
vsub = vdiff;
vlerp = (a,b,factor) => vadd(a,vscale(vdiff(b,a),factor))
vdot = (a,b) => a.reduce((accum,asubi,i) => accum + asubi * b[i],0)

/**
[[2,5,6],
  [1,3,4]]
=> 
[[2,1],
[5,3],
[6,4]]

mr = [2,5,6]
  c = 2, ri=0, cj=0
  c = 5, ri=0, cj=1
  c = 6, ri=0, cj=2
mr = [1,3,4]
  c = 1, ri=1, cj=0
  c = 3, ri=1, cj=1
  c = 4, ri=1, cj=2
**/

transpose = (m) => {
  //let res = new Array(m[0].length);
  let res = [];
  for (var i = 0; i < m[0].length; i += 1) {
  	res.push([]);
  }
  m.forEach( (mr,ri) =>{
  	mr.forEach( (cv,cj) => {
  	  res[cj][ri] = cv;
  	})
  })
  return res;
}

mmultAB = (A,B) => {
  let AT = transpose(A);
  return B.map((Br,Bri) => AT.map( (ATr,ATri) => vdot(ATr,Br)));
  /**
  let BT = transpose(B);
  return A.map((Ar,Ari) => BT.map( (BTr,BTri) => vdot(BTr,Ar)));
  **/
}

//Ts as separate args
mmult = (...Ts) => Ts.reduce( (accum,T) => mmultAB(accum,T));


/*
// Ts must be array
mmult = (Ts) => Ts.reduce( (accum,T) => mmultAB(accum,T));
*/

v2m = (v) => v.map(vv => [vv]);


//mmult(rotation,v2m([1,2])).flat())

/**
vdiff([0,0],[4,8])
(2) [4, 8]
vscale([0,1,2],2)
(3) [0, 2, 4]
vscale(vdiff([0,0],[4,8]),0.5)
(2) [2, 4]
vscale(vdiff([0,0],[4,8]),0.75)
(2) [3, 6]
vadd([0,0,2],[1,2,3])
(3) [1, 2, 5]
vlerp([0,0,2],[4,8,9],1)
(3) [4, 8, 9]
start = [0,0,0]
(3) [0, 0, 0]
end = [255,127,63]
(3) [255, 127, 63]
[0,1,2,3,4,5,6,7,8,9,10].map(o => vlerp(start,end,o/10))
	.forEach(stop => jQuery('body')
	.append(DOM.div('example')
	.css('color',`rgb(${stop[0]},${stop[1]},${stop[2]}`)))
**/