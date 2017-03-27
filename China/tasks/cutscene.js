(function(task, resourcePath){
	task.animations = [];
	task.loop = true;
	task.current = 0;
	task.time = 0;
	task.allowGL = false;

	task.addAnimation = function(imgUrl, time){
		var img = new Image();
		img.onload = function(){

		};
		img.src = imgUrl;

		task.animations.push({
			img: img,
			time: time
		});
	};

	task.update = function(time){
		var actions = this.controlAdapter.pullActionList();

		for(var i in actions){
			switch(actions[i].id){
				case CONTROL_MOUSE1_UP:
					this.close();
					break;
			}
		}

		if(this.animations.length > 0){
			this.time += time;
			let current = this.animations[this.current];
			while(this.time >= current.time){
				this.time -= current.time;
				this.current++;
				this.current = this.current % this.animations.length;
			}
		}
	};

	task.draw = function(){
		if(this.animations.length > 0){
			var display = this.displayAdapter;
			var current = this.animations[this.current];

			display.drawImage(current.img, 0, 0, current.img.width, current.img.height,
				0, 0, display.size[0], display.size[1]);

			display.drawToDisplay(true);
		}
	}

	return task;
});