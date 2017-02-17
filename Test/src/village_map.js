// Housing Sections
var HousingSection = ArcBaseObject();
HousingSection.prototype.init = function (name, x, y, width, height, tileWidth, tileHeight, mapUrl, maps) {
    var _this = this;

    this.name = name;
    this.position = [Math.floor(x / tileWidth), Math.floor(y / tileHeight), Math.round(width / tileWidth), Math.round(height / tileHeight)];
    this.housingCode = [];
    this.bins = new Uint8Array(this.position[2] * this.position[3]); // Start as 0 values. They will then contain the amount of used bins to their left and themselves.
    this.nextHouse = 0;

    if (maps) {
        var mapSplit = maps.split(",");
        for (var i = 0; i < mapSplit.length; ++i) {
            $.get(mapUrl + mapSplit + ".tmx", function (data) {
                var tiledFile = null;
                if (typeof data === "string") {
                    data = $.parseXML(data);
                }

                tiledFile = $(data.children[0]);
                _this.housingCode = tiledFile;
            });
        }
    }
};
HousingSection.prototype.canFitInBin = function (x, y, width, height) {
    return true; // TODO
};
HousingSection.prototype.addHouse = function (map, userId, userHouse) {
    if (this.housingCode.length === 0) {
        return;
    }

    var _this = this;
    var width = this.position[2];
    var height = this.position[3];

    // First select a house that fits
    var searching = true;
    var startX = 0;
    var startY = -1;
    var checkVal;
    var index = 0;

    var houseCode = $(this.housingCode[0]); // We will randomly select a house later
    var houseWidth = parseInt(houseCode.attr("width"));
    var houseHeight = parseInt(houseCode.attr("height"));

    // Check if we can find a spot for this house
    for (; startY < height && searching; ) {
        ++startY;

        for (startX = 0; startX < width; ) {
            checkVal = this.bins[index];

            if (checkVal === 0) {
                if (this.canFitInBin(startY, startX, houseWidth, houseHeight)) {
                    searching = false;
                    break;
                } else {
                    checkVal = 1;
                }
            }

            index += checkVal;
            startX += checkVal;
        }
    }

    if (!searching) {
        index = 0; // Layer index
        searching = false; // True means we are on the upper layers
        startX += _this.position[0];
        startY += _this.position[1];
        houseCode.children().each(function () {
            var type = this.localName;
            var name = $(this).attr("name");
            if (type === "layer") {
                var layer = searching ? map.highLayers[index] : map.lowLayers[index];
                var tiles = $(this).find("data").text().split(",");
                var ySet = 0;
                var xSet = 0;

                for (var i = 0; i < tiles.length; ++i) {
                    if (tiles[i] != 0) { // String checking int
                        ySet = Math.floor(i / houseWidth);
                        xSet = i % houseWidth;

                        ySet += startY;
                        xSet += startX;

                        layer.setTile(xSet, ySet, parseInt(tiles[i]) - 1);
                    }
                }

                ++index;
            } else if (type === "objectgroup") {
                if (name === "triggers") {

                } else if (name === "objects") {
                    index = 0;
                    searching = true;
                }
            }
        });
    }

    return false;
};
// Village Objects
var VillageObject = ArcBaseObject();
VillageObject.prototype = Object.create(ArcActor.prototype)
VillageObject.prototype.init = function (name, type, position, size, rotation, tileId, parameters) {
    ArcActor.prototype.init.call(this, true, true, false);  
    this.name = name;
    this.properties = {};
    this.position = [position[0], position[1], position[0] + size[0], position[1] + size[1]];
    this.tileId = tileId;
    this.size = size.slice();
    this.centre = [position[0] + size[0] / 2, position[1] + size[1] / 2];
    this.rotation = rotation;
    this.type = type;
    this.parameters = parameters;
};
VillageObject.prototype.draw = function(displayContext, xOffset, yOffset, width, height){
    displayContext.drawTileById(this.tileId, this.position[0] - xOffset, this.position[1] - yOffset, this.size[0], this.size[1]);
};

// Trigger Objects
var Trigger = ArcBaseObject();
Trigger.prototype.init = function (name, type, position, size, rotation) {
    this.name = name;
    this.position = [position[0], position[1], position[0] + size[0], position[1] + size[1]];
    this.centre = [position[0] + size[0] / 2, position[1] + size[1] / 2];
    this.size = size.slice();
    this.rotation = rotation;
    this.type = type;
    this.followObject = null;
};
Trigger.prototype.setProperty = function (name, value) {
    this.properties[name] = value;
};
Trigger.prototype.checkTrigger = function (left, top, right, bottom) {
    var points = this.position;

    return !(points[0] > right ||
            points[2] < left ||
            points[1] > bottom ||
            points[3] < top);
};
Trigger.prototype.walkTrigger = function (map, worldAdapter, player) {

};
Trigger.prototype.clickTrigger = function (map, worldAdapter, player) {

};
Trigger.prototype.update = function(map, timeSinceLast){
    if(typeof(this.followObject) === "string"){
        console.log(this.followObject);
    }
};

var ChangeMapTrigger = ArcBaseObject();
ChangeMapTrigger.prototype = Object.create(Trigger.prototype);
ChangeMapTrigger.prototype.init = function (name, type, position, size, rotation, module, mapName, start) {
    Trigger.prototype.init.call(this, name, type, position, size, rotation);
    this.module = module;
    this.mapName = mapName;
    this.start = start;
};
ChangeMapTrigger.prototype.walkTrigger = function () {
    this.module.load(this.mapName, this.start);
};

var ClickReadTrigger = ArcBaseObject();
ClickReadTrigger.prototype = Object.create(Trigger.prototype);
ClickReadTrigger.prototype.init = function (name, type, position, size, rotation, message, connectedObject) {
    Trigger.prototype.init.call(this, name, type, position, size, rotation);
    this.message = message;
    this.connectedObject = connectedObject;
    this.activated = false;
};
ClickReadTrigger.prototype.clickTrigger = function (map, worldAdapter, player) {
    player.showWaypoint = false;
    player.waypointLoc[0] = this.centre[0];
    player.waypointLoc[1] = this.centre[1];
};
ClickReadTrigger.prototype.walkTrigger = function (map, worldAdapter, player) {
    var _this = this;
    if (!this.activated && player.waypointLoc[0] === this.centre[0] && player.waypointLoc[1] === this.centre[1]) {
        this.activated = true;

         worldAdapter.showMessage(this.message, false, function () {
            _this.activated = false;
        });
    }
};

var ClickTaskTrigger = ArcBaseObject();
ClickTaskTrigger.prototype = Object.create(Trigger.prototype);
ClickTaskTrigger.prototype.init = function(name, type, position, size, rotation, title, task){
    Trigger.prototype.init.call(this, name, type, position, size, rotation);
    this.task = task;
    this.title = title;
    this.activated = false;
}
ClickTaskTrigger.prototype.clickTrigger = function (map, worldAdapter, player) {
    player.showWaypoint = false;
    player.waypointLoc[0] = this.centre[0];
    player.waypointLoc[1] = this.centre[1];
};
ClickTaskTrigger.prototype.walkTrigger = function (map, worldAdapter, player) {
    var _this = this;
    if (!this.activated && player.waypointLoc[0] === this.centre[0] && player.waypointLoc[1] === this.centre[1]) {
        this.activated = true;

        worldAdapter.loadTask(this.task, worldAdapter.getTaskScript(this.task), function (model) {
            _this.activated = false;
        });
    }
};

// Map Objects
var VillageMap = ArcBaseObject();
VillageMap.prototype = Object.create(ArcMap.prototype);
VillageMap.prototype.init = function (parent, mapName, studentList) {
    ArcMap.prototype.init.call(this, parent, mapName);
    this.housingSections = [];
    this.studentList = [
        //Temp students
        {
            id: 721,
            name: "Demo Student"
        }
    ];
    this.waypointIndex = 0;
    
    this.players = new ArcRenderableObjectCollection(true, true); //TODO: Add after objects.
    this.waypoint = new ArcWaypoint(); // TODO: add before objects
    this.triggers = null;
    this.objects = null;
};
VillageMap.prototype.setWaypointLocation = function(location){
    let waypoint = this.waypoint;
    
    if(location !== null){
        waypoint.isVisible = true;
        waypoint.location[0] = location[0];
        waypoint.location[1] = location[1];
    }else{
        waypoint.isVisible = false;
    }
};
VillageMap.prototype.cast = function () {
    var map = new VillageMap(this.name);

    for (var key in this) {
        map[key] = this[key];
    }

    return map;
};
VillageMap.prototype.addTrigger = function ($trigger, scale, triggerTree) {
    var triggerName = $trigger.attr("name");
    var triggerType = $trigger.attr("type").toLowerCase();
    var triggerX = Number($trigger.attr("x")) * scale; // Double the size for now since we double the map size
    var triggerY = Number($trigger.attr("y")) * scale;
    var triggerWidth = Number($trigger.attr("width")) * scale;
    var triggerHeight = Number($trigger.attr("height")) * scale;
    var triggerRotation = 0.0;
    var triggerProperties = {};
    var trigger = null;

    // Load the properties
    $trigger.find("properties > property").each(function () {
        triggerProperties[$(this).attr("name").toLowerCase()] = $(this).attr("value");
    });

    if (triggerType === "changemap") {
        trigger = new ChangeMapTrigger(triggerName, triggerType, [triggerX, triggerY], [triggerWidth, triggerHeight], triggerRotation, this.parent, triggerProperties["map"], triggerProperties["start"]);
    } else if (triggerType === "clickread") {
        trigger = new ClickReadTrigger(triggerName, triggerType, [triggerX, triggerY], [triggerWidth, triggerHeight], triggerRotation, triggerProperties["message"], triggerProperties["object"]);
    } else if(triggerType === "clicktask"){
        trigger = new ClickTaskTrigger(triggerName, triggerType, [triggerX, triggerY], [triggerWidth, triggerHeight], triggerRotation, triggerProperties["title"], triggerProperties["task"]);
    }else {
        trigger = new Trigger(triggerName, triggerType, [triggerX, triggerY], [triggerWidth, triggerHeight], triggerRotation);
    }
    
    if(triggerProperties['follow']){
        trigger.followObject = triggerProperties['follow'];
    }

    triggerTree.insert(trigger);
};
VillageMap.prototype.load = function (onload, startName) {
    // Check if the map is already loaded
    if (this.loaded) {
        var startLocation = [0, 0];
        if (startName) {
            var startObject = this.objects.getByName(startName);
            if (startObject !== null) {
                startLocation = startObject.centre.slice();
            }
        }

        // Return the function
        this.loaded = true;
        if (onload && onload !== null) {
            onload(this, startLocation);
        }
        return;
    }

    // Load the map
    var modulePath = this.parent.path;
    var _this = this;
    var scale = 2.0;
    $.get(modulePath + "/maps/" + this.name + ".tmx", function (data) {
        var tiledFile = null;
        if (typeof data === "string") {
            data = $.parseXML(data);
        }

        tiledFile = $(data.children[0]);
        // Setup Dimensions
        _this.width = parseInt(tiledFile.attr("width"));
        _this.height = parseInt(tiledFile.attr("height"));
        _this.tileWidth = parseInt(tiledFile.attr("tilewidth")) * scale;
        _this.tileHeight = parseInt(tiledFile.attr("tileheight")) * scale;

        // Setup tiles
        var tiles = _this.tiles;
        var addTile = function (tileSheet, index, imageWidth, tileWidth, tileHeight) {
            if (index < tileSheet.firstGid) {
                return null;
            }

            if (tiles[index]) {
                return tiles[index];
            }

            var i = index - tileSheet.firstGid;
            var width = Math.floor(imageWidth / tileWidth);
            var y = Math.floor(i / width);
            var x = i - (y * width);
            x *= tileWidth;
            y *= tileHeight;
            tiles[index] = new ArcTile(x, y, tileWidth, tileHeight, true, false, index);
            tiles[index].tileSheetName = tileSheet.name;
            return tiles[index];
        };
        var addAnimationTile = function (tileSheet, index, imageWidth, tileWidth, tileHeight, $animations) {
            var animations = new ArcAnimation();
            $animations.each(function () {
                var duration = parseInt($(this).attr('duration'));

                var i = parseInt($(this).attr('tileid'));
                var width = Math.floor(imageWidth / tileWidth);
                var y = Math.floor(i / width);
                var x = i - (y * width);
                x *= tileWidth;
                y *= tileHeight;

                animations.addFrame(x, y, tileWidth, tileHeight, duration, false, false);
            });
            tiles[index] = new ArcAnimatedTile(animations, true, false, index);
            tiles[index].tileSheetName = tileSheet.name;
            return tiles[index];
        };
        // Setup the tilesheets
        tiledFile.find('tileset').each(function () {
            var $tileset = $(this);
            var start = parseInt($tileset.attr("firstgid")) - 1;
            var tileWidth = parseInt($tileset.attr("tilewidth"));
            var tileHeight = parseInt($tileset.attr("tileheight"));
            var $image = $tileset.find("image");
            var imageWidth = parseInt($image.attr("width"));
            // Create the tilesheet
            var tileSheet = new ArcTileSheet($tileset.attr("name"),
                    modulePath + "/maps/" + $image.attr("source"), tiles, false,
                    start, tileWidth, tileHeight, false, imageWidth, parseInt($image.attr("height")));
            var firstGid = tileSheet.firstGid;
            _this.tileSheets[tileSheet.name] = tileSheet;
            
            // Create any special tiles
            $tileset.find("tile").each(function () {
                var $tile = $(this);
                var tileId = parseInt($tile.attr("id")) + firstGid;
                
                $image = $tile.find("image");
                if ($image[0]){
                imageWidth = parseInt($image.attr("width"));
                        tileWidth = imageWidth;
                        tileHeight = parseInt($image.attr("height"));
                        tileSheet = new ArcTileSheet($tileset.attr("name") + tileId,
                                modulePath + "/maps/" + $image.attr("source"), tiles, false,
                                tileId, imageWidth, tileHeight, false, imageWidth, tileHeight);
                        _this.tileSheets[tileSheet.name] = tileSheet;
                }
                
                var tile;
                // First check if this is a normal tile or an animated one
                var $animation = $tile.find("animation");
                if ($animation.length > 0) {
                    tile = addAnimationTile(tileSheet, tileId, imageWidth, tileWidth, tileHeight, $animation.find("frame"));
                } else {
                    tile = addTile(tileSheet, tileId, imageWidth, tileWidth, tileHeight);
                }

                $tile.find("properties > property").each(function () {
                    var propName = $(this).attr("name");
                    var value = $(this).attr("value");

                    if (propName === "walkable") {
                        tile.walkable = "false" !== value.toLowerCase();
                    }else if(propName === "drawable"){
                        tile.isDrawable = "false" !== value.toLowerCase();
                    }
                });
            });
            
        });
        // Layers
        var workingLowerLevels = true;
        tiledFile.children().each(function () {
            var type = this.localName;
            var name = $(this).attr("name");
            if (type === "layer") {
                var $layer = $(this);
                var layerWidth = parseInt($layer.attr("width"));
                var layerHeight = parseInt($layer.attr("height"));
                var layerProperties = {};

                // Load the properties
                $layer.find("properties > property").each(function () {
                    var layerPropertyName = $(this).attr("name").toLowerCase();
                    var value = $(this).attr("value");
                    
                    if(layerPropertyName === "scrollx" || layerPropertyName === "scrolly"){
                        value = parseInt(value);
                    }
                    
                    layerProperties[layerPropertyName] = value;
                });

                // Create the map layer object
                var mapLayer = new ArcTileMap(name, layerWidth, layerHeight, _this.tileWidth, _this.tileHeight, layerProperties["scrollx"], layerProperties["scrolly"]);
                mapLayer.setTileSheet(this.tileSheets, this.tileWidth, this.tileHeight);
                // Parse the data
                var data = mapLayer;
                var dataStrings = $layer.find("data").text().split(",");

                for (var i in dataStrings) {
                    var index = parseInt(dataStrings[i]) - 1;
                    if (index >= 0) {
                        // Build the tile in case it does not exist
                        var tileSheet = _this.getTileSheetForTile(index);
                        if (tileSheet !== null) {
                            addTile(tileSheet, index, tileSheet.imageWidth, tileSheet.tileWidth, tileSheet.tileHeight);
                        }

                        var tileX = (i % layerWidth) * _this.tileWidth;
                        var tileY = Math.floor(i / layerWidth) * _this.tileHeight;
                        var tileWidth = tileSheet.tileWidth * scale;
                        var tileHeight = tileSheet.tileHeight * scale;

                        if (tileHeight > _this.tileHeight) {
                            tileY = tileY - tileHeight + _this.tileHeight;
                        }

                        data.setTile(_this.tiles[index], tileX, tileY, tileWidth, tileHeight);
                    }
                }

                // Add the layer to the appropriate section
                _this.addChild(mapLayer, name);
            } else if (type === "objectgroup") {
                let tree = new QuadTree(0, 0, _this.width * _this.tileWidth, _this.height * _this.tileHeight);

                if (name === "triggers") {
                    _this.triggers  = tree;
                    tree.drawEnabled = false;
                    tree.tickEnabled = false;
                    // Handle map triggers
                    $(this).find("object").each(function () {
                        _this.addTrigger($(this), scale, tree);
                    });
                    _this.addChild(tree, name);
                } else if (name === "objects") {
                    _this.objects = tree;
                    _this.waypointIndex = _this.children.length;
                    _this.addChild(_this.waypoint, "waypoint");
                    // Handle map objects
                    workingLowerLevels = false;

                    $(this).find("object").each(function () {
                        var $object = $(this);
                        var objectName = $object.attr("name");
                        var objectType = $object.attr("type") ? $object.attr("type").toLowerCase() : "none";
                        var objectX = Number($object.attr("x")) * scale; // Double the size for now since we double the map size
                        var objectY = Number($object.attr("y")) * scale;
                        var objectWidth = Number($object.attr("width")) * scale;
                        var objectHeight = Number($object.attr("height")) * scale;
                        var objectTileId = parseInt($object.attr("gid")) - 1;
                        var objectRotation = 0.0;
                        var objectProperties = {};
                        var object = null;

                        if(Number.isNaN(objectWidth)){
                            objectWidth = 0;
                        }

                        if(Number.isNaN(objectHeight)){
                            objectHeight = 0;
                        }

                        // Load the properties
                        $object.find("properties > property").each(function () {
                            objectProperties[$(this).attr("name").toLowerCase()] = $(this).attr("value");
                        });

                        // Find the matching tile if needed
                        if (objectTileId) {
                            objectTileId = parseInt(objectTileId);
                            var tileSheet = _this.getTileSheetForTile(objectTileId);
                            if (tileSheet !== null) {
                                var tile = addTile(tileSheet, objectTileId, tileSheet.imageWidth, tileSheet.tileWidth * scale, tileSheet.tileHeight * scale).drawable();
                                objectWidth = Math.round(objectWidth == 0 ? tile.width * scale : objectWidth);
                                objectHeight = Math.round(objectHeight == 0 ? tile.height * scale : objectHeight);

                                objectY -= objectHeight;
                            }
                        }

                        if (objectType === "playerstart") {
                            object = new VillageObject(objectName, objectType, [objectX, objectY], [objectWidth, objectHeight], objectRotation, objectTileId, objectProperties);
                            tree.insert(object);
                        } else if (objectType === "studenthouse") {
                            //_this.housingSections.push(new HousingSection(objectName, objectX, objectY, objectWidth, objectHeight, _this.tileWidth, _this.tileHeight, modulePath + "/maps/", objectProperties['maps'], objectProperties));
                        } else if (objectType === "none") {

                        } /*else if (objectType === "npc"){
                             object = new NPC(objectName, "idle", objectType, [objectX, objectY], [objectWidth, objectHeight], objectRotation, objectTileId, objectProperties);
                             _this.objects.insert(object);
                        } */else {
                            object = new VillageObject(objectName, objectType, [objectX, objectY], [objectWidth, objectHeight], objectRotation, objectTileId, objectProperties);
                            tree.insert(object);
                        }
                    });

                    _this.addChild(tree, name);
                    _this.addChild(_this.players, "players");
                }
            }
        });

        var startLocation = [0, 0];
        if (startName) {
            var startObject = _this.getChild("objects").getByName(startName);
            if (startObject !== null) {
                startLocation[0] = startObject.centre[0];
                startLocation[1] = startObject.centre[1];
            }
        }

        // Return the function
        _this.loaded = true;
        if (onload && onload !== null) {
            onload(_this, startLocation);
        }
    });
};
VillageMap.prototype.getClosestTileCoord = function (pixelX, pixelY) {
    return [Math.round(pixelX / this.tileWidth), Math.round(pixelY / this.tileHeight)];
};
// Checks if a rectangular area is blocked.
VillageMap.prototype.isBlocked = function (x, y, width, height) {
    var checkVal = null;
    for(var i = this.waypointIndex - 1; i > -1; --i){
        checkVal = this.children[i].isBlocked(x, y, width, height);
        if(checkVal !== null){
            return checkVal;
        }
    }

    return false;
};
VillageMap.prototype.checkTriggers = function (x, y, width, height, activateWalk, activateClick, worldAdapter, player) {
    var trigger;
    var x2 = x + width;
    var y2 = y + height;

    var triggers = this.triggers.getObjects(x, y, width, height, []);

    for (var i in triggers) {
        trigger = triggers[i];
        if (trigger.checkTrigger(x, y, x2, y2)) {
            if (activateWalk) {
                trigger.walkTrigger(this, worldAdapter, player);
            }

            if (activateClick) {
                trigger.clickTrigger(this, worldAdapter, player);
            }
        }
    }
};
/*VillageMap.prototype.draw = function(displayContext, xOffset, yOffset, width, height){
    let buffer = QuadTree.ArrayBuffer;
    let index = 0;
    let i = 0;
    let drawObject = null;
    let players = this.getChild("players");
    
    // Handle the lower layers first
    let layer = this.lowLayers;
    
    for(index = 0; index < layer.length; ++index){
        layer[index].draw(displayContext, xOffset, yOffset, width, height);
    }
    
    
    
    // Draw the objects
    if(this.objects !== null){
        buffer.length = 0;
        this.objects.getObjects(xOffset, yOffset, width, height, buffer);
//        buffer.sort(function(o1, o2){
//            return o1.position[1] - o2.position[1];
//        });
        
        for(index = 0; index< buffer.length; ++index){
            drawObject = buffer[index];
            
            // TODO: mix players into the list.
            
            
            drawObject.draw(displayContext, xOffset, yOffset, width, height);
        }
        
    }
    
    // Draw the waypoint
    this.getChild("waypoint").draw(displayContext, xOffset, yOffset, width, height);
    
    players.draw(displayContext, xOffset, yOffset, width, height);
    
//    if(this.objects){
//        buffer.length = 0;
//        this.objects.getObjects(xOffset, yOffset, width, height, buffer);
//        
//        for (index = 0; index < buffer.length; ++index) {
//            drawObject = buffer[index];
//            displayContext.drawTileById(drawObject.tileId, drawObject.position[0] - xOffset, drawObject.position[1] - yOffset, drawObject.size[0], drawObject.size[1]);
//        }
//    }
    
    // Draw the characters
    
    
    // Handle the higher levels
    layer = this.highLayers;
    buffer.length = 0;
    
    for(index = 0; index < layer.length; ++index){
        layer[index].draw(displayContext, xOffset, yOffset, width, height);
    }
};*/

var VillageModule = ArcBaseObject();
VillageModule.prototype.init = function (path, initialMap, onLoaded, onMapChange) {
    this.path = path;
    this.maps = {};
    this.onMapChange = onMapChange;
    this.css = path + "/css/style.css";
    this.spriteSheets = {};

    // Load the spritesheets
    this.loadSpritesheets(path + "/sprites/");

    // Load the current map
    var map = new VillageMap(this, initialMap);
    this.maps[initialMap] = map;
    this.currentMap = map;

    // Load the dialog
    this.dialog = arcGetDialogAdapter(path + "/scenes/dialog.csv");

    map.load(onLoaded, "MainStart");
};
VillageModule.prototype.loadSpritesheets = function (path) {
    var _this = this;
    $.ajax({
        url: path + "sprites.json",
        method: "GET",
        async: false,
        success: function (result) {
            var data = result;

            if (typeof data === "string") {
                data = JSON.parse(result);
            }

            // Load the animations
            var animationSet = {};

            for (var i in data.animations) {
                var animations = {};

                for (var key in data.animations[i]) {
                    var dataAnimation = data.animations[i][key];
                    var animation = new ArcAnimation();

                    for (var index = 0; index < dataAnimation.length; ++index) {
                        var frame = dataAnimation[index];
                        animation.addFrame(frame.x, frame.y, frame.width, frame.height, frame.time, false, false);
                    }

                    animations[key] = animation;
                }

                animationSet[i] = animations;
            }

            // Create the sprites
            for (var i in data.sprites) {
                var dataSprite = data.sprites[i];
                var sprite = new ArcSpriteSheet(path + dataSprite.image, false);
                sprite.id = i;
                var animation = animationSet[dataSprite.animation];

                for (var key in animation) {
                    sprite.setAnimation(key, animation[key]);
                }

                _this.spriteSheets[i] = sprite;
            }
        }
    });
};
VillageModule.prototype.load = function (mapName, startName) {
    var _this = this;
    var map = this.maps[mapName];
    if (map && map !== null) {

    } else {
        map = new VillageMap(this, mapName);
        this.maps[mapName] = map;
    }

    if (startName && startName !== null && startName.length > 0) {

    } else {
        startName = "MainStart";
    }

    // Load the map
    map.load(function (loadedMap, startLocation) {
        var module = loadedMap.parent;

        function unloadMap(mapName) {
            //module.maps[mapName].unload(); //Some reason this is not working
        }
        unloadMap(module.currentMap.name);

        module.currentMap = loadedMap;

        if (module.onMapChange) {
            module.onMapChange(module.currentMap, startLocation);
        }
    }, startName);
};