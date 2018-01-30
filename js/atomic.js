var editor;
var mydb;

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
    OpenDB();
    String.prototype.compress = function () {
        return this.replace(/[\r\n]/g,"").replace(/[ | ]*\n/g,'\n').replace(/\n[\s| | ]*\r/g,'\n').replace(/ /ig,'').replace(/^[\s　]+|[\s　]+$/g, "").replace(/\t+/g,'');
    }
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
    var radiolen = $(".ipt_radio:checked").length;
    if (radiolen == 0) {
        alert("Select input or output for the data.");
        return;
    }
    $("#tabler>table").children("tbody").append("<tr><td><a href='javascript:void(0)' onclick='removeData(this)'><img src='css/images/delete.svg' width='15' /></a></td><td>" + dname + "</td><td>" + $(".ipt_radio:checked").val() + "</td></tr>");
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
    str += "\tconstructor() {\n";

    for (let i = 1; i < rows.length; i++) {
        str += "\t\tthis." + $(rows[i]).children("td").eq(1).text() + ";\n"
    }
    str += "\t}\n";

    str += "\t" + srvname + "() {\n";
    str += "\t\t//TODO\n";
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

function runCode() {
    var code = editor.getValue();
    var testcode = $("#feedback").val();
    eval(code + testcode);
}

function deposit() {
    var sname = $("#ipt_sname").val().trim();
    if (sname == "") {
        alert("Component name is required.");
        closeDialog();
        return;
    }

    var rows = $("#tabler").find("tr");
    var arr_in = [];
    var arr_out = [];
    for (var i = 1; i < rows.length; i++) {
        var dname = $(rows[i]).children("td").eq(1).text();
        var dio = $(rows[i]).children("td").eq(2).text();
        if (dio == "input") {
            arr_in.push(dname);
        }
        else if (dio == "output") {
            arr_out.push(dname);
        }
    }

    var srvname = $("#ipt_srvname").val().trim();
    if (srvname == "") {
        alert("Service name is required.");
        closeDialog();
        return;
    }

    var code = editor.getValue().compress();
    if (code == "") {
        alert("Computation unit is required.");
        closeDialog();
        return;
    }

    var pack = {
        "name": sname,
        "service": srvname,
        "input": arr_in,
        "output": arr_out,
        "code": code
    };

    insertAtomic(pack);
}