(function () {
    'use strict';

    var app= angular.module('greatoutdoor', ['pageslide-directive']);

    app.controller('main-controller',  function($scope, $http) {

		$scope.nbOfReco = 3;

    	$scope.openReco = false;
		$scope.products = [];
		$scope.cart = [];
		$scope.rules = [];
		$scope.appliedRules = [];
		$scope.totalPrice = 0;
		$scope.productMap = {}
		$scope.showHomePage = true;
		$scope.showProducts = false;
		$scope.showCart = false;
		$scope.selectedCategory = "Accueil";

		$http.get("data/products.json")                                            
		.success(function(data, status, headers, config) {
		    for (var i = data.length - 1; i >= 0; i--) {
		    	data[i].Quantite = 1;
		    	if ($scope.productMap[data[i].Lignes_de_produits]){/* do nothing */}
		    	else 
		    		$scope.productMap[data[i].Lignes_de_produits] = {};
		    	
		    	if ($scope.productMap[data[i].Lignes_de_produits][data[i].Types_de_produit]){/* do nothing */}
		    	else 
		    		$scope.productMap[data[i].Lignes_de_produits][data[i].Types_de_produit] = [[]];
	        	
	        	var pushed = false;
	        	for (var j = 0; j < $scope.productMap[data[i].Lignes_de_produits][data[i].Types_de_produit].length; j++) {
	        		if ($scope.productMap[data[i].Lignes_de_produits][data[i].Types_de_produit][j].length < 3) {
	        			$scope.productMap[data[i].Lignes_de_produits][data[i].Types_de_produit][j].push(data[i]);
	        			pushed = true;
	        		}
	        	}
	        	if (!pushed)
	        		$scope.productMap[data[i].Lignes_de_produits][data[i].Types_de_produit].push([data[i]])
	        }
		    console.log($scope.productMap);
		 }); 

		$http.get("data/rules.json")                                            
		.success(function(data, status, headers, config) {
			data = data.rules;
		    for (var i = data.length - 1; i >= 0; i--) {
		    	data[i].Antecedent = data[i].Antecedent.split(" + ");
		    }
		    $scope.rules = data;
		 }); 

		$scope.$on('activateDynamicMenu', function(ngRepeatFinishedEvent) {
		    $(".memenu").memenu();
		})

		$scope.$watchCollection('cart', function (newVal, oldVal) {$scope.updateTotalPrice();});

		$scope.updateTotalPrice = function() {
			$scope.totalPrice = 0;
			for (var i = $scope.cart.length - 1; i >= 0; i--) {
				$scope.totalPrice += $scope.cart[i].Prix_unitaire * $scope.cart[i].Quantite;
			}
		}

		$scope.goToHomePage = function() {
			$scope.selectedCategory = "Accueil";
			$scope.showProducts = false;
			$scope.showHomePage = true;
			$scope.openReco = false;
		}

		$scope.goToProductLine = function(lineOfProduct) {
			$scope.products = [];
			$scope.selectedCategory = lineOfProduct;
			for (var productType in $scope.productMap[lineOfProduct] ) {
			    if ($scope.productMap[lineOfProduct].hasOwnProperty(productType)) {
			    	for (var j = 0; j < $scope.productMap[lineOfProduct][productType].length;  j++) {
						$scope.products.push($scope.productMap[lineOfProduct][productType][j])
		        	}
			    }
			}
			$scope.showHomePage = false;
			$scope.showCart = false;
			$scope.showProducts = true;
		}

		$scope.goToProductType = function(typeOfProduct) {
			$scope.products = [];
			for (var productLine in $scope.productMap) {
			    if ($scope.productMap.hasOwnProperty(productLine) && $scope.productMap[productLine].hasOwnProperty(typeOfProduct)) {
			    	for (var j = 0; j <  $scope.productMap[productLine][typeOfProduct].length;  j++) {
						$scope.products.push($scope.productMap[productLine][typeOfProduct][j])
		        	}
		        	$scope.selectedCategory = productLine + "   /   " + typeOfProduct;
			    }
			}
			$scope.showHomePage = false;
			$scope.showCart = false;
			$scope.showProducts = true;
		}


		$scope.goToCart = function() {
			$scope.selectedCategory = "Panier";
			$scope.showProducts = false;
			$scope.showHomePage = false;
			$scope.showCart = true;
			$scope.openReco = false;
		}

		$scope.addToCart = function(product) {
			if(!$scope.openReco) {
				var indexInCart = $scope.cart.indexOf(product);
				if (indexInCart >= 0) 
					$scope.cart[indexInCart].Quantite++
				else
					$scope.cart.push(product)
				$scope.computeReco();
				if($scope.appliedRules.length > 0)
					$scope.toggleReco();
			}
		}

		$scope.addToCartFromReco = function(product) {
			var indexInCart = $scope.cart.indexOf(product);
			if (indexInCart >= 0) 
				$scope.cart[indexInCart].Quantite++
			else
				$scope.cart.push(product)
			$scope.computeReco();
		}

		$scope.removeFromCart = function(product) {
			$scope.cart[$scope.cart.indexOf(product)].Quantite = 1;
			var nbOfProductsOfThisType = 0;
			for (var i = 0; i < $scope.cart.length; i++) {
				if($scope.cart[i].Types_de_produit === product.Types_de_produit)
					nbOfProductsOfThisType++;
		    }
		    if (nbOfProductsOfThisType === 1)
				$scope.appliedRules = $scope.appliedRules.filter(function(el) {return el.Antecedent.indexOf(product.Types_de_produit) < 0;});
			$scope.cart = $scope.cart.filter(function(el) {return el.Produit !== product.Produit;});
			$scope.computeReco();
		}
		

		$scope.computeReco = function(){
			var typesInCart = [];
			for (var i = $scope.cart.length - 1; i >= 0; i--) {
				if (typesInCart.indexOf($scope.cart[i].Types_de_produit) < 0)
					typesInCart.push($scope.cart[i].Types_de_produit);
			}
			typesInCart.sort(function(a, b) {return a - b;});
			for (var i = 0; i <  $scope.rules.length;  i++) {
				$scope.rules[i].Antecedent.sort(function(a, b) {return a - b;});
				var ruleApplies = $scope.rules[i].Antecedent.every(function (val) { return typesInCart.indexOf(val) >= 0; });
				if (ruleApplies) {
					var ruleExists = false;
					for (var j = 0; j <  $scope.appliedRules.length;  j++) {
						var foundIt = true;
						$scope.appliedRules[j].Antecedent.sort(function(a, b) {return a - b;});
						if ($scope.appliedRules[j].Antecedent.length !== $scope.rules[i].Antecedent.length) {
							foundIt = false;
						} else {
						    for (var k = 0; k < $scope.appliedRules[j].Antecedent.length; k++) {
						    	if ($scope.rules[i].Antecedent[k] !== $scope.appliedRules[j].Antecedent[k] || $scope.rules[i].Consequent !== $scope.appliedRules[j].Consequent) 
						    		foundIt = false;
						    }
						}
					    if (foundIt)
					    	ruleExists = true;
					}
					if (ruleExists === false)
						$scope.appliedRules.push($scope.rules[i]);
				}
		    }
		    $scope.appliedRules.sort(function(a, b) {return parseFloat(b.Rule_Lift) - parseFloat(a.Rule_Lift);});
		    $scope.appliedRules = $scope.appliedRules.slice(0, $scope.nbOfReco);
		    for (var i = 0; i <  $scope.appliedRules.length;  i++) {
				for (var productLine in $scope.productMap) {
				    if ($scope.productMap.hasOwnProperty(productLine) && $scope.productMap[productLine].hasOwnProperty($scope.appliedRules[i].Consequent)) {
		    			$scope.appliedRules[i].asoociatedProduct = $scope.productMap[productLine][$scope.appliedRules[i].Consequent][0][0]
				    }
				}
		   	}
		}

		$scope.toggleReco = function() {
			if ($scope.openReco)
				$scope.openReco = false;
			else
				$scope.openReco = true;
		}

		$scope.arraysEqual = function(arr1, arr2) {
		    if(arr1.length !== arr2.length)
		        return false;
		    for(var i = arr1.length; i--;) {
		        if(arr1[i] !== arr2[i])
		            return false;
		    }
		    return true;
		}
 
	});

	app.directive('homePage', function() {
	  return {
	    restrict: 'E',
	    templateUrl: 'home.html'
	  };
	});

	app.directive('headerNavbar', function() {
	  return {
	    restrict: 'E',
	    templateUrl: 'header.html'
	  };
	});

	app.directive('products', function() {
	  return {
	    restrict: 'E',
	    templateUrl: 'products.html'
	  };
	});

	app.directive('checkout', function() {
	  return {
	    restrict: 'E',
	    templateUrl: 'checkout.html'
	  };
	});

	app.directive('recommandations', function() {
	  return {
	    restrict: 'E',
	    templateUrl: 'recommandations.html'
	  };
	});

	app.directive('recommandationsHeader', function() {
	  return {
	    restrict: 'E',
	    templateUrl: 'recommandations-header.html'
	  };
	});
	// Emit an event when the rendring is done for an element
    app.directive('onFinishRender', function ($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            if (scope.$last === true) {
                $timeout(function () {
                    scope.$emit(attr.onFinishRender);
                });
            }
        }
    }
});

})(); 