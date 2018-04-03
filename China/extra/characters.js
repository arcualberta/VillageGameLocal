
var Crowd = ArcBaseObject();
{
		var m_timestamp = 0;
		var m_popup = null;
		var m_afterPopup = false;
		var m_count = 0;
		var m_waitCount = 0;

		Object.defineProperty(Crowd, 'isVillageObject', {
		    enumerable: false,
		    configurable: false,
		    writable: false,
		    value: true
		});

		Crowd.prototype = Object.create(NPC.prototype);
		Crowd.prototype.init = function (name, type, location, size, rotation, properties) { // All village objects need the construction values in this order.
			NPC.prototype.init.call(this, name, type, location, size, rotation, properties);

			this.properties.timestamp = 0;

			this.animation = "stand_up"; 

			++m_count;
		}

		Crowd.updatePopup = function(popup, afterPopup){
			m_timestamp = Date.now();
			m_popup = popup;
			m_afterPopup = afterPopup;
			m_waitCount = 0;
		}

		Crowd.prototype.tick = function(timeSinceLast, worldAdapter, village, player){
			NPC.prototype.tick.apply(this, arguments);

			if(this.properties.timestamp < m_timestamp){
				this.properties.timestamp = Date.now();

				if(m_popup){
					this.ShowPopup(worldAdapter, m_popup, 2);
				}else{
					this.HidePopup();
				}

				++m_waitCount;

				if(m_afterPopup && m_waitCount >= m_count){
					m_afterPopup(timeSinceLast, worldAdapter, village, player);
					m_afterPopup = null;
				}
			}
		}
}
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
		if(properties["evaluatehastask"]){
			this.evaluateHasTask = Function("time", "player", "world", "worldAdapter", properties["evaluatehastask"])
		}
	}

	StoryCharacter.prototype.enableTask = function(worldAdapter){
		this.stats.hasTask = true;

		this.ShowPopup(worldAdapter, "alert1", 2);
	}

	StoryCharacter.prototype.disableTask = function(){
		this.stats.hasTask = false;

		this.HidePopup();
	}

	StoryCharacter.prototype.tick = function(timeSinceLast, worldAdapter, village, player){
		NPC.prototype.tick.apply(this, arguments);

		if(player && this.evaluateHasTask){
			if(this.evaluateHasTask){
				var result = this.evaluateHasTask.call(this, timeSinceLast, player, village, worldAdapter);
			}

			if(result){
				this.enableTask(worldAdapter);
			}else{
				this.disableTask();
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

console.log("Loaded Character Library");