var StoryCharacter = ArcBaseObject();
{
	Object.defineProperty(StoryCharacter, 'isVillageObject', {
	    enumerable: false,
	    configurable: false,
	    writable: false,
	    value: true
	});

	StoryCharacter.prototype = Object.create(NPC.prototype);
	StoryCharacter.prototype.init = function (name, type, location, size, rotation, properties) { // All village objects need the construction values in this order.
		NPC.prototype.init.call(this, name, type, location, size, rotation, properties);
		
		this.stats.hasTask = false;
		this.evaluateHasTask = false;
		if(properties["evaluateHasTask"]){
			this.evaluateHasTask = Function("time", "player", "world", "worldAdapter", properties["evaluateHasTask"])
		}
	}

	StoryCharacter.prototype.enableTask = function(worldAdapter){
		this.stats.hasTask = true;

		this.ShowPopup(worldAdapter, "alert_1", 2);
	}

	StoryCharacter.prototype.disableTask = function(){
		this.stats.hasTask = false;

		this.HidePopup();
	}

	StoryCharacter.prototype.tick = function(timeSinceLast, worldAdapter, village, player){
		NPC.prototype.tick.apply(this, arguments);

		if(this.evaluateHasTask){
			var result = this.evaluateHasTask.call(this, timeSinceLast, player, village, worldAdapter);

			if(this.stats.hasTask && !result){
				this.disableTask();
			}else if(!this.stats.hasTask && result){
				this.enableTask();
			}
		}
	}
}

var ImperialGuard = ArcBaseObject();
{
	Object.defineProperty(ImperialGuard, 'isVillageObject', {
	    enumerable: false,
	    configurable: false,
	    writable: false,
	    value: true
	});

	ImperialGuard.prototype = Object.create(NPC.prototype);
	ImperialGuard.prototype.init = function (name, type, location, size, rotation, properties) { // All village objects need the construction values in this order.
		if(!(properties.spritesheet)){
			properties.spritesheet = "imperial_guard";
		}

		if(!(properties.path)){
			properties.path = "Unknown";
		}

		NPC.prototype.init.call(this, name, type, location, size, rotation, properties);

		this.InitializePath(properties.path);
		this.fov.enabled = true;

		this.fov.color[0] = 0.0;
		this.fov.color[1] = 1.0;
		this.fov.color[2] = 0.0;
		this.fov.color[3] = 0.8;
	};

	ImperialGuard.prototype.oncooling = function(time, player, world, worldAdapter){
		this.CoolDown(time);
		this.WalkRandom(time, 100, 0.03);

		if(this.stats.coolDown <= 0){
			this.state = "onfollowpath";
			this.HidePopup();
		}
	};

	ImperialGuard.prototype.oninteract = function(time, player, world, worldAdapter){
		world.getObject("CatchPlayerEvent").playerCaught(this, player, worldAdapter);
	};

	ImperialGuard.prototype.onnosee = function(time, player, world, worldAdapter){
		this.fov.color[0] = 0.0;
		this.fov.color[1] = 1.0;

		// Return to position
		if(this.state == "onfollowing"){
			this.state = "oncooling";
			this.ShowPopup(worldAdapter, "question1", 2);
			this.stats.coolDown = 10000;
		}
	};

	ImperialGuard.prototype.onsee = function(time, player, world, worldAdapter){
		this.fov.color[0] = 1.0;
		this.fov.color[1] = 0.0;

		this.ShowPopup(worldAdapter, "alert" + (Math.floor((Math.random() * 2)) + 1), 2);
		this.FollowPlayer(player);
		this.state = "onfollowing";
	};
}