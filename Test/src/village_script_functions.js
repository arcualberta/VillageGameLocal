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
				waypoint[0] = location[0];
				waypoint[1] = location[1] + amount;
				break;
			case 1:
				waypoint[0] = location[0] + amount;
				waypoint[1] = location[1];
				break;
			case 2:
				waypoint[0] = location[0];
				waypoint[1] = location[1] - amount;
				break;
			case 3:
				waypoint[0] = location[0] - amount;
				waypoint[1] = location[1];
				break;
		}
	}
};
CharacterScripts.prototype.WalkArea = function(x1, y1, x2, y2){
	let waypoint = this.waypoint;
	let location = this.location;

	if(!this.lastStep[2]){
		waypoint[0] = (Math.random() * (x2 - x1)) + x1;
		waypoint[1] = (Math.random() * (y2 - y1)) + y1;
	}
};