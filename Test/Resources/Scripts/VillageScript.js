var tsScript = new TileSheetScript(); // This object must always be defined.

// Optional Variables

tsScript.tileDimension = [16, 16]; // Set the viewable tile width and height. Default is 16x16

// Required Functions

/**
 * Creates a basic world with no objects or houses.
 */
tsScript.blankWorld = function(width, height){  
    var x, y;
    // Create the grass
    for(y = 0; y < height; ++y){
        for(x = 0; x < width; ++x){
            var r = Math.random();
            var tile;
            
            if(r >= 0.9){
                tile = "grass2";
            }else if(r >= 0.8){
                tile = "grass3";
            }else if(r >= 0.7){
                tile = "grass4";
            }else if(r >= 0.7){
                tile = "grass5";
            }else{
                tile = "grass1";
            }
            
            tsScript.setTile(MAP_LOWER, x, y, tile);
        }
    }
    
    //Create the trees
    var stager = false;
    for(x = 0; x < width; x += 3){
        createTree(x, -1);  
        createTree(x, height - 2);
    }
    
    for(y = 2; y < height - 3; y += 3){
        createTree(0, y);  
        createTree(width, y);
    }
    
    
}

/**
 * Create the mayors house.
 * @return Teachers house location, dimension, and door location.
 */
tsScript.createMayorsHouse = function(width, height){
    var wVal = width / 50;
    var hVal = height / 50;
    
    // Find the position
    var x = Math.round(width / 2) - 4;
    var y = hVal;
    
    // Create surrounding trees
    createTree(x - 2, y - 1);
    createTree(x + 1, y - 1);
    createTree(x + 4, y - 1);
    createTree(x + 7, y - 1);
    createTree(x + 10, y - 1);
    createTree(x + 8, y + 2);
    
    // Place the teachers house
    tsScript.setTile(MAP_UPPER, x + 0, y, 'roof1');
    tsScript.setTile(MAP_UPPER, x + 1, y, 'roof2');
    tsScript.setTile(MAP_UPPER, x + 2, y, 'roof2');
    tsScript.setTile(MAP_UPPER, x + 3, y, 'roof2');
    tsScript.setTile(MAP_UPPER, x + 4, y, 'roof2');
    tsScript.setTile(MAP_UPPER, x + 5, y, 'roof2');
    tsScript.setTile(MAP_UPPER, x + 6, y, 'roof3');
    
    tsScript.setTile(MAP_MID, x + 0, y + 1, 'roof4');
    tsScript.setTile(MAP_MID, x + 1, y + 1, 'roof5');
    tsScript.setTile(MAP_MID, x + 2, y + 1, 'roof5');
    tsScript.setTile(MAP_MID, x + 3, y + 1, 'roof5');
    tsScript.setTile(MAP_MID, x + 4, y + 1, 'roof5');
    tsScript.setTile(MAP_MID, x + 5, y + 1, 'roof5');
    tsScript.setTile(MAP_MID, x + 6, y + 1, 'roof6');
    
    tsScript.setTile(MAP_MID, x + 0, y + 2, 'roof7');
    tsScript.setTile(MAP_MID, x + 1, y + 2, 'roof8');
    tsScript.setTile(MAP_MID, x + 2, y + 2, 'roof8');
    tsScript.setTile(MAP_MID, x + 3, y + 2, 'roof8');
    tsScript.setTile(MAP_MID, x + 4, y + 2, 'roof8');
    tsScript.setTile(MAP_MID, x + 5, y + 2, 'roof8');
    tsScript.setTile(MAP_MID, x + 6, y + 2, 'roof9');
    
    tsScript.setTile(MAP_MID, x + 0, y + 3, 'building1');
    tsScript.setTile(MAP_MID, x + 1, y + 3, 'window1');
    tsScript.setTile(MAP_MID, x + 2, y + 3, 'building2');
    tsScript.setTile(MAP_MID, x + 3, y + 3, 'window1');
    tsScript.setTile(MAP_MID, x + 4, y + 3, 'door1');
    tsScript.setTile(MAP_MID, x + 5, y + 3, 'window1');
    tsScript.setTile(MAP_MID, x + 6, y + 3, 'building3');
    
    tsScript.setTile(MAP_MID, x + 0, y + 4, 'building4');
    tsScript.setTile(MAP_MID, x + 1, y + 4, 'window2');
    tsScript.setTile(MAP_MID, x + 2, y + 4, 'building5');
    tsScript.setTile(MAP_MID, x + 3, y + 4, 'window2');
    tsScript.setTile(MAP_MID, x + 4, y + 4, 'door2');
    tsScript.setTile(MAP_MID, x + 5, y + 4, 'window2');
    tsScript.setTile(MAP_MID, x + 6, y + 4, 'building6');
    
    tsScript.setTile(MAP_MID, x + 5, y + 5, 'sign');
    
    // Return basic information
    return {
        x: x,
        y: y,
        width: 7,
        height: 5,
        door: [x + 4, y + 4]
    };
}

var createTree = function(x, y){
    tsScript.setTile(MAP_UPPER, x - 1, y - 1, 'tree1');
    tsScript.setTile(MAP_UPPER, x + 0, y - 1, 'tree2');
    tsScript.setTile(MAP_UPPER, x + 1, y - 1, 'tree3');
    
    tsScript.setTile(MAP_MID, x - 1, y + 0, 'tree4');
    tsScript.setTile(MAP_MID, x + 0, y + 0, 'tree5');
    tsScript.setTile(MAP_MID, x + 1, y + 0, 'tree6');
    
    tsScript.setTile(MAP_MID, x - 1, y + 1, 'tree7');
    tsScript.setTile(MAP_MID, x + 0, y + 1, 'tree8');
    tsScript.setTile(MAP_MID, x + 1, y + 1, 'tree9');
    
    tsScript.setTile(MAP_MID, x - 1, y + 2, 'tree10');
    tsScript.setTile(MAP_MID, x + 0, y + 2, 'tree11');
    tsScript.setTile(MAP_MID, x + 1, y + 2, 'tree12');
}

var createStudentHouse = function(student, index, x, y){
    var r = Math.random();
    var t = index % 2;
    var xi = x + 1;
    
    if(t == 1){
        ++xi;
    }
    
    tsScript.setTile(MAP_UPPER, xi + 0, y, 'roof1');
    tsScript.setTile(MAP_UPPER, xi + 1, y, 'roof2');
    tsScript.setTile(MAP_UPPER, xi + 2, y, 'roof2');
    tsScript.setTile(MAP_UPPER, xi + 3, y, 'roof2');
    tsScript.setTile(MAP_UPPER, xi + 4, y, 'roof3');
    
    tsScript.setTile(MAP_MID, xi + 0, y + 1, 'roof4');
    tsScript.setTile(MAP_MID, xi + 1, y + 1, 'roof5');
    tsScript.setTile(MAP_MID, xi + 2, y + 1, 'roof5');
    tsScript.setTile(MAP_MID, xi + 3, y + 1, 'roof5');
    tsScript.setTile(MAP_MID, xi + 4, y + 1, 'roof6');
    
    tsScript.setTile(MAP_MID, xi + 0, y + 2, 'roof7');
    tsScript.setTile(MAP_MID, xi + 1, y + 2, 'roof8');
    tsScript.setTile(MAP_MID, xi + 2, y + 2, 'roof8');
    tsScript.setTile(MAP_MID, xi + 3, y + 2, 'roof8');
    tsScript.setTile(MAP_MID, xi + 4, y + 2, 'roof9');
    
    tsScript.setTile(MAP_MID, xi + 0, y + 3, 'building1');
    tsScript.setTile(MAP_MID, xi + 1, y + 3, r > 0.5 ? 'window1' : 'door1');
    tsScript.setTile(MAP_MID, xi + 2, y + 3, r > 0.5 ? 'door1' : 'window1');
    tsScript.setTile(MAP_MID, xi + 3, y + 3, 'window1');
    tsScript.setTile(MAP_MID, xi + 4, y + 3, 'building3');
    
    tsScript.setTile(MAP_MID, xi + 0, y + 4, 'building4');
    tsScript.setTile(MAP_MID, xi + 1, y + 4, r > 0.5 ? 'window2' : 'door2');
    tsScript.setTile(MAP_MID, xi + 2, y + 4, r > 0.5 ? 'door2' : 'window2');
    tsScript.setTile(MAP_MID, xi + 3, y + 4, 'window2');
    tsScript.setTile(MAP_MID, xi + 4, y + 4, 'building6');
    
    tsScript.setTile(MAP_LOWER, xi + (r > 0.5 ? 2 : 1), y + 5, 'dirt_patch');
    
    // Draw the fence
    if(t == 0){
        tsScript.setTile(MAP_MID, x, y + 2, 'fence3');
        tsScript.setTile(MAP_MID, x, y + 3, 'fence7');
        tsScript.setTile(MAP_MID, x, y + 4, 'fence7');
        tsScript.setTile(MAP_MID, x, y + 5, 'fence7');
        tsScript.setTile(MAP_MID, x, y + 6, 'fence7');
        tsScript.setTile(MAP_MID, x, y + 7, 'fence5');
        
        tsScript.setTile(MAP_MID, x + 1, y + 7, 'fence1');
        tsScript.setTile(MAP_MID, x + 2, y + 7, 'fence1');
        tsScript.setTile(MAP_MID, x + 3, y + 7, 'fence1');
        tsScript.setTile(MAP_MID, x + 4, y + 7, 'fence1');
        tsScript.setTile(MAP_MID, x + 5, y + 7, 'fence1');
        tsScript.setTile(MAP_MID, x + 6, y + 7, 'fence1');
        tsScript.setTile(MAP_MID, x + 7, y + 7, 'fence1');
        tsScript.setTile(MAP_MID, x + 8, y + 7, 'fence6');
        
        tsScript.setTile(MAP_MID, x + 8, y + 2, 'fence4');
        tsScript.setTile(MAP_MID, x + 8, y + 3, 'fence7');
        tsScript.setTile(MAP_MID, x + 8, y + 4, 'fence7');
        tsScript.setTile(MAP_MID, x + 8, y + 5, 'fence7');
        tsScript.setTile(MAP_MID, x + 8, y + 6, 'fence7');
        
    }else if(t == 1){
    }
        
    return {
        studentId: student.id,
        x: xi,
        y: y,
        width: 5,
        height: 5,
        door: [r > 0.5 ? xi + 2 : xi + 1, y + 4]
    }
}

tsScript.createStudentHouses = function(students, width, height){
    // Returns an array of student houses, each house in the array in the say structure as the mayor house.
    var outArray = [];
    
    var wVal = width / 50;
    var hVal = height / 50;
    
    var xStart = Math.round(width / 2) - 1;
    var yStart = hVal + 10;
    
    // Plan the number of lots
    var tW = Math.ceil(Math.sqrt(students.length));
    var tH = Math.ceil(students.length / tW);
    
    xStart = xStart - (Math.ceil(tW * 0.5) * 8.0);
    var y = yStart + 1;
    var index = 0;
    
    for(var v = 0; v < tH; ++v){
        var x = xStart;
        
        for(var u = 0; u < tW; ++u){
            if(index < students.length){
                outArray.push(createStudentHouse(students[index], index, x, y));
            }
            
            x += 10 + Math.round((Math.random() * 2.0) - 1.0);
            ++index;
        }
        
        y += 10 + Math.round((Math.random() * 2.0) - 1.0);
    }
    
    return outArray;
}
