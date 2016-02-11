/* DEPRICATED */

// Run imports
importScripts("arc_engine/arc_constants.js");
importScripts("arc_engine/arc_objects.js");
importScripts("village_constants.js");
importScripts("village_objects.js");
importScripts("village_functions.js");
importScripts("village_map.js");

// Functions
function drawWorld(lowLayers, highLayers, users, playerLoc) {
    // Sort the users in proper draw order
    users.sort(function (a, b) {
        return a.location[1] - b.location[1];
    });

    var waypointLoc = null;
    if (player && player.showWaypoint) {
        waypointLoc = player.waypointLoc;
    }

    // Send the world to the canvas
    self.postMessage([WORKER_DRAW_SCENE, lowLayers, highLayers, JSON.stringify(users), offset[0], offset[1], waypointLoc, playerLoc]);
}

function calculateVisibleWorld(inLowLayers, inHighLayers, offset, tileWidth, tileHeight, width, height, tiles, playerLoc, waypointLoc) {
    var lowLayers = [];
    var highLayers = [];
    var index = 0;

    // Calculate visible tiles
    var xTileOffset = offset[0] / tileWidth;
    var yTileOffset = offset[1] / tileHeight;
    var x = Math.floor(xTileOffset);
    var y = Math.floor(yTileOffset);
    xTileOffset = -(xTileOffset - x) * tileWidth;
    yTileOffset = -(yTileOffset - y) * tileHeight;
    var startX = x;
    var xLoc = xTileOffset;
    var yLoc = yTileOffset;
    var sceneWidth = tileWidth * width;
    var sceneHeight = tileHeight * height;

    var layerIndex = 0;
    var tileIndex = 0;

    for (layerIndex = 0; layerIndex < inLowLayers.length; ++layerIndex) {
        lowLayers.push([]);
    }

    for (layerIndex = 0; layerIndex < inHighLayers.length; ++layerIndex) {
        highLayers.push([]);
    }

    while (yLoc <= sceneHeight && y < height) {
        while (xLoc < sceneWidth && x < width) {
            if (x >= 0) {
                index = x + (y * width);

                // Find if we need to add tiles
                for (layerIndex = 0; layerIndex < lowLayers.length; ++layerIndex) {
                    tileIndex = inLowLayers[layerIndex].data[index];

                    if (tileIndex >= 0) {
                        var tile = tiles[tileIndex];

                        if (tile)
                            lowLayers[layerIndex].push({
                                x: xLoc,
                                y: yLoc,
                                width: tileWidth,
                                height: tileHeight,
                                tile: tileIndex,
                                tileSheet: tile.tileSheetName
                            });
                    }
                }

                for (layerIndex = 0; layerIndex < highLayers.length; ++layerIndex) {
                    tileIndex = inHighLayers[layerIndex].data[index];

                    if (tileIndex >= 0) {
                        var tile = tiles[tileIndex];
                        if (tile)
                            highLayers[layerIndex].push({
                                x: xLoc,
                                y: yLoc,
                                width: tileWidth,
                                height: tileHeight,
                                tile: tileIndex,
                                tileSheet: tile.tileSheetName
                            });
                    }
                }
            }

            ++x;
            xLoc += tileWidth;
        }

        x = startX;
        xLoc = xTileOffset;
        yLoc += tileHeight;
        ++y;
    }
    
    self.postMessage([WORKER_DRAW_SCENE, lowLayers, highLayers, playerLoc, waypointLoc, offset]);
}

//function handleModifyMap(map) { //TODO:
//    var index = map.x + (map.y * world.width);
//    var stride = 0;
//    var data = parseMapLayer(map.data);
//
//    for (var i = 0; i < data.length; ++i) {
//        var array;
//        switch (map.layer) {
//            case MAP_LOWER:
//                array = world.lowerMap;
//                break;
//
//            case MAP_MID:
//                array = world.midMap;
//                break;
//
//            case MAP_UPPER:
//                array = world.upperMap;
//                break;
//        }
//
//        array[index] = data[i];
//
//        ++stride;
//        if (stride >= map.stride) {
//            stride = 0;
//            index -= (map.stride - 1);
//            index += world.width;
//        } else {
//            ++index;
//        }
//    }
//}

//function isNearSign() {
//    var distance = Math.sqrt(Math.pow(player.user.location[0] - signIndex[1], 2.0) + Math.pow(player.user.location[1] - signIndex[2], 2.0));
//    return distance < 60.0;
//}

// Message Handler
self.onmessage = function (e) {
    var data = e.data;
    switch (data[0]) {
        case WORKER_CALCULATE_DRAW:
            calculateVisibleWorld(data[1], data[2], data[3], data[4], data[5], data[6], data[7], data[8], data[9], data[10]);
            break;
    }
};