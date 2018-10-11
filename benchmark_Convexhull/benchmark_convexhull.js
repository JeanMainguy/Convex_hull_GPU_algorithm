Array.prototype.extend = function (other_array) {
    /* you should include a test to check whether other_array really is an array */
    other_array.forEach(function(v) {this.push(v)}, this);
}

const printMeasures = function(measures){

    var mean = 0;
    var ecartype = 0;

    measures.sort();
    var median = measures[50];
    console.log("median =", median);

    var meanListe = measures.map(function(x){
        if(x < median*3){
            return x;
        }
        else{
            return median;
        }
    })
    for(a=0;a<meanListe.length;a++){
        mean += meanListe[a];
    }
    mean /= meanListe.length;
    console.log("moyenne =", mean);

    for(b=0;b<meanListe.length;b++){
        ecartype += Math.pow(meanListe[b] - mean, 2);
    }
    ecartype /= measures.length;
    ecartype = Math.sqrt(ecartype);
    console.log("ecart-type =", ecartype);
}

let w = 200;
let h = 100;

let pixels = particlesROIinv_pixels;

var times = [];

var j = 0;
var i = 0;
let nbpart = 9;

let img = new T.Image('uint8',w, h);
img.setPixels(new Uint8Array(pixels));
raster = img.getRaster();

let gpuEnv = gpu.getGraphicsContext();

//WARM UP
for(j = 0;j<300;j++){
    // var start = new Date();
    // var start_time = start.getTime();
    // labeled = labelling(raster, gpuEnv);
    // labellingOnePass(img);
    convexHull(raster, gpuEnv);
    // var stop = new Date();
    // var stop_time = stop.getTime();
    // var time = stop_time - start_time;
    // times.push(time);
}

// for(j = 0;j<100;j++){
//     var start = new Date();
//     var start_time = start.getTime();
//     // labeled = labelling(raster, gpuEnv);
//     // labellingOnePass(img);
//     convexHull(raster, gpuEnv);
//     var stop = new Date();
//     var stop_time = stop.getTime();
//     var time = stop_time - start_time;
//     times.push(time);
// }
//
//
// console.log("taille =", raster.length);
// printMeasures(times);


i = 0;
j = 0;

console.log("building the image");
for(i=0;i<4;i++){

    // window.confirm("double height");

    times = [];
    let pixtoadd = pixels.map(function(item) {
      return item == 255 ? item : item + nbpart;});
    nbpart = nbpart*2;

    pixels.extend(pixtoadd);
    h += h;

    img = new T.Image('uint8',w, h);
    img.setPixels(new Uint8Array(pixels));
    raster = img.getRaster();

    gpuEnv = gpu.getGraphicsContext();

    // for(j=0;j<100;j++){
    //     start = new Date();
    //     start_time = start.getTime();
    //     // labeled = labelling(raster, gpuEnv);
    //     // labellingOnePass(img);
    //     convexHull(raster, gpuEnv);
    //     stop = new Date();
    //     stop_time = stop.getTime();
    //     time = stop_time - start_time;
    //     times.push(time);
    // }
    // console.log("taille =", raster.length);
    //
    // printMeasures(times);

    j = 0;

}

i = 0;
for(i=0;i<3;i++){

    // window.confirm("double width");

    times = [];
    meanListe = [];
    mean = 0.0;
    median = 0.0;
    ecartype = 0.0;

    w += w;
    // Add new id to the particle added
    let pixtoadd = pixels.map(function(item) {
      return item == 255 ? item : item + nbpart;});
    nbpart = nbpart*2;

    pixels.extend(pixels);
  }

    img = new T.Image('uint8',w, h);
    img.setPixels(new Uint8Array(pixels));
    raster = img.getRaster();

    // let view = cpu.view(raster);

    // // Create the window content from the view
    // let win = new T.Window(`Particles`);
    // win.addView(view);
    // // Add the window to the DOM and display it
    // win.addToDOM('workspace');

    gpuEnv = gpu.getGraphicsContext();

    for(j=0;j<100;j++){
        start = new Date();
        start_time = start.getTime();
        // labeled = labelling(raster, gpuEnv);
        // labellingOnePass(img);

        convexHull(raster, gpuEnv);
        stop = new Date();
        stop_time = stop.getTime();
        time = stop_time - start_time;
        times.push(time);
    }
    console.log("taille =", raster.length);
    printMeasures(times);

    j = 0;
