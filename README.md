# angular-carousel.js 1.2.0

A simple very generic AngularJS carousel. Features:

- Touch optimized (swipe to move between the slides)
- Looping (enabled by default)
- Timer (optional)
- Random start (optional)
- Select the carousel by name (using the Carousel service) and control the carousel
- Print out the current slide of a selected carousel

See the [demo here](http://htmlpreview.github.io/?https://raw.githubusercontent.com/lifelynl/angular-carousel/master/examples/demo.html "demo")

## How to use

### Step 1: install this package (Bower)

`bower install lifely-angular-carousel`

There other dependencies are required:

- *AngularJS >= 1.2.3*
- *HammerJS >= 2.0.4*

### Step 2: write the html
Just use `ng-carousel` to initiate a carousel. Give it a unique name with `ng-carousel-name`.

    <div ng-carousel ng-carousel-name="example-carousel1">
        <slidecontainer class="carousel-slides">
            <slide class="carousel-example">Slide 1</slide>
            <slide class="carousel-example">Slide 2</slide>
            <slide class="carousel-example">Slide 3</slide>
            <slide class="carousel-example">Slide 4</slide>
            <slide class="carousel-example">Slide 5</slide>
            <slide class="carousel-example">Slide 6</slide>
        </slidecontainer>
    </div>

You can put anything you want in de slides. The slides fit perfectly inside the ng-carousel element, which is 300px by default. You can easily overwrite it using CSS.

#### If the slides are being generated (for example with `ng-repeat`)
You should let ng-carousel know when your scope changes. To do so, just pass your changing scope variable through the attribute `ng-carousel-watch="yourChangingScopeVariable"`.


### Optional: control the carousel with inside buttons
You can place anything inside the *.carousel-arrow* elements. These are positioned left and right and have a width of 100px by default. You also can overwrite this using CSS.

    <div ng-carousel ng-carousel-name="example-carousel2">
        <slidecontainer class="carousel-slides">
            <slide class="carousel-example">Slide 1</slide>
            <slide class="carousel-example">Slide 2</slide>
            <slide class="carousel-example">Slide 3</slide>
            <slide class="carousel-example">Slide 4</slide>
            <slide class="carousel-example">Slide 5</slide>
            <slide class="carousel-example">Slide 6</slide>
        </slidecontainer>
        <div class="carousel-arrow carousel-arrow-left">
            <button ng-click="Carousel.get('example-carousel2').previous()">back</button>
        </div>
        <div class="carousel-arrow carousel-arrow-right">
            <button ng-click="Carousel.get('example-carousel2').next()">forth</button>
        </div>
    </div>


### Optional: disable looping
You can disable looping by setting `ng-carousel-loop` attribute to false on element having your `ng-carousel` directive.

    <div ng-carousel ng-carousel-name="example-carousel5" ng-carousel-loop="false">
        <slidecontainer>
            <slide>Slide 1</slide>
            <slide>Slide 2</slide>
            <slide>Slide 3</slide>
            <slide>Slide 4</slide>
        </slidecontainer>
    </div>

### Optional: control the carousel from another place in the code
You can control the carousel using the `Carousel` service.

- Select and save a carousel using `var myCarousel = Carousel.get('carousel-example3')`
- Read-only variables of myCarousel are now:
    - `myCarousel.currentSlide` - the active slide of your myCarousel
    - `myCarousel.slidesCount` - the total count of slides inside myCarousel
- Control the carousel:
    - `myCarousel.previous()` - go to the previous slide
    - `myCarousel.next()` - go to the next slide
    - `myCarousel.toIndex(n)` - go to a specific slide (starting with 0)











