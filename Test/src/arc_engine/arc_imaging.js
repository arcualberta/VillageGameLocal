/**
* @param pixelArray An array of pixels representing a grayscale version of the image.
* @param width
* @param height
*/
var ArcSif = ArcBaseObject();
{
	var blurImage = function(inputBuffer, backBuffer, outputBuffer, width, height){
		var y, x;
		var index = 0;
		var value = 0.0;
		var max = height - 1;

		// Verticle blur
		for(y = 0; y < height; ++y){
			for(x = 0; x < width; ++x){
				value = inputBuffer[index];

				if(y > 0){
					value += inputBuffer[index - width];
				}else{
					value += inputBuffer[index];
				}

				if(y < max){
					value += inputBuffer[index + width];
				}else{
					value += inputBuffer[index];
				}

				backBuffer[index] = Math.round(value / 3.0);
				++index;
			}
		}

		// Horizontal blur
		index = 0;
		max = width - 1;
		for(y = 0; y < height; ++y){
			for(x = 0; x < width; ++x){
				value = backBuffer[index];

				if(x > 0){
					value += backBuffer[index - 1];
				}else{
					value += backBuffer[index];
				}

				if(x < max){
					value += backBuffer[index + 1];
				}else{
					value += backBuffer[index];
				}

				outputBuffer[index] = Math.round(value / 3.0);
				++index;
			}
		}
	};

	var isPoint = function(pixelArray, x, y, width, height){
		var isMax = true;
		var isMin = true;
		var index = (y * width) + x;
		var value = pixelArray;
		var checkVal;
		var xMin = x > 0 ? x - 1 : x;
		var xMax = x < (width - 1) ? x + 1 : x;
		var yMin = y > 0 ? y - 1 : y;
		var yMax = y < (height - 1) ? y + 1 : y;

		for(var v = yMin; v < yMax; ++v){
			for(var u = xMin; u < xMax; ++u){
				if(u != x || v != y){
					checkVal = pixelArray[(v * width) + u];

					isMax = isMax && (checkVal < value);
					isMin = isMin && (checkVal > value);

					if(!(isMax || isMin)){
						return false;
					}
				}
			}
		}

		return isMin || isMax;
	};

	var findPoints = function(pixelArray, width, height, points){
		for(var y = 0; y < height; ++y){
			for(var x = 0; x < width; ++x){
				if(isPoint(pixelArray, x, y, width, height)){
					points.push(x);
					points.push(y);
				}
			}
		}
	};

	var evaluatePoints = function(pixelArray, width, height, points){
		var x, y;
		var i = points.length - 1;

		if(i > 0){
			while(i < points.length){
				y = points[i];
				--i;
				x = points[i];

				if(!isPoint(pixelArray, x, y, width, height)){
					points.splice(i, 2);
				}

				--i;
			}
		}
	};

	var initialize = function(pixelArray, width, height) {
		var size = width * height;
		var currentBuffer = new Uint8Array(size);
		var backBuffer = new Uint8Array(size);

		for(var i = 0; i < size; ++i){
			currentBuffer[i] = pixelArray[i << 1];
		}

		blurImage(currentBuffer, backBuffer, currentBuffer, width, height);
		findPoints(currentBuffer, width, height, this.points);

		for(i = 0; i < 2; ++i){
			blurImage(currentBuffer, backBuffer, currentBuffer, width, height);
			evaluatePoints(currentBuffer, width, height, this.points);
		}
	};

	ArcSif.prototype.init = function(pixelArray, width, height){
		this.points = [];

		initialize.call(this, pixelArray, width, height);
	}
}