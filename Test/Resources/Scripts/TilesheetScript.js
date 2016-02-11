var tsScript = new TileSheetScript(); // This object must always be defined.

// Optional Variables

tsScript.tileDimension = [16, 16]; // Set the viewable tile width and height. Default is 16x16

// Required Functions

/**
 * Creates a basic world with no objects or houses.
 */
tsScript.blankWorld = function(width, height){
    // Place desired code here.
    }

/**
 * Create the mayors house.
 * @return Teachers house location, dimension, and door location.
 */
tsScript.createMayorsHouse = function(width, height){
    // Place the teachers house
    
    // Return basic information
    return {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        door: [0, 0]
    };
}

tsScript.createStudentHouses = function(students, width, height){
    // Returns an array of student houses, each house in the array in the say structure as the mayor house.
    
    return [
    {
        studentId: 0,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        door: [0, 0] 
    }
    ];
}
