var stage;
var scene;
var currentObject = null;
var zoomlevel = 1;
var xmlDoc = "";

$(document).ready(function (e) {
    OpenDB();
    var canvas = document.getElementById("canvas");
    stage = new JTopo.Stage(canvas);
    scene = new JTopo.Scene();
    stage.add(scene);
    scene.mousedown(function (event) {
        if (currentObject != null) {
            currentObject.visible = false;
        }
    });
    scene.mouseup(function (event) {
        if (currentObject != null) {
            relocate();
        }
    });
    extendJTopo();
    String.prototype.replaceAll = function () {
        return this.replace(/&/g, "&amp;").replace(/</g, "&lt;	").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
    }
    String.prototype.compress = function () {
        return this.replace(/\s+/g, " ");
    }
});

function createFamily() {
    $.blockUI({
        message: $("#NewFamilyDialog"),
        baseZ: 1000,
        cursorReset: "default",
        css: {
            textAlign: "unset",
            width: "425px",
            height: "179px",
            top: "30%",
            cursor: "default"
        },
        overlayCSS: {
            cursor: "default"
        }
    });
}

function generateFamilyName(obj) {
    if ($("#ipt_srvdefault").is(":checked")) {
        if ($(obj).val().trim() == "") {
            $("#ipt_srvname").val("");
        }
        else {
            $("#ipt_srvname").val($(obj).val().trim() + "Svc");
        }
    }
}

function nodefault() {
    if ($("#ipt_srvdefault").is(":checked")) {
        $("#ipt_srvname").attr("readonly", "true");
        if ($("#ipt_sname").val().trim() == "") {
            $("#ipt_srvname").val("");
        }
        else {
            $("#ipt_srvname").val($("#ipt_sname").val().trim() + "Svc");
        }
    }
    else {
        $("#ipt_srvname").removeAttr("readonly");
    }
}

function startFamily() {
    var name = $("#ipt_sname").val().trim();
    var service = $("#ipt_srvname").val().trim();
    if (name != "" && service != "") {
        currentObject = drawCurrentFamily(name, service);
        growl("Family is defined!");
        relocate();
    }
}

function reset() {
    var msg = "Are you sure you want to remove everything?";
    if (confirm(msg) == true) {
        scene.clear();
        currentObject = null;
    }
    else {
        return false;
    }
}

function retrieve() {
    if (currentObject == null) {
        alert("Please define the composite component first.")
        return;
    }
    if ($(".highlight").length == 0 || $(".highlight").parents("ul").length == 0) {
        alert("Please select a component in the repository.")
        return;
    }
    $("#ipt_cname").val("");
    $.blockUI({
        message: $("#NewComponentName"),
        baseZ: 1000,
        cursorReset: "default",
        css: {
            textAlign: "unset",
            width: "277px",
            height: "157px",
            top: "35%",
            left: "40%",
            cursor: "default"
        },
        overlayCSS: {
            cursor: "default"
        }
    });
}

function retrieveComponent(obj) {
    var instance = $("#ipt_cname").val().trim();
    if (instance == "") {
        alert("The name is required.");
        return;
    }
    var name = $(".highlight").text();
    var storeName = $(".highlight").attr("store");
    getData(name, storeName, instance);
}

function addNewConnector(name) {
    if (currentObject == null) {
        alert("Please define the composite component first.")
        return;
    }
    $("#NewConnectorDialog").find("font").text(name);
    $.blockUI({
        message: $("#NewConnectorDialog"),
        baseZ: 1000,
        cursorReset: "default",
        css: {
            textAlign: "unset",
            width: "277px",
            height: "157px",
            top: "35%",
            left: "40%",
            cursor: "default"
        },
        overlayCSS: {
            cursor: "default"
        }
    });
}

function closeDialog() {
    $("#ipt_domain").val("");
    $("#NewDataDialog").find("input").val("");
    $("#connectorMenu").hide();
    $(".contextmenu").hide();
    $.unblockUI();
}

function drawNewConnector(obj) {
    var instance = $("#ipt_domain").val().trim();
    if (instance == "") {
        alert("Connector name is required.");
        return;
    }
    var name = $(obj).parents("#NewConnectorDialog").find("font").text();
    var conn = drawConnector(name, instance);
    closeDialog();
}

function addNewVG(name) {
    if (currentObject == null) {
        alert("Please define the family first.")
        return;
    }
    drawVariationGenerator(name);
}

function addNewInput() {
    var element = scene.currentElement;
    if (element == null) {
        alert("Please select family/connector first.");
        return;
    }
    if (element.objectType == "connector") {
        if (element.objectName == "F-Sequencer") {
            alert("Input cannot be added to F-Sequencer.");
            return;
        }
        $("#NewDataDialog").find("font").text("Input");
        $("#NewDataDialog").find("button").show();
        $("#draw2").hide();
        $.blockUI({
            message: $("#NewDataDialog"),
            baseZ: 1000,
            cursorReset: "default",
            css: {
                textAlign: "unset",
                width: "295px",
                height: "157px",
                top: "35%",
                left: "40%",
                cursor: "default"
            },
            overlayCSS: {
                cursor: "default"
            }
        });
    }
    else if (element.objectType == "family") {
        $("#NewDataDialog").find("font").text("Input");
        $("#NewDataDialog").find("button").show();
        $("#draw1").hide();
        $.blockUI({
            message: $("#NewDataDialog"),
            baseZ: 1000,
            cursorReset: "default",
            css: {
                textAlign: "unset",
                width: "295px",
                height: "157px",
                top: "35%",
                left: "40%",
                cursor: "default"
            },
            overlayCSS: {
                cursor: "default"
            }
        });
    }
}

function addNewOutput() {
    var element = scene.currentElement;
    if (element == null) {
        alert("Please select family first.");
        return;
    }
    if (element.objectType == "family") {
        $("#NewDataDialog").find("font").text("Output");
        $("#NewDataDialog").find("button").show();
        $("#draw1").hide();
        $.blockUI({
            message: $("#NewDataDialog"),
            baseZ: 1000,
            cursorReset: "default",
            css: {
                textAlign: "unset",
                width: "295px",
                height: "157px",
                top: "35%",
                left: "40%",
                cursor: "default"
            },
            overlayCSS: {
                cursor: "default"
            }
        });
    }
}

function addInputInConnector() {
    var name = $("#ipt_dataname").val().trim();
    if (name == "") {
        alert("Input name is required.");
        return;
    }
    var data = drawInputInBlock(scene.currentElement, name);
    closeDialog();
}

function addDataInFamily(obj) {
    var io = $(obj).parents("#NewDataDialog").find("font").eq(0).text().trim();
    var name = $("#ipt_dataname").val().trim();
    if (name == "") {
        alert(io + " name is required.");
        return;
    }
    var data = drawDataInFamily(io, name);
    closeDialog();
}

function addNewLink() {
    var pair = scene.selectedElements;
    if (pair.length != 2) { return; }
    var source = pair[0];
    var target = pair[1];
    if (source.objectType == "connector") {
        if (target.objectType == "connector" || target.objectType == "subcomponent" || target.objectType == "generator") {
            var link = drawCompositionEdge(source, target, "//TODO");
        }
    }
    else if (source.objectType == "generator") {
        if (target.objectType == "connector" || target.objectType == "subcomponent" || target.objectType == "generator") {
            var link = drawVariationEdge(source, target, "//TODO");
        }
    }
}

function addConstraint(constraint) {
    var pair = scene.selectedElements;
    if (pair.length != 2) { return; }
    var source = pair[0];
    var target = pair[1];
    if (source.objectType == "subcomponent" && target.objectType == "subcomponent") {
        drawConstraintEdge(source, target, constraint);
    }
}

function addNewChannel() {
    var pair = scene.selectedElements;
    if (pair.length != 2) { return; }
    var source = pair[0];
    var target = pair[1];
    if (source.objectType != "data" || target.objectType != "data") { return; }
    if (source.objectName == "input" && source.objectContainer == currentObject) {
        var flow = source.objectInstance;
        if (target.objectName == "input" && target.objectContainer.objectType == "subcomponent") {
            flow += "->" + target.objectContainer.objectInstance + "." + target.objectInstance;
            var channel = drawDataChannel(source, target.objectContainer, flow);
        }
    }
    else if (source.objectName == "output" && source.objectContainer.objectType == "subcomponent") {
        var flow = source.objectContainer.objectInstance + "." + source.objectInstance;
        if (target.objectName == "input" && target.objectContainer.objectType == "subcomponent") {
            flow += "->" + target.objectContainer.objectInstance + "." + target.objectInstance;
            var channel = drawDataChannel(source.objectContainer, target.objectContainer, flow);
        }
        else if (target.objectName == "input" && target.objectContainer.objectType == "connector") {
            flow += "->" + target.objectInstance;
            var channel = drawDataChannel(source.objectContainer, target.objectContainer, flow);
        }
        else if (target.objectName == "output" && target.objectContainer == currentObject) {
            flow += "->" + target.objectInstance;
            var channel = drawDataChannel(source.objectContainer, target, flow);
        }
    }
}

function generateXML() {
    var result = scene.findElements(function (e) {
        return e.objectType == "connector" && e.inLinks.length == 0;
    });
    if (result.length != 1) {
        alert("Invalid family!");
        return;
    }
    var root = result[0];
    xmlDoc = `<family class="${currentObject.objectName}" service="${currentObject.objectService}">${InsertNewNode(root)}${generateChannels()}${generateConstraints()}${generateInteractionComponents()}</family>`;
    growl("Family is generated!");
}

function InsertNewNode(node) {
    var nodeStr = "";
    if (node.objectType == "connector") {
        var dataStr = "";
        let interactionSet = new Set();
        if (node.childs.length > 0) {
            var dataNameArr = [];
            for (let data of node.childs) {
                if (data.objectType == "data") {
                    dataNameArr.push(data.objectInstance);
                }
                else if (data.objectType == "interaction") {
                    interactionSet.add(data.objectInstance);
                }
            }
            dataStr = dataNameArr.join(",");
        }
        var interactionStr = [...interactionSet].join("@");
        nodeStr += `<connector type="${node.objectName}" name="${node.objectInstance}" data="${dataStr}" interaction="${interactionStr}">`;
        for (let link of node.outLinks) {
            nodeStr += `<condition value="${link.text.replaceAll()}">${InsertNewNode(link.nodeZ)}</condition>`;
        }
        nodeStr += "</connector>";
    }
    else if (node.objectType == "generator") {
        let cardStr = "";
        if (node.objectCardinality != null) {
            cardStr = ` cardinality="${node.objectCardinality}"`;
        }
        nodeStr += `<vg type="${node.objectName}"${cardStr}>`;
        for (let link of node.outLinks) {
            nodeStr += InsertNewNode(link.nodeZ);
        }
        nodeStr += "</vg>";
    }
    else if (node.objectType == "subcomponent") {
        nodeStr += `<component store="${node.objectStore}" class="${node.objectName}" name="${node.objectInstance}" service="${node.objectService}"></component>`;
    }
    return nodeStr;
}

function generateChannels() {
    var channelStr = "<dataChannel>";
    var result = scene.findElements(function (e) {
        return e.objectType == "data" && (e.objectContainer == currentObject || e.objectContainer.objectType == "connector");
    });
    if (result.length > 0) {
        var inputArray = [];
        var outputArray = [];
        for (let data of result) {
            if (data.objectName == "input") {
                inputArray.push(data.objectInstance);
            }
            else if (data.objectName == "output") {
                outputArray.push(data.objectInstance);
            }
        }
        channelStr += `<inputs list="${inputArray.join(",")}"></inputs>`;
        channelStr += `<outputs list="${outputArray.join(",")}"></outputs>`;
    }
    var result = scene.findElements(function (e) {
        return e.elementType == "link" && e.objectType == "channel";
    });
    if (result.length > 0) {
        for (let channel of result) {
            var pair = channel.text.split("->");
            channelStr += `<channel from="${pair[0]}" to="${pair[1]}"></channel>`;
        }
    }
    channelStr += "</dataChannel>";
    return channelStr;
}

function generateConstraints() {
    var constraintStr = "<constraints>";
    var result = scene.findElements(function (e) {
        return e.elementType == "link" && e.objectType == "constraint";
    });
    if (result.length > 0) {
        for (let constraint of result) {
            constraintStr += `<constraint type="${constraint.objectName}" from="${constraint.nodeA.objectInstance}" to="${constraint.nodeZ.objectInstance}"></constraint>`;
        }
    }
    constraintStr += "</constraints>";
    return constraintStr;
}

function generateInteractionComponents() {
    var interactionStr = "<interactions>";
    var result = scene.findElements(function (e) {
        return e.elementType == "link" && e.objectType == "fiEdge";
    });
    if (result.length > 0) {
        for (let fi of result) {
            var node = fi.nodeZ;
            interactionStr += `<fi store="${node.objectStore}" class="${node.objectName}" name="${node.objectInstance}" service="${node.objectService}"></fi>`;
        }
    }
    interactionStr += "</interactions>"
    return interactionStr;
}

function setInteraction() {
    if (currentObject == null) {
        alert("Please define the composite component first.")
        return;
    }
    var elementArray = scene.selectedElements;
    if (elementArray.length < 2) {
        alert("Please choose at least two components.")
        return;
    }
    $(".contentDiv>ol").empty();
    var result = scene.findElements(function (e) {
        return e.objectType == "subcomponent" && e.selected == false;
    });
    var optionStr = ``;
    for (let opt of result) {
        optionStr += `<option value="${opt.text}">component</option>`;
    }
    var i = 0;
    for (let element of elementArray) {
        if (element.objectType != "subcomponent") {
            alert("The interaction only happens with components.")
            return;
        }
        i++;
        let liStr = `<li><span>${element.text}</span><font>--></font><input type="text" list="inter${i}" id="ip${i}"><datalist id="inter${i}">${optionStr}</datalist></li>`;
        $(".contentDiv>ol").append(liStr);
    }
    $.blockUI({
        message: $("#InteractionDiv"),
        baseZ: 1000,
        cursorReset: "default",
        css: {
            textAlign: "unset",
            width: "527px",
            height: "308px",
            top: "20%",
            left: "30%",
            cursor: "default"
        },
        overlayCSS: {
            cursor: "default"
        }
    });
}

function createInteraction() {
    var data = [];
    var fiComponents = [];
    for (let liObj of $(".contentDiv li")) {
        let str = $(liObj).children("input").val();
        if (str == "") {
            str = "|";
        }
        else {
            fiComponents.push(str);
        }
        data.push(`${$(liObj).children("span").text()}->${str}`);
    }
    var elementArray = scene.selectedElements;
    var ancestorArray = [];
    for (let element of elementArray) {
        let arr = [];
        ancestorArray.push(new Set(findAncestor(element, arr)));
    }
    var id = [...intersectionSet(ancestorArray)][0];
    var result = scene.findElements(function (e) {
        return e.objectType == "connector" && e._id == id;
    });
    var fi = drawFeatureInteraction(result[0], data.join(","));
    for (let fiComponent of fiComponents) {
        result = scene.findElements(function (e) {
            return e.objectType == "subcomponent" && e.text == fiComponent;
        });
        drawFeatureInteractionEdge(fi, result[0]);
    }
    closeDialog();
}

function findAncestor(node, arr) {
    var links = node.inLinks;
    if (links.length == 0) {
        return arr;
    }
    var useful = links.filter(link => link.objectType != "constraint");
    var father = useful[0].nodeA;
    if (father.objectType == "connector") {
        arr.push(father._id);
    }
    return findAncestor(father, arr);
}

function intersectionSet(ancestorArray) {
    var setA = ancestorArray[0];
    for (var i = 1, len = ancestorArray.length; i < len; i++) {
        var setB = ancestorArray[i];
        setA = new Set([...setA].filter(x => setB.has(x)));
    }
    return setA;
}

function explorer() {
    if (xmlDoc == "") {
        alert("Please generate the composite component first.");
        return;
    }
    window.open("explorer.html", "explorer", `location=no,toolbar=no,height=${screen.height},width=${screen.width}`);
}

function setCardinality() {
    var orNode = scene.currentElement;
    $("#ipt_min").attr("max", orNode.outLinks.length - 1);
    $("#ipt_max").attr("max", orNode.outLinks.length);
    $.blockUI({
        message: $("#NewCardinalityDialog"),
        baseZ: 1000,
        cursorReset: "default",
        css: {
            textAlign: "unset",
            width: "252px",
            height: "179px",
            top: "35%",
            left: "40%",
            cursor: "default"
        },
        overlayCSS: {
            cursor: "default"
        }
    });
}

function restoreCardinality() {
    var orNode = scene.currentElement;
    orNode.objectCardinality = null;
    orNode.alarm = `<1..*>`;
    closeDialog();
}

function setMax() {
    var min = parseInt($("#ipt_min").val(), 10);
    min++;
    var max = parseInt($("#ipt_max").val(), 10);
    $("#ipt_max").attr("min", min);
    if (max <= min) {
        $("#ipt_max").val(min)
    }
}

function confirmCardinality() {
    var orNode = scene.currentElement;
    var content = $("#ipt_min").val() + ".." + $("#ipt_max").val();
    orNode.objectCardinality = content;
    orNode.alarm = `<${content}>`;
    closeDialog();
}

function switchButton(){
    if($("#explorer").is(":visible")){
        $("#explorer").hide();
        $("#annotation").show();
    }
    else{
        $("#annotation").hide();
        $("#explorer").show();
    }
}