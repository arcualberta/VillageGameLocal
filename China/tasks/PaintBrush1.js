(function(){
	var result = {
		draw: function(display, model, drawModel){
			if(model.brushUrl && !(display.brushImage)){
				display.brushImage = new Image();
				display.brushImage.scale = function(amount){
					display.brushImage.scaleWidth = Math.ceil(display.brushImage.width * amount);
					display.brushImage.scaleHeight = Math.ceil(display.brushImage.height * amount);
					display.brushImage.halfWidth = display.brushImage.width >> 1;
					display.brushImage.halfHeight = display.brushImage.height >> 1;
				}
				display.brushImage.onload = function(){
					display.brushImage.scale(1.0);
				}
				display.brushImage.src = model.brushUrl;
			}

			if(display.brushImage.complete){
				var line = model.line;
				if(line && line.time > 0){
					//DRAW the line
					var dotCount = Math.ceil(line.time * model.dotsPerMilisecond);
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
            		model.dotsPerMilisecond = 60 / 1000;
            		model.brushUrl = params.resoursePath + "/tasks/Brush.png";
            		break;
            	case 1:
            		// Reset the values
					line.start[0] = line.end[0];
					line.start[1] = line.end[1];
					line.time = 0;

            		// Update the task
            		for(var i = params.actions; i < params.actions.length; ++i){
            			var action = params.actions[i];

            			if(model.isDrawing){
	            			switch(action.id){
	            				case CONTROL_MOUSE1_UP:
	            					model.isDrawing = false;
	            				case CONTROL_MOUSE1_DRAG:
	            					model.end[0] = action.x;
	            					model.end[1] = action.y;
	            					model.time = time;
	            			}
            			}else {
            				switch(action.id){
            					case CONTROL_MOUSE1_DOWN:
            						model.line.isDrawing = true;
            						model.line.start[0] = action.x;
            						model.line.start[1] = action.y;
            				}
            			}
            		}
            		break;

            	default:
            		if(!(model.state)){
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