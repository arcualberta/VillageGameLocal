// Run imports
importScripts("arc_engine/arc_constants.js");
importScripts("arc_engine/arc_objects.js");
importScripts("village_constants.js");
importScripts("village_objects.js");
importScripts("village_functions.js");
importScripts("village_map.js");

// Needed data
var timestamp = 0;
var width = 0;
var height = 0;
var timeSinceUpdate = 0;
var world = null;
var player = null;
var offset = [0, 0];
var halfDim = [0, 0];
var maxOffset = [0, 0];
var signIndex = [-1, 0, 0];
var SIGN_INDEX = [-100, -10]; // TEMP Code to recognize signs

// Functions
function isPlayer(id) {
    if (player === null) {
        return false;
    } else if (typeof player === 'number') {
        return false;
    }

    return player.user.id === id;
}

function addUser(id, name, location, spriteSheetId, palette, animations) {
    self.postMessage([WORKER_SET_SPRITESHEET, id, spriteSheetId, palette]);

    var user = new User(id, name);
    user.updateLocation(location[0], location[1]);

    var spriteSheet = new ArcSpriteSheet();
    spriteSheet.id = spriteSheetId + user.id; // Used for unique spritesheets

    for (var key in animations) {
        spriteSheet.setAnimation(key, animations[key]);
    }

    user.spriteSheet = spriteSheet;
    world.players[id] = user;

    return user;
}

function setPlayer(id, name, location, spriteSheetId, palette, animations) {
    var user = addUser(id, name, location, spriteSheetId, palette, animations);

    player = id;
}

function resize(newWidth, newHeight) {
    width = newWidth;
    height = newHeight;

    halfDim[0] = newWidth / 2;
    halfDim[1] = newHeight / 2;
}

function drawWorld(lowLayers, highLayers, users, playerLoc) {
    // Sort the users in proper draw order
    users.sort(function (a, b) {
        return a.location[1] - b.location[1];
    });

    var waypointLoc = null;
    if (player && player.showWaypoint) {
        waypointLoc = player.waypointLoc;
    }

    // Send the world to the canvas
    self.postMessage([WORKER_DRAW_SCENE, lowLayers, highLayers, JSON.stringify(users), offset[0], offset[1], waypointLoc, playerLoc]);
}

function checkSignIndex(x, y) {
    if (false && world !== null) {
        var xTile = Math.floor(x / world.tileWidth);
        var yTile = Math.floor(y / world.tileHeight);

        var index = xTile + (yTile * world.width);

        if (world.midMap[index] == SIGN_INDEX[0]) {
            return [index, (xTile * world.tileWidth) + 8, (yTile * world.tileHeight) + 8];
        }
    }

    return [-1, 0, 0];
}

function handleAction(action) {
    switch (action.id) {
        case CONTROL_MOUSE1_DOWN:
        case CONTROL_MOUSE1_UP:
        case CONTROL_MOUSE1_DRAG:
            if (player !== null && player.user) {
                player.waypointLoc[0] = offset[0] + action.data.x;
                player.waypointLoc[1] = offset[1] + action.data.y;

                // Check if we clicked a sign. Show the sign glowing if we did. Otherwise show a waypoint
                signIndex = checkSignIndex(offset[0] + action.data.x, offset[1] + action.data.y);
                if (signIndex[0] > -1) {
                    player.showWaypoint = false;
                } else {
                    player.showWaypoint = true;
                }
            }
            break;
    }
}

function calculateVisibleWorld(lowLayers, highLayers, users, objects) {
    if (world !== null) {
        var index = 0;

        // Calculate visible tiles
        var xTileOffset = offset[0] / world.tileWidth;
        var yTileOffset = offset[1] / world.tileHeight;
        var x = Math.floor(xTileOffset);
        var y = Math.floor(yTileOffset);
        xTileOffset = -(xTileOffset - x) * world.tileWidth;
        yTileOffset = -(yTileOffset - y) * world.tileHeight;
        var startX = x;
        var xLoc = xTileOffset;
        var yLoc = yTileOffset;

        var layerIndex = 0;
        var tileIndex = 0;

        for (layerIndex = 0; layerIndex < world.lowLayers.length; ++layerIndex) {
            lowLayers.push([]);
        }

        for (layerIndex = 0; layerIndex < world.highLayers.length; ++layerIndex) {
            highLayers.push([]);
        }

        while (yLoc <= height && y < world.height) {
            while (xLoc < width && x < world.width) {
                if (x >= 0) {
                    index = x + (y * world.width);

                    // Find if we need to add tiles
                    for (layerIndex = 0; layerIndex < lowLayers.length; ++layerIndex) {
                        tileIndex = world.lowLayers[layerIndex].data[index];

                        if (tileIndex >= 0) {
                            var tile = world.tiles[tileIndex];
                            
                            if (tile)
                                lowLayers[layerIndex].push({
                                    x: xLoc,
                                    y: yLoc,
                                    width: world.tileWidth,
                                    height: world.tileHeight,
                                    tile: tileIndex,
                                    tileSheet: tile.tileSheetName
                                });
                        }
                    }

                    for (layerIndex = 0; layerIndex < highLayers.length; ++layerIndex) {
                        tileIndex = world.highLayers[layerIndex].data[index];

                        if (tileIndex >= 0) {
                            var tile = world.tiles[tileIndex];
                            if (tile)
                                highLayers[layerIndex].push({
                                    x: xLoc,
                                    y: yLoc,
                                    width: world.tileWidth,
                                    height: world.tileHeight,
                                    tile: tileIndex,
                                    tileSheet: tile.tileSheetName
                                });
                        }
                    }
                }

                ++x;
                xLoc += world.tileWidth;
            }

            x = startX;
            xLoc = xTileOffset;
            yLoc += world.tileHeight;
            ++y;
        }

        // Calculate visible users
        var user;
        for (var key in world.players) {
            user = world.players[key];
            users.push(user);
        }
    }
}

function handleWorlSnapshot(snapshot) {
    var i;

    world = snapshot;
    if(typeof world !== "VillageMap"){
        world = VillageMap.prototype.cast.call(world);
    }

    /*world = new Village(snapshot.name);
     world.width = snapshot.width;
     world.height = snapshot.height;
     world.tileWidth = snapshot.tileWidth;
     world.tileHeight = snapshot.tileHeight;
     world.lowerMap = parseMapLayer(snapshot.lowerMap);
     world.midMap = parseMapLayer(snapshot.midMap);
     world.upperMap = parseMapLayer(snapshot.upperMap);
     world.tileSheet = snapshot.tileSheet;
     world.tileSet = [];*/

    maxOffset[0] = (world.width * world.tileWidth) - 1;
    maxOffset[1] = (world.height * world.tileHeight) - 1;

    /*
     for (i = 0; i < snapshot.tileSheet.tiles.length; ++i) {
     var tile = snapshot.tileSheet.tiles[i];
     
     var tIndex = world.tileSet.push(new ArcTile(tile.x, tile.y, tile.width, tile.height, tile.walkable, tile.deleted, tile.name));
     
     if (tile.name === 'sign') {
     SIGN_INDEX[0] = tIndex - 1;
     } else if (tile.name === 'sign_glow') {
     SIGN_INDEX[1] = tIndex - 1;
     }
     }
     */

    for (i = 0; i < snapshot.players.length; ++i) {
        var user = snapshot.students[i];

        addUser(user.id, user.name, user.location, user.spriteSheet.id, user.spriteSheet.palette, user.spriteSheet.animations);
    }

    // Set the tilesheet
    for (var i in world.tileSheets) {
        var tileSheet = world.tileSheets[i];
        self.postMessage([WORKER_SET_TILESHEET, tileSheet.name, tileSheet.imageUrl]);
    }

// TODO: Handle existing teachers and students
}

function handleModifyMap(map) { //TODO:
    var index = map.x + (map.y * world.width);
    var stride = 0;
    var data = parseMapLayer(map.data);

    for (var i = 0; i < data.length; ++i) {
        var array;
        switch (map.layer) {
            case MAP_LOWER:
                array = world.lowerMap;
                break;

            case MAP_MID:
                array = world.midMap;
                break;

            case MAP_UPPER:
                array = world.upperMap;
                break;
        }

        array[index] = data[i];

        ++stride;
        if (stride >= map.stride) {
            stride = 0;
            index -= (map.stride - 1);
            index += world.width;
        } else {
            ++index;
        }
    }
}

function handleMoveUser(user) {
    var student = world.players[user.id];

    if (student) {
        student.updateLocation(user.location[0], user.location[1]);
        student.setAnimation(user.animation);
    }
}

function handleServerAction(action) {
    switch (action.type) {
        case ACTION_MODIFY_MAP:
            handleModifyMap(action.map);
            break;

        case ACTION_ADD_USER:
            var user = action.user;
            if (!isPlayer(user.id)) {
                addUser(user.id, user.name, user.location, user.spriteSheet.id, user.spriteSheet.palette, user.spriteSheet.animations);
            }
            break;

        case ACTION_MOVE_USER:
            var user = action.user;
            if (!isPlayer(user.id)) {
                handleMoveUser(action.user);
            }
            break;
    }
}

function readWorldState(result, cameraOffset) {
    // Check if the player is logged in
    var isPlayerSet = typeof player === 'number';
    
    if (isPlayerSet) {
        isPlayerSet = false;

        //Find the player
        //console.log(JSON.stringify(world.players));
        for (var key in world.players) {
            if (key == player) {
                player = new Player(world.players[key]);
            }
        }
    } else {
        isPlayerSet = player !== null;
    }

    timestamp = result.timestamp;

    switch (result.type) {
        case WORLD_SNAPSHOT:
            handleWorlSnapshot(result.world);
            break;

        case WORLD_ACTIONLIST:
            for (var index = 0; index < result.actions.length; ++index) {
                handleServerAction(result.actions[index]);
            }
            break;
    }

    var p = null;
    if (isPlayerSet) {
        p = player.user;

        offset[0] = p.location[4] - halfDim[0];
        offset[1] = p.location[5] - halfDim[1];
    } else if (cameraOffset) {
        offset[0] = cameraOffset[0];
        offset[1] = cameraOffset[1];
    } else {
        offset[0] = 0;
        offset[1] = 0;
    }

    if (offset[0] < 0) {
        offset[0] = 0;
    } else if (offset[0] > maxOffset[0] - width) {
        offset[0] = maxOffset[0] - width;
    }

    if (offset[1] < 0) {
        offset[1] = 0;
    } else if (offset[1] > maxOffset[1] - height) {
        offset[1] = maxOffset[1] - height;
    }

    var lowLayers = [];
    var highLayers = [];
    var users = [];
    var objects = [];
    calculateVisibleWorld(lowLayers, highLayers, users, objects);
    drawWorld(lowLayers, highLayers, users, p == null ? offset : p.location);
}

function updateUserAnimations(time) {
    if (world != null) {
        for (var key in world.players) {
            world.players[key].update(time);
        }
    }
}

function isNearSign() {
    var distance = Math.sqrt(Math.pow(player.user.location[0] - signIndex[1], 2.0) + Math.pow(player.user.location[1] - signIndex[2], 2.0));
    return distance < 60.0;
}

function updateWorld(time, actionList, cameraOffset) {
    timeSinceUpdate += time;

    readWorldState(actionList, cameraOffset);

    if (player !== null && player.user) {
        // TODO
        player.update(self, world, time);

//        if (signIndex[0] > -1 && isNearSign()) {
//            signIndex[0] = -1;
//            self.postMessage([WORKER_TRIGGER_TASK, "Paint an Egg", "EggTask.js"]);
//        }
    }

    updateUserAnimations(time);
}

// Message Handler
self.onmessage = function (e) {
    var data = e.data;
    switch (data[0]) {
        case WORKER_SEND_ACTION:
            handleAction(data[1]);
            break;

        case WORKER_UPDATE_WORLD:
            updateWorld(data[1], data[2], data[3]);
            break;

        case WORKER_RESIZE:
            resize(data[1], data[2]);
            break;

        case WORKER_SET_PLAYER:
            setPlayer(data[1], data[2], data[3], data[4], data[5], data[6]);
            break;

        case WORKER_SET_WORLD:
            readWorldState(data[1]);
            break;
    }
}