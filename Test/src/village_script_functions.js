var CharacterScripts = new ArcBaseObject();
{
	CharacterScripts.prototype = Object.create(ArcScriptObject.prototype)
	CharacterScripts.prototype.init = function(parent){
		ArcScriptObject.prototype.init.call(this, parent);
		
		this.AttachFunction("WalkRandom");
		this.AttachFunction("WalkArea");
		this.AttachFunction("InitializePath");
		this.AttachFunction("UpdatePath");
		this.AttachFunction("FollowPlayer");
		this.AttachFunction("WalkToLocation");
		this.AttachFunction("SetupFOVCharacter");
		this.AttachFunction("CoolDown");
		this.AttachFunction("SetDirection");
	};
	CharacterScripts.prototype.WalkRandom = function(time, amount, frequency){
		let waypoint = this.waypoint;
		let location = this.location;

		if(Math.random() < frequency){
			// Set direction
			let direction = Math.floor(Math.random() * 4);

			switch(direction){
				case 0:
					waypoint[0] = location[4];
					waypoint[1] = location[5] + amount;
					break;
				case 1:
					waypoint[0] = location[4] + amount;
					waypoint[1] = location[5];
					break;
				case 2:
					waypoint[0] = location[4];
					waypoint[1] = location[5] - amount;
					break;
				case 3:
					waypoint[0] = location[4] - amount;
					waypoint[1] = location[5];
					break;
			}
		}
	};

	CharacterScripts.prototype.WalkToLocation = function(x, y){
		let waypoint = this.waypoint;
		waypoint[0] = x;
		waypoint[1] = y;
	};
	CharacterScripts.prototype.SetDirection = function(direction){
		if(this.direction != direction){
			this.direction = direction;
			this.updateAnimation();
		}
	}
	CharacterScripts.prototype.WalkArea = function(x1, y1, x2, y2){
		let waypoint = this.waypoint;
		let location = this.location;

		if(!this.lastStep[2] || Math.random() < 0.001){
			waypoint[0] = (Math.random() * (x2 - x1)) + x1;
			waypoint[1] = (Math.random() * (y2 - y1)) + y1;
		}
	};
	CharacterScripts.prototype.InitializePath = function(pathName, startingpoint = 0, reversed = false){
		if(pathName){
			this.path = {
				name: pathName,
				point: startingpoint,
				reversed: reversed,
				pointBuffer: new Float32Array(2)
			}

			this.path.pointBuffer[0] = this.waypoint[0];
			this.path.pointBuffer[1] = this.waypoint[1];

			this.state = "onfollowpath";

			this.onfollowpath = function(timeSinceLast, worldAdapter, village, player){
				this.UpdatePath(village);
			}
		}
	}
	CharacterScripts.prototype.UpdatePath = function(village){
		var localPath = this.path;
		var path = village.objects.getChild(localPath.name);

		if(path){
			if(localPath.point >= path.pointCount){
				localPath.point = path.pointCount - 1;
				localPath.reversed = !localPath.reversed;
			}else if(localPath.point <= 0){
				localPath.point = 0;
				localPath.reversed = !localPath.reversed;
			}

			path.getPoint(localPath.point, localPath.pointBuffer);

			if(this.waypoint[0] != localPath.pointBuffer[0] || this.waypoint[1] != localPath.pointBuffer[1]){
				this.waypoint[0] = localPath.pointBuffer[0];
				this.waypoint[1] = localPath.pointBuffer[1];
			}else{
				if(!this.lastStep[2]){ // We reached the waypoint
					//TODO trigger on reach waypoint

					if(localPath.reversed){
						--localPath.point;
					}else{
						++localPath.point;
					}
				}
			}
		}
	}
	CharacterScripts.prototype.FollowPlayer = function(player){
		this.waypoint[0] = player.location[0];
		this.waypoint[1] = player.location[1];
	}
	CharacterScripts.prototype.SetupFOVCharacter = function(state = "onwait", angle = 35, distance = 300){
		this.fov.enabled = true;
		this.fov.distance = distance;
		this.fov.angle = (angle * Math.PI) / 180;

		this.fov.color[0] = 0.0;
		this.fov.color[1] = 1.0;
		this.fov.color[2] = 0.0;
		this.fov.color[3] = 0.8;

		this.stats.initialLocation = new Float32Array([this.location[0], this.location[1]]);
		this.stats.coolDown = 0;
		this.state = state;
	};
	CharacterScripts.prototype.CoolDown = function(timeSinceLast){
		this.coolDown -= timeSinceLast;

		if(coolDown < 0){
			coolDown == 0;
		}
	};
}

var DialogScripts = new ArcBaseObject();
DialogScripts.prototype = Object.create(ArcScriptObject.prototype)
DialogScripts.prototype.init = function(parent){
	ArcScriptObject.prototype.init.call(this, parent);

	this.AttachFunction("TriggerDialog");
	this.AttachFunction("TriggerTask");
};
DialogScripts.prototype.TriggerDialog = function(messageKey, worldAdapter, player, onclose){
	return worldAdapter.showMessage(messageKey, false, player, this, onclose);
};
DialogScripts.prototype.TriggerTask = function(task, worldAdapter, onclose){
	return worldAdapter.loadTask(task, worldAdapter.getTaskScript(task), onclose);
};
