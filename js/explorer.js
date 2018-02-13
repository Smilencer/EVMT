var xmlDoc = "";

$(document).ready(function () {
    //xmlDoc = window.opener.xmlDoc;
    xmlDoc = `<family class="VendingMachine" service="VendingMachineSvc"><connector type="F-Sequencer" name="f-seq1" data="" interation="(Card)card->|,(Change)change->(Cashback)cashback"><condition value="0"><vg type="Or"><connector type="F-Sequencer" name="f-seq2" data="" interation=""><condition value="0"><vg type="Alternative"><component store="Atomic" class="Mocha" name="mocha" service="MochaSvc"></component><component store="Atomic" class="Latte" name="latte" service="LatteSvc"></component></vg></condition><condition value="1"><vg type="Optional"><component store="Atomic" class="Cream" name="cream" service="CreamSvc"></component></vg></condition></connector><component store="Atomic" class="Tea" name="tea" service="TeaSvc"></component></vg></condition><condition value="1"><vg type="Alternative"><component store="Atomic" class="Gift" name="gift" service="GiftSvc"></component><component store="Atomic" class="Cash" name="cash" service="CashSvc"></component><component store="Atomic" class="Card" name="card" service="CardSvc"></component></vg></condition><condition value="2"><vg type="Optional"><component store="Atomic" class="Change" name="change" service="ChangeSvc"></component></vg></condition></connector><dataChannel><inputs list="size,decaf,payment,moneyback"></inputs><outputs list=""></outputs><channel from="latte.price" to="cream.coffeeprice"></channel><channel from="latte.price" to="gift.amount"></channel><channel from="latte.price" to="cash.amount"></channel><channel from="latte.price" to="card.amount"></channel><channel from="mocha.price" to="cream.coffeeprice"></channel><channel from="mocha.price" to="gift.amount"></channel><channel from="mocha.price" to="cash.amount"></channel><channel from="mocha.price" to="card.amount"></channel><channel from="cream.sumprice" to="gift.amount"></channel><channel from="cream.sumprice" to="cash.amount"></channel><channel from="cream.sumprice" to="card.amount"></channel><channel from="tea.price" to="gift.amount"></channel><channel from="tea.price" to="cash.amount"></channel><channel from="tea.price" to="card.amount"></channel><channel from="cash.change" to="change.change"></channel><channel from="size" to="mocha.size"></channel><channel from="size" to="latte.size"></channel><channel from="decaf" to="tea.decaf"></channel><channel from="payment" to="cash.pay"></channel><channel from="moneyback" to="cashback.want"></channel></dataChannel><constraints><constraint type="exclude" from="gift" to="change"></constraint></constraints><interactions><fi store="Composite" class="Cashback" name="cashback" service="CashbackSvc"></fi></interactions></family>`;
    var xmlTree = $(xmlDoc);
    var depthMap = assessDepth(xmlTree);
    var connectorMap = generateComposition(depthMap, xmlTree);
    var root = $(xmlTree).children("connector").attr("name");
    var rootSet = connectorMap.get(root);
    connectorMap.delete(root);
    var finalSet = combineComposition(connectorMap, rootSet);
    generateProductsXML(finalSet, xmlTree);
})

function assessDepth(xmlTree) {
    let depthMap = new Map();
    var connectorArray = $(xmlTree).find("connector");
    for (let connectorNode of connectorArray) {
        var subConnectorArray = $(connectorNode).find("connector");
        var len = subConnectorArray.length;
        if (depthMap.has(len)) {
            let arr = depthMap.get(len);
            arr.push($(connectorNode).attr("name"));
            depthMap.set(len, arr);
        }
        else {
            let arr = [];
            arr.push($(connectorNode).attr("name"));
            depthMap.set(len, arr);
        }
    }
    return new Map([...depthMap.entries()].sort());
}

function combineComposition(connectorMap, rootSet) {
    var isToEnd = true;
    let newSet = new Set();
    for (let [key, value] of connectorMap) {
        if ([...rootSet].join("+").split(/\+|,/).includes(key)) {
            isToEnd = false;
            for (let str of rootSet) {
                if (str.includes(key)) {
                    for (let arr of value) {
                        let result = str.replace(key, arr);
                        newSet.add(result);
                    }
                }
                else {
                    newSet.add(str);
                }
            }
        }
    }
    if (isToEnd) {
        return rootSet;
    }
    else {
        return combineComposition(connectorMap, newSet);
    }
}

function generateComposition(depthMap, xmlTree) {
    var connectorMap = new Map();
    for (let key of depthMap.keys()) {
        let valueArr = depthMap.get(key);
        for (let connectorName of valueArr) {
            let setArray = generateSubComposition(connectorName, xmlTree);
            let oneSet = filterOut(doCartesian(setArray), $(xmlTree).children("constraints"));
            let interations = $(xmlTree).find(`connector[name="${connectorName}"]`).attr("interation");
            if (interations != "") {
                oneSet = setInteraction(interations, oneSet);
            }
            connectorMap.set(connectorName, oneSet);
        }
    }
    return connectorMap;
}

function generateSubComposition(connectorName, xmlTree) {
    let setArray = [];
    let connector = $(xmlTree).find(`connector[name='${connectorName}']`);
    let condition = $(connector).children("condition");
    for (let item of condition) {
        if ($(item).children().is("vg")) {
            setArray.push(digNode($(item).children()));
        }
        else if ($(item).children().is("connector")) {
            let set = new Set();
            set.add($(item).children().attr("name"));
            setArray.push(set);
        }
        else if ($(item).children().is("component")) {
            let set = new Set();
            set.add($(item).children().attr("name"));
            setArray.push(set);
        }
    }
    return setArray;
}

function digNode(node) {
    if ($(node).is("component")) {
        let set = new Set();
        set.add($(node).attr("name"));
        return set;
    }
    else if ($(node).is("connector")) {
        let set = new Set();
        set.add($(node).attr("name"));
        return set;
    }
    else if ($(node).is("vg")) {
        switch ($(node).attr("type")) {
            case "Optional":
                return expandOptional(digNode($(node).children().eq(0)));
            case "Alternative":
                var arr = [];
                var vgChildren = $(node).children();
                for (let vgChild of vgChildren) {
                    arr.push(digNode(vgChild));
                }
                return expandAlternative(...arr);
            case "Or":
                var arr = [];
                var vgChildren = $(node).children();
                for (let vgChild of vgChildren) {
                    arr.push(digNode(vgChild));
                }
                return expandOr(...arr);
            default:
                break;
        }
    }
}

function expandOptional(oneSet) {
    oneSet.add("");
    return oneSet;
}

function expandAlternative(...mulptiSets) {
    let oneSet = new Set();
    for (let item of mulptiSets) {
        for (let v of item.values()) {
            oneSet.add(v);
        }
    }
    return oneSet;
}

function expandOr(...mulptiSets) {
    let oneSet = expandAlternative(...mulptiSets);
    var arr = [...oneSet];
    var listArr = [""];
    var result = [];
    for (var k = 0, len = arr.length; k < len; k++) {
        listArr.forEach(x => {
            listArr.push(x + "," + arr[k]);
        });
    }
    for (var n = 0; n < listArr.length; n++) {
        if (listArr[n] != "") {
            let str = listArr[n].replace(",", "");
            if (str.endsWith(",")) {
                str = str.substr(0, str.length - 1)
            }
            result.push(str);
        }
    }
    oneSet.clear();
    for (let item of result) {
        if (item != "") {
            let tempArr = item.split(",");
            oneSet.add([...new Set(tempArr)].sort().join(","))
        }
    }
    return oneSet;
}

function doCartesian(setArray) {
    var seed = setArray[0];
    for (let i = 1, len = setArray.length; i < len; i++) {
        seed = CartesianProducts(seed, setArray[i]);
    }
    return seed;
}

function CartesianProducts(set1, set2) {
    var set3 = new Set();
    for (let s1 of set1.values()) {
        for (let s2 of set2.values()) {
            if (s1 == "") {
                set3.add(s2);
            }
            else if (s2 == "") {
                set3.add(s1);
            }
            else {
                set3.add(s1 + "+" + s2);
            }
        }
    }
    return set3;
}

function filterOut(oneSet, constraintsTree) {
    for (let constraint of $(constraintsTree).children()) {
        let type = $(constraint).attr("type");
        let from = $(constraint).attr("from");
        let to = $(constraint).attr("to");
        if (type == "require") {
            for (let str of oneSet) {
                let arr = str.split(/\+|,/);
                if (arr.includes(from) && !arr.includes(to)) {
                    oneSet.delete(str);
                }
            }
        }
        if (type == "exclude") {
            for (let str of oneSet) {
                let arr = str.split(/\+|,/);
                if (arr.includes(from) && arr.includes(to)) {
                    oneSet.delete(str);
                }
            }
        }
    }
    return oneSet;
}

function setInteraction(interactions, oneSet) {
    var interactionArray = interactions.split(",");
    var newSet = new Set();
    for (let str of oneSet) {
        console.log(str);
        let arr = str.split(/\+|,/);
        let flag = true;
        for (let item of interactionArray) {
            let itemArr = item.split("->");
            let fromArr = itemArr[0].split(")");
            let oldName = fromArr[1];
            let newName = oldName;
            if (itemArr[1] != "|") {
                let toArr = itemArr[1].split(")");
                newName = toArr[1];
            }
            if (arr.includes(oldName)) {
                str = str.replace(new RegExp(`${oldName}`, "gm"), newName);
            }
            else {
                flag = false;
                newSet.add(str);
                break;
            }
        }
        if (flag) {
            newSet.add(str);
        }
    }
    return newSet;
}

function generateProductsXML(finalSet, xmlTree) {
    for (let config of finalSet) {
        let cloneTree = $(xmlTree).clone();
        let configArray = config.split(/\+|,/);
        let className = $(cloneTree).attr("class");
        let serviceName = $(cloneTree).attr("service");
        let productXML = $(`<product store="Composite" class="${className}" service="${serviceName}"></product>`);
        $(productXML).append($(cloneTree).children("connector"));
        $(productXML).append($(cloneTree).children("dataChannel"));
        let componentArray = $(productXML).find("component");
        for (let componentObj of componentArray) {
            if (!configArray.includes($(componentObj).attr("name"))) {
                $(componentObj).remove();
            }
        }
        let channelArray = $(productXML).find("channel");
        for (let channelObj of channelArray) {
            let from = $(channelObj).attr("from");
            let to = $(channelObj).attr("to");
            let fromArray = from.split(".");
            let toArray = to.split(".");
            let fromClass = fromArray[0];
            let toClass = toArray[0];
            if (fromArray.length == 1) {
                if (!configArray.includes(toClass)) {
                    $(channelObj).remove();
                }
            }
            else if (toArray.length == 1) {
                if (!configArray.includes(fromClass)) {
                    $(channelObj).remove();
                }
            }
            else {
                if (!configArray.includes(fromClass) || !configArray.includes(toClass)) {
                    $(channelObj).remove();
                }
            }
        }
        productXML = cleanJunkNode(productXML);
        let vgArray = $(productXML).find("vg");
        let index = 1;
        for (let vgObj of vgArray) {
            if ($(vgObj).attr("type") == "Or") {
                $(vgObj).wrapInner(`<connector type="Aggregator" name="Agg${index}" data="agg${index}"></connector>`);
                index++;
            }
            $(vgObj).children().unwrap();
        }
        let connectorArray = $(productXML).find("connector");
        for (let connectorObj of connectorArray) {
            let connectorType = $(connectorObj).attr("type");
            if (connectorType.startsWith("F-")) {
                $(connectorObj).attr("type", connectorType.slice(2));
            }
            connectorType = $(connectorObj).attr("type");
            if (connectorType == "Sequencer" || connectorType == "Selector" || connectorType == "Aggregator") {
                if ($(connectorObj).children().length == 1) {
                    let leaf = $(connectorObj).find("component");
                    $(connectorObj).replaceWith($(leaf));
                }
            }
        }
        console.log(configArray);
        console.log($(productXML)[0].outerHTML);
    }
}

function cleanJunkNode(productXML) {
    var doClean = function (tagName) {
        let subNodes = $(productXML).find(tagName);
        for (let obj of subNodes) {
            let result = $(obj).has("component");
            if ($(result).length == 0) {
                $(obj).remove();
            }
        }
    }
    doClean("connector");
    doClean("condition");
    doClean("vg");
    return productXML;
}