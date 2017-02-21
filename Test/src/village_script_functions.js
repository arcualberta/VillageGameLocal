var CharacterScripts = new ArcBaseObject();
CharacterScripts.prototype = Object.create(ArcScriptObject.prototype)
CharacterScripts.prototype.init = function(parent){
	ArcScriptObject.prototype.init.call(this, parent);
	
	this.AttachFunction("WalkRandom");
}
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
}