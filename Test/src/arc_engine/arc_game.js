// Gload functions
window.arcRequestAnimFrame = (function () {
    return  window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            function (callback) {
                window.setTimeout(callback, 1000 / 30); // 30 fps otherwise
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

/**
* The object containing settings information for game.
* @class
* @inherits {ArcBaseObject}
*/
var ArcSettings = ArcBaseObject();
ArcSettings.Current = null;
ArcSettings.prototype.init = function(name){
    this.name = name;
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
ArcSettings.prototype.load = function(){
    let data = null;
    data = JSON.parse(localStorage.getItem(this.name));

    if(data){
        for(var key in data){
            this[key] = data[key];
        }
    }
}

/**
* @class
*/
var ArcGame = ArcBaseObject();
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
    this.loopListeners = [];
    this.onResize = function (width, height) {
    };

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

    var resizeFunction = function () {
        displayAdapter.resize(canvas.width, canvas.height);
        if (__this.onResize && __this.onResize !== null) {
            __this.onResize(canvas.width, canvas.height);
        }
    };

    $(window).resize(function (event) {
        resizeFunction();
    });

    resizeFunction();
};
ArcGame.prototype.start = function () {
    var __this = this;

    // Main Game Loop
    var loopGame = function () {
        var time = __this.animate();
        arcRequestAnimFrame(loopGame);
        
        if (time > 0.0) {
            __this.display.update(time);

            for (var index = 0; index < __this.loopListeners.length; ++index) {
                __this.loopListeners[index](__this, time);
            }
        }
    };

    loopGame();
};
