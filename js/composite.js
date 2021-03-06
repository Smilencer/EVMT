﻿var stage;
var scene;
var currentObject = null;
var zoomlevel = 1;
var xmlDoc = "";

$(document).ready(function(e) {
    OpenDB();
    var canvas = document.getElementById("canvas");
    stage = new JTopo.Stage(canvas);
    scene = new JTopo.Scene();
    stage.add(scene);
    scene.mousedown(function(event) {
        if (currentObject != null) {
            currentObject.visible = false;
        }
    });
    scene.mouseup(function(event) {
        if (currentObject != null) {
            relocate();
        }
    });
    extendJTopo();
    String.prototype.replaceAll = function() {
        return this.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
    }
    String.prototype.compress = function() {
        return this.replace(/\s+/g, " ");
    }
});

function reset() {
    var msg = "Are you sure you want to remove everything?";
    if (confirm(msg) == true) {
        scene.clear();
        currentObject = null;
    } else {
        return false;
    }
}

function createCompositeService() {
    $.blockUI({
        message: $("#NewServiceDialog"),
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

function generateServiceName(obj) {
    if ($("#ipt_srvdefault").is(":checked")) {
        if ($(obj).val().trim() == "") {
            $("#ipt_srvname").val("");
        } else {
            $("#ipt_srvname").val($(obj).val().trim() + "Svc");
        }
    }
}

function nodefault() {
    if ($("#ipt_srvdefault").is(":checked")) {
        $("#ipt_srvname").attr("readonly", "true");
        if ($("#ipt_sname").val().trim() == "") {
            $("#ipt_srvname").val("");
        } else {
            $("#ipt_srvname").val($("#ipt_sname").val().trim() + "Svc");
        }
    } else {
        $("#ipt_srvname").removeAttr("readonly");
    }
}

function startComposite() {
    var name = $("#ipt_sname").val().trim();
    var service = $("#ipt_srvname").val().trim();
    if (name != "" && service != "") {
        currentObject = drawCurrentCompositeComponent(name, service);
        growl("Composite component is defined!");
        relocate();
    }
}

function closeDialog() {
    $("#ipt_domain").val("");
    $("#NewDataDialog").find("input").val("");
    $("#connectorMenu").hide();
    $.unblockUI();
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

function retrieveComponent() {
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

function addNewInput() {
    var element = scene.currentElement;
    if (element == null) {
        alert("Please select composite component/connector first.");
        return;
    }
    if (element.objectType == "connector") {
        if (element.objectName == "Sequencer") {
            alert("Input cannot be added to Sequencer.");
            return;
        }
        $("#NewDataDialog").find("font").text("Input");
        $("#NewDataDialog").find("button").show();
        $("#NewDataDialog").find("#ipt_datavalue").val("null").prop("disabled", false);
        $("#draw2").hide();
        $.blockUI({
            message: $("#NewDataDialog"),
            baseZ: 1000,
            cursorReset: "default",
            css: {
                textAlign: "unset",
                width: "295px",
                height: "187px",
                top: "35%",
                left: "40%",
                cursor: "default"
            },
            overlayCSS: {
                cursor: "default"
            }
        });
    } else if (element.objectType == "composite") {
        $("#NewDataDialog").find("font").text("Input");
        $("#NewDataDialog").find("button").show();
        $("#NewDataDialog").find("#ipt_datavalue").val("null").prop("disabled", false);
        $("#draw1").hide();
        $.blockUI({
            message: $("#NewDataDialog"),
            baseZ: 1000,
            cursorReset: "default",
            css: {
                textAlign: "unset",
                width: "295px",
                height: "187px",
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
    var dval = $("#ipt_datavalue").val().trim();
    if (name == "") {
        alert("Input name is required.");
        return;
    }
    var data = drawInputInConnector(scene.currentElement, name, dval);
    closeDialog();
}

function addDataInComposite(obj) {
    var io = $(obj).parents("#NewDataDialog").find("font").eq(0).text().trim();
    var name = $("#ipt_dataname").val().trim();
    var dval = $("#ipt_datavalue").val().trim();
    if (name == "") {
        alert(io + " name is required.");
        return;
    }
    var data = drawDataInComposite(io, name, dval);
    closeDialog();
}

function addNewOutput() {
    var element = scene.currentElement;
    if (element == null) {
        alert("Please select composite component first.");
        return;
    }
    if (element.objectType == "composite") {
        $("#NewDataDialog").find("font").text("Output");
        $("#NewDataDialog").find("button").show();
        $("#NewDataDialog").find("#ipt_datavalue").val("null").prop("disabled", true);
        $("#draw1").hide();
        $.blockUI({
            message: $("#NewDataDialog"),
            baseZ: 1000,
            cursorReset: "default",
            css: {
                textAlign: "unset",
                width: "295px",
                height: "187px",
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

function addNewLink() {
    var pair = scene.selectedElements;
    if (pair.length != 2) { return; }
    var source = pair[0];
    var target = pair[1];
    if (source.objectType == "connector") {
        if (target.objectType == "connector" || target.objectType == "subcomponent") {
            var link = drawCompositionEdge(source, target, "//TODO");
        }
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
    } else if (source.objectName == "output" && source.objectContainer.objectType == "subcomponent") {
        var flow = source.objectContainer.objectInstance + "." + source.objectInstance;
        if (target.objectName == "input" && target.objectContainer.objectType == "subcomponent") {
            flow += "->" + target.objectContainer.objectInstance + "." + target.objectInstance;
            var channel = drawDataChannel(source.objectContainer, target.objectContainer, flow);
        } else if (target.objectName == "input" && target.objectContainer.objectType == "connector") {
            flow += "->" + target.objectInstance;
            var channel = drawDataChannel(source.objectContainer, target.objectContainer, flow);
        } else if (target.objectName == "output" && target.objectContainer == currentObject) {
            flow += "->" + target.objectInstance;
            var channel = drawDataChannel(source.objectContainer, target, flow);
        }
    }
}

function generateXML() {
    var result = scene.findElements(function(e) {
        return e.objectType == "connector" && e.inLinks.length == 0;
    });
    if (result.length != 1) {
        alert("Invalid component!");
        return;
    }
    var root = result[0];
    xmlDoc = "<product store='Composite' class='" + currentObject.objectName + "' service='" + currentObject.objectService + "'>" + InsertNewNode(root) + generateChannels() + "</product>";
    growl("Composite component is generated!");
}

function InsertNewNode(node) {
    var nodeStr = "";
    if (node.objectType == "connector") {
        var dataStr = "";
        if (node.childs.length > 0) {
            var dataNameArr = [];
            for (let data of node.childs) {
                dataNameArr.push(data.objectInstance);
            }
            dataStr = dataNameArr.join(",");
        }
        nodeStr += "<connector type='" + node.objectName + "' name='" + node.objectInstance + "' data='" + dataStr + "'>";
        for (let link of node.outLinks) {
            nodeStr += "<condition value='" + link.text.replaceAll() + "'>";
            var target = link.nodeZ;
            nodeStr += InsertNewNode(target);
            nodeStr += "</condition>";
        }
        nodeStr += "</connector>";
    } else if (node.objectType == "subcomponent") {
        nodeStr += "<component store='" + node.objectStore + "' class='" + node.objectName + "' name='" + node.objectInstance + "' service='" + node.objectService + "'></component>";
    }
    return nodeStr;
}

function generateChannels() {
    var channelStr = "<dataChannel>";
    var result = scene.findElements(function(e) {
        return e.objectType == "data" && (e.objectContainer == currentObject || e.objectContainer.objectType == "connector");
    });
    if (result.length > 0) {
        var inputArray = [];
        var outputArray = [];
        for (let data of result) {
            if (data.objectName == "input") {
                inputArray.push(data.objectInstance + "=" + data.objectValue);
            } else if (data.objectName == "output") {
                outputArray.push(data.objectInstance + "=null");
            }
        }
        channelStr += `<inputs list="${inputArray.join(",")}"></inputs>`;
        channelStr += `<outputs list="${outputArray.join(",")}"></outputs>`;
    }
    var result = scene.findElements(function(e) {
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

function deposit() {
    if (currentObject == null) {
        alert("Please define the composite component.");
        return;
    }
    if (xmlDoc == "") {
        alert("Please generate the composite component first.");
        return;
    }
    var inputArray = $(xmlDoc).find("inputs").attr("list").split(",");
    let inputSet = new Set(inputArray);
    for (let item of inputSet) {
        if ($(xmlDoc).find(`channel[to="${item}"]`).length > 0) {
            inputSet.delete(item);
        }
    }
    var outputArray = $(xmlDoc).find("outputs").attr("list").split(",");
    var subComponentMap = new Map();
    var result = $(xmlDoc).find("component");
    for (let item of result) {
        subComponentMap.set($(item).attr("class"), $(item).attr("store"));
    }
    var code = generateCode(xmlDoc);

    var pack = {
        "name": currentObject.objectName,
        "service": currentObject.objectService,
        "input": [...inputSet],
        "output": outputArray,
        "subComponent": subComponentMap,
        "code": code.compress()
    };
    insertComposite(pack);
}