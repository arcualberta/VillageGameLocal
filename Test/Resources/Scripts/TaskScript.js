// This script needs to create two functions needed for the game. Draw and update.
// An object with the name model is provided to store data in. It contains the task title and other pre-provided task information.
(function(){
    return {
        draw: function(display, model, drawModel){
            display.drawToDisplay();
        },
        update: function(params){
            self.postMessage([WORKER_DRAW_SCENE, model]);
        },
        done: function(display, model, drawModel){
            console.log("Closing Task!");
            return true;
        },
        reward: function(model, drawModel){
            return { name: "MISSINGNO.", image: null};
        },
        allowGL: true
    }
})