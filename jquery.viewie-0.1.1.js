/**
 * "You analyzed the wrong viewie, all right? The wrong one!"
 *     -Judge Hershey, from the movie Judge Dredd
 * 
 * jQuery Viewie plugin, v.0.1.1
 * written by Akoi Meexx.
 * Copyright (C) 2011 Johnathan McKnight(Akoi Meexx)
 * 
 * This plugin creates a viewport from any container element you specify, 
 * configuring each direct child of that container element to be a 
 * viewport slide.
 * Please review this plugin's code comments for additional 
 * details on how to style a Viewie.
 * 
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Preload the Ubuntu Webfont from www.google.com/webfonts
 */
WebFontConfig = { google: { families: [ 'Ubuntu:700:latin', ], }, };
(function() { var wf = document.createElement('script'); wf.src = ('https:' == document.location.protocol ? 'https' : 'http') + '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js'; wf.type = 'text/javascript'; wf.async = 'true'; var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(wf, s); })();

/**
 * Create our Viewie plugin
 */
(function($){
	/**
	 * Configure defaults for Viewie
	 */
	var defaults = {
		autoCycle: false, 	// automatically cycle through slides, overrides recycleSlides
		autoCycleWaitTime: 5000, 	// duration of autoCycle wait time, in milliseconds
		
		enableKeyboardNavigation: true, 
		enableMouseScrollNavigation: true, 
		
		recycleSlides: true, 
		
		showNavigation: true, 
	};
	
	/**
	 * Define our generated Viewie elements and their style information
	 */
	var generatedElements = {
		metaStyles: { 	// style element structure. since css pseudo-elements are not accessible from the DOM (and therefore, javascript), we just store relevant css information for each generated elements pseudo-elements here.
			viewie: [
				"::-webkit-scrollbar { height: 8px; width: 8px; }", 
				"::-webkit-scrollbar-track { background-color: rgba(0, 0, 0, 0.15); border-radius: 4px; margin: 16px; }", 
				"::-webkit-scrollbar-track:hover { background-color: rgba(0, 0, 0, 0.20); }", 
				"::-webkit-scrollbar-thumb { background-color: rgba(0, 0, 0, 0.20); border-radius: 4px; }", 
				"::-webkit-scrollbar-thumb:hover { background-color: rgba(0, 0, 0, 0.30); }", 
				"::-webkit-scrollbar-corner { background-color: transparent; }", 
				"{ scrollbar-face-color: rgba(0, 0, 0, 0.20); scrollbar-arrow-color: transparent; scrollbar-track-color: rgba(0, 0, 0, 0.15); scrollbar-shadow-color: transparent; scrollbar-highlight-color: transparent; scrollbar-3dlight-color: transparent; scrollbar-darkshadow-Color: transparent; }", 
			], 
		}, 
		navigation: { 	// navigation element structure
			className: "jquery-viewie-nav-button", 	// base navigation button className
			html: '<a></a>', 	// html wrapper of navigation button element
			next: {
				animation: {
					duration: 500, 	// duration of animation in milliseconds
					direction: { 	// direction of animation for slide elements
						hide: "left", 
						show: "right", 
					}, 
					type: "slide", 	// style of animation for show()/hide()
				}, 
				className: "next", 
				content: "&rsaquo;", 	// indicator for next navigation button 
				position: { 	// position of next navigation button position
					right: "4px", 
					top: "50%", 
				}, 
			}, 
			previous: {
				animation: {
					duration: 500, 	// duration of animation in milliseconds
					direction: { 	// direction of animation for slide elements
						hide: "right", 
						show: "left", 
					}, 
					type: "slide", 	// style of animation for show()/hide()
				}, 
				className: "previous", 
				content: "&lsaquo;", 	// indicator for previous navigation button
				position: { 	// position of previous navigation button position
					left: "4px", 
					top: "50%", 
				}, 
			}, 
			style: { 	// CSS information for next/previous navigation buttons
				backgroundColor: "rgba(255, 255, 255, 0.4)", 
				borderRadius: "50%", 
				color: "rgba(0, 0, 0, 0.6)", 
				cursor: "pointer", 
				display: "block", 
				height: "8px", 
				hoverColor: "rgba(255, 255, 255, 0.8)", 
				fontFamily: "Ubuntu", 
				fontSize: "32px", 
				fontWeight: "bold", 
				lineHeight: "0.0em", 
				margin: "0px", 
				overflow: "hidden", 
				padding: "10px 7px 8px", 
				position: "absolute", 
				textDecoration: "none", 
				width: "10px", 
				zIndex: "9999", 
			}, 
		}, 
		slide: { 	// slide element structure
			className: "jquery-viewie-slide", 	// slide element className
			html: '<div></div>', 	// html wrapper of slide element
			style: { 	// CSS information for slide elements
				height: "100%", 
				margin: "0px 32px", 
				overflow: "auto", 
				padding: "0px", 
				textAlign: "center", 
			}, 
		}, 
		viewie: { 	// viewie element structure
			className: "jquery-viewie", 	// viewie element className
			style: { 	// CSS information for viewie; abs. minimum requirements to make a Viewie instance. Tweak at own risk.
				backgroundColor: "#404040", 
				display: "block", 
				overflow: "hidden", 
				position: "relative", 
				textAlign: "center", 
			}, 
		}, 
	};
	
	/**
	 * Create a Viewie out of the selected element(s)
	 */
	$.fn.viewie = function(options) {
		/**
		 * Internal functions for Viewie
		 */
		// Animate the navigation action
		function animateNavigation(oldElement, newElement, animationDetails) {
			// Perform the animations according to the animation details
			oldElement.hide(animationDetails.type, { direction: animationDetails.direction.hide }, animationDetails.duration);
			newElement.delay(animationDetails.duration).show(animationDetails.type, { direction: animationDetails.direction.show }, animationDetails.duration);
		}
		// Apply className/css to elements
		function applyStyleIdentifiers(element, className, styles) {
			element.addClass(className);
			element.css(styles);
		}
		// Generate pseudo-element style information
		function metaStyles() {
			var styleElement = function() {
				var styleString = "<style type=\"text/css\">";
				for(item in generatedElements.metaStyles.viewie) {
					styleString += "\r\n." + generatedElements.viewie.className + " " + generatedElements.metaStyles.viewie[item];
				}
				styleString += "\r\n</style>";
				return styleString;
			};
			$(document.head).prepend(styleElement);
		}
		// Adjust margins/padding to align slide content vertically center
		function valignContent(element) {
			element.children().each(function(){
				var content = $(this);
				if(content.innerHeight() < element.innerHeight() && content.innerHeight() != 0) {
					content.css("margin-top", ((element.innerHeight() / 2) - (content.innerHeight() / 2)) + "px");
				}
			});
		}
		
		/**
		 * Apply our non-DOM meta styles to our Viewie class
		 */
		metaStyles();
		
		/**
		 * Extend our defaults with passed-in options and reassign the  
		 * result to options
		 */
		var options = $.extend(defaults, options);
		
		/**
		 * Iterate over each element targeted and create its Viewie 
		 * instance
		 */
		return this.each(function() {
			// Assign the current element to a variable for code readability
			var viewieInstance = $(this);
			// Get viewie instance backgroundColor css, if any. If it's already set, change generatedElements.viewie.style.backgroundColor to match it
			if(viewieInstance.css("backgroundColor") != "rgba(0, 0, 0, 0)" && viewieInstance.css("backgroundColor") != "transparent") {
				generatedElements.viewie.style.backgroundColor = viewieInstance.css("backgroundColor");
			}
			// Assign our instance className, then style with our bare-minimum amount of css to make Viewie work
			applyStyleIdentifiers(viewieInstance, generatedElements.viewie.className, generatedElements.viewie.style);
			
			/**
			 * Create our slide elements
			 */
			viewieInstance.children().each(function() {
				// Assign the current child element of viewieInstance to a variable for code readability
				var viewieChild = $(this);
				// Wrap the child in our slide wrapper
				viewieChild.wrap(generatedElements.slide.html);
			});
			viewieInstance.children().each(function() {
				// Assign the current slide of viewieInstance to a variable for code readability
				var viewieSlide = $(this);
				// Assign our slide className and style, adjust our content vertically, then hide the slide
				applyStyleIdentifiers(viewieSlide, generatedElements.slide.className, generatedElements.slide.style);
				valignContent(viewieSlide);
				viewieSlide.hide();
			});
			// Show our first slide by default
			viewieInstance.children("." + generatedElements.slide.className + ":first-child").show();
			
			/**
			 * Create our navigation elements
			 */
			viewieInstance.prepend(generatedElements.navigation.html);
			viewieInstance.append(generatedElements.navigation.html);
			viewieInstance.children("a").each(function() {
				// Assign the current navigation button of viewieInstance to a variable for code readability
				var viewieNavigationButton = $(this);
				// Assign our navigation button className and style, add hover effects
				applyStyleIdentifiers(viewieNavigationButton, generatedElements.navigation.className, generatedElements.navigation.style);
				viewieNavigationButton.hover(
					function(){
						$(this).css('backgroundColor', generatedElements.navigation.style.hoverColor);	// Change to hover color
					}, 
					function(){
						$(this).css('backgroundColor', generatedElements.navigation.style.backgroundColor);	// Change to background color
					}
				);
			});
			
			// Assign the individual navigation buttons of viewieInstance to variables for code readability
			var viewieNavigationNext = viewieInstance.children("a." + generatedElements.navigation.className + ":last-child");
			var viewieNavigationPrevious = viewieInstance.children("a." + generatedElements.navigation.className + ":first-child");
			// Assign individual navigation content to next/previous buttons
			viewieNavigationNext.html(generatedElements.navigation.next.content);
			viewieNavigationPrevious.html(generatedElements.navigation.previous.content);
			// Assign individual navigation classes and styles to next/previous buttons
			applyStyleIdentifiers(viewieNavigationNext, generatedElements.navigation.next.className, generatedElements.navigation.next.position);
			applyStyleIdentifiers(viewieNavigationPrevious, generatedElements.navigation.previous.className, generatedElements.navigation.previous.position);
			// Offset individual navigation buttons vertically to center them
			viewieInstance.children("a." + generatedElements.navigation.className).each(function() {
				var viewieNavigationButton = $(this);
				viewieNavigationButton.css("top", (viewieNavigationButton.position().top - (viewieNavigationButton.innerHeight() / 2)));
			});
			
			// Assign next/previous navigation button clicks
			viewieNavigationNext.click(function() {
				viewieInstance.next();
			});
			viewieNavigationPrevious.click(function() {
				viewieInstance.previous();
			});
			
			/**
			 * VIEWIE ELEMENT PUBLIC FUNCTIONS
			 */
			
			/**
			 * Create our next() navigation function
			 * usage: $('VIEWIE_SELECTOR').next();
			 */
			viewieInstance.next = function() {
				// Iterate over each child, calculate which one is visible, and animate the navigation
				viewieInstance.children("." + generatedElements.slide.className).each(function() {
					// Assign the current slide of viewieInstance to a variable for code readability
					var viewieSlide = $(this);
					if(viewieSlide.is(":visible")) {
						var oldSlide = viewieSlide;
						if(viewieSlide.is(":nth-child(" + (viewieInstance.children().length - 1) + ")")) {
							if(options.recycleSlides == false && options.autoCycle == false) { return null; }
							var newSlide = viewieInstance.children("." + generatedElements.slide.className + ":nth-child(2)");
						} else if(viewieSlide.not(":nth-child(" + (viewieInstance.children().length - 1) + ")") && viewieSlide.is(":visible")) {
							var newSlide = viewieSlide.next();
						}
						// Make sure all slides are hidden...
						viewieInstance.children("." + generatedElements.slide.className).hide();
						// Perform the animation
						animateNavigation(oldSlide, newSlide, generatedElements.navigation.next.animation);
					}
				});
			};
			/**
			 * Create our previous() navigation function
			 * usage: $('VIEWIE_SELECTOR').viewie.previous();
			 */
			viewieInstance.previous = function() {
				// Iterate over each child, calculate which one is visible, and animate the navigation
				viewieInstance.children("." + generatedElements.slide.className).each(function() {
					// Assign the current slide of viewieInstance to a variable for code readability
					var viewieSlide = $(this);
					if(viewieSlide.is(":visible")) {
						var oldSlide = viewieSlide;
						if(viewieSlide.is(":nth-child(2)")) {
							if(options.recycleSlides == false && options.autoCycle == false) { return null; }
							var newSlide = viewieInstance.children(":nth-child(" + (viewieInstance.children().length - 1) + ")");
						} else if(viewieSlide.not(":nth-child(2)") && viewieSlide.is(":visible")) {
							var newSlide = viewieSlide.prev();
						}
						// Make sure all slides are hidden...
						viewieInstance.children("." + generatedElements.slide.className).hide();
						// Perform the animation
						animateNavigation(oldSlide, newSlide, generatedElements.navigation.previous.animation);
					}
				});
			};
			
			viewieInstance.hideNavigation = function() {
				viewieInstance.children("a." + generatedElements.navigation.className).hide();
			}
			viewieInstance.showNavigation = function() {
				viewieInstance.children("a." + generatedElements.navigation.className).show();
			}
			viewieInstance.timerLoop = function(duration, repeat) {
				viewieInstance.Timer = setTimeout(function() {
					viewieInstance.next();
					if(repeat){
						viewieInstance.timerLoop(duration, repeat);
					}
				}, duration);
				return repeat;
			}
			
			
			/**
			 * Apply our configured Viewie options
			 */
			// Set up autoCycling timer
			if(options.autoCycle){
				options.autoCycle = viewieInstance.timerLoop(options.autoCycleWaitTime, options.autoCycle);
			}
			// Hide navigation buttons
			if(!options.showNavigation){
				viewieInstance.hideNavigation();
			}
			// Set up keyboard navigation
			if(options.enableKeyboardNavigation) {
				$(document).bind('keydown.fb', function(event) {
					if((event.keyCode == 37  || event.keyCode == 39) && event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA' && event.target.tagName !== 'SELECT') {
						event.preventDefault();
						if(event.keyCode == 37) {
							viewieInstance.previous();
						} else {
							viewieInstance.next();
						}
					}
				});
			}
			// Set up mousewheel support if the plugin is available
			if($.fn.mousewheel && options.enableMouseScrollNavigation) {
				//Configure mousewheel event
				viewieInstance.mousewheel(function(event, delta) {
					// Grab the slide we're navigating from
					var currentSlide = $("." + generatedElements.slide.className + ":visible");
					// Calculate maximum scroll distances, taking into account meta styles
					currentSlide.scrollMaxX = function() {
						return ($(this)[0].scrollWidth) - $(this)[0].clientWidth;
					}
					currentSlide.scrollMaxY = function() {
						return ($(this)[0].scrollHeight) - $(this)[0].clientHeight;
					}
					// Interactively work regardless of whether or not we know there's overflow: 4th Circle of Hell 
					if(
					(delta > 0) && 
					(currentSlide.scrollTop() == 0) && 
					(currentSlide.scrollLeft() == 0)) {
						// If we're at position 0, 0 on the slide scroll area, go to previous slide
						event.preventDefault();
						viewieInstance.previous();
					} else if(
					(delta > 0) && 
					(currentSlide.scrollTop() == 0) && 
					(currentSlide.scrollLeft() > 0)) {
						// If we can still scroll horizontally but no more vertically, scroll left horizontally until we're at 0
						currentSlide.scrollLeft(currentSlide.scrollLeft() - 42);
					} else if(
					(delta <= 0) && 
					(currentSlide.scrollTop() >= currentSlide.scrollMaxY()) && 
					(currentSlide.scrollLeft() >= currentSlide.scrollMaxX())) {
						// If we're at max position on the slide scroll area, go to next slide
						event.preventDefault();
						viewieInstance.next();
					} else if(
					(delta <= 0) && 
					(currentSlide.scrollTop() >= currentSlide.scrollMaxY()) && 
					(currentSlide.scrollLeft() < currentSlide.scrollMaxX())) {
						// If we can still scroll horizontally but no more vertically, scroll right horizontally until we're maxed out
						currentSlide.scrollLeft(currentSlide.scrollLeft() + 42);
					}
				});
			}
		});
	};
})(jQuery);
