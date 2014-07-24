GoldenLayout = (function(){var lm={"config":{},"container":{},"controls":{},"errors":{},"items":{},"utils":{}};

lm.utils.F = function () {};
	
lm.utils.extend = function( subClass, superClass ) {
	subClass.prototype = lm.utils.createObject( superClass.prototype );
	subClass.prototype.contructor = subClass;
};

lm.utils.createObject = function( prototype ) {
	if( typeof Object.create === 'function' ) {
		return Object.create( prototype );
	} else {
		lm.utils.F.prototype = prototype;
		return new lm.utils.F();
	}
};

lm.utils.objectKeys = function( object ) {
	var keys, key;

	if( typeof Object.keys === 'function' ) {
		return Object.keys( object );
	} else {
		keys = [];
		for( key in object ) {
			keys.push( key );
		}
		return keys;
	}
};

lm.utils.copy = function( target, source ) {
	for( var key in source ) {
		target[ key ] = source[ key ];
	}
};

/**
 * This is based on Paul Irish's shim, but looks quite odd in comparison. Why?
 * Because 
 * a) it shouldn't affect the global requestAnimationFrame function
 * b) it shouldn't pass on the time that has passed
 *
 * @param   {Function} fn
 *
 * @returns {void}
 */
lm.utils.animFrame = function( fn ){
	return ( window.requestAnimationFrame     ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame    ||
	function( callback ){
		window.setTimeout(callback, 1000 / 60);
	})(function(){
		fn();
	});
};

lm.utils.indexOf = function( needle, haystack ) {
	if( !( haystack instanceof Array ) ) {
		throw new Error( 'Haystack is not an Array' );
	}
	
	if( haystack.indexOf ) {
		return haystack.indexOf( needle );
	} else {
		for( var i = 0; i < haystack.length; i++ ) {
			if( haystack[ i ] === needle ) {
				return i;
			}
		}
		return -1;
	}
};

lm.utils.fnBind = function( fn, context, boundArgs ) {

	if( Function.prototype.bind !== undefined ) {
		return Function.prototype.bind.apply( fn, [ context ].concat( boundArgs || [] ) );
	}

	var bound = function () {

		// Join the already applied arguments to the now called ones (after converting to an array again).
		var args = ( boundArgs || [] ).concat(Array.prototype.slice.call(arguments, 0));

		// If not being called as a constructor
		if (!(this instanceof bound)){
			// return the result of the function called bound to target and partially applied.
			return fn.apply(context, args);
		}
		// If being called as a constructor, apply the function bound to self.
		fn.apply(this, args);
	};
	// Attach the prototype of the function to our newly created function.
	bound.prototype = fn.prototype;
	return bound;
};

lm.utils.removeFromArray = function( item, array ) {
	var index = lm.utils.indexOf( item, array );

	if( index === -1 ) {
		throw new Error( 'Can\'t remove item from array. Item is not in the array' );
	}

	array.splice( index, 1 );
};
lm.utils.EventEmitter = function()
{
	this._mSubscriptions = { };
	this._mSubscriptions[ lm.utils.EventEmitter.ALL_EVENT ] = [];

	this.on = function( sEvent, fCallback, oContext )
	{
		if( !this._mSubscriptions[ sEvent ] )
		{
			this._mSubscriptions[ sEvent ] = [];
		}

		this._mSubscriptions[ sEvent ].push({ fn: fCallback, ctx: oContext });
	};

	this.emit = function( sEvent )
	{
		var i, ctx, args;

		args = Array.prototype.slice.call( arguments, 1 );
		
		if( this._mSubscriptions[ sEvent ] ) {
			for( i = 0; i < this._mSubscriptions[ sEvent ].length; i++ )
			{
				ctx = this._mSubscriptions[ sEvent ][ i ].ctx || {};
				this._mSubscriptions[ sEvent ][ i ].fn.apply( ctx, args );
			}
		}
		
		args.unshift( sEvent );

		for( i = 0; i < this._mSubscriptions[ lm.utils.EventEmitter.ALL_EVENT ].length; i++ )
		{
			ctx = this._mSubscriptions[ lm.utils.EventEmitter.ALL_EVENT ][ i ].ctx || {};
			this._mSubscriptions[ lm.utils.EventEmitter.ALL_EVENT ][ i ].fn.apply( ctx, args );
		}
	};

	this.unbind = function( sEvent, fCallback, oContext )
	{
		if( !this._mSubscriptions[ sEvent ] ) {
			throw new Error( 'No subscribtions to unsubscribe for event ' + sEvent );
		}

		var i, bUnbound = false;

		for( i = 0; i < this._mSubscriptions[ sEvent ].length; i++ )
		{
			if
			(
				this._mSubscriptions[ sEvent ][ i ].fn === fCallback &&
				( !oContext || oContext === this._mSubscriptions[ sEvent ][ i ].ctx )
			)
			{
				this._mSubscriptions[ sEvent ].splice( i, 1 );
				bUnbound = true;
			}
		}

		if( bUnbound === false )
		{
			throw new Error( 'Nothing to unbind for ' + sEvent );
		}
	};

	this.off = this.unbind;
	//this.subscribe = this.on;
	this.trigger = this.emit;
};

lm.utils.EventEmitter.ALL_EVENT = '__all';
lm.utils.DragListener = function(eElement, nButtonCode)
{
	lm.utils.EventEmitter.call(this);

	this._eElement = $(eElement);
	this._oDocument = $(document);
	this._eBody = $(document.body);
	this._nButtonCode = nButtonCode || 0;

	/**
	* The delay after which to start the drag in milliseconds
	*/
	this._nDelay = 200;

	/**
	* The distance the mouse needs to be moved to qualify as a drag
	*/
	this._nDistance = 10;//TODO - works better with delay only

	this._nX = 0;
	this._nY = 0;

	this._nOriginalX = 0;
	this._nOriginalY = 0;

	this._bDragging = false;

	this._fMove = lm.utils.fnBind( this.onMouseMove, this );
	this._fUp = lm.utils.fnBind( this.onMouseUp, this );

	this._eElement.mousedown( lm.utils.fnBind( this.onMouseDown, this ) );
};

lm.utils.DragListener.timeout = null;

lm.utils.copy( lm.utils.DragListener.prototype, {
	onMouseDown: function(oEvent)
	{
		oEvent.preventDefault();
		
		this._nOriginalX = oEvent.pageX;
		this._nOriginalY = oEvent.pageY;

		this._oDocument.on('mousemove', this._fMove);
		this._oDocument.one('mouseup', this._fUp);

		this._timeout = setTimeout( lm.utils.fnBind( this._startDrag, this ), this._nDelay );
	},

	onMouseMove: function(oEvent)
	{
		oEvent.preventDefault();

		this._nX = oEvent.pageX - this._nOriginalX;
		this._nY = oEvent.pageY - this._nOriginalY;
		
		if( this._bDragging === false ) {
			if(
				Math.abs( this._nX ) > this._nDistance ||
				Math.abs( this._nY ) > this._nDistance
			){
				clearTimeout( this._timeout );
				this._startDrag();
			}
		}

		if( this._bDragging )
		{
			this.emit('drag', this._nX, this._nY, oEvent );
		}
	},

	onMouseUp: function(oEvent)
	{
		clearTimeout( this._timeout );
		this._eBody.removeClass( 'lm_dragging' );
		this._oDocument.unbind( 'mousemove', this._fMove);
		
		if( this._bDragging === true )
		{
			this._bDragging = false;
			this.emit('dragStop', oEvent, this._nOriginalX + this._nX);
		}
	},

	_startDrag: function()
	{
		this._bDragging = true;
		this._eBody.addClass( 'lm_dragging' );
		this.emit('dragStart', this._nOriginalX, this._nOriginalY);
	}
});


lm.LayoutManager = function( config, container ) {

	lm.utils.EventEmitter.call( this );

	this.isInitialised = false;
	this._isFullPage = false;
	this._resizeTimeoutId = null;
	this._components = {};
	this._itemAreas = [];
	this._resizeFunction = lm.utils.fnBind( this._onResize, this );
	this._maximisedItem = null;
	this._maximisePlaceholder = $( '<div class="lm_maximise_place"></div>' );

	this.width = null;
	this.height = null;
	this.root =  null;
	this.config = this._createConfig( config );
	this.container = container;
	this.dropTargetIndicator = null;
	this.tabDropPlaceholder = $( '<div class="lm_drop_tab_placeholder"></div>' );

	this._typeToItem = {
		'column': lm.utils.fnBind( lm.items.RowOrColumn, this, [ true ] ),
		'row': lm.utils.fnBind( lm.items.RowOrColumn, this, [ false ] ),
		'stack': lm.items.Stack,
		'component': lm.items.Component
	};
};

lm.utils.copy( lm.LayoutManager.prototype, {
	
	/**
	 * Register a component with the layout manager. If a configuration node
	 * of type component is reached it will look up componentName and create the
	 * associated component
	 *
	 *  {
	 *		type: "component",
	 *		componentName: "EquityNewsFeed",
	 *		componentState: { "feedTopic": "us-bluechips" }
	 *  }
	 *  
	 * @param   {String} name
	 * @param   {Function} constructor
	 *
	 * @returns {void}
	 */
	registerComponent: function( name, constructor ) {
		if( typeof constructor !== 'function' ) {
			throw new Error( 'Please register a constructor function' );
		}

		if( this._components[ name ] !== undefined ) {
			throw new Error( 'Component ' + name + ' is already registered' );
		}

		this._components[ name ] = constructor;
	},

	/**
	 * Creates a layout configuration out of the current state
	 *
	 * @returns {Object} GoldenLayout configuration
	 */
	toConfig: function() {
		var config = $.extend( true, {}, this.config );
		config.content = [];
		var next = function( configNode, item ) {
			var key, i;
			
			for( key in item.config ) {
				if( key !== 'content' ) {
					configNode[ key ] = item.config[ key ];
				}
			}

			if( item.contentItems.length ) {
				configNode.content = [];
				
				for( i = 0; i < item.contentItems.length; i++ ) {
					configNode.content[ i ] = {};
					next( configNode.content[ i ], item.contentItems[ i ] );
				}
			}
		};

		next( config, this.root );

		return config;
	},

	/**
	 * Returns a previously registered component
	 *
	 * @param   {String} name The name used
	 *
	 * @returns {Function}
	 */
	getComponent: function( name ) {
		if( this._components[ name ] === undefined ) {
			throw new lm.errors.ConfigurationError( 'Unknown component ' + name );
		}

		return this._components[ name ];
	},

	init: function() {
		if( document.readyState === 'loading' ) {
			$(document).ready(this.init.bind( this ));
			return;
		}

		this._setContainer();
		this.dropTargetIndicator = new lm.controls.DropTargetIndicator( this.container );
		this.updateSize();
		this._create( this.config );
		this._bindEvents();
		this.isInitialised = true;
		this.emit( 'initialised' );
	},

	/**
	 * Updates the layout managers size
	 *
	 * @param   {[int]} width  height in pixels
	 * @param   {[int]} height width in pixels
	 *
	 * @returns {void}
	 */
	updateSize: function( width, height ) {
		if( arguments.length === 2 ) {
			this.width = width;
			this.height = height;
		} else {
			this.width = this.container.width();
			this.height = this.container.height();
		}

		if( this.isInitialised === true ) {
			this.root.callDownwards( 'setSize' );
		}
	},

	destroy: function() {
		$( window ).off( 'resize', this._resizeFunction );
		this.root.callDownwards( '_$destroy', [], true );
		this.root.contentItems = [];
		this.tabDropPlaceholder.remove();
		this.dropTargetIndicator.element.remove();
	},

	createContentItem: function( config, parent ) {
		var typeErrorMsg, contentItem;

		if( typeof config.type !== 'string' ) {
			throw new lm.errors.ConfigurationError( 'Missing parameter \'type\'', config );
		}

		if( !this._typeToItem[ config.type ] ) {
			typeErrorMsg = 'Unknown type \'' + config.type + '\'. ' +
				'Valid types are ' + lm.utils.objectKeys( this._typeToItem ).join( ',' );

			throw new lm.errors.ConfigurationError( typeErrorMsg );
		}


		/**
		 * We add an additional stack around every component that's not within a stack anyways
		 */
		if( config.type === 'component' && !( parent instanceof lm.items.Stack ) && !!parent ) {
			config = {
				type: 'stack',
				isClosable: config.isClosable,
				width: config.width,
				height: config.height,
				content: [ config ]
			};
		}

		contentItem = new this._typeToItem[ config.type ]( this, config, parent );

		return contentItem;
	},

	/*************************
	* PACKAGE PRIVATE
	*************************/
	_$maximiseItem: function( contentItem ) {
		if( this._maximisedItem !== null ) {
			this._$minimiseItem( this._maximisedItem );
		}
		this._maximisedItem = contentItem;
		contentItem.element.addClass( 'lm_maximised' );
		contentItem.element.after( this._maximisePlaceholder );
		this.container.prepend( contentItem.element );
		contentItem.element.width( this.container.width() );
		contentItem.element.height( this.container.height() );
		contentItem.callDownwards( 'setSize' );
	},

	_$minimiseItem: function( contentItem ) {
		contentItem.element.removeClass( 'lm_maximised' );
		this._maximisePlaceholder.after( contentItem.element );
		this._maximisePlaceholder.remove();
		contentItem.parent.callDownwards( 'setSize' );
		this._maximisedItem = null;
	},

	_$getArea: function( x, y ) {
		var i, area, smallestSurface = Infinity, mathingArea = null;

		for( i = 0; i < this._itemAreas.length; i++ ) {
			area = this._itemAreas[ i ];

			if(
				x > area.x1 &&
				x < area.x2 &&
				y > area.y1 &&
				y < area.y2 &&
				smallestSurface > area.surface
			){
				smallestSurface = area.surface;
				mathingArea = area;
			}
		}

		return mathingArea;
	},

	_$calculateItemAreas: function() {
		var i, area, allContentItems = this._getAllContentItems();
		this._itemAreas = [];

		/**
		 * If the last item is dragged out, highlight the entire container size to
		 * allow to re-drop it. allContentItems[ 0 ] === this.root at this point
		 *
		 * Don't include root into the possible drop areas though otherwise since it
		 * will used for every gap in the layout, e.g. splitters
		 */
		if( allContentItems.length === 1 ) {
			this._itemAreas.push( this.root._$getArea() );
			return;
		}

		for( i = 0; i < allContentItems.length; i++ ) {
			
			if( !( allContentItems[ i ].isStack ) ) {
				continue;
			}

			area = allContentItems[ i ]._$getArea();

			if( area === null ) {
				continue;
			} else if( area instanceof Array ) {
				this._itemAreas = this._itemAreas.concat( area );
			} else {
				this._itemAreas.push( area );
			}
		}
	},


	_$normalizeContentItem: function( contentItem ) {
		if( contentItem instanceof lm.items.AbstractContentItem ) {
			return contentItem;
		}

		if( !contentItem ) {
			throw new Error( 'No content item defined' );
		}

		if( contentItem instanceof Object && contentItem.type ) {
			var newContentItem = this.createContentItem( contentItem, null );
			newContentItem.callDownwards( '_$init' );
			return newContentItem;
		} else {
			throw new Error( 'Invalid contentItem' );
		}
	},
	/***************************
	* PRIVATE
	***************************/

	_getAllContentItems: function() {
		var allContentItems = [];

		var addChildren = function( contentItem ) {
			allContentItems.push( contentItem );

			if( contentItem.contentItems instanceof Array ) {
				for( var i = 0; i < contentItem.contentItems.length; i++ ) {
					addChildren( contentItem.contentItems[ i ] );
				}
			}
		};

		addChildren( this.root );

		return allContentItems;
	},

	_bindEvents: function() {
		if( this._isFullPage ) {
			$(window).resize( this._resizeFunction );
		}
	},

	_onResize: function() {
		clearTimeout( this._resizeTimeoutId );
		this._resizeTimeoutId = setTimeout(lm.utils.fnBind( this.updateSize, this ), 100 );
	},

	/**
	 * Extends the default config with the user specific settings and applies
	 * derivations. Please note that there's a seperate method (AbstractContentItem._extendItemNode)
	 * that deals with the extension of item configs
	 *
	 * @param   {Object} config
	 * @static
	 * @returns {Object} config
	 */
	_createConfig: function( config ) {
		config = $.extend( true, {}, lm.config.defaultConfig, config );

		if( config.settings.hasHeaders === false ) {
			config.dimensions.headerHeight = 0;
		}

		return config;
	},

	_setContainer: function() {
		var container = $( this.container || document.body );

		if( container[ 0 ] === document.body ) {
			this._isFullPage = true;

			$( 'html, body' ).css({
				height: '100%',
				margin:0,
				padding: 0,
				overflow: 'hidden'
			});
		}

		this.container = container;
	},

	_create: function( config ) {
		var errorMsg;

		if( !( config.content instanceof Array ) ) {
			if( config.content === undefined ) {
				errorMsg = 'Missing setting \'content\' on top level of configuration';
			} else {
				errorMsg = 'Configuration parameter \'content\' must be an array';
			}
			
			throw new lm.errors.ConfigurationError( errorMsg, config );
		}

		if( config.content.length !== 1 ) {
			errorMsg = 'Top level content can\'t contain more then one element.';
			throw new lm.errors.ConfigurationError( errorMsg, config );
		}

		this.root = new lm.items.Root( this, { content: config.content }, this.container );
		this.root.callDownwards( '_$init' );
	}
});

/**
 * Expose the Layoutmanager as the single entrypoint using UMD
 */
(function () {
	/* global define */
	if ( typeof define === 'function' && define.amd) {
		define(function(){ return lm.LayoutManager; });
	} else if (typeof exports === 'object') {
		module.exports = lm.LayoutManager;
	} else {
		window.GoldenLayout = lm.LayoutManager;
	}
})();

lm.config.itemDefaultConfig = {
	isClosable: true
};
lm.config.defaultConfig = {
	settings:{
		hasHeaders: true,
		constrainDragToContainer: true
	},
	dimensions: {
		borderWidth: 5,
		minItemHeight: 10,
		minItemWidth: 10,
		headerHeight: 20,
		dragProxyWidth: 300,
		dragProxyHeight: 200
	},
	labels: {
		close: 'close',
		maximise: 'maximise',
		minimise: 'minimise',
		popout: 'open in new window'
	}
};
lm.container.ItemContainer = function( config, parent, layoutManager ) {
	lm.utils.EventEmitter.call( this );

	this.width = null;
	this.height = null;
	this.title = config.componentName;
	this._parent = parent;
	this._config = config;
	this._layoutManager = layoutManager;
	this.isHidden = false;
	this._element = $([
		'<div class="lm_item_container">',
			'<div class="lm_content"></div>',
		'</div>'
	].join( '' ));
	this._contentElement = this._element.find( '.lm_content' );
};

lm.utils.copy( lm.container.ItemContainer.prototype, {

	/**
	 * Get the inner DOM element the container's content
	 * is intended to live in
	 *
	 * @returns {DOM element}
	 */
	getElement: function() {
		return this._contentElement;
	},
	
	/**
	 * Hide the container. Notifies the containers content first
	 * and then hides the DOM node. If the container is already hidden
	 * this should have no effect
	 *
	 * @returns {void}
	 */
	hide: function() {
		this.emit( 'hide' );
		this.isHidden = true;
		this._element.hide();
	},
	
	/**
	 * Shows a previously hidden container. Notifies the
	 * containers content first and then shows the DOM element.
	 * If the container is already visible this has no effect.
	 *
	 * @returns {void}
	 */
	show: function() {
		this.emit( 'show' );
		this.isHidden = false;
		this._element.show();
	},
	
	/**
	 * Set's the containers size. Can be called by both
	 * the containers content as well as the contentItem
	 * containing it. Both arguments are optional, if
	 * one is omitted the parent elements size is used instead
	 *
	 * @param {[Int]} width  in px
	 * @param {[Int]} height in px
	 * 
	 * @returns {void}
	 */
	setSize: function( width, height ) {
		if( width !== this.width || height !== this.height ) {
			this.width = width;
			this.height = height;
			this._contentElement.width( this.width ).height( this.height );
			this.emit( 'resize' );
		}
	},
	
	/**
	 * Closes the container if it is closable. Can be called by
	 * both the component within at as well as the contentItem containing
	 * it. Emits a close event before the container itself is closed.
	 *
	 * @returns {void}
	 */
	close: function() {
		if( this._config.isClosable ) {
			this.emit( 'close' );
			this._parent.close();
		}
	}
});
	
lm.controls.BrowserPopout = function( contentItem ) {
	this._contentItem = contentItem;
	this._contentItem.parent.removeChild( this._contentItem, true );

	this._optionsString = this._serializeWindowOptions({
		width: contentItem.element.width(),
		height: contentItem.element.height(),
		menubar: 'no',
		toolbar: 'no',
		location: 'no',
		personalbar: 'no',
		resizable: 'yes',
		scrollbars: 'no',
		status: 'no'
	});

	this._createWindow();
};

lm.utils.copy( lm.controls.BrowserPopout.prototype, {

	_createWindow: function() {
		var url =document.location.origin + '/doesnotexits',
			title = this._contentItem.title;

		this._popoutWindow = window.open( url, title, this._optionsString );
		/**
		 * TODO - This is far from working...especially in IE
		 *
		 * @returns {[type]} [description]
		 */
		this._popoutWindow.onload =function(){
			this._popoutWindow.document.body.innerHTML = '';
			this._popoutWindow.document.head.innerHTML = '';
			this._popoutWindow.document.body.appendChild( this._contentItem.element[ 0 ] );
			$( this._popoutWindow ).on( 'resize', lm.utils.fnBind( this._resizeContentItem, this ) );
			$( this._popoutWindow ).on( 'beforeunload', lm.utils.fnBind( this._onWindowClose, this ) );
			this._transferStylesheets();
			this._contentItem._$setParent( this );
		}.bind( this );
	},

	_transferStylesheets: function() {
		var links = $( 'link' ), i, link, url;

		for( i = 0; i < links.length; i++ ) {
			link = links[ i ].cloneNode();
			url = document.location.origin + document.location.pathname + link.getAttribute( 'href' );
			link.setAttribute( 'href', url );
			this._popoutWindow.document.head.appendChild( link );
		}
	},

	_serializeWindowOptions: function( windowOptions ) {
		var windowOptionsString = [], key;

		for( key in windowOptions ) {
			windowOptionsString.push( key + '=' + windowOptions[ key ] );
		}

		return windowOptionsString.join( ',' );
	},

	_resizeContentItem: function() {
		this.width = this._popoutWindow.innerWidth;
		this.height = this._popoutWindow.innerHeight;
		this._contentItem.element.width( this.width );
		this._contentItem.element.height( this.height );
		this._contentItem.callDownwards( 'setSize' );
	},

	_onWindowClose: function() {
		this._contentItem.remove();
	}
});
lm.controls.DragProxy = function( x, y, dragListener, layoutManager, contentItem, originalParent ) {
	this._dragListener = dragListener;
	this._layoutManager = layoutManager;
	this._contentItem = contentItem;
	this._originalParent = originalParent;

	this._area = null;
	this._lastValidArea = null;

	this._dragListener.on( 'drag', this._onDrag, this );
	this._dragListener.on( 'dragStop', this._onDrop, this );

	this.element = $( lm.controls.DragProxy._template );
	this.element.css({ left: x, top: y });
	this.childElementContainer = this.element.find( '.lm_content' );
	this.childElementContainer.append( contentItem.element );

	this._updateTree();
	this._layoutManager._$calculateItemAreas();
	this._setDimensions();

	$( document.body ).append( this.element );

	var offset = this._layoutManager.container.offset();

	this._minX = offset.left;
	this._minY = offset.top;
	this._maxX = this._layoutManager.container.width() + this._minX;
	this._maxY = this._layoutManager.container.height() + this._minY;
	this._width = this.element.width();
	this._height = this.element.height();
};

lm.controls.DragProxy._template = '<div class="lm_dragProxy">' +
									'<div class="lm_header">' +
										'<ul class="lm_tabs">' +
											'<li class="lm_tab lm_active"><i class="lm_left"></i>' +
											'<span class="lm_title">todo - title</span>' +
											'<i class="lm_right"></i></li>' +
										'</ul>' +
									'</div>' +
									'<div class="lm_content"></div>' +
								'</div>';

lm.utils.copy( lm.controls.DragProxy.prototype, {

	_onDrag: function( offsetX, offsetY, event ) {
		var x = event.clientX,
			y = event.clientY,
			isWithinContainer = x > this._minX && x < this._maxX && y > this._minY && y < this._maxY;
	
		if( !isWithinContainer && this._layoutManager.config.settings.constrainDragToContainer === true ) {
			return;
		}
	
		this.element.css({ left: x, top: y });
		this._area = this._layoutManager._$getArea( x, y );
	
		if( this._area !== null ) {
			this._lastValidArea = this._area;
			this._area.contentItem._$highlightDropZone( x, y, this._area );
		}
	},
	
	_onDrop: function() {
		this._layoutManager.dropTargetIndicator.hide();

		/*
		 * Valid drop area found
		 */
		if( this._area !== null ) {
			this._area.contentItem._$onDrop( this._contentItem );

		/**
		 * No valid drop area available at present, but one has been found before.
		 * Use it
		 */
		} else if( this._lastValidArea !== null ) {
			this._lastValidArea.contentItem._$onDrop( this._contentItem );

		/**
		 * No valid drop area found during the duration of the drag. Return
		 * content item to its original position
		 */
		} else {
			this._originalParent.addChild( this._contentItem );
		}
		
		this.element.remove();
	},
	
	_updateTree: function() {
		this._contentItem.parent.removeChild( this._contentItem, true );
		this._contentItem._$setParent( this );
	},
	
	_setDimensions: function() {
		var dimensions = this._layoutManager.config.dimensions,
			width = dimensions.dragProxyWidth,
			height = dimensions.dragProxyHeight - dimensions.headerHeight;
	
		this.childElementContainer.width( width );
		this.childElementContainer.height( height );
		this._contentItem.element.width( width );
		this._contentItem.element.height( height );
		this._contentItem.callDownwards( '_$show' );
		this._contentItem.callDownwards( 'setSize' );
	}
});
lm.controls.DropTargetIndicator = function() {
	this.element = $( lm.controls.DropTargetIndicator._template );
	$(document.body).append( this.element );
};

lm.controls.DropTargetIndicator._template = '<div class="lm_dropTargetIndicator"></div>';

lm.utils.copy( lm.controls.DropTargetIndicator.prototype, {
	highlight: function( x1, y1, x2, y2 ) {
		this.highlightArea({ x1:x1, y1:y1, x2:x2, y2:y2 });
	},

	highlightArea: function( area ) {
		this.element.css({
			left: area.x1,
			top: area.y1,
			width: area.x2 - area.x1,
			height: area.y2 - area.y1
		}).show();
	},

	hide: function() {
		this.element.hide();
	}
});
lm.controls.Header = function( layoutManager, parent ) {
	lm.utils.EventEmitter.call( this );

	this.layoutManager = layoutManager;
	this.element = $( lm.controls.Header._template );
	this.element.height( layoutManager.config.dimensions.headerHeight );
	this.tabsContainer = this.element.find( '.lm_tabs' );
	this.controlsContainer = this.element.find( '.lm_controls' );
	this.parent = parent;
	this.tabs = [];
	this.activeComponent = null;
	this._createControls();
};

lm.controls.Header._template = [
	'<div class="lm_header">',
		'<ul class="lm_tabs"></ul>',
		'<ul class="lm_controls"></ul>',
	'</div>'
].join( '' );

lm.utils.copy( lm.controls.Header.prototype, {

	createTab: function( contentItem, index ) {
		var tab = new lm.controls.Tab( this, contentItem );
		
		if( this.tabs.length === 0 ) {
			this.tabs.push( tab );
			this.tabsContainer.append( tab.element );
			return;
		}
	
		if( index === undefined ) {
			index = this.tabs.length;
		}
	
		if( index > 0 ) {
			this.tabs[ index - 1 ].element.after( tab.element );
		} else {
			this.tabs[ 0 ].element.before( tab.element );
		}
	
		this.tabs.splice( index, 0, tab );
	},
	
	_createControls: function() {
		var closeStack, popout, label, maximise;

		/**
		 * Popout control to launch component in new window.
		 */
		popout = lm.utils.fnBind( this.parent.popout, this.parent );
		label = this.layoutManager.config.labels.popout;
		new lm.controls.HeaderButton( this, label, 'lm_popout', popout );

		/**
		 * Maximise control - set the component to the full size of the layout
		 */
		maximise = lm.utils.fnBind( this.parent.toggleMaximise, this.parent );
		label = this.layoutManager.config.labels.maximise;
		new lm.controls.HeaderButton( this, label, 'lm_maximise', maximise );

		/**
		 * Close button
		 */
		if( this.parent.config.isClosable ) {
			closeStack = lm.utils.fnBind( this.parent.remove, this.parent );
			label = this.layoutManager.config.labels.close;
			new lm.controls.HeaderButton( this, label, 'lm_close', closeStack );
		}
	},

	_$destroy: function() {
		this.emit( 'destroy' );
	
		for( var i = 0; i < this.tabs.length; i++ ) {
			this.tabs[ i ]._$destroy();
		}
	
		this.element.remove();
	},
	
	setActiveContentItem: function( contentItem ) {
		for( var i = 0; i < this.tabs.length; i++ ) {
			this.tabs[ i ].setActive( this.tabs[ i ].contentItem === contentItem );
		}
	},
	
	removeContentItem: function( contentItem ) {
		for( var i = 0; i < this.tabs.length; i++ ) {
			if( this.tabs[ i ].contentItem === contentItem ) {
				this.tabs[ i ]._$destroy();
				this.tabs.splice( i, 1 );
				return;
			}
		}
	
		throw new Error( 'contentItem is not controlled by this header' );
	}
});


lm.controls.HeaderButton = function( header, label, cssClass, action ) {
	this._header = header;
	this._header.on( 'destroy', this._$destroy, this );
	this._element = $( '<li class="' + cssClass + '" title="' + label + '"></li>' );
	this._action = action;
	this._element.click( this._action );
	this._header.controlsContainer.append( this._element );
};

lm.utils.copy( lm.controls.HeaderButton.prototype, {
	
	_$destroy: function() {
		this._element.off( this._action );
		this._element.remove();
	}
});
lm.controls.Splitter = function( isVertical, size ) {
	this._isVertical = isVertical;
	this._size = size;

	this.element = this._createElement();
	this._dragListener = new lm.utils.DragListener( this.element );
};

lm.utils.copy( lm.controls.Splitter.prototype, {
	on: function( event, callback, context ) {
		this._dragListener.on( event, callback, context );
	},

	_$destroy: function() {
		this.element.remove();
	},

	_createElement: function() {
		var element = $( '<div class="lm_splitter"><div class="lm_drag_handle"></div></div>' );
		element.addClass( 'lm_' + ( this._isVertical ? 'vertical' : 'horizontal' ) );
		element[ this._isVertical ? 'height' : 'width' ]( this._size );

		return element;
	}
});

lm.controls.Tab = function( header, contentItem ) {
	this.header = header;
	this.contentItem = contentItem;
	this.element = $( lm.controls.Tab._template );
	this.titleElement = this.element.find( '.lm_title' );
	this.closeElement = this.element.find( '.lm_close_tab' );
	this.closeElement[ contentItem.config.isClosable ? 'show' : 'hide' ]();

	this.isActive = false;
	
	if( contentItem.isComponent ) {
		this.setTitle( contentItem.container.title );
	} else {
		this.setTitle( 'title (todo)' );
	}

	this._layoutManager = this.contentItem.layoutManager;
	this._dragListener = new lm.utils.DragListener( this.element );
	this._dragListener.on( 'dragStart', this._onDragStart, this );

	this._onTabClickFn = lm.utils.fnBind( this._onTabClick, this );
	this._onCloseClickFn = lm.utils.fnBind( this._onCloseClick, this );

	this.element.click( this._onTabClickFn );
	this.closeElement.click( this._onCloseClickFn );
};

lm.controls.Tab._template = '<li class="lm_tab"><i class="lm_left"></i>' +
							'<span class="lm_title"></span><div class="lm_close_tab"></div>' +
							'<i class="lm_right"></i></li>';

lm.utils.copy( lm.controls.Tab.prototype,{

	setTitle: function( title ) {
		this.titleElement.html( title );
	},

	setActive: function( isActive ) {
		if( isActive === this.isActive ) {
			return;
		}
		this.isActive = isActive;

		if( isActive ) {
			this.element.addClass( 'lm_active' );
		} else {
			this.element.removeClass( 'lm_active');
		}
	},

	_$destroy: function() {
		this.element.off( 'click', this._onTabClickFn );
		this.closeElement.off( 'click', this._onCloseClickFn );
		this.element.remove();
	},

	_onDragStart: function( x, y ) {
		new lm.controls.DragProxy(
			x,
			y,
			this._dragListener,
			this._layoutManager,
			this.contentItem,
			this.header.parent
		);
	},

	_onTabClick: function() {
		this.header.parent.setActiveContentItem( this.contentItem );
	},

	_onCloseClick: function( event ) {
		event.stopPropagation();
		this.header.parent.removeChild( this.contentItem );
	}

});

lm.errors.ConfigurationError = function( message, node ) {
	Error.call( this );

	this.name = 'Configuration Error';
	this.message = message;
	this.node = node;
};

lm.errors.ConfigurationError.prototype = new Error();

lm.utils.BubblingEvent = function( name, origin ) {
	this.name = name;
	this.origin = origin;
	this.isPropagationStopped = false;
};

lm.utils.BubblingEvent.prototype.stopPropagation = function() {
	this.isPropagationStopped = true;
};

/**
 * This is the baseclass that all content items inherit from.
 * Most methods provide a subset of what the sub-classes do.
 *
 * It also provides a number of functions for tree traversal
 *
 * @param {lm.LayoutManager} layoutManager
 * @param {item node configuration} config
 * @param {lm.item} parent
 *
 * @constructor
 */
lm.items.AbstractContentItem = function( layoutManager, config, parent ) {
	lm.utils.EventEmitter.call( this );

	this.config = this._extendItemNode( config );
	this.type = config.type;
	this.contentItems = [];
	this.parent = parent;
	this.id = config.id;

	this.isInitialised = false;
	this.isMaximised = false;
	this.isRoot = false;
	this.isRow = false;
	this.isColumn = false;
	this.isStack = false;
	this.isComponent = false;

	this.layoutManager = layoutManager;
	this._pendingEventPropagations = {};

	this.on( lm.utils.EventEmitter.ALL_EVENT, this._propagateEvent, this );
	
	if( config.content ) {
		this._createContentItems( config );
	}
};

lm.utils.copy( lm.items.AbstractContentItem.prototype, {
	
	/**
	 * Set the size of the component and its children, called recoursively
	 *
	 * @abstract
	 * @returns void
	 */
	setSize: function() {
		throw new Error( 'Abstract Method' );
	},

	/**
	 * Calls a method recoursively downwards on the tree
	 *
	 * @param   {String} functionName      the name of the function to be called
	 * @param   {[Array]}functionArguments optional arguments that are passed to every function
	 * @param   {[bool]} bottomUp          Call methods from bottom to top, defaults to false
	 * @param   {[bool]} skipSelf          Don't invoke the method on the class that calls it, defaults to false
	 *
	 * @returns {void}
	 */
	callDownwards: function( functionName, functionArguments, bottomUp, skipSelf ) {
		var i;

		if( bottomUp !== true && skipSelf !== true ) {
			this[ functionName ].apply( this, functionArguments || [] );
		}
		for( i = 0; i < this.contentItems.length; i++ ) {
			this.contentItems[ i ].callDownwards( functionName, functionArguments, bottomUp );
		}
		if( bottomUp === true && skipSelf !== true ) {
			this[ functionName ].apply( this, functionArguments || [] );
		}
	},

	/**
	 * Removes a child node (and its children) from the tree
	 *
	 * @param   {lm.items.ContentItem} contentItem
	 *
	 * @returns {void}
	 */
	removeChild: function( contentItem, keepChild ) {
		
		/*
		 * Get the position of the item that's to be removed within all content items this node contains
		 */
		var index = lm.utils.indexOf( contentItem, this.contentItems );

		/*
		 * Make sure the content item to be removed is actually a child of this item
		 */
		if( index === -1 ) {
			throw new Error( 'Can\'t remove child item. Unknown content item' );
		}

		/**
		 * Call ._$destroy on the content item. This also calls ._$destroy on all its children
		 */
		if( keepChild !== true ) {
			this.contentItems[ index ]._$destroy();
		}
		
		/**
		 * Remove the content item from this nodes array of children
		 */
		this.contentItems.splice( index, 1 );

		/**
		 * Remove the item from the configuration
		 */
		this.config.content.splice( index, 1 );

		/**
		 * If this node still contains other content items, adjust their size
		 */
		if( this.contentItems.length > 0 ) {
			this.callDownwards( 'setSize' );

		/**
		 * If this was the last content item, remove this node as well
		 */
		} else if( !(this instanceof lm.items.Root) ) {
			this.parent.removeChild( this );
		}
	},

	/**
	 * Sets up the tree structure for the newly added child
	 * The responsibility for the actual DOM manipulations lies
	 * with the concrete item
	 *
	 * @param {lm.items.AbstractContentItem} contentItem
	 * @param {[Int]} index If omitted item will be appended
	 */
	addChild: function( contentItem, index ) {
		if ( index === undefined ) {
			index = this.contentItems.length;
		}

		this.contentItems.splice( index, 0, contentItem );

		if( this.config.content === undefined ) {
			this.config.content = [];
		}

		this.config.content.splice( index, 0, contentItem.config );
		contentItem.parent = this;
	},

	/**
	 * Replaces oldChild with newChild. This used to use jQuery.replaceWith... which for
	 * some reason removes all event listeners, so isn't really an option.
	 *
	 * @param   {lm.item.AbstractContentItem} oldChild
	 * @param   {lm.item.AbstractContentItem} newChild
	 *
	 * @returns {void}
	 */
	replaceChild: function( oldChild, newChild ) {

		newChild = this.layoutManager._$normalizeContentItem( newChild );

		var index = lm.utils.indexOf( oldChild, this.contentItems ),
			parentNode = oldChild.element[ 0 ].parentNode;

		if( index === -1 ) {
			throw new Error( 'Can\'t replace child. oldChild is not child of this' );
		}

		parentNode.replaceChild( newChild.element[ 0 ], oldChild.element[ 0 ] );

		//TODO Do we need to (optionally) ._$destroy the old child?
		this.contentItems[ index ] = newChild;
		newChild.parent = this;
		//TODO This doesn't update the config... refactor to leave item nodes untouched after creation
	},

	/**
	 * Convenience method. 
	 * Shorthand for this.parent.removeChild( this )
	 *
	 * @returns {void}
	 */
	remove: function() {
		this.parent.removeChild( this );
	},

	popout: function() {
		new lm.controls.BrowserPopout( this );
		this._$emitBubblingEvent( 'stateChanged' );
	},

	toggleMaximise: function() {
		if( this.isMaximised === true ) {
			this.layoutManager._$minimiseItem( this );
		} else {
			this.layoutManager._$maximiseItem( this );
		}

		this.isMaximised = !this.isMaximised;
		this._$emitBubblingEvent( 'stateChanged' );
	},

	/****************************************
	* SELECTOR
	****************************************/
	getItemsByFilter: function( filter ) {
		var result = [],
			next = function( contentItem ) {
				for( var i = 0; i < contentItem.contentItems.length; i++ ) {
					
					if( filter( contentItem.contentItems[ i ] ) === true ) {
						result.push( contentItem.contentItems[ i ] );
					}

					next( contentItem.contentItems[ i ] );
				}
			};

		next( this );
		return result;
	},

	getItemsById: function( id ) {
		return this.getItemsByFilter( function( item ){
			if( item.id instanceof Array ) {
				return lm.utils.indexOf( id, item.id ) !== -1;
			} else {
				return item.id === id;
			}
		});
	},

	getItemsByType: function( type ) {
		return this._$getItemsByProperty( 'type', type );
	},

	getComponentsByName: function( componentName ) {
		var components = this._$getItemsByProperty( 'componentName', componentName ),
			instances = [],
			i;

		for( i = 0; i < components.length; i++ ) {
			instances.push( components[ i ].instance );
		}

		return instances;
	},

	/****************************************
	* PACKAGE PRIVATE
	****************************************/
	_$getItemsByProperty: function( key, value ) {
		return this.getItemsByFilter( function( item ){
			return item[ key ] === value;
		});
	},

	_$setParent: function( parent ) {
		this.parent = parent;
	},

	_$highlightDropZone: function( x, y, area ) {
		this.layoutManager.dropTargetIndicator.highlightArea( area );
	},

	_$onDrop: function( contentItem ) {
		this.addChild( contentItem );
	},

	_$hide: function() {
		this.callDownwards( '_$hide', [], true, true );
		this.element.hide();
	},

	_$show: function() {
		this.callDownwards( '_$show', [], true, true );
		this.element.show();
	},
	
	/**
	 * Destroys this item ands its children
	 *
	 * @returns {void}
	 */
	_$destroy: function() {
		this.callDownwards( '_$destroy', [], true, true );
		this.element.remove();
	},

	/**
	 * Returns the area the component currently occupies in the format
	 *
	 * {
	 *		x1: int
	 *		xy: int
	 *		y1: int
	 *		y2: int
	 *		contentItem: contentItem
	 * }
	 */
	_$getArea: function( element ) {
		element = element || this.element;

		var offset = element.offset(),
			width = element.width(),
			height = element.height();

		return {
			x1: offset.left,
			y1: offset.top,
			x2: offset.left + width,
			y2: offset.top + height,
			surface: width * height,
			contentItem: this
		};
	},

	/**
	 * The tree of content items is created in two steps: First all content items are instantiated,
	 * then init is called recoursively from top to bottem. This is the basic init function,
	 * it can be used, extended or overwritten by the content items
	 * 
	 * Its behaviour depends on the content item
	 *
	 * @package private
	 * 
	 * @returns {void}
	 */
	_$init: function() {
		var i;
		this.setSize();
		for( i = 0; i < this.contentItems.length; i++ ) {
			this.childElementContainer.append( this.contentItems[ i ].element );
		}

		this.isInitialised = true;
	},

	_$emitBubblingEvent: function( name ) {
		var event = new lm.utils.BubblingEvent( name, this );
		this.emit( name, event );
	},

	/**
	 * Private method, creates all content items for this node at initialisation time
	 * PLEASE NOTE, please see addChiold for adding contentItems add runtime
	 * @private
	 * @param   {configuration item node} config
	 *
	 * @returns {void}
	 */
	_createContentItems: function( config ) {
		var oContentItem, i;

		if( !( config.content instanceof Array ) ) {
			throw new lm.errors.ConfigurationError( 'content must be an Array', config );
		}

		for( i = 0; i < config.content.length; i++ ) {
			oContentItem = this.layoutManager.createContentItem( config.content[ i ], this );
			this.contentItems.push( oContentItem );
		}
	},

	/**
	 * Extends an item configuration node with default settings
	 * @private
	 * @param   {configuration item node} config
	 *
	 * @returns {configuration item node} extended config
	 */
	_extendItemNode: function( config ) {
		
		for( var key in lm.config.itemDefaultConfig ) {
			if( config[ key ] === undefined ) {
				config[ key ] = lm.config.itemDefaultConfig[ key ];
			}
		}
		
		return config;
	},

	/**
	 * Called for every event on the item tree. Decides whether the event is a bubbling
	 * event and propagates it to its parent
	 *
	 * @param	{String} name the name of the event
	 * @param   {lm.utils.BubblingEvent} event 
	 *
	 * @returns {void}
	 */
	_propagateEvent: function( name, event ) {
		if( event instanceof lm.utils.BubblingEvent &&
			event.isPropagationStopped === false &&
			this.isInitialised === true ) {
			if( this.isRoot === false ) {
				if( !this.parent ) debugger;
				this.parent.emit.apply( this.parent, Array.prototype.slice.call( arguments, 0 ) );
			} else {
				this._scheduleEventPropagationToLayoutManager( name );
			}
		}
	},

	/**
	 * All raw events bubble up to the root element. The events that
	 * are propagated to - and emitted by - the layoutManager however are
	 * only string-based, batched and sanitized to make them more usable
	 *
	 * @param {String} name the name of the event
	 *
	 * @private
	 * @returns {void}
	 */
	_scheduleEventPropagationToLayoutManager: function( name ) {
		if( this._pendingEventPropagations[ name ] !== true ) {
			this._pendingEventPropagations[ name ] = true;
			lm.utils.animFrame( lm.utils.fnBind( this._propagateEventToLayoutManager, this, [ name ] ) );
		}
	},

	/**
	 * Callback for events scheduled by _scheduleEventPropagationToLayoutManager
	 *
	 * @param {String} name the name of the event
	 *
	 * @private
	 * @returns {void}
	 */
	_propagateEventToLayoutManager: function( name ) {
		this._pendingEventPropagations[ name ] = false;
		this.layoutManager.emit( name );
	}
	
});
/**
 * @param {[type]} layoutManager [description]
 * @param {[type]} config      [description]
 * @param {[type]} parent        [description]
 */
lm.items.Component = function( layoutManager, config, parent ) {
	lm.items.AbstractContentItem.call( this, layoutManager, config, parent );
	
	var ComponentConstructor = layoutManager.getComponent( this.config.componentName );
	var componentConfig = $.extend( true, {}, this.config.componentState || {} );
	componentConfig.componentName = this.config.componentName;
	this.componentName = this.config.componentName;
	this.isComponent = true;
	this.container = new lm.container.ItemContainer( this.config, this, layoutManager );
	this.instance = new ComponentConstructor( this.container, componentConfig  );
	this.element = this.container._element;
};

lm.utils.extend( lm.items.Component, lm.items.AbstractContentItem );

lm.utils.copy( lm.items.Component.prototype, {
	_$destroy: function() {
		this.container.emit( 'destroy' );
		lm.items.AbstractContentItem.prototype._$destroy.call( this );
	},

	setSize: function() {
		this.container.setSize( this.element.width(), this.element.height() );
	},

	_$hide: function() {
		this.container.hide();
		lm.items.AbstractContentItem.prototype._$hide.call( this );
	},

	_$show: function() {
		this.container.show();
		lm.items.AbstractContentItem.prototype._$show.call( this );
	},

	/**
	 * Dragging onto a component directly is not an option
	 *
	 * @returns null
	 */
	_$getArea: function() {
		return null;
	},

	close: function() {
		this.parent.removeChild( this );
	}
});
lm.items.Root = function( layoutManager, config, containerElement ) {
	lm.items.AbstractContentItem.call( this, layoutManager, config, null );
	this.isRoot = true;
	this.element = $( '<div class="lm_goldenlayout lm_item lm_root"></div>' );
	this.childElementContainer = this.element;
	this._containerElement = containerElement;
	this._containerElement.append( this.element );
};

lm.utils.extend( lm.items.Root, lm.items.AbstractContentItem );

lm.utils.copy( lm.items.Root.prototype, {
	addChild: function( contentItem ) {
		if( this.contentItems.length > 0 ) {
			throw new Error( 'Root node can only have a single child' );
		}

		this.childElementContainer.append( contentItem.element );
		lm.items.AbstractContentItem.prototype.addChild.call( this, contentItem );
		
		this.callDownwards( 'setSize' );
		this._$emitBubblingEvent( 'stateChanged' );
	},

	setSize: function() {
		var width = this._containerElement.width(),
			height = this._containerElement.height();

		this.element.width( width );
		this.element.height( height );

		this.contentItems[ 0 ].element.width( width );
		this.contentItems[ 0 ].element.height( height );
	},

	_$onDrop: function( contentItem ) {
		var stack;

		if( contentItem.isComponent === true ) {
			stack = this.layoutManager.createContentItem( {type: 'stack' }, this );
			stack.addChild( contentItem );
			this.addChild( stack );
		} else {
			this.addChild( contentItem );
		}
	}
});



lm.items.RowOrColumn = function( isColumn, layoutManager, config, parent ) {
	lm.items.AbstractContentItem.call( this, layoutManager, config, parent );

	this.isRow = !isColumn;
	this.isColumn = isColumn;
	
	this.element = $( '<div class="lm_item lm_' + ( isColumn ? 'column' : 'row' ) + '"></div>' );
	this.childElementContainer = this.element;
	this._splitterSize = layoutManager.config.dimensions.borderWidth;
	this._isColumn = isColumn;
	this._dimension = isColumn ? 'height' : 'width';
	this._splitter = [];
	this._splitterPosition = null;
	this._splitterMinPosition = null;
	this._splitterMaxPosition = null;
};

lm.utils.extend( lm.items.RowOrColumn, lm.items.AbstractContentItem );

lm.utils.copy( lm.items.RowOrColumn.prototype, {
	
	/**
	 * Add a new contentItem to the Row or Column
	 *
	 * @param {lm.item.AbstractContentItem} contentItem
	 * @param {[int]} index The position of the new item within the Row or Column.
	 *                      If no index is provided the item will be added to the end
	 * @param {[bool]} _$suspendResize If true the items won't be resized. This will leave the item in
	 *                                 an inconsistent state and is only intended to be used if multiple
	 *                                 children need to be added in one go and resize is called afterwards
	 *
	 * @returns {void}
	 */
	addChild: function( contentItem, index, _$suspendResize ) {
	
		var newItemSize, itemSize, i, splitterElement;
	
		contentItem = this.layoutManager._$normalizeContentItem( contentItem );
		
		if( index === undefined ) {
			index = this.contentItems.length;
		}
	
		if( this.contentItems.length > 0 ) {
			splitterElement = this._createSplitter( index ).element;
	
			if( index > 0 ) {
				this.contentItems[ index - 1 ].element.after( splitterElement );
				splitterElement.after( contentItem.element );
			} else {
				this.contentItems[ 0 ].element.before( splitterElement );
				splitterElement.before( contentItem.element );
			}
		} else {
			this.childElementContainer.append( contentItem.element );
		}
		
		lm.items.AbstractContentItem.prototype.addChild.call( this, contentItem, index );
	
		newItemSize = ( 1 / this.contentItems.length ) * 100;
		
		if( _$suspendResize === true ) {
			return;
		}
		
		for( i = 0; i < this.contentItems.length; i++ ) {
			if( this.contentItems[ i ] === contentItem ) {
				contentItem.config[ this._dimension ] = newItemSize;
			} else {
				itemSize = this.contentItems[ i ].config[ this._dimension ] *= ( 100 - newItemSize ) / 100;
				this.contentItems[ i ].config[ this._dimension ] = itemSize;
			}
		}
		
		this.callDownwards( 'setSize' );
		this._$emitBubblingEvent( 'stateChanged' );
	},

	/**
	 * Removes a child of this element
	 *
	 * @param   {lm.items.AbstractContentItem} contentItem
	 * @param   {boolean} keepChild   If true the child will be removed, but not destroyed
	 *
	 * @returns {void}
	 */
	removeChild: function( contentItem, keepChild ) {
		var removedItemSize = contentItem.config[ this._dimension ], i,
			index = lm.utils.indexOf( contentItem, this.contentItems ),
			splitterIndex = Math.max( index - 1, 0 );
		
		/**
		 * Remove the splitter before the item or after if the item happens
		 * to be the first in the row/column
		 */
		if( this._splitter[ splitterIndex ] ) {
			this._splitter[ splitterIndex ]._$destroy();
			this._splitter.splice( splitterIndex, 1 );
		}
		
		/**
		 * Allocate the space that the removed item occupied to the remaining items
		 */
		for( i = 0; i < this.contentItems.length; i++ ) {
			if( this.contentItems[ i ] !== contentItem ) {
				this.contentItems[ i ].config[ this._dimension ] += removedItemSize / ( this.contentItems.length - 1 );
			}
		}
	
		lm.items.AbstractContentItem.prototype.removeChild.call( this, contentItem, keepChild );
		this.callDownwards( 'setSize' );
		this._$emitBubblingEvent( 'stateChanged' );
	},
	
	/**
	 * Replaces a child of this Row or Column with another contentItem
	 *
	 * @param   {lm.items.AbstractContentItem} oldChild
	 * @param   {lm.items.AbstractContentItem} newChild
	 *
	 * @returns {void}
	 */
	replaceChild: function( oldChild, newChild ) {
		var size = oldChild.config[ this._dimension ];
		lm.items.AbstractContentItem.prototype.replaceChild.call( this, oldChild, newChild );
		newChild.config[ this._dimension ] = size;
		this.callDownwards( 'setSize' );
		this._$emitBubblingEvent( 'stateChanged' );
	},
	
	/**
	 * Called whenever the dimensions of this item or one of its parents change
	 *
	 * @returns {void}
	 */
	setSize: function() {
		if( this.contentItems.length > 0 ) {
			this._calculateRelativeSizes();
			this._setAbsoluteSizes();
		}
		this._$emitBubblingEvent( 'stateChanged' );
	},
	
	/**
	 * Invoked recoursively by the layout manager. AbstractContentItem.init appends
	 * the contentItem's DOM elements to the container, RowOrColumn init adds splitters
	 * in between them
	 *
	 * @package private
	 * @override AbstractContentItem._$init
	 * @returns {void}
	 */
	_$init: function() {
		if( this.isInitialised === true ) return;

		var i;
	
		lm.items.AbstractContentItem.prototype._$init.call( this );
		
		for( i = 0; i < this.contentItems.length - 1; i++ ) {
			this.contentItems[ i ].element.after( this._createSplitter( i ).element );
		}
	},
	
	/**
	 * Turns the relative sizes calculated by _calculateRelativeSizes into
	 * absolute pixel values and applies them to the children's DOM elements
	 *
	 * Assigns additional pixels to counteract Math.floor
	 * 
	 * @private
	 * @returns {void}
	 */
	_setAbsoluteSizes: function() {
		var i,
			totalSplitterSize = ( this.contentItems.length - 1 ) * this._splitterSize,
			totalWidth = this.element.width(),
			totalHeight = this.element.height(),
			totalAssigned = 0,
			additionalPixel,
			itemSize,
			itemSizes = [];
	
		if( this._isColumn ) {
			totalHeight -= totalSplitterSize;
		} else {
			totalWidth -= totalSplitterSize;
		}
	
		for( i = 0; i < this.contentItems.length; i++ ) {
			if( this._isColumn ) {
				itemSize = Math.floor( totalHeight * ( this.contentItems[ i ].config.height / 100 ) );
			} else {
				itemSize = Math.floor( totalWidth * ( this.contentItems[ i ].config.width / 100 ) );
			}

			totalAssigned += itemSize;
			itemSizes.push( itemSize );
		}

		additionalPixel = ( this._isColumn ? totalHeight : totalWidth ) - totalAssigned;

		for( i = 0; i < this.contentItems.length; i++ ) {
			if( additionalPixel - i > 0 ) {
				itemSizes[ i ]++;
			}

			if( this._isColumn ) {
				this.contentItems[ i ].element.width( totalWidth );
				this.contentItems[ i ].element.height( itemSizes[ i ] );
			} else {
				this.contentItems[ i ].element.width( itemSizes[ i ] );
				this.contentItems[ i ].element.height( totalHeight );
			}
		}
	},
	
	/**
	 * Calculates the relative sizes of all children of this Item. The logic
	 * is as follows:
	 * 
	 * - Add up the total size of all items that have a configured size
	 *
	 * - If the total == 100 (check for floating point errors)
	 *		Excellent, job done
	 * 
	 * - If the total is > 100, 
	 *		set the size of items without set dimensions to 1/3 and add this to the total
	 *		set the size off all items so that the total is hundred relative to their original size 
	 *
	 * - If the total is < 100
	 *		If there are items without set dimensions, distribute the remainder to 100 evenly between them
	 *		If there are no items without set dimensions, increase all items sizes relative to
	 *		their original size so that they add up to 100
	 *
	 * @private
	 * @returns {void}
	 */
	_calculateRelativeSizes: function() {
		
		var i,
			total = 0,
			itemsWithoutSetDimension = [],
			dimension = this._isColumn ? 'height' : 'width';
	
		for( i = 0; i < this.contentItems.length; i++ ) {
			if( this.contentItems[ i ].config[ dimension ] !== undefined ) {
				total += this.contentItems[ i ].config[ dimension ];
			} else {
				itemsWithoutSetDimension.push( this.contentItems[ i ] );
			}
		}
	
		/**
		 * Everything adds up to hundred, all good :-)
		 */
		if( Math.round( total ) === 100 ) {
			return;
		}
	
		/**
		 * Allocate the remaining size to the items without a set dimension
		 */
		if( Math.round( total ) < 100 && itemsWithoutSetDimension.length > 0 ) {
			for( i = 0; i < itemsWithoutSetDimension.length; i++ ) {
				itemsWithoutSetDimension[ i ].config[ dimension ] = ( 100 - total ) / itemsWithoutSetDimension.length;
			}
			return;
		}
	
		/**
		 * If the total is > 100, but there are also items without a set dimension left, assing 50
		 * as their dimension and add it to the total
		 *
		 * This will be reset in the next step
		 */
		if( Math.round( total ) > 100 ) {
			for( i = 0; i < itemsWithoutSetDimension.length; i++ ) {
				itemsWithoutSetDimension[ i ].config[ dimension ] = 50;
				total += 50;
			}
		}
	
		/**
		 * Set every items size relative to 100 relative to its size to total
		 */
		for( i = 0; i < this.contentItems.length; i++ ) {
			this.contentItems[ i ].config[ dimension ] = ( this.contentItems[ i ].config[ dimension ] / total ) * 100;
		}
	},
	
	/**
	 * Instantiates a new lm.controls.Splitter, binds events to it and adds
	 * it to the array of splitters at the position specified as the index argument
	 *
	 * What it doesn't do though is append the splitter to the DOM
	 *
	 * @param   {Int} index The position of the splitter
	 *
	 * @returns {lm.controls.Splitter}
	 */
	_createSplitter: function( index ) {
		var splitter;
		splitter = new lm.controls.Splitter( this._isColumn, this._splitterSize );
		splitter.on( 'drag', lm.utils.fnBind( this._onSplitterDrag, this, [ splitter ] ), this );
		splitter.on( 'dragStop', lm.utils.fnBind( this._onSplitterDragStop, this, [ splitter ] ), this );
		splitter.on( 'dragStart', lm.utils.fnBind( this._onSplitterDragStart, this, [ splitter ] ), this );
		this._splitter.splice( index, 0, splitter );
		return splitter;
	},
	
	/**
	 * Locates the instance of lm.controls.Splitter in the array of
	 * registered splitters and returns a map containing the contentItem
	 * before and after the splitters, both of which are affected if the
	 * splitter is moved
	 *
	 * @param   {lm.controls.Splitter} splitter
	 *
	 * @returns {Object} A map of contentItems that the splitter affects
	 */
	_getItemsForSplitter: function( splitter ) {
		var index = lm.utils.indexOf( splitter, this._splitter );
		
		return {
			before: this.contentItems[ index ],
			after: this.contentItems[ index + 1 ]
		};
	},
	
	/**
	 * Invoked when a splitter's dragListener fires dragStart. Calculates the splitters
	 * movement area once (so that it doesn't need calculating on every mousemove event)
	 *
	 * @param   {lm.controls.Splitter} splitter
	 *
	 * @returns {void}
	 */
	_onSplitterDragStart: function( splitter ) {
		var items = this._getItemsForSplitter( splitter ),
			minSize = this.layoutManager.config.dimensions[ this._isColumn ? 'minItemHeight' : 'minItemWidth' ];
	
		this._splitterPosition = 0;
		this._splitterMinPosition = -1 * ( items.before.element[ this._dimension ]() - minSize );
		this._splitterMaxPosition = items.after.element[ this._dimension ]() - minSize;
	},
	
	/**
	 * Invoked when a splitter's DragListener fires drag. Updates the splitters DOM position,
	 * but not the sizes of the elements the splitter controls in order to minimize resize events
	 *
	 * @param   {lm.controls.Splitter} splitter
	 * @param   {Int} offsetX  Relative pixel values to the splitters original position. Can be negative
	 * @param   {Int} offsetY  Relative pixel values to the splitters original position. Can be negative
	 *
	 * @returns {void}
	 */
	_onSplitterDrag: function( splitter, offsetX, offsetY ) {
		var offset = this._isColumn ? offsetY : offsetX;
	
		if( offset > this._splitterMinPosition && offset < this._splitterMaxPosition ) {
			this._splitterPosition = offset;
			splitter.element.css( this._isColumn ? 'top' : 'left', offset );
		}
	},
	
	/**
	 * Invoked when a splitter's DragListener fires dragStop. Resets the splitters DOM position,
	 * and applies the new sizes to the elements before and after the splitter and their children
	 * on the next animation frame
	 *
	 * @param   {lm.controls.Splitter} splitter
	 *
	 * @returns {void}
	 */
	_onSplitterDragStop: function( splitter ) {
	
		var items = this._getItemsForSplitter( splitter ),
			sizeBefore = items.before.element[ this._dimension ](),
			sizeAfter = items.after.element[ this._dimension ](),
			splitterPositionInRange = ( this._splitterPosition + sizeBefore ) / ( sizeBefore + sizeAfter ),
			totalRelativeSize = items.before.config[ this._dimension ] + items.after.config[ this._dimension ];
	
		items.before.config[ this._dimension ] = splitterPositionInRange * totalRelativeSize;
		items.after.config[ this._dimension ] = ( 1 - splitterPositionInRange ) * totalRelativeSize;
	
		splitter.element.css({
			'top': 0,
			'left': 0
		});
		
		lm.utils.animFrame( lm.utils.fnBind( this.callDownwards, this, [ 'setSize' ] ) );
	}
});
lm.items.Stack = function( layoutManager, config, parent ) {
	lm.items.AbstractContentItem.call( this, layoutManager, config, parent );

	this.element = $( '<div class="lm_item lm_stack"></div>' );
	this._activeContentItem = null;

	this._dropZones = {};
	this._dropSegment = null;
	this._contentAreaDimensions = null;
	this._dropIndex = null;

	this.isStack = true;

	this.childElementContainer = $( '<div class="lm_items"></div>' );
	this.header = new lm.controls.Header( layoutManager, this );

	if( layoutManager.config.settings.hasHeaders === true ) {
		this.element.append( this.header.element );
	}

	this.element.append( this.childElementContainer );
};

lm.utils.extend( lm.items.Stack, lm.items.AbstractContentItem );

lm.utils.copy( lm.items.Stack.prototype, {

	setSize: function() {
		var i,
			contentWidth = this.element.width(),
			contentHeight = this.element.height() - this.layoutManager.config.dimensions.headerHeight;

		this.childElementContainer.width( contentWidth );
		this.childElementContainer.height( contentHeight );

		for( i = 0; i < this.contentItems.length; i++ ) {
			this.contentItems[ i ].element.width( contentWidth ).height( contentHeight );
		}
		this._$emitBubblingEvent( 'stateChanged' );
	},

	_$init: function() {
		if( this.isInitialised === true ) return;

		for( var i = 0; i < this.contentItems.length; i++ ) {
			this.header.createTab( this.contentItems[ i ] );
			this.contentItems[ i ]._$hide();
		}

		if( this.contentItems.length > 0 ) {
			this.setActiveContentItem( this.contentItems[ 0 ] );
		}

		lm.items.AbstractContentItem.prototype._$init.call( this );
	},

	setActiveContentItem: function( contentItem ) {
		if( lm.utils.indexOf( contentItem, this.contentItems ) === -1 ) {
			throw new Error( 'Component is not a child of this stack' );
		}

		if( this._activeContentItem !== null ) {
			this._activeContentItem._$hide();
		}

		this._activeContentItem = contentItem;
		this.header.setActiveContentItem( contentItem );
		contentItem._$show();
		this._$emitBubblingEvent( 'stateChanged' );
	},

	addChild: function( contentItem, index ) {
		contentItem = this.layoutManager._$normalizeContentItem( contentItem );
		lm.items.AbstractContentItem.prototype.addChild.call( this, contentItem, index );
		this.childElementContainer.append( contentItem.element );
		this.header.createTab( contentItem, index );
		this.setActiveContentItem( contentItem );
		this.callDownwards( 'setSize' );
		this._$emitBubblingEvent( 'stateChanged' );
	},

	removeChild: function( contentItem, keepChild ) {
		var index = lm.utils.indexOf( contentItem, this.contentItems );
		lm.items.AbstractContentItem.prototype.removeChild.call( this, contentItem, keepChild );
		this.header.removeContentItem( contentItem );
		
		if( this.contentItems.length > 0 ) {
			this.setActiveContentItem( this.contentItems[ Math.max( index -1 , 0 ) ] );
		}
		this._$emitBubblingEvent( 'stateChanged' );
	},

	_$destroy: function() {
		lm.items.AbstractContentItem.prototype._$destroy.call( this );
		this.header._$destroy();
	},


	/**
	 * Ok, this one is going to be the tricky one: The user has dropped {contentItem} onto this stack.
	 *
	 * It was dropped on either the stacks header or the top, right, bottom or left bit of the content area
	 * (which one of those is stored in this._dropSegment). Now, if the user has dropped on the header the case
	 * is relatively clear: We add the item to the existing stack... job done (might be good to have 
	 * tab reordering at some point, but lets not sweat it right now)
	 *
	 * If the item was dropped on the content part things are a bit more complicated. If it was dropped on either the
	 * top or bottom region we need to create a new column and place the items accordingly. 
	 * Unless, of course if the stack is already within a column... in which case we want 
	 * to add the newly created item to the existing column... 
	 * either prepend or append it, depending on wether its top or bottom.
	 *
	 * Same thing for rows and left / right drop segments... so in total there are 9 things that can potentially happen
	 * (left, top, right, bottom) * is child of the right parent (row, column) + header drop
	 * 
	 * @param   {lm.item} contentItem
	 *
	 * @returns {void}
	 */
	_$onDrop: function( contentItem ) {

		/*
		 * The item was dropped on the header area. Just add it as a child of this stack and
		 * get the hell out of this logic
		 */
		if( this._dropSegment === 'header' ) {
			this._resetHeaderDropZone();
			this.addChild( contentItem, this._dropIndex );
			return;
		}

		/*
		 * The item was dropped on the top-, left-, bottom- or right- part of the content. Let's
		 * aggregate some conditions to make the if statements later on more readable
		 */
		var isVertical = this._dropSegment === 'top' || this._dropSegment === 'bottom',
			isHorizontal = this._dropSegment === 'left' || this._dropSegment === 'right',
			insertBefore = this._dropSegment === 'top' || this._dropSegment === 'left',
			hasCorrectParent = ( isVertical && this.parent.isColumn ) || ( isHorizontal && this.parent.isRow ),
			type = isVertical ? 'column' : 'row',
			dimension = isVertical ? 'height' : 'width',
			stack,
			rowOrColumn;

		/*
		 * The content item can be either a component or a stack. If it is a component, wrap it into a stack
		 */
		if( contentItem.isComponent ) {
			stack = this.layoutManager.createContentItem({ type: 'stack' }, this );
			stack.addChild( contentItem );
			contentItem = stack;
		}

		/*
		 * If the item is dropped on top or bottom of a column or left and right of a row, it's already
		 * layd out in the correct way. Just add it as a child
		 */
		if( hasCorrectParent ) {
			this.parent.addChild( contentItem, insertBefore ? 0 : undefined );

		/*
		 * This handles items that are dropped on top or bottom of a row or left / right of a column. We need
		 * to create the appropriate contentItem for them to life in
		 */
		} else {
			type = isVertical ? 'column' : 'row';
			rowOrColumn = this.layoutManager.createContentItem({ type: type }, this );
			this.parent.replaceChild( this, rowOrColumn );

			rowOrColumn.addChild( contentItem, insertBefore ? 0 : undefined, true );
			rowOrColumn.addChild( this, insertBefore ? undefined : 0, true );

			this[ dimension ] = 50;
			contentItem[ dimension ] = 50;
			rowOrColumn.callDownwards( 'setSize' );
		}
	},

	/**
	 * If the user hovers above the header part of the stack, indicate drop positions for tabs.
	 * otherwise indicate which segment of the body the dragged item would be dropped on
	 *
	 * @param   {Int} x Absolute Screen X
	 * @param   {Int} y Absolute Screen Y
	 *
	 * @returns {void}
	 */
	_$highlightDropZone: function( x, y ) {
		var segment, area;

		for( segment in this._contentAreaDimensions ) {
			area = this._contentAreaDimensions[ segment ].hoverArea;
			
			if( area.x1 < x && area.x2 > x && area.y1 < y && area.y2 > y ) {

				if( segment === 'header' ) {
					this._dropSegment = 'header';
					this._highlightHeaderDropZone( x );
				} else {
					this._resetHeaderDropZone();
					this._highlightBodyDropZone( segment );
				}
				
				return;
			}
		}
	},

	_$getArea: function() {
		var getArea = lm.items.AbstractContentItem.prototype._$getArea,
			headerArea = getArea.call( this, this.header.element ),
			contentArea = getArea.call( this, this.childElementContainer ),
			contentWidth = contentArea.x2 - contentArea.x1,
			contentHeight = contentArea.y2 - contentArea.y1;

		this._contentAreaDimensions = {
			header: {
				hoverArea: {
					x1: headerArea.x1,
					y1: headerArea.y1,
					x2: headerArea.x2,
					y2: headerArea.y2
				},
				highlightArea: {
					x1: headerArea.x1,
					y1: headerArea.y1,
					x2: headerArea.x2,
					y2: headerArea.y2
				}
			}
		};

		/**
		 * If this Stack is a parent to rows, columns or other stacks only its
		 * header is a valid dropzone.
		 */
		if( this._activeContentItem.isComponent === false ) {
			return headerArea;
		}

		this._contentAreaDimensions.left = {
			hoverArea: {
				x1: contentArea.x1,
				y1: contentArea.y1,
				x2: contentArea.x1 + contentWidth * 0.25,
				y2: contentArea.y2
			},
			highlightArea: {
				x1: contentArea.x1,
				y1: contentArea.y1,
				x2: contentArea.x1 + contentWidth * 0.5,
				y2: contentArea.y2
			}
		};

		this._contentAreaDimensions.top = {
			hoverArea: {
				x1: contentArea.x1 + contentWidth * 0.25,
				y1: contentArea.y1,
				x2: contentArea.x1 + contentWidth * 0.75,
				y2: contentArea.y1 + contentHeight * 0.5
			},
			highlightArea: {
				x1: contentArea.x1,
				y1: contentArea.y1,
				x2: contentArea.x2,
				y2: contentArea.y1 + contentHeight * 0.5
			}
		};
		
		this._contentAreaDimensions.right = {
			hoverArea: {
				x1: contentArea.x1 + contentWidth * 0.75,
				y1: contentArea.y1,
				x2: contentArea.x2,
				y2: contentArea.y2
			},
			highlightArea: {
				x1: contentArea.x1 + contentWidth * 0.5,
				y1: contentArea.y1,
				x2: contentArea.x2,
				y2: contentArea.y2
			}
		};

		this._contentAreaDimensions.bottom = {
			hoverArea: {
				x1: contentArea.x1 + contentWidth * 0.25,
				y1: contentArea.y1 + contentHeight * 0.5,
				x2: contentArea.x1 + contentWidth * 0.75,
				y2: contentArea.y2
			},
			highlightArea: {
				x1: contentArea.x1,
				y1: contentArea.y1 + contentHeight * 0.5,
				x2: contentArea.x2,
				y2: contentArea.y2
			}
		};

		return getArea.call( this, this.element );
	},

	_highlightHeaderDropZone: function( x ) {
		var i,
			tabElement,
			tabsLength = this.header.tabs.length,
			isAboveTab = false,
			tabTop,
			tabLeft,
			offset,
			placeHolderLeft,
			tabWidth,
			halfX;

		for( i = 0; i < tabsLength; i++ ) {
			tabElement = this.header.tabs[ i ].element;
			offset = tabElement.offset();
			tabLeft = offset.left;
			tabTop = offset.top;
			tabWidth = tabElement.width();

			if( x > tabLeft && x < tabLeft + tabWidth ) {
				isAboveTab = true;
				break;
			}
		}

		if( isAboveTab === false && x < tabLeft ) {
			return;
		}

		halfX = tabLeft + tabWidth / 2;

		if( x < halfX ) {
			this._dropIndex = i;
			tabElement.before( this.layoutManager.tabDropPlaceholder );
		} else {
			this._dropIndex = Math.min( i + 1, tabsLength );
			tabElement.after( this.layoutManager.tabDropPlaceholder );
		}


		placeHolderLeft = this.layoutManager.tabDropPlaceholder.offset().left;

		this.layoutManager.dropTargetIndicator.highlightArea({
			x1: placeHolderLeft,
			x2: placeHolderLeft + this.layoutManager.tabDropPlaceholder.width(),
			y1: tabTop,
			y2: tabTop + tabElement.height()
		});
	},

	_resetHeaderDropZone: function() {
		this.layoutManager.tabDropPlaceholder.remove();
	},

	_highlightBodyDropZone: function( segment ) {
		var highlightArea = this._contentAreaDimensions[ segment ].highlightArea;
		this.layoutManager.dropTargetIndicator.highlightArea( highlightArea );
		this._dropSegment = segment;
	}
});return lm.LayoutManager;})()