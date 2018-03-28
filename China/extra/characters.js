var StoryCharacter = ArcBaseObject();
{
	Object.defineProperty(ImperialGuard, 'isVillageObject', {
	    enumerable: false,
	    configurable: false,
	    writable: false,
	    value: true
	});

	StoryCharacter.prototype = Object.create(NPC.prototype);
	StoryCharacter.prototype.init = function (name, type, location, size, rotation, properties) { // All village objects need the construction values in this order.
		this.hasTask = properties["hasTask"] == "true";

		if(hasTask){
			this.enabledTask();
		}
	}

	StoryCharacter.prototype.enableTask = function(){
		this.hasTask = true;
	}

	StoryCharacter.prototype.disableTask = function(){
		this.hasTask = false;
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