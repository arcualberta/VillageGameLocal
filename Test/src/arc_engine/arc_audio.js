var ArcBaseAudioAdapter = ArcBaseObject();
ArcBaseAudioAdapter.prototype.init = function () {

};
ArcBaseAudioAdapter.prototype.setVolume = function (value) {

};
ArcBaseAudioAdapter.prototype.getVolume = function () {

};
ArcBaseAudioAdapter.prototype.loadSound = function (sound, play, onError) {

};
ArcBaseAudioAdapter.prototype.playSound = function (sound) {

};
ArcBaseAudioAdapter.prototype.stopSound = function (sound) {

};
ArcBaseAudioAdapter.prototype.updateSound = function (sound, location) {

};

var ArcAudioAdapter = ArcBaseObject();
ArcAudioAdapter.prototype = Object.create(ArcBaseAudioAdapter.prototype);
ArcAudioAdapter.prototype.init = function () {
    var context;
    var gainNode;
    try {
        window.AudioContext = window.AudioContext ||
                window.webkitAudioContext ||
                window.mozAudioContext ||
                window.oAudioContext ||
                window.msAudioContext;

        context = new AudioContext();

        gainNode = context.createGain();
        gainNode.gain.value = 1.0;
        gainNode.connect(context.destination);
    } catch (e) {
        throw("Web Audio API is not supported in this browser.");
    }

    this.context = context;
    this.gainNode = gainNode;
    this.buffers = {};
};
ArcAudioAdapter.prototype.setVolume = function (value) {
    this.gainNode.gain.value = value;
};
ArcAudioAdapter.prototype.getVolume = function () {
    return this.gainNode.gain.value;
};
ArcAudioAdapter.prototype.loadSound = function (sound, play, onError) {
    var buffers = this.buffers;
    if (buffers[sound.name]) {
        if (play) {
            this.playSound(sound);
        }
    } else {
        var context = this.context;
        var request = new XMLHttpRequest();
        var __this = this;
        request.open('GET', sound.url, true);
        request.responseType = 'arraybuffer';
        buffers[sound.name] = false;

        request.onload = function () {
            context.decodeAudioData(request.response, function (buffer) {
                buffers[sound.name] = buffer;

                if (play) {
                    __this.playSound(sound);
                }
            }, onError);
        };

        request.send();
    }
};
ArcAudioAdapter.prototype.playSound = function (sound, fade) {
    var buffer = this.buffers[sound.name];

    if (buffer) {
        var context = this.context;

        var source = context.createBufferSource();
        source.buffer = buffer;

        sound.gain = context.createGain();
        sound.gain.gain.value = sound.volume;
        source.connect(sound.gain);
        sound.gain.connect(this.gainNode);

        source.loop = sound.loop;

        source.start(0);
        sound.source = source;

        return source;
    } else {
        this.loadSound(sound, true);
    }

    return null;
};
ArcAudioAdapter.prototype.stopSound = function(sound, fade){
    if(sound && sound.source){
        sound.source.stop();
    }
};
ArcAudioAdapter.prototype.updateSound = function (sound, location) {
    if (sound.radius > 0.0) {
        var dx = sound.location[0] - location[0];
        var dy = sound.location[1] - location[1];
        var distance = Math.sqrt((dx * dx) + (dy * dy));

        sound.volume = Math.pow(Math.max(1.0 - (distance * sound.radius), 0.0), 2.0);

        if (sound.gain !== null) {
            sound.gain.gain.value = sound.volume;
        }
    }
};


function arcGetAudioAdapter() {
    var adapter;

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        //return new MobileCanvasAdapter(canvas);
    }

    try {
        adapter = new ArcAudioAdapter();
    } catch (e) {
        console.log(e);
        adapter = new ArcBaseAudioAdapter();
    }

    //if(adapter == null){
    //    adapter = new CanvasAdapter(canvas);
    //}

    return adapter;
}