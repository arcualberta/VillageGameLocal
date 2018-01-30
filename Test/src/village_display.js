var VillageDisplay = ArcBaseObject();
{
    function handleKeyDown(key){
        var controls = ArcSettings.Current.gameplay.controls;

        // handle up
        if(key == controls.up[0] || key == controls.up[1]){
            this.playerMove.up = true;
        }

        // handle down
        if(key == controls.down[0] || key == controls.down[1]){
            this.playerMove.down = true;
        }

        // handle left
        if(key == controls.left[0] || key == controls.left[1]){
            this.playerMove.left = true;
        }

        // handle right
        if(key == controls.right[0] || key == controls.right[1]){
            this.playerMove.right = true;
        }

        // handle mute
        if(key == controls.mute[0]){
            this.game.toggleMute();
        }
    };

    function handleKeyUp(key){
        var controls = ArcSettings.Current.gameplay.controls;

        // handle up
        if(key == controls.up[0] || key == controls.up[1]){
            this.playerMove.up = false;
        }

        // handle down
        if(key == controls.down[0] || key == controls.down[1]){
            this.playerMove.down = false;
        }

        // handle left
        if(key == controls.left[0] || key == controls.left[1]){
            this.playerMove.left = false;
        }

        // handle right
        if(key == controls.right[0] || key == controls.right[1]){
            this.playerMove.right = false;
        }
    };

    VillageDisplay.prototype.init = function (game, worldAdapter, workerPath, drawWorldFunction, camera) {
        var _this = this;

        this.playerStart = [0, 0];
        this.player = null;
        this.world = null;
        this.timestamp = null;
        this.maxOffset = [0, 0];
        this.worldAdapter = worldAdapter;
        this.drawWorldFunction = drawWorldFunction;
        this.display = game.display;
        this.game = game;
        this.drawLow = [];
        this.drawHigh = [];
        this.drawObjects = [];
        this.camera = camera;

        this.playerMove = {
            up: false,
            down: false,
            left: false,
            right: false
        }
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
    VillageDisplay.prototype.triggerDraw = function () {
        var offset = this.camera.offset;

        if (this.world !== null && offset) {
            if(this.player && this.player.user){
                this.drawWorldFunction(this.player.user.location, offset[0], offset[1], this.world);
            }else{
                this.drawWorldFunction(offset, offset[0], offset[1], this.world);
            }
            
        }
    };
    VillageDisplay.prototype.handleActions = function (actions) {
        var player = this.player;
        var offset = this.camera.offset;
        var action = null;

        // Handle Action List
        for (var i = 0; i < actions.length; ++i) {
            action = actions[i];

            if (player !== null && player.user && player.hasControl) {
                switch (action.id) {
                    case CONTROL_KEY_DOWN:
                        handleKeyDown.call(this, action.data.key);
                        break;

                    case CONTROL_KEY_UP:
                        handleKeyUp.call(this, action.data.key);
                        break;

                    case CONTROL_MOUSE1_DOWN:
                        player.waypointLoc[0] = offset[0] + action.data.x;
                        player.waypointLoc[1] = offset[1] + action.data.y;
                        player.showWaypoint = true;
                        break;

                    case CONTROL_MOUSE1_UP:
                        player.waypointLoc[0] = offset[0] + action.data.x;
                        player.waypointLoc[1] = offset[1] + action.data.y;
                        player.showWaypoint = true;

                        //Check Clicks
                        this.world.click(player.waypointLoc[0], player.waypointLoc[1], player, this.world);
                        break;

                    case CONTROL_MOUSE1_DRAG:
                        player.waypointLoc[0] = offset[0] + action.data.x;
                        player.waypointLoc[1] = offset[1] + action.data.y;
                        player.showWaypoint = true;

                        // Check if this is on a trigger
                        //this.world.checkTriggers(player.waypointLoc[0], player.waypointLoc[1], 1, 1, false, true, this.worldAdapter, player); // tODO: Remove the tree
                        break;
                }
            }
        }

        // Deal with key states
        var x = 0;
        var y = 0;

        if(this.playerMove.up){
            --y;
        }

        if(this.playerMove.down){
            ++y;
        }

        if(this.playerMove.left){
            --x;
        }

        if(this.playerMove.right){
            ++x;
        }


        if(x != 0 || y != 0){
            var user = player.user;
            var d = Math.sqrt((x * x) + (y * y));
            var r = 80 / d;


            player.waypointLoc[0] = user.location[4] + (x * r);
            player.waypointLoc[1] = user.location[5] + (y * r); // Radiates from the bottom of thier feet.
            //player.waypointLoc[1] = user.location[3] + (y * r); // Radiates from the bottom of thier feet.
            //player.showWaypoint = true;
        }
    };
    VillageDisplay.prototype.updateWorld = function (time, actionList, cameraOffset) {
        this.readWorldState(actionList, cameraOffset);
    };
    VillageDisplay.prototype.tick = function(time, cameraOffset){
        var p = null;

        if (this.player && this.player.user) {
            p = this.player.user;
        }
        /*var offset = this.camera.offset;
        var dimension = null;

        if (this.player && this.player.user) {
            p = this.player.user;
            dimension = this.halfDim;

            offset[0] = p.location[4] - dimension[0];
            offset[1] = p.location[5] - dimension[1];
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
        }*/

        // Update player
        if (p !== null) {
            this.player.tick(time, this.worldAdapter, this.world);
            if(this.player.showWaypoint){
                this.world.setWaypointLocation(this.player.waypointLoc);
            }else{
                this.world.setWaypointLocation(null);
            }
        }

        this.world.tick(time, this.worldAdapter, this.world, this.player);
    };
    VillageDisplay.prototype.resize = function (width, height) {
        this.camera.setDimension(width, height);
    };
    VillageDisplay.prototype.setPlayer = function (id, name, location, spriteSheetId, palette, animations) {
        var user = this.addUser(id, name, location, spriteSheetId, palette, animations);

        this.player = id;
        this.camera.player = user;
        this.camera.centerOffset(user.location[4], user.location[5]);

        return user;
    };
    VillageDisplay.prototype.readWorldState = function (result) {
        // Check if the player is logged in
        var player = this.player;
        var isPlayerSet = typeof player === 'number';
        var world = this.world;

        if (isPlayerSet) {
            isPlayerSet = false;

            //Find the player
            //console.log(JSON.stringify(world.players));
            let players = world.players;
            if (players[player]) {
                this.player = new Player(players[player]);
                player = this.player;
                //player.user.location[0] = this.playerStart[0];
                //player.user.location[1] = this.playerStart[1];
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

        

        //this.triggerDraw(p === null ? offset : p.location, offset);
    };
    VillageDisplay.prototype.handleWorldSnapshot = function (world, playerStart) {
        var i;
        this.world = world;
        this.playerStart[0] = playerStart[0];
        this.playerStart[1] = playerStart[1];

        this.camera.maxOffset[0] = (world.width * world.tileWidth) - 1;
        this.camera.maxOffset[1] = (world.height * world.tileHeight) - 1;

        // Players should already be added
        let players = world.players;
        for (i in players) {
            var user = players[i];

            //this.addUser(user.id, user.name, user.location, user.spriteSheet.id, user.spriteSheet.palette, user.spriteSheet.animations);
        }

        if (this.player !== null && this.player.user) {
            this.player.user.updateLocation(this.playerStart[0], this.playerStart[1]);
            this.player.waypointLoc[0] = this.playerStart[0];
            this.player.waypointLoc[1] = this.playerStart[1];

            world.addPlayer(this.player.user);
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
            user.updateLocation(message.location[0], message.location[1]);
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
    VillageDisplay.prototype.addSpriteSheet = function(spriteSheet){
        this.display.addSpriteSheet(spriteSheet.id, spriteSheet.baseImage.src, spriteSheet.animations, palette);
    };
    VillageDisplay.prototype.addUser = function (id, name, location, spriteSheetId, palette, animations) {
        let players = this.world.players;
        let user = players[id];
        if (user) {
            //completed
        } else {
            user = new User(id, name);
        }

        user.updateLocation(location[0], location[1]);

        var spriteSheet = this.worldAdapter.getSpriteSheet(spriteSheetId).copy();
        spriteSheet.id = spriteSheetId + user.id; // Used for unique spritesheets

        for (var key in animations) {
            spriteSheet.setAnimation(key, animations[key]);
        }

        this.display.addSpriteSheet(spriteSheet.id, spriteSheet.baseImage.src, spriteSheet.animations, palette);

        user.spriteSheet = spriteSheet;
        this.world.addPlayer(user);

        return user;
    };
    VillageDisplay.prototype.onPause = function(){
        this.playerMove = {
            up: false,
            down: false,
            left: false,
            right: false
        }
    };
    VillageDisplay.prototype.onResume = function(){

    };
}