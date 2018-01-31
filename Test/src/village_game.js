
/**
* @class
* @inherits {ArcSettings}
*/
var VillageSettings = ArcBaseObject();
VillageSettings.prototype = Object.create(ArcSettings.prototype);
VillageSettings.prototype.init = function(name){
    ArcSettings.prototype.init.call(this, name);
    this.audio = {
        volume: 0.5
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
            select: [13, -1], //Enter
            mute: [77, -1] // M
        }
    };
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

    game.setVolume(this.audio.volume);
    game.setFrameCap(this.video.fps);
}

/**
* @class
* @inherits {ArcCamera}
*/
var VillagePlayerCamera = ArcBaseObject();
{

    VillagePlayerCamera.prototype = Object.create(ArcCamera.prototype);
    VillagePlayerCamera.prototype.init = function(width, height){
        ArcCamera.prototype.init.call(this);

        this.player = null;
        this.controlDim = new Uint16Array(4);
        this.dimension = new Uint16Array(4);
        this.maxOffset = new Uint16Array(2);
        this.speed = 0.08;
        // TODO: move this all into a single data array buffer.
        // TODO: Find a way to smooth camera final movement.

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

                x1 += Math.floor(movement * this.speed);
            }

            if(location[1] < y1){
                y1 = location[1];
            }else if(location[3] > y2){
                y1 = location[3] - control[1];
            }else{
                movement = (location[5] - control[3]) - y1;

                y1 += Math.floor(movement * this.speed);
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

        this.controlDim[0] = Math.floor(width * 0.8);
        this.controlDim[1] = Math.floor(height * 0.8);
        this.controlDim[2] = this.controlDim[0] >> 1;
        this.controlDim[3] = this.controlDim[1] >> 1;
    }

    VillagePlayerCamera.prototype.centerOffset = function(x, y){
        var dimension = this.dimension;
        x -= dimension[2];
        y -= dimension[3];

        if(x < 0){
            x = 0;
        }else if(x > (this.maxOffset[0] - dimension[0])){
            x = this.maxOffset[0] - dimension[0];
        }

        if(y < 0){
            y = 0;
        }else if(y > (this.maxOffset[1] - dimension[1])){
            y = this.maxOffset[1] - dimension[1];
        }

        this.setOffset(x, y);
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
    var isSettingsOpen = false;
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

    // Add the main Loop functionality
    var handleControls = function () {
        var actionList = __this.control.pullActionList();
        var menu = __this.getMenu();

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
        var menu = __this.getMenu();

        if (menu) {
            menu.animate(time);
        }

        if(!__this.isPaused()){
            __this.villageDisplay.tick(time, __this.display.camera.offset);
        }
        
        __this.hud.tick(time, worldAdapter, worldAdapter.module.currentMap);
        //drawScene();
    });

    this.drawListeners.push(function(game){
        __this.villageDisplay.triggerDraw();
    });

    // TODO: Create location specific sound updates
    /*var updateSounds = function (location) {
        for (var sound in sounds) {
            __this.audio.updateSound(sounds[sound], location);
        }
    };*/

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
        //updateSounds(playerLoc);

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
        var menu = new TaskMenu(title, canvas.width - 100, canvas.height - 50);

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

        __this.setMenu(menu, false);

        return __this.currentTask;
    };

    // Useful functions    
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
        __this.setMenu(false, false);

        //__this.fullscreen();
    };

    // Add icons used by the user
    var createIcons = function (panel) {

        // Create the settings icon
        var optionsIcon = new Image();
        optionsIcon.src = resourcesPath + '/Icons/options.gif';
        $(optionsIcon).click(function(){
            if(!(isSettingsOpen)){
                isSettingsOpen = true;
                var menu = SettingsWindow(game);

                recordEvent("Settings", "Open");

                menu.closeComplete = function(){
                    recordEvent("Settings", "Close");
                    prevMenu = false;
                    isSettingsOpen = false;
                    __this.setMenu(false, false);
                };
                menu.show(canvas);
                __this.setMenu(menu, true);
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

    var addSlideAction = function(camera){
        var slideLastAction = false;

        var addSlideActionSub = function (c) {
            if (__this.userId != null) {
                return;
            }

            var width = (__this.worldMetaData.width * __this.worldMetaData.tileWidth) - __this.display.size[0];
            var height = __this.worldMetaData.height * __this.worldMetaData.tileHeight * 0.70;

            var w1 = slideLastAction ? 0 : width;
            var w2 = width * 0.5;
            var h = Math.random() * height;
            slideLastAction = !slideLastAction;

            c.addAction(new ArcCameraPanAction(10000, addSlideActionSub, w1, h, w2, h));
        };

        addSlideActionSub(camera);
    }

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
            var menu = new DialogMenu(dialog, name, lineNumber ? lineNumber : 1, player, speaker);

            recordEvent("Dialog", "Open", name);

            menu.closeComplete = function(){
                recordEvent("Dialog", "Close", name);

                __this.setMenu(false, false);
                if(onClose){
                    onClose();
                }
            };
            menu.show(canvas);

            __this.setMenu(menu, false);

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
        var menu = new LoginMenu(worldAdapter.login, resourcesPath);

        menu.closeComplete = function () {
            userId = this.userId;
            userName = this.userName;
            worldAdapter.requestWorldState(userId);

            var characterMenu = new CharacterSelectMenu(worldAdapter.getSpriteSheetList());
            characterMenu.characterSelected = setPlayer;
            characterMenu.show(canvas);

            __this.setMenu(characterMenu, false);
        };

        worldAdapter.requestWorldState(null);
        addSlideAction(this.display.camera);

        worldAdapter.onAfterLoaded(function(adapter){ // Wait for the game to be completly loaded.
            ArcGame.prototype.start.call(__this);

            menu.show(canvas);
        });

        __this.setMenu(menu, false);
    };

    // Sounds Functions
    {

    }

    // Pause Functions
    {
        var gamePaused = false;

        this.pauseGame = function(){
            gamePaused = true;
            this.villageDisplay.onPause();
        }

        this.resumeGame = function(){
            gamePaused = false;
            this.villageDisplay.onResume();
        }

        this.isPaused = function(){
            return gamePaused;
        }
    }

    // Menu Functions
    {
        var menu = false;
        var prevMenu = false;

        this.setMenu = function(menuItem, holdPrevious){
            if(menuItem){
                if(holdPrevious){
                    prevMenu = menu;
                }else{
                    prevMenu = false;
                }

                menu = menuItem;

                if(menu.pauseGame){
                    this.pauseGame();
                }else if(__this.isPaused()){
                    this.resumeGame();
                }
            }else{
                if(prevMenu){
                    var newMenu = prevMenu;
                    prevMenu = false;
                    this.setMenu(newMenu, false);
                }else{
                    menu = false;
                    __this.resumeGame();
                }
            }
        }

        this.getMenu = function(){
            return menu;
        }
    }

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

// Sounds functions
VillageGame.prototype.setVolume = function (value) {
    this.audio.setVolume(value);
};
VillageGame.prototype.toggleMute = function() {
    if(this.audio.getVolume() > 0.0){
        this.setVolume(0.0);
    }else{
        this.setVolume(ArcSettings.Current.audio.volume);
    }
};