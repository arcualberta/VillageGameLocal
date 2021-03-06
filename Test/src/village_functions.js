/**
 * Creates a new tile view on a page.
 * @param image The image used to obtain the tile
 * @param x The x location of the tile on the image
 * @param y The y location of the tile on the image
 * @param tileWidth The width of the tile on the image
 * @param tileHeight The height of the tile on the image
 * @param width The width of the output canvas
 * @param height The height of the output canvas
 */
function TileView(image, x, y, tileWidth, tileHeight, width, height){
    var _this = this;
    this.x = x;
    this.y = y;
    this.width = tileWidth;
    this.height = tileHeight;
    this.image = image;
    
    // Create the canvas
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    this.canvas = canvas;
    
    var scripts = document.getElementsByTagName('script');
    var this_script = scripts[scripts.length-1];
    
    this_script.parentNode.insertBefore(canvas, this_script);
    
    // Private functions
    var context;
    var draw = function(){
        context.fillStyle = 'violet';
        context.fillRect(0, 0, width, height);
        context.drawImage(_this.image, _this.x, _this.y, _this.width, _this.height, 0, 0, width, height);
    };
    
    // Public functions
    this.update = function(){
        context = canvas.getContext("2d");
        draw();
    };
    
    this.updateTile = function(x, y, tileWidth, tileHeight){
        _this.x = x;
        _this.y = y;
        _this.tileWidth = tileWidth
        
        _this.update();
    };
    
    this.update();
}

function TileSelector(tileWidth, tileHeight, width, height){
    var _this = this;
    this.image = null;
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.outputCanvas = null;
    
    var rectStart = [0, 0];
    
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    var scripts = document.getElementsByTagName('script');
    var this_script = scripts[scripts.length-1];
    
    var div = $("<div style='overflow: scroll; width: " + width + "px; height: " + height + "px;'></div>");
    div.append(canvas);
    this_script.parentNode.insertBefore(div[0], this_script);
  
    // Private functions
    var context = canvas.getContext("2d");
    var paint = function(){
        if(_this.image != null){
            context.drawImage(_this.image, 0, 0);
        
            context.strokeStyle = 'white';
            context.lineWidth = 1;
            context.strokeRect(rectStart[0], rectStart[1], _this.tileWidth, _this.tileHeight);
            //context.stroke();
        
            if(_this.outputCanvas != null){
                var outContext = _this.outputCanvas.getContext("2d");
                outContext.fillStyle = 'violet';
                outContext.fillRect(0, 0, _this.outputCanvas.width, _this.outputCanvas.height);
                outContext.drawImage(_this.image, rectStart[0], rectStart[1], _this.tileWidth, _this.tileHeight, 0, 0, _this.outputCanvas.width, _this.outputCanvas.height);
            }
        }
    };
    
    var update = function(){
        if(_this.image != null){
            if(_this.image.width != canvas.width || _this.image.height != canvas.height){
                canvas.width = _this.image.width;
                canvas.height = _this.image.height;
                
                context = canvas.getContext("2d");
            }
        }
        
        paint();
    };
    
    // Public Functions
    this.getTile = function(){
        return {
            x: rectStart[0],
            y: rectStart[1],
            width: _this.tileWidth,
            height: _this.tileHeight
        };
    };
    
    this.selectTile = function(x, y){
        rectStart[0] = Math.floor(x / _this.tileWidth) * _this.tileWidth;
        rectStart[1] = Math.floor(y / _this.tileHeight) * _this.tileHeight;
        
        if(_this.onchange && _this.onchange != null){
            _this.onchange();
        }
    };
    
    this.onchange = null;
    
    // Mouse Functions
    var mouseDown = false;
    canvas.onmousedown = function(e){
        mouseDown = true;
        var x = e.pageX - canvas.offsetLeft + div.scrollLeft();
        var y = e.pageY - canvas.offsetTop + div.scrollTop();
        
        _this.selectTile(x, y);
    };
    canvas.onmouseup = function(e){
        mouseDown = false;
    };
    canvas.onmousemove = function(e){
        if(mouseDown){
            var x = e.pageX - canvas.offsetLeft + div.scrollLeft();
            var y = e.pageY - canvas.offsetTop + div.scrollTop();
        
            _this.selectTile(x, y);
        }
    }
    canvas.onmouseout = function(e){
        mouseDown = false;
    }
    
    // Loop
    setInterval(update, 300);
}

function stringifyMapLayer(mapLayer){
    return JSON.stringify(mapLayer);
}

function parseMapLayer(mapLayerString){
    var object = JSON.parse(mapLayerString);
    var output = [];
    
    for(var key in object){
        output[parseInt(key)] = object[key];
    }
    
    return output;
}

// Draws a village onto an already created canvas.
function drawToCanvas(canvas, village){
    var context = canvas.getContext("2d");
    var div = canvas.width > canvas.height ? canvas.width : canvas.height;
    var drawWidth = div / village.width;
    var drawHeight = div / village.height;
    
    var lower = parseMapLayer(village.lowerMap);
    var mid = parseMapLayer(village.midMap);
    var upper = parseMapLayer(village.upperMap);
    
    var image = new Image();
    image.onload = function(){
        var index = 0;
        for(var y = 0; y < village.height; ++y){
            for(var x = 0; x < village.width; ++x){
                var tile = null;
                var tileIndex = lower[index];
                if(tileIndex >= 0){
                    tile = village.tileSheet.tiles[tileIndex];
                    context.drawImage(image,
                        tile.x, tile.y, tile.width, tile.height,
                        x * drawWidth, y * drawHeight, drawWidth, drawHeight);
                }
                
                tileIndex = mid[index];
                if(tileIndex >= 0){
                    tile = village.tileSheet.tiles[tileIndex];
                    context.drawImage(image,
                        tile.x, tile.y, tile.width, tile.height,
                        x * drawWidth, y * drawHeight, drawWidth, drawHeight);
                }
                
                tileIndex = upper[index];
                if(tileIndex >= 0){
                    tile = village.tileSheet.tiles[tileIndex];
                    context.drawImage(image,
                        tile.x, tile.y, tile.width, tile.height,
                        x * drawWidth, y * drawHeight, drawWidth, drawHeight);
                }
                
                ++index;
            }
        }
    };
    
    image.src = village.tileSheet.imageUrl;
}

// Draws a village onto the page as a cnavas. 
// This will dispaly the entire map for teacher reference.
function createMapCanvas(canvasWidth, canvasHeight, village){
    var scripts = document.getElementsByTagName('script');
    var this_script = scripts[scripts.length-1];
    
    var canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasWidth;
    this_script.parentNode.insertBefore(canvas, this_script);
    
    if(village && village != null){
        drawToCanvas(canvas, village);
    }
    
    return canvas;
}

/**
 * Basic task script.
 * Update functions will occur on the worker thread while the draw and resize functions happen on the main thread.
 **/
var TaskScript = ArcBaseObject();
TaskScript.prototype.init = function(canvas, title, scriptLocation, resourcePath, worker){
    var __this = this;
    this.displayAdapter = null;
    this.controlAdapter = arcGetControlAdapter(canvas);
    this.model = {
        state: 0
    };
    this.resourcePath = resourcePath;
    
    this.title = title;
    
    // Load the javascript
    $.ajax({
        url: scriptLocation,
        dataType: "text",
        cache: false,
        success: function(data){
            var fn, object;

            data = data.replace(/\/\*.+?\*\/|\/\/.*(?=[\n\r])/g, '');

            try{
                fn = eval(data);
                object = fn(__this, resourcePath);
            }catch(e){
                var err = e.constructor('Error loading task script: ' + e.message);
                err.lineNumber = e.lineNumber - err.lineNumber + 3;
                throw err;
            }

            __this.displayAdapter = arcGetDisplayAdapter(canvas, object.allowGL);
            __this.resize(canvas.width, canvas.height);
        },
        async: false
    });
}
TaskScript.prototype.resize = function(width, height){

};
TaskScript.prototype.draw = function(){};
TaskScript.prototype.done = function(){};
TaskScript.prototype.reward = function(){
    return null;
};
TaskScript.prototype.update = function(time) {

};
TaskScript.prototype.close = function(){

};

/*
 * A basic Tile Sheet script. This generates some default functions which can be used by the file script.
 */
function TileSheetScript(){
    this.MAP_SMALL = [100, 100];
    this.MAP_MEDIUM = [200, 200];
    this.MAP_LARGE = [300, 300];
    
    // Variables
    this.lower = [];
    this.mid = [];
    this.upper = [];
    this.dimension = [0, 0];
    this.tileDimension = [16, 16];
    this.tiles = [];
    
    var _this = this;
    
    this.getTileIndexByName = function(name){
        for(var i in _this.tiles){
            if(_this.tiles[i].name === name){
                return i;
            }
        }
        
        return -1;
    }
    
    this.setTile = function(level, x, y, tile){ // Tile can be either string or index
        if(x < 0 || x >= _this.dimension[0] || y < 0 || y >= _this.dimension[1]){
            return;
        }
            
        var tileIndex = tile;
        if((typeof tile) == "string"){
            tileIndex = _this.getTileIndexByName(tile);
        }
        
        var index = x + (y * _this.dimension[0]);
        switch(level){
            case MAP_LOWER:
                _this.lower[index] = tileIndex;
                break;
                
            case MAP_MID:
                _this.mid[index] = tileIndex;
                break;
                
            case MAP_UPPER:
                _this.upper[index] = tileIndex;
                break;
        }
    }
    
    this.randomWorld = function(name, tileSheet, teachers, students, mapSize){
        var size = mapSize[0] * mapSize[1];
        _this.dimension = mapSize;
        _this.lower = new Int16Array(size);
        _this.mid = new Int16Array(size);
        _this.upper = new Int16Array(size);
        _this.tiles = tileSheet.tiles;
    
        var index = 0;
        for(var y = 0; y < mapSize[1]; ++y){
            for(var x = 0; x < mapSize[0]; ++x){
                _this.lower[index] = -1
                _this.mid[index] = -1
                _this.upper[index] = -1
                
                ++index;
            }
        }
        _this.blankWorld(mapSize[0], mapSize[1]); 
        var mayorHouse = _this.createMayorsHouse(mapSize[0], mapSize[1]);
        var studentHouses = _this.createStudentHouses(students, mapSize[0], mapSize[1]);
        
        var village = new Village(name);
        village.tileSheet = tileSheet
        village.width = this.dimension[0];
        village.height = this.dimension[1];
        village.tileWidth = this.tileDimension[0];
        village.tileHeight = this.tileDimension[1];
        village.lowerMap = stringifyMapLayer(this.lower);
        village.midMap = stringifyMapLayer(this.mid);
        village.upperMap = stringifyMapLayer(this.upper);
        
        return village;
    }
}