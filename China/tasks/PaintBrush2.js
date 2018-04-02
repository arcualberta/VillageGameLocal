(function(task, resourcePath){
	var fontInfo = {
        font: "bold 20px sans-serif",
        fillStyle: "black",
        textAlign: "left"
    };

	// Private params
	var drawCanvas = document.createElement("canvas");
	var drawContext = drawCanvas.getContext("2d");
	var testData = null;
	var score = 0.0;
	var minScore = 0.75;
	var maxScore = 1.1; // Over 1 to prevent any errors
	var minSize = 0.08; // TODO: scale brush image based on the current users position and velocity
	var medSize = 0.10;
	var maxSize = 0.20;

	// Private Functions
	var distance = function(start, end){
		return Math.sqrt(Math.pow(start[0] - end[0], 2.0) + Math.pow(start[1] - end[1], 2.0));
	};

	var length = function(vector){
		return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
	}

	var setDrawProperties = function(img){
		let w = task.displayAdapter.size[0];
		let h = task.model.bottom;
		let aspect = w / h;
		let imgAspect = img.width / img.height;

		if(aspect > imgAspect){
			img.drawWidth = img.width * (h / img.height);
			img.drawHeight = h;
		}else{
			img.drawWidth = w;
			img.drawHeight = img.height * (w / img.width);
		}

		img.xOffset = (w / 2) - (img.drawWidth / 2);
		img.yOffset = (h / 2) - (img.drawHeight / 2);
	}

	var updateTestImage = function(img){
		var testCanvas = document.createElement("canvas");
		testCanvas.width = img.drawWidth;
		testCanvas.height = img.drawHeight;

		var testContext = testCanvas.getContext("2d");
		testContext.drawImage(img, 0, 0, img.drawWidth, img.drawHeight);

		testData = testContext.getImageData(0, 0, img.drawWidth, img.drawHeight).data;
	}

	var updateScore = function(){
		if(!task.model.bgImage){	
			return;
		}

		let bgImage = task.model.bgImage;
		var total = 0;
		var connected = 0;
		drawnRGBA = drawContext.getImageData(bgImage.xOffset, bgImage.yOffset, bgImage.drawWidth, bgImage.drawHeight).data;
		for(var i = 3; i < testData.length; i += 4){
			if(testData[i] > 1){
				++total;

				if(drawnRGBA[i] > 1){
					++connected;
				}
			}
		}

		score = connected / total;

		if(score >= minScore){
			fontInfo.fillStyle = "darkgreen";
		}if(score >= maxScore){
			fontInfo.fillStyle = "darkred";
		}
	}

	var drawBrush = function(display, model){
		var line = model.line;
		if(line && line.time > 0){
			// Claculate the velocity
			line.endVelocity[0] = (line.end[0] - line.start[0]) / (line.time * display.size[0]);
			line.endVelocity[1] = (line.end[1] - line.start[1]) / (line.time * display.size[1]);
			
			var acc = (length(line.endVelocity) - length(line.startVelocity)) / line.time;
			//console.log(acc);
			var scale = 1.0 - Math.max(0.0, Math.min(1.0, acc * 10000)); // Negative acceleration will produce the largest scale.
			var lastScale = model.brushImage.lastScale;
			scale = (maxSize - minSize) * scale + minSize;

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

				model.brushImage.scale((scale - lastScale) * loc + lastScale);

				drawContext.drawImage(model.brushImage, 0, 0, model.brushImage.width, model.brushImage.height, 
					x - model.brushImage.halfWidth, y - model.brushImage.halfHeight, model.brushImage.scaleWidth, model.brushImage.scaleHeight);
			}

			updateScore();
		}
	};
	
	var init = function(){
		// Setup the model
		var model = task.model;
		model.line = {
			isDrawing: false,
			start: [0, 0],
			end: [0, 0],
			time: 0,
			startVelocity: [0, 0],
			endVelocity: [0, 0]
		};
		model.brushSpacing = 2;
		model.state = 0;
	
		model.brushUrl = resourcePath + "/tasks/Brush.png";
		model.acceptUrl = resourcePath + "/images/accept.png";
		model.clearUrl = resourcePath + "/images/decline.png";
		
		// Load the brush
		var brushImage = new Image();
		brushImage.lastScale = 0.0;
		brushImage.scale = function(amount){
			brushImage.lastScale = amount;
			
			brushImage.scaleWidth = Math.ceil(brushImage.width * amount);
			brushImage.scaleHeight = Math.ceil(brushImage.height * amount);
			brushImage.halfWidth = brushImage.scaleWidth >> 1;
			brushImage.halfHeight = brushImage.scaleHeight >> 1;
		};
		brushImage.onload = function(){
			brushImage.scale(medSize);
		};
		brushImage.src = model.brushUrl;
		model.brushImage = brushImage;
		
		// Load the button images
		var acceptImage = new Image();
		acceptImage.src = model.acceptUrl;
		model.acceptImage = acceptImage;
		
		var clearImage = new Image();
		clearImage.src = model.clearUrl;
		model.clearImage = clearImage;
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
		line.startVelocity[0] = line.endVelocity[0];
		line.endVelocity[1] = line.endVelocity[1];

		// Update the task
		for(var i in actions){
			var action = actions[i];

			if(line.isDrawing){
				switch(action.id){
					case CONTROL_MOUSE1_UP:
						line.isDrawing = false;
						line.endVelocity[0] = 0;
						line.endVelocity[1] = 0;
						model.brushImage.scale(medSize);
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
						if(score >= minScore && !(action.data.x < model.buttonAccept[0] || action.data.x > model.buttonAccept[2]
							|| action.data.y < model.buttonAccept[1] || action.data.y > model.buttonAccept[3])){
							this.close();
						}else if(!(action.data.x < model.buttonClear[0] || action.data.x > model.buttonClear[2]
							|| action.data.y < model.buttonClear[1] || action.data.y > model.buttonClear[3])){
							drawContext.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
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
		
		model.bottom = display.size[1] - 20 - 48;
		model.buttonAccept = [10, display.size[1] - 10 - 48, 48, 48];
		model.buttonAccept[2] += model.buttonAccept[0];
		model.buttonAccept[3] += model.buttonAccept[1];
		
		model.buttonClear = [10 +model.buttonAccept[2], display.size[1] - 10 - 48, 48, 48];
		model.buttonClear[2] += model.buttonClear[0];
		model.buttonClear[3] += model.buttonClear[1];
		
		// Resize the draw area
		drawCanvas.width = display.size[0];
		drawCanvas.height = display.size[1];
		drawContext = drawCanvas.getContext("2d");
	};
	
	task.draw = function(){
		var display = this.displayAdapter;
		var model = this.model;
		
		display.clear();
		
		if(model.acceptImage && score >= minScore){	
			display.drawImage(model.acceptImage, 0, 0, model.acceptImage.width, model.acceptImage.height, 
				model.buttonAccept[0], model.buttonAccept[1], 
				model.buttonAccept[2] - model.buttonAccept[0], 
				model.buttonAccept[3] - model.buttonAccept[1]);
		}
		
		if(model.clearImage){	
			display.drawImage(model.clearImage, 0, 0, model.clearImage.width, model.clearImage.height, 
				model.buttonClear[0], model.buttonClear[1], 
				model.buttonClear[2] - model.buttonClear[0], 
				model.buttonClear[3] - model.buttonClear[1]);
		}
		
		
		if(model.bgImage){			
			let bgImage = model.bgImage;
			display.drawImage(bgImage, 0, 0, bgImage.width, bgImage.height,
			bgImage.xOffset, bgImage.yOffset, bgImage.drawWidth, bgImage.drawHeight);
		}

		if(model.brushImage && model.brushImage.complete){
			drawBrush(display, model);
			display.drawImage(drawCanvas, 0, 0, drawCanvas.width, drawCanvas.height,
				0, 0, drawCanvas.width, drawCanvas.height);
		}

		//console.error("Score: " + score);
		display.drawMessage("Score: " + Math.round(score * 100) + "%", model.buttonClear[2] + 20, model.buttonClear[1] + 30, fontInfo);

		display.drawToDisplay(true);
	};

	var getPoints = function(image){
		drawContext.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
		drawContext.drawImage(image, 0, 0, image.width, image.height,
			image.xOffset, image.yOffset, image.drawWidth, image.drawHeight);

		var test = new ArcSif(drawContext.getImageData(0, 0, drawCanvas.width, drawCanvas.height).data, drawCanvas.width, drawCanvas.height);
			console.log(test.points);

		drawContext.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
	};
	task.setBackground = function(imageUrl){
		var img = new Image();
		img.onload = function(){
			setDrawProperties(img);
			updateTestImage(img);
			//getPoints(img);
		};
		img.src = imageUrl;
		
		this.model.bgImage = img;
	};
	
	task.setComparison = function(imageUrl){
		var img = new Image();
		img.onload = function(){
			setDrawProperties(img);
		};
		img.src = imageUrl;
		
		this.model.cmpImage = img;
	};

	task.setBrushSize = function(newMinSize, newMaxSize){
		minSize = newMinSize;
		maxSize = newMaxSize;
	}
	
	
	init();
	
	return task;
})