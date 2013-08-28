//
// customScrollbars
mcrmade = {};

mcrmade.customScrollbars = function(el, options) {

	if (el) {

		this.init(el, options);
	}
}

$.extend(mcrmade.customScrollbars.prototype, {

	// plugin name
	name: 'mcrmade_customScrollbars',

	defaults: {
		orientation: 'v'
	},

	// initialise the plugin
	init: function(el, options) {

		this.options = $.extend(true, {}, this.defaults, options);

		this.element = $(el);

		if (!this.element.data('name')) {

			this.createScrollElements();

			if (this.options.orientation !== 'h') {

				this.setScrollParameters();

				this.testScroll();

				this.bind();
			}

			$.data(this.element, this.name, this);
			this.element.data('name', this.name);

		}

		if (
			this.options.callback &&
			typeof(this.options.callback) === 'function'
		) {

			this.options.callback.call();
		}

		return this;
	},

	// bind events to this instance's methods
	bind: function() {

		this.element.bind('destroyed', $.proxy(this.teardown, this));

		// no modernizr
		// modernizr but no touch
		//
		// always add mousewheel functionality
		this.child.scroll_area.bind('mousewheel', $.proxy(this.mouseScroll, this));

		//
		// test for touch functionality
		if (
			!Modernizr ||
			(
				Modernizr &&
				$('html').hasClass('no-touch')
			)
		) {

			this.child.scroll_area.bind('touchstart', $.proxy(this.touchStart, this));
			this.child.scroll_area.bind('touchmove', $.proxy(this.touchMove, this));
			this.child.scroll_area.bind('touchend', $.proxy(this.touchEnd, this));
		}

		// this.child.scroll_area.on('mousewheel', $.proxy(this.mouseScroll, this));

		/*
		this.child.scroll_area.on({
			mousewheel: function() {

				// debug.log('mousewheel detected');
				// debug.log(delta, deltaX, deltaY);

				// $.proxy(this.mouseScroll, this, delta, deltaX, deltaY);
				$.proxy(this, this.mouseScroll);
			},
			touchstart: function() {

				debug.log('touchstart detected');

				offsetX = ($(window).width()-el.outerWidth(true))/2;
				startX = e.targetTouches[0].pageX - offsetX;
			},
			touchmove: function() {

				debug.log('touchmove detected');

				var diffX = (e.changedTouches[0].pageX - offsetX) - startX;
				el.css("-webkit-transform", "translate3d("+diffX+"px, 0, 0)");
			},
			touchend: function() {

				debug.log('touchend detected');

				el.css("-webkit-transform", "translate3d(0, 0, 0)");
			}
		});
		*/

		this.child.scroll_handle.draggable({
			axis: 'y',
			containment: 'parent',
			drag: $.proxy(this.dragScroll, this)
		});

		$(window).on('throttledresize', $.proxy(this.reCalc, this));
	},

	// call destroy to teardown whilst leaving the element
	destroy: function() {

		this.element.unbind('destroyed', this.teardown());

		this.teardown();
	},

	// remove plugin functionality
	teardown: function() {

		$.removeData(this.element, this.name);

		this.element.html(this.child.scroll_content.html());

		this.unbind();

		this.element = null;
	},

	unbind: function() {

		$(window).off('throttledresize', $.proxy(this.reCalc, this));
	},

	establishChildren: function() {

		this.child = {
			scroll_area: $('[class^=scroll-area]', this.element),
			scroll_content: $('[class^=scroll-content]', this.element),
			scroll_bar: $('[class^=scroll-bar]', this.element),
			scroll_handle: $('[class^=scroll-handle]', this.element)
		}
	},

	createScrollElements: function() {

		if (this.options.orientation === 'h') {

			this.element.children().wrapAll('<div class="scroll-content-h" />');
			this.element.children().wrapAll('<div class="scroll-area-h" />');

			$('.scroll-content', this.element).after('<div class="scroll-bar-h" />');
			$('.scroll-bar', this.element).append('<div class="scroll-handle-h" />');
		} else {

			this.element.children().wrapAll('<div class="scroll-content" />');
			this.element.children().wrapAll('<div class="scroll-area" />');

			$('.scroll-content', this.element).after('<div class="scroll-bar" />');
			$('.scroll-bar', this.element).append('<div class="scroll-handle" />');
		}

		this.establishChildren();
	},

	setScrollParameters: function() {

		this.scrollParameters = {};

		this.scrollParameters.scroll_content_percentage = this.child.scroll_content.outerHeight(true) / this.child.scroll_area.height();
		this.scrollParameters.scroll_handle_size = this.child.scroll_area.height() * (this.child.scroll_area.height() / this.child.scroll_content.outerHeight(true));
		this.scrollParameters.scroll_handle_max_x = this.child.scroll_bar.width() - this.child.scroll_handle.width();
		this.scrollParameters.scroll_handle_max_y = this.child.scroll_bar.height() - this.scrollParameters.scroll_handle_size;

		if (this.scrollParameters.scroll_content_percentage > 1) {

			var largest = Math.max(this.child.scroll_content.outerHeight(true), this.child.scroll_area.height()),
				smallest = Math.min(this.child.scroll_content.outerHeight(true), this.child.scroll_area.height())

			this.scrollParameters.scroll_content_max_y = Math.abs(largest - smallest) * -1;
		} else {

			this.scrollParameters.scroll_content_max_y = 0;
		}

		this.scrollParameters.scrolled = this.child.scroll_content.position().top / this.scrollParameters.scroll_content_max_y;
	},

	setScrolled: function(element) {

		if (element === 'handle') {

			this.scrollParameters.scrolled = this.child.scroll_handle.position().top / this.scrollParameters.scroll_handle_max_y;
		}

		if (element === 'content') {

			this.scrollParameters.scrolled = this.child.scroll_content.position().top / this.scrollParameters.scroll_content_max_y;
		}
	},

	matchScrolled: function(element) {

		if (element === 'handle') {

			this.child.scroll_handle.css({
				top: this.scrollParameters.scroll_handle_max_y * this.scrollParameters.scrolled
			});
		}

		if (element === 'content') {

			this.child.scroll_content.css({
				top: this.scrollParameters.scroll_content_max_y * this.scrollParameters.scrolled
			});
		}
	},

	renderHandle: function() {

		this.child.scroll_handle.css({
			height: this.scrollParameters.scroll_handle_size
		});
	},

	testScroll: function() {

		if (this.scrollParameters.scroll_content_percentage > 1) {

			if (!this.child.scroll_bar.hasClass('scrollable')) {

				this.child.scroll_bar.addClass('scrollable');

				this.renderHandle();
			}
		} else {

			this.child.scroll_bar.removeClass('scrollable');
		}
	},

	dragScroll: function(e, ui) {

		this.setScrolled('handle');

		this.matchScrolled('content');
	},

	mouseScroll: function(e, delta, deltaX, deltaY) {

		var position = this.child.scroll_content.position().top + deltaY;

		if (
			position >= this.scrollParameters.scroll_content_max_y &&
			position <= 0
		) {

			this.child.scroll_content.css({
				top: position
			});
		}

		this.setScrolled('content');

		this.matchScrolled('handle');
	},

	touchStart: function() {

		event.preventDefault();

		var touch = event.targetTouches[0],
			date = new Date(),
			time = date.getTime(),
			origin = {
				x: touch.screenX,
				y: touch.screenY,
				t: time
			};

		this.child.scroll_content.data('origin', origin);
		this.child.scroll_content.data('last_vector', origin);
	},

	touchMove: function() {

		event.preventDefault();

		var changed = event.changedTouches[0],
			date = new Date(),
			time = date.getTime(),
			last_vector = this.child.scroll_content.data('last_vector'),
			increment = {
				x: changed.screenX - last_vector.x,
				y: changed.screenY - last_vector.y,
				t: time - last_vector.t
			},
			this_vector = {
				x: changed.screenX,
				y: changed.screenY,
				t: time
			};

		this.child.scroll_content.data('last_vector', this_vector);

		var position = this.child.scroll_content.position().top += increment.y;

		if (
			position >= this.scrollParameters.scroll_content_max_y &&
			position <= 0
		) {

			this.child.scroll_content.css({
				top: position
			});
		}

		this.setScrolled('content');
	},

	touchEnd: function() {

		event.preventDefault();

		var changed = event.changedTouches[0],
			date = new Date(),
			time = date.getTime(),
			last_vector = this.child.scroll_content.data('last_vector'),
			increment = {
				x: changed.screenX - last_vector.x,
				y: changed.screenY - last_vector.y,
				t: time - last_vector.t
			},
			speed = increment.y / increment.t;
	},

	reCalc: function() {

		this.setScrollParameters();

		this.testScroll();

		this.renderHandle();

		this.matchScrolled('handle');
	}
});



//
// make plugin
$.pluginMaker(mcrmade.customScrollbars);
