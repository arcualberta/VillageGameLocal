var WorldAdapter = ArcBaseObject();
WorldAdapter.prototype.init = function (stateResponseFunction) {
};
WorldAdapter.prototype.login = function (passcode) {
    return {
        isSuccessful: true
    };
};
WorldAdapter.prototype.logout = function (userId) {

};
WorldAdapter.prototype.requestWorldState = function (userId) {

};
WorldAdapter.prototype.getWorldActions = function (timestamp) {

};
WorldAdapter.prototype.postWorldActions = function (actionList) {

};
WorldAdapter.prototype.getSpriteSheet = function (id) {

};
WorldAdapter.prototype.getSpriteSheetList = function () {

};
WorldAdapter.prototype.getTaskScript = function(taskScript) {

};
WorldAdapter.prototype.getConfigSetting = function(name){
	return null;
};
WorldAdapter.prototype.isLoaded = function(){
	return true;
}
WorldAdapter.prototype.onAfterLoaded = function(loadedFunction){
    if(this.isLoaded()){
        loadedFunction(adapter);
    }else{
    	var _this = this;
        setTimeout(function(){
            onAfterLoaded(loadedFunction);
        }, 1000);
    }
}