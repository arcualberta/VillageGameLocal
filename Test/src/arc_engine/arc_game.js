// Gload functions
window.arcRequestAnimFrame = (function () {
    return  window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            function (callback) {
                window.setTimeout(callback, 1000 / 60); // 30 fps otherwise
            };
})();

function arcGetParameter(paramName) {
    var pageUrl = window.location.search.substring(1);
    var pageVar = pageUrl.split('&');
    for (var i = 0; i < pageVar.length; ++i) {
        var param = pageVar[i].split('=');
        if (param[0].toLowerCase() === paramName.toLowerCase()) {
            return param[1];
        }
    }

    return false;
}

function arcImportJavascript(url, async = true){
    $.ajax({
        url: url,
        method: "GET",
        success: function(result){
            //eval(result);
        },
        error: function(e){
            console.error("Could not load javascript.");
        },
        async: async
    });
}

/**
* The object containing settings information for game.
* @class
* @inherits {ArcBaseObject}
*/
var ArcSettings = ArcBaseObject();
{
    ArcSettings.Current = null;
    ArcSettings.prototype.init = function(name){
        this.name = name;

        this.general = {
            memory: LEVEL_MED,
        };
    };
    /**
    * Saves the settings into local storage.
    */
    ArcSettings.prototype.save = function(){
        localStorage.setItem(this.name, JSON.stringify(this));
    };
    /**
    * Loads settings from local storage.
    */
    ArcSettings.prototype.load = function(game){
        let data = null;
        data = JSON.parse(localStorage.getItem(this.name));

        mergeObject(this, data);

        game.setMemoryLevel(this.general.memory);
    }

    function mergeObject(mainObject, inputObject){
        if(inputObject){
            var checkValue;

            if(mainObject){
                for(var key in mainObject){
                    checkValue = typeof(mainObject[key]);
                    if(checkValue != "function"){
                        if(checkValue == "object"){
                            mergeObject(mainObject[key], inputObject[key]);
                        }else{
                            mainObject[key] = inputObject[key];
                        }
                    }
                }
            }
        }
    }
}

var ArcConfig = ArcBaseObject();
{
    var loaded = false;

    function loadConfig(src){
        var _this = this;

        if(!loaded){
            $.ajax({
                url: src,
                method: "GET",
                success: function(result){
                    var data = result;

                    if (typeof data === "string") {
                        data = JSON.parse(result);
                    }

                    _this.data = data;
                    _this.loaded = true;
                },
                error: function(e){
                    console.error("Could not load configuration file.");
                },
                async: false
            });
        }
    }

    function splitName(name){
        var n = name.split(".");

        return n;
    }

    ArcConfig.prototype.init = function(src){
        this.data = null;

        Object.defineProperty(this, 'isLoaded', {
            get: function(){
                return loaded;
            }
        });

        this.data = {};
        loadConfig.call(this, src);
    };
    ArcConfig.prototype.containsKey = function(name){
        var n = splitName(name);
        var lastVal = this.data;

        for(var i = 0; i < n.length; ++i){
            if(lastVal.hasOwnProperty(n[i])){
                lastVal = lastVal[n[i]];
            }else{
                return false;
            }
        }

        return true;
    };
    ArcConfig.prototype.getEntry = function(name){
        var n = splitName(name);
        var lastVal = this.data;

        for(var i = 0; i < n.length; ++i){
            if(lastVal.hasOwnProperty(n[i])){
                lastVal = lastVal[n[i]];
            }else{
                return null;
            }
        }

        return lastVal;
    };
}

/**
* @class
*/
var ArcGame = ArcBaseObject();
{
    // Private functions

    // Static functions
    ArcGame.Current = null;
    // Public functions
    ArcGame.prototype.init = function (canvas, displayAdapter, controlAdapter, audioAdapter, fpsCap, useGL) {
        if (fpsCap === undefined) {
            fpsCap = 60;
        }

        // Setup Adapters
        if (!displayAdapter || displayAdapter === null) {
            displayAdapter = arcGetDisplayAdapter(canvas, useGL);
        }

        if (!controlAdapter || controlAdapter === null) {
            controlAdapter = arcGetControlAdapter(canvas);
        }

        if (!audioAdapter || audioAdapter === null) {
            audioAdapter = arcGetAudioAdapter();
        }

        // Setup global variables
        this.display = displayAdapter;
        this.control = controlAdapter;
        this.audio = audioAdapter;
        this.beginLoopListeners = [];
        this.endLoopListeners = [];
        this.updateListeners = [];
        this.drawListeners = [];
        this.frameCap = 1000.0 / fpsCap;
        this.canvas = canvas;

        var __this = this;

        // Variables used for animation.
        var fpsScale = 1000.0 / fpsCap;
        var startTime = Date.now() - fpsScale;
        var lastTimestamp = startTime;
        var playTime = 0;
        var delta = 0;
        var timestamp = 0;
        var deltaRemainder = 0;
        
        ArcGame.Current = this;

        this.animate = function () {
            timestamp = Date.now();

            playTime = timestamp - startTime;
            delta = timestamp - lastTimestamp;

            if (delta > fpsScale) {
                deltaRemainder = (delta % fpsScale);
                lastTimestamp = timestamp - deltaRemainder;
                return delta - deltaRemainder;
            }

            return 0.0;
        };

        $(document).bind("focusin visibilitychange mozvisibilitychange webkitvisibilitychange msvisibilitychange", function () {
            lastTimestamp = Date.now();
        });

        // Useful functions
        this.getPlayTime = function () {
            return playTime;
        };

        /*$(window).resize(function (event) {
            resizeFunction.call(__this);
        });*/

        this.resize(canvas.width, canvas.height);
    };
    ArcGame.prototype.setFrameCap = function(fps){
        this.frameCap = 1000.0 / fps;
    };
    ArcGame.prototype.resize = function(width, height){
        this.canvas.width = width;
        this.canvas.height = height;
        this.display.resize(width, height);
        if (this.onResize && this.onResize !== null) {
            this.onResize(canvas.width, canvas.height);
        }
    }
    ArcGame.prototype.setMemoryLevel = function(level){
        if(level < LEVEL_LOW){
            level = LEVEL_LOW;
        }else if(level > LEVEL_ULTRA){
            level = LEVEL_ULTRA;
        }

        QuadTree.setMemoryLevel(level);
    }
    ArcGame.prototype.beginLoop = function(delta){
        for(var i = 0; i < this.beginLoopListeners.length; ++i){
            this.beginLoopListeners[i](this, delta);
        }
    };
    ArcGame.prototype.endLoop = function(){
        for(var i = 0; i < this.endLoopListeners.length; ++i){
            this.endLoopListeners[i](this);
        }
    };
    ArcGame.prototype.update = function(delta){
        this.display.update(delta);

        for(var i = 0; i < this.updateListeners.length; ++i){
            this.updateListeners[i](this, delta);
        }
    };
    ArcGame.prototype.draw = function(){
        for(var i = 0; i < this.drawListeners.length; ++i){
            this.drawListeners[i](this);
        }
    }
    ArcGame.prototype.start = function () {
        var __this = this;
        var delta = 0;
        var lastFrame = 0;
        var loopCount = 0;

        // Main Game Loop
        /*var loopGame = function (timestamp) {
            var time = __this.animate();
            arcRequestAnimFrame(loopGame);
            
            if (time > 0.0) {
                __this.display.update(time);

                for (var index = 0; index < __this.loopListeners.length; ++index) {
                    __this.loopListeners[index](__this, time);
                }
            }
        };*/

        var loopGame = function(timestamp){
            arcRequestAnimFrame(loopGame);
            
            delta += timestamp - lastFrame;

            if(delta >= __this.frameCap){
                loopCount = 0;

                __this.beginLoop(delta);

                while(delta >= __this.frameCap){

                    if(++loopCount < 10){
                        __this.update(__this.frameCap);
                    }

                    delta -= __this.frameCap;
                }

                __this.draw();
                __this.endLoop();

            }

            lastFrame = timestamp;
        }

        loopGame(0);
    };
}
