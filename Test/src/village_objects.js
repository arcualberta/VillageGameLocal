var Character = ArcBaseObject();
Character.prototype = Object.create(ArcCharacter.prototype);
new CharacterScripts(Character.prototype);
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
};
Character.prototype.update = function (timeSinceLastFrame) {
    ArcCharacter.prototype.tick.call(this, timeSinceLastFrame);
};
Character.prototype.calculateNextStep = function (village, speed, time, goal, output) {
    var start = village.getClosestTileCoord(this.location[0], this.location[1]);
    var end = village.getClosestTileCoord(goal[0], goal[1]);

    var xDif = start[0] - end[0];
    var yDif = start[1] - end[1];

    var newX = 0;//this.location[0];
    var newY = 0;//this.location[1];

    var distance = speed * time;
    var isChanged = false;

    //if(Math.abs(xDif) > Math.abs(yDif)){
    if (xDif > 0.0) {
        newX -= distance;
        isChanged = true;
    } else if (xDif < 0.0) {
        newX += distance;
        isChanged = true;
    }
    //}else{
    if (yDif > 0) {
        newY -= distance;
        isChanged = true;
    } else if (yDif < 0) {
        newY += distance;
        isChanged = true;
    }
    //}

    if (!isChanged) {
        output[0] = this.location[0];
        output[1] = this.location[1];
        output[2] = false;

        return output;
    }

    // TODO: Define an acutal bounding box variable
    var tileBox = this.collisionBox();

    if (village.isBlocked(tileBox[0], tileBox[1] + newY, tileBox[2], tileBox[3])) {
        newY = 0;
    }

    if (village.isBlocked(tileBox[0] + newX, tileBox[1], tileBox[2], tileBox[3])) {
        newX = 0;
    }

    newX += this.location[0];
    newY += this.location[1];

    output[0] = newX;
    output[1] = newY;
    output[2] = isChanged;

    return output;
};
Character.prototype.draw = function(displayContext, xOffset, yOffset, width, height){
    var spriteSheet = displayContext.spriteSheets[this.spriteSheet.id];
    var frame = spriteSheet.getAnimation(this.animation).frames[this.frame];
    
    var frameCenter = this.location[0] - xOffset;
    var frameTop = this.location[1] - frame.hHalf - yOffset;
    
    displayContext.drawImage(spriteSheet.image,
            frame.x, frame.y, frame.width, frame.height,
            frameCenter - frame.wHalf, frameTop,
            frame.drawWidth, frame.drawHeight);
            
    this.getChild("name").draw(displayContext, frameCenter, frameTop, width, height);
};

// A non playable character
var NPC = ArcBaseObject();
NPC.STATE = {
    "idle": 0, // The character does not move
    "talk": 1, // randomly walk around
    "path": 2, // The character follows a given path
}
NPC.prototype = Object.create(Character.prototype);
NPC.prototype.init = function (id, name, state, location, properties) {
    Character.prototype.init.call(this, id, name);
    this.state = state;
    this.waypoint = [0, 0];
    this.properties = properties;

    this.updateLocation(location[0], location[1]);
};
NPC.prototype.update = function (timeSinceLastFrame) {
    this.animateFrame(timeSinceLastFrame);
};
NPC.prototype.calculateWaypoint = function (map) {
    switch (this.state) {
        case NPC.ACTIONS.wander:
            if (Math.random() < 0.01) {// TODO: Change to a math defined value

            }
            break;
    }
};

// An idividual on the screen controlled by a human
var User = ArcBaseObject();
User.prototype = Object.create(Character.prototype);
User.prototype.init = function (id, name) {
    Character.prototype.init.call(this, id, name);
};

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
Village.prototype.isBlocked = function (x, y, width, height) {
    if (this.tileSheet !== null) {
        var tX1 = x / this.tileWidth;
        var tY1 = y / this.tileHeight;
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
    this.speed = 0.08;
    this.direction = 0;
    this.action = 0;
    this.lastStep = [0, 0, false];
};
Player.directions = ["down", "left", "up", "right"];
Player.actions = ["stand", "walk"];
Player.prototype.update = function (worldAdapter, village, timeSinceLast) {
    var user = this.user;

    var newLoc = user.calculateNextStep(village, this.speed, timeSinceLast, this.waypointLoc, this.lastStep);

    var isChanged = newLoc[2];//!(newLoc[0] == user.location[0] && newLoc[1] == user.location[1]);

    if (isChanged) {
        // Set the new action
        this.action = 1;

        // Set the new direciton
        var xDif = user.location[0] - newLoc[0];
        var yDif = user.location[1] - newLoc[1];

        if (xDif < 0.0) {
            this.direction = 3;
        } else if (xDif > 0.0) {
            this.direction = 1;
        }

        if (yDif < 0.0) {
            this.direction = 0;
        } else if (yDif > 0.0) {
            this.direction = 2;
        }

        // Set the new location
        user.location[0] = newLoc[0];
        user.location[1] = newLoc[1];

        // Check if we walked on a trigger and activate the triggers
        var collisionBox = user.collisionBox();
        village.checkTriggers(collisionBox[0], collisionBox[1], collisionBox[2], collisionBox[3], true, false, worldAdapter, this);
    } else {
        if (this.action === 1) {
            this.action = 0;
            isChanged = true;
        }
    }

    if (isChanged) {
        user.setAnimation(Player.actions[this.action] + "_" + Player.directions[this.direction]);

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
};
// The basic world adapter object
var WorldAdapter = ArcBaseObject();
WorldAdapter.prototype.init = function (stateResponseFunction, messageFunction) {
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
WorldAdapter.prototype.showMessage = function (message, lineNumber, onComplete) {
    console.log(message);
    onComplete();
};
