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
	            					line.end[1] = action.data.y;
	            					line.time = time;
	            			}
            			}else {
            				switch(action.id){
            					case CONTROL_MOUSE1_DOWN:
            						line.isDrawing = true;
            						line.start[0] = action.data.x;
            						line.start[1] = action.data.y;
            						line.end[0] = action.data.x;
            						line.end[1] = action.data.y;
            						line.time = time;
            				}
            			}
            		}
            		break;

            	default:
            		if(!(model.state)){
            			model.brushUrl = params.resourcePath + "/tasks/Brush.png";
            			model.state = 0;
            		};
            }

            self.postMessage([WORKER_DRAW_SCENE, model]);
		},
		done: function(display, model, drawMode){

		},
		reward: function(display, model, drawmodel){

		},
		allowGL: false
	};

	return result;
})