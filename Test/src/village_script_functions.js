var CharacterScripts = new ArcBaseObject();
CharacterScripts.prototype = Object.create(ArcScriptObject.prototype)
CharacterScripts.prototype.init = function(parent){
	ArcScriptObject.prototype.init.call(this, parent);
	
	this.AttachFunction("WalkRandom");
	this.AttachFunction("WalkArea");
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
CharacterScripts.prototype.WalkArea = function(x1, y1, x2, y2){
	let waypoint = this.waypoint;
	let location = this.location;

	if(!this.lastStep[2] || Math.random() < 0.001){
		waypoint[0] = (Math.random() * (x2 - x1)) + x1;
		waypoint[1] = (Math.random() * (y2 - y1)) + y1;
	}
};

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
