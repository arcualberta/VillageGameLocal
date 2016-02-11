var ArcOverlay = ArcBaseObject();
ArcOverlay.prototype.init = function(parent){
    this.parent = parent;
    this.image = null;
    this.dimension = new Uint16Array(2);
    this.anchors = new Uint16Array([Number.NaN, Number.NaN, Number.NaN, Number.NaN]); // Top, Right, Bottom, Left
    this.elements = []; // List of all child elements;
    this.isShown = false;
    this.drawingArea = new Uint16Array(4);
    
    this.onCloseComplete = null;
};
ArcOverlay.prototype.show = function(){
    this.isShown = true;
};
ArcOverlay.prototype.close = function(){
    this.isShown = false;
    
    if(this.onCloseComplete){
        onCloseComplete();
    }
};
ArcOverlay.prototype.handleActions = function(actionList){
    
};
ArcOverlay.prototype.animate = function(timeSinceLast){
    var i = elements.length;
    while(i-- > -1){
        this.elements[i].animate(timeSinceLast);
    }
};
ArcOverlay.prototype.calculateDrawingArea = function(display){
    var x, y, w, h;
    var dX, dY, dW, dH;
    if(this.parent === null){
        x = 0;
        y = 0;
        w = display.size[0];
        h = display.size[1];
    }else{
        x = this.parent.drawingArea[0];
        y = this.parent.drawingArea[1];
        w = this.parent.drawingArea[2];
        h = this.parent.drawingArea[3];
    }
    
    
    if(isNaN(this.anchors[3])){
        dW = this.dimension[0];
        
        if(isNaN(this.anchors[1])){
            dX = 0;
        }else{
            dX = w + this.anchors[3] - dW;
        }
    }else{
        dX = this.anchors[3];
        
        if(isNaN(this.anchors[1])){
            dW = this.dimension[0];
        }else{
            dW = w - (dX + this.anchors[1]);
        }
    };
    
    if(isNaN(this.anchors[2])){
        dW = this.dimension[1];
        
        if(isNaN(this.anchors[0])){
            dX = 0;
        }else{
            dX = w + this.anchors[2] - dW;
        }
    }else{
        dX = this.anchors[2];
        
        if(isNaN(this.anchors[0])){
            dW = this.dimension[1];
        }else{
            dW = w - (dX + this.anchors[0]);
        }
    };
    
    this.drawingArea[0] = dX + x;
    this.drawingArea[1] = dY + y;
    this.drawingArea[2] = dW;
    this.drawingArea[3] = dH;
};
ArcOverlay.prototype.draw = function (display) {
    if (this.isShown) {
        this.calculateDrawingArea();

        // Draw
        display.drawImage(this.image, 0, 0, this.image.width, this.image.height, this.drawingArea[0], this.drawingArea[1], this.drawingArea[2], this.drawingArea[3]);

        var i = elements.length;
        while (i-- > -1) {
            this.elements[i].draw(display);
        }
    }
};