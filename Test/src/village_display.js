var VillageDisplay = ArcBaseObject();
VillageDisplay.prototype.init = function (game, worldAdapter, workerPath, drawWorldFunction) {
    var _this = this;

    this.playerStart = [0, 0];
    this.player = null;
    this.world = null;
    this.timestamp = null;
    this.offset = [0, 0];
    this.halfDim = [0, 0];
    this.maxOffset = [0, 0];
    this.dimension = [0, 0];
    this.worldAdapter = worldAdapter;
    this.drawWorldFunction = drawWorldFunction;
    this.display = game.display;
    this.game = game;
    this.drawLow = [];
    this.drawHigh = [];
    this.drawObjects = [];
};
VillageDisplay.prototype.clearLayerGroup = function(layers, groupCount){
    if(layers.length === groupCount){
        for(var i = 0; i < groupCount; ++i){
            layers[i].length = 0;
        }
    }else{
        layers.length = 0;
        for(var i = 0; i < groupCount; ++i){
            layers.push([]);
        }
    }
    
    return layers;
};
VillageDisplay.prototype.triggerDraw = function (playerLoc, offset) {
    if (this.world !== null && offset) {
        this.drawWorldFunction(playerLoc, offset[0], offset[1], this.world);
    }
};
VillageDisplay.prototype.handleActions = function (actions) {
    var player = this.player;
    var offset = this.offset;
    var action = null;

    for (var i = 0; i < actions.length; ++i) {
        action = actions[i];
        
        switch (action.id) {
            case CONTROL_MOUSE1_DOWN:
            case CONTROL_MOUSE1_UP:
            case CONTROL_MOUSE1_DRAG:
                if (player !== null && player.user) {
                    player.waypointLoc[0] = offset[0] + action.data.x;
                    player.waypointLoc[1] = offset[1] + action.data.y;
                    player.showWaypoint = true;
                    
                    // Check if this is on a trigger
                    this.world.checkTriggers(player.waypointLoc[0], player.waypointLoc[1], 1, 1, false, true, this.worldAdapter, player);
                }
                break;
        }
    }
};
VillageDisplay.prototype.updateWorld = function (time, actionList, cameraOffset) {
    this.readWorldState(actionList, cameraOffset);
    var player = this.player;

    if (player !== null && player.user) {
        player.update(this.worldAdapter, this.world, time);
        if(player.showWaypoint){
            this.world.setWaypointLocation(player.waypointLoc);
        }else{
            this.world.setWaypointLocation(null);
        }
    }
    
    // Update the layers
    this.world.tick(time);
};
VillageDisplay.prototype.resize = function (width, height) {
    this.dimension[0] = width;
    this.dimension[1] = height;

    this.halfDim[0] = width / 2;
    this.halfDim[1] = height / 2;
};
VillageDisplay.prototype.setPlayer = function (id, name, location, spriteSheetId, palette, animations) {
    var user = this.addUser(id, name, location, spriteSheetId, palette, animations);

    this.player = id;
};
VillageDisplay.prototype.readWorldState = function (result, cameraOffset) {
    // Check if the player is logged in
    var player = this.player;
    var isPlayerSet = typeof player === 'number';
    var world = this.world;

    if (isPlayerSet) {
        isPlayerSet = false;

        //Find the player
        //console.log(JSON.stringify(world.players));
        let players = world.getChild("players");
        for (var key in players.children) { // tODO: Change to function
            if (key == player) {
                this.player = new Player(players.getChild(key));
                player = this.player;
                //player.user.location[0] = this.playerStart[0];
                //player.user.location[1] = this.playerStart[1];
            }
        }
    } else {
        isPlayerSet = player !== null;
    }

    this.timestamp = result.timestamp;

    switch (result.type) {
        case WORLD_SNAPSHOT:
            this.handleWorldSnapshot(result.world, result.playerStart);
            break;

        case WORLD_ACTIONLIST:
            for (var index = 0; index < result.actions.length; ++index) {
                this.handleServerAction(result.actions[index]);
            }
            break;
    }

    var p = null;
    var offset = this.offset;
    var dimension = null;

    if (isPlayerSet) {
        p = player.user;
        dimension = this.halfDim;

        offset[0] = p.location[0] - dimension[0];
        offset[1] = p.location[1] - dimension[1];
    } else if (cameraOffset) {
        offset[0] = cameraOffset[0];
        offset[1] = cameraOffset[1];
    } else {
        offset[0] = 0;
        offset[1] = 0;
    }

    dimension = this.dimension;
    if (offset[0] < 0) {
        offset[0] = 0;
    } else if (offset[0] > this.maxOffset[0] - dimension[0]) {
        offset[0] = this.maxOffset[0] - dimension[0];
    }

    if (offset[1] < 0) {
        offset[1] = 0;
    } else if (offset[1] > this.maxOffset[1] - dimension[1]) {
        offset[1] = this.maxOffset[1] - dimension[1];
    }

    this.triggerDraw(p === null ? offset : p.location, offset);
};
VillageDisplay.prototype.handleWorldSnapshot = function (world, playerStart) {
    var i;
    this.world = world;
    this.playerStart[0] = playerStart[0];
    this.playerStart[1] = playerStart[1];

    this.maxOffset[0] = (world.width * world.tileWidth) - 1;
    this.maxOffset[1] = (world.height * world.tileHeight) - 1;

    // Players should already be added
    let players = world.getChild("players");
    for (i = 0; i < players.children.length; ++i) {
        var user = players.children[i];

        addUser(user.id, user.name, user.location, user.spriteSheet.id, user.spriteSheet.palette, user.spriteSheet.animations);
    }

    if (this.player !== null && this.player.user) {
        this.player.user.location[0] = this.playerStart[0];
        this.player.user.location[1] = this.playerStart[1];
        this.player.waypointLoc[0] = this.playerStart[0];
        this.player.waypointLoc[1] = this.playerStart[1];

        players.setChild(this.player.user, this.player.user.id);
    }

    // Set the tilesheet
    for (var i in world.tileSheets) {
        var tileSheet = world.tileSheets[i];
        this.display.addExistingTileSheet(tileSheet.name, tileSheet);
    }
};
VillageDisplay.prototype.handleModifyMap = function (map) {
    //TODO  
};
VillageDisplay.prototype.handleMoveUser = function (message) {
    var user = world.getChild("players").getChild(message.id);

    if (user) {
        user.location[0] = message.location[0];
        user.location[1] = message.location[1];
        user.setAnimation(message.animation);
    }
};
VillageDisplay.prototype.handleServerAction = function (action) {
    switch (action.type) {
        case ACTION_MODIFY_MAP:
            this.handleModifyMap(action.map);
            break;

        case ACTION_ADD_USER:
            var user = action.user;
            if (!this.isPlayer(user.id)) {
                this.addUser(user.id, user.name, user.location, user.spriteSheet.id, user.spriteSheet.palette, user.spriteSheet.animations);
            }
            break;

        case ACTION_MOVE_USER:
            var user = action.user;
            if (!this.isPlayer(user.id)) {
                this.handleMoveUser(action.user);
            }
            break;
    }
};
VillageDisplay.prototype.isPlayer = function (id) {
    if (this.player === null) {
        return false;
    } else if (typeof this.player === 'number') {
        return false;
    }

    return this.player.user.id === id;
};
VillageDisplay.prototype.addUser = function (id, name, location, spriteSheetId, palette, animations) {
    let players = this.world.getChild("players");
    let user = players.getChild(id);
    if (user) {
        //completed
    } else {
        user = new User(id, name);
    }

    user.location[0] = location[0];
    user.location[1] = location[1];

    var spriteSheet = this.worldAdapter.getSpriteSheet(spriteSheetId).copy();
    spriteSheet.id = spriteSheetId + user.id; // Used for unique spritesheets

    for (var key in animations) {
        spriteSheet.setAnimation(key, animations[key]);
    }

    this.display.addSpriteSheet(spriteSheet.id, spriteSheet.baseImage.src, spriteSheet.animations, palette);

    user.spriteSheet = spriteSheet;
    players.setChild(user, id);

    return user;
};