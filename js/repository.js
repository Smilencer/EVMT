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
    insertDate(data, "Atomic");
}

function insertComposite(data) {
    insertDate(data, "Composite");
}

function insertDate(data, storeName) {
    var transaction = mydb.transaction(storeName, "readwrite");
    var objectStore = transaction.objectStore(storeName);
    var request = objectStore.put(data);
    request.onsuccess = function (e) {
        growl("Component is deposited!");
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
            liStr += "<span store='" + storeName + "' onclick='highlight(this)'>" + name + "</span></li>";
            $("#" + storeName + "Store").append(liStr);
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

function growl(msg) {
    $.growlUI("Operation Complete", msg);
}