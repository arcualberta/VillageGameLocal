var CharacterScripts = new ArcBaseObject();
CharacterScripts.prototype = Object.create(ArcScriptObject.prototype)
CharacterScripts.prototype.init = function(parent){
	ArcScriptObject.prototype.init.call(this, parent);
	
	this.AttachFunction("WalkRandom");
}
CharacterScripts.prototype.WalkRandom = function(){
	if(Math.random > 0.8){
		// Set direction
		var direction = Math.floor(Math.random() * 4);
		console.log("Direction: " + direction);
	}
}