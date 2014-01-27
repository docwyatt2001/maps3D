define([
	'jquery', 
	'underscore', 
	'backbone',
	'model/ProfilePoints',
	'text!templates/map_view.html',
	'bootstrap_slider'
	],
	function($, _, Backbone, ProfilePoints, ProfilePoint){

		/**
		* GoogleMapsView
		*/
		var GoogleMapsView = Backbone.View.extend({

			map: null,
			rect: new google.maps.Rectangle({editable: true, draggable: true}),

			initialize: function(options){
				console.log('new GoogleMapsView created');
				this.on = this.vent.on;
				this.trigger = this.vent.trigger;
				this.horizontalSegments = this.verticalSegments = 1;
				this.__defineGetter__('coordinates', function(){ return this.getCoordinates()});
				this.__defineSetter__('gridSize', function(value){
					this.horizontalSegments = value;
					this.verticalSegments = value;
					this.trigger('rect:grid:changed');
				})

				mapView = this;
				google.maps.event.addListener(this.rect, 'mouseup', this.onRectMouseUp);
				google.maps.event.addListener(this.rect, 'mouseDown', this.onRectMouseDown);
				google.maps.event.addListener(this.rect, 'bounds_changed', this.onRectBoundsChanged);
				
				this.$slider = $("#slider");
				this.$slider.on('slideStart', this.onSliderStart);
				this.$slider.on('slide', this.onSliderValueChanging);
				this.$slider.on('slideStop', this.onSliderStop);

				this.render();
			},

			render: function(){
				console.log('rendering GoogleMapsView');				
				this.$slider.slider();
				var mapOptions = {
					center : new google.maps.LatLng(45.976433, 7.658448), // Matterhorn
					zoom : 12,
					mapTypeId : google.maps.MapTypeId.ROADMAP
				};
				this.map = new google.maps.Map(this.el, mapOptions);

				// Auswahlrechteck erstellen
				this.rect.setMap(this.map);
				this.rect.setBounds(new google.maps.LatLngBounds(		
					new google.maps.LatLng(45.956433, 7.63),
					new google.maps.LatLng(46, 7.7 )
				));		

			},

			getCoordinates: function(){
				this.gridSize = mapView.$slider.slider('getValue').val();

				// Positionen der Ecken bestimmen
				var ne = this.rect.getBounds().getNorthEast();
				var sw = this.rect.getBounds().getSouthWest();
				var nw = new google.maps.LatLng(ne.lat(), sw.lng());
				var se = new google.maps.LatLng(sw.lat(), ne.lng());
				
				// get values on x-axis
				var xFrom = nw.lng();
				var xTo = ne.lng();	
				var xStep = (xTo-xFrom)/(this.horizontalSegments - 1);
				
				// get values on y-axis
				var yFrom = se.lat();
				var yTo = ne.lat();
				var yStep = (yTo-yFrom)/(this.verticalSegments - 1);
				
				var profilePoints = new ProfilePoints();
				for(var y=0; y<this.verticalSegments; y++){
					yVal = yTo - y*yStep;
					
					for (var x=0; x<this.horizontalSegments; x++){
						xVal = xFrom + x*xStep;
						profilePoints.add({lng: Number(parseFloat(xVal).toFixed(4)), lat: Number(parseFloat(yVal).toFixed(4))});
					}
				}
				return profilePoints;
			},

			coordinates: function(){
				return this.getCoordinates();
			},

			/*
			* Event handlers
			*/
			onRectMouseUp: function()
			{
				this.mouseUp = true;
			},
			onRectMouseDown: function()
			{
				this.mouseUp = false;
			},
			onRectBoundsChanged: function()
			{
				mapView.trigger('rect:bounds:changing');
				if (this.mouseUp)
					mapView.trigger('rects:bounds:changed')
			},
			onSliderStart: function(event)
			{
				// kein Event
			},
			onSliderValueChanging: function(event)
			{
				mapView.trigger('rect:grid:changing')
			},
			onSliderStop: function(event)
			{
				mapView.gridSize = mapView.$slider.slider('getValue').val();
			}

		});	

		return GoogleMapsView;

});