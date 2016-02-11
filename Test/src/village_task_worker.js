// Run imports
importScripts("arc_engine/arc_constants.js");
importScripts("arc_engine/arc_objects.js");
importScripts("village_constants.js");
importScripts("village_objects.js");
importScripts("village_functions.js");

var taskFunc = {};
var model = {};

function runFunction(name, params){
    var func = taskFunc[name];
    
    if(func){
        func(params);
    }
}

self.onmessage = function(e){
    var data = e.data;
    switch(data[0]){
        case WORKER_SET_MODEL:
            model = data[1];
            break;
        case WORKER_LOAD_TASK_FUNCTION:
            taskFunc[data[1]] = eval(data[2]);
            break;
        case WORKER_RUN_TASK_FUNCTION:
            runFunction(data[1], data[2]);
            break;
    }
}