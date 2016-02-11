// This script needs to create two functions needed for the game. Draw and update.
// An object with the name model is provided to store data in. It contains the task title and other pre-provided task information.
(function(){
    var fontInfo = {
        font: "bold 20px sans-serif",
        fillStyle: "yellow",
        textAlign: "center"
    };

    return {
        draw: function(display, model, drawModel){
            display.clear();
            
            var newWidth = 0;
            var cIndex = 0;
            var x = model.size[0] >> 1;
            var y = 30;
            var colors = [
            [255, 0, 0],
            [178, 34, 34],
            [139, 69, 19],
            [128, 0, 0],
            [255, 140, 0],
            [255, 255, 0],
            [0, 128, 0],
            [0, 255, 0],
            [0, 0, 255],
            [0, 255, 255],
            [255, 255, 255]
            ];
            
            //Draw the egg to the screen
            if(display.eggData){
                display.setPixelData(display.colorData, display.colorRect[0], display.colorRect[1]);
                display.setPixelData(display.eggData, display.eggRect[0], display.eggRect[1]);
            }else if(!display.eggImageLoading){
                display.eggImageLoading = true;
                
                // Load the Egg
                display.eggImage = new Image();
                display.eggImage.onload = function(){
                    display.drawImage(display.eggImage, 0, 0, 618, 800, display.eggRect[0], display.eggRect[1], display.eggRect[2], display.eggRect[3]);
                    display.eggData = display.getPixelData(display.eggRect[0], display.eggRect[1], display.eggRect[2], display.eggRect[3])
                }
                display.eggImage.src = model.eggUrl
                
                display.eggRect = [0, 0, Math.round(display.size[1] * 0.5), Math.round(display.size[1] * 0.6)];
                display.eggRect[0] = Math.round((display.size[0] - display.eggRect[2]) * 0.5);
                display.eggRect[1] = Math.round((display.size[1] - display.eggRect[3]) * 0.5) - 20;
                
                display.currentColor = [255, 0, 0];
                
                // Create the color rect
                display.colorRect = [Math.round(display.size[0] * 0.5), Math.round(display.eggRect[1] + display.eggRect[3] + 10), 0, Math.round(display.size[1] * 0.07)];
                display.colorRect[2] = 11 * display.colorRect[3];
                display.colorRect[0] = Math.round(display.colorRect[2] * -0.5) + display.colorRect[0];
                
                display.colorData = display.getPixelData(display.colorRect[0], display.colorRect[1], display.colorRect[2], display.colorRect[3]);
                for(cIndex = 0; cIndex < 11; ++cIndex){
                    var c = colors[cIndex];
                    for(var cY = 0; cY < display.colorRect[3]; ++cY){
                        for(var cX = 0; cX < display.colorRect[3]; ++cX){
                            var index = (cX + (cIndex * display.colorRect[3])) + (cY * display.colorRect[2]);
                            index = index << 2;
                            
                            display.colorData.data[index + 0] = c[0];
                            display.colorData.data[index + 1] = c[1];
                            display.colorData.data[index + 2] = c[2];
                            display.colorData.data[index + 3] = 255;
                        }
                    }
                }
                
                // Create the button area
                drawModel.buttonSpace = [Math.round(display.size[0] * 0.5), display.size[1] - 10 - Math.round(display.size[1] * 0.07), 0, Math.round(display.size[1] * 0.07)];
                drawModel.buttonSpace[2] = 10 * __this.drawModel.buttonSpace[3];
                drawModel.buttonSpace[0] = Math.round(__this.drawModel.buttonSpace[2] * -0.5) + drawModel.buttonSpace[0];
                drawModel.state = 1;
            }
            
            // Handle paint actions
            var checkInRect = function(x, y, rect){
                return !(x < rect[0] || x >= (rect[0] + rect[2]) || y < rect[1] || y >= (rect[1] + rect[3]));
            }
            
            var setPixelColor = function(data, index, r, g, b, a){
                data[index] = r;
                data[index + 1] = g;
                data[index + 2] = b;
                data[index + 3] = a;
            }
            
            var fillSelection = function(x, y, width, height){
                var data = display.eggData.data;
                var index = (x + (y * width)) << 2;
                var checkColor = [data[index], data[index + 1], data[index + 2], data[index + 3]];
                var stack = [[x, y]];
                var fillColor = display.currentColor;
                
                if(checkColor[0] == 0 &&
                    checkColor[1] == 0 &&
                    checkColor[2] == 0){
                    return;
                }
                
                if(checkColor[0] == fillColor[0] &&
                    checkColor[1] == fillColor[1] &&
                    checkColor[2] == fillColor[2]){
                    return;
                }
                
                while(stack.length > 0){
                    var p = stack.pop();
                
                    if(p[0] < 0 || p[0] >= width || p[1] < 0 || p[1] >= height){
                        continue;
                    }
                
                    index = (p[0] + (p[1] * width)) << 2;
                
                    // Compare the color
                    if(checkColor[0] != data[index] ||
                        checkColor[1] != data[index + 1] ||
                        checkColor[2] != data[index + 2]){
                        continue;
                    }
                
                    // Set the color
                    setPixelColor(data, index, fillColor[0], fillColor[1], fillColor[2], 255);  
                
                    // Add surounding points to the stack
                    stack.push([p[0] - 1, p[1]]);
                    stack.push([p[0] + 1, p[1]]);
                    stack.push([p[0], p[1] - 1]);
                    stack.push([p[0], p[1] + 1]);
                }
            }
            
            if(model.action != null){
                // Check if the click was inside the egg rect
                if(checkInRect(model.action.x, model.action.y, display.eggRect)){
                    // Handle the fill action
                    if(display.eggData){
                        fillSelection(model.action.x - display.eggRect[0], model.action.y - display.eggRect[1], display.eggRect[2], display.eggRect[3]);
                    }
                }else if(checkInRect(model.action.x, model.action.y, display.colorRect)){
                    // Check if they just selected a color
                    cIndex = Math.floor(((model.action.x - display.colorRect[0]) / display.colorRect[2]) * 11);
                    display.currentColor = colors[cIndex]; 
                }else if(drawModel.state == 1 && checkInRect(model.action.x, model.action.y, drawModel.buttonSpace)){
                    drawModel.state = 2;
                }else if(drawModel.state == 2){
                    newWidth = Math.round(drawModel.buttonSpace[2] / model.buttonMessage.length);
                    
                    if(checkInRect(model.action.x, model.action.y,
                        [drawModel.buttonSpace[0] + 2, drawModel.buttonSpace[1], newWidth - 4, drawModel.buttonSpace[3]])){
                        drawModel.state = 3;
                    }else if(checkInRect(model.action.x, model.action.y, drawModel.buttonSpace,
                        [drawModel.buttonSpace[0] + newWidth + 2, drawModel.buttonSpace[1], newWidth - 4, drawModel.buttonSpace[3]])){
                        drawModel.state = 1;
                    }
                }
            }
            
            display.drawToDisplay();
            
            fontInfo.fillStyle = "lightblue";
            display.drawMessage(model.currentMessage, x, y, fontInfo);
            
            if(model.buttonMessage.length > 0){
                newWidth = Math.round(drawModel.buttonSpace[2] / model.buttonMessage.length);
                for(cIndex = 0; cIndex < model.buttonMessage.length; ++cIndex){
                    var button = [drawModel.buttonSpace[0], drawModel.buttonSpace[1], newWidth - 4, drawModel.buttonSpace[3]];
                    button[0] = button[0] + (newWidth * cIndex) + 2;
                    fontInfo.fillStyle = "black";
                    display.drawMessage(model.buttonMessage[cIndex], 0, 8, fontInfo,
                        button, "rgb(" + display.currentColor[0] + ", " + display.currentColor[1] + ", " + display.currentColor[2] + ")");
                }
            }
        },
        update: function(params){
            var time = params.time;
            var drawModel = params.drawModel;
            
            if(model.state == undefined || model.state < 0){
                model.state = 0;
                model.currentMessage = "";
                model.buttonMessage = [];
                model.eggUrl = params.resourcePath + "/Tasks/egg.gif"
                model.action = null;
            }else if(model.state == 0){
                model.state = 1;
            }else if(model.state >= 1){
                model.action = null;
                for(var i in params.actions){
                    var action = params.actions[i];
                    if(action.id == CONTROL_MOUSE1_UP){
                        model.action = action.data;
                    }
                }
            }
                        
            switch(drawModel.state){
                case 1:
                    model.currentMessage = "A Ukrainian Easter Egg is called a Pysanky.\nLet's colour this one."
                    model.buttonMessage = ["Done!"];
                    break;
                    
                case 2:
                    model.currentMessage = "Are you done colouring this egg?";
                    model.buttonMessage = ["Yes", "No"];
                    break;
                    
                case 3:
                    self.postMessage([WORKER_CLOSE_TASK_FUNCTION, model]);
                    return;
            }
            
            self.postMessage([WORKER_DRAW_SCENE, model]);
        },
        done: function(display, model, drawModel){
            console.log("Closing Task!");
            return true;
        },
        reward: function(display, model, drawModel){
            var outCanvas = $("<canvas width='16' height='24'></canvas>")[0];
            var outContext = outCanvas.getContext("2d");
            
            outContext.setPixelData(display.colorData, 0, 0, 0, 0, 16, 24);
            outContext.setPixelData(display.eggData, 0, 0, 0, 0, 16, 24);
            
            return { name: "MISSINGNO.", image: outCanvas};
        },
        allowGL: false
    }
})