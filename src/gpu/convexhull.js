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
* Find the convexhull vertex of a labbeled image
* 4-connected components
*
*
*
* @param {TImage} img - Input image
* @param {boolean} copy - Copy mode
* @return {TRaster} A TRaster with labels as pixel values
* @author Jean Mainguy
*/

const convexHull = function(img, gpuEnv){

let src_vs = `#version 300 es
    in vec2 a_vertex;
    in vec2 a_texCoord;
    uniform vec2 u_resolution;
    out vec2 v_texCoord;

    void main() {
        v_texCoord = a_texCoord;
        vec2 clipSpace = a_vertex * u_resolution * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
}`;

let src_fs = `#version 300 es
    precision mediump float;
    in vec2 v_texCoord;

    uniform sampler2D u_raster;
    uniform vec2 u_textureSize;



    // Declare an output for the fragment shader
    out vec4 outColor;

    float getAngleOrientation(vec2 R_pix, vec2 M_pix, vec2 L_pix, int y){
      // R est le pixel de droite, M le pixel du milieu et L le pixel de Gauche
      // We want to know if M_pix is above and below the line joining R and L.

      int x =  abs(y - 1); // facteur de confusion extreme

      float a =(R_pix[y] - L_pix[y]) / (R_pix[x] - L_pix[x]);
      float b = R_pix[y] - a*R_pix[x];

      float yth = a*M_pix[x] + b;
      //simplifié avec sign(yth ??? M_pix[y])
      if (yth == M_pix[y]){
        //M est aligné avec R et L
        return 0.0;
      }
      if (yth > M_pix[y]){
        // M est sous la droite
        return 1.0;
      }
      if (yth < M_pix[y]){
        // M est au dessus  de la droite
        return -1.0;
      }

    }

    vec2 rowColExtremFinder(vec2 coord_ori, vec2 onePixel, float rvalue, float signe, int i){
    //  coord est un pixel de la colonne appartenant au blob
    //  On cherche le max de la colonne
    // bord est les coord en y du pixel du bord soit 1.0 soit 0.0
    // Si on cherche regarde les pixels situé du bord inferieur jusqu'au premier pixel du blob donc le signe est -1 pour retirer un pixel chaque tour de while
    //  signe +1 pour aller de 0.0 jusqu'au premier pixel du blob
    // i 0 ou 1 correspon à la composante X ou Y du vec2 d donc si on regarde les lignes ou les colonnes

      vec2 extrem_pixel = vec2(-1.0, -1.0); // if not change then no pixel of blob in the line/col analysed
      vec2 coord = coord_ori;

      while (0.0 <= coord[i]  && coord[i] <= 1.0){
        if (texture(u_raster, coord).r == rvalue) {
          extrem_pixel = coord;
        }
        coord[i] = -1.0 *signe * onePixel[i] + coord[i];
      }
      if (extrem_pixel != vec2(-1.0, -1.0)){
        // if a blob pixel has been found in the first half... going from the current Y position to the top
        return extrem_pixel;
      }

      //Else we look for a blob pixel in the other part
      // From the current Y to the bottom
      coord = coord_ori;
      while (0.0 <= coord[i]  && coord[i] <= 1.0){

        if (texture(u_raster, coord).r == rvalue) {
          //we can directly return the extrem pixel found as it is the extrem one as we are in the second half
          extrem_pixel = coord;
          return extrem_pixel;
        }

        coord[i] =  signe * onePixel[i] + coord[i];

      }
      return extrem_pixel;
    }

    vec2 checkAdjacentRowCol(vec2 coord, vec2 onePixel, float rvalue, float bord, int next, float direction){
      //next is 1 or O and tell if we check row or col.
      // if we check all col then X is incremented at each turn then next is 0
      // and on the contrary next is 1 when it the rows that we want
      // Bord is 1.0 or 0.0
      // direction tell if we go on the left or on the right
      // -1.0 if left and 1.0 if right
      vec2 new_extrem;
      vec2 next_coord = coord;
      float orientation;

      int i = abs(next - 1); // if next is Y we want i as X and contrary
      float signe = sign(bord*(-1.0) + 0.5); //  when bord=1.0 => signe= -1 AND bord=0.0 => signe=1

      next_coord[next] = onePixel[next]*direction + next_coord[next];


      // next_coord[i] = bord; // tell if we start at the botom or at the top of the image
      // vec2 extrem_pixel = rowColExtremFinder(coord, onePixel, rvalue, 1.0, 1);
      // if (next_coord == vec2(coord[next] + onePixel[next]*direction, bord)){

      vec2 extrem_pixel = rowColExtremFinder(next_coord, onePixel, rvalue, signe, i); // extrem pixel is initialise first as the extrem pixel of the adjacent row or col

      if(new_extrem[i] > coord[i] - onePixel[i] && new_extrem[i] < coord[i] + onePixel[i]){
        return vec2(-1.0, -1.0);
      }

      next_coord[next] += onePixel[next]*direction;
      next_coord[i] = coord[i];
      // next_coord[i] = bord; // tell if we start at the botom or at the top of the image

      while (0.0 <= next_coord[next]  && next_coord[next] <= 1.0){
        new_extrem = rowColExtremFinder(next_coord, onePixel, rvalue, signe, i);
        if (new_extrem == vec2(-1.0, -1.0)){
          // if new extrem is vec2(-1.0, -1.0)
          // then no more blob pixel in this dir,
          // extrem pixel was the last one
          return extrem_pixel;
        }
        orientation = getAngleOrientation(coord, extrem_pixel, new_extrem, i); // check the angle
        // orientation = sign(orientation);
        // orientation= -1.0, 0.0, 1.0
        // it tell the orientation of the angle between coord => eextrem_pixel => new_extrem
        // to see if coord xan be linked direcly to new_extrem, if so new_extrem become the new
        if (orientation != signe){ // diff de signe ou bien == 0.0 on définit le nouveau extrem comme l'extrem_pixel
          extrem_pixel = new_extrem;
        }
        next_coord[next] += onePixel[next]*direction;
        next_coord[i] = coord[i];
        // next_coord[i] = bord; // tell if we start at the botom or at the top of the image
      }

    return extrem_pixel;
  }

  vec4 getPixColorInOneDir(vec2 v_texCoord, vec2 onePixel, float rvalue, float bord, int next){
    // Find Extrem to the right
    float direction = 1.0;
    vec2 extrem_pixelR = checkAdjacentRowCol(v_texCoord, onePixel, rvalue, bord, next, direction);
    // Find Extrem to the left
    direction = -1.0;
    vec2 extrem_pixelL = checkAdjacentRowCol(v_texCoord, onePixel, rvalue, bord, next, direction);

    // Orientation of extem_pixelR, currentPicel and  extem_pixelR
    int i = 1; // because we are looking for extrml in the colonne so in Y
    // float  orientation = -1.0;
    float orientation = getAngleOrientation(extrem_pixelL , v_texCoord,  extrem_pixelR, i);

    if ((orientation > 0.0 && bord == 0.0) || (orientation < 0.0 && bord == 1.0)){
      outColor = vec4(1.0, 0.2, 0.2, 1.0);
    }
    // else{
    //   outColor = vec4(1.0, 0.0, 0.0, 1.0);
    // }
    // if (orientation == 0.0){
    //   outColor = vec4(0.0, 1.0, 0.0, 1.0);
    // }
    // WHEN THERE IS NO OTHER PIXEL OF THE BLOB ON ONE SIDE OF THE CURRENT pixel
    // The function rowColExtremFinder give an extrem value of -1.0
    // Then an extrem value of -1.0 means that the current pixel is a vertex of the convexHull
    // true only if we deal with 4 connected pixel
    if (extrem_pixelL.y == -1.0 || extrem_pixelR.y == -1.0){
      outColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
    return outColor;
  }

    void main() {
        // compute 1 pixel in texture coordinates.
        vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
        float rvalue = texture(u_raster, v_texCoord).r; // r value of the analysed blob

        // outColor = vec4(v_texCoord[1]+0.5, v_texCoord[1]+0.5, v_texCoord[1]+0.5, 1.0);
          outColor  = vec4(1.0, 1.0, 1.0, 1.0);
          // // if(texture(u_raster, v_texCoord).r < 1.0 && texture(u_raster, v_texCoord + vec2(0.0, onePixel.y)).r == 1.0){
          if (rvalue < 1.0){
            outColor  = vec4(0.9, 0.9, 0.9, 1.0);
          }

          if(rvalue < 1.0) {
            if (texture(u_raster,  v_texCoord  - vec2(0.0, onePixel.y)).r != rvalue){
            outColor = vec4(0.6, 0.6, 0.6, 1.0);
            // float bord = 1.0; // because the current pixel has no blob pixel at Y+1 then we start looking for blob from 1.0 in the next colonne
            float bord = 0.0;
            int next = 0; // because we are looking for pixel  in the next colonnes then we need to increment X. And X is indice 0.
            outColor = getPixColorInOneDir(v_texCoord, onePixel, rvalue, bord, next);
          }
          if (texture(u_raster,  v_texCoord  + vec2(0.0, onePixel.y)).r != rvalue){
          outColor = vec4(0.6, 0.6, 0.6, 1.0);
          // float bord = 1.0; // because the current pixel has no blob pixel at Y+1 then we start looking for blob from 1.0 in the next colonne
          float bord = 1.0;
          int next = 0; // because we are looking for pixel  in the next colonnes then we need to increment X. And X is indice 0.
          outColor = getPixColorInOneDir(v_texCoord, onePixel, rvalue, bord, next);
        }

            }



}` ;

let program = gpu.createProgram(gpuEnv,src_vs,src_fs);

w = raster.width;
h = raster.height;

let gproc = gpu.createGPU(gpuEnv,w,h);

gproc.geometry(gpu.rectangle(raster.width,raster.height));

// gproc.geometry({
//     type : 'TRIANGLE_STRIP',
//     num : 4,
//     vertices : new Float32Array([
//         0.0,0.0,0.0,0.0,
//         0.0,h  ,0.0,1.0,
//         w  ,0.0,1.0,0.0,
//         w  ,h  ,1.0,1.0])
// })


gproc.attribute('a_vertex',2,'float', 16,0)   // X, Y
    .attribute('a_texCoord',2, 'float', 16, 8)  // S, T
    .packWith(program)                         // VAO
gproc.texture(raster,0) ;


gproc.clearCanvas([0.0,1.0,0.0,1.0]);

gproc.preprocess()
    .uniform('u_resolution',
            new Float32Array([1.0/w,1.0/h]))
        .uniform('u_raster',0)
        .uniform('u_textureSize', new Float32Array([w, h]));

gproc.run();

}
// gpu.invert(img.getRaster(),gpuEnv);
