/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */

 /**
  * @module analyze
  */

  /**
   * Finds the objects in an image and return an labeled image.
   * 8-connected components
   * Implementing the algorithm from Chang et al. (2003) http://www.iis.sinica.edu.tw/papers/fchang/1362-F.pdf
   * The algorithm goes through the image one pixel at a time, from top left to bottom right. When it finds a black pixel, there are three possibilities :
   *          - The pixel is from an external contour
   *          - The pixel is from an internal contour
   *          - The pixel is not in a contour
   * In the first case, it means the pixel has a white unlabeled pixel above it. Then the function contourTracing is called, and will label the whole contour of the particule.
   * If the pixel is not in an external contour, and the pixel under it is white, then the same function as before, contourTracing, is called and will label the inner contour.
   * Finally, if the pixel does not belong to any contour, it simply takes the label from its left neighbor.
   *
   *
   *
   * @param {TImage} img - Input image
   * @param {boolean} copy - Copy mode
   * @return {TRaster} A TRaster with labels as pixel values
   * @author Martin Binet
   */

  const labellingOnePass = function (img,copy=true) {

      function labelOuterContour(index){
        // Starts the tracer for the outer contour of the particule
          matrixLabel[index] = label;
          contourTracing(img_copy, w, h+1, [(index%w), Math.floor(index/w)], 7, matrixLabel, label);
          label++;
      }

      function labelInnerContour(index){
        // Starts the tracer for the inner contour of the particule
          checkPixel();
          contourTracing(img_copy, w, h+1, [(index)%w, Math.floor(index/w)], 3, matrixLabel, pLabel);
      }

      function checkPixel(index){
        // If the pixel has no label, it gets the same as its left neighbor
          (pLabel === 0)? (
            pLabel = matrixLabel[index-1],
            matrixLabel[index] = matrixLabel[index-1]
          ) : null;
      }

    let w = img.width;
    let h = img.height;
    // Création d'une copie de l'image avec une ligne suplémentaire de pixels blanc au dessus
    // Creating a copy of the image with one extra row of white pixels on top
    let img_copy = Array.apply(null, Array(w)).map(Number.prototype.valueOf,0);
    img.getRaster().pixelData.forEach( value => img_copy.push(value));

    // Initialization of the label and the matrix containing it
    let label = 1;
    let matrixLabel = new Array(img.length + w).fill(0);

    img_copy.forEach( function(value, index) {
        pLabel = matrixLabel[index];
        (value === 255) ? (
          (img_copy[index-w] === 0 && pLabel === 0) ? (labelOuterContour(index)) : (
            (img_copy[index+w] === 0 && matrixLabel[index+w] != -1)? labelInnerContour(index) : checkPixel(index)
          )
        ) : null;
      });

      label_raster = new T.Raster("uint8", w, h);
      label_raster.pixelData = matrixLabel.slice(w);


      return label_raster;
  }

  /**
   * Starting from a pixel belonging to a contour, calls the tracer function in a loop, and checks at each iteration if two conditions are true :
   *          - The pixel returned by tracer is the same as the second pixel of the contour
   *          - The previous pixel that was returned by tracer is the same as the initial pixel
   * If both conditions are true, the function stops without returning anything.
   *
   *
   *
   * @param {TRaster} img - Input image
   * @param {int} w - width of the input image
   * @param {int} h - height of the input image
   * @param {Array} origin - Coordinates x and y of the first pixel of the contour
   * @param {int} angle - Angle at where to start looking for neighbor. This is used for the function tracer
   * @param {Array} matrixLabel - current matrix contening the labeled objects
   * @param {int} label - current label

   * @author Martin Binet
   */

  const contourTracing = function(img, w, h, origin, angle, matrixLabel, label){
    let second;
    let tmp;
    tmp = tracer(img, w, h, origin[0], origin[1], angle, matrixLabel);
    (tmp != null) ? (
      second = tmp.slice(1, 3),
      angle = (tmp[0] + 6) % 8) : null;
    let nextPixel = second;
    let previousPixel;
    while (second != null && !((JSON.stringify(origin) === JSON.stringify(previousPixel)) && (JSON.stringify(second) === JSON.stringify(nextPixel)))){
      previousPixel = nextPixel;
      tmp = tracer(img, w, h, nextPixel[0], nextPixel[1], angle, matrixLabel);
      (tmp != null) ? (
        nextPixel = tmp.slice(1, 3),
        angle = (tmp[0] + 6) % 8,
        matrixLabel[nextPixel[0] + nextPixel[1] * w] = label
      ) : null;
    }
  }

  /**
   * From a contour pixel, labels the next pixel in that contour and returns it
   * This function uses the following rotation matrix :
   * 5 6 7
   * 4   0
   * 3 2 1
   * Starting from the input angle, it cheks each neighbor pixel until it finds a black one.
   *
   * @param {TRaster} img - Input image
   * @param {int} w - width of the input image
   * @param {int} h - height of the input image
   * @param {int} i - x coordinate of the middle pixel
   * @param {int} j - y coordinatlabel_imge of the middle pixel
   * @param {int} angle - angle at which to start the rotation
   * @param {Array} matrixLabel - current matrix contening the labeled objects
   * @return {Array} An array containing the angle at which the next pixel was found and its coordinates
   * @author Martin Binet
   */
  const tracer = function(img, w, h, x, y, angle, matrixLabel = null){
    let rotationMatrixX = [1, 1, 0, -1, -1, -1, 0, 1];
    let rotationMatrixY = [0, 1, 1, 1, 0, -1, -1, -1];
    let result = null;
    rotationMatrixX.forEach( function(element){
      (result === null) ? (
      nextX = x+rotationMatrixX[angle],
      nextY = y+rotationMatrixY[angle],
      (0 <= nextX && nextX <= w && 0 <= nextY && nextY < h ) ? (
        (img[nextX + nextY * w] > 0) ? (
          result = [angle, nextX, nextY]
        ) : (
          (matrixLabel != null) ? (
              matrixLabel[nextX + nextY * w] = -1
          ) : null
        )
      ) : null,
      angle = (angle + 1) % 8
    ) : null;
    });
    return result;

  }

  /**
   * Algorithm Two Pass
   * Consists of two pass:
   * First pass : the algo goes to each pixel and
   * labelised it according to the neigbors pixel above and on the left by taking the lowest pixels
   * and notify a variable call union find.
   * In the second pass the algo cleans the particle that have different label by using the union find.
   *
   * @param {TImage} img - Input image
   * @param {boolean} copy - Copy mode
   * @return {TRaster} A TRaster with labels as pixel values
   * @author Jean Mainguy
   */
  const labellingTwoPass = function (img,copy=true) {


    function label_pix (i, label_img, w, union_find) {

        let label_up = i-w < 0 ? 0 : label_img[i-w]; //store label of pixel above i. may bereal label or undefined/null
        let label_left = i % w == 0 ? 0 : label_img[i-1]; // store label of pixel right before i. may be real label or undefined/null

        let label_i = label_up !== 0 && label_left !== 0 ? ( //
                notify_union_find(label_up, label_left, union_find), //if the label up and label rigth are labbeled then the union find structure is notify
                label_up > label_left ? label_left : label_up  // label_i (label of the current pixel analysed) take the smalest label of the neigbor
            ) : (
                label_up == 0 && label_left == 0 ? (
                    new_label(union_find) // if the two the pixels up and left are backgrounf pixel then a new label is provided to label_i
                    ) : (
                    label_up == 0 ? label_left : label_up // and finally if the only one neighbor is label, label_i get this label
                        )
                );
        label_img[i] = label_i;
    };

    function notify_union_find(labelA, labelB, union_find){
        labelA < labelB ? (union_find[labelB] = union_find[labelA]) : (union_find[labelA] = union_find[labelB]);
    };

    function getLabelFromUnionFind(label, union_find){
      let corect_label = union_find[label] == label ? (label) : getLabelFromUnionFind(union_find[label], union_find);
      return corect_label;
    };

    function new_label(union_find){
        union_find.label_cmpt ++;
        union_find[union_find.label_cmpt] = union_find.label_cmpt;
        return union_find.label_cmpt;
    };

    let raster = img.getRaster();
    union_find = {label_cmpt:0, 0:0};

    let label_img = new Array(img.height*img.width); //empty array that will contain labels of the pixels
    label_img.fill(0);
    // First Pass
    raster.pixelData.forEach(function(pix, i){
      pix == 255 ? label_pix(i, label_img, raster.width, union_find) : undefined;
    });
    // Second Pass
    label_img = label_img.map((label, i) => getLabelFromUnionFind(label, union_find));

    let label_raster = new T.Raster("uint8", raster.width, raster.height);
    label_raster.pixelData = label_img;


    return label_raster;
  }

  /**
   * Label an image as a set of Regions Of Interest (ROI)
   * Once the first pixel of a connected component is found, all the connected pixels of that connected component are labelled before going onto the next pixel in the image
   * @param {TImage} img - Input image
   * @param {boolean} copy - Copy mode
   * @return {TRaster} a Raster with the labels as pixel values
   * @author Rokhaya BA
   */
  const labellingOneComponent = function (img,copy=true) {

    const labelComponent = function(){
      while (pixelList.length != 0)
      {
        let index = pixelList[0]; // stores the index of the first pixel and then remove it from the pixel list
        pixelList.shift();
        let ind_up = index - width;
        let ind_down = index + width;
        let ind_right = ((index + 1) % width == 0) ? undefined : index + 1; // check if the pixel has a neighbour on the right
        let ind_left = (index % width == 0) ? undefined : index - 1; // check if the pixel has a neighbour on the left
        let indexList = [ind_up,ind_down,ind_right,ind_left];
        indexList.forEach(function(ind_neighbour)
        {
            (pixelArray[ind_neighbour] == 255 && labelData[ind_neighbour] == 0) ?
            (
          pixelList.push(parseInt(ind_neighbour)), // parseInt transform a string to int
          labelData[parseInt(ind_neighbour)] = label
        ) : null;
        });
      }
    }

      let raster = img.getRaster();
      let pixelArray = raster.pixelData;
      let pixelList = new Array(); // An empty array for keeping pixels
      let label = 1;
      let labelData = new Array(img.height*img.width).fill(0); // An empty array which stores labels for each pixel
      let width = img.width; //    // function getParticle(list_p, label, i ){
    //   return list_p = label < 1 ? (list_p) :(
    //   index = labels.indexOf(label),
    //   index != -1 ? label_array[index].push(labbeled_raster.xy(i)) : label_array.push([labbeled_raster.xy(i)]),
    //   list_p);
    // }
      let length = pixelArray.length;
      pixelArray.forEach(function(elem,i)
      {
  	     (elem == 255 && labelData[i] == 0) ? (
    	    pixelList.push(i),
    	    labelData[i] = label,
          labelComponent(),
    	    label = label + 1
        ) : null;
  });

  let label_raster = new T.Raster("uint8", raster.width, raster.height);
  label_raster.pixelData = labelData;


  return label_raster;
  }

  /**
   * Converting the raster labelised into a list of list of particule defined by their coordinate xy
   *
   * @param {TRaster} raster - Raster object returned by a labbeling function with pixelData set as label
   * @return {array} - an array containing the area of the particle
   * @return {array} particule - Array containing arrays of the pixel's coordinates of the particle
   * @author Jean Mainguy
   */
  const getListParticle = function(labbeled_raster){
    let label_list = new Array();
    let label_array = labbeled_raster.pixelData;
    let list_p = new Array();

    label_array.reduce(function(list_p, label, i){
      // console.log("label list", label_list);
      return list_p = label < 1 ? (list_p) :(
        // console.log("label",label , "  list_p", list_p, " "),
      index = label_list.indexOf(label),
      // console.log("index", index),
      index != -1 ? list_p[index].push(labbeled_raster.xy(i)) : (
                  list_p.push([labbeled_raster.xy(i)]),
                  label_list.push(label)),
      list_p);
    }, list_p);
    return list_p
  }

  /**
   * For each particule, takes the first pixel and create a chaincode of the boundary of the particule
   * Beside the matrixLabel that has been removed, function the same way as contourTracing
   *
   * @param {TRaster} raster - Raster with a labelised Image
   * @param {Array} particule -
   * @return {Array} First element is the coordinates of the starting pixel, the rests are angle values.

   * @author Martin Binet
   */
  const chainCode = function(raster, particules){
      let pixels = raster.pixelData;
      let h = raster.height;
      let w = raster.width;
      let chaincodes = new Array();
      let angle = 7;
      particules.forEach( function(elem){
          let origin = elem[0];
          let second;
          let tmp;
          tmp = tracer(pixels, w, h, origin[0], origin[1], angle);
          (tmp != null) ? (
            second = tmp.slice(1, 3),
            chaincodes.push(tmp[0]),
            angle = (tmp[0] + 6) % 8) : null;
          let nextPixel = second;
          let previousPixel;
          while (second != null && !((JSON.stringify(origin) === JSON.stringify(previousPixel)) && (JSON.stringify(second) === JSON.stringify(nextPixel)))){
            previousPixel = nextPixel;
            tmp = tracer(pixels, w, h, nextPixel[0], nextPixel[1], angle);
            (tmp != null) ? (
                chaincodes.push(tmp[0]),
              nextPixel = tmp.slice(1, 3),
              angle = (tmp[0] + 6) % 8
            ) : null;
          }
      })
      return chaincodes;
  }

  /**
   * Measure a set of Regions Of Interest (ROI)
   *
   * @param {TRaster} raster - Raster object returned by a labbeling function with pixelData set as label
   * @param {type} particules - Array containing arrays of pixel's coordinates for each particles
   * @param {type} params - Measurements Parameters (eg. Area, Centroid)
   * @param {boolean} copy - Useless. Just here for compatibility
   * @return {type} Measurements and/or result image
   * @author TODO
   */
  const measure = function (raster, particules, params) {
      const headers_storage = {feretDiameter : ["maxDiameter", "maxAngle", "minDiameter", "minProjection", "minAngle"],
                area : ["Area"],
                boundingRectangle : ["width", "height", "bx", "by"],
                centroid : ["CentroidX", "CentroidY"]};
        const headers = [params.reduce( (accu, elem) => accu.concat(headers_storage[elem.name]), [])];
    let lines = particules.map( function(particule){
         let result = params.map( function(param){
            return param.function(raster, particule);
        });
        // console.log(result);
        return result;
    });
    saveResults(headers.concat(lines));
  }

  /**
   * Saves the data in a csv and offers to the user to download it
   *
   * @param {Array} rows - Measurements
   *
   * @author Imamudin Naseem//(StackOverFlow : https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side)
   */
  const saveResults = function(rows){
      let csvContent = "data:text/csv;charset=utf-8,";
      rows.forEach(function(rowArray){
         let row = rowArray.join(",");
         csvContent += row + "\r\n"; // add carriage return
      });

      var encodedUri = encodeURI(csvContent);
      var link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "Measures.csv");
      document.body.appendChild(link); // Required for FF

      link.click(); // This will download the data file named "my_data.csv".
  }

  /**
   * To find the extrem pixels of a particle in x and y axis and in y
   *
   * @param {type} particule - Array of the pixel's coordinates of one particle
   * @return {type} - an object with the coordinate of the extrem pixels
   * @author Jean Mainguy
   */
  const findExtrem = function(particule){
    //particule is a list of coord
    let extrem = {xmin:particule[0][0], xmax:particule[0][0], ymin:particule[0][1], ymax:particule[0][1]};


    particule.reduce(function(extrem,coord){
      extrem.xmin = extrem.xmin > coord[0] ? coord[0] : extrem.xmin;
      extrem.xmax = extrem.xmax < coord[0] ? coord[0] : extrem.xmax;
      extrem.ymin = extrem.ymin > coord[1] ? coord[1] : extrem.ymin;
      extrem.ymax = extrem.ymax < coord[1] ? coord[1] : extrem.ymax;
      return extrem;
    }, extrem);
    return extrem;
 }

 /**
  * Measure of the Area
  *
  * @param {TRaster} raster - Raster object returned by a labbeling function with pixelData set as label
  * @param {type} particule - Array of the pixel's coordinates of one particle
  * @return {type} - an array containing the area of the particle
  * @author TODO
  */
  const area = function (raster, particule){
    return particule.length;
  }
  const area_obj = {"name": "area", "function" : area}


  /**
   * Measure of the centroid
   *
   * @param {TRaster} raster - Raster object returned by a labbeling function with pixelData set as label
   * @param {type} particule - Array of the pixel's coordinates of one particle
   * @return {type} - an array containing the coordinates of the centroid
   * @author TODO
   */
  const centroid = function(raster, particule){
    let Xs = particule.reduce( ((totalX, pixel) => totalX + pixel[0]), 0);
    let Ys = particule.reduce( ((totalY, pixel) => totalY += pixel[1]), 0);
    return ([Math.round(Xs / particule.length), Math.round(Ys / particule.length)]);
  }
  const centroid_obj = {"name": "centroid", "function" : centroid}




  /**
   * Measure of the Feret Diameter
   *
   * @param {TRaster} raster - Raster object returned by a labbeling function with pixelData set as label
   * @param {type} particule - Array of the pixel's coordinates of one particle
   * @return {type} - an array containing the maxDiameter maxAngle minDiameter minProjection and minAngle
   * @author TODO
   */
  const feretDiameter = function(raster, particule){
      //let angles = chainCode(img, particules, w, h)
      let stepsize = 2.0 * (Math.PI/180.0);
      const rotation = [Math.cos(stepsize), Math.sin(stepsize)];//*(180 / Math.PI)];
      let directionsI = [0.0, 1.0, 1.0, 1.0, 0.0, -1.0, -1.0, -1.0];
      let directionsJ = [1.0, 1.0, 0.0, -1.0, -1.0, -1.0, 0.0, 1.0];
      let maxDiameter = -Infinity;
      let minDiameter = Infinity;
      let minProjection = Infinity;
      let maxAngle = 0;
      let minAngle = 0;
      for(let i=0;i <= 88;i+=1){
          let dir = particule.map( function(elem){
              return [directionsI[elem], directionsJ[elem]];
          });
          let x = 0.0;
          let y = 0.0;
          let coords = dir.map( function(elem, i){
              let result = (i === 0) ? elem : [x + elem[0], y + elem[1]];
              x += elem[0];
              y += elem[1];
              return result;
          });
          let extrems = findExtrem(coords);
          let size = [extrems.xmax - extrems.xmin + 1, extrems.ymax - extrems.ymin + 1];
          (maxDiameter < size[0]) ? (
              maxDiameter = size[0],
              maxAngle = i
          ) : null;
          (maxDiameter < size[1]) ? (
              maxDiameter = size[1],
              maxAnglCentroidXe = i + 90
          ) : null;
          (minDiameter > size[0]) ? (
              minDiameter = size[0],
              minProjection = size[1],
              minAngle = i
          ) : null;
          (minDiameter > size[1]) ? (
              minDiameter = size[1],
              minProjection = size[0],
              minAngle = i + 90
          ) : null;
          newDirectionsI = directionsI.map( function(elem, i){
              return elem * rotation[0] + directionsJ[i] * (rotation[1]);
          });
          newDirectionsJ = directionsJ.map( function(elem, i){
              return elem * rotation[1] - directionsI[i] * rotation[0];
          });
          directionsI = newDirectionsI;
          directionsJ = newDirectionsJ;
      }
      return [maxDiameter, maxAngle, minDiameter, minProjection, minAngle]
  }
  const feretDiameter_obj = {"name": "feretDiameter", "function" : feretDiameter};

  /**
   * Measure of the boundingRectangle
   *
   * @param {TRaster} raster - Raster object returned by a labbeling function with pixelData set as label
   * @param {type} particule - Array of the pixel's coordinates of one particle
   * @return {type} - an array containing the width, height of the bounding rectangle and the coordinates of the upper left pixel of the bounding rectangle
   * @author Jean Mainguy
   */
  const boundingRectangle = function(raster, particule){
    // console.log("particule",particule);
    let extrem = {xmin:particule[0][0], xmax:particule[0][0], ymin:particule[0][1], ymax:particule[0][1]};


    particule.reduce(function(extrem,coord){
      extrem.xmin = extrem.xmin > coord[0] ? coord[0] : extrem.xmin;
      extrem.xmax = extrem.xmax < coord[0] ? coord[0] : extrem.xmax;
      extrem.ymin = extrem.ymin > coord[1] ? coord[1] : extrem.ymin;
      extrem.ymax = extrem.ymax < coord[1] ? coord[1] : extrem.ymax;
      return extrem;
    }, extrem);
    // console.log("extrem", extrem);
    return [extrem.xmax-extrem.xmin+1, extrem.ymax-extrem.ymin+1, extrem.xmin, extrem.ymin]
  }
const boundingRectangle_obj = {"name": "boundingRectangle", "function" : boundingRectangle};

/**
 * Measure of the perimeter
 *
 * @param {TRaster} raster - Raster object returned by a labbeling function with pixelData set as label
 * @param {type} particule - Array of the pixel's coordinates of one particle
 * @return {type} - an array containing calculated perimeter
 * @author Jean Mainguy
 */
const perimeter = function(raster_labeled, particule){

  chain_code = chainCode(raster_labeled, [particule]);
  // chain_code = [3,2,2,0,0,4,5,7,6];
  console.log(chain_code);

  let cmpt = chain_code.reduce(function(accu, angle, i, chain){
    angle % 2 == 0 ? accu.even ++ : accu.odd ++;
    i_next = chain[i+1] === undefined ? 0 : i+1; // When we arrive at the last element of the chain the next one is the first one
    angle != chain[i_next] ? accu.corner ++ : accu.corner;
    return accu;
  }, {odd:0, even:0, corner:0})
  console.log(cmpt);
  let perimeter = cmpt.even*0.980 + cmpt.odd*1.406 - cmpt.corner*0.091;
  return [perimeter];
}
const perimeter_obj = {"name": "perimeter", "function" : perimeter};


/**
 * Measure of the circularity
 *
 * @param {TRaster} raster - Raster object returned by a labbeling function with pixelData set as label
 * @param {type} particule - Array of the pixel's coordinates of one particle
 * @return {type} - an array containing the measure of circularity
 * @author TODO
 */
const circularity = function(raster_labeled, particule)
{
    const peri = perimeter(raster_labeled, particule)[0];
    const area = particule.length;
    const circu = ((4*Math.PI)*(area/Math.pow(peri, 2)));
    return [circu];
}
const circularity_obj = {"name": "circularity", "function" : circularity};
