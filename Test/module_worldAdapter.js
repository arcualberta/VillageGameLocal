// Start Google Analytics
if(VillageConfig.googleAnalytics){
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', VillageConfig.googleAnalytics, 'auto');
  ga('send', 'pageview');
}
// End Google Analytics

var testSpriteList = [
    "./Resources/Charactersets/dancer_male_palette.png",
    "./Resources/Charactersets/dancer_male_large2.png",
    "./Resources/Charactersets/dancer_male_large.png",
    "./Resources/Charactersets/base_male_large.png",
    "./Resources/Charactersets/base_female_large.png",
];
var idPrefix = "id_";
/*var spriteSheets = {};
for (var temp_i = 0; temp_i < testSpriteList.length; ++temp_i) {
    var animationTypes = ['down', 'up', 'left', 'right'];
    var y = 0;
    var sprite = new ArcSpriteSheet(testSpriteList[temp_i], false);
    sprite.id = idPrefix + temp_i;
    var animations = {};
    var y = 0;
    for (var i = 0; i < animationTypes.length; ++i) {
// Add Standing animation
        var animation = new ArcAnimation();
        animation.addFrame(0, y, 16, 24, 1000, false, false);
        sprite.setAnimation("stand_" + animationTypes[i], animation);
        // Add walking animation
        animation = new ArcAnimation();
        animation.addFrame(0, y, 16, 24, 250, false, false);
        animation.addFrame(16, y, 16, 24, 250, false, false);
        animation.addFrame(0, y, 16, 24, 250, false, false);
        animation.addFrame(32, y, 16, 24, 250, false, false);
        sprite.setAnimation("walk_" + animationTypes[i], animation);
        // Add running animation
        animation = new ArcAnimation();
        animation.addFrame(16, y, 16, 24, 250, false, false);
        animation.addFrame(32, y, 16, 24, 250, false, false);
        sprite.setAnimation("run_" + animationTypes[i], animation);
        y += 24;
    }

    spriteSheets[sprite.id] = sprite;
}*/

WorldAdapter.prototype.init = function (stateResponseFunction, messageFunction, gameContext) {
    var _this = this;
    var temp_actionList = [];
    this.playerStart = [0, 0];
    this.module = null;
    this.user = null;
    this.loaded = false;

    var modulePath = VillageConfig.baseUrl + arcGetParameter("module");
    this.config = new ArcConfig(modulePath + "/config.json");

    if(this.config.containsKey("code")){
        codeFiles = this.config.getEntry("code");

        for(var c = 0; c < codeFiles.length; ++c){
            arcImportJavascript(modulePath + "/" + codeFiles[c], false);
        }
    }

    function mapChangeFunction(map, playerStart) {
        this.playerStart = playerStart.splice();

        var result = {
            type: WORLD_SNAPSHOT,
            timestamp: Date.now(),
            playerStart: playerStart,
            world: map
        };

        if (stateResponseFunction) {
            stateResponseFunction(result);
        }
    }

    this.module = new VillageModule(modulePath, arcGetParameter("mapname"), gameContext, mapChangeFunction, mapChangeFunction);
    
    this.showMessage = function(message, lineNumber, player, speaker, onComplete){
        return messageFunction(_this.module.dialog, message, lineNumber, player, speaker, onComplete);
    };

    $(function () {
        // Add the css
        var head = document.getElementsByTagName('head')[0];
        var link = document.createElement('link');
        link.id = 'module_style';
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = _this.module.css;
        link.media = 'all';
        head.appendChild(link);
    });
    //this.module = new VillageModule("http://localhost:8080/VillageGame/VillageGame_Maps/Demo", "village_small");
    /*function temp_buildWorld() {
     var tileSheet = new ArcTileSheet("Village Tiles", "../Resources/Tilesets/tileset.png", [
     new ArcTile(0, 0, 16, 16, true, false, 'grass1'), // Grass 1
     new ArcTile(16, 0, 16, 16, true, false, 'grass2'), // Grass 2
     new ArcTile(32, 0, 16, 16, true, false, 'grass3'), // Grass 3
     new ArcTile(48, 0, 16, 16, true, false, 'grass4'), // Grass 4
     new ArcTile(64, 0, 16, 16, true, false, 'grass5'), // Grass 4
     new ArcTile(0, 80, 16, 16, false, false, 'roof1'), // Roof 1
     new ArcTile(16, 80, 16, 16, false, false, 'roof2'), // Roof 2
     new ArcTile(32, 80, 16, 16, false, false, 'roof3'), // Roof 3
     new ArcTile(0, 96, 16, 16, false, false, 'roof4'), // Roof 4
     new ArcTile(16, 96, 16, 16, false, false, 'roof5'), // Roof 5
     new ArcTile(32, 96, 16, 16, false, false, 'roof6'), // Roof 6
     new ArcTile(0, 112, 16, 16, false, false, 'roof7'), // Roof 7
     new ArcTile(16, 112, 16, 16, false, false, 'roof8'), // Roof 8
     new ArcTile(32, 112, 16, 16, false, false, 'roof9'), // Roof 9
     new ArcTile(0, 128, 16, 16, false, false, 'building1'),
     new ArcTile(16, 128, 16, 16, false, false, 'building2'),
     new ArcTile(32, 128, 16, 16, false, false, 'building3'),
     new ArcTile(0, 144, 16, 16, false, false, 'building4'),
     new ArcTile(16, 144, 16, 16, false, false, 'building5'),
     new ArcTile(32, 144, 16, 16, false, false, 'building6'),
     new ArcTile(48, 80, 16, 16, false, false, 'door1'),
     new ArcTile(48, 96, 16, 16, true, false, 'door2'),
     new ArcTile(48, 112, 16, 16, false, false, 'window1'),
     new ArcTile(48, 128, 16, 16, false, false, 'window2'),
     new ArcTile(16, 48, 16, 16, true, false, 'dirt_patch'),
     new ArcTile(0, 32, 16, 16, true, false, 'path1'),
     new ArcTile(16, 32, 16, 16, true, false, 'path2'),
     new ArcTile(32, 32, 16, 16, true, false, 'path3'),
     new ArcTile(0, 48, 16, 16, true, false, 'path4'),
     new ArcTile(32, 48, 16, 16, true, false, 'path5'),
     new ArcTile(0, 64, 16, 16, true, false, 'path6'),
     new ArcTile(16, 64, 16, 16, true, false, 'path7'),
     new ArcTile(32, 64, 16, 16, true, false, 'path8'),
     new ArcTile(48, 32, 16, 16, true, false, 'path9'),
     new ArcTile(64, 32, 16, 16, true, false, 'path10'),
     new ArcTile(48, 48, 16, 16, true, false, 'path11'),
     new ArcTile(64, 48, 16, 16, true, false, 'path12'),
     new ArcTile(0, 16, 16, 16, true, false, 'path13'),
     new ArcTile(16, 16, 16, 16, true, false, 'path14'),
     new ArcTile(160, 0, 16, 16, false, false, 'tree1'),
     new ArcTile(176, 0, 16, 16, false, false, 'tree2'),
     new ArcTile(192, 0, 16, 16, false, false, 'tree3'),
     new ArcTile(160, 16, 16, 16, false, false, 'tree4'),
     new ArcTile(176, 16, 16, 16, false, false, 'tree5'),
     new ArcTile(192, 16, 16, 16, false, false, 'tree6'),
     new ArcTile(160, 32, 16, 16, false, false, 'tree7'),
     new ArcTile(176, 32, 16, 16, false, false, 'tree8'),
     new ArcTile(192, 32, 16, 16, false, false, 'tree9'),
     new ArcTile(160, 48, 16, 16, false, false, 'tree10'),
     new ArcTile(176, 48, 16, 16, false, false, 'tree11'),
     new ArcTile(192, 48, 16, 16, false, false, 'tree12'),
     new ArcTile(64, 112, 16, 16, false, false, 'fence1'),
     new ArcTile(80, 112, 16, 16, false, false, 'fence2'),
     new ArcTile(64, 128, 16, 16, false, false, 'fence3'),
     new ArcTile(80, 128, 16, 16, false, false, 'fence4'),
     new ArcTile(64, 144, 16, 16, false, false, 'fence5'),
     new ArcTile(80, 144, 16, 16, false, false, 'fence6'),
     new ArcTile(96, 112, 16, 16, false, false, 'fence7'),
     new ArcTile(48, 144, 16, 16, false, false, 'sign'),
     new ArcTile(48, 160, 16, 16, false, false, 'sign_glow'),
     ]);
     
     var village = tsScript.randomWorld("Test Village", tileSheet, [], studentList, [mapWidth, mapHeight]);
     
     var world = {
     width: village.width,
     height: village.height,
     tileWidth: 32,
     tileHeight: 32,
     name: village.name,
     lowerMap: village.lowerMap,
     midMap: village.midMap,
     upperMap: village.upperMap,
     tileSheet: {
     name: tileSheet.name,
     imageUrl: tileSheet.imageUrl,
     tiles: tileSheet.tiles
     },
     students: studentList
     };
     
     return world;
     }*/
    // Build Random users
    var temp_i;
    var mapWidth = 100;
    var mapHeight = 100;
//    for (temp_i = 0; temp_i < 30; ++temp_i) {
//        var time = Date.now() + (2010 * temp_i);
//        var x = Math.round(Math.random() * mapWidth);
//        var y = Math.round(Math.random() * mapHeight);
//
//        var palette = {
//            // Skin
//            0x00ffffff: {r: 255, g: 255, b: 255},
//            0x00d2d2d2: {r: 210, g: 210, b: 210},
//            0x00808080: {r: 128, g: 128, b: 128},
//            // Hair
//            0x00ffc080: {r: 255, g: 192, b: 128},
//            0x00ff8000: {r: 255, g: 128, b: 128},
//            0x00804000: {r: 128, g: 64, b: 0},
//            // Clothing 1
//            0x00ff8080: {r: 255, g: 128, b: 128},
//            0x00ff0000: {r: 255, g: 0, b: 0},
//            0x00800000: {r: 128, g: 0, b: 0},
//            // Clothing 2
//            0x0080ff80: {r: 128, g: 255, b: 128},
//            0x0000ff00: {r: 0, g: 255, b: 0},
//            0x00008000: {r: 0, g: 128, b: 0},
//            // Clothing 1
//            0x008080ff: {r: 128, g: 128, b: 255},
//            0x000000ff: {r: 0, g: 0, b: 255},
//            0x00000080: {r: 0, g: 0, b: 128},
//            // Eyes
//            0x00ffff80: {r: 255, g: 255, b: 255},
//            0x00ffff00: {r: Math.floor(Math.random() * 256), g: Math.floor(Math.random() * 256), b: Math.floor(Math.random() * 256)},
//            0x00808000: {r: 0, g: 0, b: 128}
//        };
//
//        var student = new Student(temp_i, "Student " + temp_i, null);
//        var sprite = spriteSheets[idPrefix + Math.min(Math.round(Math.random() * testSpriteList.length), testSpriteList.length - 1)];
//        student.spriteSheet = {
//            id: sprite.id,
//            image: sprite.baseImage.src,
//            animations: sprite.getSimpleAnimations(),
//            palette: palette
//        };
//        student.spriteSheet.palette = palette;
//        student.location = [Math.round(Math.random() * 100) * 32, Math.round(Math.random() * 100) * 32];
//        studentList.push(student);
//
//        temp_actionList.push({
//            timestamp: time,
//            action: {
//                type: ACTION_ADD_USER,
//                user: {
//                    id: temp_i,
//                    name: "Student " + temp_i,
//                    location: [Math.round(Math.random() * 100) * 32, Math.round(Math.random() * 100) * 32],
//                    spriteSheet: spriteSheets[Math.round(Math.random() * 3)],
//                    animation: "walk_down"
//                }
//            }
//        });
//    }

    temp_actionList.sort(function (a, b) {
        return a.timestamp - b.timestamp;
    });
    // Needed functions
    this.login = function (passcode) {
        var user = Math.round(Math.random() * 1000) + 1000;
        var spriteSheet = _this.getSpriteSheetList()[Object.keys(_this.getSpriteSheetList())[0]];
        _this.user = {
            id: user,
            name: "Student " + user,
            location: [0, 0],
            spriteSheet: {
                id: spriteSheet.id,
                palette: spriteSheet.palette,
                animations: spriteSheet.animations
            },
            animation: "walk_down"
        };

        temp_actionList.push({
            timestamp: Date.now(),
            action: {
                type: ACTION_ADD_USER,
                user: _this.user
            }
        });
        return {
            userId: user,
            userName: "Test Player - " + passcode,
            isSuccessful: true,
            message: "Login Successful for" + passcode + "!"
        };
    };
    this.logout = function (userId) {

    };
    this.requestWorldState = function (userId) {
        var result = {
            type: WORLD_SNAPSHOT,
            timestamp: Date.now(),
            playerStart: this.playerStart,
            world: this.module.currentMap
        };
        /*if(timestamp == 0){
         result.type = WORLD_SNAPSHOT;
         result.world = temp_buildWorld();
         }else{
         result.actions = [];
         while(temp_actionList.length > 0 && temp_actionList[0].timestamp < result.timestamp){
         result.actions.push(temp_actionList.shift().action);
         }
         }*/

        stateResponseFunction(result);
    };
    this.lastWorldActions = {
        type: WORLD_ACTIONLIST,
        timestamp: Date.now(), // Timestamp will be used for the network to find out which actions do not need to be used
        actions: new ArcArrayBuffer()
    };
    this.getWorldActions = function (timestamp) {
        var result = this.lastWorldActions;
        result.timestamp = Date.now();
        result.actions.length = 0;

        while (temp_actionList.length > 0 && temp_actionList[0].timestamp < result.timestamp) {
            result.actions.push(temp_actionList.shift().action);
        }

        return result;
    };
    this.postWorldActions = function (actionList) {
        //console.log(JSON.stringify(actionList));
    };
    this.getSpriteSheet = function (id) {
        return this.getSpriteSheetList()[id];
    };
};
WorldAdapter.prototype.getSpriteSheetList = function () {
    return this.module.spriteSheets;
};
WorldAdapter.prototype.getTaskScript = function(taskScript) {
    return this.module.path + "/tasks/" + taskScript + ".js";
};
WorldAdapter.prototype.getConfigSetting = function(name){
    this.config.getEntry(name);
};
WorldAdapter.prototype.isLoaded = function(){
    var loaded = true;

    loaded = loaded && this.module.dialog.loaded;

    return loaded; 
}