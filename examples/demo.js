var demoApp = angular.module('demoApp', ['angular-carousel'])
    .controller('DemoCtrl', function ($scope, Carousel) {
        $scope.Carousel = Carousel;

        $scope.dynamicSlides = ['A', 'B', 'C'];

        $scope.addSlide = function(title){
            $scope.dynamicSlides.push(title);
        };

        $scope.removeSlide = function(title){
            var elementIndex = $scope.dynamicSlides.indexOf(title);
            if(elementIndex >= 0) {
                $scope.dynamicSlides.splice(elementIndex, 1);
            }
        };
    });