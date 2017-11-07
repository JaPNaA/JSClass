const EVT = {
        resize: function() {
            //
        }
    },
    D = {
        currentLesson: null,
        tests: [],
        tested: false,
        index: {}
    };

if (localStorage.JSClass) {
    D.currentLesson = JSON.parse(localStorage.JSClass);
}

function prompta(e) {
    var a = document.createElement("div");
    a.classList.add("prompta");
    a.innerHTML = e;
    document.body.appendChild(a);
    a.style.top = (innerHeight - a.clientHeight) / 2 + "px";
    a.style.left = (innerWidth - a.clientWidth) / 2 + "px";
    $("ev").style.filter = "blur(2px)";
    a.close = function() {
        if(!this.parentElement) return;
        this.parentElement.removeChild(this);
        $(".prompta") || ($("ev").style.filter = "none");
    };
    setTimeout(() => addEventListener("click", function(){
        a.close();
    }), 150);
    return a;
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
    })
        .then(function(f, r) {
            if (f && !r) {
                parse(f);
                p.close();
            } else {
                console.log(f, r);
                console.log("rejected");
            }
        })
        .catch(function(e) {
            debugger;
            prompta("Error while loading, \n" + e);
        });
}

function execute(e, a, b, ed) {
    if (a.children.length) {
        ed.classList.remove("noshow");
        b.innerHTML = "Run";
        b.classList.add("blue");
        b.classList.remove("red");
        while (a.children.length) {
            a.removeChild(a.children[0]);
        }
    } else {
        var f = document.createElement("iframe");
        f.src = "about:blank";
        a.appendChild(f);
        f.contentWindow.eval(e);
        var at = true;
        for (i of D.tests) {
            var r;
            try {
                r = f.contentWindow.eval(i.eval);
            } catch (e) {
                r = e;
            }
            if (
                !(r.constructor == window[i.expect.type] && r == i.expect.value)
            ) {
                at = false;
            }
        }
        if (at) {
            b.dispatchEvent(new Event("allowContinue"));
            D.tested = true;
        }
        ed.classList.add("noshow");
        b.innerHTML = "Stop";
        b.classList.remove("blue");
        b.classList.add("red");
    }
}

function parse(e) {
    var content = $("content");
    localStorage.JSClass = JSON.stringify(e.meta);
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
    D.tested = true;
    for (let i of e.content) {
        switch (i.type) {
            case "text":
                let d = $("<div></div>");
                d.innerHTML = i.dt;
                content.appendChild(d);
                break;
            case "code":
                D.tested = false;
                let a = document.createElement("div"),
                    b = ace.edit(a);
                a.classList.add("codeE");
                a.addEventListener(
                    "keydown",
                    e => e.keyCode == 83 && e.ctrlKey && e.preventDefault()
                );
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
                            d.addEventListener("allowContinue", function() {
                                $("#continueButton").classList.remove(
                                    "disabled"
                                );
                            });
                            e.appendChild(d);
                        }
                        if (i.tests) {
                            D.tests.push(i.tests);
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
    {
        let b = document.createElement("div"),
            a = document.createElement("button");
        b.classList.add("continueP");
        a.classList.add("continue");
        a.innerHTML = "<d>Continue</d>";
        a.classList.add("green");
        if (!(D.tested || !D.tests.length)) {
            a.classList.add("disabled");
        }
        b.appendChild(a);
        content.appendChild(b);
        a.id = "continueButton";
        a.addEventListener("click", function() {
            if (D.tested || !D.tests.length) {
                nextLesson();
            }
        });
    }
    D.currentLesson = e;
}

function nextLesson() {
    var nl = D.currentLesson.meta.i + 1,
        ld = D.index.find(function(e) {
            return e.i == nl;
        });
    launch(ld.s);
}

if (D.currentLesson) {
    $("#start [i='s']").classList.add("noshow");
} else {
    $("#start [i='c']").classList.add("noshow");
}

new Promise(function(resolve, reject) {
    var x = new XMLHttpRequest();
    x.open("GET", "index.json");
    x.responseType = "json";
    x.addEventListener("load", function() {
        resolve(x.response);
    });
    x.send();
}).then(function(r, e) {
    D.index = r;
    $("#start").addEventListener("click", function() {
        launch(r[D.currentLesson && D.currentLesson.i || 0].s);
    });
    $("#useCode").addEventListener("click", function() {
        var a = prompta("Enter code... <br><input id=\"codeEntry\">");
        a.$("#codeEntry").addEventListener("change", function(){
            var that = this,
                nl = D.currentLesson = D.index.find(function(e){
                return e.c == that.value;
            });
            if(!nl){
                let a = prompta("Not a real code");
                addEventListener("keydown", function(){
                    a.close();
                });
                return;
            }
            a.close();
            launch(nl.s);
        });
        a.$("#codeEntry").focus();
    });
    $("#browse").addEventListener("click", function(){
        var s = [];
        for(let i of D.index){
            s.push(i.n);
        }
        prompta(s.join("<br>")).style.textAlign = "left";
    });
});

for (let i in EVT) {
    addEventListener(i, EVT[i]);
}
EVT.resize();
