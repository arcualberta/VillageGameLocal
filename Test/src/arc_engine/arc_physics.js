var ArcPhysics = null;

function arcInitializePhysics() {
    ArcPhysics = {
        generateConstantGravity: function (velocity) {
            return function (v, t) {
                v[1] = Math.max(velocity, v[1]);
            };
        },
        generateAccelerationGravity: function (acceleration) {
            return function (v, t) {
                v[0] += t * acceleration[0];
                v[1] += t * acceleration[1];
            };
        },
        applyMovement: function (x0, y0, x1, y1, w, h, layers) {
            // Solution provided by: http://higherorderfun.com/blog/2012/05/20/the-guide-to-implementing-2d-platformers/
            var xi = x1 < x0 ? -1 : 1;
            var yi = y1 < y0 ? -1 : 1;
            var xCheck = x1 < x0 ? function(x){return (-x - x1) < 0.5;} : function(x){return (x - x1) < 0.5;} ;
            var yCheck = y1 < y0 ? function(y){return (-y - y1) < 0.5;} : function(y){return (y - y1) < 0.5;} ;
            var xWalk = true;
            var yWalk = true;
            var x = x0;
            var y = y0;
            var i = 0;
            var length = layers.length;
            var xBlocked = false;
            var yBlocked = false;

            while (xWalk || yWalk) {
                if (xWalk) {
                    for (i = 0; i < length; ++i) {
                        if (layers[i].isBlocked(x, y, x + w, y + h, w, h)) {
                            x -= xi;
                            xBlocked = true;
                            xWalk = false;
                            break;
                        }
                    }

                    if (xWalk) {
                        if (xCheck(x)) {
                            xWalk = false;
                        } else {
                            x += xi;
                        }
                    }
                }

                if (yWalk) {
                    for (i = 0; i < length; ++i) {
                        if (layers[i].isBlocked(x, y, x + w, y + h, w, h)) {
                            y -= yi;
                            yBlocked = true;
                            yWalk = false;
                            break;
                        }
                    }

                    if (yWalk) {
                        if (yCheck(y)) {
                            yWalk = false;
                        } else {
                            y += yi;
                        }
                    }
                }
            }

            return {
                x: x,
                y: y,
                xBlocked: xBlocked,
                yBlocked: yBlocked
            };
        },
        applyGravity: function (boundingBox, timeSinceLast, gravityAlgorithm, vector, layers) { // Used for 2D platformers to calculate a character falling.
            var i = timeSinceLast;
            var px0, py0;
            var px = boundingBox[0];
            var py = boundingBox[1];
            var w = boundingBox[2];
            var h = boundingBox[3];
            var v = [vector[0], vector[1]];
            var result;

            // Itterate through timesteps to calculate the new position
            for (i = timeSinceLast; i > 0; --i) {
                px0 = px;
                py0 = py;
                px += v[0];
                py += v[1];

                // Check intersection with the layers
                result = this.applyMovement(px0, py0, px, py, w, h, layers);

                if (result.yBlocked) {
                    //px = result.x;
                    //py = result.y;

                    v[0] = 0;
                    v[1] = 0;
                    break;
                } else {
                    gravityAlgorithm(v, 1);
                }
            }

            return {
                falling: !result.yBlocked,
                position: [px, py],
                vector: v
            };
        },
        translate: function (boundingBox, timeSinceLast, vector, layers) { // Used for 2D platformers to calculate a character falling.
            var i = timeSinceLast;
            var px0, py0;
            var px = boundingBox[0];
            var py = boundingBox[1];
            var w = boundingBox[2];
            var h = boundingBox[3];
            var v = [vector[0], vector[1]];
            var vChange = [0.0, 0.0];
            var result;

            // Itterate through timesteps to calculate the new position
            for (i = timeSinceLast; i > 0; --i) {
                vChange[0] = v[0];
                vChange[1] = v[1];
                while (i > 0 &&
                        vChange[0] < 1.0 && vChange[0] > -1.0 &&
                        vChange[1] < 1.0 && vChange[1] > -1.0) {
                    --i;
                    vChange[0] += v[0];
                    vChange[1] += v[1];
                }

                px0 = px;
                py0 = py;
                px += vChange[0];
                py += vChange[1];

                // Check intersection with the layers
                result = this.applyMovement(px0, py0, px, py, w, h, layers);

                if (result.yBlocked) {
                    //px = result.x;
                    //py = result.y;

                    v[0] = 0;
                    v[1] = 0;
                    break;
                }
            }

            return {
                position: [px, py],
                vector: v
            };
        }
    };

    return ArcPhysics;
}
