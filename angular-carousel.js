/**
 * @license AngularJS v1.0.2
 * (c) 2015 Lifely
 * License: MIT
 */

angular.module('angular-carousel', [])

//
//  This service controls existing carousel instances
//
.factory('Carousel', function() {

    var Carousel = {};

    Carousel.instances = {};

    //
    // Add a new carousel instance
    //
    Carousel.add = function(slidesCount, name, scope) {

        // Check if name is specified
        name = name || false;
        if(!name) {
            return 'Error: no carousel name specified';
        }

        // Check slidesCount
        slidesCount = slidesCount || 0;

        // Check if carousel already exists
        var carouselExists = Carousel.instances[name] || false;
        if(carouselExists) {
            return 'Error: carousel instance already exists';
        }

        // Create carousel instance
        var instance = new constructor(slidesCount, scope);

        // Save new carousel instance
        Carousel.instances[name] = instance;

        return instance;
    };

    //
    // Get an existing carousel instance by name
    //
    Carousel.get = function(name) {
        var instance = Carousel.instances[name] || false;
        return instance ? instance : 'Error: carousel with name \'' + name + '\' does not exist';
    };

    //
    // Carousel prototype definition
    //
    var constructor = function(slidesCount, scope) {

        var instance = this;

        this.slidesCount = slidesCount;
        this.currentSlide = 0;
        this.onSlideChangeCallbacks = [];

        // Operation: to specified index
        this.toIndex = function(index, wrapping) {
            wrapping = wrapping || false;
            this.currentSlide = index % this.slidesCount;

            // Own on slide change callbacks
            angular.forEach(this.onSlideChangeCallbacks, function(callback) {
                if(typeof(callback) === 'function') {
                    callback(instance.currentSlide, wrapping);
                }
            });

            // If the scope is not currently updating, trigger one update
            if(!scope.$$phase) {
                scope.$apply();
            }
        };

        // Operation: to next slide
        this.next = function() {
            var nextSlide = this.currentSlide + 1,
                wrapping = false;

            if(nextSlide > this.slidesCount - 1) {
                nextSlide = 0;
                wrapping = 'right';
            }
            
            this.toIndex(nextSlide, wrapping);
            return nextSlide;
        };

        // Operation: to previous slide
        this.previous = function() {
            var previousSlide = this.currentSlide - 1,
                wrapping = false;

            if(previousSlide < 0) {
                previousSlide = this.slidesCount - 1;
                wrapping = 'left';
            }
            
            this.toIndex(previousSlide, wrapping);
            return previousSlide;
        };

        // Operation: on slide change
        this.onSlideChange = function(callback) {
            this.onSlideChangeCallbacks.push(callback);
            return this.onSlideChangeCallbacks.indexOf(callback);
        };

        // Operation: unbind on slide change callback
        this.unbindOnSlideChangeCallback = function(index) {
            if(typeof(this.onSlideChangeCallbacks[index]) === 'undefined') return;
            this.onSlideChangeCallbacks.splice(index, 1);
        };
    }

    return Carousel;

})

//
//  This directive makes an element with class 'ng-carousel' interactive
//  using own UI logic and HammerJS
//
.directive('ngCarousel', ['Carousel', '$compile', '$document', '$timeout', function(Carousel, $compile, $document, $timeout) {
    function isTouchDevice() {
        return 'ontouchstart' in document.documentElement;
    }

    var MOVE_TRESHOLD_PERCENTAGE = 25;

    return {
        restrict: 'AE',
        link: function(scope, element, attrs) {

            element.addClass('ng-carousel');

            element.addClass(isTouchDevice() ? 'touch' : 'no-touch');

            // Create carousel instance
            var slides = element.find('slide');
            var currentCarousel = Carousel.add(slides.length, attrs.ngCarouselName, scope);

            // Find slide wrapper
            var slideContainer = element.find('slidecontainer');

            // Add slides before and after the current slides
            var firstSlideCopy = $compile(slides[0].outerHTML)(scope);
            var lastSlideCopy = $compile(slides[slides.length - 1].outerHTML)(scope);
            slideContainer.append(firstSlideCopy);
            slideContainer.prepend(lastSlideCopy);
            slideContainer.addClass('carousel-ignore-first-slide');

            // Options
            var interval = false, timeoutPromise = false, random = false;
            interval = typeof(attrs.ngCarouselTimer) !== 'undefined' && parseInt(attrs.ngCarouselTimer, 10) > 0 ? parseInt(attrs.ngCarouselTimer, 10) : false;
            random = typeof(attrs.ngCarouselRandom) !== 'undefined';

            // Reset interval function
            var setNextSlideTimeout = function() {
                if(!interval) return;
                if(timeoutPromise) $timeout.cancel(timeoutPromise);
                timeoutPromise = $timeout(function() {
                    currentCarousel.next();
                }, interval);
            };

            // UI move function
            var move = function(slideIndex, animate, transitionEndCallback) {
                if(animate) {
                    slideContainer.addClass('carousel-animate');
                } else {
                    slideContainer.removeClass('carousel-animate');
                }

                var rule = 'translate(-' + (100 * slideIndex) + '%, 0)';
                slideContainer.css({
                    '-webkit-transform': rule,
                       '-moz-transform': rule,
                        '-ms-transform': rule,
                         '-o-transform': rule,
                            'transform': rule
                });

                if(animate) {
                    slideContainer.bind('transitionend oTransitionEnd webkitTransitionEnd', function() {
                        if(typeof transitionEndCallback === 'function') transitionEndCallback();
                        slideContainer.unbind('transitionend oTransitionEnd webkitTransitionEnd');
                        move(currentCarousel.currentSlide + 1, false);
                    });
                }
            };

            // On slide change, move the slideContainer
            currentCarousel.onSlideChange(function(slideIndex, wrapping) {
                var newSlideIndex = slideIndex + 1; // because the first slide doesn't count

                if(wrapping === 'left') {
                    newSlideIndex = 0; // first slide
                } else if(wrapping === 'right') {
                    newSlideIndex = slides.length + 1; // last slide
                }

                move(newSlideIndex, true, function() {
                    if(wrapping === 'left') {
                        move(slides.length, false);
                    } else if(wrapping === 'right') {
                        move(1, false);
                    }
                });

                setNextSlideTimeout();
            });

            // Make the carousel draggable (either with touch or with mouse)
            var deltaXFactor = 0,
                width = 0;
            var carouselDrag = function(newDeltaX) {
                deltaXFactor = newDeltaX / width;
                deltaXFactor = deltaXFactor > 1 ? 1 : deltaXFactor < -1 ? -1 : deltaXFactor;
                move(currentCarousel.currentSlide + 1 - deltaXFactor, false);
            };
            var carouselPress = function() {
                width = slideContainer[0].offsetWidth;
            };
            var carouselRelease = function() {
                if(Math.abs(deltaXFactor) > MOVE_TRESHOLD_PERCENTAGE / 100) {
                    if(deltaXFactor > 0) {
                        currentCarousel.previous(); // user dragged right, go to previous slide
                    } else {
                        currentCarousel.next(); // user dragged left, go to next slide
                    }
                    deltaXFactor = 0;
                } else if(deltaXFactor > 0 || deltaXFactor < 0) {
                    move(currentCarousel.currentSlide + 1, true, function() {
                        deltaXFactor = 0;
                    });
                }
            };

            // Initialize Hammer
            var hammer = new Hammer.Manager(slideContainer[0]);
            hammer.add(new Hammer.Pan({ direction: Hammer.DIRECTION_HORIZONTAL, threshold: 0 }));

            // On pan left/right
            hammer.on("panleft panright", function(ev) {
                if(!ev.isFinal) carouselDrag(ev.deltaX);
            });

            // On release
            var pressEvent = isTouchDevice() ? 'touchstart' : 'mousedown';
            var releaseEvent = isTouchDevice() ? 'touchend' : 'mouseup';
            $document.on(pressEvent, carouselPress);
            $document.on(releaseEvent, carouselRelease);

            // Option: random
            if(random) {
                var randomSlide = Math.floor(Math.random() * currentCarousel.slidesCount);
                currentCarousel.toIndex(randomSlide);
            }

            // Option: interval
            if(interval) {
                setNextSlideTimeout();
            }

            element.on('mouseover', function() {
                if(timeoutPromise) $timeout.cancel(timeoutPromise);
            });
            element.on('mouseout', setNextSlideTimeout);

        }
    };
}])

// The end
;