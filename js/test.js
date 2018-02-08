var editor;
var tester;

$(document).ready(function () {
    // editor = CodeMirror.fromTextArea(document.getElementById("code"), {
    //     mode: "javascript",
    //     lineNumbers: true,
    //     indentUnit: 4,
    //     indentWithTabs: true,
    //     lineWrapping: true,
    //     foldGutter: true,
    //     gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    //     matchBrackets: true,
    //     extraKeys: { "Ctrl-Space": "autocomplete" }
    // });
    // editor.setSize(535, 467);
    // $("#code").setTextareaCount();
    tester = CodeMirror.fromTextArea(document.getElementById("testArea"), {
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
    tester.setSize(414, 230);
    tester.setValue("//Test your code here...");
    String.prototype.compress = function () {
        return this.replace(/\s+/g, " ");
    }
    initCode();
    console.log = function (str) {
        if ($("#feedback").val() == "") {
            $("#feedback").val(str);
            return;
        }
        var t = $("#feedback").val() + "\n" + str;
        $("#feedback").val(t);
    }
});

function initCode() {
    var name = $(".highlight", window.opener.document).text();
    var storeName = $(".highlight", window.opener.document).attr("store");
    $("#cname").empty().append(name);
    opener.downloadCode(name, storeName, function (codeSet) {
        var codeArray = Array.from(codeSet);
        var code = codeArray.join(" ");
        code = code.replace(/^\s+/, '');
        code = js_beautify(code, 4, ' ');
        // editor.setValue(code);
        $("#code").val(code);
        $("#code").setTextareaCount();
    })
}

function reset() {
    tester.setValue("//Test your code here...");
    $("#feedback").val("");
}

function runCode() {
    var source_code = $("#code").val();
    var test_code = tester.getValue();
    eval(source_code + test_code);
}

function download() {
    downloadFile($("#cname").text() + ".js", $("#code").val().compress());
}

function downloadFile(fileName, content) {
    var eleLink = document.createElement('a');
    eleLink.download = fileName;
    eleLink.style.display = 'none';
    var blob = new Blob([content], { type: "text/javascript" });
    eleLink.href = URL.createObjectURL(blob);
    document.body.appendChild(eleLink);
    eleLink.click();
    document.body.removeChild(eleLink);
}