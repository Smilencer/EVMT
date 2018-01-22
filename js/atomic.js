var editor;

$(document).ready(function () {
    editor = CodeMirror.fromTextArea(document.getElementById("code"), {
        mode: "javascript",
        lineNumbers: true,
        indentUnit: 4,
        indentWithTabs: true,
        lineWrapping: true,
        foldGutter: true,
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        matchBrackets: true,
        extraKeys: { "Ctrl-Space": "autocomplete" }
    });
});

function popDialog() {
    $.blockUI({
        message: $("#NewServiceDialog"),
        baseZ: 1000,
        cursorReset: "default",
        css: {
            textAlign: "unset",
            width: "425px",
            height: "404px",
            top: "20%",
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

function closeDialog() {
    $("#NewDomainDialog").remove();
    $.unblockUI();
}

function addData() {
    var sname = $("#ipt_sname").val().trim();
    if (sname == "") {
        alert("Service name is required.");
        return;
    }
    var dname = $("#ipt_dname").val().trim();
    if (dname == "") {
        alert("Data name is required.");
        return;
    }
    var dtype = $("#ipt_dtype").val().trim();
    if (dtype == "") {
        alert("Data type is required.");
        return;
    }
    var radiolen = $(".ipt_radio:checked").length;
    if (radiolen == 0) {
        alert("Select input or output for the data.");
        return;
    }
    $("#tabler>table").children("tbody").append("<tr><td><a href='javascript:void(0)' onclick='removeData(this)'><img src='css/images/delete.svg' width='15' /></a></td><td>" + dname + "</td><td>" + dtype + "</td><td>" + $(".ipt_radio:checked").val() + "</td></tr>");
}

function removeData(obj) {
    $(obj).parent().parent().remove();
}

function startCoding() {
    editor.setValue("");
    var sname = $("#ipt_sname").val().trim();
    if (sname == "") {
        alert("Component name is required.");
        return;
    }

    var srvname = $("#ipt_srvname").val().trim();
    if (srvname == "") {
        alert("Service name is required.");
        return;
    }

    var rows = $("#tabler").find("tr");
    var str = "class " + sname + " {\n";
    for (let i = 1; i < rows.length; i++) {
        if ($(rows[i]).children("td").eq(3).text() == "input") {
            str += "\tset " + $(rows[i]).children("td").eq(1).text() + " (value) {\n"
            str += "\t\tthis._" + $(rows[i]).children("td").eq(1).text() + " = value;\n";
            str += "\t}\n";
        }
    }

    str += "\tget " + srvname + " () {\n";
    str += "\t\t//TODO\n";
    str += "\t\treturn { "
    for (let i = 1, j = 1; i < rows.length; i++) {
        if ($(rows[i]).children("td").eq(3).text() == "output") {
            str += "\"" + $(rows[i]).children("td").eq(1).text() + "\": arg" + j.toString() + ", ";
            j++;
        }
    }
    str = str.substr(0, str.length - 2);
    str += " }\n";
    str += "\t}\n}";
    editor.setValue(str);
    $.unblockUI();
}

function reset() {
    editor.setValue("");
    $("#ipt_sname").val("");
    $("#ipt_srvname").val("");
    $("#ipt_dname").val("");
    $("#ipt_dtype").val("");
    $(".ipt_radio:checked")[0].checked = false;
    $("#tabler>table").children("tbody").children("tr").empty();
}
