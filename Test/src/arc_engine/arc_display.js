// Actions for the Camera
var ArcCameraAction = ArcBaseObject();
{
    ArcCameraAction.prototype.init = function (time, onComplete) {
        this.timeLimit = time;
        this.timeComplete = 0;
        this.complete = false;
        this.onComplete = onComplete;
    };
    ArcCameraAction.prototype.update = function (camera, timeSinceLast) {
        this.timeComplete += timeSinceLast;

        if (this.timeComplete >= this.timeLimit) {
            this.complete = true;
            if (this.onComplete) {
                this.onComplete(camera);
            }
        }
    };
}

var ArcCameraPanAction = ArcBaseObject();
{
    ArcCameraPanAction.prototype = Object.create(ArcCameraAction.prototype);
    ArcCameraPanAction.prototype.init = function (time, onComplete, xStart, yStart, xEnd, yEnd) {
        ArcCameraAction.prototype.init.call(this, time, onComplete);
        this.velocity = new Float32Array([(xEnd - xStart) / time, (yEnd - yStart) / time]);
        this.location = new Float32Array([xStart, yStart]);
    };
    ArcCameraPanAction.prototype.update = function (camera, timeSinceLast) {
        ArcCameraAction.prototype.update.call(this, camera, timeSinceLast);
        this.location[0] += timeSinceLast * this.velocity[0];
        this.location[1] += timeSinceLast * this.velocity[1];

        camera.setOffset(this.location[0], this.location[1]);
    };
}

/**
* @class
* @implements {ArcCameraAction}
*/
var ArcCameraMosaic = ArcBaseObject();
{
    ArcCameraMosaic.prototype = Object.create(ArcCameraAction.prototype);

    ArcCameraMosaic.prototype.init = function(time, onComplete, start, end){
        ArcCameraAction.prototype.init.call(this, time, onComplete);
        this.start = start;
        this.end = end;
    }

    ArcCameraMosaic.prototype.update = function(camera, timeSinceLast){
        ArcCameraAction.prototype.update.call(this, camera, timeSinceLast);
        var t = Math.min(1.0, this.timeComplete / this.timeLimit);
        camera.scale = ((1.0 - t) * this.start) + (t * this.end);
    }
}

/**
* @class
* @implements {ArcCameraAction}
*/
var ArcCameraFadeOut = ArcBaseObject();
{
    ArcCameraFadeOut.prototype = Object.create(ArcCameraAction.prototype);

    ArcCameraFadeOut.prototype.init = function(time, onComplete, r, g, b){
        ArcCameraAction.prototype.init.call(this, time, onComplete);
        this.r = r;
        this.g = g;
        this.b = b;
    }

    ArcCameraFadeOut.prototype.update = function(camera, timeSinceLast){
        ArcCameraAction.prototype.update.call(this, camera, timeSinceLast);
        camera.fade[0] = this.r;
        camera.fade[1] = this.g;
        camera.fade[2] = this.b;
        camera.fade[3] = Math.min(1.0, this.timeComplete / this.timeLimit);
    }
}

/**
* @class
* @implements {ArcCameraAction}
*/
var ArcCameraFadeIn = ArcBaseObject();
{
    ArcCameraFadeIn.prototype = Object.create(ArcCameraAction.prototype);

    ArcCameraFadeIn.prototype.init = function(time, onComplete, r, g, b){
        ArcCameraAction.prototype.init.call(this, time, onComplete);
        this.r = r;
        this.g = g;
        this.b = b;
    }

    ArcCameraFadeIn.prototype.update = function(camera, timeSinceLast){
        ArcCameraAction.prototype.update.call(this, camera, timeSinceLast);
        camera.fade[0] = this.r;
        camera.fade[1] = this.g;
        camera.fade[2] = this.b;
        camera.fade[3] = 1.0 - Math.min(1.0, this.timeComplete / this.timeLimit);
    }
}


// Camera
var ArcCamera = ArcBaseObject();
ArcCamera.prototype.init = function () {
    this.fade = new Float32Array([0.0, 0.0, 0.0, 0.0]);
    this.offset = [0, 0];
    this.scale = 1.0;
    this.actionList = [];
};
ArcCamera.prototype.setOffset = function (offsetX, offsetY) {
    this.offset[0] = offsetX;
    this.offset[1] = offsetY;
};
ArcCamera.prototype.addAction = function (action) {
    this.actionList.push(action);
};
ArcCamera.prototype.update = function (timeSinceLast) {
    var actions = this.actionList;
    var removeList = [];
    var total = actions.length;
    var action;
    var i = 0;

    for (i = 0; i < total; ++i) {
        action = actions[i];
        action.update(this, timeSinceLast);

        if (action.complete) {
            removeList.push(i);
        }
    }

    total = removeList.length;
    for (i = total - 1; i >= 0; --i) {
        actions.splice(removeList[i], 1);
    }
};
ArcCamera.prototype.clearActions = function () {
    this.actionList.length = 0;
};

// Graphics Adapters
var ArcGraphicsAdapter = ArcBaseObject();
ArcGraphicsAdapter.prototype.init = function () {
    this.tileSheets = {};
    this.spriteSheets = {};
    this.size = [2, 2];
    this.defaultFontInfo = {
        font: "bold 12px sans-serif",
        fillStyle: "black",
        textAlign: "center"
    };
    this.camera = new ArcCamera();
    this.tiles = [];
};
ArcGraphicsAdapter.prototype.clear = function () {
};
ArcGraphicsAdapter.prototype.drawWaypoint = function (waypointLoc, xOffset, yOffset) {
};
ArcGraphicsAdapter.prototype.drawToDisplay = function (clearSwap) {
};
ArcGraphicsAdapter.prototype.updateImage = function(image) {
    // Used so GL adapters can update the texture.
};
ArcGraphicsAdapter.prototype.drawImage = function (image, cx, cy, cwidth, cheight, x, y, width, height) {
};
ArcGraphicsAdapter.prototype.drawMessage = function (message, x, y, fontInfo, fillRect, fillColor) {
};
ArcGraphicsAdapter.prototype.drawTileById = function (tileId, x, y, width, height) {
    var tile = this.tiles[tileId];

    if (tile) {
        var tileset = this.tileSheets[tile.tileSheetName];
        this.drawTile(tileset, tile.drawable(), x, y, width, height);
    }
};
ArcGraphicsAdapter.prototype.drawTile = function (tileSheet, tile, x, y, width, height) {
    //this.context.strokeRect(x, y, width, height);
    this.drawImage(tileSheet.image,
            tile.x, tile.y, tile.width, tile.height,
            x, y, width, height);
};
ArcGraphicsAdapter.prototype.clear = function () {
};
ArcGraphicsAdapter.prototype.requestFullscreen = function () {
};
ArcGraphicsAdapter.prototype.addTileSheet = function (name, url, tiles) {
    this.tileSheets[name] = new ArcTileSheet(name, url, tiles);
};
ArcGraphicsAdapter.prototype.addExistingTileSheet = function (name, tileSheet) {
    this.tileSheets[name] = tileSheet;
};
ArcGraphicsAdapter.prototype.updateTileSheet = function (name, timeSinceLastFrame) {
    var sheet = this.tileSheets[name];

    if (sheet) {
        sheet.update(timeSinceLastFrame);
    }
};
ArcGraphicsAdapter.prototype.addSpriteSheet = function (id, url, animations, palette) {
    var spriteSheet = new ArcSpriteSheet(url, false, palette);

    for (var key in animations) {
        spriteSheet.setAnimation(key, animations[key]);
    }

    spriteSheet.id = id;
    this.spriteSheets[id] = spriteSheet;
};
ArcGraphicsAdapter.prototype.addExistingSpriteSheet = function (id, spriteSheet) {
    this.spriteSheets[id] = spriteSheet;
};
ArcGraphicsAdapter.prototype.drawTileLayer = function (tiles) {
    let index = 0;
    let offset = this.camera.offset;
    let length = tiles.length;
    let tile, tileSheet;

    for (; index < length; ++index) {
        tile = tiles[index];

        tileSheet = this.tileSheets[tile.tile.tileSheetName];
        if (tileSheet) {
            this.drawTile(tileSheet, tile.tile.drawable(), tile.location[0] - offset[0], tile.location[1] - offset[1], tile.size[0], tile.size[1]);
        }
    }

    if(window.debugMode){
        let color;
        for (index = 0; index < length; ++index) {
            tile = tiles[index];

            color = tile.tile.walkable ? "#AAA" : "#000";
            this.drawLine(tile.location[0], tile.location[1], tile.location[2], tile.location[3], color);
            this.drawLine(tile.location[2], tile.location[1], tile.location[0], tile.location[3], color);
        }
    }
};
ArcGraphicsAdapter.prototype.drawTileLayerWithOffset = function (layer, loopX, loopY) {
    var offset = this.camera.offset;
    var xTileOffset = offset[0] / layer.tileDimension[0];
    var yTileOffset = offset[1] / layer.tileDimension[1];
    var x = Math.floor(xTileOffset);
    var y = Math.floor(yTileOffset);
    xTileOffset = -(xTileOffset - x) * layer.tileDimension[0];
    yTileOffset = -(yTileOffset - y) * layer.tileDimension[1];
    var xLoc = xTileOffset;
    var yLoc = yTileOffset;
    var width = this.size[0];
    var height = this.size[1];
    var worldWidth = layer.dimension[0];
    var worldHeight = layer.dimension[1];
    var index = 0;
    var startX = x;
    var tileSheet = this.tileSheets[layer.tileSheet.name];

    while (yLoc <= height && y < worldHeight) {
        index = (y * worldWidth) + x;
        while (xLoc < width && x < worldWidth) {
            var tileIndex = layer.data[index];
            if (tileIndex >= 0) {
                var tile = layer.tileSheet.tiles[tileIndex];

                if (tile && tile.isDrawable) {
                    this.drawTile(tileSheet, tile.drawable(), xLoc, yLoc, layer.tileDimension[0], layer.tileDimension[1]);
                }
            }

            ++x;

            if (loopX && x >= worldWidth) {
                x = 0;
            }

            ++index;
            xLoc += layer.tileDimension[0];
        }

        x = startX;
        xLoc = xTileOffset;
        yLoc += layer.tileDimension[0];
        ++y;

        if (loopY && y >= worldHeight) {
            y = 0;
        }
    }
};
//ArcGraphicsAdapter.prototype.drawUser = function (user, fontInfo) {
//    var offset = this.camera.offset;
//    var spriteSheet = this.spriteSheets[user.spriteSheet.id];
//    var frame = spriteSheet.getAnimation(user.animation).frames[user.frame];
//
//    var frameCenter = user.location[0] - offset[0];
//    var frameTop = user.location[1] - frame.hHalf - offset[1];
//
//    this.drawImage(spriteSheet.image,
//            frame.x, frame.y, frame.width, frame.height,
//            frameCenter - frame.wHalf, frameTop,
//            frame.drawWidth, frame.drawHeight);
//
//    this.drawMessage(user.name, frameCenter, frameTop - 12, fontInfo);
//};
//ArcGraphicsAdapter.prototype.drawUsers = function (userList) {
//    var index = 0;
//    var context = this.context;
//
//    var fontInfo = {
//        font: "bold 12px sans-serif",
//        fillStyle: "yellow",
//        textAlign: "center"
//    };
//
//    for (var index in userList) {
//        this.drawUser(userList[index], fontInfo);
//    }
//};
ArcGraphicsAdapter.prototype.update = function (timeSinceLast) {
    this.camera.update(timeSinceLast);

    for (var i in this.tiles) {
        this.tiles[i].update(timeSinceLast);
    }
};
ArcGraphicsAdapter.prototype.drawLine = function(x1, y1, x2, y2, color){

};
ArcGraphicsAdapter.prototype.drawPolygon = function(color, points){

};
ArcGraphicsAdapter.prototype.resize = function(width, height){
    this.size[0] = width;
    this.size[1] = height;
};


var ArcCanvasAdapter = ArcBaseObject();
{
    ArcCanvasAdapter.prototype = Object.create(ArcGraphicsAdapter.prototype);
    ArcCanvasAdapter.prototype.init = function (canvas) {
        ArcGraphicsAdapter.prototype.init.call(this);

        var backgroundCanvas = document.createElement('canvas');
        backgroundCanvas.width = canvas.width;
        backgroundCanvas.height = canvas.height;
        var context = backgroundCanvas.getContext("2d");

        // Context settings
        context.imageSmoothingEnabled = false;

        this.size[0] = canvas.width;
        this.size[1] = canvas.height;
        this.context = context;
        this.canvas = canvas;
    };
    ArcCanvasAdapter.prototype.drawMessage = function (message, x, y, fontInfo, fillRect, fillColor) {
        var context = this.context;

        if (fontInfo == undefined) {
            fontInfo = this.defaultFontInfo;
        }

        context.font = fontInfo.font;
        context.textAlign = fontInfo.textAlign;

        if (fillRect) {
            context.fillStyle = fillColor;
            context.fillRect(fillRect[0], fillRect[1], fillRect[2], fillRect[3]);

            context.fillStyle = fontInfo.fillStyle;
            context.fillText(message, x + fillRect[0] + (fillRect[2] >> 1), y + fillRect[1] + (fillRect[3] >> 1));
        } else {
            context.fillStyle = fontInfo.fillStyle;

            context.fillText(message, x, y);
        }
    };
    ArcCanvasAdapter.prototype.drawToDisplay = function(clearSwap){
        var canvas = this.canvas;
        var swapContext = canvas.getContext("2d");
        var backgroundCanvas = this.context.canvas;

        if(clearSwap){
            swapContext.clearRect(0, 0, canvas.width, canvas.height);
        }

        if(this.camera.scale != 1.0){
            var scale = this.camera.scale;
            var cx = canvas.width * scale;
            var cy = canvas.height * scale;


            swapContext.drawImage(backgroundCanvas, 0, 0, canvas.width, canvas.height, 0, 0, cx, cy);
            swapContext.drawImage(canvas, 0, 0, cx, cy, 0, 0, canvas.width, canvas.height);
        }else{
            swapContext.drawImage(backgroundCanvas, 0, 0);
        }

        var fade = this.camera.fade;
        if(fade[3] >= 0.0){
            swapContext.fillStyle = "rgba(" + 
                    Math.floor(fade[0] * 255) + "," + 
                    Math.floor(fade[1] * 255) + "," + 
                    Math.floor(fade[2] * 255) + "," + 
                    fade[3] + ")";

            swapContext.fillRect(0, 0, canvas.width, canvas.height);
        }
        /*gl.uniform4fv(postProgram.uFadeColor, this.camera.fade);
        gl.uniform1f(postProgram.uScale, this.camera.scale);*/



        /*if(fps){
         // Draw the frames per second
         drawMessage("FPS: " + fps, 10, 10);
         }*/
    };
    ArcCanvasAdapter.prototype.getPixelData = function (x, y, width, height) {
        return this.context.getImageData(x, y, width, height);
    };
    ArcCanvasAdapter.prototype.setPixelData = function (imageData, x, y) {
        this.context.putImageData(imageData, x, y);
    };
    ArcCanvasAdapter.prototype.requestFullscreen = function () {
        var canvas = this.canvas;
        var screen = this.screen;

        if (canvas.requestFullscreen) {
            canvas.requestFullscreen();
        } else if (canvas.msRequestFullscreen) {
            canvas.msRequestFullscreen();
        } else if (canvas.mozRequestFullscreen) {
            canvas.mozRequestFullscreen();
        } else if (canvas.webkitRequestFullscreen) {
            canvas.webkitRequestFullscreen();
        }

        canvas.width = screen.width;
        canvas.height = screen.height;
    };
    ArcCanvasAdapter.prototype.clear = function () {
        var context = this.context;
        var canvas = this.canvas;
        
        context.clearRect(0, 0, canvas.width, canvas.height);
    };
    ArcCanvasAdapter.prototype.drawTileLayer = function(tiles){
        this.camera.offset[0] |= 0;
        this.camera.offset[1] |= 0;
        ArcGraphicsAdapter.prototype.drawTileLayer.call(this, tiles);
    };
    ArcCanvasAdapter.prototype.drawTileLayerWithOffset = function (layer, loopX, loopY) {
        ArcGraphicsAdapter.prototype.drawTileLayerWithOffset.call(this, layer, loopX, loopY);
    };
    ArcCanvasAdapter.prototype.drawImage = function (image, cx, cy, cwidth, cheight, x, y, width, height) {
        if(image){
            this.context.drawImage(image,
                cx, cy, cwidth, cheight,
                x, y, width, height);
        }
    };
    ArcCanvasAdapter.prototype.drawWaypoint = function (waypointLoc) {
        var offset = this.camera.offset;
        var context = this.context;

        context.beginPath();
        context.fillStyle = "rgba(255, 255, 0, 0.5)";
        context.arc(waypointLoc[0] - offset[0], waypointLoc[1] - offset[1], 10, 0, 2 * Math.PI, false);
        context.fill();
    };
    ArcCanvasAdapter.prototype.drawLine = function(x1, y1, x2, y2, color){
        var offset = this.camera.offset;
        var context = this.context;

        if(!(color)){
            color = "#0F0";
        };
        context.strokeStyle = color;

        context.beginPath();
        context.moveTo(x1 - offset[0], y1 - offset[1]);
        context.lineTo(x2 - offset[0], y2 - offset[1]);
        context.stroke();
    };
    ArcCanvasAdapter.prototype.drawPolygon = function(color, points, texture){
            var offset = this.camera.offset;
            var context = this.context;

            if(context){
                context.fillStyle = "rgba(" + 
                    Math.floor(color[0] * 255) + "," + 
                    Math.floor(color[1] * 255) + "," + 
                    Math.floor(color[2] * 255) + "," + 
                    color[3] + ")";

                context.beginPath();
                context.moveTo(points[0] - offset[0], points[1] - offset[1]);

                for(var i = 4; i < points.length; i += 4){
                    context.lineTo(points[i] - offset[0], points[i + 1] - offset[1]);
                }

                context.closePath();

                context.fill();
            }
        };
}

var ArcGLCanvasAdapter = ArcBaseObject();
{
    // Private functions
    var drawBlurred = function (gl, toDisplay, postProgram, vBuffer) {
        gl.useProgram(postProgram);
        gl.disable(gl.BLEND);
        gl.uniform1i(postProgram.uBlurType, 1);
        gl.uniform4fv(postProgram.uFadeColor, this.camera.fade);
        gl.uniform1f(postProgram.uScale, this.camera.scale);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, vBuffer.numItems);

        if (toDisplay) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        gl.uniform1i(postProgram.uBlurType, 2);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, vBuffer.numItems);

        gl.enable(gl.BLEND);
    };

    var drawNonBlurred = function (gl, toDisplay, postProgram, vBuffer) {
        gl.useProgram(postProgram);
        gl.disable(gl.BLEND);
        gl.uniform1i(postProgram.uBlurType, 0);
        gl.uniform4fv(postProgram.uFadeColor, this.camera.fade);
        gl.uniform1f(postProgram.uScale, this.camera.scale);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, vBuffer.numItems);

        gl.enable(gl.BLEND);
    };

    var swapMessageBuffer = function (gl, vBuffer) {
        let data = this.textCanvas;//__this.textContext.getImageData(0, 0, w, h);

        gl.useProgram(this.textProgram);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.textbufferTexture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, vBuffer.numItems);
        gl.activeTexture(gl.TEXTURE0);
    };

    // Public Functions
    ArcGLCanvasAdapter.prototype = Object.create(ArcGraphicsAdapter.prototype);
    ArcGLCanvasAdapter.prototype.init = function (canvas) {
        ArcGraphicsAdapter.prototype.init.call(this);
        var textCanvas = document.createElement('canvas');
        $(textCanvas).css("background-color", "rgba(255, 0, 255, 0)");
        textCanvas.width = canvas.width;
        textCanvas.height = canvas.height;

        // Setup WebGL
        var gl;

        try {
            gl = canvas.getContext("webgl", "experimental-webgl");
        } catch (e) {
            throw("WebGL not supported.");
        }

        this.textCanvas = textCanvas;
        this.textContext = textCanvas.getContext('2d');
        this.program = null;
        this.waypointProgram = null;
        this.postProgram = null;
        this.textProgram = null;
        this.backbuffer = null;
        this.backbufferTexture = null;
        this.textbufferTexture = null;
        this.context = gl;
        this.vBuffer = null;
        this.size[0] = canvas.width;
        this.size[1] = canvas.height;
        this.canvas = canvas;

        this.initGL();
    };
    ArcGLCanvasAdapter.prototype.initGL = function () {
        var gl = this.context;
        var canvas = this.canvas;

        // Create Orthoginal Matrix
        var generateOrtho = function (mat, left, right, top, bottom, near, far) {
            var width = right - left;
            var height = top - bottom;
            var depth = far - near;

            mat[0] = 2 / width;
            mat[1] = 0;
            mat[2] = 0;
            mat[3] = 0;

            mat[4] = 0;
            mat[5] = 2 / height;
            mat[6] = 0;
            mat[7] = 0;

            mat[8] = 0;
            mat[9] = 0;
            mat[10] = -1 / depth;
            mat[11] = 0;

            mat[12] = -(right + left) / width;
            mat[13] = -(top + bottom) / height;
            mat[14] = -near / depth;
            mat[15] = 1.0;

            return mat;
        };

        // Create Perspective Matrix
        var generatePerspective = function (mat, fov, near, far) {
            var S = 1.0 / Math.tan(fov * 0.5 * (Math.PI / 180.0));
            var depth = far - near;

            mat[0] = S;
            mat[1] = 0;
            mat[2] = 0;
            mat[3] = 0;

            mat[4] = 0;
            mat[5] = S;
            mat[6] = 0;
            mat[7] = 0;

            mat[8] = 0;
            mat[9] = 0;
            mat[10] = -far / depth;
            mat[11] = -1.0;

            mat[12] = 0;
            mat[13] = 0;
            mat[14] = -(far * near) / depth;
            mat[15] = 0;

            return mat;
        };

        var generateRotationMatrix = function (mat, theta) {
            var sin = Math.sin(theta);
            var cos = Math.cos(theta);

            mat[0] = 1;
            mat[1] = 0;
            mat[2] = 0;
            mat[3] = 0;

            mat[4] = 0;
            mat[5] = cos;
            mat[6] = -sin;
            mat[7] = 0;

            mat[8] = 0;
            mat[9] = sin;
            mat[10] = cos;
            mat[11] = 0;

            mat[12] = 0;
            mat[13] = 0;
            mat[14] = 0;
            mat[15] = 1;

            return mat;
        };

        var createShader = function (type, code) {
            var shader = gl.createShader(type);

            gl.shaderSource(shader, code);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                alert(gl.getShaderInfoLog(shader));
                return null;
            }

            return shader;
        };

        var createProgram = function (vertSrc, fragSrc) {
            var fragShader = createShader(gl.FRAGMENT_SHADER, fragSrc);
            var vertexShader = createShader(gl.VERTEX_SHADER, vertSrc);

            var program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragShader);
            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                alert("Could not initialize shaders.");
            }

            return program;
        };

        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);

        gl.clearColor(0.0, 0.0, 0.0, 1.0);

        // Create the text writing program
        textProgram = createProgram(
                "precision mediump float;\n" +
                "attribute vec2 aVertPos;\n" +
                "varying vec2 vTexPos;\n" +
                "void main(void){\n" +
                "vTexPos = vec2(aVertPos.x, 1.0 - aVertPos.y);\n" +
                "gl_Position = vec4((aVertPos * 2.0) - 1.0, 0.0, 1.0);\n" +
                "}",
                "precision mediump float;\n" +
                "uniform sampler2D uTexture;\n" +
                "varying vec2 vTexPos;\n" +
                "void main(void){\n" +
                "gl_FragColor = texture2D(uTexture, vTexPos);\n" +
                "}"
                );

        gl.useProgram(textProgram);
        textProgram.aVertPos = gl.getAttribLocation(textProgram, "aVertPos");

        textProgram.uTexture = gl.getUniformLocation(textProgram, "uTexture");

        gl.uniform1i(textProgram.uTexture, 2);
        this.textProgram = textProgram;

        // Create the post processing program
        var postProgram = createProgram(
                "precision mediump float;\n" +
                "attribute vec2 aVertPos;\n" +
                "varying vec2 vTexPos;\n" +
                "void main(void){\n" +
                "vTexPos = vec2(aVertPos.x, aVertPos.y);\n" +
                "gl_Position = vec4((aVertPos * 2.0) - 1.0, 0.0, 1.0);\n" +
                "}",
                "precision mediump float;\n" +
                "uniform vec2 uSpace;\n" +
                "uniform lowp int uBlurType;\n" +
                "uniform sampler2D uTexture;\n" +
                "uniform vec4 uFadeColor;\n" +
                "uniform float uScale;\n" +
                "varying vec2 vTexPos;\n" +
                "varying vec2 vSpace;\n" +
                "vec4 getTexture(sampler2D tex, vec2 pos){\n" +
                "if(uScale == 1.0) { return texture2D(tex, pos); };\n" +
                "vec2 tileLocation = (floor(uScale * (pos / uSpace)) / uScale) * uSpace;\n" + 
                "return texture2D(tex, tileLocation);\n" +
                "}\n" +
                "vec4 blur(float p){\n" +
                "vec4 tMain = getTexture(uTexture, vTexPos);\n" +
                "if(p <= 0.0) { return tMain; }\n" +
                "vec4 left, right;\n" +
                "if(uBlurType == 1){\n" +
                "left = getTexture(uTexture, vec2(vTexPos.x, vTexPos.y - uSpace.y));\n" +
                "right = getTexture(uTexture, vec2(vTexPos.x, vTexPos.y + uSpace.y));\n" +
                "}else if(uBlurType == 2){\n" +
                "left = getTexture(uTexture, vec2(vTexPos.x - uSpace.x, vTexPos.y));\n" +
                "right = getTexture(uTexture, vec2(vTexPos.x + uSpace.x, vTexPos.y));\n" +
                "}else{return tMain;}\n" +
                "float outP = sqrt(p * 2.0) / 3.0;\n" +
                "return (outP * (left + right)) + ((1.0 - (2.0 * outP)) * tMain);\n" +
                "}\n" +
                "void main(void){\n" +
                "float y = pow((vTexPos.y * 2.0) - 1.0, 2.0);\n" + // Tilt shift
                //"float y = (2.0 * distance((vTexPos * 2.0) - 1.0, vec2(0, 0))) - 1.0;\n" + // Radial focus
                "y = max(y, 0.0);\n" +
                "gl_FragColor = blur(y);\n" +
                "if(uFadeColor.a > 0.0){\n" +
                "gl_FragColor.rgb = ((1.0 - uFadeColor.a) * gl_FragColor.rgb) + (uFadeColor.a * uFadeColor.rgb);\n" +
                "}\n" +
                "}");
        gl.useProgram(postProgram);
        postProgram.aVertPos = gl.getAttribLocation(postProgram, "aVertPos");

        postProgram.uSpace = gl.getUniformLocation(postProgram, "uSpace");
        postProgram.uTexture = gl.getUniformLocation(postProgram, "uTexture");
        postProgram.uBlurType = gl.getUniformLocation(postProgram, "uBlurType");
        postProgram.uFadeColor = gl.getUniformLocation(postProgram, "uFadeColor");
        postProgram.uScale = gl.getUniformLocation(postProgram, "uScale");

        gl.uniform1i(postProgram.uTexture, 1);

        this.postProgram = postProgram;

        // Create the waypoint program
        var waypointProgram = createProgram(
                "precision mediump float;\n" +
                "uniform vec2 uScreen;\n" +
                "uniform vec4 uDimension;\n" +
                "attribute vec2 aVertPos;\n" +
                "varying vec2 vTexPos;\n" +
                "void main(void){\n" +
                "vTexPos = (vec2(aVertPos.x, aVertPos.y) * 2.0) - 1.0;\n" +
                "gl_Position.zw = vec2(0.0, 1.0);\n" +
                "gl_Position.x = ((2.0 * uDimension.x) - uScreen.x + (2.0 * aVertPos.x * uDimension.z)) / uScreen.x;\n" +
                "gl_Position.y = ((-2.0 * uDimension.y) + uScreen.y - (2.0 * aVertPos.y * uDimension.w)) / uScreen.y;\n" +
                "}",
                "precision mediump float;\n" +
                "varying vec2 vTexPos;\n" +
                "void main(void){\n" +
                "float d = distance(vTexPos, vec2(0,0));\n" +
                "if(d > 1.0){ discard; }\n" +
                "d = 1.0 - d;\n" +
                "d *= d;\n" +
                "gl_FragColor = vec4(d, d, d * 0.1, 1.0);\n" +
                "}");

        gl.useProgram(waypointProgram);
        waypointProgram.aVertPos = gl.getAttribLocation(waypointProgram, "aVertPos");

        waypointProgram.uScreen = gl.getUniformLocation(waypointProgram, "uScreen");
        waypointProgram.uDimension = gl.getUniformLocation(waypointProgram, "uDimension");

        this.waypointProgram = waypointProgram;

        // Create the polygon program
        var polygonProgram = createProgram(
                "precision mediump float;\n" +
                "uniform mat4 mOMatrix;\n" +
                "uniform mat4 mRMatrix;\n" +
                "uniform vec2 uScreen;\n" +
                "uniform vec2 uOffset;\n" +
                "attribute vec2 aVertPos;\n" +
                "attribute vec2 aTexPos;\n" +
                "varying vec2 vTexPos;\n" +
                "void main(void){\n" +
                "vTexPos = aTexPos;\n" +
                "gl_Position.zw = vec2(0.0, 1.0);\n" +
                "gl_Position.xy = vec2(uScreen.x, -uScreen.y);\n" +
                "gl_Position.xy = ((2.0 * (aVertPos.xy - uOffset.xy)) - uScreen.xy) / gl_Position.xy;\n" +
                "gl_Position = mRMatrix * gl_Position;\n" +
                "gl_Position = mOMatrix * gl_Position;\n" +
                "}",
                "precision mediump float;\n" +
                "uniform vec4 uColor;\n" +
                "uniform sampler2D uTexture;\n" +
                "varying vec2 vTexPos;\n" +
                "void main(void){\n" +
                "gl_FragColor = texture2D(uTexture, vTexPos) * uColor;\n" +
                "}"
            );
        gl.useProgram(polygonProgram);

        polygonProgram.aVertPos = gl.getAttribLocation(polygonProgram, "aVertPos");
        polygonProgram.aTexPos = gl.getAttribLocation(polygonProgram, "aTexPos");

        polygonProgram.mOMatrix = gl.getUniformLocation(polygonProgram, "mOMatrix");
        polygonProgram.mRMatrix = gl.getUniformLocation(polygonProgram, "mRMatrix");
        polygonProgram.uScreen = gl.getUniformLocation(polygonProgram, "uScreen");
        polygonProgram.uOffset = gl.getUniformLocation(polygonProgram, "uOffset");
        polygonProgram.uColor = gl.getUniformLocation(polygonProgram, "uColor");
        polygonProgram.uTexture = gl.getUniformLocation(polygonProgram, "uTexture");

        gl.uniform1i(polygonProgram.uTexture, 0);

        var orthoMat = new Float32Array(16);
        generateOrtho(orthoMat, -1.0, 1.0, 1.0, -1.0, -1.0, -10.0);
        //generatePerspective(orthoMat, 90.0, 0.0, 100.0);
        gl.uniformMatrix4fv(polygonProgram.mOMatrix, false, orthoMat);

        var rotMat = new Float32Array(16);
        generateRotationMatrix(rotMat, 0.0);
        gl.uniformMatrix4fv(polygonProgram.mRMatrix, false, rotMat);

        polygonProgram.bPointBuffer = gl.createBuffer();

        this.polygonProgram = polygonProgram;

        // Create the basic image shader
        var program = createProgram(
                "precision mediump float;\n" +
                "uniform mat4 mOMatrix;\n" +
                "uniform mat4 mRMatrix;\n" +
                "uniform vec2 uScreen;\n" +
                "uniform vec4 uDimension;\n" +
                "attribute vec2 aVertPos;\n" +
                "varying vec2 vTexPos;\n" +
                "void main(void){\n" +
                "vTexPos = vec2(aVertPos.x, aVertPos.y);\n" +
                "gl_Position.zw = vec2(-1.6, 1.0);\n" +
                "gl_Position.x = ((2.0 * uDimension.x) - uScreen.x + (2.0 * aVertPos.x * uDimension.z)) / uScreen.x;\n" +
                "gl_Position.y = ((-2.0 * uDimension.y) + uScreen.y - (2.0 * aVertPos.y * uDimension.w)) / uScreen.y;\n" +
                "gl_Position = mRMatrix * gl_Position;\n" +
                "gl_Position.z -= 0.0;\n" +
                "gl_Position = mOMatrix * gl_Position;\n" +
                "}",
                "precision mediump float;\n" +
                "uniform float uScaleDist;\n" +
                "uniform vec2 uTexDimension;\n" +
                "uniform vec4 uTileDimension;\n" +
                "uniform sampler2D uTexture;\n" +
                "varying vec2 vTexPos;\n" +
                "vec2 getAvailableTexturePosition(vec2 texPos){\n" +
                "vec2 outVal = max(min(texPos, vec2(1.0, 1.0)), vec2(0.01, 0.01));\n" +
                "outVal *= uTileDimension.zw;\n" +
                "outVal += uTileDimension.xy;\n" +
                "return outVal / uTexDimension;\n" +
                "}\n" +
                "vec4 scaled(vec2 texPos){\n" +
                "vec2 scale = uScaleDist * 1.0/uTileDimension.zw;\n" +
                "vec2 texCoord[9];\n" +
                "vec4 texColor[9];\n" +
                "vec4 avg;\n" +
                "float d;\n" +
                "float dCheck;\n" +
                "texCoord[0] = getAvailableTexturePosition(vec2(texPos.x - scale.x, texPos.y - scale.y));\n" +
                "texCoord[1] = getAvailableTexturePosition(vec2(texPos.x - 0.0, texPos.y - scale.y));\n" +
                "texCoord[2] = getAvailableTexturePosition(vec2(texPos.x + scale.x, texPos.y - scale.y));\n" +
                "texCoord[3] = getAvailableTexturePosition(vec2(texPos.x - scale.x, texPos.y - 0.0));\n" +
                "texCoord[4] = getAvailableTexturePosition(vec2(texPos.x - 0.0, texPos.y - 0.0));\n" +
                "texCoord[5] = getAvailableTexturePosition(vec2(texPos.x + scale.x, texPos.y - 0.0));\n" +
                "texCoord[6] = getAvailableTexturePosition(vec2(texPos.x - scale.x, texPos.y - scale.y));\n" +
                "texCoord[7] = getAvailableTexturePosition(vec2(texPos.x - 0.0, texPos.y - scale.y));\n" +
                "texCoord[8] = getAvailableTexturePosition(vec2(texPos.x + scale.x, texPos.y - scale.y));\n" +
                "texColor[0] = texture2D(uTexture, texCoord[0]);\n" +
                "texColor[1] = texture2D(uTexture, texCoord[1]);\n" +
                "texColor[2] = texture2D(uTexture, texCoord[2]);\n" +
                "texColor[3] = texture2D(uTexture, texCoord[3]);\n" +
                "texColor[4] = texture2D(uTexture, texCoord[4]);\n" +
                "texColor[5] = texture2D(uTexture, texCoord[5]);\n" +
                "texColor[6] = texture2D(uTexture, texCoord[6]);\n" +
                "texColor[7] = texture2D(uTexture, texCoord[7]);\n" +
                "texColor[8] = texture2D(uTexture, texCoord[8]);\n" +
                "avg = texColor[0] + texColor[1] + texColor[2] + texColor[3] + texColor[4] + texColor[5] + texColor[6] + texColor[7] + texColor[8];\n" +
                "if(avg.a == 0.0) { discard; }\n" +
                "avg = avg / 9.0;\n" +
                "vec4 currentColor = texColor[5];\n" +
                "d = distance(avg, currentColor);\n" +
                "dCheck = distance(avg, texColor[0]);\n" +
                "if(dCheck < d){ d = dCheck; currentColor = texColor[0]; }\n" +
                "dCheck = distance(avg, texColor[1]);\n" +
                "if(dCheck < d){ d = dCheck; currentColor = texColor[1]; }\n" +
                "dCheck = distance(avg, texColor[2]);\n" +
                "if(dCheck < d){ d = dCheck; currentColor = texColor[2]; }\n" +
                "dCheck = distance(avg, texColor[3]);\n" +
                "if(dCheck < d){ d = dCheck; currentColor = texColor[3]; }\n" +
                "dCheck = distance(avg, texColor[4]);\n" +
                "if(dCheck < d){ d = dCheck; currentColor = texColor[4]; }\n" +
                "dCheck = distance(avg, texColor[6]);\n" +
                "if(dCheck < d){ d = dCheck; currentColor = texColor[6]; }\n" +
                "dCheck = distance(avg, texColor[7]);\n" +
                "if(dCheck < d){ d = dCheck; currentColor = texColor[7]; }\n" +
                "dCheck = distance(avg, texColor[8]);\n" +
                "if(dCheck < d){ d = dCheck; currentColor = texColor[8]; }\n" +
                "return currentColor;\n" +
                "}\n" +
                "void main(void){\n" +
                //"vec2 texPos = vTexPos * uTileDimension.zw;\n" +
                //"texPos += uTileDimension.xy;\n" +
                //"texPos = texPos / uTexDimension;\n" + 
                "gl_FragColor = scaled(vTexPos);\n" +
                "}");
        gl.useProgram(program);
        program.aVertPos = gl.getAttribLocation(program, "aVertPos");


        program.uScreen = gl.getUniformLocation(program, "uScreen");
        program.uDimension = gl.getUniformLocation(program, "uDimension");
        program.uTileDimension = gl.getUniformLocation(program, "uTileDimension");
        program.uTexDimension = gl.getUniformLocation(program, "uTexDimension");
        program.uTexture = gl.getUniformLocation(program, "uTexture");
        program.uScaleDist = gl.getUniformLocation(program, "uScaleDist");
        program.mOMatrix = gl.getUniformLocation(program, "mOMatrix");
        program.mRMatrix = gl.getUniformLocation(program, "mRMatrix");

        gl.uniform1i(program.uTexture, 0);
        gl.uniform1f(program.uScaleDist, 0.5);

        orthoMat = new Float32Array(16);
        generateOrtho(orthoMat, -1.0, 1.0, 1.0, -1.0, -1.0, -10.0);
        //generatePerspective(orthoMat, 90.0, 0.0, 100.0);
        gl.uniformMatrix4fv(program.mOMatrix, false, orthoMat);

        rotMat = new Float32Array(16);
        generateRotationMatrix(rotMat, 0.0);
        gl.uniformMatrix4fv(program.mRMatrix, false, rotMat);

        this.program = program;

        // Create the basic square buffer
        var vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        var verticies = [
            1.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            0.0, 0.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticies), gl.STATIC_DRAW);
        vBuffer.itemSize = 2;
        vBuffer.numItems = 4;

        this.vBuffer = vBuffer;

        gl.useProgram(textProgram);
        gl.enableVertexAttribArray(textProgram.aVertPos);
        gl.vertexAttribPointer(textProgram.aVertPos, vBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.useProgram(postProgram);
        gl.enableVertexAttribArray(postProgram.aVertPos);
        gl.vertexAttribPointer(postProgram.aVertPos, vBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.useProgram(waypointProgram);
        gl.enableVertexAttribArray(waypointProgram.aVertPos);
        gl.vertexAttribPointer(waypointProgram, vBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.useProgram(program);
        gl.enableVertexAttribArray(program.aVertPos);
        gl.vertexAttribPointer(program.aVertPos, vBuffer.itemSize, gl.FLOAT, false, 0, 0);

        this.resize(canvas.width, canvas.height);
    };
    ArcGLCanvasAdapter.prototype.loadTexture = function (image, flipY) {
        var gl = this.context;
        var texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, texture);
        //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        return texture;
    };
    ArcGLCanvasAdapter.prototype.updateImage = function(image) {
        let gl = this.context;

        if(!image.texture){
            image.texture = this.loadTexture(image);
        }else{
            gl.bindTexture(gl.TEXTURE_2D, image.texture);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
        }
    };
    ArcGLCanvasAdapter.prototype.drawImage = function (image, cx, cy, cwidth, cheight, x, y, width, height) {
        if (!image || !image.complete) {
            return;
        }

        var gl = this.context;
        var program = this.program;

        gl.uniform4f(program.uDimension, x, y, width, height);
        gl.uniform2f(program.uTexDimension, image.width, image.height);
        gl.uniform4f(program.uTileDimension, cx, cy, cwidth, cheight);

        gl.activeTexture(gl.TEXTURE0);
        if (!image.texture) {
            image.texture = this.loadTexture(image, false);
        }
        gl.bindTexture(gl.TEXTURE_2D, image.texture);

        gl.enableVertexAttribArray(program.aVertPos);
        gl.vertexAttribPointer(program.aVertPos, this.vBuffer.itemSize, gl.FLOAT, false, 0, 0);

        // Draws the polygon to the screen
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vBuffer.numItems);
        //gl.drawArrays(gl.TRIANGLES, 0, vBuffer.numItems);
    };
    ArcGLCanvasAdapter.prototype.requestFullscreen = function () {
        // Perform nothing at the moment
    };
    ArcGLCanvasAdapter.prototype.addTileSheet = function (name, url, tiles) {
        var __this = this;
        this.tileSheets[name] = new ArcTileSheet(name, url, tiles, function (t) {
            if (t.image.texture && t.image.texture !== null) {
                __this.context.deleteTexture(t.image.texture);
            }

            t.image.texture = __this.loadTexture(t.image, false);
        });
    };
    ArcGLCanvasAdapter.prototype.addExistingTileSheet = function (name, tileSheet) {
        var __this = this;

        tileSheet.onImageUpdate = function (t) {
            if (t.image.texture && t.image.texture !== null) {
                __this.context.deleteTexture(t.image.texture);
            }

            t.image.texture = __this.loadTexture(t.image, false);
        };

        this.tileSheets[name] = tileSheet;
    };
    ArcGLCanvasAdapter.prototype.addSpriteSheet = function (id, url, animations, palette) {
        var __this = this;
        var spriteSheet = new ArcSpriteSheet(url, function (s) {
            if (s.image.texture && s.image.texture !== null) {
                __this.context.deleteTexture(s.image.texture);
            }

            s.image.texture = __this.loadTexture(s.image, true);
        }, palette);

        for (var key in animations) {
            spriteSheet.setAnimation(key, animations[key]);
        }

        spriteSheet.id = id;
        this.spriteSheets[id] = spriteSheet;
    };
    ArcGLCanvasAdapter.prototype.addExistingSpriteSheet = function (id, spriteSheet) {
        var __this = this;

        spriteSheet.onImageUpdate = function (s) {
            if (s.image.texture && s.image.texture !== null) {
                __this.context.deleteTexture(s.image.texture);
            }
            s.image.texture = __this.loadTexture(s.image, true);
        };

        this.spriteSheets[id] = spriteSheet;
        spriteSheet.updateColorset();
    };
    ArcGLCanvasAdapter.prototype.clear = function () {
        var canvas = this.textCanvas;
        var gl = this.context;

        this.textContext.clearRect(0, 0, canvas.width, canvas.height);

        gl.useProgram(this.program);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.backbuffer);

        gl.clear(gl.COLOR_BUFFER_BIT);

    };
    ArcGLCanvasAdapter.prototype.drawWaypoint = function (waypointLoc) {
        var offset = this.camera.offset;
        var gl = this.context;

        var waypointProgram = this.waypointProgram;
        gl.useProgram(waypointProgram);
        gl.uniform4f(waypointProgram.uDimension, waypointLoc[0] - offset[0] - 32, waypointLoc[1] - offset[1] - 32, 64, 64);

        gl.enableVertexAttribArray(waypointProgram.aVertPos);
        gl.vertexAttribPointer(waypointProgram.aVertPos, this.vBuffer.itemSize, gl.FLOAT, false, 0, 0);

        //TODO: Add particle effects
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vBuffer.numItems);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.useProgram(this.program);
    };
    ArcGLCanvasAdapter.prototype.drawMessage = function (message, x, y, fontInfo, fillRect, fillColor) {
        var textContext = this.textContext;

        if (fontInfo == undefined) {
            fontInfo = this.defaultFontInfo;
        }

        textContext.font = fontInfo.font;
        textContext.textAlign = fontInfo.textAlign;
        textContext.fillStyle = fontInfo.fillStyle;

        textContext.fillText(message, x, y);
    };
    ArcGLCanvasAdapter.prototype.drawLine = function(x1, y1, x2, y2, color){
        var offset = this.camera.offset;
        var context = this.textContext;

        if(!(color)){
            color = "#0F0";
        };
        context.strokeStyle = color;

        context.beginPath();
        context.moveTo(x1 - offset[0], y1 - offset[1]);
        context.lineTo(x2 - offset[0], y2 - offset[1]);
        context.stroke();
    };
    ArcGLCanvasAdapter.prototype.drawPolygon = function(color, points, image){
        if (!image || !image.complete) {
            return;
        }

        var gl = this.context;
        var program = this.polygonProgram;
        var pointCount = points.length >> 2;
        var offset = this.camera.offset;

        gl.useProgram(program);

        gl.uniform4fv(program.uColor, color);
        gl.uniform2f(program.uOffset, offset[0], offset[1]);

        gl.activeTexture(gl.TEXTURE0);
        if (!image.texture) {
            image.texture = this.loadTexture(image, false);
        }
        gl.bindTexture(gl.TEXTURE_2D, image.texture);

        gl.bindBuffer(gl.ARRAY_BUFFER, program.bPointBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);

        gl.enableVertexAttribArray(program.aVertPos);
        gl.enableVertexAttribArray(program.aTexPos);

        gl.vertexAttribPointer(program.aVertPos, 2, gl.FLOAT, false, 16, 0);
        gl.vertexAttribPointer(program.aTexPos, 2, gl.FLOAT, false, 16, 8);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, pointCount);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.useProgram(this.program);
    };

    ArcGLCanvasAdapter.prototype.drawToDisplay = function (clearSwap) {
        var gl = this.context;
        var __this = this;
        var postProgram = this.postProgram;
        var vBuffer = this.vBuffer;

        gl.enableVertexAttribArray(postProgram.aVertPos);
        gl.vertexAttribPointer(postProgram.aVertPos, this.vBuffer.itemSize, gl.FLOAT, false, 0, 0);

        if (true) {
            drawNonBlurred.call(this, gl, true, postProgram, vBuffer);
        } else {
            drawBlurred.call(this, gl, true, postProgram, vBuffer);
        }

        // Write messages to the screen
        if(window.debugMode){
            swapMessageBuffer.call(this, gl, vBuffer); //TODO: Find a way to display this information without having to write to the texture each time.
        }
        //this.flatContext.drawImage(this.textCanvas, 0, 0);
    };
    ArcGLCanvasAdapter.prototype.resize = function (width, height) {
        ArcGraphicsAdapter.prototype.resize.call(this, width, height);

        var gl = this.context;

        gl.viewportWidth = width;
        gl.viewportHeight = height;

        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

        var postProgram = this.postProgram;
        gl.useProgram(postProgram);
        gl.uniform2f(postProgram.uSpace, 1.0 / width, 1.0 / height);

        var waypointProgram = this.waypointProgram;
        gl.useProgram(waypointProgram);
        gl.uniform2f(waypointProgram.uScreen, width, height);

        var polygonProgram = this.polygonProgram;
        gl.useProgram(polygonProgram);
        gl.uniform2f(polygonProgram.uScreen, width, height);

        var program = this.program;
        gl.useProgram(program);
        gl.uniform2f(program.uScreen, width, height);

        //Create the textbufferTexture
        gl.activeTexture(gl.TEXTURE2);
        this.textbufferTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.textbufferTexture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.textCanvas);

        // Create backbuffer
        gl.activeTexture(gl.TEXTURE1);
        this.backbuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.backbuffer);

        this.backbufferTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.backbufferTexture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.backbufferTexture, 0);


        gl.bindTexture(gl.TEXTURE_2D, this.backbufferTexture);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };
    ArcGLCanvasAdapter.prototype.setScaleDist = function (value) {
        var gl = this.context;
        var program = this.program;

        gl.useProgram(program);
        gl.uniform1f(program.uScaleDist, value);
    };
}

var ArcGL2CanvasAdapter = ArcBaseObject();
ArcGL2CanvasAdapter.prototype = Object.create(ArcGLCanvasAdapter.prototype);
ArcGL2CanvasAdapter.prototype.init = function(canvas) {
    ArcGraphicsAdapter.prototype.init.call(this);
    var textCanvas = document.createElement('canvas');
    $(textCanvas).css("background-color", "rgba(255, 0, 255, 0)");
    textCanvas.width = canvas.width;
    textCanvas.height = canvas.height;

    // Setup WebGL
    var gl;

    try {
        gl = canvas.getContext("webgl2");
    } catch (e) {
        throw("WebGL2 not supported.");
    }

    this.textCanvas = textCanvas;
    this.textContext = textCanvas.getContext('2d');
    this.program = null;
    this.waypointProgram = null;
    this.postProgram = null;
    this.textProgram = null;
    this.backbuffer = null;
    this.backbufferTexture = null;
    this.textbufferTexture = null;
    this.context = gl;
    this.vBuffer = null;
    this.size[0] = canvas.width;
    this.size[1] = canvas.height;
    this.canvas = canvas;

    this.initGL();
}

var ArcMobileCanvasAdapter = ArcBaseObject();
ArcMobileCanvasAdapter.prototype = Object.create(ArcCanvasAdapter.prototype);
ArcMobileCanvasAdapter.prototype.init = function (canvas) {
    ArcCanvasAdapter.prototype.init.call(this, canvas);

    // Context settings
    this.context.imageSmoothingEnabled = false;
};
ArcMobileCanvasAdapter.prototype.requestFullscreen = function () {
    var canvas = this.canvas;
    var backgroundCanvas = this.backgroundCanvas;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    $(canvas).css("position", "absolute");
    $(canvas).css("top", "0px");
    $(canvas).css("left", "0px");

    backgroundCanvas.width = canvas.width;
    backgroundCanvas.height = canvas.height;
    this.context = backgroundCanvas.getContext("2d");
};


function arcGetDisplayAdapter(canvas, useGL) {
    var adapter;

    var adapters = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 
        [ArcGL2CanvasAdapter, ArcGLCanvasAdapter, ArcCanvasAdapter] :
        [ArcCanvasAdapter];

    if (useGL) {
        var adapters = [ArcGL2CanvasAdapter, ArcGLCanvasAdapter, ArcCanvasAdapter];

        for(var i = 0; i < adapters.length; ++i){
            try{
                adapter = new adapters[i](canvas);
                break;
            }catch(e){
                console.log(e);
            }
        }
    } else {
        adapter = new ArcCanvasAdapter(canvas);
    }

    return adapter;
}
