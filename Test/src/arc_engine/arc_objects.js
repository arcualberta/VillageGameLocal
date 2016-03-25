function arcSortOutputTiles(o1, o2){
    return o1.y === o2.y ? o1.x - o2.x : o1.y - o2.y;
}

// // NOTE: Prototype methods were used for frequently used functions in order to speed up creation
// Object Base Creator. Code inspired from: http://ejohn.org/blog/simple-class-instantiation/#postcomment
function ArcBaseObject() {
    return function (args) {
        if (this instanceof arguments.callee) {
            if (typeof this.init === 'function') {
                this.init.apply(this, args != undefined ? (args.callee ? args : arguments) : null);
                /*this.cast = function(inObject){
                 console.log("Casting");
                 };*/
            }
        } else {
            return new arguments.callee(arguments);
        }
    };
}

// All objects that are renderable to the scene
var ArcRenderableObject = new ArcBaseObject();
ArcRenderableObject.prototype.init = function(tickEnabled, drawEnabled){
    this.children = {};
    this.tickEnabled = tickEnabled ? true : false; // This is done to handle undefined or null values
    this.drawEnabled = drawEnabled ? true : false; // This is done to handle undefined or null values
};
ArcRenderableObject.prototype.setChild = function(child, name){
    this.children[name] = child;
};
ArcRenderableObject.prototype.getChild = function(name){
  return this.children[name];  
};
ArcRenderableObject.prototype.removeChild = function(name){
    //delete this.children[i];
    this.children[i] = null; //TODO: Find out the better method
};
ArcRenderableObject.prototype.draw = function(displayContext, xOffset, yOffset, width, height){ // For now lets assume zoom is 1
    for (let key in this.children){
        let child = this.children[key];
        if(child.drawEnabled){
            child.draw(displayContext, xOffset, yOffset, width, height);
        }
    }
};
ArcRenderableObject.prototype.tick = function(deltaMilliseconds){
    for (let key in this.children){
        let child = this.children[key];
        if(child.tickEnabled){
            child.tick(deltaMilliseconds);
        }
    }
};

var ArcRenderableObjectCollection = ArcBaseObject();
ArcRenderableObjectCollection.prototype = Object.create(ArcRenderableObject.prototype);
ArcRenderableObjectCollection.prototype.init = function(tickEnabled, drawEnabled){
    ArcRenderableObject.prototype.init.call(this, tickEnabled, drawEnabled);
};

// Basic text renderable
var ArcRenderableText = ArcBaseObject();
ArcRenderableText.prototype = Object.create(ArcRenderableObject.prototype);
ArcRenderableText.prototype.init = function(text, fontInfo){
    ArcRenderableObject.prototype.init.call(this, false, true);
    this.text = text;
    this.fontInfo = fontInfo;
    this.offset = [0, 0];
};
ArcRenderableText.prototype.draw = function(displayContext, xOffset, yOffset, width, height){
    displayContext.drawMessage(this.text, xOffset + this.offset[0], yOffset + this.offset[1], this.fontInfo);
};

// Character waypoints
var ArcWaypoint = ArcBaseObject();
ArcWaypoint.prototype = Object.create(ArcRenderableObject.prototype);
ArcWaypoint.prototype.init = function(){
    ArcRenderableObject.prototype.init.call(this, false, true);
    this.location = [0, 0];
    this.isVisible = false;
};
ArcWaypoint.prototype.draw = function(displayContext, xOffset, yOffset, width, height){
    if(this.isVisible){
        displayContext.drawWaypoint(this.location);
    }
};

// Basic Character objects
var ArcCharacter = ArcBaseObject();
ArcCharacter.prototype = Object.create(ArcRenderableObject.prototype);
ArcCharacter.prototype.init = function(){
    ArcRenderableObject.prototype.init.call(this, true, true);
    
    this.location = [-100, -100];
    this.animation = "stand_down";
    this.frame = 0;
    this.frameTime = 0;
    this.spriteSheet = null;
    this.lastCollisionBox = [0, 0, 0, 0];
};
ArcCharacter.prototype.collisionBox = function () {
    // TODO: Make it based on frame size;
    var cb = this.lastCollisionBox;

    let frame = false;

    try {
        frame = this.spriteSheet.getAnimation(this.animation).frames[this.frame];
    } catch (ex) {
        console.log(ex);
    }

    if (frame) {
        let tileWidth = frame.width;
        let tileHalfWidth = (tileWidth >> 1) - 1;
        let tileHalfHeight = frame.height;

        cb[0] = this.location[0] - tileHalfWidth;
        cb[1] = this.location[1];
        cb[2] = tileWidth;
        cb[3] = tileHalfHeight;
    }

    return cb;
};
ArcCharacter.prototype.animateFrame = function (timeSinceLastFrame) {
    let frames = this.spriteSheet.getAnimation(this.animation).frames;
    let frame = frames[this.frame];
    this.frameTime += timeSinceLastFrame;

    while (this.frameTime > frame.frameTime) {
        ++this.frame;
        if (this.frame >= frames.length) {
            this.frame = 0;
        }

        this.frameTime -= this.frameTime;
        frame = frames[this.frame];
    }
};
ArcCharacter.prototype.setAnimation = function (animationName) {
    if (this.animation !== animationName) {
        this.animation = animationName;
        this.frame = 0;
        this.frameTime = 0;
    }
};
ArcCharacter.prototype.draw = function(displayContext, xOffset, yOffset, width, height){
    var spriteSheet = displayContext.spriteSheets[this.spriteSheet.id];
    var frame = spriteSheet.getAnimation(this.animation).frames[this.frame];
    
    var frameCenter = this.location[0] - xOffset;
    var frameTop = this.location[1] - frame.hHalf - yOffset;
    
    displayContext.drawImage(spriteSheet.image,
            frame.x, frame.y, frame.width, frame.height,
            frameCenter - frame.wHalf, frameTop,
            frame.drawWidth, frame.drawHeight);
};
ArcCharacter.prototype.tick = function(deltaMilliseconds){
    this.animateFrame(deltaMilliseconds);
    
    ArcRenderableObject.prototype.tick.call(this, deltaMilliseconds);
};

// ARC Generate TileMap from TiledCode
function arcGenerateFromTiledJSON(data, drawWidth, drawHeight) {
    var output = {
        tileset: null,
        layers: []
    };
    var index = 0;
    var tileset = data.tilesets[0];
    var imageUrl = tileset.image;
    var w = tileset.tilewidth;
    var h = tileset.tileheight;
    var tileWidth = Math.ceil(tileset.imagewidth / w);
    var tileHeight = Math.ceil(tileset.imageheight / h);
    var tileSize = tileHeight * tileWidth;
    var outTiles = new Array(tileSize);
    drawWidth = drawWidth ? drawWidth : w;
    drawHeight = drawHeight ? drawHeight : h;
    // Add any animated tiles
    for (var i in tileset.tiles) {
        var index = parseInt(i);
        var tile = tileset.tiles[i];
        if (tile.animation) {
            var animations = new ArcAnimation();
            for (var j in tile.animation) {
                var animation = tile.animation[j];
                var tileId = parseInt(animation.tileid);
                var y = Math.floor(tileId / tileWidth);
                var x = tileId - (y * tileWidth);
                y *= w;
                x *= h;
                animations.addFrame(x, y, tileWidth, tileHeight, animation.duration, false, false);
            }

            outTiles[index] = new ArcAnimatedTile(animations, true, false, i);
        }
    }

    var addTile = function (index) {
        if (index < 0 || outTiles[index]) {
            return;
        }

        var y = Math.floor(index / tileWidth);
        var x = index - (y * tileWidth);
        y *= w;
        x *= h;
        outTiles[index] = new ArcTile(x, y, w, h, true, false, i);
    };
    output.tileset = new ArcTileSheet(tileset.name, imageUrl, outTiles);
    // Load the map and add any extra tiles
    for (index = 0; index < data.layers.length; ++index) {
        var layer = data.layers[index];
        if (layer.type.toLowerCase() === 'tilelayer') {
            var outputLayer = new ArcTileMap(layer.name, layer.width, layer.height);
            outputLayer.setTileSheet(output.tileset, drawWidth, drawHeight);
            for (var i = 0; i < layer.data.length; ++i) {
                outputLayer.data[i] = layer.data[i] - 1;
                addTile(layer.data[i] - 1);
            }

            output.layers.push(outputLayer);
        }
    }

    // Add any tile properties
    for (var i in tileset.tileproperties) {
        var index = parseInt(i);
        var properties = tileset.tileproperties[i];
        var tile = outTiles[index];
        if (tile) {
            for (var p in properties) {
                var property = properties[p];
                switch (p) {
                    case 'walkable':
                        tile.walkable = property === 'true';
                        break;
                    case 'deleted':
                        tile.deleted = property === 'true';
                        break;
                    default:
                        tile[p] = property;
                }
            }
        }
    }

    return output;
}

// Code to upcale image
function arcGetPixel(input, x, y, outsideX, outsideY) {
    if (x < 0 || y < 0 || x >= outsideX || y >= outsideY || x >= input.width || y >= input.height) {
        return null;
    }

    var index = (x + (y * input.width)) << 2;
    return [
        input.data[index + 0],
        input.data[index + 1],
        input.data[index + 2],
        input.data[index + 3]
    ];
}

function arcScale2(input, output, x, y, width, height) {
    var outsideX = x + width;
    var outsideY = y + height;
    for (var v = y; v < y + height; ++v) {
        for (var u = x; u < x + width; ++u) {
// Calculate the pixels
            var A = getPixel(input, x, y - 1, outsideX, outsideY);
            var B = getPixel(input, x + 1, y, outsideX, outsideY);
            var C = getPixel(input, x - 1, y, outsideX, outsideY);
            var D = getPixel(input, x, y + 1, outsideX, outsideY);
            var P = getPixel(input, x, y, outsideX, outsideY);
            var out = [P, P, P, P];
            // Set the pixel data
            var indexList = [(x + (y * width)) << 3, 0, 0, 0];
            indexList[1] = indexList[0] + 4;
            indexList[2] = indexList[0] + (width << 3);
            indexList[3] = indexList[2] + 4;
            for (var index = 0; index < 4; ++index) {
                output.data[indexList[index] + 0] = out[index][0];
                output.data[indexList[index] + 1] = out[index][1];
                output.data[indexList[index] + 2] = out[index][2];
                output.data[indexList[index] + 3] = out[index][3];
            }
        }
    }
}

function arcUpscaleImage(amount, image, gridX, gridY) {
    var canvasIn = $("<canvas></canvas>")[0];
    canvasIn.width = image.width;
    canvasIn.height = image.height;
    var input = canvasIn.getContext("2d").getImageData(0, 0, canvasIn.width, canvasIn.height);
    var canvasOut = $("<canvas></canvas>")[0];
    canvasOut.width = image.width * amount;
    canvasOut.height = image.height * amount;
    var output = canvasOut.getContext("2d").getImageData(0, 0, canvasOut.width, canvasOut.height);
    for (var y = 0; y < image.height; y += gridY) {
        for (var x = 0; x < image.width; x += gridX) {
            switch (amount) {
                case 2:
                    return arcScale2(input, output, x, y, gridX, gridY);
                    break;
                default:
                    return image;
            }
        }
    }

    canvasOut.getContext("2d").putImageData(output, 0, 0);
    return canvasOut;
}

// Defining the quadtree class
// Tutorial from: http://gamedevelopment.tutsplus.com/tutorials/quick-tip-use-quadtrees-to-detect-likely-collisions-in-2d-space--gamedev-374
var QuadTree = ArcBaseObject();
QuadTree.prototype = Object.create(ArcRenderableObject.prototype);
QuadTree.prototype.init = function (x, y, width, height, level) {
    // We don't use the parent init because we donot wish to create more arrays
    this.tickEnabled = true;
    this.drawEnabled = true;
    
    this.level = level ? level : 0;
    this.bounds = [x, y, width, height, width / 2, height / 2];
    this.nodes = [null, null, null, null]; //Northwest, Northeast, Southeast, Southwest
    this.objects = []; // Objects fully contained in this area

};
QuadTree.prototype.MAX_OBJECTS = 5;
QuadTree.prototype.MAX_LEVELS = 10;
QuadTree.prototype.clear = function (onObjectClear) {
    var i = 0;
    var objects = this.objects;
    var nodes = this.nodes;
    // Clear the objects
    if (onObjectClear) {
        for (i = 0; i < objects.length; ++i) {
            onObjectClear(objects[i]);
        }
    }
    objects.length = 0;
    // Clear child nodes
    for (i = 0; i < 4; ++i) {
        if (nodes[i] !== null) {
            nodes[i].clear();
            nodes[i] = null;
        }
    }
};
QuadTree.prototype.split = function () {
    var halfWidth = this.bounds[4];
    var halfHeight = this.bounds[5];
    var x = this.bounds[0];
    var y = this.bounds[1];
    var level = this.level + 1;
    this.nodes[0] = new QuadTree(x + halfWidth, y, halfWidth, halfHeight, level);
    this.nodes[1] = new QuadTree(x, y, halfWidth, halfHeight, level);
    this.nodes[2] = new QuadTree(x, y + halfHeight, halfWidth, halfHeight, level);
    this.nodes[3] = new QuadTree(x + halfWidth, y + halfHeight, halfWidth, halfHeight, level);
};
QuadTree.prototype.getIndex = function (x, y, width, height) {
    var bounds = this.bounds;
    var hMid = bounds[0] + bounds[4];
    var vMid = bounds[1] + bounds[5];
    // Check if the object fits in the top and bottom quadtrants
    var fitNorth = (y + height) < vMid;
    var fitSouth = y >= vMid;
    // Check if the object fits on the left or right sides
    if ((x + width) < hMid) {
        if (fitNorth) {
            return 1;
        } else if (fitSouth) {
            return 2;
        }
    } else if (x >= hMid) {
        if (fitNorth) {
            return 0;
        } else if (fitSouth) {
            return 3;
        }
    }

    return -1;
};
QuadTree.prototype.insert = function (value) {
    var nodes = this.nodes;
    if (nodes[0] !== null) {
        var index = this.getIndex(value.position[0], value.position[1], value.size[0], value.size[1]);
        if (index > -1) {
            nodes[index].insert(value);
            return;
        }
    }

    this.objects.push(value);
    if (this.objects.length > this.MAX_OBJECTS && this.level < this.MAX_LEVELS) {
        if (this.nodes[0] === null) {
            this.split();
        }

        var i = 0;
        alert(i);
        while (i < this.objects.length) {
            var o = this.objects[i];
            var index = this.getIndex(o.position[0], o.position[1], o.size[0], o.size[1]);
            alert(index);
            if (index > -1) {
                this.objects.splice(i, 1);
                this.nodes[index].insert(o);
            } else {
                ++i;
            }
        }
    }
};
QuadTree.prototype.getObjects = function (x, y, width, height, returnObjects, executeFunction) {
    for (var i = 0; i < this.objects.length; ++i) {
        returnObjects.push(this.objects[i]);

        if (executeFunction) {
            executeFunction(this.objects[i]);
        }
    }

    var nodes = this.nodes;
    if (nodes[0] !== null) {
        var index = this.getIndex(x, y, width, height);
        if (index > -1) {
            returnObjects = returnObjects.concat(nodes[index].getObjects(x, y, width, height, returnObjects));
        } else {
            nodes[0].getObjects(x, y, width, height, returnObjects);
            nodes[1].getObjects(x, y, width, height, returnObjects);
            nodes[2].getObjects(x, y, width, height, returnObjects);
            nodes[3].getObjects(x, y, width, height, returnObjects);
        }
    }

    return returnObjects;
};
QuadTree.prototype.getByName = function (name) {
    var i = 0;
    for (; i < this.objects.length; ++i) {
        if (this.objects[i].name === name) {
            return this.objects[i];
        }
    }

    if (this.nodes[0] !== null) {
        for (i = 0; i < 4; ++i) {
            var result = this.nodes[i].getByName(name);
            if (result !== null) {
                return result;
            }
        }
    }

    return null;
};
QuadTree.ArrayBuffer = [];

// Special Quadtree for tiles
var ArcTileQuadTree = ArcBaseObject();
ArcTileQuadTree.prototype = Object.create(QuadTree.prototype);
ArcTileQuadTree.prototype.init = function (x, y, width, height, level, scroll) {
    QuadTree.prototype.init.call(this, x, y, width, height, level);
    
    this.scroll = scroll ? [scroll[0], scroll[1]] : null;
    this.offset = [0, 0];
    this.repeat = scroll && scroll !== null && (scroll[0] !== 0 || scroll[1] !== 0);
    this.searchStack = [];
};
ArcTileQuadTree.prototype.MIN_WIDTH = 80; // Min Patch size in pixels
ArcTileQuadTree.prototype.MIN_HEIGHT = 60; // Min Patch size in pixels
ArcTileQuadTree.prototype.SPLIT_CHECK = {
    isSplit: false,
    xSplits: [],
    ySplits: []
};
ArcTileQuadTree.prototype.split = function () {
    var halfWidth = this.bounds[4];
    var halfHeight = this.bounds[5];
    var x = this.bounds[0];
    var y = this.bounds[1];
    var level = this.level + 1;

    this.nodes[0] = new ArcTileQuadTree(x + halfWidth, y, halfWidth, halfHeight, level);
    this.nodes[1] = new ArcTileQuadTree(x, y, halfWidth, halfHeight, level);
    this.nodes[2] = new ArcTileQuadTree(x, y + halfHeight, halfWidth, halfHeight, level);
    this.nodes[3] = new ArcTileQuadTree(x + halfWidth, y + halfHeight, halfWidth, halfHeight, level);

    if (halfWidth > this.MIN_WIDTH && halfHeight > this.MIN_HEIGHT) {
        for (var i = 0; i < 4; ++i) {
            this.nodes[i].split();
        }
    }
};
ArcTileQuadTree.prototype.insertTile = function (tile, x, y, tileWidth, tileHeight) {
    this.insert({
        position: [x, y, x + tileWidth, y + tileHeight],
        size: [tileWidth, tileHeight],
        tile: tile
    });
};
ArcTileQuadTree.prototype.insert = function (value) {
    var nodes = this.nodes;
    if (nodes[0] !== null) {
        var index = this.getIndex(value.position[0], value.position[1], value.size[0], value.size[1]);
        if (index > -1) {
            nodes[index].insert(value);
            return;
        }
    }

    this.objects.push(value);
};
ArcTileQuadTree.prototype.calculateDrawSplit = function (x, y, width, height, offset, split) {
    // TODO: this needs to be calculated for repeating
    /*split.isSplit = false;
     
     // check xSplits
     var splits = split.xSplits;
     var i = null;
     splits.length = 0;
     if(x < 0){
     split.isSplit = true;
     i = x;
     while(i < 0){
     i += this.bounds[2];
     }
     splits.push(i);
     splits.push(this.bounds[2] - i);
     splits.push(0);
     
     }else if(x > this.bounds[2]){
     
     }*/
};
ArcTileQuadTree.prototype.getObjects = function (x, y, width, height, returnObjects, offset, repeat) {
    var nodeStack = this.searchStack;
    nodeStack.push(this);
    var node = null;
    var object = null;

    while ((node = nodeStack.pop()) != null) {
        if (offset && offset !== null) {
            node.offset[0] = offset[0];
            node.offset[1] = offset[1];
        }

        repeat = repeat ? true : node.repeat;

        // If this repeatable, split it up as needed
        if (repeat) {
            var bounds = node.bounds;
            var xCheck = x + node.offset[0];
            var yCheck = y + node.offset[1];

            if (xCheck < bounds[0]) {
                x += node.bounds[2];
            } else if (xCheck > node.bounds[0] + node.bounds[2]) {
                x -= node.bounds[2];
            }

            if (yCheck < bounds[1]) {
                y += node.bounds[3];
            } else if (yCheck > node.bounds[1] + node.bounds[3]) {
                y -= node.bounds[3];
            }
        }

        for (var i = 0; i < node.objects.length; ++i) {
            object = node.objects[i];
            if (object.tile.isDrawable) {
                returnObjects.push({
                    x: object.position[0] - node.offset[0],
                    y: object.position[1] - node.offset[1],
                    width: object.size[0],
                    height: object.size[1],
                    tile: object.tile.drawable(),
                    tileSheet: object.tile.tileSheetName
                });
            }
        }

        var nodes = node.nodes;
        if (nodes[0] !== null) {
            var index = node.getIndex(x + node.offset[0], y + node.offset[1], width, height);
//            if (index > -1) {
//                returnObjects = returnObjects.concat(nodes[index].getObjects(x, y, width, height, returnObjects, this.offset, repeat));
//            } else {
//                nodes[0].getObjects(x, y, width, height, returnObjects, this.offset, repeat);
//                nodes[1].getObjects(x, y, width, height, returnObjects, this.offset, repeat);
//                nodes[2].getObjects(x, y, width, height, returnObjects, this.offset, repeat);
//                nodes[3].getObjects(x, y, width, height, returnObjects, this.offset, repeat);
//            }
            if (index > -1) {
                nodeStack.push(nodes[index]);
            }else{
                nodeStack.push(nodes[0]);
                nodeStack.push(nodes[1]);
                nodeStack.push(nodes[2]);
                nodeStack.push(nodes[3]);
            }
        }
    }

    return returnObjects;
};
ArcTileQuadTree.prototype.isBlocked = function (x, y, width, height) {
    var i = 0;
    var checkObject = null;
    for (; i < this.objects.length; ++i) {
        checkObject = this.objects[i];
        if (!checkObject.tile.walkable) { //If not walkable, check if we overlap with it.
            if (x > checkObject.position[2] || (x + width) < checkObject.position[0]
                    || y > checkObject.position[3] || (y + height) < checkObject.position[1]) {
                // Does not overlap
            } else {
                return true;
            }
        }
    }

    var nodes = this.nodes;
    if (nodes[0] !== null) {
        var index = this.getIndex(x, y, width, height);
        if (index > -1) {
            return nodes[index].isBlocked(x, y, width, height);
        } else {
            for (i = 0; i < 4; ++i) {
                if (nodes[i].isBlocked(x, y, width, height)) {
                    return true;
                }
            }
        }
    }

    return false;
};
ArcTileQuadTree.prototype.tick = function (timeSinceLastFrame) {
    if (this.scroll !== null) {
        let width = this.bounds[2];
        let height = this.bounds[3];
        let offset = this.offset;
        let seconds = timeSinceLastFrame / 1000.0;
        offset[0] += (seconds * this.scroll[0]);
        offset[1] += (seconds * this.scroll[1]);

        // Reset the offsets as needed
        while (offset[0] < -width) {
            offset[0] += width;
        }
        while (offset[0] > width) {
            offset[0] -= width;
        }
        while (offset[1] < -height) {
            offset[1] += height;
        }
        while (offset[1] > height) {
            offset[1] -= height;
        }
    }
};
ArcTileQuadTree.prototype.draw = function(displayContext, xOffset, yOffset, width, height){
    let buffer= QuadTree.ArrayBuffer;
    buffer.length = 0;
    
    this.getObjects(xOffset, yOffset, width, height, buffer);
    buffer.sort(arcSortOutputTiles);
    
    displayContext.drawTileLayer(buffer);
}

/**
 *  Used to Describe a sound on the map.
 *  @param radius The radius of the sound. A radius of 0 or less means that the sound can be heard at all times.
 *  @param repeat A boolean value used to  describe whether or not the sound repeats.
 *  @param location The x and y location of the sound.
 **/
var ArcSound = ArcBaseObject();
ArcSound.prototype.init = function (name, radius, repeat, location, url) {
    this.name = name;
    this.radius = 1.0 / radius;
    this.loop = repeat;
    this.location = location;
    this.volume = 1.0;
    this.url = url;
    this.source = null;
    this.gain = null;
};
// Used to describe one frame of animation
var ArcAnimation = ArcBaseObject();
ArcAnimation.prototype.init = function () {
    this.frames = [];
    this.length = this.frames.length;
};
ArcAnimation.prototype.addFrame = function (x, y, width, height, frameTime, flipX, flipY, drawWidth, drawHeight) {
    this.frames.push({
        x: x, // X location on the sprite sheet
        y: y, // Y location on the sprite sheet
        width: width, // The width of the sprite on the sprite sheet
        height: height, // The height of the sprite on the sprite sheet
        wHalf: drawWidth ? drawWidth >> 1 : width, //width / 2,
        hHalf: drawHeight ? drawHeight >> 1 : height, //height / 2,
        drawWidth: drawWidth ? drawWidth : width << 1, // For now sprite sheets are double the scale
        drawHeight: drawHeight ? drawHeight : height << 1,
        frameTime: frameTime, // Time until the next frame
        flipX: flipX,
        flipY: flipY
    });
    this.length = this.frames.length;
};
// An image containing all animation frames of an object
var ArcSpriteSheet = ArcBaseObject();
ArcSpriteSheet.prototype.init = function (imageUrl, imageUpdateFunc, palette) {
    var _this = this;
    this.id = null;
    this.baseImage = imageUrl ? new Image() : null;
    this.image = null;
    this.animations = {};
    this.palette = palette ? palette : {};
    this.onImageUpdate = imageUpdateFunc;
    if (imageUrl) {
        /*spriteSheet.image.onload = function(){
         spriteSheet.image = upscaleImage(2, spriteSheet.image, 16, 24);
         };*/


        this.baseImage.onload = function () {
            var dim = [_this.baseImage.width, _this.baseImage.height];
            _this.image = $("<canvas></canvas>")[0];
            _this.image.width = dim[0];
            _this.image.height = dim[1];
            _this.dimension = dim;
            _this.context = _this.image.getContext("2d");
            _this.updateColorset();
            _this.image.complete = true;
        };
        this.baseImage.src = imageUrl;
    }
};
ArcSpriteSheet.prototype.copy = function () {
    var spriteSheet = new ArcSpriteSheet(this.baseImage.src, false, JSON.parse(JSON.stringify(this.palette)));
    spriteSheet.id = this.id;
    spriteSheet.animations = this.animations;
    return spriteSheet;
};
ArcSpriteSheet.prototype.setPalette = function (palette) {
    this.palette = palette;
};
ArcSpriteSheet.prototype.setAnimation = function (name, animation) {
    this.animations[name] = animation;
};
ArcSpriteSheet.prototype.getAnimation = function (name) {
    return this.animations[name];
};
ArcSpriteSheet.prototype.getSimpleAnimations = function () {
    var animations = {};
    for (var key in this.animations) {
        var animation = {
            frames: this.getAnimation(key).frames
        };
        animations[key] = animation;
    }

    return animations;
};
ArcSpriteSheet.prototype.getSimple = function () {
    return {
        id: this.id,
        image: this.baseImage.src,
        animations: this.getSimpleAnimations(),
        palette: this.palette
    };
};
ArcSpriteSheet.prototype.updateColorset = function () {
    var image = this.baseImage;
    if (image !== null) {
        var ctx = this.context;
        ctx.drawImage(image, 0, 0);
        var imgData = ctx.getImageData(0, 0, this.dimension[0], this.dimension[1]);
        var data = imgData.data;
        for (var i = 0; i < data.length; i += 4) {
            var result = data[i + 0];
            result = (result << 8) + data[i + 1];
            result = (result << 8) + data[i + 2];
            var p = this.palette[result];
            if (p) {
                data[i + 0] = p.r;
                data[i + 1] = p.g;
                data[i + 2] = p.b;
            }
        }

        ctx.putImageData(imgData, 0, 0);
        if (this.onImageUpdate) {
            this.onImageUpdate(this);
        }
    }
    ;
};
// An image containing all possible tile images
var ArcTileSheet = ArcBaseObject();
ArcTileSheet.prototype.init = function (name, imageUrl, tiles, imageLoadFunc, firstGid, tileWidth, tileHeight, doNotLoadImage, imageWidth, imageHeight) {
    var _this = this;
    this.image = doNotLoadImage ? null : new Image();
    this.imageUrl = imageUrl;
    this.tiles = tiles;
    this.name = name;
    this.firstGid = firstGid ? firstGid : 0;
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.imageWidth = imageWidth;
    this.imageHeight = imageHeight;
    if (doNotLoadImage) {

    } else {
        if (imageLoadFunc) {
            this.image.onload = function () {
                this.imageWidth = _this.image.width;
                this.imageHeight = _this.image.height;
                imageLoadFunc(_this);
            };
        }

        this.image.src = imageUrl;
    }
};
ArcTileSheet.prototype.update = function (timeSinceLastFrame) {
    for (var i = 0; i < this.tiles.length; ++i) {
        var tile = this.tiles[i];
        if (tile && tile !== null) {
            tile.update(timeSinceLastFrame);
        }

        if (this.imageLoadFunc) {
            this.imageLoadFunc(this);
        }
    }
};
// A single tile
var ArcTile = ArcBaseObject();
ArcTile.prototype.init = function (x, y, width, height, walkable, deleted, name) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.walkable = walkable;
    this.deleted = deleted;
    this.name = name;
    this.tileSheetName = "";
    this.isDrawable = true;
};
ArcTile.prototype.drawable = function () {
    return {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height
    };
};
ArcTile.prototype.update = function (timeSinceLastFrame) {

};
ArcTile.prototype.getState = function () {
    return this;
};
// A single animated tile.
var ArcAnimatedTile = ArcBaseObject();
ArcAnimatedTile.prototype.init = function (animation, walkable, deleted, name) {
    this.animation = animation;
    this.frame = 0;
    this.frameTime = 0;
    this.walkable = walkable;
    this.deleted = deleted;
    this.name = name;
    this.tileSheetName = "";
    this.isDrawable = true;
};
ArcAnimatedTile.prototype.update = function (timeSinceLastFrame) {
    var frame = this.animation.frames[this.frame];
    this.frameTime += timeSinceLastFrame;
    while (this.frameTime > frame.frameTime) {
        ++this.frame;
        if (this.frame >= this.animation.length) {
            this.frame = 0;
        }

        this.frameTime -= frame.frameTime;
    }
};
ArcAnimatedTile.prototype.getState = function () {
    return this.animation.frames[this.frame];
};
ArcAnimatedTile.prototype.drawable = function () {
    var frame = this.getState();
    return {
        x: frame.x,
        y: frame.y,
        width: frame.width,
        height: frame.height
    };
};
// The base object for a tiled image.
// Note: This will be used for the village.
var ArcTileMap = new ArcBaseObject();
ArcTileMap.prototype = Object.create(ArcRenderableObject.prototype);
ArcTileMap.prototype.init = function (name, width, height, tileWidth, tileHeight, scrollX, scrollY) {
    this.tickEnabled = true;
    this.drawEnabled = true;
    
    this.dimension = new Uint16Array([width, height]);
    this.tileSheets = null;
    this.tileDimension = new Uint8Array([tileWidth, tileHeight]);
    this.name = name;

    // Setup the quadtree and any scrolling
    var scroll = [0, 0];

    if (scrollX && scrollX !== null) {
        scroll[0] = scrollX;
    }

    if (scrollY && scrollY !== null) {
        scroll[1] = scrollY;
    }
    this.data = new ArcTileQuadTree(0, 0, width * tileWidth, height * tileHeight, 0, scroll);

    this.data.split();
};
ArcTileMap.prototype.setTile = function (tile, x, y, tileWidth, tileHeight) {
    this.data.insertTile(tile, x, y, tileWidth, tileHeight);
};
ArcTileMap.prototype.setTileSheet = function (tileSheets, tileWidth, tileHeight) {
    this.tileSheets = tileSheets;
    this.tileDimension[0] = tileWidth;
    this.tileDimension[1] = tileHeight;
};
ArcTileMap.prototype.getClosestTileCoord = function (pixelX, pixelY) {
    return [Math.round(pixelX / this.tileWidth), Math.round(pixelY / this.tileHeight)];
};
ArcTileMap.prototype.getTile = function (x, y) {
    var i = (y * this.dimension[0]) * x;
    var index = this.data[i];
    if (index >= 0) {
        return this.tileSheet[index];
    }

    return null;
};
ArcTileMap.prototype.isBlocked = function (x, y, width, height) {
    return this.data.isBlocked(x, y, width, height);
};
ArcTileMap.prototype.draw = function(displayContext, xOffset, yOffset, width, height){
    this.data.draw(displayContext, xOffset, yOffset, width, height);
}
ArcTileMap.prototype.tick = function(deltaMilliseconds){
    this.data.tick(deltaMilliseconds);
}
/*ArcTileMap.prototype.isBlocked = function (x, y, w, h) {
 var tileSheet = this.tileSheet;
 if (tileSheet !== null) {
 var dim = this.tileDimension;
 var width = this.dimension[0];
 var height = this.dimension[1];
 var t1 = [
 Math.max(Math.floor(x / dim[0]), 0),
 Math.max(Math.floor(y / dim[1]), 0)];
 var t2 = [
 Math.min(Math.ceil((x + w) / dim[0]), width),
 Math.min(Math.ceil((y + h) / dim[1]), height)];
 for (var v = t1[1]; v < t2[1]; ++v) {
 for (var u = t1[0]; u < t2[0]; ++u) {
 var index = u + (v * width);
 if (index > 0 && index < this.data.length) {
 var checkIndex = this.data[index];
 if (checkIndex > -1 && !this.tileSheet.tiles[checkIndex].walkable) {
 return true;
 }
 }
 
 //last[0] = u;
 //last[1] = v;
 }
 }
 }
 
 return false; //[ex, ey];
 };*/