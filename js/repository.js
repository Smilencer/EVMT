$(document).contextmenu(function () {
    return false;
});

$(document).click(function () {
    $(".contextmenu").hide();
});

function OpenDB() {
    var request = indexedDB.open("Component Store");
    request.onerror = function (e) {
        console.log("Fail to open DB.");
    }
    request.onsuccess = function (e) {
        mydb = request.result;
        getAll();
    }
    request.onupgradeneeded = function (e) {
        mydb = request.result;
        if (!mydb.objectStoreNames.contains("Atomic")) {
            var objectStore = mydb.createObjectStore("Atomic", { keyPath: "name" });
        }
        if (!mydb.objectStoreNames.contains("Composite")) {
            var objectStore = mydb.createObjectStore("Composite", { keyPath: "name" });
        }
    }
}

function insertAtomic(data) {
    insertData(data, "Atomic");
}

function insertComposite(data) {
    insertData(data, "Composite");
}

function insertData(data, storeName) {
    var transaction = mydb.transaction(storeName, "readwrite");
    var objectStore = transaction.objectStore(storeName);
    var request = objectStore.put(data);
    request.onsuccess = function (e) {
        growl("Component is deposited!");
    }
}

function getData(name, storeName, instance) {
    var transaction = mydb.transaction(storeName, "readwrite");
    var objectStore = transaction.objectStore(storeName);
    var request = objectStore.get(name);
    request.onsuccess = function (e) {
        var data = e.target.result;
        var componentBlock = drawComponentBlock(data.name, storeName, instance, data.service);
        for (let i = 0, len = data.input.length; i < len; i++) {
            if (data.input[i] != "") {
                drawInputInBlock(componentBlock, data.input[i]);
            }
        }
        for (let i = 0, len = data.output.length; i < len; i++) {
            if (data.output[i] != "") {
                drawOutputInBlock(componentBlock, data.output[i]);
            }
        }
        growl("Component is retrieved!");
    }
    request.onerror = function (e) {
        console.log("Retrieve failed.");
    }
}

function getAllComponent(domArray, feedbackMethod) {
    var componentArray = [];
    var transaction = mydb.transaction(["Composite", "Atomic"], IDBTransaction.READ_ONLY);
    var CompositeStore = transaction.objectStore("Composite");
    var AtomicStore = transaction.objectStore("Atomic");
    for (let componentNode of domArray) {
        let storeName = $(componentNode).attr("store");
        let request;
        if (storeName == "Composite") {
            request = CompositeStore.get($(componentNode).attr("class"));
        }
        else if (storeName == "Atomic") {
            request = AtomicStore.get($(componentNode).attr("class"));
        }
        request.onsuccess = function (e) {
            let data = e.target.result;
            componentBlock = drawComponentBlock(data.name, storeName, $(componentNode).attr("name"), data.service);
            for (let i = 0, len = data.input.length; i < len; i++) {
                if (data.input[i] != "") {
                    drawInputInBlock(componentBlock, data.input[i]);
                }
            }
            for (let i = 0, len = data.output.length; i < len; i++) {
                if (data.output[i] != "") {
                    drawOutputInBlock(componentBlock, data.output[i]);
                }
            }
            componentArray.push(componentBlock);
        }
        request.onerror = function (e) {
            console.log("Retrieve failed.");
        }
    }
    transaction.oncomplete = function () {
        feedbackMethod(componentArray);
    }
}

function downloadProduct(domArray, feedbackMethod) {
    var code = new Set();
    var transaction = mydb.transaction(["Composite", "Atomic"], IDBTransaction.READ_ONLY);
    var CompositeStore = transaction.objectStore("Composite");
    var AtomicStore = transaction.objectStore("Atomic");
    for (let componentNode of domArray) {
        var getCode = function (name, storeName) {
            let request;
            if (storeName == "Composite") {
                request = CompositeStore.get(name);
            }
            else if (storeName == "Atomic") {
                request = AtomicStore.get(name);
            }
            request.onsuccess = function (e) {
                let data = e.target.result;
                code.add(data.code);
                if (storeName == "Composite") {
                    for (let [key, value] of data.subComponent) {
                        getCode(key, value);
                    }
                }
            }
            request.onerror = function (e) {
                console.log("Retrieve failed.");
            }
        }
        getCode($(componentNode).attr("class"), $(componentNode).attr("store"));
    }
    transaction.oncomplete = function () {
        feedbackMethod(code);
    }
}

function downloadBatch(productXMLMap, feedbackMethod) {
    var batchMap = new Map();
    var transaction = mydb.transaction(["Composite", "Atomic"], IDBTransaction.READ_ONLY);
    var CompositeStore = transaction.objectStore("Composite");
    var AtomicStore = transaction.objectStore("Atomic");
    for (let [productName, productXML] of productXMLMap) {
        let code = new Set();
        for (let componentNode of $(productXML).find("component")) {
            var getCode = function (name, storeName) {
                let request;
                if (storeName == "Composite") {
                    request = CompositeStore.get(name);
                }
                else if (storeName == "Atomic") {
                    request = AtomicStore.get(name);
                }
                request.onsuccess = function (e) {
                    let data = e.target.result;
                    code.add(data.code);
                    if (storeName == "Composite") {
                        for (let [key, value] of data.subComponent) {
                            getCode(key, value);
                        }
                    }
                }
                request.onerror = function (e) {
                    console.log("Retrieve failed.");
                }
            }
            getCode($(componentNode).attr("class"), $(componentNode).attr("store"));
        }
        let codeArray = Array.from(code);
        let codeStr = generateCode($(productXML)) + " " + codeArray.join(" ");
        batchMap.set(`${productName}.js`, codeStr);
    }
    transaction.oncomplete = function () {
        feedbackMethod(batchMap);
    }
}

function downloadCode(componentName, componentStoreName, feedbackMethod) {
    var code = new Set();
    var transaction = mydb.transaction(["Composite", "Atomic"], IDBTransaction.READ_ONLY);
    var CompositeStore = transaction.objectStore("Composite");
    var AtomicStore = transaction.objectStore("Atomic");
    var getCode = function (name, storeName) {
        if (storeName == "Composite") {
            let request = CompositeStore.get(name);
            request.onsuccess = function (e) {
                let data = e.target.result;
                code.add(data.code);
                for (let [key, value] of data.subComponent) {
                    getCode(key, value);
                }
            }
            request.onerror = function (e) {
                console.log("Download failed.");
            }
        }
        else if (storeName == "Atomic") {
            let request = AtomicStore.get(name);
            request.onsuccess = function (e) {
                let data = e.target.result;
                code.add(data.code);
            }
            request.onerror = function (e) {
                console.log("Download failed.");
            }
        }
    }
    getCode(componentName, componentStoreName);
    transaction.oncomplete = function () {
        feedbackMethod(code);
    }
}

function getAll() {
    cursorStore("Atomic");
    cursorStore("Composite");
}

function removeFromDB() {
    if ($(".highlight").attr("store") == "Atomic" || $(".highlight").attr("store") == "Composite") {
        var storeName = $(".highlight").attr("store");
        var name = $(".highlight").text();
        var msg = "Are you sure you want to remove \"" + name + "\"?\nThe removed component cannot be recovered.";
        if (confirm(msg) == true) {
            removeData(name, storeName);
        }
    }
}

function removeData(name, storeName) {
    var transaction = mydb.transaction(storeName, "readwrite");
    var objectStore = transaction.objectStore(storeName);
    var request = objectStore.delete(name);
    request.onsuccess = function (e) {
        growl("Component is deleted!");
        getAll();
    }
}

function cursorStore(storeName) {
    $("#" + storeName + "Store").empty();
    var transaction = mydb.transaction(storeName, "readwrite");
    var objectStore = transaction.objectStore(storeName);
    var request = objectStore.openCursor();
    request.onsuccess = function (e) {
        var cursor = e.target.result;
        if (cursor) {
            var name = cursor.value.name;
            var liStr = "<li><object data='css/images/service.svg' type='image/svg+xml'></object>";
            liStr += "<span store='" + storeName + "' onclick='highlight(this)' oncontextmenu='rightClick(this)'>" + name + "</span></li>";
            $("#" + storeName + "Store").append(liStr);
            cursor.continue();
        }
    }
}

function expandTab(obj) {
    var state = $(obj).attr("state");
    if (state == "off") {
        $(obj).attr("state", "on");
        $(obj).parents(".db-table").next("ul").show("blind", 500);
    }
    else {
        $(obj).attr("state", "off");
        $(obj).parents(".db-table").next("ul").hide("blind", 500);
    }
    highlight(obj);
}

function highlight(obj) {
    $(".highlight").removeClass("highlight");
    $(obj).addClass("highlight");
}

function rightClick(obj) {
    highlight(obj);
    var position = $(obj).offset();
    $("#repositoryContext").css({
        top: position.top,
        left: position.left + $(obj).width()
    }).show();
}

function growl(msg) {
    $.growlUI("Operation Complete", msg);
}

function openTestWindow() {
    if ($(".highlight").length == 0 || $(".highlight").parents("ul").length == 0) {
        alert("Please select a component in the repository.")
        return;
    }
    window.open("test.html", "test", `location=no,toolbar=no,height=${screen.height},width=${screen.width}`);
}

function godownload() {
    if ($(".highlight").length == 0 || $(".highlight").parents("ul").length == 0) {
        alert("Please select a component in the repository.")
        return;
    }
    downloadCode($(".highlight").text(), $(".highlight").attr("store"), function (codeSet) {
        var codeArray = Array.from(codeSet);
        var code = codeArray.join(" ");
        downloadFile($(".highlight").text() + ".js", code);
    });
}