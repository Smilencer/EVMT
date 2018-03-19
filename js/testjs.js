xmlDoc = `<family class="VendingMachine" service="VendingMachineSvc"><connector type="F-Sequencer" name="f-seq1" data="" interaction="(Card)card->|,(Change)change->(Cashback)cashback"><condition value="0"><vg type="Or"><connector type="F-Sequencer" name="f-seq2" data="" interaction=""><condition value="0"><vg type="Alternative"><component store="Atomic" class="Mocha" name="mocha" service="MochaSvc"></component><component store="Atomic" class="Latte" name="latte" service="LatteSvc"></component></vg></condition><condition value="1"><vg type="Optional"><component store="Atomic" class="Cream" name="cream" service="CreamSvc"></component></vg></condition></connector><component store="Atomic" class="Tea" name="tea" service="TeaSvc"></component></vg></condition><condition value="1"><vg type="Alternative"><component store="Atomic" class="Gift" name="gift" service="GiftSvc"></component><component store="Atomic" class="Cash" name="cash" service="CashSvc"></component><component store="Atomic" class="Card" name="card" service="CardSvc"></component></vg></condition><condition value="2"><vg type="Optional"><component store="Atomic" class="Change" name="change" service="ChangeSvc"></component></vg></condition></connector><dataChannel><inputs list="size,decaf,payment,moneyback"></inputs><outputs list=""></outputs><channel from="latte.price" to="cream.coffeeprice"></channel><channel from="latte.price" to="gift.amount"></channel><channel from="latte.price" to="cash.amount"></channel><channel from="latte.price" to="card.amount"></channel><channel from="mocha.price" to="cream.coffeeprice"></channel><channel from="mocha.price" to="gift.amount"></channel><channel from="mocha.price" to="cash.amount"></channel><channel from="mocha.price" to="card.amount"></channel><channel from="cream.sumprice" to="gift.amount"></channel><channel from="cream.sumprice" to="cash.amount"></channel><channel from="cream.sumprice" to="card.amount"></channel><channel from="tea.price" to="gift.amount"></channel><channel from="tea.price" to="cash.amount"></channel><channel from="tea.price" to="card.amount"></channel><channel from="cash.change" to="change.change"></channel><channel from="size" to="mocha.size"></channel><channel from="size" to="latte.size"></channel><channel from="decaf" to="tea.decaf"></channel><channel from="payment" to="cash.pay"></channel><channel from="moneyback" to="cashback.want"></channel></dataChannel><constraints><constraint type="exclude" from="gift" to="change"></constraint></constraints><interactions><fi store="Composite" class="Cashback" name="cashback" service="CashbackSvc"></fi></interactions></family>`;

$(document).ready(function() {
    class ExternalCarLight {
        constructor() {
            this.high_or_low = null;
            this.request_beam = null;
            this.request_power = null;
            this.request_cornering = null;
            this.request_fog = null;
            this.request_DRL = null;

            // PV:IFCOND(pv:hasFeature('LBX1'))
            this.LBX1 = new LowBeamXenon();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('LBH1'))
            this.LBH1 = new LowBeamHalogen();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('HBX1'))
            this.HBX1 = new HighBeamXenon();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('HBH1'))
            this.HBH1 = new HighBeamHalogen();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('SCL1') and pv:not(hasFeature('Fog')))
            this.SCL1 = new StaticCornerLight();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('AFL1'))
            this.AFL1 = new AdaptiveForwardLight();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('Cam'))
            this.Cam = new Camera();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('LBX2'))
            this.LBX2 = new LowBeamXenon();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('LBH2'))
            this.LBH2 = new LowBeamHalogen();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('HBX2'))
            this.HBX2 = new HighBeamXenon();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('HBH2'))
            this.HBH2 = new HighBeamHalogen();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('LS'))
            this.LS = new LightSensor();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('LBX3'))
            this.LBX3 = new LowBeamXenon();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('LBH3'))
            this.LBH3 = new LowBeamHalogen();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('SCL2') and pv:not(hasFeature('Fog')))
            this.SCL2 = new StaticCornerLight();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('AFL2'))
            this.AFL2 = new AdaptiveForwardLight();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('Fog') and pv:not(hasFeature('SCL1')) and pv:not(hasFeature('SCL2')))
            this.Fog = new FogLight();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('LB'))
            this.LB = new DRL_LowBeam();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('LED'))
            this.LED = new DRL_LED();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('Bulb'))
            this.Bulb = new DRL_Bulb();
            // PV:ENDCOND

        }
        activate() {
            // PV:IFCOND(pv:hasFeature('LBX1'))
            this.LBX1.request = this.LBX1.request == null ? this.request_beam : this.LBX1.request + this.request_beam;
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('LBH1'))
            this.LBH1.request = this.LBH1.request == null ? this.request_beam : this.LBH1.request + this.request_beam;
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('HBX1'))
            this.HBX1.request = this.HBX1.request == null ? this.request_beam : this.HBX1.request + this.request_beam;
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('HBH1'))
            this.HBH1.request = this.HBH1.request == null ? this.request_beam : this.HBH1.request + this.request_beam;
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('LBH1'))
            this.LBH1.power = this.LBH1.power == null ? this.request_power : this.LBH1.power + this.request_power;
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('HBH2'))
            this.HBH2.power = this.HBH2.power == null ? this.request_power : this.HBH2.power + this.request_power;
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('LBH2'))
            this.LBH2.power = this.LBH2.power == null ? this.request_power : this.LBH2.power + this.request_power;
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('HBH1'))
            this.HBH1.power = this.HBH1.power == null ? this.request_power : this.HBH1.power + this.request_power;
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('LBH3'))
            this.LBH3.power = this.LBH3.power == null ? this.request_power : this.LBH3.power + this.request_power;
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('SCFL1'))
            this.SCFL1.request = this.SCFL1.request == null ? this.request_cornering : this.SCFL1.request + this.request_cornering;
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('SCFL2'))
            this.SCFL2.request = this.SCFL2.request == null ? this.request_cornering : this.SCFL2.request + this.request_cornering;
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('SCL1') and pv:not(hasFeature('Fog')))
            this.SCL1.request = this.SCL1.request == null ? this.request_cornering : this.SCL1.request + this.request_cornering;
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('AFL1'))
            this.AFL1.request = this.AFL1.request == null ? this.request_cornering : this.AFL1.request + this.request_cornering;
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('Fog') and pv:not(hasFeature('SCL1')) and pv:not(hasFeature('SCL2')))
            this.Fog.request = this.Fog.request == null ? this.request_fog : this.Fog.request + this.request_fog;
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('LB'))
            this.LB.request = this.LB.request == null ? this.request_DRL : this.LB.request + this.request_DRL;
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('LED'))
            this.LED.request = this.LED.request == null ? this.request_DRL : this.LED.request + this.request_DRL;
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('Bulb'))
            this.Bulb.request = this.Bulb.request == null ? this.request_DRL : this.Bulb.request + this.request_DRL;
            // PV:ENDCOND

            if (this.high_or_low == "high") { // PV:IFCOND(pv:hasFeature('LBX1'))
                this.LBX1.toggleLight();
                // PV:ENDCOND
                // PV:IFCOND(pv:hasFeature('LBH1'))
                this.LBH1.toggleLight();
                // PV:ENDCOND
            } else if (this.high_or_low == "low") { // PV:IFCOND(pv:hasFeature('HBX1'))
                this.HBX1.toggleLight();
                // PV:ENDCOND
                // PV:IFCOND(pv:hasFeature('HBH1'))
                this.HBH1.toggleLight();
                // PV:ENDCOND
            }
            // PV:IFCOND(pv:hasFeature('LB') or pv:hasFeature('LED') or pv:hasFeature('Bulb'))
            // PV:IFCOND(pv:hasFeature('LB'))
            this.LB.toggleLight();
            // PV:ENDCOND

            // PV:IFCOND(pv:hasFeature('LED') or pv:hasFeature('Bulb'))
            // PV:IFCOND(pv:hasFeature('LED'))
            this.LED.toggleLight();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('Bulb'))
            this.Bulb.toggleLight();
            // PV:ENDCOND

            // PV:ENDCOND

            // PV:ENDCOND

            // PV:IFCOND(pv:hasFeature('SCL1') or pv:hasFeature('AFL1') or pv:hasFeature('Cam') or pv:hasFeature('LBX2') or pv:hasFeature('LBH2') or pv:hasFeature('HBX2') or pv:hasFeature('HBH2') or pv:hasFeature('LS') or pv:hasFeature('LBX3') or pv:hasFeature('LBH3') or pv:hasFeature('SCL2') or pv:hasFeature('AFL2'))

            // PV:IFCOND(pv:hasFeature('SCL1') or pv:hasFeature('AFL1'))
            // PV:IFCOND(pv:hasFeature('SCL1') and pv:not(hasFeature('Fog')))
            this.SCL1.toggleLight();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('SCL1') and pv:hasFeature('Fog'))
            this.SCFL1.toggleLight();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('AFL1'))
            this.AFL1.toggleLight();
            // PV:ENDCOND

            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('Cam'))
            this.Cam.detectCars();
            this.LBX2.request = this.LBX2.request == null ? this.Cam.request_low : this.LBX2.request + this.Cam.request_low;
            this.LBH2.request = this.LBH2.request == null ? this.Cam.request_low : this.LBH2.request + this.Cam.request_low;
            this.HBX2.request = this.HBX2.request == null ? this.Cam.request_high : this.HBX2.request + this.Cam.request_high;
            this.HBH2.request = this.HBH2.request == null ? this.Cam.request_high : this.HBH2.request + this.Cam.request_high;
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('LBX2'))
            this.LBX2.toggleLight();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('LBH2'))
            this.LBH2.toggleLight();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('HBX2'))
            this.HBX2.toggleLight();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('HBH2'))
            this.HBH2.toggleLight();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('LS'))
            this.LS.getLightLevel();
            this.LBX3.request = this.LBX3.request == null ? this.LS.trigger : this.LBX3.request + this.LS.trigger;
            this.LBH3.request = this.LBH3.request == null ? this.LS.trigger : this.LBH3.request + this.LS.trigger;
            this.SCL2.request = this.SCL2.request == null ? this.LS.trigger : this.SCL2.request + this.LS.trigger;
            this.AFL2.request = this.AFL2.request == null ? this.LS.trigger : this.AFL2.request + this.LS.trigger;
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('LBX3'))
            this.LBX3.toggleLight();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('LBH3'))
            this.LBH3.toggleLight();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('SCL2') and pv:not(hasFeature('Fog')))
            this.SCL2.toggleLight();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('SCL2') and pv:hasFeature('Fog'))
            this.SCFL2.toggleLight();
            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('AFL2'))
            this.AFL2.toggleLight();
            // PV:ENDCOND

            // PV:ENDCOND
            // PV:IFCOND(pv:hasFeature('Fog') and pv:not(hasFeature('SCL1')) and pv:not(hasFeature('SCL2')))
            this.Fog.toggleLight();
            // PV:ENDCOND

        }
    }
});