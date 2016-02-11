
window.arcRequestAnimFrame = (function () {
    return  window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            function (callback) {
                window.setTimeout(callback, 1000 / 30); // 30 fps otherwise
            };
})();

function arcGetParameter(paramName){
    var pageUrl = window.location.search.substring(1);
    var pageVar = pageUrl.split('&');
    for(var i = 0; i < pageVar.length; ++i){
        var param = pageVar[i].split('=');
        if(param[0].toLowerCase() === paramName.toLowerCase()){
            return param[1];
        }
    }
    
    return false;
}

var ArcGame = ArcBaseObject();
ArcGame.prototype.init = function (canvas, displayAdapter, controlAdapter, audioAdapter, fpsCap, useGL) {
    if(fpsCap === undefined){
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
    var framesPerSecond = 0;
    var frameCount = 0;
    var fpsScale = 1000.0 / fpsCap;
    var startTime = Date.now() - fpsScale;
    var lastTimestamp = startTime;
    var lastFps = startTime;
    var playTime = 0;
    
    this.animate = function () {
        var timestamp = Date.now();
        ++frameCount;

        if (timestamp - lastFps >= 1000) {
            framesPerSecond = frameCount;
            frameCount = 0;
            lastFps = timestamp;
        }

        playTime = timestamp - startTime;
        var frameTime = timestamp - lastTimestamp;

        if (frameTime >= fpsScale) {
            lastTimestamp = timestamp;
            return frameTime;
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

    this.getFramesPerSecond = function () {
        return framesPerSecond;
    };

    var resizeFunction = function(){
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
ArcGame.prototype.start = function(){
    var __this = this;
    
    // Main Game Loop
    var loopGame = function () {
        arcRequestAnimFrame(loopGame);

        var time = __this.animate();
        __this.display.update(time);
        for (var index = 0; index < __this.loopListeners.length; ++index) {
            __this.loopListeners[index](__this, time);
        }
    };
    
    loopGame();
};
