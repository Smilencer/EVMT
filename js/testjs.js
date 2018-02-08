$(document).ready(function () {
    class VM {
        constructor() {
            this.beverage = null;
            this.coffeesize = null;
            this.teatype = null;
            this.money = null;
            this.mocha = new Mocha();
            this.cream = new Cream();
            this.tea = new Tea();
            this.cash = new Cash();
            this.change = new Change();
        }
        VMSvc() {
            this.coffeesize = this.mocha.size;
            this.teatype = this.tea.decaf;
            this.money = this.cash.pay;
            if (this.beverage.split(",").includes("coffee")) {
                this.mocha.MochaSvc();
                this.cream.coffeeprice = null ? this.mocha.price : this.cream.coffeeprice + this.mocha.price;
                this.cream.CreamSvc();
                this.cash.amount = null ? this.cream.sumprice : this.cash.amount + this.cream.sumprice;
            }
            if (this.beverage.split(",").includes("tea")) {
                this.tea.TeaSvc();
                this.cash.amount = null ? this.tea.price : this.cash.amount + this.tea.price;
            }
            this.cash.CashSvc();
            this.change.change = null ? this.cash.change : this.change.change + this.cash.change;
            this.change.ChangeSvc();
        }
    }
    class Mocha {
        constructor() {
            this.size = null;
            this.price = null;
        }
        MochaSvc() {
            if (this.size == "small") {
                this.price = 2.5;
            } else if (this.size == "medium") {
                this.price = 2.8;
            } else {
                this.price = 3;
                this.size = "large";
            }
            console.log("Make a " + this.size + " cup of Mocha. (+£" + this.price.toFixed(2) + ")");
        }
    }
    class Cream {
        constructor() {
            this.coffeeprice = null;
            this.sumprice = null;
        }
        CreamSvc() {
            this.sumprice = this.coffeeprice + 0.4;
            console.log("Add whipping cream. (+40p)");
        }
    }
    class Tea {
        constructor() {
            this.decaf = null;
            this.price = null;
        }
        TeaSvc() {
            if (this.decaf == true) {
                this.price = 1.95;
                console.log("Make a cup of decaf tea. (+£" + this.price.toFixed(2) + ")");
            } else {
                this.price = 1.75;
                console.log("Make a cup of tea. (+£" + this.price.toFixed(2) + ")");
            }
        }
    }
    class Cash {
        constructor() {
            this.amount = null;
            this.pay = null;
            this.change = null;
        }
        CashSvc() {
            console.log("Amount: £" + this.amount.toFixed(2));
            let total = this.pay;
            console.log("You have paid £" + total.toFixed(2));
            while (total < this.amount) {
                total += this.pay;
                console.log("You have paid £" + total.toFixed(2));
            }
            console.log("Payment Succeed.");
            this.change = total - this.amount;
        }
    }
    class Change {
        constructor() {
            this.change = null;
        }
        ChangeSvc() {
            console.log("Please take your change: £" + this.change.toFixed(2));
        }
    }

    var vm = new VM();
    vm.beverage = "coffee,tea";
    vm.coffeesize = "small";
    vm.teatype = true;
    vm.money = 1;
    vm.VMSvc();
});