(function(task, resourcePath){
	// Private params
	var drawCanvas = document.createElement("canvas");
	var drawContext = drawCanvas.getContext("2d");

	// Private Functions
	var distance = function(start, end){
		return Math.sqrt(Math.pow(start[0] - end[0], 2.0) + Math.pow(start[1] - end[1], 2.0));
	};
	
	var drawBrush = function(display, model){
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

				drawContext.drawImage(model.brushImage, 0, 0, model.brushImage.width, model.brushImage.height, 
					x - model.brushImage.halfWidth, y - model.brushImage.halfHeight, model.brushImage.scaleWidth, model.brushImage.scaleHeight);
			}
		}
	};
	
	var init = function(){
		// Setup the model
		var model = task.model;
		model.line = {
			isDrawing: false,
			start: [0, 0],
			end: [0, 0],
			time: 0
		};
		model.brushSpacing = 2;
		model.state = 0;
	
		model.brushUrl = resourcePath + "/tasks/Brush.png";
		model.acceptUrl = resourcePath + "/images/accept.png";
		
		// Load the brush
		var brushImage = new Image();
		brushImage.scale = function(amount){
			brushImage.scaleWidth = Math.ceil(brushImage.width * amount);
			brushImage.scaleHeight = Math.ceil(brushImage.height * amount);
			brushImage.halfWidth = brushImage.scaleWidth >> 1;
			brushImage.halfHeight = brushImage.scaleHeight >> 1;
		};
		brushImage.onload = function(){
			brushImage.scale(0.15);
		};
		brushImage.src = model.brushUrl;
		model.brushImage = brushImage;
		
		// Load the button images
		var acceptImage = new Image();
		acceptImage.src = model.acceptUrl;
		model.acceptImage = acceptImage;
	};
	
	// Public Params
	task.allowGL = false;
	
	// Public Functions
	task.update = function(time){
		var model = task.model;
		var line = model.line;
		var actions = task.controlAdapter.pullActionList();
		
		// Reset the values
		line.start[0] = line.end[0];
		line.start[1] = line.end[1];
		line.time = 0;

		// Update the task
		for(var i in actions){
			var action = actions[i];

			if(line.isDrawing){
				switch(action.id){
					case CONTROL_MOUSE1_UP:
						line.isDrawing = false;
					case CONTROL_MOUSE1_DRAG:
						line.end[0] = action.data.x;
						line.end[1] = Math.min(action.data.y, model.bottom);
						line.time = time;
				}
			}else {
				switch(action.id){
					case CONTROL_MOUSE1_DOWN:
						if(action.data.y < model.bottom){
							line.isDrawing = true;
							line.start[0] = action.data.x;
							line.start[1] = action.data.y;
							line.end[0] = action.data.x;
							line.end[1] = action.data.y;
						}
						break;

					case CONTROL_MOUSE1_UP:
						if(!(action.data.x < model.buttonAccept[0] || action.data.x > model.buttonAccept[2]
							|| action.data.y < model.buttonAccept[1] || action.data.y > model.buttonAccept[3])){
							this.close();
						}
						break;
				}
			}
		}
	};
	
	task.resize = function(width, height){
		TaskScript.prototype.resize.call(this, width, height);
		
		let model = this.model;
		let display = this.displayAdapter;
		
		model.bottom = display.size[1] - 20 - 32;
		model.buttonAccept = [10, display.size[1] - 10 - 32, 32, 32];
		model.buttonAccept[2] += model.buttonAccept[0];
		model.buttonAccept[3] += model.buttonAccept[1];
		
		// Resize the draw area
		drawCanvas.width = display.size[0];
		drawCanvas.height = display.size[1];
		drawContext = drawCanvas.getContext("2d");
	};
	
	task.draw = function(){
		var display = this.displayAdapter;
		var model = this.model;
		
		display.clear();
		
		if(model.acceptImage){	
			display.drawImage(model.acceptImage, 0, 0, model.acceptImage.width, model.acceptImage.height, 
				model.buttonAccept[0], model.buttonAccept[1], 
				model.buttonAccept[2] - model.buttonAccept[0], 
				model.buttonAccept[3] - model.buttonAccept[1]);
		}
		
		
		if(model.bgImage){			
			display.drawImage(model.bgImage, 0, 0, model.bgImage.width, model.bgImage.height,
			0, 0, display.size[0], model.bottom);
		}

		if(model.brushImage && model.brushImage.complete){
			drawBrush(display, model);
			display.drawImage(drawCanvas, 0, 0, drawCanvas.width, drawCanvas.height,
				0, 0, drawCanvas.width, drawCanvas.height);
		}

		display.drawToDisplay(true);
	};
	
	task.setBackground = function(imageUrl){
		var img = new Image();
		img.onload = function(){
			
		};
		img.src = imageUrl;
		
		this.model.bgImage = img;
	};
	
	task.setComparison = function(imageUrl){
		var img = new Image();
		img.onload = function(){
			
		};
		img.src = imageUrl;
		
		this.model.cmpImage = img;
	};
	
	
	init();
	
	return task;
})