/**
* Sorts tiles on the screen so that they appear in a top down fashion. This makes objects closer to the bottom of the screen occlude objects near the top.
*/
var sortOutputTiles = (function(){ // NOTE: This currently does not work because it requires overwriting the check value.
    function horizontalMerge(array, i1, i2){
        let o1 = array[i1];
        let o2 = array[i2];
        
        if (o1 == null){
            return -1;
        }else if(o2 == null){
            return 1;
        }
        
        if (o1.tileSheet == o2.tileSheet && o1.y == o2.y && o1.height == o2.height){
            if (o1.x == o2.x + o2.width && o1.tile.x == o2.tile.x + o2.tile.width){
                o2.width += o1.width;
                o2.tile.width += o1.tile.width;
                array[i1] = null;
                return -1;
            } else if (o2.x == o1.x + o1.width && o2.tile.x == o1.tile.x + o1.tile.width){
                o1.width += o2.width;
                o1.tile.width += o2.tile.width;
                array[i2] = o1;
                array[i1] = null;
                return -1;
            }
        }

        return o1.x - o2.x;// o1.y === o2.y ? o1.x - o2.x : o1.y - o2.y;
    }
    
    function verticalMerge(array, i1, i2){
        let o1 = array[i1];
        let o2 = array[i2];
        
        if (o1 == null){
            return -1;
        }else if(o2 == null){
            return 1;
        }
        
        if (o1.tileSheet == o2.tileSheet && o1.x == o2.x && o1.width == o2.width){
            if (o1.y == o2.y + o2.height && o1.tile.y == o2.tile.y + o2.tile.height){
                o2.height += o1.height;
                o2.tile.height += o1.tile.height;
                array[i1] = null;
                return -1;
            } else if (o2.y == o1.y + o1.height && o2.tile.y == o1.tile.y + o1.tile.height){
                o1.height += o2.height;
                o1.tile.height += o2.tile.height;
                array[i2] = null;
                return 1;
            }
        }

        return o1.y - o2.y;// o1.y === o2.y ? o1.x - o2.x : o1.y - o2.y;
    }
    
    function partition(array, left, right, compareFunc){
        let compare = right - 1;
        let minEnd = left;
        let maxEnd, result;
        
        for(maxEnd = left; maxEnd < compare; ++maxEnd){
            result = compareFunc(array, maxEnd, compare);
            if(result < 0){
                swap(array, maxEnd, minEnd);
                ++minEnd;
            }
        }
        swap(array, minEnd, compare);
        return minEnd;
    }
    
    function swap(array, i, j){
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
        return array;
    }
    
    function quickSort(array, left, right, compareFunc){
        let p = null;
        
        if(left < right){
            p = partition(array, left, right, compareFunc);
            quickSort(array, left, p, compareFunc);
            quickSort(array, p + 1, right, compareFunc);
        }
        
        return array;
    }
    
    function removeNulls(array){
        let index = 0;
        let count = 0;
        
        for(index = 0; index < array.length; ++index){
            if(array[index] == null){
                ++count;
            }else{
                if(count > 0){
                    array.splice(0, count);
                }
                return;
            }
        }
    }
    
    return function(array){
        quickSort(array, 0, array.length, horizontalMerge);
//        removeNulls(array);
        
        return array;
    }
}());

function arcVerticalMergeOutputTiles(o1, o2){
    if(o1 == null || o2 == null){
        return 0;
    };
    
    if(o1.tileSheet == o2.tileSheet && o1.x == o2.x && o1.width == o2.width){
        if(o2.y < o1.y && o1.tile.y == o2.tile.y + o2.tile.height){
            o2.height += o1.height;
            o2.tile.height += o1.tile.height;
            o1 = null;
            
            return -1;
        }else if(o2.x > o1.x && o2.tile.x == o1.tile.x + o1.tile.height){
            o1.height += o2.height;
            o1.tile.height += o2.tile.height;
            o2 = null;
            
            return 1;
        }
    }
    
    return o1.y === o2.y ? o1.x - o2.x : o1.y - o2.y;
}

function arcSortOutputTiles(o1, o2){
    if(o1 == null || o2 == null){
        return 0;
    };
    
    return o1.y === o2.y ? o1.x - o2.x : o1.y - o2.y;
}

/**
* Represents the base object in the arc engine. Code inspired from: http://ejohn.org/blog/simple-class-instantiation/#postcomment
* @class
*/
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

/**
* An object used to attach multiple scripting funcitons to a class.
* @class
* @implements {ArcBaseObject}
* @param {Object} attachObject The base object type to attache the script functions to.
*/
var ArcScriptObject = new ArcBaseObject();
ArcScriptObject.prototype.init = function(attachObject){
    /**
    * The base object to link all functions to.
    * @member
    */
	this.attachObject = attachObject;
};
/**
* Adds a scriptable function to the list of all functions viable to the attached object.
* @param {string} func The name of the function to attach.
*/
ArcScriptObject.prototype.AttachFunction = function(func){
	this.attachObject[func] = this[func];
};

/**
* The base interface to handle draw, tick, interact, unload and click events.
* @interface
*/
var ArcEventObject = new ArcBaseObject();
ArcEventObject.prototype.init = function(){

};
/**
* Checks if a rectangular area obverlaps with this object.
* @param {Number} left
* @param {Number} top
* @param {Number} right
* @param {Number} bottom
*/
ArcEventObject.prototype.inLocation = function(left, top, right, bottom){
    return true;
};
/**
* Event triggered beofre the object is deleted.
*/
ArcEventObject.prototype.unload = function(){

};
/**
* Draws the object.
* @param {ArcGraphicsAdapter} displayContext The display context used for drawing
* @param {Number} xOffset The horizontal screen offset. 
* @param {Number} yOffset The verticle screen offset. 
* @param {int} width The visible width.
* @param {int} height The visible height.
*/
ArcEventObject.prototype.draw = function(displayContext, xOffset, yOffset, width, height){ // For now lets assume zoom is 1

};
/**
* An operation to be performed on the object for every frame tick.
* @param {Number} deltaMilliseconds The time between this frame and the last in milliseconds.
*/
ArcEventObject.prototype.tick = function(deltaMilliseconds){

};
/**
* An operation to handle the click event for the object at the given scoordinates.
* @param {Number} x Map space x coordinate.
* @param {Number} y Map space y coordinate.
*/
ArcEventObject.prototype.click = function(x, y){

};
/**
* An operation fo handle the interact event given a specified area.
* @param {Number} left
* @param {Number} top
* @param {Number} right
* @param {Number} bottom
*/
ArcEventObject.prototype.interact = function(left, top, right, bottom){

};

/**
* All objects that are renderable to the scene.
* @class
* @implements {ArcEventObject}
* @param {bool} tickEnabled States if the tick function is enabled.
* @param {bool} drawEnabled States if the draw function is enabled.
*/
var ArcRenderableObject = new ArcBaseObject();
ArcRenderableObject.prototype.init = function(tickEnabled, drawEnabled){
    this.children = [];
    this.tickEnabled = tickEnabled ? true : false; // This is done to handle undefined or null values
    this.drawEnabled = drawEnabled ? true : false; // This is done to handle undefined or null values
    this.clickEnabled = false;
    this.interactEnabled = false;
    this.name = null;
    this.location = new Float32Array(6);
    this.size = new Uint16Array(4);
};
/**
* @override
*/
ArcRenderableObject.prototype.inLocation = function(left, top, right, bottom){
    let loc = this.location;
    return !(
        right < loc[0] ||
        left > loc[2] ||
        bottom < loc[1] ||
        top > loc[3]
    ); 
};
/**
* Sets the location of the object. This will reset the location member.
* @param {Number} x
* @param {Number} y
*/
ArcRenderableObject.prototype.updateLocation = function(x, y){
    let loc = this.location;
    let size = this.size;

    loc[0] = x - size[2];
    loc[1] = y - size[3];
    loc[2] = loc[0] + size[0];
    loc[3] = loc[1] + size[1];
    loc[4] = x;
    loc[5] = y;
};
/**
* Set the size of the object. The location is then updated to reflect the new size.
* @param {int} width
* @param {int} height
*/
ArcRenderableObject.prototype.updateSize = function(width, height){
    this.size[0] = width;
    this.size[1] = height;
    this.size[2] = width >> 1;
    this.size[3] = height >> 1;

    this.updateLocation(this.location[4], this.location[5]);
};
/**
* Adds a child element to the object.
* @param {ArcRenderableObject} child The child to be added
* @param {string} name The unique name of the child object.
*/
ArcRenderableObject.prototype.addChild = function(child, name){
    var c = this.indexOfChild(name);
    child.name = name;

    if(c < 0){
        this.children.push(child);
    }else{
        this.children[c] = child;
    }
};
/**
* @param {string} name The unique name of the child object
* @return {int} The index location of the child object. If no object exists then -1 is returned.
*/
ArcRenderableObject.prototype.indexOfChild = function(name){
    for(var i in this.children){
        if(this.children[i].name === name){
            return i;
        }
    }

    return -1;
};
/**
* @param {string} name The unique name of the child object
* @return {ArcRenderableObject} The child with the specified name. If no child exists, null is returned.
*/
ArcRenderableObject.prototype.getChild = function(name){
    for(var i in this.children){
        if(this.children[i].name === name){
            return this.children[i];
        }
    }

    return null;
};
/**
* Removes the child object with the given name.
* @param {string} name The unique name of the child object
*/
ArcRenderableObject.prototype.removeChild = function(name){
    //delete this.children[i];
    var childIndex = this.indexOfChild(name);
    if(childIndex > 0){
        var child = this.children[childIndex];
        child.unload();
        this.children.splice(childIndex, 1);
    }
};
/**
* Performs any operations that must be done on this object and its children when removing.
* @override
*/
ArcRenderableObject.prototype.unload = function(){
    for (let key in this.children){
        let child = this.children[key];
        if(child.drawEnabled){
            child.unload();
        }
    }
};
/**
* Draws the object and all child objects.
* @param {ArcGraphicsAdapter} displayContext The display context used for drawing
* @param {Number} xOffset The horizontal screen offset. 
* @param {Number} yOffset The verticle screen offset. 
* @param {int} width The visible width.
* @param {int} height The visible height.
* @override
*/
ArcRenderableObject.prototype.draw = function(displayContext, xOffset, yOffset, width, height){ // For now lets assume zoom is 1
    let child, key;

    for (key in this.children){
        child = this.children[key];
        if(child.drawEnabled){
            child.draw(displayContext, xOffset, yOffset, width, height);
        }
    }
};
/**
* An operation to be performed on the object and it's children for every frame tick.
* @param {Number} deltaMilliseconds The time between this frame and the last in milliseconds.
* @override
*/
ArcRenderableObject.prototype.tick = function(deltaMilliseconds){
    let child, key;

    for (key in this.children){
        child = this.children[key];
        if(child.tickEnabled){
            child.tick.apply(child, arguments);
        }
    }
};
/**
* An operation to handle the click event for the object and children at the given scoordinates.
* @param {Number} x Map space x coordinate.
* @param {Number} y Map space y coordinate.
* @override
*/
ArcRenderableObject.prototype.click = function(x, y){
    let child, key;

    for (key in this.children){
        child = this.children[key];
        if(child.clickEnabled){
            child.click.apply(child, arguments);
        }
    }
};
/**
* @override
*/
ArcRenderableObject.prototype.interact = function(left, top, right, bottom){
    let child, key;

    for (key in this.children){
        child = this.children[key];
        if(child.interactEnabled){
            child.interact.apply(child, arguments);
        }
    }
};

var ArcRenderableObjectCollection = ArcBaseObject();
ArcRenderableObjectCollection.prototype = Object.create(ArcRenderableObject.prototype);
ArcRenderableObjectCollection.prototype.init = function(tickEnabled, drawEnabled){
    ArcRenderableObject.prototype.init.call(this, tickEnabled, drawEnabled);
};
ArcRenderableObjectCollection.prototype.sort = function(sortFunction){
    this.children.sort(sortFunction);
};
ArcRenderableObjectCollection.prototype.drawWhile = function(drawFunction){
    let child = null;
    let index = 0;
    while(index < this.children.length && drawFunction(child = this.children[index])){
       ++index;
    }
    
    return child(index - 1);
};


/**
* Basic text renderable
* @class
* @implements {ArcRenderableObject}
* @param {string} text The string of text to be rendered.
* @param {string} fontInfo The css style used to display the text. 
*/
var ArcRenderableText = ArcBaseObject();
ArcRenderableText.prototype = Object.create(ArcRenderableObject.prototype);
ArcRenderableText.prototype.init = function(text, fontInfo){
    ArcRenderableObject.prototype.init.call(this, false, true);
    this.text = text;
    this.fontInfo = fontInfo;
    this.offset = [0, 0];
};
/**
* @override
*/
ArcRenderableText.prototype.draw = function(displayContext, xOffset, yOffset, width, height){
    displayContext.drawMessage(this.text, xOffset + this.offset[0], yOffset + this.offset[1], this.fontInfo);
};

/**
* Character waypoints
* @class
* @implements {ArcRenderableObject}
*/
var ArcWaypoint = ArcBaseObject();
ArcWaypoint.prototype = Object.create(ArcRenderableObject.prototype);
ArcWaypoint.prototype.init = function(){
    ArcRenderableObject.prototype.init.call(this, false, true);
    this.isVisible = false;
};
/**
* @override
*/
ArcWaypoint.prototype.draw = function(displayContext, xOffset, yOffset, width, height){
    if(this.isVisible){
        displayContext.drawWaypoint(this.location);
    }
};

/**
* We are using actor to define any noun object on a Renderable Object.
* @class
* @implements {ArcRenderableObject}
*/
var ArcActor = ArcBaseObject();
ArcActor.prototype = Object.create(ArcRenderableObject.prototype);
ArcActor.prototype.init = function(tickEnabled, drawEnabled, useChildren){
    ArcRenderableObject.prototype.init.call(this, tickEnabled, drawEnabled);
    
    this.tickEnabled = tickEnabled ? true : false; // This is done to handle undefined or null values
    this.drawEnabled = drawEnabled ? true : false; // This is done to handle undefined or null values
    this.interactRad = 8;
    this.dynamicInteract = true;

    // TODO: check if objects interect through the circle.
};
/**
* @override
*/
ArcActor.prototype.updateSize = function(w, h){
    ArcRenderableObject.prototype.updateSize.apply(this, arguments);

    if(this.dynamicInteract){
        let a = this.size[2];
        let b = this.size[3];

        this.interactRad = Math.sqrt((a * a) + (b * b));
    }
};


/**
* Basic Character objects
* @class
* @implements {ArcActor}
*/
var ArcCharacter = ArcBaseObject();
ArcCharacter.prototype = Object.create(ArcActor.prototype);
ArcCharacter.prototype.init = function(){
    ArcActor.prototype.init.call(this, true, true);
    this.animation = "stand_down";
    this.frame = 0;
    this.frameTime = 0;
    this.spriteSheet = null;
    this.lastCollisionBox = [0, 0, 0, 0];
};
/**
* @override
*/
ArcCharacter.prototype.inLocation = function(left, top, right, bottom){
    let x = this.location[4];
    let y = this.location[5];

    if(x > right) x = right;
    if(x < left) x = left;
    if(y > bottom) y = bottom;
    if(y < top) y = top;

    x -= this.location[4];
    y -= this.location[5];

    return Math.sqrt((x * x) + (y * y)) < this.interactRad;
};
/**
* @override
*/
ArcCharacter.prototype.updateSize = function(width, height){
    if(width != this.size[0] || height != this.size[1]){
        ArcActor.prototype.updateSize.call(this, width, height);
    }
};
/**
* @return {Array} The collision box for the character at the current location.
*/
ArcCharacter.prototype.collisionBox = function () {
    // TODO: Make it based on frame size;
    var cb = this.lastCollisionBox;

    cb[0] = this.location[0];
    cb[1] = this.location[1] + this.size[3]; // Verticle center
    cb[2] = this.size[0];
    cb[3] = this.size[3];

    return cb;
};
/**
* Calculates which frame of animation the character is in.
* @param {Number} timeSinceLastFrame The time, in milliseconds, since the last page refresh.
*/
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

    if(frame){
        this.updateSize(frame.drawWidth, frame.drawHeight);
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
    
    
    displayContext.drawImage(spriteSheet.image,
            frame.x, frame.y, frame.width, frame.height,
            this.location[0], this.location[1],
            frame.drawWidth, frame.drawHeight);
};
ArcCharacter.prototype.tick = function(deltaMilliseconds){
    this.animateFrame(deltaMilliseconds);
    
    ArcActor.prototype.tick.apply(this, arguments);
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

function arcDistance(loc1, loc2){
    return Math.sqrt(Math.pow(loc1[0] - loc2[0], 2.0) + Math.pow(loc1[1] - loc2[1], 2.0));
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
    ArcRenderableObject.prototype.init.call(this, true, true);
    // We don't use the parent init because we do not wish to create more arrays
    this.tickEnabled = true;
    this.drawEnabled = true;
    this.clickEnabled = true;
    this.interactEnabled = true;
    
    this.level = level ? level : 0;
    this.nodes = [null, null, null, null]; //Northwest, Northeast, Southeast, Southwest
    this.objects = []; // Objects fully contained in this area
    this.halfSize = [width / 2, height / 2];

    this.updateSize(width, height);

    this.updateLocation(x, y)
};
QuadTree.prototype.updateLocation = function(x, y){
    this.location[0] = x;
    this.location[1] = y;
    this.location[2] = x + this.size[0];
    this.location[3] = y + this.size[1];
    this.location[4] = x + this.size[2];
    this.location[5] = y + this.size[3];
};
QuadTree.prototype.unload = function(){
    this.clear();
}
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
    var halfWidth = this.halfSize[0];
    var halfHeight = this.halfSize[1];
    var x = this.location[0];
    var y = this.location[1];
    var level = this.level + 1;
    this.nodes[0] = new QuadTree(x + halfWidth, y, halfWidth, halfHeight, level);
    this.nodes[1] = new QuadTree(x, y, halfWidth, halfHeight, level);
    this.nodes[2] = new QuadTree(x, y + halfHeight, halfWidth, halfHeight, level);
    this.nodes[3] = new QuadTree(x + halfWidth, y + halfHeight, halfWidth, halfHeight, level);
};
QuadTree.prototype.getIndex = function (x, y, width, height) {
    let bounds = this.location;
    let hMid = bounds[0] + this.halfSize[0];
    let vMid = bounds[1] + this.halfSize[1];
    
    // Check if the object fits in the top and bottom quadtrants
    let fitNorth = (y + height) < vMid;
    let fitSouth = y >= vMid;
    
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
QuadTree.prototype.isInside = function(value){
    return value.inLocation(this.location[0], this.location[1], this.location[3], this.location[4]);
};
QuadTree.prototype.recalculate = function(buffer) {
    let nodes = this.nodes;
    let isEmpty = true;
    let i;
    let addedToBuffer = false;
    var obj;

    // Recalcualte nodes
    if (nodes[0] !== null) {
        isEmpty = nodes[0].recalculate(buffer);
        isEmpty = nodes[1].recalculate(buffer) && isEmpty;
        isEmpty = nodes[2].recalculate(buffer) && isEmpty;
        isEmpty = nodes[3].recalculate(buffer) && isEmpty;

        if(isEmpty){
            nodes[0] = null;
            nodes[1] = null;
            nodes[2] = null;
            nodes[3] = null;
        }
    }

    // Calculate if our objects are still inside
    if(this.objects.length > 0){
        for(i = this.objects.length - 1; i >= 0; --i){
            obj = this.objects[i];

            if(!this.isInside(obj)){
                buffer.push(obj);
                this.objects.splice(i, 1);
                addedToBuffer = true;
            }
        }
    }

    if(!addedToBuffer && buffer.length > 0){
        for(i = buffer.length - 1; i >= 0; --i){
            obj = buffer.pop();

            // Go until we find one that we cannot insert.
            if(this.isInside(obj)){
                this.insert(obj);
            }else{
                buffer.push(obj)
                break;
            }
        }
    }


    return nodes[0] === null && this.objects.length < 1;
};
QuadTree.prototype.insert = function (value) {
    var nodes = this.nodes;
    if (nodes[0] !== null) {
        var index = this.getIndex(value.location[0], value.location[1], value.size[0], value.size[1]);
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
        while (i < this.objects.length) {
            var o = this.objects[i];
            var index = this.getIndex(o.location[0], o.location[1], o.size[0], o.size[1]);
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
            returnObjects = returnObjects.concat(nodes[index].getObjects(x, y, width, height, returnObjects, executeFunction));
        } else {
            nodes[0].getObjects(x, y, width, height, returnObjects, executeFunction);
            nodes[1].getObjects(x, y, width, height, returnObjects, executeFunction);
            nodes[2].getObjects(x, y, width, height, returnObjects, executeFunction);
            nodes[3].getObjects(x, y, width, height, returnObjects, executeFunction);
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
QuadTree.prototype.tick = function (timeSinceLastFrame) {
    let index;
    let node;

    if(this.nodes){
        for(index = 0; index < 4; ++index){
            node = this.nodes[index];
            if(node){
                node.tick.apply(node, arguments);
            }
        }
    }

    for(index = 0; index < this.objects.length; ++index){
        node = this.objects[index];
        node.tick.apply(node, arguments);
    }

    if(this.level == 0){
        let buffer = QuadTree.ArrayBuffer;
        buffer.length = 0;
        this.recalculate(buffer);

        for(index = 0; index < buffer.length; ++index){
            this.insert(buffer[index]);
        }
    }
};
QuadTree.prototype.drawGrid = function(displayContext, xOffset, yOffset, width, height){
    let color = "#00F";
    let x1 = this.location[0];
    let y1 = this.location[1];
    let x2 = this.location[2];
    let y2 = this.location[3];

    displayContext.drawLine(x1, y1, x1, y2, color);
    displayContext.drawLine(x1, y1, x2, y1, color);
    displayContext.drawLine(x2, y2, x1, y2, color);
    displayContext.drawLine(x2, y2, x2, y1, color);

    let nodes = this.nodes;
    if (nodes[0] !== null) {
        let index = this.getIndex(xOffset, yOffset, width, height);
        if (index > -1) {
            nodes[index].drawGrid(displayContext, xOffset, yOffset, width, height);
        } else {
            nodes[0].drawGrid(displayContext, xOffset, yOffset, width, height);
            nodes[1].drawGrid(displayContext, xOffset, yOffset, width, height);
            nodes[2].drawGrid(displayContext, xOffset, yOffset, width, height);
            nodes[3].drawGrid(displayContext, xOffset, yOffset, width, height);
        }
    }
};
QuadTree.prototype.draw = function(displayContext, xOffset, yOffset, width, height){
    let buffer= QuadTree.ArrayBuffer;
    let index;
    buffer.length = 0;
    
    this.getObjects(xOffset, yOffset, width, height, buffer);

    buffer.sort(function(a, b){ return a.location[3] - b.location[3]; });

    for(index = 0; index < buffer.length; ++index){
        buffer[index].draw(displayContext, xOffset, yOffset, width, height);
    }

    if(window.debugMode){
        this.drawGrid(displayContext, xOffset, yOffset, width, height);
    }
};
QuadTree.prototype.click = function(x, y){
    let args = arguments;
    let objects = this.getObjects(x, y, 1, 1, [], function(obj){
        if(obj.clickEnabled && obj.inLocation(x, y, x, y)){
            obj.click.apply(obj, args);
        }
    });
};
QuadTree.prototype.interact = function(left, top, right, bottom){
    let args = arguments;
    let objects = this.getObjects(left, top, right, bottom, [], function(obj){
        if(obj.interactEnabled && obj.inLocation(left, top, right, bottom)){
            obj.interact.apply(obj, args)
        }
    });
};
QuadTree.ArrayBuffer = [];
QuadTree.StackBuffer = [];

var ArcTileQuadTree_Tile = ArcBaseObject();
ArcTileQuadTree_Tile.prototype = Object.create(ArcRenderableObject());
ArcTileQuadTree_Tile.prototype.init = function(tile, x, y, tileWidth, tileHeight){
    ArcRenderableObject.prototype.init.call(this, false, false);

    this.location[4] = x + (tileWidth >> 1);
    this.location[5] = y + (tileWidth >> 1);

    this.updateSize(tileWidth, tileHeight);

    this.tile = tile;
};
ArcTileQuadTree_Tile.prototype.isBlocked = function(left, top, right, bottom){
    if(this.inLocation(left, top, right, bottom)){
        return !this.tile.walkable;
    }

    return null;
};

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
    var halfWidth = this.halfSize[0];
    var halfHeight = this.halfSize[1];
    var x = this.location[0];
    var y = this.location[1];
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
    this.insert(new ArcTileQuadTree_Tile(tile, x, y, tileWidth, tileHeight));
};
ArcTileQuadTree.prototype.insert = function (value) {
    var nodes = this.nodes;
    if (nodes[0] !== null) {
        var index = this.getIndex(value.location[0], value.location[1], value.size[0], value.size[1]);
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
    let nodeStack = this.searchStack;
    nodeStack.push(this);
    
    let node = null;
    let object = null;

    while ((node = nodeStack.pop()) != null) {
        if (offset && offset !== null) {
            node.offset[0] = offset[0];
            node.offset[1] = offset[1];
        }

        repeat = repeat ? true : node.repeat;

        // If this repeatable, split it up as needed
        if (repeat) {
            var bounds = node.location;
            var xCheck = x + node.offset[0];
            var yCheck = y + node.offset[1];

            if (xCheck < bounds[0]) {
                x += node.size[0];
            } else if (xCheck > node.location[2]) {
                x -= node.size[0];
            }

            if (yCheck < bounds[1]) {
                y += node.size[1];
            } else if (yCheck > node.location[3]) {
                y -= node.size[1];
            }
        }

        for (var i = 0; i < node.objects.length; ++i) {
            object = node.objects[i];
            if (object.tile.isDrawable) {
                returnObjects.push({
                    x: object.location[0] - node.offset[0],
                    y: object.location[1] - node.offset[1],
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
ArcTileQuadTree.prototype.getObjects = function(x, y, width, height, returnObjects, offset, repeat){
    let i, nodes, obj;

    for(i = 0; i < this.objects.length; ++i){
        obj = this.objects[i];
        if(obj.tile.isDrawable){
            // TODO: Find a way around this. We shouldnt need to create a new object.
            returnObjects.push(obj);
        }
    }

    nodes = this.nodes;
    if(nodes[0] !== null){
        i = this.getIndex(x, y, width, height);

        if(i >= 0){
            nodes[i].getObjects(x, y, width, height, returnObjects, offset, repeat);
        }else{
            nodes[0].getObjects(x, y, width, height, returnObjects, offset, repeat);
            nodes[1].getObjects(x, y, width, height, returnObjects, offset, repeat);
            nodes[2].getObjects(x, y, width, height, returnObjects, offset, repeat);
            nodes[3].getObjects(x, y, width, height, returnObjects, offset, repeat);
        }
    }
};
ArcTileQuadTree.prototype.isBlocked = function (x1, y1, x2, y2, width, height) {
    const nodes = this.nodes;
    let i, r;
    let result = null;

    for (i = 0; i < this.objects.length; ++i) {
        r = this.objects[i].isBlocked(x1, y1, x2, y2, width, height);

        if(r !== null){
            if(r){
                return true;
            }else{
                result = false;
            }
        }
    }

    if (nodes[0] !== null) {
        i = this.getIndex(x1, y1, width, height);
        if (i > -1) {
            r = nodes[i].isBlocked(x1, y1, x2, y2, width, height);

            if(r !== null){
                if(r){
                    return true;
                }else{
                    result = false;
                }
            }
        } else {
            for (i = 0; i < 4; ++i) {
                r = nodes[i].isBlocked(x1, y1, x2, y2, width, height);

                if(r !== null){
                    if(r){
                        return true;
                    }else{
                        result = false;
                    }
                }
            }
        }
    }

    return result;
};
ArcTileQuadTree.prototype.tick = function (timeSinceLastFrame) {
    if (this.scroll !== null) {
        let width = this.size[0];
        let height = this.size[1];
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
    
    // Optimize drawing calls for the objects.
    //sortOutputTiles(buffer);
    buffer.sort(arcSortOutputTiles);
    
    displayContext.drawTileLayer(buffer);
}

/**
 *  Used to Describe a sound on the map.
 *  @param radius The radius of the sound. A radius of 0 or less means that the sound can be heard at all times.
 *  @param repeat A boolean value used to  describe whether or not the sound repeats.
 *  @param url The file location of the sound.
 **/
var ArcSound = ArcBaseObject();
ArcSound.prototype.init = function (name, repeat, url) {
    this.name = name;
    this.loop = repeat;
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
    this.properties = {};
};
ArcTile.prototype.drawable = function () {
    return this;
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
    this.properties = {};
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
    return frame;
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
ArcTileMap.prototype.isBlocked = function (x1, y1, x2, y2, width, height) {
    return this.data.isBlocked(x1, y1, x2, y2, width, height);
};
ArcTileMap.prototype.draw = function(displayContext, xOffset, yOffset, width, height){
    this.data.draw(displayContext, xOffset, yOffset, width, height);
}
ArcTileMap.prototype.tick = function(deltaMilliseconds){
    if(this.data){
        this.data.tick.apply(this.data, arguments);
    }
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

/**
* Basic map stucture to have a single actor treevar
* @class
* @implements {ArcRenderableObject} 
*/
var ArcMap = ArcBaseObject();
ArcMap.prototype = Object.create(ArcRenderableObject.prototype);
ArcMap.prototype.init = function(parent, mapName){
    ArcRenderableObject.prototype.init.call(this, true, true);
    this.parent = parent;
    this.name = mapName;
    this.tileSheets = {};
    this.width = 100;
    this.height = 100;
    this.tileWidth = 16;
    this.tileHeight = 16;
    this.tiles = [];
    this.loaded = false;

    // TODO: Use the children object to render the map as a single tree.
};
/**
* @override
*/
ArcMap.prototype.unload = function(){
    this.loaded = false;
    ArcRenderableObject.prototype.unload.call(this);

    this.tiles.length = 0;
};
/**
* @param {index} name The index of the tile to obtain the tilesheet for.
* @return The tilesheet for a specified tile. If no tilesheet is found, null is returned.  
*/
ArcMap.prototype.getTileSheetForTile = function (index) {
    var currentTilesheet = null;
    for (var i in this.tileSheets) {
        var tileSheet = this.tileSheets[i];
        if (tileSheet.firstGid <= index && (currentTilesheet == null || currentTilesheet.firstGid < tileSheet.firstGid)) {
            currentTilesheet = tileSheet;
        }
    }

    return currentTilesheet;
};

// Triggers that can be used on the map

/**
* The base trigger for the map
* @class
* @implements {ArcEventObject}
*/
var ArcTrigger = ArcBaseObject();
ArcTrigger.prototype = Object.create(ArcEventObject.prototype);
ArcTrigger.prototype.init = function (name, type, position, size, rotation) {
    this.name = name;
    this.location = new Float32Array([position[0], position[1], position[0] + size[0], position[1] + size[1]]);
    this.centre = new Float32Array([position[0] + size[0] / 2, position[1] + size[1] / 2]);
    this.size = size.slice();
    this.rotation = rotation;
    this.type = type;
    this.followObject = null;
    this.interactEnabled = true;
};
ArcTrigger.prototype.setProperty = function (name, value) {
    this.properties[name] = value;
};
ArcTrigger.prototype.update = function(map, timeSinceLast){
    if(typeof(this.followObject) === "string"){
        console.log(this.followObject);
    }
};
/**
* @override
*/
ArcTrigger.prototype.inLocation = function(left, top, right, bottom){
    let loc = this.location;
    return !(
        right < loc[0] ||
        left > loc[2] ||
        bottom < loc[1] ||
        top > loc[3]
    ); 
};
ArcTrigger.prototype.interact = function(left, top, right, bottom, player, world, worldAdapter){

};