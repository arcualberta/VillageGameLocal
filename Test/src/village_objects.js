var Character = ArcBaseObject();
Character.prototype = Object.create(ArcCharacter.prototype);
new CharacterScripts(Character.prototype);
new DialogScripts(Character.prototype);
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
    var dist = Math.sqrt((xDif * xDif) + (yDif * yDif)) / (speed * time);
    xDif = (xDif / dist);
    yDif = (yDif / dist);

    // Set the new values
    var isChanged = true;
    var tileBox = this.collisionBox();
    var x = 0;
    var y = 0;

    // Set to find where we intersect in the x direction.
    if(xDif < 0){
        for(x = -1; x > xDif; --x){
            if(blockable && village.isBlocked(tileBox[0] + x, tileBox[1], tileBox[0] + x + tileBox[2], tileBox[1] + tileBox[3], tileBox[2], tileBox[3])){
                break;
            }
        }

        ++x;
    }else if(xDif > 0){
        for(x = 1; x < xDif; ++x){
            if(blockable && village.isBlocked(tileBox[0] + x, tileBox[1], tileBox[0] + x + tileBox[2], tileBox[1] + tileBox[3], tileBox[2], tileBox[3])){
                break;
            }
        }

        --x;
    }

    // Step in the y direction to see where we intersect.
    if(yDif < 0){
        for(y = -1; y > yDif; --y){
            if(blockable && village.isBlocked(tileBox[0] + x, tileBox[1] + y, tileBox[0] + x + tileBox[2], tileBox[1] + tileBox[3] + y, tileBox[2], tileBox[3])){
                break;
            }
        }

        ++y;
    }else if(yDif > 0){
        for(y = 1; y < yDif; ++y){
            if(blockable && village.isBlocked(tileBox[0] + x, tileBox[1] + y, tileBox[0] + x + tileBox[2], tileBox[1] + tileBox[3] + y, tileBox[2], tileBox[3])){

                break;
            }
        }

        --y;
    }

    if(x != 0 && y != 0){
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
        this.setAnimation(Character.actions[this.action] + "_" + Character.directions[this.direction]);
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
};

// A non playable character
var NPC = ArcBaseObject();
NPC.STATE = [
    "idle", // The character does not move
    "talk", // randomly walk around
    "path", // The character follows a given path
];
NPC.prototype = Object.create(Character.prototype);
NPC.prototype.init = function (id, name, state, location, properties) {
    Character.prototype.init.call(this, id, name);
    this.properties = properties;
    this.setState(state);

    this.clickEnabled = true;
    this.interactEnabled = true;

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
