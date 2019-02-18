var CanvasComponent = ArcBaseObject();
{
	CanvasComponent.prototype = Object.create(ArcRenderableObject.prototype);

	/*CanvasComponent.Anchors = {
		NONE: 0x00,
		LEFT: 0x01, RIGHT: 0x02, HORIZONTAL_CENTER: 0x04,
		TOP: 0x08, BOTTOM: 0x10, VERTICAL_CENTER: 0x20
	};*/

	CanvasComponent.prototype.init = function(tickEnabled, drawEnabled){
		this.alpha = 1.0;

		ArcRenderableObject.prototype.init.call(this, tickEnabled, drawEnabled);

		//this.anchors = CanvasComponent.Anchors.NONE;
	}

	CanvasComponent.prototype.draw = function(displayContext, xOffset, yOffset, width, height){
		if(this.alpha > 0.0){
			ArcRenderableObject.prototype.draw.apply(this, arguments);
		}
	};
}

var ImageCanvasComponent = ArcBaseObject();
{
	CanvasComponent.prototype = Object.create(CanvasComponent.prototype);

	ImageCanvasComponent.prototype.init = function(imageUrl){

	}
}