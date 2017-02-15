(function(){
	var distance = function(start, end){
		return Math.sqrt(Math.pow(start[0] - end[0], 2.0) + Math.pow(start[1] - end[1], 2.0));
	};

	var result = {
		draw: function(display, model, drawModel){
			if(model.brushUrl && !(display.brushImage)){
				display.brushImage = new Image();
				display.brushImage.scale = function(amount){
					display.brushImage.scaleWidth = Math.ceil(display.brushImage.width * amount);
					display.brushImage.scaleHeight = Math.ceil(display.brushImage.height * amount);
					display.brushImage.halfWidth = display.brushImage.scaleWidth >> 1;
					display.brushImage.halfHeight = display.brushImage.scaleHeight >> 1;
				}
				display.brushImage.onload = function(){
					display.brushImage.scale(0.15);
				}
				display.brushImage.src = model.brushUrl;

				drawModel.bottom = display.size[1] - 20 - 32;
				drawModel.buttonAccept = [10, display.size[1] - 10 - 32, 32, 32];

				display.acceptImage = new Image();
				display.acceptImage.onload = function(){
					display.drawImage(display.acceptImage, 0, 0, display.acceptImage.width, display.acceptImage.height, 
						drawModel.buttonAccept[0], drawModel.buttonAccept[1], drawModel.buttonAccept[2], drawModel.buttonAccept[3]);

					drawModel.buttonAccept[2] += drawModel.buttonAccept[0];
					drawModel.buttonAccept[3] += drawModel.buttonAccept[1];
				}
				

				display.acceptImage.src = model.acceptUrl;
			}

			if(display.brushImage && display.brushImage.complete){
				var line = model.line;
				if(line && line.time > 0){
					//DRAW the line
					var dotCount = Math.max(1, Math.ceil(distance(line.start, line.end) / model.brushSpacing));
					var dotStep = 1 / dotCount;
					var loc = 0;
					var locDif = 1.0;
					var x = 0;
					var y = 0;

					for(var i = 0; i < dotCount; ++i){
						x = (line.start[0] * locDif) + (line.end[0] * loc);
						y = (line.start[1] * locDif) + (line.end[1] * loc);
						loc += dotStep;
						locDif -= dotStep;

						display.drawImage(display.brushImage, 0, 0, display.brushImage.width, display.brushImage.height, 
							x - display.brushImage.halfWidth, y - display.brushImage.halfHeight, display.brushImage.scaleWidth, display.brushImage.scaleHeight);
					}
				}
			}

			display.drawToDisplay(true);
		},
		update: function(params){
			var time = params.time;
            var drawModel = params.drawModel;

            switch(model.state){
            	case 0:
            		// Initialize the page
            		model.state = 0;
            		model.line = {
            			isDrawing: false,
            			start: [0, 0],
            			end: [0, 0],
            			time: 0
            		};
            		model.brushSpacing = 2;
            		model.state = 1;
            		break;
            	case 1:
            		var line = model.line;
            		// Reset the values
					line.start[0] = line.end[0];
					line.start[1] = line.end[1];
					line.time = 0;

            		// Update the task
            		for(var i in params.actions){
            			var action = params.actions[i];

            			if(line.isDrawing){
	            			switch(action.id){
	            				case CONTROL_MOUSE1_UP:
	            					line.isDrawing = false;
	            				case CONTROL_MOUSE1_DRAG:
	            					line.end[0] = action.data.x;
	            					line.end[1] = Math.min(action.data.y, drawModel.bottom);
	            					line.time = time;
	            			}
            			}else {
            				switch(action.id){
            					case CONTROL_MOUSE1_DOWN:
            						if(action.data.y < drawModel.bottom){
	            						line.isDrawing = true;
	            						line.start[0] = action.data.x;
	            						line.start[1] = action.data.y;
	            						line.end[0] = action.data.x;
	            						line.end[1] = action.data.y;
            						}
            						break;

            					case CONTROL_MOUSE1_UP:
            						if(!(action.data.x < drawModel.buttonAccept[0] || action.data.x > drawModel.buttonAccept[2]
            							|| action.data.y < drawModel.buttonAccept[1] || action.data.y > drawModel.buttonAccept[3])){
            							self.postMessage([WORKER_CLOSE_TASK_FUNCTION, model]);
            						}
            						break;
            				}
            			}
            		}
            		break;

            	default:
            		if(!(model.state)){
            			model.brushUrl = params.resourcePath + "/tasks/Brush.png";
            			model.acceptUrl = params.resourcePath + "/images/accept.png";
            			model.state = 0;
            		};
            }

            self.postMessage([WORKER_DRAW_SCENE, model]);
		},
		done: function(display, model, drawMode){
			console.log("Closing Task!");
            return true;
		},
		reward: function(display, model, drawmodel){

		},
		allowGL: false
	};

	return result;
})