// This macro draws convex hulls using the "gift wrap" algorithm discribed at
//     http://www.cse.unsw.edu.au/~lambert/java/3d/hull.html



macro "Analyze Particles and Draw" {

    nb = 70;
    nb_warmup = 5;
    moy = newArray(11);
    med = newArray(11);
    image = "/home/jean/Documents/MasterBioinfo/M2/Bio_structural/imageBenchmarkIMJ/particle"+2+".jpg";
    trash = convexHullLoop(1, image);

    for (j=1; j<=11; j++) {
    image = "/home/jean/Documents/MasterBioinfo/M2/Bio_structural/imageBenchmarkIMJ/particle"+j+".jpg";
    //trash = convexHullLoop(nb_warmup, image);
    result = convexHullLoop(nb, image);
    total = 0;
    for (i=0; i<result.length; i++) total += result[i];
    //print(total/nb)
    //Array.print(result);
    moy[j-1] = total/nb;
    med[j-1] = result[nb/2];
    }
    Array.show("results_indexes", moy, med);
}


function convexHullLoop(nb, image){
  result = newArray(nb);
  for (i=0; i<nb; i++) {
    open(image);
    setOption("BlackBackground", false);
    run("Make Binary");

    run("Analyze Particles...", "show=Nothing exclude clear record");
    t1 = getTime();
    drawAllConvexHulls();
    t2 = getTime();
    t = t2 - t1;
    run("Close");
    total += t;
    result[i] = t;
}
Array.sort(result);
return result;
}

function drawAllConvexHulls() {
    for (i=0; i<nResults; i++) {
        x = getResult('XStart', i);
        y = getResult('YStart', i);
        doWand(x,y);
        drawConvexHull(false);
        if (i%5==0) showProgress(i/nResults);
   }
    run("Select None");
}

function drawConvexHull(animate) {
    requires("1.30l");
    getSelectionCoordinates(xCoordinates, yCoordinates);
    n = xCoordinates.length;
    run("Line Width...", "line=1");
    setForegroundColor(0,0,0); // black
    if (animate) snapshot();
    p1 = findFirstPoint(xCoordinates, yCoordinates);
    pstart = p1;
    autoUpdate(false);
    do {
        x1 = xCoordinates[p1];
        y1 = yCoordinates[p1];
        p2 = p1+1; if (p2==n) p2=0;
        x2 = xCoordinates[p2];
        y2 = yCoordinates[p2];
        p3 = p2+1; if (p3==n) p3=0;
        do {
            x3 = xCoordinates[p3];
            y3 = yCoordinates[p3];
            if (animate) drawTriangle(x1,y1,x2,y2,x3,y3,n);
            determinate = x1*(y2-y3)-y1*(x2-x3)+(y3*x2-y2*x3);
            if (determinate>0)
                {x2=x3; y2=y3; p2=p3;}
            p3 += 1; if (p3==n) p3 = 0;
        } while (p3!=p1);
        if (animate)
           {reset(); drawLine(x1,y1,x2,y2); snapshot();}
        else
            drawLine(x1,y1,x2,y2);
        p1 = p2;
    } while (p1!=pstart);
    updateDisplay();
}

// find upper right point that is guaranteed to be on convex hull
 function findFirstPoint(xCoordinates, yCoordinates) {
    n = xCoordinates.length;
    smallestY = getHeight();
    for (i=0; i<n; i++) {
        y = yCoordinates[i];
        if (y<smallestY)
            smallestY = y;
    }
    smallestX = getWidth();
     for (i=0; i<n; i++) {
        x = xCoordinates[i];
        y = yCoordinates[i];
        if (y==smallestY && x<smallestX) {
           smallestX = x;
            p1 = i;
        }
    }
    return p1;
}

function drawTriangle(x1,y1,x2,y2,x3,y3, n) {
    reset();
    moveTo(x1,y1);
    lineTo(x2,y2);
    lineTo(x3,y3);
    lineTo(x1,y1);
    updateDisplay();
    delay = 25000/(n*n);
    if (delay>250) delay = 250;
    if (delay<1) delay = 1;
    wait(delay);
}

// print(xCoordinates[6]+" "+yCoordinates[6]);
