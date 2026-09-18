/**!
 * Sortable 1.15.6
 * @author	RubaXa   <trash@rubaxa.org>
 * @author	owenm    <owen23355@gmail.com>
 * @license MIT
 */
function ownKeys(object, enumerableOnly) {
	var keys = Object.keys(object);
	if (Object.getOwnPropertySymbols) {
		var symbols = Object.getOwnPropertySymbols(object);
		if (enumerableOnly) {
			symbols = symbols.filter(function (sym) {
				return Object.getOwnPropertyDescriptor(object, sym).enumerable;
			});
		}
		keys.push.apply(keys, symbols);
	}
	return keys;
}
function _objectSpread2(target, other) {
	var source = other != null ? other : {};
	ownKeys(Object(source), true).forEach(function (key) {
		_defineProperty(target, key, source[key]);
	});
	return target;
}
function _defineProperty(obj, key, value) {
	if (key in obj) {
		Object.defineProperty(obj, key, {
			value: value,
			enumerable: true,
			configurable: true,
			writable: true
		});
	} else {
		obj[key] = value;
	}
	return obj;
}
function _objectWithoutPropertiesLoose(source, excluded) {
	if (source == null) return {};
	var target = {};
	var sourceKeys = Object.keys(source);
	var key, i;
	for (i = 0; i < sourceKeys.length; i++) {
		key = sourceKeys[i];
		if (excluded.indexOf(key) >= 0) continue;
		target[key] = source[key];
	}
	return target;
}
function userAgent(pattern) {
	if (typeof window !== 'undefined' && window.navigator) {
		return !! /*@__PURE__*/navigator.userAgent.match(pattern);
	}
}
var IE11OrLess = userAgent(/(?:Trident.*rv[ :]?11\.|msie|iemobile|Windows Phone)/i);
var Edge = userAgent(/Edge/i);
var FireFox = userAgent(/firefox/i);
var Safari = userAgent(/safari/i) && !userAgent(/chrome/i) && !userAgent(/android/i);
var ChromeForAndroid = userAgent(/chrome/i) && userAgent(/android/i);

function on(el, event, fn) {
	el.addEventListener(event, fn, {capture: false, passive: false});
}
function off(el, event, fn) {
	el.removeEventListener(event, fn, {capture: false, passive: false});
}

function closest( /**HTMLElement*/el, /**HTMLElement*/ctx, includeCTX) {
	if ((el.parentNode === ctx) || (includeCTX && (el === ctx))) {
		return el;
	}
	return el.parentNode;
}
function toggleClass(el, name, state) {
	el.classList[state ? 'add' : 'remove'](name);
}

function css(el, prop, val) {
	var style = el && el.style;
	if (style) {
		if (val === void 0) {
			val = document.defaultView.getComputedStyle(el, '');
			return prop === void 0 ? val : val[prop];
		} else {
			style[prop] = val + (typeof val === 'string' ? '' : 'px');
		}
	}
}

function matrix(el, selfOnly) {
	var appliedTransforms = '';
	do {
		var transform = css(el, 'transform');
		if (transform && transform !== 'none') {
			appliedTransforms = transform + ' ' + appliedTransforms;
		}
		/* jshint boss:true */
	} while (!selfOnly && (el = el.parentNode));
	return new window.DOMMatrix(appliedTransforms);
}

function getRect(el) {
	if (el !== document.scrollingElement) {
		let elRect = el.getBoundingClientRect();
		return {
			top: elRect.top,
			left: elRect.left,
			bottom: elRect.bottom,
			right: elRect.right,
			height: elRect.height,
			width: elRect.width
		}
	} else {
		return {
			top: 0,
			left: 0,
			bottom: window.innerHeight,
			right: window.innerWidth,
			height: window.innerHeight,
			width: window.innerWidth
		}
	}
}

/**
 * Gets nth child of el, ignoring hidden children, sortable's elements (does not ignore clone if it's visible)
 * and non-draggable elements
 * @param  {HTMLElement} el       The parent element
 * @param  {Number} childNum      The index of the child
 * @return {HTMLElement}          The child at index childNum, or null if not found
 */
function getChild(el, childNum, includeDragEl) {
	var currentChild = 0,
		i = 0,
		children = el.children;
	while (i < children.length) {
		if (includeDragEl || children[i] !== Sortable.dragged) {
			if (currentChild === childNum) {
				return children[i];
			}
			currentChild++;
		}
		i++;
	}
	return null;
}

/**
 * Returns the index of an element within its parent for a selected set of elements
 * @param  {HTMLElement} el
 * @return {number}
 */
function index(el) {
	var index = 0;
	while (el = el.previousElementSibling) {
		index++;
	}
	return index;
}

function isRectEqual(rect1, rect2) {
	return Math.round(rect1.top) === Math.round(rect2.top);
}

function getChildContainingRectFromElement(container) {
	var rect = {};
	Array.from(container.children).forEach(function (child) {
		var _rect$left, _rect$top, _rect$right, _rect$bottom;
		if (child.animated) return;
		var childRect = getRect(child);
		rect.left = Math.min((_rect$left = rect.left) !== void 0 ? _rect$left : Infinity, childRect.left);
		rect.top = Math.min((_rect$top = rect.top) !== void 0 ? _rect$top : Infinity, childRect.top);
		rect.right = Math.max((_rect$right = rect.right) !== void 0 ? _rect$right : -Infinity, childRect.right);
		rect.bottom = Math.max((_rect$bottom = rect.bottom) !== void 0 ? _rect$bottom : -Infinity, childRect.bottom);
	});
	rect.width = rect.right - rect.left;
	rect.height = rect.bottom - rect.top;
	rect.x = rect.left;
	rect.y = rect.top;
	return rect;
}

function AnimationStateManager() {
	var animationStates = [],
		animationCallbackId;
	return {
		captureAnimationState: function captureAnimationState() {
			animationStates = [];
			var children = [].slice.call(this.el.children);
			children.forEach(function (child) {
				if (child === Sortable.ghost) return;
				animationStates.push({
					target: child,
					rect: getRect(child)
				});
				var fromRect = _objectSpread2({}, animationStates[animationStates.length - 1].rect);

				// If animating: compensate for current animation
				if (child.thisAnimationDuration) {
					var childMatrix = matrix(child, true);
					fromRect.top -= childMatrix.f;
					fromRect.left -= childMatrix.e;
				}
				child.fromRect = fromRect;
			});
		},
		animateAll: function animateAll(callback) {
			var _this = this;
			var animating = false,
				animationTime = 0;
			animationStates.forEach(function (state) {
				var time = 0,
				target = state.target,
				fromRect = target.fromRect,
				toRect = getRect(target),
				prevFromRect = target.prevFromRect,
				prevToRect = target.prevToRect,
				animatingRect = state.rect,
				targetMatrix = matrix(target, true);
				// Compensate for current animation
				toRect.top -= targetMatrix.f;
				toRect.left -= targetMatrix.e;
				target.toRect = toRect;
				if (target.thisAnimationDuration) {
					// Could also check if animatingRect is between fromRect and toRect
					if (isRectEqual(prevFromRect, toRect) && !isRectEqual(fromRect, toRect) &&
					// Make sure animatingRect is on line between toRect & fromRect
					(animatingRect.top - toRect.top) / (animatingRect.left - toRect.left) === (fromRect.top - toRect.top) / (fromRect.left - toRect.left)) {
						// If returning to same place as started from animation and on same axis
						time = Math.sqrt(Math.pow(prevFromRect.top - animatingRect.top, 2) + Math.pow(prevFromRect.left - animatingRect.left, 2)) / Math.sqrt(Math.pow(prevFromRect.top - prevToRect.top, 2) + Math.pow(prevFromRect.left - prevToRect.left, 2)) * _this.options.animation;
					}
				}

				// if fromRect != toRect: animate
				if (!isRectEqual(toRect, fromRect)) {
					target.prevFromRect = fromRect;
					target.prevToRect = toRect;
					if (!time) {
						time = _this.options.animation;
					}
					_this.animate(target, animatingRect, toRect, time);
				}
				if (time) {
					animating = true;
					animationTime = Math.max(animationTime, time);
					clearTimeout(target.animationResetTimer);
					target.animationResetTimer = setTimeout(function () {
						target.animationTime = 0;
						target.prevFromRect = null;
						target.fromRect = null;
						target.prevToRect = null;
						target.thisAnimationDuration = null;
					}, time);
					target.thisAnimationDuration = time;
				}
			});
			clearTimeout(animationCallbackId);
			animationCallbackId = setTimeout(callback, animationTime);
			animationStates = [];
		},
		animate: function animate(target, currentRect, toRect, duration) {
			css(target, 'transition', '');
			css(target, 'transform', '');
			var elMatrix = matrix(this.el),
			scaleX = elMatrix && elMatrix.a,
			scaleY = elMatrix && elMatrix.d,
			translateX = (currentRect.left - toRect.left) / (scaleX || 1),
			translateY = (currentRect.top - toRect.top) / (scaleY || 1);
			target.animatingX = !!translateX;
			target.animatingY = !!translateY;
			css(target, 'transform', 'translate3d(' + translateX + 'px,' + translateY + 'px,0)');
			this.forRepaintDummy = target.offsetWidth;

			css(target, 'transition', 'transform ' + duration + 'ms' + (this.options.easing ? ' ' + this.options.easing : ''));
			css(target, 'transform', 'translate3d(0,0,0)');
			typeof target.animated === 'number' && clearTimeout(target.animated);
			target.animated = setTimeout(function () {
				css(target, 'transition', '');
				css(target, 'transform', '');
				target.animated = false;
				target.animatingX = false;
				target.animatingY = false;
			}, duration);
		}
	};
}

var plugins = [];
var defaults = {
	initializeByDefault: true
};
var PluginManager = {
	mount: function mount(plugin) {
		// Set default static properties
		for (var option in defaults) {
			if (!(option in plugin)) {
				plugin[option] = defaults[option];
			}
		}
		plugins.forEach(function (p) {
			if (p.pluginName === plugin.pluginName) {
				throw "Sortable: Cannot mount plugin ".concat(plugin.pluginName, " more than once");
			}
		});
		plugins.push(plugin);
	},
	pluginEvent: function pluginEvent(eventName, sortable, evt) {
		this.eventCanceled = false;
		evt.cancel = function () {};
		var eventNameGlobal = eventName + 'Global';
		plugins.forEach(function (plugin) {
			// Fire global events if it exists in this sortable
			if (sortable[plugin.pluginName][eventNameGlobal]) {
				sortable[plugin.pluginName][eventNameGlobal](_objectSpread2({
					sortable: sortable
				}, evt));
			}

			// Only fire plugin event if plugin is enabled in this sortable,
			// and plugin has event defined
			if (sortable.options[plugin.pluginName] && sortable[plugin.pluginName][eventName]) {
				sortable[plugin.pluginName][eventName](_objectSpread2({
					sortable: sortable
				}, evt));
			}
		});
	},
	initializePlugins: function initializePlugins(sortable, el, defaults) {
		plugins.forEach(function (plugin) {
			var pluginName = plugin.pluginName;
			var initialized = new plugin(sortable, el, sortable.options);
			initialized.sortable = sortable;
			initialized.options = sortable.options;
			sortable[pluginName] = initialized;

			// Add default options from plugin
			Object.assign.apply(window, [defaults, initialized.defaults]);
		});
	},
	getEventProperties: function getEventProperties(name, sortable) {
		var eventProperties = {};
		plugins.forEach(function (plugin) {
			if (typeof plugin.eventProperties !== 'function') return;
			Object.assign.apply(window, [eventProperties, plugin.eventProperties.call(sortable[plugin.pluginName], name)]);
		});
		return eventProperties;
	}
};

function dispatchEvent(_ref) {
	var sortable = _ref.sortable,
		rootEl = _ref.rootEl,
		name = _ref.name,
		targetEl = _ref.targetEl,
		cloneEl = _ref.cloneEl,
		toEl = _ref.toEl,
		fromEl = _ref.fromEl,
		oldIndex = _ref.oldIndex,
		newIndex = _ref.newIndex,
		oldDraggableIndex = _ref.oldDraggableIndex,
		newDraggableIndex = _ref.newDraggableIndex,
		originalEvent = _ref.originalEvent,
		putSortable = _ref.putSortable,
		extraEventProperties = _ref.extraEventProperties;
	// Support for new CustomEvent feature
	var evt = new CustomEvent(name, {
		bubbles: true,
		cancelable: true
	});
	evt.to = toEl || rootEl;
	evt.from = fromEl || rootEl;
	evt.item = targetEl || rootEl;
	evt.clone = cloneEl;
	evt.oldIndex = oldIndex;
	evt.newIndex = newIndex;
	evt.oldDraggableIndex = oldDraggableIndex;
	evt.newDraggableIndex = newDraggableIndex;
	evt.originalEvent = originalEvent;
	evt.pullMode = putSortable ? putSortable.lastPutMode : undefined;
	var allEventProperties = _objectSpread2(_objectSpread2({}, extraEventProperties), PluginManager.getEventProperties(name, sortable));
	for (var option in allEventProperties) {
		evt[option] = allEventProperties[option];
	}
	rootEl.dispatchEvent(evt);
}

var _excluded = ["evt"];
var pluginEvent = function pluginEvent(eventName, sortable) {
	var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
		originalEvent = _ref.evt,
		data = _objectWithoutPropertiesLoose(_ref, _excluded);
	PluginManager.pluginEvent.bind(Sortable)(eventName, sortable, _objectSpread2({
		dragEl: dragEl,
		parentEl: parentEl,
		ghostEl: ghostEl,
		rootEl: rootEl,
		nextEl: nextEl,
		lastDownEl: lastDownEl,
		cloneEl: cloneEl,
		cloneHidden: cloneHidden,
		dragStarted: moved,
		putSortable: putSortable,
		activeSortable: Sortable.active,
		originalEvent: originalEvent,
		oldIndex: oldIndex,
		oldDraggableIndex: oldDraggableIndex,
		newIndex: newIndex,
		newDraggableIndex: newDraggableIndex
	}, data));
};

function _dispatchEvent(info) {
	dispatchEvent(_objectSpread2({
		putSortable: putSortable,
		cloneEl: cloneEl,
		targetEl: dragEl,
		rootEl: rootEl,
		oldIndex: oldIndex,
		oldDraggableIndex: oldDraggableIndex,
		newIndex: newIndex,
		newDraggableIndex: newDraggableIndex
	}, info));
}

var sortables = [];
/**
 * Detects first nearest empty sortable to X and Y position using emptyInsertThreshold.
 * @param  {Number} x      X position
 * @param  {Number} y      Y position
 * @return {HTMLElement}   Element of the first found nearest Sortable
 */
function _detectNearestEmptySortable(x, y) {
	var ret;
	let sortable = sortables[0];
	var threshold = sortable[expando].options.emptyInsertThreshold;
	var rect = getRect(sortable),
		insideHorizontally = x >= rect.left - threshold && x <= rect.right + threshold,
		insideVertically = y >= rect.top - threshold && y <= rect.bottom + threshold;
	if (insideHorizontally && insideVertically) {
		return ret = sortable;
	}
	return ret;
};

function _prepareGroup(options) {
	options.group = {name: null};
};

var expando = 'Sortable' + new Date().getTime();
var dragEl,
parentEl,
ghostEl,
rootEl,
nextEl,
lastDownEl,
cloneEl,
cloneHidden,
oldIndex,
newIndex,
oldDraggableIndex,
newDraggableIndex,
activeGroup,
putSortable,
awaitingDragStarted = false,
ignoreNextClick = false,
tapEvt,
touchEvt,
lastDx,
lastDy,
tapDistanceLeft,
tapDistanceTop,
moved,
lastTarget,
lastDirection,
pastFirstInvertThresh = false,
isCircumstantialInvert = false,
targetMoveDistance,
// For positioning ghost absolutely
ghostRelativeParentInitialScroll = [],
// (left, top)
_silent = false,
savedInputChecked = [];


/**
 * @class  Sortable
 * @param  {HTMLElement}  el
 * @param  {Object}       [options]
 */
function Sortable(elName) {
	let el = document.getElementById(elName);
	let options = {
		animation: 150,
		ghostClass: 'blue-background-class'
	};
	this.el = el; // root element
	this.options = options = Object.assign.apply(window, [{}, options]);

	// Export instance
	el[expando] = this;
	var defaults = {
		group: null,
		sort: true,
		disabled: false,
		store: null,
		handle: null,
		draggable: /^[uo]l$/i.test(el.nodeName) ? '>li' : '>*',
		swapThreshold: 1,
		// percentage; 0 <= x <= 1
		invertSwap: false,
		// invert always
		invertedSwapThreshold: null,
		// will be set to same as swapThreshold if default
		removeCloneOnHide: true,
		ghostClass: 'sortable-ghost',
		chosenClass: 'sortable-chosen',
		dragClass: 'sortable-drag',
		ignore: 'a, img',
		filter: null,
		preventOnFilter: true,
		animation: 0,
		easing: null,
		dropBubble: false,
		dragoverBubble: false,
		dataIdAttr: 'data-id',
		delay: 0,
		delayOnTouchOnly: false,
		touchStartThreshold: (Number.parseInt ? Number : window).parseInt(window.devicePixelRatio, 10) || 1,
		forceFallback: false,
		fallbackClass: 'sortable-fallback',
		fallbackOnBody: false,
		fallbackTolerance: 0,
		fallbackOffset: {
			x: 0,
			y: 0
		},
		emptyInsertThreshold: 5
	};
	PluginManager.initializePlugins(this, el, defaults);

	// Set default options
	for (var name in defaults) {
		!(name in options) && (options[name] = defaults[name]);
	}
	_prepareGroup(options);

	// Bind all private methods
	for (var fn in this) {
		if (fn.charAt(0) === '_' && typeof this[fn] === 'function') {
			this[fn] = this[fn].bind(this);
		}
	}

	this.nativeDraggable = true;
	this.options.touchStartThreshold = 1;

	// Bind events
	on(el, 'pointerdown', this._onTapStart);
	on(el, 'dragover', this);
	on(el, 'dragenter', this);
	sortables.push(this.el);

	// Add animation state manager
	Object.assign.apply(window, [this, AnimationStateManager()]);
}


Sortable.prototype = /** @lends Sortable.prototype */{
	constructor: Sortable,
	_onTapStart: function _onTapStart( /** Event|TouchEvent */evt) {
		var el = this.el;
		var touch = false,
		target = evt.target;
		_saveInputCheckedState(el);

		target = closest(target, el, false);
		if (target.animated) {
			return;
		}

		// Get the index of the dragged element within its parent
		oldDraggableIndex = oldIndex = index(target);

		// Prepare `dragstart`
		this._prepareDragStart(evt, touch, target);
	},
	_prepareDragStart: function _prepareDragStart( /** Event */evt, /** Touch */touch, /** HTMLElement */target) {
		var _this = this,
		el = _this.el,
		options = _this.options,
		ownerDocument = el.ownerDocument,
		dragStartFn;
		if (target.parentNode === el) {
			var dragRect = getRect(target);
			rootEl = el;
			dragEl = target;
			parentEl = dragEl.parentNode;
			nextEl = dragEl.nextSibling;
			lastDownEl = target;
			activeGroup = options.group;
			Sortable.dragged = dragEl;
			tapEvt = {
				target: dragEl,
				clientX: evt.clientX,
				clientY: evt.clientY
			};
			tapDistanceLeft = tapEvt.clientX - dragRect.left;
			tapDistanceTop = tapEvt.clientY - dragRect.top;
			this._lastX = evt.clientX;
			this._lastY = evt.clientY;
			dragEl.style['will-change'] = 'all';
			dragStartFn = function dragStartFn() {
				pluginEvent('delayEnded', _this, {
					evt: evt
				});
				// Delayed drag has been triggered
				// we can re-enable the events: touchmove/mousemove
				if (!FireFox) {
					dragEl.draggable = true;
				}

				// Bind the events: dragstart/dragend
				_this._triggerDragStart(evt, touch);

				// Drag start event
				_dispatchEvent({
					sortable: _this,
					name: 'choose',
					originalEvent: evt
				});

				// Chosen item
				toggleClass(dragEl, options.chosenClass, true);
			};

			// Disable "draggable"
			on(ownerDocument, 'pointerup', _this._onDrop);

			// Make dragEl draggable (must be before delay for FireFox)
			if (FireFox) {
				this.options.touchStartThreshold = 4;
				dragEl.draggable = true;
			}
			pluginEvent('delayStart', this, {
				evt: evt
			});

			dragStartFn();
		}
	},
	_triggerDragStart: function _triggerDragStart( /** Event */evt, /** Touch */touch) {
		touch = evt.pointerType == 'touch' && evt;
		if (touch) {
			on(document, 'pointermove', this._onTouchMove);
		} else {
			on(dragEl, 'dragend', this);
			on(rootEl, 'dragstart', this._onDragStart);
		}
		try {
			window.getSelection().removeAllRanges();
		} catch (err) {}
	},
	_dragStarted: function _dragStarted(fallback, evt) {
		awaitingDragStarted = false;
		pluginEvent('dragStarted', this, {
			evt: evt
		});
		var options = this.options;

		// Apply effect
		!fallback && toggleClass(dragEl, options.dragClass, false);
		toggleClass(dragEl, options.ghostClass, true);
		Sortable.active = this;
		fallback && this._appendGhost();

		// Drag start event
		_dispatchEvent({
			sortable: this,
			name: 'start',
			originalEvent: evt
		});
	},
	_emulateDragOver: function _emulateDragOver() {
		if (touchEvt) {
			this._lastX = touchEvt.clientX;
			this._lastY = touchEvt.clientY;
			var target = document.elementFromPoint(touchEvt.clientX, touchEvt.clientY);
			var parent = target;
			if (parent) {
				do {
					if (parent[expando]) {
						var inserted = void 0;
						inserted = parent[expando]._onDragOver({
							clientX: touchEvt.clientX,
							clientY: touchEvt.clientY,
							target: target,
							rootEl: parent
						});
					}
					target = parent; // store last element
				}
				/* jshint boss:true */ while (parent = parent.parentNode);
			}
		}
	},

// TODO: continue here

	_onTouchMove: function _onTouchMove( /**TouchEvent*/evt) {
		if (tapEvt) {
		var options = this.options,
			fallbackTolerance = options.fallbackTolerance,
			fallbackOffset = options.fallbackOffset,
			touch = evt.touches ? evt.touches[0] : evt,
			ghostMatrix = ghostEl && matrix(ghostEl, true),
			scaleX = ghostEl && ghostMatrix && ghostMatrix.a,
			scaleY = ghostEl && ghostMatrix && ghostMatrix.d,
			relativeScrollOffset = false,
			dx = (touch.clientX - tapEvt.clientX + fallbackOffset.x) / (scaleX || 1) + (relativeScrollOffset ? relativeScrollOffset[0] - ghostRelativeParentInitialScroll[0] : 0) / (scaleX || 1),
			dy = (touch.clientY - tapEvt.clientY + fallbackOffset.y) / (scaleY || 1) + (relativeScrollOffset ? relativeScrollOffset[1] - ghostRelativeParentInitialScroll[1] : 0) / (scaleY || 1);

		// only set the status to dragging, when we are actually dragging
		if (!Sortable.active && !awaitingDragStarted) {
			if (fallbackTolerance && Math.max(Math.abs(touch.clientX - this._lastX), Math.abs(touch.clientY - this._lastY)) < fallbackTolerance) {
			return;
			}
			this._onDragStart(evt, true);
		}
		if (ghostEl) {
			if (ghostMatrix) {
			ghostMatrix.e += dx - (lastDx || 0);
			ghostMatrix.f += dy - (lastDy || 0);
			} else {
			ghostMatrix = {
				a: 1,
				b: 0,
				c: 0,
				d: 1,
				e: dx,
				f: dy
			};
			}
			var cssMatrix = "matrix(".concat(ghostMatrix.a, ",").concat(ghostMatrix.b, ",").concat(ghostMatrix.c, ",").concat(ghostMatrix.d, ",").concat(ghostMatrix.e, ",").concat(ghostMatrix.f, ")");
			css(ghostEl, 'webkitTransform', cssMatrix);
			css(ghostEl, 'mozTransform', cssMatrix);
			css(ghostEl, 'msTransform', cssMatrix);
			css(ghostEl, 'transform', cssMatrix);
			lastDx = dx;
			lastDy = dy;
			touchEvt = touch;
		}
		evt.cancelable && evt.preventDefault();
		}
	},
	_appendGhost: function _appendGhost() {
		// Bug if using scale(): https://stackoverflow.com/questions/2637058
		// Not being adjusted for
		if (!ghostEl) {
		var container = this.options.fallbackOnBody ? document.body : rootEl,
			rect = getRect(dragEl),
			options = this.options;

		ghostEl = dragEl.cloneNode(true);
		toggleClass(ghostEl, options.ghostClass, false);
		toggleClass(ghostEl, options.fallbackClass, true);
		toggleClass(ghostEl, options.dragClass, true);
		css(ghostEl, 'transition', '');
		css(ghostEl, 'transform', '');
		css(ghostEl, 'box-sizing', 'border-box');
		css(ghostEl, 'margin', 0);
		css(ghostEl, 'top', rect.top);
		css(ghostEl, 'left', rect.left);
		css(ghostEl, 'width', rect.width);
		css(ghostEl, 'height', rect.height);
		css(ghostEl, 'opacity', '0.8');
		css(ghostEl, 'position', 'fixed');
		css(ghostEl, 'zIndex', '100000');
		css(ghostEl, 'pointerEvents', 'none');
		Sortable.ghost = ghostEl;
		container.appendChild(ghostEl);

		// Set transform-origin
		css(ghostEl, 'transform-origin', tapDistanceLeft / parseInt(ghostEl.style.width) * 100 + '% ' + tapDistanceTop / parseInt(ghostEl.style.height) * 100 + '%');
		}
	},
	_onDragStart: function _onDragStart( /**Event*/evt, /**boolean*/fallback) {
		var _this = this;
		var dataTransfer = evt.dataTransfer;
		var options = _this.options;
		pluginEvent('dragStart', this, {
		evt: evt
		});
		if (Sortable.eventCanceled) {
		this._onDrop();
		return;
		}
		pluginEvent('setupClone', this);
		if (!Sortable.eventCanceled) {
		cloneEl = dragEl.cloneNode(true);
		cloneEl.removeAttribute("id");
		cloneEl.draggable = false;
		cloneEl.style['will-change'] = '';
		this._hideClone();
		toggleClass(cloneEl, this.options.chosenClass, false);
		Sortable.clone = cloneEl;
		}

		// #1143: IFrame support workaround
		_this.cloneId = _nextTick(function () {
		pluginEvent('clone', _this);
		if (Sortable.eventCanceled) return;
		if (!_this.options.removeCloneOnHide) {
			rootEl.insertBefore(cloneEl, dragEl);
		}
		_this._hideClone();
		_dispatchEvent({
			sortable: _this,
			name: 'clone'
		});
		});
		!fallback && toggleClass(dragEl, options.dragClass, true);

		// Set proper drop events
		if (fallback) {
		ignoreNextClick = true;
		_this._loopId = setInterval(_this._emulateDragOver, 50);
		} else {
		// Undo what was set in _prepareDragStart before drag started
		off(document, 'mouseup', _this._onDrop);
		off(document, 'touchend', _this._onDrop);
		off(document, 'touchcancel', _this._onDrop);
		if (dataTransfer) {
			dataTransfer.effectAllowed = 'move';
			options.setData && options.setData.call(_this, dataTransfer, dragEl);
		}
		on(document, 'drop', _this);

		// #1276 fix:
		css(dragEl, 'transform', 'translateZ(0)');
		}
		awaitingDragStarted = true;
		_this._dragStartId = _nextTick(_this._dragStarted.bind(_this, fallback, evt));
		on(document, 'selectstart', _this);
		moved = true;
		window.getSelection().removeAllRanges();
		if (Safari) {
		css(document.body, 'user-select', 'none');
		}
	},
	// Returns true - if no further action is needed (either inserted or another condition)
	_onDragOver: function _onDragOver( /**Event*/evt) {
		var el = this.el,
		target = evt.target,
		dragRect,
		targetRect,
		revert,
		options = this.options,
		group = options.group,
		activeSortable = Sortable.active,
		isOwner = activeGroup === group,
		canSort = options.sort,
		fromSortable = putSortable || activeSortable,
		vertical,
		_this = this,
		completedFired = false;
		if (_silent) return;
		function dragOverEvent(name, extra) {
		pluginEvent(name, _this, _objectSpread2({
			evt: evt,
			isOwner: isOwner,
			axis: vertical ? 'vertical' : 'horizontal',
			revert: revert,
			dragRect: dragRect,
			targetRect: targetRect,
			canSort: canSort,
			fromSortable: fromSortable,
			target: target,
			completed: completed,
			onMove: function onMove(target, after) {
			return _onMove(rootEl, el, dragEl, dragRect, target, getRect(target), evt, after);
			},
			changed: changed
		}, extra));
		}

		// Capture animation state
		function capture() {
		dragOverEvent('dragOverAnimationCapture');
		_this.captureAnimationState();
		if (_this !== fromSortable) {
			fromSortable.captureAnimationState();
		}
		}

		// Return invocation when dragEl is inserted (or completed)
		function completed(insertion) {
		dragOverEvent('dragOverCompleted', {
			insertion: insertion
		});
		if (insertion) {
			// Clones must be hidden before folding animation to capture dragRectAbsolute properly
			if (isOwner) {
			activeSortable._hideClone();
			} else {
			activeSortable._showClone(_this);
			}
			if (_this !== fromSortable) {
			// Set ghost class to new sortable's ghost class
			toggleClass(dragEl, putSortable ? putSortable.options.ghostClass : activeSortable.options.ghostClass, false);
			toggleClass(dragEl, options.ghostClass, true);
			}
			if (putSortable !== _this && _this !== Sortable.active) {
			putSortable = _this;
			} else if (_this === Sortable.active && putSortable) {
			putSortable = null;
			}

			// Animation
			if (fromSortable === _this) {
			_this._ignoreWhileAnimating = target;
			}
			_this.animateAll(function () {
			dragOverEvent('dragOverAnimationComplete');
			_this._ignoreWhileAnimating = null;
			});
			if (_this !== fromSortable) {
			fromSortable.animateAll();
			fromSortable._ignoreWhileAnimating = null;
			}
		}

		// Null lastTarget if it is not inside a previously swapped element
		if (target === dragEl && !dragEl.animated || target === el && !target.animated) {
			lastTarget = null;
		}

		// no bubbling and not fallback
		!options.dragoverBubble && evt.stopPropagation && evt.stopPropagation();
		return completedFired = true;
		}

		// Call when dragEl has been inserted
		function changed() {
		newDraggableIndex = newIndex = index(dragEl);
		_dispatchEvent({
			sortable: _this,
			name: 'change',
			toEl: el,
			newIndex: newIndex,
			newDraggableIndex: newDraggableIndex,
			originalEvent: evt
		});
		}
		if (evt.preventDefault !== void 0) {
		evt.cancelable && evt.preventDefault();
		}
		target = closest(target, el, true);
		dragOverEvent('dragOver');
		if (Sortable.eventCanceled) return completedFired;
		if (dragEl.contains(evt.target) || target.animated && target.animatingX && target.animatingY || _this._ignoreWhileAnimating === target) {
		return completed(false);
		}
		ignoreNextClick = false;
		if (activeSortable && !options.disabled && (isOwner ? canSort || (revert = parentEl !== rootEl) // Reverting item into the original list
		: putSortable === this || (this.lastPutMode = null) && null)) {
		vertical = true;
		dragRect = getRect(dragEl);
		dragOverEvent('dragOverValid');
		if (Sortable.eventCanceled) return completedFired;
		if (revert) {
			parentEl = rootEl; // actualization
			capture();
			this._hideClone();
			dragOverEvent('revert');
			if (!Sortable.eventCanceled) {
			if (nextEl) {
				rootEl.insertBefore(dragEl, nextEl);
			} else {
				rootEl.appendChild(dragEl);
			}
			}
			return completed(true);
		}
		var elLastChild = el.lastElementChild;
		if (!elLastChild || _ghostIsLast(evt, vertical, this) && !elLastChild.animated) {
			// Insert to end of list

			// If already at end of list: Do not insert
			if (elLastChild === dragEl) {
			return completed(false);
			}

			// if there is a last element, it is the target
			if (elLastChild && el === evt.target) {
			target = elLastChild;
			}
			if (target) {
			targetRect = getRect(target);
			}
			if (_onMove(rootEl, el, dragEl, dragRect, target, targetRect, evt, !!target) !== false) {
			capture();
			if (elLastChild && elLastChild.nextSibling) {
				// the last draggable element is not the last node
				el.insertBefore(dragEl, elLastChild.nextSibling);
			} else {
				el.appendChild(dragEl);
			}
			parentEl = el; // actualization

			changed();
			return completed(true);
			}
		} else if (elLastChild && _ghostIsFirst(evt, vertical, this)) {
			// Insert to start of list
			var firstChild = getChild(el, 0, true);
			if (firstChild === dragEl) {
			return completed(false);
			}
			target = firstChild;
			targetRect = getRect(target);
			if (_onMove(rootEl, el, dragEl, dragRect, target, targetRect, evt, false) !== false) {
			capture();
			el.insertBefore(dragEl, firstChild);
			parentEl = el; // actualization

			changed();
			return completed(true);
			}
		} else if (target.parentNode === el) {
			targetRect = getRect(target);
			var direction = 0,
			targetBeforeFirstSwap,
			differentLevel = dragEl.parentNode !== el,
			differentRowCol = false,
			side1 = vertical ? 'top' : 'left',
			scrolledPastTop = false,
			scrollBefore = scrolledPastTop ? scrolledPastTop.scrollTop : void 0;
			if (lastTarget !== target) {
			targetBeforeFirstSwap = targetRect[side1];
			pastFirstInvertThresh = false;
			isCircumstantialInvert = !differentRowCol && options.invertSwap || differentLevel;
			}
			direction = _getSwapDirection(evt, target, targetRect, vertical, differentRowCol ? 1 : options.swapThreshold, options.invertedSwapThreshold == null ? options.swapThreshold : options.invertedSwapThreshold, isCircumstantialInvert, lastTarget === target);
			var sibling;
			if (direction !== 0) {
			// Check if target is beside dragEl in respective direction (ignoring hidden elements)
			var dragIndex = index(dragEl);
			do {
				dragIndex -= direction;
				sibling = parentEl.children[dragIndex];
			} while (sibling && (css(sibling, 'display') === 'none' || sibling === ghostEl));
			}
			// If dragEl is already beside target: Do not insert
			if (direction === 0 || sibling === target) {
			return completed(false);
			}
			lastTarget = target;
			lastDirection = direction;
			var nextSibling = target.nextElementSibling,
			after = false;
			after = direction === 1;
			var moveVector = _onMove(rootEl, el, dragEl, dragRect, target, targetRect, evt, after);
			if (moveVector !== false) {
			if (moveVector === 1 || moveVector === -1) {
				after = moveVector === 1;
			}
			_silent = true;
			setTimeout(_unsilent, 30);
			capture();
			if (after && !nextSibling) {
				el.appendChild(dragEl);
			} else {
				target.parentNode.insertBefore(dragEl, after ? nextSibling : target);
			}

			parentEl = dragEl.parentNode; // actualization

			// must be done before animation
			if (targetBeforeFirstSwap !== undefined && !isCircumstantialInvert) {
				targetMoveDistance = Math.abs(targetBeforeFirstSwap - getRect(target)[side1]);
			}
			changed();
			return completed(true);
			}
		}
		if (el.contains(dragEl)) {
			return completed(false);
		}
		}
		return false;
	},
	_ignoreWhileAnimating: null,
	_offMoveEvents: function _offMoveEvents() {
		off(document, 'mousemove', this._onTouchMove);
		off(document, 'touchmove', this._onTouchMove);
		off(document, 'pointermove', this._onTouchMove);
	},
	_offUpEvents: function _offUpEvents() {
		var ownerDocument = this.el.ownerDocument;
		off(ownerDocument, 'mouseup', this._onDrop);
		off(ownerDocument, 'touchend', this._onDrop);
		off(ownerDocument, 'pointerup', this._onDrop);
		off(ownerDocument, 'pointercancel', this._onDrop);
		off(ownerDocument, 'touchcancel', this._onDrop);
		off(document, 'selectstart', this);
	},
	_onDrop: function _onDrop( /**Event*/evt) {
		var el = this.el,
		options = this.options;

		// Get the index of the dragged element within its parent
		newDraggableIndex = newIndex = index(dragEl);
		pluginEvent('drop', this, {
		evt: evt
		});
		parentEl = dragEl && dragEl.parentNode;

		reorder_indices(parentEl, Number(/candidates\[(\d+)\]/.exec(dragEl.firstChild.name)[1]), newIndex);

		// Get again after plugin event
		newDraggableIndex = newIndex = index(dragEl);
		if (Sortable.eventCanceled) {
		this._nulling();
		return;
		}
		awaitingDragStarted = false;
		isCircumstantialInvert = false;
		pastFirstInvertThresh = false;
		clearInterval(this._loopId);
		clearTimeout(this._dragStartTimer);
		_cancelNextTick(this.cloneId);
		_cancelNextTick(this._dragStartId);

		// Unbind events
		if (this.nativeDraggable) {
		off(document, 'drop', this);
		off(el, 'dragstart', this._onDragStart);
		}
		this._offMoveEvents();
		this._offUpEvents();
		if (Safari) {
		css(document.body, 'user-select', '');
		}
		css(dragEl, 'transform', '');
		if (evt) {
		if (moved) {
			evt.cancelable && evt.preventDefault();
			!options.dropBubble && evt.stopPropagation();
		}
		ghostEl && ghostEl.parentNode && ghostEl.parentNode.removeChild(ghostEl);
		if (rootEl === parentEl || putSortable && putSortable.lastPutMode !== 'clone') {
			// Remove clone(s)
			cloneEl && cloneEl.parentNode && cloneEl.parentNode.removeChild(cloneEl);
		}
		if (dragEl) {
			if (this.nativeDraggable) {
			off(dragEl, 'dragend', this);
			}
			_disableDraggable(dragEl);
			dragEl.style['will-change'] = '';

			// Remove classes
			// ghostClass is added in dragStarted
			if (moved && !awaitingDragStarted) {
			toggleClass(dragEl, putSortable ? putSortable.options.ghostClass : this.options.ghostClass, false);
			}
			toggleClass(dragEl, this.options.chosenClass, false);

			// Drag stop event
			_dispatchEvent({
			sortable: this,
			name: 'unchoose',
			toEl: parentEl,
			newIndex: null,
			newDraggableIndex: null,
			originalEvent: evt
			});
			if (rootEl !== parentEl) {
			if (newIndex >= 0) {
				// Add event
				_dispatchEvent({
				rootEl: parentEl,
				name: 'add',
				toEl: parentEl,
				fromEl: rootEl,
				originalEvent: evt
				});

				// Remove event
				_dispatchEvent({
				sortable: this,
				name: 'remove',
				toEl: parentEl,
				originalEvent: evt
				});

				// drag from one list and drop into another
				_dispatchEvent({
				rootEl: parentEl,
				name: 'sort',
				toEl: parentEl,
				fromEl: rootEl,
				originalEvent: evt
				});
				_dispatchEvent({
				sortable: this,
				name: 'sort',
				toEl: parentEl,
				originalEvent: evt
				});
			}
			putSortable && putSortable.save();
			} else {
			if (newIndex !== oldIndex) {
				if (newIndex >= 0) {
				// drag & drop within the same list
				_dispatchEvent({
					sortable: this,
					name: 'update',
					toEl: parentEl,
					originalEvent: evt
				});
				_dispatchEvent({
					sortable: this,
					name: 'sort',
					toEl: parentEl,
					originalEvent: evt
				});
				}
			}
			}
			if (Sortable.active) {
			/* jshint eqnull:true */
			if (newIndex == null || newIndex === -1) {
				newIndex = oldIndex;
				newDraggableIndex = oldDraggableIndex;
			}
			_dispatchEvent({
				sortable: this,
				name: 'end',
				toEl: parentEl,
				originalEvent: evt
			});

			// Save sorting
			this.save();
			}
		}
		}
		this._nulling();
	},
	_nulling: function _nulling() {
		pluginEvent('nulling', this);
		rootEl = dragEl = parentEl = ghostEl = nextEl = cloneEl = lastDownEl = cloneHidden = tapEvt = touchEvt = moved = newIndex = newDraggableIndex = oldIndex = oldDraggableIndex = lastTarget = lastDirection = putSortable = activeGroup = Sortable.dragged = Sortable.ghost = Sortable.clone = Sortable.active = null;
		savedInputChecked.forEach(function (el) {
		el.checked = true;
		});
		savedInputChecked.length = lastDx = lastDy = 0;
	},
	handleEvent: function handleEvent( /**Event*/evt) {
		switch (evt.type) {
		case 'drop':
		case 'dragend':
			this._onDrop(evt);
			break;
		case 'dragenter':
		case 'dragover':
			if (dragEl) {
			this._onDragOver(evt);
			_globalDragOver(evt);
			}
			break;
		case 'selectstart':
			evt.preventDefault();
			break;
		}
	},
	/**
	 * Serializes the item into an array of string.
	 * @returns {String[]}
	 */
	toArray: function toArray() {
		var order = [],
		el,
		children = this.el.children,
		i = 0,
		n = children.length,
		options = this.options;
		for (; i < n; i++) {
		el = children[i];
		if (closest(el, this.el, false)) {
			order.push(el.getAttribute(options.dataIdAttr) || _generateId(el));
		}
		}
		return order;
	},
	/**
	 * Sorts the elements according to the array.
	 * @param  {String[]}  order  order of the items
	 */
	sort: function sort(order, useAnimation) {
		var items = {},
		rootEl = this.el;
		this.toArray().forEach(function (id, i) {
		var el = rootEl.children[i];
		if (closest(el, rootEl, false)) {
			items[id] = el;
		}
		}, this);
		useAnimation && this.captureAnimationState();
		order.forEach(function (id) {
		if (items[id]) {
			rootEl.removeChild(items[id]);
			rootEl.appendChild(items[id]);
		}
		});
		useAnimation && this.animateAll();
	},
	/**
	 * Save the current sorting
	 */
	save: function save() {
		var store = this.options.store;
		store && store.set && store.set(this);
	},
	/**
	 * Set/get option
	 * @param   {string} name
	 * @param   {*}      [value]
	 * @returns {*}
	 */
	option: function option(name, value) {
		var options = this.options;
		if (value === void 0) {
		return options[name];
		} else {
		var modifiedValue = undefined;
		if (typeof modifiedValue !== 'undefined') {
			options[name] = modifiedValue;
		} else {
			options[name] = value;
		}
		if (name === 'group') {
			_prepareGroup(options);
		}
		}
	},
	/**
	 * Destroy
	 */
	destroy: function destroy() {
		pluginEvent('destroy', this);
		var el = this.el;
		el[expando] = null;
		off(el, 'mousedown', this._onTapStart);
		off(el, 'touchstart', this._onTapStart);
		off(el, 'pointerdown', this._onTapStart);
		if (this.nativeDraggable) {
		off(el, 'dragover', this);
		off(el, 'dragenter', this);
		}
		// Remove draggable attributes
		Array.prototype.forEach.call(el.querySelectorAll('[draggable]'), function (el) {
		el.removeAttribute('draggable');
		});
		this._onDrop();
		sortables.splice(sortables.indexOf(this.el), 1);
		this.el = el = null;
	},
	_hideClone: function _hideClone() {
		if (!cloneHidden) {
		pluginEvent('hideClone', this);
		if (Sortable.eventCanceled) return;
		css(cloneEl, 'display', 'none');
		if (this.options.removeCloneOnHide && cloneEl.parentNode) {
			cloneEl.parentNode.removeChild(cloneEl);
		}
		cloneHidden = true;
		}
	},
	_showClone: function _showClone(putSortable) {
		if (putSortable.lastPutMode !== 'clone') {
		this._hideClone();
		return;
		}
		if (cloneHidden) {
		pluginEvent('showClone', this);
		if (Sortable.eventCanceled) return;

		// show clone at dragEl or original position
		if (dragEl.parentNode == rootEl && !this.options.group.revertClone) {
			rootEl.insertBefore(cloneEl, dragEl);
		} else if (nextEl) {
			rootEl.insertBefore(cloneEl, nextEl);
		} else {
			rootEl.appendChild(cloneEl);
		}
		if (this.options.group.revertClone) {
			this.animate(dragEl, cloneEl);
		}
		css(cloneEl, 'display', '');
		cloneHidden = false;
		}
	}
};
function _globalDragOver( /**Event*/evt) {
if (evt.dataTransfer) {
	evt.dataTransfer.dropEffect = 'move';
}
evt.cancelable && evt.preventDefault();
}
function _onMove(fromEl, toEl, dragEl, dragRect, targetEl, targetRect, originalEvent, willInsertAfter) {
var evt,
	sortable = fromEl[expando],
	onMoveFn = sortable.options.onMove,
	retVal;
// Support for new CustomEvent feature
if (window.CustomEvent && !IE11OrLess && !Edge) {
	evt = new CustomEvent('move', {
	bubbles: true,
	cancelable: true
	});
} else {
	evt = document.createEvent('Event');
	evt.initEvent('move', true, true);
}
evt.to = toEl;
evt.from = fromEl;
evt.dragged = dragEl;
evt.draggedRect = dragRect;
evt.related = targetEl || toEl;
evt.relatedRect = targetRect || getRect(toEl);
evt.willInsertAfter = willInsertAfter;
evt.originalEvent = originalEvent;
fromEl.dispatchEvent(evt);
if (onMoveFn) {
	retVal = onMoveFn.call(sortable, evt, originalEvent);
}
return retVal;
}
function _disableDraggable(el) {
el.draggable = false;
}
function _unsilent() {
_silent = false;
}
function _ghostIsFirst(evt, vertical, sortable) {
var firstElRect = getRect(getChild(sortable.el, 0, true));
var childContainingRect = getChildContainingRectFromElement(sortable.el);
var spacer = 10;
return vertical ? evt.clientX < childContainingRect.left - spacer || evt.clientY < firstElRect.top && evt.clientX < firstElRect.right : evt.clientY < childContainingRect.top - spacer || evt.clientY < firstElRect.bottom && evt.clientX < firstElRect.left;
}
function _ghostIsLast(evt, vertical, sortable) {
var lastElRect = getRect(sortable.el.lastElementChild);
var childContainingRect = getChildContainingRectFromElement(sortable.el);
var spacer = 10;
return vertical ? evt.clientX > childContainingRect.right + spacer || evt.clientY > lastElRect.bottom && evt.clientX > lastElRect.left : evt.clientY > childContainingRect.bottom + spacer || evt.clientX > lastElRect.right && evt.clientY > lastElRect.top;
}
function _getSwapDirection(evt, target, targetRect, vertical, swapThreshold, invertedSwapThreshold, invertSwap, isLastTarget) {
var mouseOnAxis = vertical ? evt.clientY : evt.clientX,
	targetLength = vertical ? targetRect.height : targetRect.width,
	targetS1 = vertical ? targetRect.top : targetRect.left,
	targetS2 = vertical ? targetRect.bottom : targetRect.right,
	invert = false;
if (!invertSwap) {
	// Never invert or create dragEl shadow when target movemenet causes mouse to move past the end of regular swapThreshold
	if (isLastTarget && targetMoveDistance < targetLength * swapThreshold) {
	// multiplied only by swapThreshold because mouse will already be inside target by (1 - threshold) * targetLength / 2
	// check if past first invert threshold on side opposite of lastDirection
	if (!pastFirstInvertThresh && (lastDirection === 1 ? mouseOnAxis > targetS1 + targetLength * invertedSwapThreshold / 2 : mouseOnAxis < targetS2 - targetLength * invertedSwapThreshold / 2)) {
		// past first invert threshold, do not restrict inverted threshold to dragEl shadow
		pastFirstInvertThresh = true;
	}
	if (!pastFirstInvertThresh) {
		// dragEl shadow (target move distance shadow)
		if (lastDirection === 1 ? mouseOnAxis < targetS1 + targetMoveDistance // over dragEl shadow
		: mouseOnAxis > targetS2 - targetMoveDistance) {
		return -lastDirection;
		}
	} else {
		invert = true;
	}
	} else {
	// Regular
	if (mouseOnAxis > targetS1 + targetLength * (1 - swapThreshold) / 2 && mouseOnAxis < targetS2 - targetLength * (1 - swapThreshold) / 2) {
		return _getInsertDirection(target);
	}
	}
}
invert = invert || invertSwap;
if (invert) {
	// Invert of regular
	if (mouseOnAxis < targetS1 + targetLength * invertedSwapThreshold / 2 || mouseOnAxis > targetS2 - targetLength * invertedSwapThreshold / 2) {
	return mouseOnAxis > targetS1 + targetLength / 2 ? 1 : -1;
	}
}
return 0;
}

/**
 * Gets the direction dragEl must be swapped relative to target in order to make it
 * seem that dragEl has been "inserted" into that element's position
 * @param  {HTMLElement} target       The target whose position dragEl is being inserted at
 * @return {Number}                   Direction dragEl must be swapped
 */
function _getInsertDirection(target) {
if (index(dragEl) < index(target)) {
	return 1;
} else {
	return -1;
}
}

/**
 * Generate id
 * @param   {HTMLElement} el
 * @returns {String}
 * @private
 */
function _generateId(el) {
var str = el.tagName + el.className + el.src + el.href + el.textContent,
	i = str.length,
	sum = 0;
while (i--) {
	sum += str.charCodeAt(i);
}
return sum.toString(36);
}
function _saveInputCheckedState(root) {
savedInputChecked.length = 0;
var inputs = root.getElementsByTagName('input');
var idx = inputs.length;
while (idx--) {
	var el = inputs[idx];
	el.checked && savedInputChecked.push(el);
}
}
function _nextTick(fn) {
return setTimeout(fn, 0);
}
function _cancelNextTick(id) {
return clearTimeout(id);
}

// Fixed #973:
on(document, 'touchmove', function (evt) {
	if ((Sortable.active || awaitingDragStarted) && evt.cancelable) {
	evt.preventDefault();
	}
});

// Export utils
Sortable.utils = {
on: on,
off: off,
css: css,
closest: closest,
toggleClass: toggleClass,
index: index,
nextTick: _nextTick,
cancelNextTick: _cancelNextTick,
getChild: getChild,
expando: expando
};

/**
 * Get the Sortable instance of an element
 * @param  {HTMLElement} element The element
 * @return {Sortable|undefined}         The instance of Sortable
 */
Sortable.get = function (element) {
return element[expando];
};

/**
 * Mount a plugin to Sortable
 * @param  {...SortablePlugin|SortablePlugin[]} plugins       Plugins being mounted
 */
Sortable.mount = function () {
for (var _len = arguments.length, plugins = new Array(_len), _key = 0; _key < _len; _key++) {
	plugins[_key] = arguments[_key];
}
if (plugins[0].constructor === Array) plugins = plugins[0];
plugins.forEach(function (plugin) {
	if (!plugin.prototype || !plugin.prototype.constructor) {
	throw "Sortable: Mounted plugin must be a constructor function, not ".concat({}.toString.call(plugin));
	}
	if (plugin.utils) Sortable.utils = _objectSpread2(_objectSpread2({}, Sortable.utils), plugin.utils);
	PluginManager.mount(plugin);
});
};

/**
 * Create sortable instance
 * @param {HTMLElement}  el
 * @param {Object}      [options]
 */
Sortable.create = function (el, options) {
return new Sortable(el, options);
};

// Export
var autoScrolls = [],
scrollEl,
scrollRootEl,
scrolling = false,
lastAutoScrollX,
lastAutoScrollY,
touchEvt$1,
pointerElemChangedInterval;
function AutoScrollPlugin() {
function AutoScroll() {
	this.defaults = {
	scroll: true,
	forceAutoScrollFallback: false,
	scrollSensitivity: 30,
	scrollSpeed: 10,
	bubbleScroll: true
	};

	// Bind all private methods
	for (var fn in this) {
	if (fn.charAt(0) === '_' && typeof this[fn] === 'function') {
		this[fn] = this[fn].bind(this);
	}
	}
}
AutoScroll.prototype = {
	dragStarted: function dragStarted(_ref) {
	var originalEvent = _ref.originalEvent;
	if (this.sortable.nativeDraggable) {
		on(document, 'dragover', this._handleAutoScroll);
	} else {
		on(document, 'pointermove', this._handleFallbackAutoScroll);
	}
	},
	dragOverCompleted: function dragOverCompleted(_ref2) {
	var originalEvent = _ref2.originalEvent;
	// For when bubbling is canceled and using fallback (fallback 'touchmove' always reached)
	if (!this.options.dragOverBubble && !originalEvent.rootEl) {
		this._handleAutoScroll(originalEvent);
	}
	},
	drop: function drop() {
	if (this.sortable.nativeDraggable) {
		off(document, 'dragover', this._handleAutoScroll);
	} else {
		off(document, 'pointermove', this._handleFallbackAutoScroll);
		off(document, 'touchmove', this._handleFallbackAutoScroll);
		off(document, 'mousemove', this._handleFallbackAutoScroll);
	}
	clearPointerElemChangedInterval();
	clearAutoScrolls();
	},
	nulling: function nulling() {
	touchEvt$1 = scrollRootEl = scrollEl = scrolling = pointerElemChangedInterval = lastAutoScrollX = lastAutoScrollY = null;
	autoScrolls.length = 0;
	},
	_handleFallbackAutoScroll: function _handleFallbackAutoScroll(evt) {
	this._handleAutoScroll(evt, true);
	},
	_handleAutoScroll: function _handleAutoScroll(evt, fallback) {
	var _this = this;
	var x = (evt.touches ? evt.touches[0] : evt).clientX,
		y = (evt.touches ? evt.touches[0] : evt).clientY,
		elem = document.elementFromPoint(x, y);
	touchEvt$1 = evt;

	// IE does not seem to have native autoscroll,
	// Edge's autoscroll seems too conditional,
	// MACOS Safari does not have autoscroll,
	// Firefox and Chrome are good
	if (fallback || this.options.forceAutoScrollFallback || Edge || IE11OrLess || Safari) {
		autoScroll(evt, this.options, elem, fallback);

		// Listener for pointer element change
		var ogElemScroller = document.scrollingElement;
		if (scrolling && (!pointerElemChangedInterval || x !== lastAutoScrollX || y !== lastAutoScrollY)) {
		pointerElemChangedInterval && clearPointerElemChangedInterval();
		// Detect for pointer elem change, emulating native DnD behaviour
		pointerElemChangedInterval = setInterval(function () {
			var newElem = document.scrollingElement;
			if (newElem !== ogElemScroller) {
			ogElemScroller = newElem;
			clearAutoScrolls();
			}
			autoScroll(evt, _this.options, newElem, fallback);
		}, 10);
		lastAutoScrollX = x;
		lastAutoScrollY = y;
		}
	} else {
		// if DnD is enabled (and browser has good autoscrolling), first autoscroll will already scroll, so get parent autoscroll of first autoscroll
		if (!this.options.bubbleScroll || document.scrollingElement === document.scrollingElement) {
		clearAutoScrolls();
		return;
		}
		autoScroll(evt, this.options, document.scrollingElement, false);
	}
	}
};
return Object.assign.apply(window, [AutoScroll, {
	pluginName: 'scroll',
	initializeByDefault: true
}]);
}
function clearAutoScrolls() {
autoScrolls.forEach(function (autoScroll) {
	clearInterval(autoScroll.pid);
});
autoScrolls = [];
}
function clearPointerElemChangedInterval() {
clearInterval(pointerElemChangedInterval);
}
var autoScroll = function () {};

var drop = function drop(_ref) {
var originalEvent = _ref.originalEvent,
	putSortable = _ref.putSortable,
	dragEl = _ref.dragEl,
	activeSortable = _ref.activeSortable,
	hideGhostForTarget = _ref.hideGhostForTarget,
	unhideGhostForTarget = _ref.unhideGhostForTarget;
if (!originalEvent) return;
var toSortable = putSortable || activeSortable;
hideGhostForTarget();
var touch = originalEvent.changedTouches && originalEvent.changedTouches.length ? originalEvent.changedTouches[0] : originalEvent;
var target = document.elementFromPoint(touch.clientX, touch.clientY);
unhideGhostForTarget();
if (toSortable && !toSortable.el.contains(target)) {
	this.onSpill({
	dragEl: dragEl,
	putSortable: putSortable
	});
}
};
function Revert() {}
Revert.prototype = {
startIndex: null,
dragStart: function dragStart(_ref2) {
	var oldDraggableIndex = _ref2.oldDraggableIndex;
	this.startIndex = oldDraggableIndex;
},
onSpill: function onSpill(_ref3) {
	var dragEl = _ref3.dragEl,
	putSortable = _ref3.putSortable;
	this.sortable.captureAnimationState();
	if (putSortable) {
	putSortable.captureAnimationState();
	}
	var nextSibling = getChild(this.sortable.el, this.startIndex);
	if (nextSibling) {
	this.sortable.el.insertBefore(dragEl, nextSibling);
	} else {
	this.sortable.el.appendChild(dragEl);
	}
	this.sortable.animateAll();
	if (putSortable) {
	putSortable.animateAll();
	}
},
drop: drop
};
Object.assign.apply(window, [Revert, {
pluginName: 'revertOnSpill'
}]);
function Remove() {}
Remove.prototype = {
onSpill: function onSpill(_ref4) {
	var dragEl = _ref4.dragEl,
	putSortable = _ref4.putSortable;
	var parentSortable = putSortable || this.sortable;
	parentSortable.captureAnimationState();
	dragEl.parentNode && dragEl.parentNode.removeChild(dragEl);
	parentSortable.animateAll();
},
drop: drop
};
Object.assign.apply(window, [Remove, {
pluginName: 'removeOnSpill'
}]);

var lastSwapEl;
function SwapPlugin() {
function Swap() {
	this.defaults = {
	swapClass: 'sortable-swap-highlight'
	};
}
Swap.prototype = {
	dragStart: function dragStart(_ref) {
	var dragEl = _ref.dragEl;
	lastSwapEl = dragEl;
	},
	dragOverValid: function dragOverValid(_ref2) {
	var completed = _ref2.completed,
		target = _ref2.target,
		onMove = _ref2.onMove,
		activeSortable = _ref2.activeSortable,
		changed = _ref2.changed,
		cancel = _ref2.cancel;
	if (!activeSortable.options.swap) return;
	var el = this.sortable.el,
		options = this.options;
	if (target && target !== el) {
		var prevSwapEl = lastSwapEl;
		if (onMove(target) !== false) {
		toggleClass(target, options.swapClass, true);
		lastSwapEl = target;
		} else {
		lastSwapEl = null;
		}
		if (prevSwapEl && prevSwapEl !== lastSwapEl) {
		toggleClass(prevSwapEl, options.swapClass, false);
		}
	}
	changed();
	completed(true);
	cancel();
	},
	drop: function drop(_ref3) {
	var activeSortable = _ref3.activeSortable,
		putSortable = _ref3.putSortable,
		dragEl = _ref3.dragEl;
	var toSortable = putSortable || this.sortable;
	var options = this.options;
	lastSwapEl && toggleClass(lastSwapEl, options.swapClass, false);
	if (lastSwapEl && (options.swap || putSortable && putSortable.options.swap)) {
		if (dragEl !== lastSwapEl) {
		toSortable.captureAnimationState();
		if (toSortable !== activeSortable) activeSortable.captureAnimationState();
		swapNodes(dragEl, lastSwapEl);
		toSortable.animateAll();
		if (toSortable !== activeSortable) activeSortable.animateAll();
		}
	}
	},
	nulling: function nulling() {
	lastSwapEl = null;
	}
};
return Object.assign.apply(window, [Swap, {
	pluginName: 'swap',
	eventProperties: function eventProperties() {
	return {
		swapItem: lastSwapEl
	};
	}
}]);
}
function swapNodes(n1, n2) {
var p1 = n1.parentNode,
	p2 = n2.parentNode,
	i1,
	i2;
if (!p1 || !p2 || p1.isEqualNode(n2) || p2.isEqualNode(n1)) return;
i1 = index(n1);
i2 = index(n2);
if (p1.isEqualNode(p2) && i1 < i2) {
	i2++;
}
p1.insertBefore(n2, p1.children[i1]);
p2.insertBefore(n1, p2.children[i2]);
}

var multiDragElements = [],
multiDragClones = [],
lastMultiDragSelect,
// for selection with modifier key down (SHIFT)
multiDragSortable,
initialFolding = false,
// Initial multi-drag fold when drag started
folding = false,
// Folding any other time
dragStarted = false,
dragEl$1,
clonesFromRect,
clonesHidden;
function MultiDragPlugin() {
function MultiDrag(sortable) {
	// Bind all private methods
	for (var fn in this) {
	if (fn.charAt(0) === '_' && typeof this[fn] === 'function') {
		this[fn] = this[fn].bind(this);
	}
	}
	if (!sortable.options.avoidImplicitDeselect) {
	on(document, 'pointerup', this._deselectMultiDrag);
	}
	on(document, 'keydown', this._checkKeyDown);
	on(document, 'keyup', this._checkKeyUp);
	this.defaults = {
	selectedClass: 'sortable-selected',
	multiDragKey: null,
	avoidImplicitDeselect: false,
	setData: function setData(dataTransfer, dragEl) {
		var data = '';
		if (multiDragElements.length && multiDragSortable === sortable) {
		multiDragElements.forEach(function (multiDragElement, i) {
			data += (!i ? '' : ', ') + multiDragElement.textContent;
		});
		} else {
		data = dragEl.textContent;
		}
		dataTransfer.setData('Text', data);
	}
	};
}
MultiDrag.prototype = {
	multiDragKeyDown: false,
	isMultiDrag: false,
	delayStartGlobal: function delayStartGlobal(_ref) {
	var dragged = _ref.dragEl;
	dragEl$1 = dragged;
	},
	delayEnded: function delayEnded() {
	this.isMultiDrag = ~multiDragElements.indexOf(dragEl$1);
	},
	setupClone: function setupClone(_ref2) {
	var sortable = _ref2.sortable,
		cancel = _ref2.cancel;
	if (!this.isMultiDrag) return;
	for (var i = 0; i < multiDragElements.length; i++) {
		multiDragClones.push(multiDragElements[i].cloneNode(true));
		multiDragClones[i].sortableIndex = multiDragElements[i].sortableIndex;
		multiDragClones[i].draggable = false;
		multiDragClones[i].style['will-change'] = '';
		toggleClass(multiDragClones[i], this.options.selectedClass, false);
		multiDragElements[i] === dragEl$1 && toggleClass(multiDragClones[i], this.options.chosenClass, false);
	}
	sortable._hideClone();
	cancel();
	},
	clone: function clone(_ref3) {
	var sortable = _ref3.sortable,
		rootEl = _ref3.rootEl,
		cancel = _ref3.cancel;
	if (!this.isMultiDrag) return;
	if (!this.options.removeCloneOnHide) {
		if (multiDragElements.length && multiDragSortable === sortable) {
		insertMultiDragClones(true, rootEl);
		cancel();
		}
	}
	},
	showClone: function showClone(_ref4) {
	var rootEl = _ref4.rootEl,
		cancel = _ref4.cancel;
	if (!this.isMultiDrag) return;
	insertMultiDragClones(false, rootEl);
	multiDragClones.forEach(function (clone) {
		css(clone, 'display', '');
	});
	clonesHidden = false;
	cancel();
	},
	hideClone: function hideClone(_ref5) {
	var _this = this;
	var sortable = _ref5.sortable,
		cancel = _ref5.cancel;
	if (!this.isMultiDrag) return;
	multiDragClones.forEach(function (clone) {
		css(clone, 'display', 'none');
		if (_this.options.removeCloneOnHide && clone.parentNode) {
		clone.parentNode.removeChild(clone);
		}
	});
	clonesHidden = true;
	cancel();
	},
	dragStartGlobal: function dragStartGlobal(_ref6) {
	var sortable = _ref6.sortable;
	if (!this.isMultiDrag && multiDragSortable) {
		multiDragSortable.multiDrag._deselectMultiDrag();
	}
	multiDragElements.forEach(function (multiDragElement) {
		multiDragElement.sortableIndex = index(multiDragElement);
	});

	// Sort multi-drag elements
	multiDragElements = multiDragElements.sort(function (a, b) {
		return a.sortableIndex - b.sortableIndex;
	});
	dragStarted = true;
	},
	dragStarted: function dragStarted(_ref7) {
	var _this2 = this;
	var sortable = _ref7.sortable;
	if (!this.isMultiDrag) return;
	if (this.options.sort) {
		// Capture rects,
		// hide multi drag elements (by positioning them absolute),
		// set multi drag elements rects to dragRect,
		// show multi drag elements,
		// animate to rects,
		// unset rects & remove from DOM

		sortable.captureAnimationState();
		if (this.options.animation) {
		multiDragElements.forEach(function (multiDragElement) {
			if (multiDragElement === dragEl$1) return;
			css(multiDragElement, 'position', 'absolute');
		});
		multiDragElements.forEach(function (multiDragElement) {
			if (multiDragElement === dragEl$1) return;
		});
		folding = true;
		initialFolding = true;
		}
	}
	sortable.animateAll(function () {
		folding = false;
		initialFolding = false;

		// Remove all auxiliary multidrag items from el, if sorting enabled
		if (_this2.options.sort) {
		removeMultiDragElements();
		}
	});
	},
	dragOver: function dragOver(_ref8) {
	var target = _ref8.target,
		completed = _ref8.completed,
		cancel = _ref8.cancel;
	if (folding && ~multiDragElements.indexOf(target)) {
		completed(false);
		cancel();
	}
	},
	revert: function revert(_ref9) {
	var rootEl = _ref9.rootEl,
		dragRect = _ref9.dragRect;
	if (multiDragElements.length > 1) {
		// Setup unfold animation
		multiDragElements.forEach(function (multiDragElement) {
		multiDragElement.fromRect = dragRect;
		});
		folding = false;
		insertMultiDragElements(!this.options.removeCloneOnHide, rootEl);
	}
	},
	dragOverCompleted: function dragOverCompleted(_ref10) {
	var sortable = _ref10.sortable,
		isOwner = _ref10.isOwner,
		insertion = _ref10.insertion,
		activeSortable = _ref10.activeSortable,
		parentEl = _ref10.parentEl,
		putSortable = _ref10.putSortable;
	var options = this.options;
	if (insertion) {
		// Clones must be hidden before folding animation to capture dragRectAbsolute properly
		if (isOwner) {
		activeSortable._hideClone();
		}
		initialFolding = false;
		// If leaving sort:false root, or already folding - Fold to new location
		if (options.animation && multiDragElements.length > 1 && (folding || !isOwner && !activeSortable.options.sort && !putSortable)) {
		// Fold: Set all multi drag elements's rects to dragEl's rect when multi-drag elements are invisible
		multiDragElements.forEach(function (multiDragElement) {
			if (multiDragElement === dragEl$1) return;

			// Move element(s) to end of parentEl so that it does not interfere with multi-drag clones insertion if they are inserted
			// while folding, and so that we can capture them again because old sortable will no longer be fromSortable
			parentEl.appendChild(multiDragElement);
		});
		folding = true;
		}

		// Clones must be shown (and check to remove multi drags) after folding when interfering multiDragElements are moved out
		if (!isOwner) {
		// Only remove if not folding (folding will remove them anyways)
		if (!folding) {
			removeMultiDragElements();
		}
		if (multiDragElements.length > 1) {
			var clonesHiddenBefore = clonesHidden;
			activeSortable._showClone(sortable);

			// Unfold animation for clones if showing from hidden
			if (activeSortable.options.animation && !clonesHidden && clonesHiddenBefore) {
			multiDragClones.forEach(function (clone) {
				clone.fromRect = clonesFromRect;
				clone.thisAnimationDuration = null;
			});
			}
		} else {
			activeSortable._showClone(sortable);
		}
		}
	}
	},
	dragOverAnimationCapture: function dragOverAnimationCapture(_ref11) {
	var dragRect = _ref11.dragRect,
		isOwner = _ref11.isOwner,
		activeSortable = _ref11.activeSortable;
	multiDragElements.forEach(function (multiDragElement) {
		multiDragElement.thisAnimationDuration = null;
	});
	if (activeSortable.options.animation && !isOwner && activeSortable.multiDrag.isMultiDrag) {
		clonesFromRect = Object.assign.apply(window, [{}, dragRect]);
		var dragMatrix = matrix(dragEl$1, true);
		clonesFromRect.top -= dragMatrix.f;
		clonesFromRect.left -= dragMatrix.e;
	}
	},
	dragOverAnimationComplete: function dragOverAnimationComplete() {
	if (folding) {
		folding = false;
		removeMultiDragElements();
	}
	},
	drop: function drop(_ref12) {
	var evt = _ref12.originalEvent,
		rootEl = _ref12.rootEl,
		parentEl = _ref12.parentEl,
		sortable = _ref12.sortable,
		oldIndex = _ref12.oldIndex,
		putSortable = _ref12.putSortable;
	var toSortable = putSortable || this.sortable;
	if (!evt) return;
	var options = this.options,
		children = parentEl.children;

	// Multi-drag selection
	if (!dragStarted) {
		if (options.multiDragKey && !this.multiDragKeyDown) {
		this._deselectMultiDrag();
		}
		toggleClass(dragEl$1, options.selectedClass, !~multiDragElements.indexOf(dragEl$1));
		if (!~multiDragElements.indexOf(dragEl$1)) {
		multiDragElements.push(dragEl$1);
		dispatchEvent({
			sortable: sortable,
			rootEl: rootEl,
			name: 'select',
			targetEl: dragEl$1,
			originalEvent: evt
		});

		// Modifier activated, select from last to dragEl
		if (evt.shiftKey && lastMultiDragSelect && sortable.el.contains(lastMultiDragSelect)) {
			var lastIndex = index(lastMultiDragSelect),
			currentIndex = index(dragEl$1);
			if (~lastIndex && ~currentIndex && lastIndex !== currentIndex) {
			(function () {
				// Must include lastMultiDragSelect (select it), in case modified selection from no selection
				// (but previous selection existed)
				var n, i;
				if (currentIndex > lastIndex) {
				i = lastIndex;
				n = currentIndex;
				} else {
				i = currentIndex;
				n = lastIndex + 1;
				}
				var filter = options.filter;
				for (; i < n; i++) {
				if (~multiDragElements.indexOf(children[i])) continue;
				// Check if element is draggable
				if (!closest(children[i], parentEl, false)) continue;
				// Check if element is filtered
				var filtered = filter && (typeof filter === 'function' ? filter.call(sortable, evt, children[i], sortable) : filter.split(',').some(function (criteria) {
					return closest(children[i], parentEl, false);
				}));
				if (filtered) continue;
				toggleClass(children[i], options.selectedClass, true);
				multiDragElements.push(children[i]);
				dispatchEvent({
					sortable: sortable,
					rootEl: rootEl,
					name: 'select',
					targetEl: children[i],
					originalEvent: evt
				});
				}
			})();
			}
		} else {
			lastMultiDragSelect = dragEl$1;
		}
		multiDragSortable = toSortable;
		} else {
		multiDragElements.splice(multiDragElements.indexOf(dragEl$1), 1);
		lastMultiDragSelect = null;
		dispatchEvent({
			sortable: sortable,
			rootEl: rootEl,
			name: 'deselect',
			targetEl: dragEl$1,
			originalEvent: evt
		});
		}
	}

	// Multi-drag drop
	if (dragStarted && this.isMultiDrag) {
		folding = false;
		// Do not "unfold" after around dragEl if reverted
		if ((parentEl[expando].options.sort || parentEl !== rootEl) && multiDragElements.length > 1) {
		var dragRect = getRect(dragEl$1),
			multiDragIndex = index(dragEl$1);
		if (!initialFolding && options.animation) dragEl$1.thisAnimationDuration = null;
		toSortable.captureAnimationState();
		if (!initialFolding) {
			if (options.animation) {
			dragEl$1.fromRect = dragRect;
			multiDragElements.forEach(function (multiDragElement) {
				multiDragElement.thisAnimationDuration = null;
				if (multiDragElement !== dragEl$1) {
				var rect = folding ? getRect(multiDragElement) : dragRect;
				multiDragElement.fromRect = rect;
				}
			});
			}

			// Multi drag elements are not necessarily removed from the DOM on drop, so to reinsert
			// properly they must all be removed
			removeMultiDragElements();
			multiDragElements.forEach(function (multiDragElement) {
			if (children[multiDragIndex]) {
				parentEl.insertBefore(multiDragElement, children[multiDragIndex]);
			} else {
				parentEl.appendChild(multiDragElement);
			}
			multiDragIndex++;
			});

			// If initial folding is done, the elements may have changed position because they are now
			// unfolding around dragEl, even though dragEl may not have his index changed, so update event
			// must be fired here as Sortable will not.
			if (oldIndex === index(dragEl$1)) {
			var update = false;
			multiDragElements.forEach(function (multiDragElement) {
				if (multiDragElement.sortableIndex !== index(multiDragElement)) {
				update = true;
				return;
				}
			});
			}
		}

		// Must be done after capturing individual rects (scroll bar)
		toSortable.animateAll();
		}
		multiDragSortable = toSortable;
	}

	// Remove clones if necessary
	if (rootEl === parentEl || putSortable && putSortable.lastPutMode !== 'clone') {
		multiDragClones.forEach(function (clone) {
		clone.parentNode && clone.parentNode.removeChild(clone);
		});
	}
	},
	nullingGlobal: function nullingGlobal() {
	this.isMultiDrag = dragStarted = false;
	multiDragClones.length = 0;
	},
	destroyGlobal: function destroyGlobal() {
	this._deselectMultiDrag();
	off(document, 'pointerup', this._deselectMultiDrag);
	off(document, 'mouseup', this._deselectMultiDrag);
	off(document, 'touchend', this._deselectMultiDrag);
	off(document, 'keydown', this._checkKeyDown);
	off(document, 'keyup', this._checkKeyUp);
	},
	_deselectMultiDrag: function _deselectMultiDrag(evt) {
	if (typeof dragStarted !== "undefined" && dragStarted) return;

	// Only deselect if selection is in this sortable
	if (multiDragSortable !== this.sortable) return;

	// Only deselect if target is not item in this sortable
	if (evt && closest(evt.target, this.sortable.el, false)) return;

	// Only deselect if left click
	if (evt && evt.button !== 0) return;
	while (multiDragElements.length) {
		var el = multiDragElements[0];
		toggleClass(el, this.options.selectedClass, false);
		multiDragElements.shift();
		dispatchEvent({
		sortable: this.sortable,
		rootEl: this.sortable.el,
		name: 'deselect',
		targetEl: el,
		originalEvent: evt
		});
	}
	},
	_checkKeyDown: function _checkKeyDown(evt) {
	if (evt.key === this.options.multiDragKey) {
		this.multiDragKeyDown = true;
	}
	},
	_checkKeyUp: function _checkKeyUp(evt) {
	if (evt.key === this.options.multiDragKey) {
		this.multiDragKeyDown = false;
	}
	}
};
return Object.assign.apply(window, [MultiDrag, {
	// Static methods & properties
	pluginName: 'multiDrag',
	utils: {
	/**
	 * Selects the provided multi-drag item
	 * @param  {HTMLElement} el    The element to be selected
	 */
	select: function select(el) {
		var sortable = el.parentNode[expando];
		if (!sortable || !sortable.options.multiDrag || ~multiDragElements.indexOf(el)) return;
		if (multiDragSortable && multiDragSortable !== sortable) {
		multiDragSortable.multiDrag._deselectMultiDrag();
		multiDragSortable = sortable;
		}
		toggleClass(el, sortable.options.selectedClass, true);
		multiDragElements.push(el);
	},
	/**
	 * Deselects the provided multi-drag item
	 * @param  {HTMLElement} el    The element to be deselected
	 */
	deselect: function deselect(el) {
		var sortable = el.parentNode[expando],
		index = multiDragElements.indexOf(el);
		if (!sortable || !sortable.options.multiDrag || !~index) return;
		toggleClass(el, sortable.options.selectedClass, false);
		multiDragElements.splice(index, 1);
	}
	},
	eventProperties: function eventProperties() {
	var _this3 = this;
	var oldIndicies = [],
		newIndicies = [];
	multiDragElements.forEach(function (multiDragElement) {
		oldIndicies.push({
		multiDragElement: multiDragElement,
		index: multiDragElement.sortableIndex
		});

		// multiDragElements will already be sorted if folding
		var newIndex;
		if (folding && multiDragElement !== dragEl$1) {
		newIndex = -1;
		} else if (folding) {
		newIndex = index(multiDragElement);
		} else {
		newIndex = index(multiDragElement);
		}
		newIndicies.push({
		multiDragElement: multiDragElement,
		index: newIndex
		});
	});
	return {
		items: [],
		clones: [].concat(multiDragClones),
		oldIndicies: oldIndicies,
		newIndicies: newIndicies
	};
	},
	optionListeners: {
	multiDragKey: function multiDragKey(key) {
		key = key.toLowerCase();
		if (key === 'ctrl') {
		key = 'Control';
		} else if (key.length > 1) {
		key = key.charAt(0).toUpperCase() + key.substr(1);
		}
		return key;
	}
	}
}]);
}
function insertMultiDragElements(clonesInserted, rootEl) {
multiDragElements.forEach(function (multiDragElement, i) {
	var target = rootEl.children[multiDragElement.sortableIndex + (clonesInserted ? Number(i) : 0)];
	if (target) {
	rootEl.insertBefore(multiDragElement, target);
	} else {
	rootEl.appendChild(multiDragElement);
	}
});
}

/**
 * Insert multi-drag clones
 * @param  {[Boolean]} elementsInserted  Whether the multi-drag elements are inserted
 * @param  {HTMLElement} rootEl
 */
function insertMultiDragClones(elementsInserted, rootEl) {
multiDragClones.forEach(function (clone, i) {
	var target = rootEl.children[clone.sortableIndex + (elementsInserted ? Number(i) : 0)];
	if (target) {
	rootEl.insertBefore(clone, target);
	} else {
	rootEl.appendChild(clone);
	}
});
}
function removeMultiDragElements() {
multiDragElements.forEach(function (multiDragElement) {
	if (multiDragElement === dragEl$1) return;
	multiDragElement.parentNode && multiDragElement.parentNode.removeChild(multiDragElement);
});
}

Sortable.mount(new AutoScrollPlugin());
Sortable.mount(Remove, Revert);

Sortable.mount(new SwapPlugin());
Sortable.mount(new MultiDragPlugin());

function reorder_indices(parent, oldIndex, newIndex) {
	let startInd = Math.min(newIndex, oldIndex);
	let currentInd, compCheckbox;
	Array.from(parent.children).slice(startInd, Math.max(newIndex, oldIndex)+1).forEach(function (child, relativeIndex) {
		currentInd = startInd + relativeIndex;
		child.firstChild.name = "candidates[" + currentInd + "]";
		compCheckbox = child.lastElementChild.firstChild;
		compCheckbox.name = "comp[" + currentInd + "]";
		compCheckbox.value = "comp_" + currentInd;
	})
}
