// Housing Sections
var HousingSection = ArcBaseObject();
HousingSection.prototype.init = function (name, x, y, width, height, tileWidth, tileHeight, mapUrl, maps) {
    var _this = this;

    this.name = name;
    this.location = new Float32Array([Math.floor(x / tileWidth), Math.floor(y / tileHeight), Math.round(width / tileWidth), Math.round(height / tileHeight)]);
    this.housingCode = [];
    this.bins = new Uint8Array(this.location[2] * this.location[3]); // Start as 0 values. They will then contain the amount of used bins to their left and themselves.
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
    var width = this.location[2];
    var height = this.location[3];

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
        startX += _this.location[0];
        startY += _this.location[1];
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
{
    VillageObject.prototype = Object.create(ArcActor.prototype)
    Object.defineProperty(VillageObject, 'isVillageObject', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: true
    });
    new DialogScripts(VillageObject.prototype);
    VillageObject.prototype.init = function (name, type, position, size, rotation, parameters) {
        ArcActor.prototype.init.call(this, true, true, false);  
        this.name = name;
        this.properties = {};
        this.tileId = parameters.generated_tileId;
        this.centre = [position[0] + size[0] / 2, position[1] + size[1] / 2];
        this.rotation = rotation;
        this.type = type;
        this.parameters = parameters;

        this.clickEnabled = true;
        this.interactEnabled = true;

        this.updateSize(size[0], size[1]);
        this.updateLocation(position[0], position[1]);

        for(var key in parameters){
            var test = key.substring(0, 2);
            var state = 0;
            if(test === "on"){
                this[key] = Function("time", "player", "world", "worldAdapter", parameters[key]);
            }
        }

        if(this.onstart){
            this.onstart(0, null, null, null);
        }
    };
    VillageObject.prototype.draw = function(displayContext, xOffset, yOffset, width, height){
        if(this.parameters.visible){
            displayContext.drawTileById(this.tileId, this.location[0] - xOffset, this.location[1] - yOffset, this.size[0], this.size[1]);
        }

        if(window.debugMode){
            displayContext.drawLine(this.location[0], this.location[1], this.location[0], this.location[3], '#F00');
            displayContext.drawLine(this.location[0], this.location[1], this.location[2], this.location[1], '#F00');
            displayContext.drawLine(this.location[2], this.location[3], this.location[0], this.location[3], '#F00');
            displayContext.drawLine(this.location[2], this.location[3], this.location[2], this.location[1], '#F00');
        }
    };
    VillageObject.prototype.click = function(x, y, player, world){
        // Set as the active object
        player.activeObject = this;

        // Check if we have any click functions
        var f = this['onclick'];

        if(f){ f.call(this, null, player, world); }
    };
    VillageObject.prototype.interact = function(left, top, right, bottom, player, world, worldAdapter){
        var f = this['onwalk'];

        if(f){
            f.call(this, null, player, world, worldAdapter);
        }

        if(player.activeObject === this){
            f = this['oninteract'];

            if(f){
                f.call(this, null, player, world, worldAdapter);
            }

            player.activeObject = null;
        }
    };
    VillageObject.prototype.tick = function (timeSinceLast, worldAdapter, village, player) {

        // Check for functions
        var f = this["onidle"];

        if(f){ f.call(this, timeSinceLast, player, village, worldAdapter); }

        // Execute parent functions
        ArcActor.prototype.tick.apply(this, arguments);
    };
}

var PlayerStart = ArcBaseObject();
PlayerStart.prototype = Object.create(VillageObject.prototype)
Object.defineProperty(PlayerStart, 'isVillageObject', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: true
});

// Trigger Objects

var ScriptTrigger = ArcBaseObject();
ScriptTrigger.prototype = Object.create(ArcTrigger.prototype);
Object.defineProperty(ScriptTrigger, 'isVillageTrigger', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: true
});
ScriptTrigger.prototype.init = function(name, type, position, size, rotation, properties) {
    ArcTrigger.prototype.init.call(this, name, type, position, size, rotation);
    this.clickEnabled = false;
    this.interactEnabled = false;

    for(var key in properties){
        var test = key.substring(0, 2);
        var state = 0;
        if(test === "on"){
            this[key] = Function("time", "player", "world", "worldAdapter", "modulePath", properties[key]);
        }
    }

    if(this.onstart){
        this.onstart(0, null, null, null, properties["modulePath"]);
    }
};
ScriptTrigger.prototype.interact = function (left, top, right, bottom, player, world, worldAdapter) {
    if(this.oninteract){
        this.oninteract.call(this, 0, player, world, worldAdapter);
    }
};
ScriptTrigger.prototype.click = function (x, y, player, world){
    if(this.onclick){
        this.onclick.call(this, 0, player, world, null);
    }
};

var ChangeMapTrigger = ArcBaseObject();
ChangeMapTrigger.prototype = Object.create(ArcTrigger.prototype);
Object.defineProperty(ChangeMapTrigger, 'isVillageTrigger', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: true
});
ChangeMapTrigger.prototype.init = function (name, type, position, size, rotation, properties) {
    ArcTrigger.prototype.init.call(this, name, type, position, size, rotation);
    this.module = properties["module"];
    this.mapName = properties["map"];
    this.start = properties["start"];

    for(var key in properties){
        var test = key.substring(0, 2);
        var state = 0;
        if(test === "on"){
            this[key] = Function("time", "player", "world", "worldAdapter", "modulePath", properties[key]);
        }
    }

    if(this.onstart){
        this.onstart(0, null, null, null, properties["modulePath"]);
    }
};
ChangeMapTrigger.prototype.interact = function (left, top, right, bottom, player, world, worldAdapter) {
    this.module.load(this.mapName, this.start);
};

var ClickInteractTrigger = ArcBaseObject();
{
    ClickInteractTrigger.prototype = Object.create(ArcTrigger.prototype);
    Object.defineProperty(ClickInteractTrigger, 'isVillageTrigger', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: true
    });
    ClickInteractTrigger.prototype.init = function(name, type, position, size, rotation, properties) {
        ArcTrigger.prototype.init.call(this, name, type, position, size, rotation);
        this.activated = false;
        this.clickEnabled = true;

        for(var key in properties){
            var test = key.substring(0, 2);
            var state = 0;
            if(test === "on"){
                this[key] = Function("time", "player", "world", "worldAdapter", "modulePath", properties[key]);
            }
        }

        if(this.onstart){
            this.onstart(0, null, null, properties["module"], properties["modulePath"]);
        }
    };
    ClickInteractTrigger.prototype.click = function (x, y, player, world) {
        player.showWaypoint = false;
        player.waypointLoc[0] = this.centre[0];
        player.waypointLoc[1] = this.centre[1];

        player.activeObject = this;
    };
    ClickInteractTrigger.prototype.interact = function (left, top, right, bottom, player, world, worldAdapter) {
        if(player.activeObject != this){
            return;
        };

        var _this = this;
        if (!this.activated && player.waypointLoc[0] === this.centre[0] && player.waypointLoc[1] === this.centre[1]) {
            this.activated = true;

            this.doInteract(left, top, right, bottom, player, world, worldAdapter);
        }
    };
    ClickInteractTrigger.prototype.interactionComplete = function(player, world, worldAdapter){
        this.activated = false;
        player.activeObject = null;

        if(this.oninteractcomplete){
            this.oninteractcomplete(0, player, world, worldAdapter);
        }
    };
    ClickInteractTrigger.prototype.doInteract = function(left, top, right, bottom, player, world, worldAdapter){
        if(this.oninteract){
            this.oninteract(0, player, world, worldAdapter)
        }

        this.interactionComplete(player, world, worldAdapter);
    };
}

var ClickReadTrigger = ArcBaseObject();
{
    ClickReadTrigger.prototype = Object.create(ClickInteractTrigger.prototype);
    Object.defineProperty(ClickReadTrigger, 'isVillageTrigger', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: true
    });
    ClickReadTrigger.prototype.init = function (name, type, position, size, rotation, properties) {
        ClickInteractTrigger.prototype.init.call(this, name, type, position, size, rotation, properties);
        this.message = properties["message"];
        this.connectedObject = properties["object"];
    };
    ClickReadTrigger.prototype.doInteract = function (left, top, right, bottom, player, world, worldAdapter) {
        var _this = this;
        player.stop();

         worldAdapter.showMessage(this.message, false, player, this, function () {
            _this.interactionComplete(player, world, worldAdapter);
        });
    };
}

var ClickTaskTrigger = ArcBaseObject();
{
    ClickTaskTrigger.prototype = Object.create(ClickInteractTrigger.prototype);
    Object.defineProperty(ClickTaskTrigger, 'isVillageTrigger', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: true
    });
    ClickTaskTrigger.prototype.init = function(name, type, position, size, rotation, properties){
        ClickInteractTrigger.prototype.init.call(this, name, type, position, size, rotation, properties);
        this.task = properties["task"];
        this.title = properties["title"];
    }
    ClickTaskTrigger.prototype.doInteract = function (left, top, right, bottom, player, world, worldAdapter) {
        var _this = this;
        player.stop();

        worldAdapter.loadTask(this.task, worldAdapter.getTaskScript(this.task), function (model) {
            _this.interactionComplete(player, world, worldAdapter);
        });
    };
}

/**
* Updates the sound based on the distance.
* @implements {ArcTrigger}
*/
var ArcBackgroundMusicTrigger = ArcBaseObject();
ArcBackgroundMusicTrigger.prototype = Object.create(ArcTrigger.prototype);
Object.defineProperty(ArcBackgroundMusicTrigger, 'isVillageTrigger', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: true
});
ArcBackgroundMusicTrigger.prototype.init = function(name, type, position, size, rotation, properties){
    ArcTrigger.prototype.init.call(this, name, type, position, size, rotation);
    this.audio = properties["gameContext"].audio;
    this.sound = new ArcSound(name, true, properties["modulePath"] + "/" + properties["file"]);
    this.isPlaying = false;
    this.fade = 100;

    this.audio.loadSound(this.sound, false, function(error){
        console.log("Error loading sound: " + url);
    });
};
ArcBackgroundMusicTrigger.prototype.interact = function (left, top, right, bottom, player, world, worldAdapter) {
    if(this.inLocation(left, top, right, bottom)){
        worldAdapter.module.setBackgroundMusic(this.sound, this.fade);
    }
};

// Map Objects
var VillageMap = ArcBaseObject();
{
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
        
        this.players = {};
        this.waypoint = new ArcWaypoint(); // TODO: add before objects
        this.triggers = null;
        this.objects = null;
        this.neighbors = [null, null, null, null]; // Up, Right, Down, Left
    };
    VillageMap.prototype.addPlayer = function(player){
        this.players[player.id] = player;

        if(this.objects && this.objects.getChild(player.name) == null){
            this.objects.insert(player);
        }
    }
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
    VillageMap.prototype.getSpriteSheet = function(name){
        return this.parent.getSpriteSheet(name);
    };
    VillageMap.prototype.addTrigger = function ($trigger, scale, triggerTree, modulePath, gameContext) {
        var triggerName = $trigger.attr("name");
        var triggerType = $trigger.attr("type");
        var triggerX = Number($trigger.attr("x")) * scale; // Double the size for now since we double the map size
        var triggerY = Number($trigger.attr("y")) * scale;
        var triggerWidth = Number($trigger.attr("width")) * scale;
        var triggerHeight = Number($trigger.attr("height")) * scale;
        var triggerRotation = 0.0;
        var triggerProperties = {};
        var trigger = null;

        // Load the properties
        triggerProperties["modulePath"] = modulePath;
        $trigger.find("properties > property").each(function () {
            triggerProperties[$(this).attr("name").toLowerCase()] = $(this).attr("value") ? $(this).attr("value") : $(this).text();
        });
        triggerProperties["gameContext"] = gameContext;
        triggerProperties["module"] = this.parent;

        var triggerConstructor = window[triggerType];

        if(triggerConstructor && triggerConstructor.isVillageTrigger){
            trigger = new triggerConstructor(triggerName, triggerType, [triggerX, triggerY], [triggerWidth, triggerHeight], triggerRotation, triggerProperties);

            if(triggerProperties['follow']){
                trigger.followObject = triggerProperties['follow'];
            }

            triggerTree.insert(trigger);
        }

        /*if (triggerType === "changemap") {
            trigger = new ChangeMapTrigger(triggerName, triggerType, [triggerX, triggerY], [triggerWidth, triggerHeight], triggerRotation, this.parent, triggerProperties["map"], triggerProperties["start"]);
        } else if (triggerType === "clickread") {
            trigger = new ClickReadTrigger(triggerName, triggerType, [triggerX, triggerY], [triggerWidth, triggerHeight], triggerRotation, triggerProperties["message"], triggerProperties["object"]);
        } else if(triggerType === "clicktask"){
            trigger = new ClickTaskTrigger(triggerName, triggerType, [triggerX, triggerY], [triggerWidth, triggerHeight], triggerRotation, triggerProperties["title"], triggerProperties["task"]);
        } else if(triggerType === "backgroundmusic"){
            trigger = new ArcBackgroundMusicTrigger(triggerName, triggerType, [triggerX, triggerY], [triggerWidth, triggerHeight], triggerRotation, modulePath + "/" + triggerProperties["file"], gameContext.audio);
        } else if(triggerType === "script"){
            trigger = new ScriptTrigger(triggerName, triggerType, [triggerX, triggerY], [triggerWidth, triggerHeight], triggerRotation, triggerProperties, modulePath);
        }else {
            trigger = new ArcTrigger(triggerName, triggerType, [triggerX, triggerY], [triggerWidth, triggerHeight], triggerRotation);
        }*/
    };
    VillageMap.prototype.getObject = function(name, traverseNeighbors = false){
        var result = this.objects.getChild(name);

        return result;
    }
    VillageMap.prototype.load = function (onload, startName, gameContext) {
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
            var addTile = function (tileSheet, index, imageWidth, tileWidth, tileHeight, properties) {
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

                if(!($tileset.attr("name")) && $tileset.attr("source")){
                    // Load the source tileset file
                    $.ajax({
                        url: modulePath + "/maps/" + $tileset.attr("source"),
                        method: 'GET',
                        success: function(result){
                            $tileset = $($.parseXML(result)).children();
                        },
                        async: false
                    });
                }

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
                        var value = $(this).attr("value") ? $(this).attr("value") : $(this).text();

                        if (propName === "walkable") {
                            tile.walkable = "false" !== value.toLowerCase();
                        }else if(propName === "drawable"){
                            tile.isDrawable = "false" !== value.toLowerCase();
                        }else if(propName.substring(0,2) === "on"){
                            tile.properties[propName] = Function("caller", "time", "player", "world", "worldAdapter", value);
                        }else {
                            tile.properties[propName] = value;
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

                            var arcTile = data.setTile(_this.tiles[index], tileX, tileY, tileWidth, tileHeight);
                            arcTile.setTile = function(tileId){
                                if(tileId >= 0 && tileId < tiles.length){
                                    this.tile = tiles[tileId];
                                }
                            }
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
                            _this.addTrigger($(this), scale, tree, modulePath, gameContext);
                        });
                        _this.addChild(tree, name);
                    } else if (name === "objects") {
                        if(!(this.objects)){
                            _this.objects = tree;
                            _this.waypointIndex = _this.children.length;
                            _this.addChild(_this.waypoint, "waypoint");
                        }
                        
                        // Handle map objects
                        workingLowerLevels = false;

                        $(this).find("object").each(function () {
                            var $object = $(this);
                            var objectName = $object.attr("name");
                            var objectType = $object.attr("type") ? $object.attr("type") : "VillageObject";
                            var objectX = Number($object.attr("x")) * scale; // Double the size for now since we double the map size
                            var objectY = Number($object.attr("y")) * scale;
                            var objectWidth = Number($object.attr("width")) * scale;
                            var objectHeight = Number($object.attr("height")) * scale;
                            var objectTileId = parseInt($object.attr("gid")) - 1;
                            var objectRotation = 0.0;
                            var object = null;

                            if(Number.isNaN(objectWidth)){
                                objectWidth = 0;
                            }

                            if(Number.isNaN(objectHeight)){
                                objectHeight = 0;
                            }

                            // Load the properties
                            var objectProperties = {
                                generated_scale: scale,
                                generated_map: _this,
                                generated_tileId: objectTileId,
                                gameContext: gameContext,
                                modulePath: modulePath
                            };
                            $object.find("properties > property").each(function () {
                                objectProperties[$(this).attr("name").toLowerCase()] = $(this).attr("value") ? $(this).attr("value") : $(this).text();
                            });

                            objectProperties.visible = $object.attr("visible") ? $object.attr("visible") != "0" : true;

                            // Find the matching tile if needed
                            if (objectTileId) {
                                objectTileId = parseInt(objectTileId);
                                var tileSheet = _this.getTileSheetForTile(objectTileId);
                                if (tileSheet !== null) {
                                    var tile = addTile(tileSheet, objectTileId, tileSheet.imageWidth, tileSheet.tileWidth * scale, tileSheet.tileHeight * scale).drawable();
                                    objectWidth = Math.round(objectWidth == 0 ? tile.width * scale : objectWidth);
                                    objectHeight = Math.round(objectHeight == 0 ? tile.height * scale : objectHeight);

                                    objectY -= (objectHeight >> 1);
                                    objectX += (objectWidth >> 1);
                                }
                            }

                            var objectConstructor = window[objectType];

                            if(objectConstructor && objectConstructor.isVillageObject){
                                object = new objectConstructor(objectName, objectType, [objectX, objectY], [objectWidth, objectHeight], objectRotation, objectProperties, $object);
                                _this.objects.insert(object);
                            }

                            /*
                            if (objectType === "playerstart") {
                                object = new VillageObject(objectName, objectType, [objectX, objectY], [objectWidth, objectHeight], objectRotation, objectTileId, objectProperties);
                                tree.insert(object);
                            } else if (objectType === "studenthouse") {
                                //_this.housingSections.push(new HousingSection(objectName, objectX, objectY, objectWidth, objectHeight, _this.tileWidth, _this.tileHeight, modulePath + "/maps/", objectProperties['maps'], objectProperties));
                            } else if (objectType === "none") {

                            } else if (objectType === "npc"){
                                 object = new NPC(objectName, objectName, "idle", [objectX, objectY], objectProperties);
                                 object.spriteSheet = _this.getSpriteSheet(objectProperties["spritesheet"]);
                                 _this.objects.insert(object);
                            } else if (objectType === "path"){
                                 object = new Path(objectName, objectType, [objectX, objectY], [objectWidth, objectHeight], objectProperties, $object.find("polyline").attr("points"), scale);
                                 _this.objects.insert(object);
                            } else {
                                object = new VillageObject(objectName, objectType, [objectX, objectY], [objectWidth, objectHeight], objectRotation, objectTileId, objectProperties);
                                tree.insert(object);
                            }
                            */
                        });

                        _this.addChild(tree, name);
                        //_this.addChild(_this.players, "players");
                    }
                } else if(type === "properties") {
                    /*$(this).children().each(function(){
                        var name = $(this).attr("name");
                        var value = $(this).attr("value");

                        switch(name){
                            case "up":
                                _this.neighbors[0] = _this.parent.load(value, false, false);
                                break;

                            case "right":
                                _this.neighbors[1] = _this.parent.load(value, false, false);
                                break;

                            case "down":
                                _this.neighbors[2] = _this.parent.load(value, false, false);
                                break;

                            case "left":
                                _this.neighbors[3] = _this.parent.load(value, false, false);
                                break
                        }
                    })*/
                }
            });



            var startLocation = [0, 0];
            if (startName) {
                var startObject = _this.getChild("objects").getByName(startName);
                if (startObject !== null) {
                    startLocation[0] = startObject.location[4];
                    startLocation[1] = startObject.location[5];
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
    VillageMap.prototype.isBlocked = function (x1, y1, x2, y2, width, height) {
        let checkVal = null;
        let child = null;

        for(var i = this.waypointIndex - 1; i > -1; --i){
            child = this.children[i];
            
            if(child.isBlocked){
                checkVal = this.children[i].isBlocked(x1, y1, x2, y2, width, height);
                if(checkVal !== null){
                    return checkVal;
                }
            }
        }

        return false;
    };
    VillageMap.prototype.trigger = function(action, left, top, right, bottom){
        let child = null;

        for(var i = this.waypointIndex - 1; i > -1; --i){
            child = this.children[i];
            
            child.trigger(action, left, top, right, bottom);
        }
    };
}
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

/**
* The container for village and it's linked maps.
* @class
* @inherits {ArcBaseObject}
*/
var VillageModule = ArcBaseObject();
{
    var defaultOnLoad = function(map){

    };

    VillageModule.prototype.init = function (path, initialMap, gameContext, onLoaded, onMapChange) {
        this.path = path;
        this.maps = {};
        this.onMapChange = onMapChange;
        this.css = path + "/css/style.css";
        this.spriteSheets = {};
        this.gameContext = gameContext;
        this.backgroundMusic = null;

        // Load the spritesheets
        this.loadSpritesheets(path + "/sprites/");

        // Load the current map
        var map = new VillageMap(this, initialMap);
        this.maps[initialMap] = map;
        this.currentMap = map;

        // Load the dialog
        this.dialog = arcGetDialogAdapter(path + "/scenes/dialog.csv");

        map.load(onLoaded, "MainStart", gameContext);
    };
    VillageModule.prototype.setBackgroundMusic = function(sound, fade){
        if(this.backgroundMusic){
            if(sound === this.backgroundMusic){
                return;
            }

            // Stop the current background music
            this.gameContext.audio.stopSound(this.backgroundMusic, fade);
        }

        this.backgroundMusic = sound;
        this.gameContext.audio.playSound(this.backgroundMusic, fade);
    };
    VillageModule.prototype.stopBackgroundMusic = function(fade){
        if(this.backgroundMusic){
            this.gameContext.audio.stopSound(this.backgroundMusic, fade);
        }
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
    VillageModule.prototype.getSpriteSheet = function(name){
        return this.spriteSheets[name];
    }
    VillageModule.prototype.unload = function(mapName){
        var map = this.maps[mapName];

        if(map && map !== null){
            this.maps[mapName] = null;
            map.unload();
        }
    };
    VillageModule.prototype.load = function (mapName, startName = "MainStart", isCurrent = true, loadMap = false, afterLoad = defaultOnLoad) {
        var _this = this;
        var map = this.maps[mapName];
        if (map && map !== null) {
            afterLoad(map);
        } else {
            map = new VillageMap(this, mapName);
            this.maps[mapName] = map;
        }

        if (startName && startName !== null && startName.length > 0) {

        } else {
            startName = "MainStart";
        }

        // Load the map
        if(isCurrent){
            map.load(function (loadedMap, startLocation) {
                afterLoad(loadedMap);

                var module = loadedMap.parent;

                /*function unloadMap(mapName) {
                    //module.maps[mapName].unload(); //Some reason this is not working
                }
                unloadMap(module.currentMap.name);*/

                module.currentMap = loadedMap;

                if (module.onMapChange) {
                    module.onMapChange(module.currentMap, startLocation);
                }
            }, startName, _this.gameContext);
        }else if(loadMap){
            map.load(function (loadedMap, startLocation) {
                afterLoad(loadedMap);
            }, startName, _this.gameContext);
        }
    };
}

// Minimap code
var MiniMap = ArcBaseObject();
MiniMap.prototype = Object.create(ArcRenderableObject.prototype)
MiniMap.prototype.init = function(width, height, outWidth, outHeight, mask, image){
    this.tickEnabled = true;
    this.drawEnabled = true;
	this.canvas = document.createElement('canvas');
    this.mapCanvas = document.createElement('canvas');
    this.scale = 1;
    this.name = null;
    this.location = new Float32Array(6);
    this.size = new Uint16Array(4);
    this.offset = new Float32Array(2);
    this.map = null;
    this.mask = mask;
    this.image = image;
    this.opacity = 1.0;
    this.quadrant = 0;
    this.quadrantWidth = 0;
    this.quadrantHeight = 0;

    this.resize(width, height, outWidth, outHeight);
    this.updateSize(width, height);
};
MiniMap.prototype.resize = function(width, height, outWidth, outHeight){
    this.canvas.width = outWidth;
    this.canvas.height = outHeight;
	
	this.mapCanvas.width = width;
	this.mapCanvas.height = height

    this.context = this.canvas.getContext("2d");
	this.mapContext = this.mapCanvas.getContext("2d");
    this.mapContext.globalCompositeOperation = "destination-over";

    this.quadrantWidth = width >> 1;
    this.quadrantHeight = height >> 1;

    let context = this.context;
    context.mozImageSmoothingEnabled = false;
    context.webkitImageSmoothingEnabled = false;
    context.msImageSmoothingEnabled = false;
    context.imageSmoothingEnabled = false;
};
MiniMap.prototype.draw = function(displayContext, xOffset, yOffset, width, height){
    let canvas = this.canvas;
    canvas.complete = false;

    let map = this.map;
    let context = this.context;
    let scale = 1 / map.tileWidth;
    let w = this.mapCanvas.width * map.tileWidth;
    let h = this.mapCanvas.height * map.tileHeight;
    let hw = w >> 1;
    let hh = h >> 1;
    let location = this.location;
    let size = this.size;

    context.globalAlpha = this.opacity;

    this.beginDraw();
    switch(this.quadrant){
        case 0:
            this.mapContext.clearRect(0, 0, this.quadrantWidth, this.quadrantHeight);
            map.drawMinimap(this, this.offset[0], this.offset[1], hw, hh, 0, 0, scale);
            break;

        case 1:
            this.mapContext.clearRect(this.quadrantWidth, 0, this.quadrantWidth, this.quadrantHeight);
            map.drawMinimap(this, this.offset[0] + hw, this.offset[1], hw, hh, this.quadrantWidth, 0, scale);
            break;

        case 2:
            this.mapContext.clearRect(this.quadrantWidth, this.quadrantHeight, this.quadrantWidth, this.quadrantHeight);
            map.drawMinimap(this, this.offset[0] + hw, this.offset[1] + hh, hw, hh, this.quadrantWidth, this.quadrantHeight, scale);
            break;

        case 3:
            this.mapContext.clearRect(0, this.quadrantHeight, this.quadrantWidth, this.quadrantHeight);
            map.drawMinimap(this, this.offset[0], this.offset[1] + hh, hw, hh, 0, this.quadrantHeight, scale);
            break;
    }
	
    this.endDraw();
	
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Place Our Mask
    context.drawImage(this.mask, 0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = "source-atop";

    context.drawImage(this.mapCanvas, 0, 0, canvas.width, canvas.height);

    // Go back to the default drawing
    context.globalCompositeOperation = "source-over"

    // Draw the map image
    context.drawImage(this.image, 0, 0, canvas.width, canvas.height);
    
    canvas.complete = true;

    displayContext.updateImage(canvas);
    displayContext.drawImage(canvas, 0, 0, canvas.width, canvas.height, location[0], location[1], size[0], size[1]);
};
MiniMap.prototype.tick = function(timeSinceLast, worldAdapter, map){
    this.map = map;  

    if(worldAdapter.user){
        let canvas = this.mapCanvas;
        let user = map.players[worldAdapter.user.id]
        let location = user.location;
        let w = canvas.width * map.tileWidth;
        let h = canvas.height * map.tileHeight;

        this.offset[0] = location[4] - (w >> 1);
        this.offset[1] = location[5] - (h >> 1);

        if(map.waypoint.isVisible){
            this.opacity = Math.max(0.6, this.opacity - 0.05);
        }else{
            this.opacity = Math.min(1.0, this.opacity + 0.05);
        }
    }

    this.quadrant = (this.quadrant + 1) % 4;
};
MiniMap.prototype.beginDraw = function(){
    this.mapContext.beginPath();
};
MiniMap.prototype.fillRect = function(style, x, y, width, height){
    let context = this.mapContext;

    if(context.fillStyle != style){
        context.fill();
        context.closePath();

        context.fillStyle = style;

        context.beginPath();
    }

    context.rect(x, y, width, height);
};
MiniMap.prototype.fillTriangle = function(style, x1, y1, x2, y2, x3, y3){
    let context = this.mapContext;

    if(context.fillStyle != style){
        context.fill();
        context.closePath();

        context.fillStyle = style;

        context.beginPath();
    }

    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.lineTo(x3, y3);
    context.lineTo(x1, y1);
};
MiniMap.prototype.endDraw = function(){
    this.mapContext.fill();
    this.mapContext.closePath();
};

// Add minimap functions
{
    var quadMinimap = function(obj){
        if(obj.drawMinimap){
            obj.drawMinimap(quadMinimap.args[0], quadMinimap.args[1], quadMinimap.args[2], quadMinimap.args[3], quadMinimap.args[4], quadMinimap.args[5], quadMinimap.args[6], quadMinimap.args[7]);
        }
    };
    quadMinimap.args = null;

    var tileMinimap = function(obj){
        if(obj.drawMinimap){
            obj.drawMinimap(tileMinimap.args[0], tileMinimap.args[1], tileMinimap.args[2], tileMinimap.args[3], tileMinimap.args[4], tileMinimap.args[5], tileMinimap.args[6], tileMinimap.args[7]);
        }
    };
    tileMinimap.args = null;


    QuadTree.prototype.drawMinimap = function(minimap, x, y, width, height, drawX, drawY, scale){
        quadMinimap.args = arguments;
        this.getObjects(x, y, width, height, false, quadMinimap);
    };

    ArcTileMap.prototype.drawMinimap = function(minimap, x, y, width, height, drawX, drawY, scale){
        tileMinimap.args = arguments;
        this.data.getObjects(x, y, width, height, false, tileMinimap);
    }

    ArcTileQuadTree_Tile.prototype.drawMinimap = function(minimap, x, y, width, height, drawX, drawY, scale){
        if(this.tile.properties["minimap"] && this.inLocation(x, y, x + width, y + height)){
            let xs = Math.floor((this.location[0] - x) * scale) + drawX;
            let ys = Math.floor((this.location[1] - y) * scale) + drawY;

            minimap.fillRect(this.tile.properties["minimap"], xs, ys, this.size[0] * scale, this.size[1] * scale);
        }
    }

    VillageMap.prototype.drawMinimap = function(minimap, x, y, width, height, drawX, drawY, scale){
        let child, i;
        
        for(i = this.children.length - 1; i >= 0; --i){
            child = this.children[i];
            
            if(child.drawMinimap){
                child.drawMinimap(minimap, x, y, width, height, drawX, drawY, scale);
            }
        }

        return false;
    };

    NPC.prototype.drawMinimap = function(minimap, x, y, width, height, drawX, drawY, scale){
        if(this.inLocation(x, y, x + width, y + height)){
            let cb = this.collisionBox();

            let xs = Math.floor((cb[0] - x) * scale) + drawX;
            let ys = Math.floor((cb[1] - y) * scale) + drawY;

            let fov = this.fov;

            if(fov.enabled){
                let n, d;

                let hw = (cb[2] >> 1) * scale;
                let hh = (cb[3] >> 1) * scale;

                let xc = xs + hw;
                let yc = ys + hh;

                d = Math.tan(fov.angle) * (fov.distance * scale);

                if(this.direction == 0 /* down */){
                    n = yc + (fov.distance * scale);
                    minimap.fillTriangle('#F80', xc, yc, xc + d, n, xc - d, n);
                }else if(this.direction == 1 /* left */){
                    n = xc - (fov.distance * scale);
                    minimap.fillTriangle('#F80', xc, yc, n, yc + d, n, yc - d);
                }else if(this.direction == 2 /* up */){
                    n = yc - (fov.distance * scale);
                    minimap.fillTriangle('#F80', xc, yc, xc + d, n, xc - d, n);
                }else if(this.direction == 3 /* right */){
                    n = xc + (fov.distance * scale);
                    minimap.fillTriangle('#F80', xc, yc, n, yc + d, n, yc - d);
                }
            }

            minimap.fillRect(this.minimapColor, xs, ys, cb[2] * scale, this.size[3] * scale);
        }
    }

    User.prototype.drawMinimap = function(minimap, x, y, width, height, drawX, drawY, scale){
        let cb = this.lastCollisionBox;

        let xs = Math.round((cb[0] - x) * scale) + drawX;
        let ys = Math.round((cb[1] - y) * scale) + drawY;

        minimap.fillRect(this.minimapColor, xs, ys, cb[2] * scale, this.size[3] * scale);
    }
}
