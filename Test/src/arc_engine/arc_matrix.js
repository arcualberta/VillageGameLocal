/** 
 * Used to define a two dimensional vector
 */
var ArcVec2 = {
    create: function(x, y){
        var vec = new Float32Array(2);
        if(x){
            vec[0] = x;
            vec[1] = y;
        }
        
        return vec;
    },
    scale: function(out, in1, scale){
        out[0] = in1[0] * scale;
        out[1] = in1[1] * scale;
    },
    scaleVec: function(out, in1, in2){
        out[0] = in1[0] * in2[0];
        out[1] = in1[1] * in2[1];
        
        return out;
    }
};
