var tsScript = new TileSheetScript(); // This object must always be defined.

// Optional Variables

tsScript.tileDimension = [16, 16]; // Set the viewable tile width and height. Default is 16x16

// Required Functions

/**
 * Creates a basic world with no objects or houses.
 */
tsScript.blankWorld = function(width, height){
    var wVal = width / 50;
    var hVal = height / 50;
        
    for(var y = 0; y < height; ++y){
        
        for(var x = 0; x < width; ++x){
            if(x > wVal && y > hVal && x < width - 1 - wVal && y < height - 1 - hVal){
                tsScript.setTile(MAP_LOWER, x, y, 'grass1');
            }else if(x > wVal && x < width - 1 - wVal && y == hVal){
                tsScript.setTile(MAP_LOWER, x, y, 'tree8');
            }else if(x > wVal && x < width - 1 - wVal && y == height - 1 - hVal){
                tsScript.setTile(MAP_LOWER, x, y, 'tree2');
            }else if(y > hVal && y < height - 1 - hVal && x == wVal){
                tsScript.setTile(MAP_LOWER, x, y, 'tree6');
            }else if(y > hVal && y < height - 1 - hVal && x == width - 1 - wVal){
                tsScript.setTile(MAP_LOWER, x, y, 'tree4');
            }else{
                tsScript.setTile(MAP_LOWER, x, y, 'tree5');
            }
        }
    }
}

/**
 * Create the mayors house.
 * @return Teachers house location, dimension, and door location.
 */
tsScript.createMayorsHouse = function(width, height){
    var wVal = width / 50;
    var hVal = height / 50;
    
    // Place the teachers house
    var x = Math.round(width / 2) - 3;
    var y = hVal;
    
    tsScript.setTile(MAP_UPPER, x + 0, y, 'roof1');
    tsScript.setTile(MAP_UPPER, x + 1, y, 'roof2');
    tsScript.setTile(MAP_UPPER, x + 2, y, 'roof2');
    tsScript.setTile(MAP_UPPER, x + 3, y, 'roof2');
    tsScript.setTile(MAP_UPPER, x + 4, y, 'roof3');
    
    tsScript.setTile(MAP_MID, x + 0, y + 1, 'roof4');
    tsScript.setTile(MAP_MID, x + 1, y + 1, 'roof5');
    tsScript.setTile(MAP_MID, x + 2, y + 1, 'roof5');
    tsScript.setTile(MAP_MID, x + 3, y + 1, 'roof5');
    tsScript.setTile(MAP_MID, x + 4, y + 1, 'roof6');
    
    tsScript.setTile(MAP_MID, x + 0, y + 2, 'roof7');
    tsScript.setTile(MAP_MID, x + 1, y + 2, 'roof8');
    tsScript.setTile(MAP_MID, x + 2, y + 2, 'roof8');
    tsScript.setTile(MAP_MID, x + 3, y + 2, 'roof8');
    tsScript.setTile(MAP_MID, x + 4, y + 2, 'roof9');
    
    tsScript.setTile(MAP_MID, x + 0, y + 3, 'brick1');
    tsScript.setTile(MAP_MID, x + 1, y + 3, 'brick1');
    tsScript.setTile(MAP_MID, x + 2, y + 3, 'doorTop');
    tsScript.setTile(MAP_MID, x + 3, y + 3, 'brick1');
    tsScript.setTile(MAP_MID, x + 4, y + 3, 'brick1');
    
    tsScript.setTile(MAP_MID, x + 0, y + 4, 'brick2');
    tsScript.setTile(MAP_MID, x + 1, y + 4, 'brick2');
    tsScript.setTile(MAP_MID, x + 2, y + 4, 'doorBottom');
    tsScript.setTile(MAP_MID, x + 3, y + 4, 'brick2');
    tsScript.setTile(MAP_MID, x + 4, y + 4, 'brick2');
    // Return basic information
    return {
        x: x,
        y: y,
        width: 5,
        height: 5,
        door: [x + 2, y + 4]
    };
}

tsScript.createStudentHouses = function(students, width, height){
    var createHouse = function(student, index, x, y, drawRoad){
        tsScript.setTile(MAP_UPPER, x + 0, y, 'roof1');
        tsScript.setTile(MAP_UPPER, x + 1, y, 'roof2');
        tsScript.setTile(MAP_UPPER, x + 2, y, 'roof3');
    
        tsScript.setTile(MAP_MID, x + 0, y + 1, 'roof4');
        tsScript.setTile(MAP_MID, x + 1, y + 1, 'roof5');
        tsScript.setTile(MAP_MID, x + 2, y + 1, 'roof6');
    
        tsScript.setTile(MAP_MID, x + 0, y + 2, 'roof7');
        tsScript.setTile(MAP_MID, x + 1, y + 2, 'roof8');
        tsScript.setTile(MAP_MID, x + 2, y + 2, 'roof9');
    
        tsScript.setTile(MAP_MID, x + 0, y + 3, 'brick1');
        tsScript.setTile(MAP_MID, x + 1, y + 3, 'doorTop');
        tsScript.setTile(MAP_MID, x + 2, y + 3, 'brick1');
    
        tsScript.setTile(MAP_MID, x + 0, y + 4, 'brick2');
        tsScript.setTile(MAP_MID, x + 1, y + 4, 'doorBottom');
        tsScript.setTile(MAP_MID, x + 2, y + 4, 'brick2');
        
        if(drawRoad){
//            tsScript.setTile(MAP_LOWER, x - 1, y + 0, 'road4');
//            tsScript.setTile(MAP_LOWER, x - 1, y + 1, 'road4');
//            tsScript.setTile(MAP_LOWER, x - 1, y + 2, 'road4');
//            tsScript.setTile(MAP_LOWER, x - 1, y + 3, 'road4');
//            tsScript.setTile(MAP_LOWER, x - 1, y + 4, 'road4');
//            tsScript.setTile(MAP_LOWER, x - 1, y + 5, 'road4');
//            tsScript.setTile(MAP_LOWER, x - 1, y + 6, 'road5');
        }
        
        return {};
    };
    
    // Returns an array of student houses, each house in the array in the say structure as the mayor house.
    var outArray = [];
    
    // Create the first road
    var wVal = width / 50;
    var hVal = height / 50;
    
    var xStart = Math.round(width / 2) - 1;
    var yStart = hVal + 5;
    
    tsScript.setTile(MAP_LOWER, xStart, yStart, 'road4');
    
    // Plan the number of lots
    var tW = Math.ceil(Math.sqrt(students.length));
    var tH = Math.ceil(students.length / tW);
    
    xStart = xStart - (Math.ceil(tW * 0.5) * 4.0);
    var y = yStart + 1;
    var index = 0;
    
    for(var v = 0; v < tH; ++v){
        var x = xStart;
        var drawRoad = false;
        
        for(var u = 0; u < tW; ++u){
            if(index < students.length){
                outArray.push = createHouse(students[index], index, x, y, drawRoad);
            }
            
            x += 4 + Math.round(Math.random() * 10.0);
            ++index;
            drawRoad = true;
        }
        
        y += 7 + Math.round(Math.random() * 10.0);
    }
    
    return outArray;
}
