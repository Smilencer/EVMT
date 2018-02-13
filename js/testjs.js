$(document).ready(function () {
    class Cashback {
        constructor() {
            this.money = null;
            this.want = null;
            this.wantcash = new WantCash();
            this.change = new Change();
        }
        CashbackSvc() {
            this.wantcash.amount = null ? this.want : this.wantcash.amount + this.want;
            this.wantcash.WantCashSvc();
            this.money = null ? this.wantcash.cash : this.money + this.wantcash.cash;
            this.change.change = null ? this.wantcash.cash : this.change.change + this.wantcash.cash;
            if (this.money > 0) {
                this.change.ChangeSvc();
            }
        }
    }
    class WantCash {
        constructor() {
            this.amount = null;
            this.cash = null;
        }
        WantCashSvc() {
            if (this.amount <= 0) {
                return;
            }
            console.log("You are asking for £" + this.amount.toFixed(2) + " cash back.");
            console.log("Processing...");
            this.cash = this.amount;
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

    var cb = new Cashback();
    cb.want = 10;
    cb.CashbackSvc();
});