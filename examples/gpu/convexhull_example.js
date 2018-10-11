
// Create an Image containing boats (from ImageJ))
// //
let img = new T.Image('uint8',200,100);
img.setPixels(new Uint8ClampedArray(particlesROIinv_pixels));
// let img = new T.Image('uint8',20,10);
// img.setPixels(new Uint8ClampedArray(test_line10x20));
// let img = new T.Image('uint8',20,20);
// img.setPixels(new Uint8ClampedArray(tricky));
// tricky

raster = img.getRaster();

let view = cpu.view(raster);

// Create the window content from the view
let win = new T.Window(`Particles`);
win.addView(view);
// Add the window to the DOM and display it
win.addToDOM('workspace');

// Get a graphics context from canvas
let gpuEnv = gpu.getGraphicsContext();

convexHull(raster, gpuEnv);
