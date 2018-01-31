$(document).ready(function () {
    class A {
        constructor() {
            this.b = new B();
            this.c = new C();
            this.agg1;
        }
        ASvc() {
            let args = this.agg1.split(",");
            for (let arg of args) {
                if (arg == "B") {
                    this.b.BSvc();
                    alert("123");
                }
                if (arg == "C") {
                    this.c.CSvc();
                    alert("456");
                }
            }
        }
    }

    class B {
        BSvc() {
            console.log("BSvc!!!");
        }
    }

    class C {
        CSvc() {
            console.log("CSvc!!!");
        }
    }

    var a = new A();
    a.agg1 = "B,C";
    a.ASvc();
});