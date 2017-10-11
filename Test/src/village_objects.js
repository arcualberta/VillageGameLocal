/**
* Basic game Character
**/
var Character = ArcBaseObject();
{
    Character.prototype = Object.create(ArcCharacter.prototype);
    new CharacterScripts(Character.prototype);
    new DialogScripts(Character.prototype);

    function dot2D(nx, ny, x, y){
        return (nx * x) + (ny * y);
    }

    function comparePoint(angleLow, angleHigh, nx, ny, r1, r2, x, y){
        var dist = Math.sqrt((x * x) + (y * y));
        var side;

        if(dist >= r1 && dist <= r2){
            // normalize vector
            x = x / dist;
            y = y / dist;

            // Find the angle
            dist = dot2D(nx, ny, x, y); // Reverse the y due to screen coordinates

            if(dist > 0){
                dist = 1.0 - dist;

                // Find the side of the line
                side = (nx * y) - (ny * x);

                if(side < 0){
                    dist = -dist;
                }

                if(dist > angleLow && dist < angleHigh){
                    return dist;
                }
            }
        }


        return null;
    }

    function evaluateViewAngle(angleLow, angleHigh, nx, ny, cX, cY, r1, r2, village){
        if(angleLow > angleHigh){
            return null;
        }

        var rMax = r2;

        // Check for blocking

        // If no player was found, check if they exist in the area
        var players = village.players;
        var key, player, dist, x, y;

        for(var key in players){
            player = players[key];
            x = player.location[4] - cX;
            y = player.location[5] - cY;

            if(comparePoint(angleLow, angleHigh, nx, ny, r1, rMax, x, y) != null){
                return player;
            }
        }

        return null;
    }

    function evaluateFOV(village){
        var nx, ny, v;
        var angle = 1.0 - Math.cos(this.fov.angle);

        // Build the visibility cone
        var a = this.fov.coneArray;
        if(a == null){
            this.fov.coneArray = new Float32Array(12);
            a = this.fov.coneArray;
            a[2] = 0.0;
            a[3] = 0.5;

            a[6] = 1.0;
            a[7] = 0.0;

            a[10] = 1.0;
            a[11] = 1.0;
        }

        a[0] = this.location[4];
        a[1] = this.location[5];
        v = Math.tan(this.fov.angle) * this.fov.distance;
        
        // Calculate the direction.
        switch(this.direction){
            case 0: //down
                nx = 0;
                ny = 1;

                a[4] = -v + a[0];
                a[5] = this.fov.distance + a[1];

                a[8] = v + a[0];
                a[9] = this.fov.distance + a[1];
                break;

            case 1: //left
                nx = -1;
                ny = 0;
                
                a[4] = -this.fov.distance + a[0];
                a[5] = -v + a[1];

                a[8] = -this.fov.distance + a[0];
                a[9] = v + a[1];
                break;

            case 2: //up
                nx = 0;
                ny = -1;

                a[4] = -v + a[0];
                a[5] = -this.fov.distance + a[1];

                a[8] = v + a[0];
                a[9] = -this.fov.distance + a[1];
                break;

            default: //right
                nx = 1;
                ny = 0;

                a[4] = this.fov.distance + a[0];
                a[5] = -v + a[1];

                a[8] = this.fov.distance + a[0];
                a[9] = v + a[1];
                break;
        }

        // Check for player interaction
        var player = evaluateViewAngle(-angle, angle, nx, ny, this.location[4], this.location[5], 0, this.fov.distance, village)

        if(player && this.onsee){
            this.onsee(player, village);
        }

        /*var players = village.players;
        var player, dist;

        for(var i = 0; i < players.length; ++i){
            dist = Math.sqrt()
        }*/
    }

    Character.VisionCone = new Image();

    Character.prototype.init = function (id, name) {
        ArcCharacter.prototype.init.call(this);
        this.id = id;
        this.name = name;
        
        let text = new ArcRenderableText(name, {
            font: "bold 12px sans-serif",
            fillStyle: "yellow",
            textAlign: "center"
        });
        text.offset[1] = -12;
        this.addChild(text, "name");

        this.lastStep = [0, 0, false];
        this.waypoint = [0, 0];
        this.speed = 0.1;
        this.action = 0;
        this.direction = 0;
        this.blockable = true;
        this.fov = {
            enabled: false,
            distance: 300,
            angle: (35 * Math.PI) / 180.0,
            coneArray: null,
            color: new Float32Array(4)
        }

        this.updateSize(16, 16);
    };
    Character.directions = ["down", "left", "up", "right"];
    Character.actions = ["stand", "walk"];
    Character.prototype.stop = function(){

    };
    Character.startBuffer = new Float32Array(2);
    Character.endBuffer = new Float32Array(2);
    Character.prototype.isOnGoal = function(village, goal){
        var start = village.getClosestTileCoord(this.location[4], this.location[5], Character.startBuffer);
        var end = village.getClosestTileCoord(goal[0], goal[1], Character.endBuffer);

        return Math.abs(start[0] - end[0]) < 1 && Math.abs(start[1] - end[1]) < 1;
    };
    Character.prototype.calculateNextStep = function(village, speed, time, goal, output) {
        // Check if we are moving
        if(this.isOnGoal(village, goal)){
            output[0] = this.location[4];
            output[1] = this.location[5];
            output[2] = false;

            return output;
        }

        // Find the movement vector
        var blockable = this.blockable;
        var xDif = goal[0] - this.location[4];
        var yDif = goal[1] - this.location[5];
        var dist = (speed * time) / Math.sqrt((xDif * xDif) + (yDif * yDif));
        var x = Math.round(xDif * dist);
        var y = Math.round(yDif * dist);

        // Set the new values
        var isChanged = true;
        var tileBox = this.collisionBox();

        // Set to find where we intersect in the x direction.
        if(x < 0){
            if(blockable && village.isBlocked(tileBox[0] + x, tileBox[1], tileBox[0] + x + tileBox[2], tileBox[1] + tileBox[3], tileBox[2], tileBox[3])){
                x = 0; //TODO: go to the edge of the blocking object;
            }
        }else if(x > 0){
            if(blockable && village.isBlocked(tileBox[0] + x, tileBox[1], tileBox[0] + x + tileBox[2], tileBox[1] + tileBox[3], tileBox[2], tileBox[3])){
                x = 0;
            }
        }

        if(y < 0){
            if(blockable && village.isBlocked(tileBox[0] + x, tileBox[1] + y, tileBox[0] + x + tileBox[2], tileBox[1] + tileBox[3] + y, tileBox[2], tileBox[3])){
                y = 0;
            }
        }else if(y > 0){
            if(blockable && village.isBlocked(tileBox[0] + x, tileBox[1] + y, tileBox[0] + x + tileBox[2], tileBox[1] + tileBox[3] + y, tileBox[2], tileBox[3])){
                y = 0;
            }
        }

        if(x != 0 || y != 0){
            this.setMovementVector(x, y);
        }

        output[0] = this.location[4] + x;
        output[1] = this.location[5] + y;
        output[2] = isChanged;

        return output;
    };
    Character.prototype.getSpriteSheet = function(displayContext){
        var spriteSheet = null;

        if (!(spriteSheet = displayContext.spriteSheets[this.spriteSheet.id])){
            displayContext.addSpriteSheet(this.spriteSheet.id, this.spriteSheet.baseImage.src, this.spriteSheet.animations);
        }

        return spriteSheet;
    };
    Character.prototype.drawBounds = function(displayContext){
        let color = "#FF0";
        let x1 = this.location[0];
        let y1 = this.location[1];
        let x2 = this.location[2];
        let y2 = this.location[3];

        displayContext.drawLine(x1, y1, x1, y2, color);
        displayContext.drawLine(x1, y1, x2, y1, color);
        displayContext.drawLine(x2, y2, x1, y2, color);
        displayContext.drawLine(x2, y2, x2, y1, color);

        color = "#F80";
        x1 = this.lastCollisionBox[0];
        y1 = this.lastCollisionBox[1];
        x2 = x1 + this.lastCollisionBox[2];
        y2 = y1 + this.lastCollisionBox[3];

        displayContext.drawLine(x1, y1, x1, y2, color);
        displayContext.drawLine(x1, y1, x2, y1, color);
        displayContext.drawLine(x2, y2, x1, y2, color);
        displayContext.drawLine(x2, y2, x2, y1, color);
    }
    Character.prototype.draw = function(displayContext, xOffset, yOffset, width, height){
        var spriteSheet = this.getSpriteSheet(displayContext);

        if(this.fov.enabled && this.fov.coneArray){
            displayContext.drawPolygon(this.fov.color, this.fov.coneArray, Character.VisionCone);
        }

        if(spriteSheet){
            var frame = spriteSheet.getAnimation(this.animation).frames[this.frame];
            
            var frameCenter = this.location[4] - xOffset;
            var frameTop = this.location[5] - frame.hHalf - yOffset;
            
            displayContext.drawImage(spriteSheet.image,
                    frame.x, frame.y, frame.width, frame.height,
                    frameCenter - frame.wHalf, frameTop,
                    frame.drawWidth, frame.drawHeight);
            
            // Debug features    
            if(window.debugMode){    
                this.getChild("name").draw(displayContext, frameCenter, frameTop, width, height);
                displayContext.drawLine(this.waypoint[0], this.waypoint[1], this.location[4], this.location[5]);
                this.drawBounds(displayContext);
            }
        }
    };
    Character.prototype.updateAnimation = function(){
        this.setAnimation(Character.actions[this.action] + "_" + Character.directions[this.direction]);
    };
    Character.prototype.tick = function(timeSinceLast, worldAdapter, village){
        // Calculate new location
        var newLoc = this.calculateNextStep(village, this.speed, timeSinceLast, this.waypoint, this.lastStep);

        var isChanged = newLoc[2];

        if (isChanged) {
            // Set the new action
            this.action = 1;

            // Set the new direciton
            let angle = this.movementVector[2];
            if(angle > -ArcActor.MovementAngle.QUARTER){
                if(angle <= ArcActor.MovementAngle.QUARTER){
                    this.direction = 3;
                }else if(angle <= ArcActor.MovementAngle.THREE_QUARTER){
                    this.direction = 0;
                }else{
                    this.direction = 1;
                }
            }else{
                if(angle >= -ArcActor.MovementAngle.THREE_QUARTER){
                    this.direction = 2;
                }else{
                    this.direction = 1;
                }
            }

            // Set the new location
            this.updateLocation(newLoc[0], newLoc[1]);
        } else {
            if (this.action === 1) {
                this.action = 0;
                isChanged = true;
            }
        }

        if (isChanged) {
            this.updateAnimation();
        } else {
            this.showWaypoint = false;
        }

        //this.updateLocation(newLoc[0], newLoc[1]);

        this.animateFrame(timeSinceLast);

        // Check if we are the current active object
        if(parent.activeObject == this){
            parent.waypointLoc[0] = this.location[3] + this.size[2];
            parent.waypointLoc[1] = this.location[2];
        }

        if(this.fov.enabled){
            evaluateFOV.call(this, village);
        }
    };
}

// A non playable character
var NPC = ArcBaseObject();
Object.defineProperty(NPC, 'isVillageObject', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: true
});
NPC.STATE = [
    "idle", // The character does not move
    "talk", // randomly walk around
    "path", // The character follows a given path
];
NPC.prototype = Object.create(Character.prototype);
NPC.prototype.init = function (name, type, location, size, roation, properties) { // All village objects need the construction values in this order.
    Character.prototype.init.call(this, name, name);
    this.properties = properties;
    this.setState("idle");

    this.clickEnabled = true;
    this.interactEnabled = true;
    this.spriteSheet = properties.generated_map.getSpriteSheet(properties.spritesheet);

    for(var key in properties){
        var test = key.substring(0, 2);
        var state = 0;
        if(test === "on"){
            this[key] = Function("time", "player", "world", "worldAdapter", properties[key]);
        }
    }

    this.updateLocation(location[0], location[1]);
    this.waypoint[0] = location[0];
    this.waypoint[1] = this.location[1];

    // Check for an onstart
    var f = this["onstart"];

    if(f){ f.call(this); }
};
NPC.prototype.setState = function(state){
    this.state = "on" + state;
}
NPC.prototype.tick = function (timeSinceLast, worldAdapter, village, player) {

    // Check for functions
    var f = this[this.state];

    if(f){ f.call(this, timeSinceLast, player, village, worldAdapter); }

    // Execute parent functions
    Character.prototype.tick.apply(this, arguments);
};
NPC.prototype.click = function(x, y, player, world){
    // Set as the active object
    player.activeObject = this;

    // Check if we have any click functions
    var f = this['onclick'];

    if(f){ f.call(this, null, player, world); }
};
NPC.prototype.interact = function(left, top, right, bottom, player, world, worldAdapter){
    var f = this['oninteract'];

    if(f){
        f.call(this, null, player, world, worldAdapter);
    }

    if(player.activeObject === this){
        f = this['ontalk'];

        if(f){
            f.call(this, null, player, world, worldAdapter);
        }

        player.activeObject = null;
    }
};

// An idividual on the screen controlled by a human
var User = ArcBaseObject();
User.prototype = Object.create(Character.prototype);
User.prototype.init = function (id, name) {
    Character.prototype.init.call(this, id, name);
};
User.prototype.tick = function(timeSinceLast){
    this.animateFrame(timeSinceLast);
};
User.prototype.draw = function(){
    Character.prototype.draw.apply(this, arguments);
}

// The individule running the class
var Teacher = ArcBaseObject();
Teacher.prototype = Object.create(User.prototype);

// The world in which the students are playing in
var Village = ArcBaseObject();
Village.prototype.init = function (name) {
    this.name = name;
    this.teachers = {};
    this.students = {};
    this.tileSheet = null;
    this.width = 100;
    this.height = 100;
    this.tileWidth = 16;
    this.tileHeight = 16;
    this.lowerMap = []; // Array of integers for the ground tiles
    this.midMap = []; // Array of integers for tiles above the ground, but below the characters.
    this.upperMap = []; // array of integers for tiles above the ground
};
Village.prototype.getClosestTileCoord = function (pixelX, pixelY) {
    return [Math.round(pixelX / this.tileWidth), Math.round(pixelY / this.tileHeight)];
};
// Checks if a rectangular area is blocked.
Village.prototype.isBlocked = function (x1, y1, x2, y2, width, height) {
    if (this.tileSheet !== null) {
        var tX1 = x1 / this.tileWidth;
        var tY1 = y1 / this.tileHeight;
        var tX2 = Math.ceil(tX1 + (width / this.tileWidth));
        var tY2 = Math.ceil(tY1 + (height / this.tileHeight));

        tX1 = Math.floor(tX1);
        tY1 = Math.floor(tY1);

        /*if(tX1 < 0 || tY1 < 0 || tX2 >= village.tileWidth || tY2 >= village.tileHeight){
         return true;
         }*/

        for (var v = tY1; v < tY2; ++v) {
            for (var u = tX1; u < tX2; ++u) {
                var index = u + (v * this.width);

                if (index > 0 && index < this.lowerMap.length) {
                    var checkIndex = this.lowerMap[index];
                    if (checkIndex > -1 && !this.tileSheet.tiles[checkIndex].walkable) {
                        return true;
                    }

                    checkIndex = this.midMap[index];
                    if (checkIndex > -1 && !this.tileSheet.tiles[checkIndex].walkable) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    return true;
};

// An idividual playing the game
var Student = ArcBaseObject();
Student.prototype = Object.create(User.prototype);
Student.prototype.init = function (id, name, village) {
    User.prototype.init.call(this, id, name);
    this.level = 1;
    this.exp = 0;

    if (village && village !== null) {
        village.students["" + id] = (this);
    }
};

// Player
var Player = ArcBaseObject();
Player.prototype.init = function (user) {
    this.user = user;
    this.showWaypoint = false;
    this.waypointLoc = [user.location[0], user.location[1]];
    this.speed = 0.24;
    this.direction = 0;
    this.action = 0;
    this.lastStep = [0, 0, false];
    this.activeObject = null;
    this.stats = {
    };
};
Player.prototype.stop = function(){
    this.user.stop();
};
Player.prototype.tick = function (timeSinceLast, worldAdapter, village) {
    var user = this.user;

    var newLoc = user.calculateNextStep(village, this.speed, timeSinceLast, this.waypointLoc, this.lastStep);

    var isChanged = newLoc[2];//!(newLoc[0] == user.location[0] && newLoc[1] == user.location[1]);

    if (isChanged) {
        // Set the new action
        this.action = 1;

        // Set the new direciton
        let angle = this.user.movementVector[2];
        if(angle > -ArcActor.MovementAngle.QUARTER){
            if(angle <= ArcActor.MovementAngle.QUARTER){
                this.direction = 3;
            }else if(angle <= ArcActor.MovementAngle.THREE_QUARTER){
                this.direction = 0;
            }else{
                this.direction = 1;
            }
        }else{
            if(angle >= -ArcActor.MovementAngle.THREE_QUARTER){
                this.direction = 2;
            }else{
                this.direction = 1;
            }
        }

        // Set the new location
        user.updateLocation(newLoc[0], newLoc[1]);

        // Check if we walked on a trigger and activate the triggers
        var collisionBox = user.collisionBox();
        village.interact(collisionBox[0], collisionBox[1], collisionBox[0] + collisionBox[2], collisionBox[1] + collisionBox[3], this, village, worldAdapter);
    } else {
        if (this.action === 1) {
            this.action = 0;
            isChanged = true;
        }
    }

    if (isChanged) {
        user.setAnimation(Character.actions[this.action] + "_" + Character.directions[this.direction]);

        // Send update to the server
        worldAdapter.postWorldActions({
            timestamp: Date.now(),
            action: {
                type: ACTION_MOVE_USER,
                user: {
                    id: user.id,
                    name: user.name,
                    location: [user.location[0], user.location[1]],
                    animation: user.animation
                }
            }
        });
    } else {
        this.showWaypoint = false;
    }

    user.waypoint[0] = this.waypointLoc[0];
    user.waypoint[1] = this.waypointLoc[1];
};

/**
* Used the plan paths for objects in the game
* @class
* @implements {ArcActor}
*/
var Path = ArcBaseObject();
Object.defineProperty(Path, 'isVillageObject', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: true
});
Path.prototype = Object.create(ArcActor.prototype);
{
    function splitLineString(linestring, scale){
        if(linestring){
            var substring;
            var splitString = linestring.split(' ');
            this.pointCount = splitString.length;
            this.points = new Float32Array(this.pointCount << 1);

            for(i = 0; i < splitString.length; ++i){
                substring = splitString[i].split(',');
                this.points[i << 1] = parseFloat(substring[0]) * scale;
                this.points[(i << 1) + 1] = parseFloat(substring[1]) * scale;
            }
        }else{
            this.pointCount = 0;
            this.points = new Float32Array(0);
        }
    }

    Path.prototype.init = function(name, type, position, size, rotation, parameters, $object){
        ArcActor.prototype.init.call(this, true, true, false);

        this.name = name;
        this.type = type;
        this.pointCount = 0;
        this.centre = [position[0] + size[0] / 2, position[1] + size[1] / 2];
        this.updateSize(size[0], size[1]);
        this.updateLocation(position[0], position[1]);

        // Process the line
        splitLineString.call(this, $object.find("polyline").attr("points"), parameters.generated_scale);

        // Get Events
        for(var key in parameters){
            var test = key.substring(0, 2);
            var state = 0;
            if(test === "on"){
                this[key] = Function("time", "player", "world", "worldAdapter", parameters[key]);
            }
        }

        if(this.ontick){
            //tick enables
        }else{
            tickEnabled = false;
        }

        if(this.onstart){
            this.onstart(0, null, null, null);
        }
    }
    Path.prototype.tick = function(deltaMilliSeconds, worldAdapter, village){
        // Check if we have any click functions
        var f = this['ontick'];

        if(f){ 
            f.call(this, deltaMilliSeconds, worldAdapter, village);
        }
    }
    Path.prototype.getPoint = function(index, pointbuffer){
        if(index < 0 || index >= this.pointCount){
            return null;
        }

        var location = index << 1;

        pointbuffer[0] = this.points[location] + this.location[0];
        pointbuffer[1] = this.points[location + 1] + this.location[1];

        return pointbuffer;
    }

    Path.prototype.draw = function(displayContext, xOffset, yOffset, width, height){
        
        // Debug features    
        if(window.debugMode && this.pointCount > 1){    
            let color = "#0FF";

            let x1 = this.points[0] + this.location[0];
            let y1 = this.points[1] + this.location[1];
            for(var i = 2; i < this.points.length; ++i){
                let x2 = this.points[i] + this.location[0];
                ++i;
                let y2 = this.points[i] + this.location[1];

                displayContext.drawLine(x1, y1, x2, y2, color);

                x1 = x2;
                y1 = y2;
            }
        }
    }
}

// The basic world adapter object
var WorldAdapter = ArcBaseObject();
WorldAdapter.prototype.init = function (stateResponseFunction, messageFunction, gameContext) {
    this.responseFunction = stateResponseFunction;
    this.messageFunction = messageFunction;
};
WorldAdapter.prototype.login = function (passcode) {
    return {
        isSuccessful: true
    };
};
WorldAdapter.prototype.logout = function (userId) {

};
WorldAdapter.prototype.requestWorldState = function (userId) {

};
WorldAdapter.prototype.getWorldActions = function (timestamp) {

};
WorldAdapter.prototype.postWorldActions = function (actionList) {

};
WorldAdapter.prototype.getSpriteSheet = function (id) {

};
WorldAdapter.prototype.removeUserFromMap = function (id) {
    postWorldActions([{
            timestamp: Date.now(),
            action: {
                type: ACTION_REMOVE_USER,
                user: {
                    id: id
                }
            }
        }]);
};
WorldAdapter.prototype.showMessage = function (message, lineNumber, player, speaker, onComplete) {
    console.log(message);
    onComplete();
};
