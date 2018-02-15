xmlDoc = `<family class="VendingMachine" service="VendingMachineSvc"><connector type="F-Sequencer" name="f-seq1" data="" interaction="(Card)card->|,(Change)change->(Cashback)cashback"><condition value="0"><vg type="Or"><connector type="F-Sequencer" name="f-seq2" data="" interaction=""><condition value="0"><vg type="Alternative"><component store="Atomic" class="Mocha" name="mocha" service="MochaSvc"></component><component store="Atomic" class="Latte" name="latte" service="LatteSvc"></component></vg></condition><condition value="1"><vg type="Optional"><component store="Atomic" class="Cream" name="cream" service="CreamSvc"></component></vg></condition></connector><component store="Atomic" class="Tea" name="tea" service="TeaSvc"></component></vg></condition><condition value="1"><vg type="Alternative"><component store="Atomic" class="Gift" name="gift" service="GiftSvc"></component><component store="Atomic" class="Cash" name="cash" service="CashSvc"></component><component store="Atomic" class="Card" name="card" service="CardSvc"></component></vg></condition><condition value="2"><vg type="Optional"><component store="Atomic" class="Change" name="change" service="ChangeSvc"></component></vg></condition></connector><dataChannel><inputs list="size,decaf,payment,moneyback"></inputs><outputs list=""></outputs><channel from="latte.price" to="cream.coffeeprice"></channel><channel from="latte.price" to="gift.amount"></channel><channel from="latte.price" to="cash.amount"></channel><channel from="latte.price" to="card.amount"></channel><channel from="mocha.price" to="cream.coffeeprice"></channel><channel from="mocha.price" to="gift.amount"></channel><channel from="mocha.price" to="cash.amount"></channel><channel from="mocha.price" to="card.amount"></channel><channel from="cream.sumprice" to="gift.amount"></channel><channel from="cream.sumprice" to="cash.amount"></channel><channel from="cream.sumprice" to="card.amount"></channel><channel from="tea.price" to="gift.amount"></channel><channel from="tea.price" to="cash.amount"></channel><channel from="tea.price" to="card.amount"></channel><channel from="cash.change" to="change.change"></channel><channel from="size" to="mocha.size"></channel><channel from="size" to="latte.size"></channel><channel from="decaf" to="tea.decaf"></channel><channel from="payment" to="cash.pay"></channel><channel from="moneyback" to="cashback.want"></channel></dataChannel><constraints><constraint type="exclude" from="gift" to="change"></constraint></constraints><interactions><fi store="Composite" class="Cashback" name="cashback" service="CashbackSvc"></fi></interactions></family>`;

$(document).ready(function () {
    class VendingMachine {
        constructor() {
            this.size = null;
            this.mocha = new Mocha();
            this.gift = new Gift();
        }
        VendingMachineSvc() {
            this.mocha.size = this.mocha.size == null ? this.size: this.mocha.size + this.size;
            this.mocha.MochaSvc();
            this.gift.amount = this.gift.amount == null ? this.mocha.price: this.gift.amount + this.mocha.price;
            this.gift.GiftSvc();
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
    class Gift {
        constructor() {
            this.amount = null;
        }
        GiftSvc() {
            console.log("Amount: £" + this.amount.toFixed(2));
            console.log("Please scan your gift voucher");
            console.log("...");
            console.log("Payment Succeed.");
        }
    }
    
    var vm = new VendingMachine();
    vm.size = "small";
    vm.VendingMachineSvc();
});