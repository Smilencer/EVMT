var stage;
var scene;
var currentObject = null;
var zoomlevel = 1;

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
});

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
        alert("Please select a composite component/connector first.");
        return;
    }
    if (element.objectType == "connector") {
        if (element.objectName == "Sequencer" || element.objectName == "Aggregator") {
            alert("Input cannot be added to Sequencer/Aggregator.");
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
    else if (element.objectType == "composite") {
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

function addInputInConnector(obj) {
    var name = $("#ipt_dataname").val().trim();
    if (name == "") {
        alert("Input name is required.");
        return;
    }
    var data = drawInputInBlock(scene.currentElement, name);
    //data.objectContainer = currentObject;
    closeDialog();
}

function addDataInComposite(obj) {
    var io = $(obj).parents("#NewDataDialog").find("font").eq(0).text().trim();
    var name = $("#ipt_dataname").val().trim();
    if (name == "") {
        alert(io + " name is required.");
        return;
    }
    var data = drawDataInComposite(io, name);
    closeDialog();
}

function addNewOutput() {
    var element = scene.currentElement;
    if (element == null) {
        alert("Please select a composite component first.");
        return;
    }
    if (element.objectType == "composite") {
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
        var flow = "this." + source.objectInstance;
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
            flow += "->this." + target.objectInstance;
            var channel = drawDataChannel(source.objectContainer, target.objectContainer, flow);
        }
        else if (target.objectName == "output" && target.objectContainer.objectType == "composite") {
            flow += "->this." + target.objectInstance;
            var channel = drawDataChannel(source.objectContainer, target, flow);
        }
    }
}