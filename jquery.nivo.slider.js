/*
 * jQuery Nivo Slider v3.0
 * http://nivo.dev7studios.com
 *
 * Copyright 2010, Gilbert Pellegrom
 * Free to use and abuse under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * June 2010 by valZho
 *		options value case insensitivity, order insensitivity (using regex)
 *		completely rewritten animation algorithm supports:
 *		-- slice animation styles: right(default), left, in, out, mix (per controller)
 *		-- ability to set specific animation slice order (per controller)
 *		-- set animation slice delay time (per controller)
 *		-- support for ease (per controller)
 *		-- background fade out with custom timing (per controller)
 * May 2010 - Pick random effect from specified set of effects by toronegro
 * May 2010 - controlNavThumbsFromRel option added by nerd-sh
 * May 2010 - Do not start nivoRun timer if there is only 1 slide by msielski
 * April 2010 - controlNavThumbs option added by Jamie Thompson (http://jamiethompson.co.uk)
 * March 2010 - manualAdvance option added by HelloPablo (http://hellopablo.co.uk)
 */

(function($) {

	$.fn.nivoSlider = function(options) {
		
		//Defaults are below
		var settings = $.extend({}, $.fn.nivoSlider.defaults, options);
		var timer = '';

		// allow "effect" to override all other effect settings
		if ( options.effect !== undefined ) {
			settings.autoEffect = options.effect;
			settings.prevEffect = options.effect;
			settings.nextEffect = options.effect;
			settings.controlEffect = options.effect;
		}
		
		// allow "animSpeed" to override all other speed settings
		if ( options.animSpeed !== undefined ) {
			settings.autoSpeed = options.animSpeed;
			settings.prevSpeed = options.animSpeed;
			settings.nextSpeed = options.animSpeed;
			settings.controlSpeed = options.animSpeed;
		}
		
		// allow "outSpeed" to override all other out settings
		if ( options.outSpeed !== undefined ) {
			settings.autoOut = options.outSpeed;
			settings.prevOut = options.outSpeed;
			settings.nextOut = options.outSpeed;
			settings.controlOut = options.outSpeed;
		}
		
		// allow "ease" to override all other ease settings
		if ( options.ease !== undefined ) {
			settings.autoEase = options.ease;
			settings.prevEase = options.ease;
			settings.nextEase = options.ease;
			settings.controlEase = options.ease;
		}
		
		// allow "buffer" to override all other buffer settings
		if ( options.buffer !== undefined ) {
			settings.autoBuffer = options.buffer;
			settings.prevBuffer = options.buffer;
			settings.nextBuffer = options.buffer;
			settings.controlBuffer = options.buffer;
		}
				
		// allow "order" to override all other order settings
		if ( options.order !== undefined ) {
			settings.autoOrder = options.order;
			settings.prevOrder = options.order;
			settings.nextOrder = options.order;
			settings.controlOrder = options.order;
		}
				
		return this.each(function() {
			//Useful variables. Play carefully.
			var vars = {
				prevSlide: 0,
				currentSlide: 0,
				currentImage: '',
				totalSlides: 0,
				randAnim: '',
				running: false,
				paused: false,
				stop:false
			};
			
			// get this slider
			var slider = $(this);
			slider.data('nivo:vars', vars);
			slider.css('position','relative');
			slider.addClass('nivoSlider');
			
			// find our slider children
			var kids = slider.children();
			kids.each(function() {
				var child = $(this);
				var link = '';
				if(!child.is('img')){
					if(child.is('a')){
						child.addClass('nivo-imageLink');
						link = child;
					}
					child = child.find('img:first');
				}
				//Get img width & height
				var childWidth = child.width();
				if(childWidth == 0) childWidth = child.attr('width');
				var childHeight = child.height();
				if(childHeight == 0) childHeight = child.attr('height');
				//Resize the slider
				if(childWidth > slider.width()){
					slider.width(childWidth);
				}
				if(childHeight > slider.height()){
					slider.height(childHeight);
				}
				if(link != ''){
					link.css('display','none');
				}
				child.css('display','none');
				vars.totalSlides++;
			});
			
			// set startSlide
			if(settings.startSlide > 0){
				if(settings.startSlide >= vars.totalSlides) settings.startSlide = vars.totalSlides - 1;
				vars.currentSlide = settings.startSlide;
				vars.prevSlide = vars.currentSlide;
			}
			
			// get and show initial image (and link)
			$(kids[vars.currentSlide]).css({display: 'block', opacity: '1.0'});
			if($(kids[vars.currentSlide]).is('img')){
				vars.currentImage = $(kids[vars.currentSlide]);
			} else {
				$(kids[vars.currentSlide]).find('img:first').css({display: 'block', opacity:'1.0'});
				vars.currentImage = $(kids[vars.currentSlide]).find('img:first');
			}
			
			
			// add our slices, and initialize order arrays
			for(var i=0; i<settings.slices; i++){
				var sliceWidth = Math.round(slider.width()/settings.slices);
				// final slice might be narrower than the others
				if(i == settings.slices-1){
					slider.append( 	$('<div class="nivo-slice"></div>').css({ left:(sliceWidth*i)+'px', width:(slider.width()-(sliceWidth*i))+'px' }) );
				} else {
					slider.append( $('<div class="nivo-slice"></div>').css({ left:(sliceWidth*i)+'px', width:sliceWidth+'px' }) );
				}
				// ensure that order arrays contain enough elements, add elements if necessary
				if (settings.autoOrder.length < i+1) settings.autoOrder[i] = i;
				if (settings.prevOrder.length < i+1) settings.prevOrder[i] = i;
				if (settings.nextOrder.length < i+1) settings.nextOrder[i] = i;
				if (settings.controlOrder.length < i+1) settings.controlOrder[i] = i;
			}
			
			// create captions
			slider.append(	$('<div class="nivo-caption"><p></p></div>').css({ display:'none', opacity:settings.captionOpacity }) );			
			// process initial  caption
			if(vars.currentImage.attr('title') != ''){
				$('.nivo-caption p', slider).html(vars.currentImage.attr('title'));					
				$('.nivo-caption', slider).fadeIn(settings.animSpeed);
			}
			
			
			// ************************************************
			// set initial timer ... in the words of Super Mario "let's a go!"
			if(!settings.manualAdvance && kids.length > 1){
				timer = setInterval(function(){ nivoRun(slider, kids, settings, false); }, settings.pauseTime);
			}
			// ************************************************
			
			
			// ======================================
			// GOTO FUNCTION FOR ALL CONTROLS
			// ======================================
			function goToSlide (target, control) {
				if(vars.running || vars.currentSlide == target) return false;
				vars.currentSlide = target-1;
				nivoRun(slider, kids, settings, control);
			};
			// ======================================
			
			
			// ADD DIRECTION NAV
			if(settings.directionNav){
				slider.append('<div class="nivo-directionNav"><a class="nivo-prevNav">Prev</a><a class="nivo-nextNav">Next</a></div>');
				//Hide Direction nav
				if(settings.directionNavHide){
					$('.nivo-directionNav', slider).hide();
					slider.hover(function(){
						$('.nivo-directionNav', slider).show();
					}, function(){
						$('.nivo-directionNav', slider).hide();
					});
				}
				// prev button function
				$('a.nivo-prevNav', slider).live('click', function(){ goToSlide(vars.currentSlide-1, 'prev') });
				// next button function
				$('a.nivo-nextNav', slider).live('click', function(){ goToSlide(vars.currentSlide+1, 'next') });
			}
			
			
			// KEYBOARD NAVIGATION
			if(settings.keyboardNav){
				$(window).keypress(function(event){
					// left (prev)
					if(event.keyCode == '37'){ goToSlide(vars.currentSlide-1, 'prev'); }
					// right (next)
					if(event.keyCode == '39'){ goToSlide(vars.currentSlide+1, 'next'); }
				});
			}
			
			
			// ADD CONTROL NAV
			if(settings.controlNav){
				var nivoControl = $('<div class="nivo-controlNav"></div>');
				slider.append(nivoControl);
				for(var i=0; i<kids.length; i++){
					if(settings.controlNavThumbs){
						var child = kids.eq(i);
						if(!child.is('img')){
							child = child.find('img:first');
						}
                        if (settings.controlNavThumbsFromRel) {
                            nivoControl.append('<a class="nivo-control" rel="'+ i +'"><img src="'+ child.attr('rel') + '" alt="" /></a>');
                        } else {
                            nivoControl.append('<a class="nivo-control" rel="'+ i +'"><img src="'+ child.attr('src').replace(settings.controlNavThumbsSearch, settings.controlNavThumbsReplace) +'" alt="" /></a>');
                        }
					} else {
						nivoControl.append('<a class="nivo-control" rel="'+ i +'">'+ i +'</a>');
					}
				}
				// set initial active link
				$('.nivo-controlNav a:eq('+ vars.currentSlide +')', slider).addClass('active');
				// control button function
				$('.nivo-controlNav a', slider).live('click', function(){ goToSlide( $(this).attr('rel'), 'control') });
			}
			
			
			// PAUSE ON HOVER
			if(settings.pauseOnHover){
				slider.hover(function(){
					vars.paused = true;
					clearInterval(timer);
					timer = '';
				}, function(){
					vars.paused = false;
					//Restart the timer
					if(timer == '' && !vars.running && !settings.manualAdvance){
						timer = setInterval(function(){ nivoRun(slider, kids, settings, false); }, settings.pauseTime);
					}
				});
			}
			

			// ======================================
			// ANIMATION COMPLETE FUNCTION
			// ======================================
			slider.bind('nivo:animFinished', function(){ 
				
				// Hide all links
				$(kids).each(function(){
					if($(this).is('a')){
						$(this).css('display','none');
					}
				});
				
				// Show current link
				if($(kids[vars.currentSlide]).is('a')){
					$(kids[vars.currentSlide]).css({ display:'block', opacity: '1.0' });
				}
				
				// free up controls
				vars.running = false;
				
				// initialize prevSlide for next animation
				vars.prevSlide = vars.currentSlide;
				
				// Restart the timer
				if(timer == '' && !vars.paused && !settings.manualAdvance){
					timer = setInterval(function(){ nivoRun(slider, kids, settings, false); }, settings.pauseTime );
				}
				
				// Trigger the afterChange callback
				settings.afterChange.call(this);
				
				
			});
			// ======================================
			
			
		});
		

		// ============================================================
		// MAIN FUNCTION
		// ============================================================


		function nivoRun(slider, kids, settings, nudge){
			
			// Get our vars
			var vars = slider.data('nivo:vars');
			if(vars.running || ((!vars || vars.stop) && !nudge)) return false;
			
			// clear the timer
			clearInterval(timer);
			timer = '';
						
			// select the effect, and animation speed, out speed, and easing for the current control
			var effect = settings.autoEffect;
			var animSpeed = settings.autoSpeed;
			var outSpeed = settings.autoOut;
			var ease = settings.autoEase;
			var buffer = settings.autoBuffer;
			var order = settings.autoOrder;
			
			switch (nudge) {
				case 'prev' :
					effect = settings.prevEffect;
					animSpeed = settings.prevSpeed;
					outSpeed = settings.prevOut;
					ease = settings.prevEase;
					buffer = settings.prevBuffer;
					order = settings.prevOrder;
					break;
				case 'next' :
					effect = settings.nextEffect;
					animSpeed = settings.nextSpeed;
					outSpeed = settings.nextOut;
					ease = settings.nextEase;
					buffer = settings.nextBuffer;
					order = settings.nextOrder;
					break;
				case 'control' :
					effect = settings.controlEffect;
					animSpeed = settings.controlSpeed;
					outSpeed = settings.controlOut;
					ease = settings.controlEase;
					buffer = settings.nextBuffer;
					order = settings.controlOrder;
					break;		
			}
						
			
			// Trigger the beforeChange callback
			settings.beforeChange.call(this);


			// ******* SET PRIOR IMAGE BEFORE CHANGE *******
			
			// hide all children (links and images)
			$(kids).each(function(){
				var kid = $(this);
				kid.css({display: 'none', opacity:'0'});
				if(kid.is('a')){
					kid.find('img:first').css({display: 'none', opacity:'0'});
				}
			});
			
			// show just the current slide
			if (outSpeed === 'none') {
				// if we want the background to be persistent, we have to load it into the main div (behind slices)
				slider.css('background','url('+ vars.currentImage.attr('src') +') no-repeat');
							
			} else {
				
				// make sure the main div background is empty 
				slider.css('background','');
				
				// show the appropriate image ... the containing anchor has to be shown, too
				$(kids[vars.prevSlide]).css({display:'block', opacity:'1.0'});
				if($(kids[vars.prevSlide]).is('a')){
					$(kids[vars.prevSlide]).find('img:first').css({display:'block', opacity:'1.0'});
				}
			}
			
			// advance the current slide reference
			vars.currentSlide++;
			if(vars.currentSlide == vars.totalSlides){ 
				vars.currentSlide = 0;
				// if it's the last slide, trigger the slideshowEnd callback
				settings.slideshowEnd.call(this);
			}
			else if(vars.currentSlide < 0) {
				vars.currentSlide = (vars.totalSlides - 1);
			}
			
			// save the reference to the new current image
			if($(kids[vars.currentSlide]).is('img')){
				vars.currentImage = $(kids[vars.currentSlide]);
			} else {
				vars.currentImage = $(kids[vars.currentSlide]).find('img:first');
			}
			
			// set active links on control nav
			if(settings.controlNav){
				$('.nivo-controlNav a', slider).removeClass('active');
				$('.nivo-controlNav a:eq('+ vars.currentSlide +')', slider).addClass('active');
			}
			
			// process the caption
			if(vars.currentImage.attr('title') != ''){
				if($('.nivo-caption', slider).css('display') == 'block'){
					$('.nivo-caption p', slider).fadeOut(animSpeed, function(){
						$(this).html(vars.currentImage.attr('title'));
						$(this).fadeIn(animSpeed);
					});
				} else {
					$('.nivo-caption p', slider).html(vars.currentImage.attr('title'));
				}					
				$('.nivo-caption', slider).fadeIn(animSpeed);
			} else {
				$('.nivo-caption', slider).fadeOut(animSpeed);
			}
			
			// set new slice backgrounds
			var  i = 0;
			$('.nivo-slice', slider).each(function(){
				var sliceWidth = Math.round(slider.width()/settings.slices);
				$(this).css({ height:'0', opacity:'0', 
					background: 'url('+ vars.currentImage.attr('src') +') no-repeat -'+ ((sliceWidth + (i * sliceWidth)) - sliceWidth) +'px 0%' });
				i++;
			});
			
			// if set to random, select a random effect
			if(effect == 'random'){
				var anims = new Array('down', 'downLeft', 'downIn', 'downOut', 'downMix',
					'up', 'upLeft', 'upIn', 'upOut', 'upMix',
					'upDown', 'upDownLeft', 'upDownIn', 'upDownOut', 'upDownMix',
					'fold', 'foldLeft', 'foldIn', 'foldOut', 'foldMix',
					'fade');
				vars.randAnim = anims[Math.floor(Math.random()*(anims.length + 1))];
				if(vars.randAnim == undefined) vars.randAnim = 'fade';
			}
            
			// select a random effect from a specified list
            if(effect.indexOf(',') != -1){
                var anims = effect.split(',');
                vars.randAnim = $.trim(anims[Math.floor(Math.random()*anims.length)]);
            }
            
            
// ======= ANIMATION ENGINE 3.0 !!!

			// initialize variables for effects run
			vars.running = true;
			var slices = $('.nivo-slice', slider);
			var animType = 'fade';
			var matchSpeed = 0; 
			var c = 0; // loop counter
			var topCSS = '0';
			var bottomCSS = '';
			var animVars = {
				style: { opacity: '1.0' },
				speed: animSpeed,
				ease: ease
			}
			
			// use regex to select animation type (case insensitive)
			if ( effect.match(/updown/i) || vars.randAnim.match(/updown/i) ){
				animType = 'updown';
				$.extend(animVars.style, {height:'100%'});
				var alt = 0;
			
			} else if ( effect.match(/down/i) || vars.randAnim.match(/down/i) ){
				animType = 'down';
				$.extend(animVars.style, {height:'100%'});
			
			} else if ( effect.match(/up/i) || vars.randAnim.match(/up/i) ){
				animType = 'up';
				$.extend(animVars.style, {height:'100%'});
				topCSS = '';
				bottomCSS = '0';
			
			} else if ( effect.match(/fold/i) || vars.randAnim.match(/fold/i) ){
				animType = 'fold';
							
			} else if ( effect.match(/fade/i) || vars.randAnim.match(/fade/i) ){
				animType = 'fade';
				animVars.speed = animSpeed*2;
				buffer = 0;
			}
			
			// left animation reorder
			if(effect.match(/left/i) || vars.randAnim.match(/left/i)){
				order.reverse();			
			}
			
			// mix animation reorder
			if(effect.match(/mix/i) || vars.randAnim.match(/mix/i)){
				order.sort( function(){return (Math.round(Math.random())-0.5);} );
			}
			
			// inward animation reorder
			else if(effect.match(/in/i) || vars.randAnim.match(/in/i)){
				var temp = [];
				for (i=0, n=1; i<settings.slices; i++) {
					temp[i] = n;
					if ((i+1)<(settings.slices/2)) { n++; }
					else if ((i+1)>(settings.slices/2)) { n--; }					
				}
				order = temp;
			}
			
			// outward animation reorder
			else if(effect.match(/out/i) || vars.randAnim.match(/out/i)){
				var temp = [];
				for (i=0, n=Math.ceil(settings.slices/2); i<settings.slices; i++) {
					temp[i] = n;
					if ((i+1)<(settings.slices/2)) { n--; }
					else if ((i+1)>(settings.slices/2)) { n++; }					
				}
				order = temp;
			}
			
			//alert(order.toString() );
			
			// FOREGROUND ANIMATION ... parse through slices
			slices.each(function(){
				var slice = $(this);
				var myDelay = 0;
				var foldFix = {}; // needed to properly set width on slices where final slice is a different size than others
				
				// flip values for alternating animations (UpDown)
				if (animType=='updown') {
					if (alt) {
						topCSS='0';
						bottomCSS='';
						alt=0;
					} else {
						topCSS='';
						bottomCSS='0';
						alt=1;
					}
				}
				
				switch (animType) {
					case 'updown' :
					case 'down' :
					case 'up' :
						slice.css({ bottom: bottomCSS, top: topCSS });
						break;
					
					case 'fold' :
						foldFix = { width: slice.width() };
						slice.css({ height: '100%', width: '0' });
						break;
						
					case 'fade' :
						slice.css({ height: '100%' });
						break;
				}
				
				// set slice order delays
				myDelay = buffer * order[c];
				
				// set match speed multiplier for out animation
				matchSpeed = matchSpeed < order[c] ? order[c] : matchSpeed;
				
				// ANIMATE EACH SLICE !!!
				setTimeout( function(){ slice.animate($.extend(animVars.style, foldFix), animVars.speed, animVars.ease); }, myDelay );
				
				// increment counter
				c++;
				
			});
			
			
			
			// BACKGROUND ANIMATION ... fade out background image
			// only animate background if necessary / selected
			matchSpeed = animSpeed + (buffer * matchSpeed);
			if (outSpeed !== 'none') {
				if (outSpeed==='match') outSpeed = matchSpeed;
				if (outSpeed < 0 ) outSpeed = 0;
				if ( $(kids[vars.prevSlide]).is('img') ){
					$(kids[vars.prevSlide]).animate({ opacity:'0' }, outSpeed, ease );
				} else {
					$(kids[vars.prevSlide]).find('img:first').animate({ opacity:'0' }, outSpeed, ease);
				}
			} else { vars.backFlag = true; }
			
			
			// ANIMATION CLEAN-UP TIMER
			if (matchSpeed < outSpeed) matchSpeed = outSpeed;
			setTimeout ( function(){	slider.trigger('nivo:animFinished'); }, matchSpeed );
			
		};
	};


// ============================================================
// ============================================================

	
// ======= Default settings
	$.fn.nivoSlider.defaults = {
		autoEffect:'random',
		prevEffect:'random',
		nextEffect:'random',
		controlEffect:'random',
		
		autoSpeed:500,
		prevSpeed:500,
		nextSpeed:500,
		controlSpeed:500,
		
		autoOut: 'none',
		prevOut: 'none',
		nextOut: 'none',
		controlOut: 'none',
		
		autoEase: 'linear',
		prevEase: 'linear',
		nextEase: 'linear',
		controlEase: 'linear',
		
		autoBuffer:50,
		prevBuffer:50,
		nextBuffer:50,
		controlBuffer:50,
		
		autoOrder: [],
		prevOrder: [],
		nextOrder: [],
		controlOrder: [],
		
		slices:15,
		pauseTime:3000,
		startSlide:0,
		
		directionNav:true,
		directionNavHide:true,
		
		controlNav:true,
		controlNavThumbs:false,
        controlNavThumbsFromRel:false,
		controlNavThumbsSearch:'.jpg',
		controlNavThumbsReplace:'_thumb.jpg',
		
		keyboardNav:true,
		
		pauseOnHover:true,
		manualAdvance:false,
		
		captionOpacity:0.8,
		
		beforeChange: function(){},
		afterChange: function(){},
		slideshowEnd: function(){}
	};
		
})(jQuery);