
/**
* @class
* @inherits {ArcSettings}
*/
var VillageSettings = ArcBaseObject();
VillageSettings.prototype = Object.create(ArcSettings.prototype);
VillageSettings.prototype.init = function(name){
    ArcSettings.prototype.init.call(this, name);
    this.audio = {
        volume: 1.0
    };
    this.video = {
        resolution: [800, 600],
        fps: 30
    };
    this.gameplay = {
        controls: {
            up: [38, 87], //Up and W
            down: [40, 83], //Down and S
            left: [37, 65], //Left and A
            right: [39, 68], //Right and D
            select: [13], //Enter
        }
    }
};
/**
* @override
* @param {VillageGame} The game to save the settings into.
*/
VillageSettings.prototype.save = function(game){
    this.audio.volume = game.audio.getVolume();

    ArcSettings.prototype.save.call(this);
}
/**
* @override
* @param {VillageGame} The game to load the settings into.
*/
VillageSettings.prototype.load = function(game){
    ArcSettings.prototype.load.call(this, game);

    game.audio.setVolume(this.audio.volume);
    game.setFrameCap(this.video.fps);
}

/**
* @class
* @inherits {ArcCamera}
*/
var VillagePlayerCamera = ArcBaseObject();
{
    VillagePlayerCamera.prototype = Object.create(ArcCamera.prototype);
    VillagePlayerCamera.prototype.init = function(width, height, controlWidth, controlHeight){
        ArcCamera.prototype.init.call(this);

        this.player = null;
        this.controlDim = new Uint16Array([controlWidth, controlHeight, controlWidth >> 1, controlHeight >> 1]);
        this.dimension = new Uint16Array(4);
        this.maxOffset = new Uint16Array(2);
        this.speed = 0.08;
        // TODO: move this all into a single data array buffer.

        this.setDimension(width, height);
    };

    VillagePlayerCamera.prototype.update = function(timeSinceLast) {

        if(this.player != null){
            var location = this.player.location;
            var dimension = this.dimension;
            var control = this.controlDim;

            var movement;
            var x1 = this.offset[0] + dimension[2] - control[2];//location[4] - dimension[2];
            var y1 = this.offset[1] + dimension[3] - control[3];//location[5] - dimension[3];
            var x2 = x1 + control[0];
            var y2 = y1 + control[1];



            // Check if the player is in the needed area
            if(location[0] < x1){
                x1 = location[0];
            }else if(location[2] > x2){
                x1 = location[2] - control[0];
            }else{
                movement = (location[4] - control[2]) - x1;

                x1 += (movement * this.speed);
            }

            if(location[1] < y1){
                y1 = location[1];
            }else if(location[3] > y2){
                y1 = location[3] - control[1];
            }else{
                movement = (location[5] - control[3]) - y1;

                y1 += (movement * this.speed);
            }

            x1 += (control[2] - dimension[2]);
            y1 += (control[3] - dimension[3]);

            // Check if we reached the map limits
            if(x1 < 0){
                x1 = 0;
            }else if(x1 > (x2 = this.maxOffset[0] - dimension[0])){
                x1 = x2;
            }

            if(y1 < 0){
                y1 = 0;
            }else if(y1 > (y2 = this.maxOffset[1] - dimension[1])){
                y1 = y2;
            }

            this.setOffset(x1, y1);
        }

        ArcCamera.prototype.update.call(this, timeSinceLast);
    }

    VillagePlayerCamera.prototype.setDimension = function(width, height){
        this.dimension[0] = width;
        this.dimension[1] = height;
        this.dimension[2] = width >> 1;
        this.dimension[3] = height >> 1;
    }
}

/**
* @class
* @inherits {ArcGame}
*/
var VillageGame = ArcBaseObject();
VillageGame.prototype = Object.create(ArcGame.prototype);
VillageGame.prototype.init = function (canvas, javascriptPath, resourcesPath) {
    ArcGame.prototype.init.call(this, canvas, arcGetDisplayAdapter(canvas, true, new VillagePlayerCamera(2, 2, 250, 250)), null, null, 30, true);
    var __this = this;

    __this.timestamp = -1;

    var worldAdapter = null;
    var menu = false;
    var userId = null;
    var userName = null;
    var isLoaded = false;

    var settings = new VillageSettings("arc.ualberta.villagegame");
    settings.load(this)
    ArcSettings.Current = settings;

    this.villageDisplay = null;

    this.hud = new ArcRenderableObject(true, true);

    Character.VisionCone.src = resourcesPath + "/Icons/VisionCone.png";

    var createHud = function(worldAdapter){
        let mask = new Image();
        mask.src = worldAdapter.module.path + "/images/map_mask.png";

        let container = new Image();
        container.src = worldAdapter.module.path + "/images/map_container.png";

        let minimap = new MiniMap(40, 40, 256, 256, mask, container);
        minimap.updateSize(Math.floor(canvas.width / 4), Math.floor(canvas.width / 4));
        minimap.updateLocation(canvas.width - minimap.size[2] - 5, minimap.size[3] + 5);

        __this.hud.addChild(minimap, "Mini Map");
    }

    //TODO: Temp code for sounds. Fix for full version
    var sounds = [
        //new ArcSound("birds1", 3000, true, [0, 0], resourcesPath + '/Sounds/36090__genghis-attenborough__thrush-nightingale.wav'),
        //new ArcSound("birds1", 3000, true, [3200, 3200], resourcesPath + '/Sounds/36090__genghis-attenborough__thrush-nightingale.wav'),
        //new ArcSound("cans1", 1000, true, [1600, 300], resourcesPath + '/Sounds/139008__felix-blume__cans-in-the-wind-in-a-garden-in-ukraine-to-move-away-the-mole.wav'),
    ];

    for (var sound in sounds) {
        this.audio.updateSound(sounds[sound], [-10000, -10000]);
        this.audio.loadSound(sounds[sound], true, function (error) {
            alert("Could not load sound due to: " + error);
        });
    }

    // Add the main Loop functionality
    var handleControls = function () {
        var actionList = __this.control.pullActionList();

        // Check if we have a menu
        if (menu) {
            menu.handleActions(actionList);
        } else {
            // Handle Movement Controls
            __this.villageDisplay.handleActions(actionList);
        }
    };
    
    this.beginLoopListeners.push(function(game, time) {
        handleControls();
        var worldActions = worldAdapter.getWorldActions(__this.timestamp);
        __this.villageDisplay.updateWorld(time, worldActions);
    });

    this.updateListeners.push(function (game, time) {
        if (menu) {
            menu.animate(time);
        }

        
        __this.villageDisplay.tick(time, __this.display.camera.offset);
        __this.hud.tick(time, worldAdapter, worldAdapter.module.currentMap);
        //drawScene();
    });

    this.drawListeners.push(function(game){
        __this.villageDisplay.triggerDraw();
    });

    var updateSounds = function (location) {
        for (var sound in sounds) {
            __this.audio.updateSound(sounds[sound], location);
        }
    };

//    var drawScene = function () {
//        var displayAdapter = __this.display;
//
//        /**
//         * Note: This code has been added to create a frame cap at 60fps on most browsers. 
//         * It allows for minimal resources to be used when performing animations.
//         */
//        if (drawSceneData.isNew) {
//            var layerIndex = 0;
//            var layers = drawSceneData.lowLayers;
//            
//            drawSceneData.isNew = false;
//            updateSounds(drawSceneData.playerLoc);
//
//            displayAdapter.clear();
//
//            for(layerIndex = 0; layerIndex < layers.length; ++layerIndex){
//                displayAdapter.drawTileLayer(layers[layerIndex]);
//            }
//            
//            displayAdapter.drawUsers(drawSceneData.users);
//            
//            var layers = drawSceneData.highLayers;
//            for(layerIndex = 0; layerIndex < layers.length; ++layerIndex){
//                displayAdapter.drawTileLayer(layers[layerIndex]);
//            }
//            
//            if (drawSceneData.waypointLoc !== null) {
//                displayAdapter.drawWaypoint(drawSceneData.waypointLoc);
//            }
//
//            displayAdapter.drawToDisplay(__this.getFramesPerSecond());
//        }
//    };

    var setDrawScene = function (playerLoc, offsetX, offsetY, renderable) {
        var displayAdapter = __this.display;
        //displayAdapter.camera.setOffset(offsetX, offsetY);

        var index = 0;
        var drawObject = null;
        updateSounds(playerLoc);

        displayAdapter.clear();

        if(renderable != null){
            let size = displayAdapter.camera.dimension;
            renderable.draw(displayAdapter, offsetX, offsetY, size[0], size[1]);

            if(playerLoc[4]){
                __this.hud.draw(displayAdapter, offsetX, offsetY, size[0], size[1]);
            }
        }

        displayAdapter.drawToDisplay('UNKNOWN');

        /*__this.display.camera.setOffset(offsetX, offsetY);
         
         drawSceneData.lowLayers = lowLayers;
         drawSceneData.highLayers = highLayers;
         drawSceneData.playerLoc = playerLoc;
         drawSceneData.waypointLoc = waypointLoc;
         drawSceneData.users = users;
         
         drawSceneData.isNew = true;
         
         drawScene();*/
    };

    // Create the task functions
    this.currentTask = null;
    this.loadTask = function (title, url, onclose) {
        menu = new TaskMenu(title, canvas.width - 100, canvas.height - 50);

        __this.currentTask = new TaskScript(menu.canvas, title, url, worldAdapter.module.path, __this.taskWorker);
        menu.task = __this.currentTask;

        recordEvent("Task", "Open", title);

        menu.task.setTitle = function(title){
            menu.setTitle(title);
        }

        menu.task.close = function(){
            recordEvent("Task", "Close", title);

            menu.close();
            menu = false;
        }

        menu.closeComplete = function(){
            if(onclose){
                onclose(menu);
            }

            menu = null;
        }

        menu.show(canvas);

        return __this.currentTask;
    };

    // Useful functions    
    this.setVolume = function (value) {
        this.audio.setVolume(value);
    };

    var setPlayer = function (spriteSheet) {
        __this.display.camera.clearActions();

        var location = [400, 300];
        var mainStart = __this.villageDisplay.world.objects.getByName("MainStart");
        if (mainStart) {
            location[0] = mainStart.centre[0];
            location[1] = mainStart.centre[1];
        }
        //var spriteSheet = sheet.copy();//menu.sprites[menu.selected];

        // Add the player to the server
        var actions = [];
        actions.push({
            timestamp: Date.now(),
            action: {
                type: ACTION_ADD_USER,
                user: {
                    id: userId,
                    name: userName,
                    location: location,
                    spriteSheet: spriteSheet.getSimple(),
                    animation: "walk_down"
                }
            }
        });

        worldAdapter.postWorldActions(actions);

        // Add the player to the game
        __this.villageDisplay.setPlayer(userId, userName, location, spriteSheet.id, spriteSheet.palette, spriteSheet.getSimpleAnimations());
        menu = false;

        //__this.fullscreen();
    };

    // Add icons used by the user
    var createIcons = function (panel) {

        // Create the sound icon
        var optionsIcon = new Image();
        optionsIcon.src = resourcesPath + '/Icons/options.gif';
        $(optionsIcon).click(function(){
            if(!(menu)){
                menu = SettingsWindow(game);

                recordEvent("Settings", "Open");

                menu.closeComplete = function(){
                    recordEvent("Settings", "Close");
                    menu = null;
                };
                menu.show(canvas);
            }
        });
        panel.append(optionsIcon);

        /*var soundIcon = new Image();
        soundIcon.volume = 1.0;
        soundIcon.src = resourcesPath + '/Icons/Status-audio-volume-high-icon.png';
        $(soundIcon).click(function () {
            if (soundIcon.volume > 0.5) {
                soundIcon.volume = 0.0;
                soundIcon.src = resourcesPath + '/Icons/Status-audio-volume-muted-icon.png';
            } else {
                soundIcon.volume = 1.0;
                soundIcon.src = resourcesPath + '/Icons/Status-audio-volume-high-icon.png';
            }

            __this.setVolume(soundIcon.volume);
        });
        panel.append(soundIcon);*/
    };

    this.worldMetaData = {
        width: 1,
        height: 1,
        tileWidth: 32,
        tileHeight: 32,
    };

    var addSlideAction = function (camera) {
        if (__this.userId != null) {
            return;
        }

        var width = __this.worldMetaData.width * __this.worldMetaData.tileWidth * 0.5;
        var height = __this.worldMetaData.height * __this.worldMetaData.tileHeight * 0.70;

        var check = Math.random();
        var w1 = Math.random() * width;
        var w2 = 800;
        var h = Math.random() * height;

        if (check > 0.5) {
            w2 += w1;
        } else {
            w1 += width;
            w2 = w1 - w2;
        }

        camera.addAction(new ArcCameraPanAction(10000, addSlideAction, w1, h, w2, h));
    };

    this.start = function () {
        // Create Icons
        var panel = $("<div class='game_iconPanel'></div>");
        $(canvas).after(panel);
        createIcons(panel);

        // Setup the world adapter
        worldAdapter = new WorldAdapter(function (result) {
            var world = result.world;
            __this.worldMetaData.width = world.width;
            __this.worldMetaData.height = world.height;
            __this.worldMetaData.tileWidth = world.tileWidth;
            __this.worldMetaData.tileHeight = world.tileHeight;

            __this.timestamp = result.timestamp;

            __this.display.tiles = result.world.tiles;

            // __this.villageWorker.postMessage([WORKER_SET_WORLD, result], [result.world]);
            __this.villageDisplay.readWorldState(result);
        }, function (dialog, name, lineNumber, player, speaker, onClose) {
            menu = new DialogMenu(dialog, name, lineNumber ? lineNumber : 1, player, speaker);

            recordEvent("Dialog", "Open", name);

            menu.closeComplete = function(){
                recordEvent("Dialog", "Close", name);

                menu = null;
                if(onClose){
                    onClose();
                }
            };
            menu.show(canvas);

            return menu;
        }, __this);
        worldAdapter.loadTask = __this.loadTask;
        createHud(worldAdapter);

        __this.villageDisplay = new VillageDisplay(__this, worldAdapter, javascriptPath + "/village_worker.js", setDrawScene, __this.display.camera);
        __this.villageDisplay.resize(canvas.width, canvas.height);

        // Load any needed config properties.
        if(worldAdapter.config.containsKey("title.music")){
            var bgMusic = new ArcSound("titleMusic", true, worldAdapter.module.path + worldAdapter.config.getEntry("title.music"));
            worldAdapter.module.setBackgroundMusic(bgMusic, 0);
        }

        // Show the login window
        menu = new LoginMenu(worldAdapter.login, resourcesPath);

        menu.closeComplete = function () {
            userId = menu.userId;
            userName = menu.userName;
            worldAdapter.requestWorldState(userId);

            menu = new CharacterSelectMenu(worldAdapter.getSpriteSheetList());
            menu.characterSelected = setPlayer;
            menu.show(canvas);
        };

        worldAdapter.requestWorldState(null);
        addSlideAction(this.display.camera);

        worldAdapter.onAfterLoaded(function(adapter){ // Wait for the game to be completly loaded.
            ArcGame.prototype.start.call(__this);

            menu.show(canvas);
        });
    };

    $(window).resize(function (event) {
        __this.villageDisplay.resize(canvas.width, canvas.height);
    });
};
VillageGame.prototype.resize = function(width, height) {
    ArcGame.prototype.resize.call(this, width, height);

    if(this.hud){
        let canvas = this.canvas;
        let minimap = this.hud.getChild("Mini Map");
        minimap.updateSize(Math.floor(canvas.width / 4), Math.floor(canvas.width / 4));
        minimap.updateLocation(canvas.width - minimap.size[2] - 5, minimap.size[3] + 5);
    }
}
VillageGame.prototype.fullscreen = function () {
    this.display.requestFullscreen();
    //this.villageWorker.postMessage([WORKER_RESIZE, canvas.width, canvas.height]);
};