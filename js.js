const EVT = {
        resize: function() {
            //
        }
    },
    D = {
        currentLesson: null
    };

function prompta(e) {
    var a = document.createElement("div");
    a.classList.add("prompta");
    a.innerHTML = e;
    document.body.appendChild(a);
    a.style.top = (innerHeight - a.clientHeight) / 2 + "px";
    a.style.left = (innerWidth - a.clientWidth) / 2 + "px";
    $("ev").style.filter = "blur(2px)";
    return {
        close: function() {
            document.body.removeChild(a);
            $("ev").style.filter = "none";
        }
    };
}

function launch(e) {
    var p = prompta("Loading...");
    new Promise(function(resolve, reject) {
        var x = new XMLHttpRequest();
        x.responseType = "json";
        x.open("GET", e);
        x.addEventListener("load", function() {
            resolve(x.response);
        });
        x.onerror = function(e) {
            reject(e);
        };
        x.send();
    }).then(function(f, r) {
        if (f && !r) {
            parse(f);
            p.close();
        } else {
            console.log(f, r);
            console.log("rejected");
        }
    }).catch(function(e){
        prompta("Error while loading, \n" + e);
    });
}

function execute(e, a, b, ed) {
    if(a.children.length){
        ed.classList.remove("noshow");
        b.innerHTML = "Run";
        b.classList.add("blue");
        b.classList.remove("red");
        while(a.children.length){
            a.removeChild(a.children[0]);
        }
    } else {
        var f = document.createElement("iframe");
        f.src =
            "data:text/html, <!DOCTYPE html><html><head><title>testing zone</title></head><body><script>" +
            e +
            "</script></body></html>";
        a.appendChild(f);
        ed.classList.add("noshow");
        b.innerHTML = "Stop";
        b.classList.remove("blue");
        b.classList.add("red");
    }
}

function parse(e) {
    var content = $("content");
    $("#title").innerHTML = e.title;

    while (content.children.length) {
        // clear
        content.removeChild(content.children[0]);
    }

    {
        let a = document.createElement("div");
        a.classList.add("passcode");
        a.innerHTML = e.meta.c;
        content.appendChild(a);
    }

    for (let i of e.content) {
        switch (i.type) {
            case "text":
                let d = $("<div></div>");
                d.innerHTML = i.dt;
                content.appendChild(d);
                break;
            case "code":
                let a = document.createElement("div"),
                    b = ace.edit(a);
                a.classList.add("codeE");
                a.addEventListener("keydown", e => (e.keyCode == 83 && e.ctrlKey) && e.preventDefault())
                a.value = i.dt;
                content.appendChild(
                    (function() {
                        var c = document.createElement("div"),
                            e = document.createElement("div");
                        c.classList.add("codeEP");
                        c.appendChild(a);
                        e.appendChild(c);
                        if (i.runable) {
                            let d = document.createElement("button"),
                                g = document.createElement("div");
                            g.classList.add("exe");
                            c.appendChild(g);
                            d.innerHTML = "<d>Run</d>";
                            d.classList.add("blue", "run");
                            d.addEventListener("click", function() {
                                execute(b.getValue(), g, d, a);
                            });
                            e.appendChild(d);
                        }
                        return e;
                    })()
                );
                b.setOptions({
                    showPrintMargin: false,
                    maxLines: Infinity,
                    fontSize: "75%",
                    readOnly: !i.editable
                });
                b.$blockScrolling = Infinity;
                b.setValue(i.dt || "", 1);
                b.setTheme("ace/theme/xcode");
                b.renderer.setOption();
                b.getSession().setMode("ace/mode/" + i.mode);
                b.focus();
                break;
            default:
                content.appendChild($("<div class=red>unknown item</div>"));
        }
    }
}

if (D.currentLesson) {
    $("#start [i='s']").classList.add("noshow");
} else {
    $("#start [i='c']").classList.add("noshow");
}

$("#start").addEventListener("click", function() {
    launch("test.json");
});

for (let i in EVT) {
    addEventListener(i, EVT[i]);
}
EVT.resize();
