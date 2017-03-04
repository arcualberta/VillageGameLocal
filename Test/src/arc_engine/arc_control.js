var ArcBaseControlAdapter = ArcBaseObject();
ArcBaseControlAdapter.prototype.init = function () {
    this.actions = [];
};
ArcBaseControlAdapter.prototype.pullActionList = function () {
    var outputList = this.actions;
    this.actions = [];
    return outputList;
};
ArcBaseControlAdapter.prototype.addAction = function (actionId, data) {
    var action = {
        id: actionId,
        timestamp: new Date().getTime(),
        data: data
    };

    this.actions.push(action);

    return action;
};

var ArcKeyboardAdapter = ArcBaseObject();
ArcKeyboardAdapter.prototype = Object.create(ArcBaseControlAdapter.prototype);
ArcKeyboardAdapter.prototype.init = function(canvas){
    ArcBaseControlAdapter.prototype.init.call(this);
    
    // 256 key presses are saved in an array as a boolean 0 means key up and 1 means key down.
    this.keys = new Uint8Array(32);
    
    var __this = this;
    var jcanvas = $(document.body);
    
    jcanvas.keydown(function(e){
        var key = e.keyCode;
        __this.setKey(key, true);
        __this.addAction(CONTROL_KEY_DOWN, {
            key: key
        });
    });
    
    jcanvas.keyup(function(e){
        var key = e.keyCode;
        __this.setKey(key, false);
        __this.addAction(CONTROL_KEY_UP, {
            key: key
        });
    });
};
ArcKeyboardAdapter.prototype.setKey = function(key, isDown){
    var i = key >> 3;
    var val = key & 0x00000007;
    
    if(isDown){
        this.keys[i] |= 1 << val;
    }else{
        this.keys[i] &= ~(1 << val);
    }
};
ArcKeyboardAdapter.prototype.getKey = function(key){
    var i = key >> 3;
    var val = key & 0x00000007;
    var mask = 1 << val;
    
    return (this.keys[i] & mask) > 0;
};

var ArcControlAdapter = ArcBaseObject();
ArcControlAdapter.prototype = Object.create(ArcBaseControlAdapter.prototype);
ArcControlAdapter.prototype.init = function(canvas){
    ArcBaseControlAdapter.prototype.init.call(this);
    var __this = this;
    var mouseDown = false;
    var jcanvas = $(canvas);
    
    jcanvas.mousedown(function (e) {
        e.preventDefault();

        mouseDown = true;
        var x = e.pageX - jcanvas.offset().left;
        var y = e.pageY - jcanvas.offset().top;

        __this.addAction(CONTROL_MOUSE1_DOWN, {
            x: x,
            y: y
        });
    });

    jcanvas.mouseup(function (e) {
        e.preventDefault();

        mouseDown = false;
        var x = e.pageX - jcanvas.offset().left;
        var y = e.pageY - jcanvas.offset().top;

        __this.addAction(CONTROL_MOUSE1_UP, {
            x: x,
            y: y
        });
    });

    jcanvas.mousemove(function (e) {
        e.preventDefault();
        
        if (mouseDown) {
            var x = e.pageX - jcanvas.offset().left;
            var y = e.pageY - jcanvas.offset().top;

            __this.addAction(CONTROL_MOUSE1_DRAG, {
                x: x,
                y: y
            });
        }
    });
};

var ArcMobileControlAdapter = ArcBaseObject();
ArcMobileControlAdapter.prototype = Object.create(ArcBaseControlAdapter.prototype);
ArcMobileControlAdapter.prototype.init = function(canvas){
    var __this = this;
    var mouseDown = false;
    var jcanvas = $(canvas);

    jcanvas.bind("touchstart", function (e) {
        e.preventDefault();

        mouseDown = true;
        var x = e.originalEvent.changedTouches[0].pageX - jcanvas.offset().left;
        var y = e.originalEvent.changedTouches[0].pageY - jcanvas.offset().top;

        __this.addAction(CONTROL_MOUSE1_DOWN, {
            x: x,
            y: y
        });
    });

    jcanvas.bind("touchend", function (e) {
        e.preventDefault();

        mouseDown = false;
        var x = e.originalEvent.changedTouches[0].pageX - jcanvas.offset().left;
        var y = e.originalEvent.changedTouches[0].pageY - jcanvas.offset().top;

        __this.addAction(CONTROL_MOUSE1_UP, {
            x: x,
            y: y
        });
    });

    jcanvas.bind("touchmove", function (e) {
        if (mouseDown) {
            e.preventDefault();

            var x = e.originalEvent.changedTouches[0].pageX - jcanvas.offset().left;
            var y = e.originalEvent.changedTouches[0].pageY - jcanvas.offset().top;

            __this.addAction(CONTROL_MOUSE1_DRAG, {
                x: x,
                y: y
            });
        }
    });
};

/*function ConsoleWiiUControlAdapter(canvas) {
    var __this = this;
    var actions = [];

    // Check WiiU Support
    // Information obtained from: http://wiiubrew.org/wiki/Internet_Browser
    if (!(window.wiiu)) {
        throw("System is not a Wii U.");
    }

    this.pullActionList = function () {
        var outputList = actions;
        actions = [];
        return outputList;
    };

    this.addAction = function (actionId, data) {
        var action = {
            id: actionId,
            timestamp: new Date().getTime(),
            data: data
        };

        actions.push(action);

        return action;
    };

    jcanvas.bind("touchstart", function (e) {
        e.preventDefault();

        mouseDown = true;
        var x = e.originalEvent.changedTouches[0].pageX - jcanvas.offset().left;
        var y = e.originalEvent.changedTouches[0].pageY - jcanvas.offset().top;

        __this.addAction(CONTROL_MOUSE1_DOWN, {
            x: x,
            y: y
        });
    });

    jcanvas.bind("touchend", function (e) {
        e.preventDefault();

        mouseDown = false;
        var x = e.originalEvent.changedTouches[0].pageX - jcanvas.offset().left;
        var y = e.originalEvent.changedTouches[0].pageY - jcanvas.offset().top;

        __this.addAction(CONTROL_MOUSE1_UP, {
            x: x,
            y: y
        });
    });

    jcanvas.bind("touchmove", function (e) {
        if (mouseDown) {
            e.preventDefault();

            var x = e.originalEvent.changedTouches[0].pageX - jcanvas.offset().left;
            var y = e.originalEvent.changedTouches[0].pageY - jcanvas.offset().top;

            __this.addAction(CONTROL_MOUSE1_DRAG, {
                x: x,
                y: y
            });
        }
    });
}*/

function arcGetControlAdapter(canvas) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        return new ArcMobileControlAdapter(canvas);
    }

    return new ArcControlAdapter(canvas);
}