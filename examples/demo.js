var demoApp = angular.module('demoApp', ['angular-carousel'])
.controller('DemoCtrl', function($scope, Carousel) {
    $scope.Carousel = Carousel;
});