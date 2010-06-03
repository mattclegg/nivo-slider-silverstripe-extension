/*
 * jQuery Nivo Slider v2.1
 * http://nivo.dev7studios.com
 *
 * Copyright 2010, Gilbert Pellegrom
 * Free to use and abuse under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * June 2010 - background fade out with independent controller settings, by valZho
 * June 2010 - independent animation settings per controller, by valZho 
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

		// allow "effect" to override all other effect settings
		if ( options.effect !== undefined ) {
			settings.autoEffect = options.effect;
			settings.prevEffect =options.effect;
			settings.nextEffect =options.effect;
			settings.controlEffect =options.effect;
		}
		
		// allow "animSpeed" to override all other effect settings
		if ( options.animSpeed !== undefined ) {
			settings.autoSpeed = options.animSpeed;
			settings.prevSpeed =options.animSpeed;
			settings.nextSpeed =options.animSpeed;
			settings.controlSpeed =options.animSpeed;
		}
		
		// allow "outSpeed" to override all other effect settings
		if ( options.outSpeed !== undefined ) {
			settings.autoOut = options.outSpeed;
			settings.prevOut =options.outSpeed;
			settings.nextOut =options.outSpeed;
			settings.controlOut =options.outSpeed;
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
				stop:false,
				foreFlag:true,
				backFlag:false
			};
			
			// Get this slider
			var slider = $(this);
			slider.data('nivo:vars', vars);
			slider.css('position','relative');
			slider.addClass('nivoSlider');
			
// ======= Find our slider children
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
			
// ======= Set startSlide
			if(settings.startSlide > 0){
				if(settings.startSlide >= vars.totalSlides) settings.startSlide = vars.totalSlides - 1;
				vars.currentSlide = settings.startSlide;
				vars.prevSlide = vars.currentSlide;
			}
			
// ======= Get and Show initial image
			if($(kids[vars.currentSlide]).is('img')){
				vars.currentImage = $(kids[vars.currentSlide]);
				$(kids[vars.currentSlide]).css({display: 'block', opacity:'1.0'});
			} else {
				vars.currentImage = $(kids[vars.currentSlide]).find('img:first');
				$(kids[vars.currentSlide]).find('img:first').css({display: 'block', opacity:'1.0'});
			}
			
// ======= Show initial link
			if($(kids[vars.currentSlide]).is('a')){
				$(kids[vars.currentSlide]).css('display','block');
			}
			
// ======= Add initial slices
			for(var i = 0; i < settings.slices; i++){
				var sliceWidth = Math.round(slider.width()/settings.slices);
				if(i == settings.slices-1){
					slider.append(
						$('<div class="nivo-slice"></div>').css({ left:(sliceWidth*i)+'px', width:(slider.width()-(sliceWidth*i))+'px' })
					);
				} else {
					slider.append(
						$('<div class="nivo-slice"></div>').css({ left:(sliceWidth*i)+'px', width:sliceWidth+'px' })
					);
				}
			}
			
// ======= Create captions
			slider.append(
				$('<div class="nivo-caption"><p></p></div>').css({ display:'none', opacity:settings.captionOpacity })
			);			
			// Process initial  caption
			if(vars.currentImage.attr('title') != ''){
				$('.nivo-caption p', slider).html(vars.currentImage.attr('title'));					
				$('.nivo-caption', slider).fadeIn(settings.animSpeed);
			}
			
// ======= Set initial timer ... in the words of Super Mario "let's a go!"
			var timer = 0;
			if(!settings.manualAdvance && kids.length > 1){
				timer = setInterval(function(){ nivoRun(slider, kids, settings, false); }, settings.pauseTime);
			}


// ======= Add Direction nav
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
				
				$('a.nivo-prevNav', slider).live('click', function(){
					if(vars.running) return false;
					clearInterval(timer);
					timer = '';
					vars.currentSlide-=2;
					nivoRun(slider, kids, settings, 'prev');
				});
				
				$('a.nivo-nextNav', slider).live('click', function(){
					if(vars.running) return false;
					clearInterval(timer);
					timer = '';
					nivoRun(slider, kids, settings, 'next');
				});
			}
			
// ======= Add Control nav
			if(settings.controlNav){
				var nivoControl = $('<div class="nivo-controlNav"></div>');
				slider.append(nivoControl);
				for(var i = 0; i < kids.length; i++){
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

				// Set initial active link
				$('.nivo-controlNav a:eq('+ vars.currentSlide +')', slider).addClass('active');
				
				$('.nivo-controlNav a', slider).live('click', function(){
					if(vars.running) return false;
					if($(this).hasClass('active')) return false;
					clearInterval(timer);
					timer = '';
					vars.currentSlide = $(this).attr('rel') - 1;
					nivoRun(slider, kids, settings, 'control');
				});
			}
			
// ======= Keyboard Navigation
			if(settings.keyboardNav){
				$(window).keypress(function(event){
					//Left
					if(event.keyCode == '37'){
						if(vars.running) return false;
						clearInterval(timer);
						timer = '';
						vars.currentSlide-=2;
						nivoRun(slider, kids, settings, 'prev');
					}
					//Right
					if(event.keyCode == '39'){
						if(vars.running) return false;
						clearInterval(timer);
						timer = '';
						nivoRun(slider, kids, settings, 'next');
					}
				});
			}
			
// ======= For pauseOnHover setting
			if(settings.pauseOnHover){
				slider.hover(function(){
					vars.paused = true;
					clearInterval(timer);
					timer = '';
				}, function(){
					vars.paused = false;
					//Restart the timer
					if(timer == '' && !settings.manualAdvance){
						timer = setInterval(function(){ nivoRun(slider, kids, settings, false); }, settings.pauseTime);
					}
				});
			}
			
// ======= Event when Animation finishes
			slider.bind('nivo:animFinished', function(){ 
				
				// only run if both front and back animations are complete
				if (vars.foreFlag && vars.backFlag) {
					vars.running = false; 
					
					// Hide child links
					$(kids).each(function(){
						if($(this).is('a')){
							$(this).css('display','none');
						}
					});
					
					// Show current link
					if($(kids[vars.currentSlide]).is('a')){
						$(kids[vars.currentSlide]).css({ display:'block', opacity: '1.0' });
					}
					
					// Restart the timer
					if(timer == '' && !vars.paused && !settings.manualAdvance){
						timer = setInterval(function(){ nivoRun(slider, kids, settings, false); }, settings.pauseTime);
					}
					
					// Trigger the afterChange callback
					settings.afterChange.call(this);
				}
			});
		});
		

// ============================================================
// MAIN FUNCTION
// ============================================================


		function nivoRun(slider, kids, settings, nudge){
			// select the effect and animation speed for the current control type
			var effect = settings.autoEffect;
			var animSpeed = settings.autoSpeed;
			var outSpeed = settings.autoOut;
			switch (nudge) {
				case 'prev' :
					effect = settings.prevEffect;
					animSpeed = settings.prevSpeed;
					outSpeed = settings.prevOut;
					break;
				case 'next' :
					effect = settings.nextEffect;
					animSpeed = settings.nextSpeed;
					outSpeed = settings.nextOut;
					break;
				case 'control' :
					effect = settings.controlEffect;
					animSpeed = settings.controlSpeed;
					outSpeed = settings.controlOut;
					break;		
			}
						
			// Get our vars
			var vars = slider.data('nivo:vars');
			if((!vars || vars.stop) && !nudge) return false;
			
			
			// Trigger the beforeChange callback
			settings.beforeChange.call(this);
					
// ======= Set current background before change
			// hide all children (links and images)
			$(kids).each(function(){
				$(this).css({display: 'none', opacity:'0'});
				if($(this).is('a')){
					$(this).find('img:first').css({display: 'none', opacity:'0'});
				}
			});
			
			// show just the current slide
			if (outSpeed === 'none') {
				// if we want the background to be persistent, we have to load it into the main div
				slider.css('background','url('+ vars.currentImage.attr('src') +') no-repeat');
							
			} else {
				
				// make sure the main div background is empty 
				slider.css('background','');
				
				// load the appropriate image ... the containing anchor has to be shown, too
				$(kids[vars.prevSlide]).css({display:'block', opacity:'1.0'});
				if($(kids[vars.prevSlide]).is('a')){
					$(kids[vars.prevSlide]).find('img:first').css({display:'block', opacity:'1.0'});
				}
			}
				
			vars.currentSlide++;
			if(vars.currentSlide == vars.totalSlides){ 
				vars.currentSlide = 0;
				//Trigger the slideshowEnd callback
				settings.slideshowEnd.call(this);
			}
			else if(vars.currentSlide < 0) {
				vars.currentSlide = (vars.totalSlides - 1);
			}
			
// ======= Set vars.currentImage
			if($(kids[vars.currentSlide]).is('img')){
				vars.currentImage = $(kids[vars.currentSlide]);
			} else {
				vars.currentImage = $(kids[vars.currentSlide]).find('img:first');
			}
			
// ======= Set acitve links
			if(settings.controlNav){
				$('.nivo-controlNav a', slider).removeClass('active');
				$('.nivo-controlNav a:eq('+ vars.currentSlide +')', slider).addClass('active');
			}
			
// ======= Process caption
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
			
// ======= Set new slice backgrounds
			var  i = 0;
			$('.nivo-slice', slider).each(function(){
				var sliceWidth = Math.round(slider.width()/settings.slices);
				$(this).css({ height:'0px', opacity:'0', 
					background: 'url('+ vars.currentImage.attr('src') +') no-repeat -'+ ((sliceWidth + (i * sliceWidth)) - sliceWidth) +'px 0%' });
				i++;
			});
			
// ======= Select a random effect
			if(effect == 'random'){
				var anims = new Array("sliceDownRight","sliceDownLeft","sliceUpRight","sliceUpLeft","sliceUpDown","sliceUpDownLeft","fold","fade");
				vars.randAnim = anims[Math.floor(Math.random()*(anims.length + 1))];
				if(vars.randAnim == undefined) vars.randAnim = 'fade';
			}
            
// ======= Select a random effect from a specified list
            if(effect.indexOf(',') != -1){
                var anims = effect.split(',');
                vars.randAnim = $.trim(anims[Math.floor(Math.random()*anims.length)]);
            }
		
			// Initialize effects run
			vars.running = true;
			vars.foreFlag = false;
			vars.backFlag = false;
			
// ======= DOWN animation
			if(effect == 'sliceDown' || effect == 'sliceDownRight' || vars.randAnim == 'sliceDownRight' ||
				effect == 'sliceDownLeft' || vars.randAnim == 'sliceDownLeft'){
				var timeBuff = 0;
				var i = 0;
				var slices = $('.nivo-slice', slider);
				if(effect == 'sliceDownLeft' || vars.randAnim == 'sliceDownLeft') slices = $('.nivo-slice', slider).reverse();
				slices.each(function(){
					var slice = $(this);
					slice.css('bottom', '');
					slice.css('top','0px');
					if(i == settings.slices-1){
						setTimeout(function(){
							slice.animate({ height:'100%', opacity:'1.0' }, animSpeed, '', function(){ vars.foreFlag=true; slider.trigger('nivo:animFinished'); });
						}, (100 + timeBuff));
					} else {
						setTimeout(function(){
							slice.animate({ height:'100%', opacity:'1.0' }, animSpeed);
						}, (100 + timeBuff));
					}
					timeBuff += 50;
					i++;
				});
			}
			
// ======= UP animation
			else if(effect == 'sliceUp' || effect == 'sliceUpRight' || vars.randAnim == 'sliceUpRight' ||
					effect == 'sliceUpLeft' || vars.randAnim == 'sliceUpLeft'){
				var timeBuff = 0;
				var i = 0;
				var slices = $('.nivo-slice', slider);
				if(effect == 'sliceUpLeft' || vars.randAnim == 'sliceUpLeft') slices = $('.nivo-slice', slider).reverse();
				slices.each(function(){
					var slice = $(this);
					slice.css('top', '');
					slice.css('bottom','0px');
					if(i == settings.slices-1){
						setTimeout(function(){
							slice.animate({ height:'100%', opacity:'1.0' }, animSpeed, '', function(){ vars.foreFlag=true; slider.trigger('nivo:animFinished'); });
						}, (100 + timeBuff));
					} else {
						setTimeout(function(){
							slice.animate({ height:'100%', opacity:'1.0' }, animSpeed);
						}, (100 + timeBuff));
					}
					timeBuff += 50;
					i++;
				});
			}
			
// ======= UP + DOWN animation
			else if(effect == 'sliceUpDown' || effect == 'sliceUpDownRight' || vars.randAnim == 'sliceUpDown' || 
					effect == 'sliceUpDownLeft' || vars.randAnim == 'sliceUpDownLeft'){
				var timeBuff = 0;
				var i = 0;
				var v = 0;
				var slices = $('.nivo-slice', slider);
				if(effect == 'sliceUpDownLeft' || vars.randAnim == 'sliceUpDownLeft') slices = $('.nivo-slice', slider).reverse();
				slices.each(function(){
					var slice = $(this);
					if(i == 0){
						slice.css('bottom', '');
						slice.css('top','0px');
						i++;
					} else {
						slice.css('top', '');
						slice.css('bottom','0px');
						i = 0;
					}
					
					if(v == settings.slices-1){
						setTimeout(function(){
							slice.animate({ height:'100%', opacity:'1.0' }, animSpeed, '', function(){ vars.foreFlag=true; slider.trigger('nivo:animFinished'); });
						}, (100 + timeBuff));
					} else {
						setTimeout(function(){
							slice.animate({ height:'100%', opacity:'1.0' }, animSpeed);
						}, (100 + timeBuff));
					}
					timeBuff += 50;
					v++;
				});
				
				
				
			}
			
// ======= FOLD animation
			else if(effect == 'fold' || vars.randAnim == 'fold'){
				var timeBuff = 0;
				var i = 0;
				$('.nivo-slice', slider).each(function(){
					var slice = $(this);
					var origWidth = slice.width();
					slice.css('bottom', '');
					slice.css({ top:'0px', height:'100%', width:'0px' });
					if(i == settings.slices-1){
						setTimeout(function(){
							slice.animate({ width:origWidth, opacity:'1.0' }, animSpeed, '', function(){ vars.foreFlag=true; slider.trigger('nivo:animFinished'); });
						}, (100 + timeBuff));
					} else {
						setTimeout(function(){
							slice.animate({ width:origWidth, opacity:'1.0' }, animSpeed);
						}, (100 + timeBuff));
					}
					timeBuff += 50;
					i++;
				});
			}
			
// ======= FADE animation
			else if(effect == 'fade' || vars.randAnim == 'fade'){
				var i = 0;
				$('.nivo-slice', slider).each(function(){
					$(this).css('height','100%');
					if(i == settings.slices-1){
						$(this).animate({ opacity:'1.0' }, (animSpeed*2), '', function(){ vars.foreFlag=true; slider.trigger('nivo:animFinished'); });
					} else {
						$(this).animate({ opacity:'1.0' }, (animSpeed*2));
					}
					i++;
				});
			}


// ======= OUT animation ... Fade out background image while bringing in foreground slices		
			
			// only animate if necessary
			if (outSpeed !== 'none') {
					
				// if set to 'match' then match the current animation timing
				if (outSpeed === 'match' ) {
					if (effect == 'fade') {
						outSpeed = animSpeed * 2;
					} else {
						outSpeed = animSpeed + 100 + timeBuff;
					}
				}
				
				if (outSpeed < 0 ) { outSpeed = 0; }
		
				if ( $(kids[vars.prevSlide]).is('img') ){
					$(kids[vars.prevSlide]).animate({ opacity:'0' }, outSpeed, '', function(){ vars.backFlag=true; slider.trigger('nivo:animFinished'); } );
				} else {
					$(kids[vars.prevSlide]).find('img:first').animate({ opacity:'0' }, outSpeed, '', function(){ vars.backFlag=true; slider.trigger('nivo:animFinished'); } );
				}
			} 
			
			else { vars.backFlag=true; }
			
			
			// initialize prevSlide for next animation
			vars.prevSlide = vars.currentSlide;
			
		}
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
	
	$.fn.reverse = [].reverse;
	
})(jQuery);