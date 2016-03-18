/**
 * @license AngularJS v1.2.0
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
    Carousel.add = function(slidesCount, name, scope, options) {

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
        var instance = new constructor(slidesCount, scope, options);

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
    // Remove a carousel
    //
    Carousel.remove = function(name) {
        delete Carousel.instances[name];
    };

    //
    // Carousel prototype definition
    //
    var constructor = function(slidesCount, scope, options) {
        options = options || {};
        if (typeof options.looping === 'undefined') options.looping = true;

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

            // If the scope is not currently updating, trigger one update using a timeout of zero
            setTimeout(function() {
                scope.$apply();
            }, 0);
        };

        // Operation: to next slide
        this.next = function() {
            var nextSlide = this.currentSlide + 1,
                wrapping = false;

            if(nextSlide > this.slidesCount - 1) {
                if(options.looping){
                    nextSlide = 0;
                    wrapping = 'right';
                }
                else {
                    nextSlide = this.slidesCount - 1;
                }

            }

            this.toIndex(nextSlide, wrapping);
            return nextSlide;
        };

        // Operation: to previous slide
        this.previous = function() {
            var previousSlide = this.currentSlide - 1,
                wrapping = false;

            if(previousSlide < 0) {
                if(options.looping){
                    previousSlide = this.slidesCount - 1;
                    wrapping = 'left';
                }
                else {
                    previousSlide = 0;
                }

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

    function createEmptySlide(){
        return angular.element('<slide class="empty"></slide>');
    }

    return {
        restrict: 'AE',
        replace: true,
        scope: {
            ngCarouselWatch: '='
        },
        link: function(scope, element, attrs) {
            // Options
            var interval = false, timeoutPromise = false, random = false, name = '', looping = false;
            interval = typeof(attrs.ngCarouselTimer) !== 'undefined' && parseInt(attrs.ngCarouselTimer, 10) > 0 ? parseInt(attrs.ngCarouselTimer, 10) : false;
            random = typeof(attrs.ngCarouselRandom) !== 'undefined';
            looping = !(attrs.ngCarouselLoop === 'false');

            // Function to initialize interaction with dom (should be loaded after the dom has changed)
            var slides, currentCarousel, firstSlideCopy, lastSlideCopy, slideContainer, hammer, name;

            function copyFirstAndLastSlide() {
                firstSlideCopy = angular.element(slides[0].outerHTML);
                lastSlideCopy = angular.element(slides[slides.length - 1].outerHTML);
            }

            function makeFirstAndLastSlideEmpty() {
                firstSlideCopy = angular.element('<slide class="empty"></slide>');
                lastSlideCopy = angular.element('<slide class="empty"></slide>');
            }

            var refreshInteractionWithDom = function() {

                // Add initial classes
                element.addClass('ng-carousel');
                element.addClass(isTouchDevice() ? 'carousel-touch' : 'carousel-no-touch');

                // Find slide wrapper
                slideContainer = element.find('slidecontainer');

                // Remove old carousel
                var savedSlideIndex = false;
                var savedCallbacks = false;
                if(name) {
                    savedSlideIndex = Carousel.get(name).currentSlide;
                    savedCallbacks = Carousel.get(name).onSlideChangeCallbacks;
                    Carousel.remove(name);
                }

                // Remove old duplicated slides
                var removeOldVirtualSlides = function() {
                    var oldSlides = angular.element(element[0].querySelectorAll('.carousel-slide-copy'));
                    if(oldSlides.length > 0) oldSlides.remove();
                };

                // Find slides
                removeOldVirtualSlides();
                slides = element.find('slide');

                // Add slides before and after the current slides
                if(slides.length > 0) {

                    // Create new carousel and duplicate slides
                    name = attrs.ngCarouselName;
                    currentCarousel = Carousel.add(slides.length, attrs.ngCarouselName, scope, {
                        looping: looping
                    });
                    angular.forEach(savedCallbacks, function(savedCallback) {
                        currentCarousel.onSlideChange(savedCallback);
                        currentCarousel.unbindOnSlideChangeCallback(0);
                    });

                    // Duplicate first and last slide (for infinite effect)
                    var refreshVirtualSlides = function() {
                        removeOldVirtualSlides();
                        slides = element.find('slide');

                        if(looping) {
                            copyFirstAndLastSlide();
                        }
                        else {
                            makeFirstAndLastSlideEmpty();
                        }

                        firstSlideCopy.addClass('carousel-slide-copy');
                        lastSlideCopy.addClass('carousel-slide-copy');
                        slideContainer.append(firstSlideCopy);
                        slideContainer.prepend(lastSlideCopy);
                        slideContainer.addClass('carousel-ignore-first-slide');

                    };

                    refreshVirtualSlides();

                    // On slide change, move the slideContainer
                    var onSlideChangeCallback = function(slideIndex, wrapping) {
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
                        refreshVirtualSlides();
                    };
                    currentCarousel.onSlideChange(onSlideChangeCallback);

                    // If new slide was out of range, move to the new assigned one
                    if(savedSlideIndex !== false && currentCarousel.currentSlide !== savedSlideIndex) {
                        onSlideChangeCallback(currentCarousel.currentSlide, false);
                        currentCarousel.toIndex(savedSlideIndex);
                    }

                    // Option: random
                    if(random) {
                        var randomSlide = Math.floor(Math.random() * currentCarousel.slidesCount);
                        currentCarousel.toIndex(randomSlide);
                    }

                    // Option: interval
                    if (interval && currentCarousel.slidesCount >= 2) {
                        setNextSlideTimeout();
                    }
                } else {
                    console.log('ng-carousel error: No slides found')
                }

                // Initialize Hammer
                if(slideContainer[0]) {
                    hammer = new Hammer.Manager(slideContainer[0]);
                    hammer.add(new Hammer.Pan({ direction: Hammer.DIRECTION_HORIZONTAL, threshold: 0 }));

                    // On pan left/right
                    hammer.on("panleft panright", function(ev) {
                        if(!ev.isFinal) carouselDrag(ev.deltaX);
                    });
                } else {
                    console.log('ng-carousel error: No slidecontainer found')
                }

            };

            // Reset interval function
            var setNextSlideTimeout = function() {
                if(!interval || currentCarousel.slidesCount < 2) return;
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
                    slideContainer.on('transitionend oTransitionEnd webkitTransitionEnd', function() {
                        if(typeof transitionEndCallback === 'function') transitionEndCallback();
                        slideContainer.off('transitionend oTransitionEnd webkitTransitionEnd');
                        move(currentCarousel.currentSlide + 1, false);
                    });
                }
            };

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

            // On release
            var pressEvent = isTouchDevice() ? 'touchstart' : 'mousedown';
            var releaseEvent = isTouchDevice() ? 'touchend' : 'mouseup';
            $document.on(pressEvent, carouselPress);
            $document.on(releaseEvent, carouselRelease);

            //
            element.on('mouseover', function() {
                if(timeoutPromise) $timeout.cancel(timeoutPromise);
            });
            element.on('mouseout', setNextSlideTimeout);

            // Events to refresh the dom selectors
            var refreshInteractionWithDomTimer = $timeout(refreshInteractionWithDom, 0);
            if(typeof(attrs.ngCarouselWatch) !== 'undefined') {
                scope.$watch('ngCarouselWatch', function() {

                    // Wait for angular compile to complete
                    $timeout(refreshInteractionWithDom);

                }, true);
            }

            // Destroy all binded events on scope destroy
            scope.$on('$destroy', function() {
                $timeout.cancel(refreshInteractionWithDomTimer);
                element.off('mouseover mouseout');
                $document.off(pressEvent);
                $document.off(releaseEvent);
                slideContainer.off('transitionend oTransitionEnd webkitTransitionEnd');
                currentCarousel.onSlideChangeCallbacks = [];
                Carousel.remove(name);
            });

        }
    };
}]);
