
const LANE = {
    INIT: 1,
    MOUNT: 1 << 1,
    DONE: 1 << 2
}

const f1rs = 1000 / 60

let wip = null,
    wiI = 0,
    fnp = null,
    ts = [],
    stm = 0,
    wmc = (function () {
        // ssr
        if (typeof window === 'undefined') {
            return fn => fn()
        } else if (typeof requestIdleCallback !== 'undefined') {
            return requestIdleCallback
        } else if (typeof requestAnimationFrame !== 'undefined') {
            return requestAnimationFrame
        } else if (typeof MessageChannel !== 'undefined') {
            const { port1, port2 } = new MessageChannel()
            return (st) => {
                port1.onmessage = st
                port2.postMessage(null)
            }
        }
    }())


// set stack top item
function put(ts = [], t) {
    return ts.push(t)
}

// pop stack top item
function shift(ts = []) {
    return ts.shift()
}

// have time , continue work ?
function ht(dl) {
    return (dl?.timeRemaining?.() > 0 || As.ht(stm)) &&
        !(navigator?.scheduling?.isInputPending?.())
}

// start task
function st(dl) {
    stm = As.gt()
    let t = shift(ts)
    while (t && ht(dl)) {
        t = t()
    }
    t && put(ts, t) && fst()
}

// into task loop func
function fst() {
    wmc?.(st)
    return wip === null && setTimeout(st)
}

// task add
function td(t = _ => _) {
    put(ts, t) && fst()
}

function rs(fbr) {
    wip = fbr
    wiI = 0
}

function difp(lp, np) {
    if (!lp || !np) return true

    if (lp.length !== np.length) return true

    for (let i = 0; i < lp.length; i++) {
        if (lp[i] !== np[i]) {
            return true
        }
    }

    return false
}


// effect tree
function etf(f = {/** n, ets, fsibling, fparent, fchild */ }) {
    // fbr = App fbr
    let fbr = f
    loop:
    while (fbr) {
        // find bottom fbr
        while (fbr && fbr.fchild && fbr.fchild.l & LANE.MOUNT) {
            fbr = fbr.fchild
        }
        rs(fbr)
        // effect ....
        while (fbr.ets[wiI]) {
            let et = fbr.ets[wiI]
            if (et.e && difp(et.lp, et.np)) {
                fbr.ets[wiI].rt = et.e()
            }
            wiI++
        }
        fbr.l = LANE.DONE
        if (fbr.fsibling) {
            fbr = fbr.fsibling
            continue loop;
        }
        if (fbr.fparent) {
            fbr = fbr.fparent
            continue loop;
        }
        rs((fbr = null))
    }
}

// commit dom
// insert dom
function cdf(fbr = {/** n, fsibling, fparent, fchild */ }) {
    // find bottom layout
    let fip = fbr
    while (fip.fchild) {
        fip = fip.fchild
    }
    loop:
    while (fip && fip.fparent) {
        // handle same layout
        let p = fip.fparent,
            c = p.fchild,
            jfs = []

        while (p && p.n._jsx) {
            jfs.push(p)
            p = p.fparent
        }

        while (c) {
            if (c.n.childNodes.length < c.c.length) {
                fip = c
                while (fip.fchild) {
                    fip = fip.fchild
                }
                continue loop
            }
            c.l = LANE.MOUNT
            p.n.appendChild(c.n)
            c = c.fsibling
        }
        // m layout 
        jfs.forEach(jp => (jp.l = LANE.MOUNT))
        // up up layout
        fip = p
    }
    return null
}

// create node fiber
// diff children
// tree foreach
function rco(fbr = {/** t, p, c, k, r, n, ets, fsibling, fparent, fchild */ }) {
    if (!fbr.fchild && fbr.c.length > 0) {
        fbr.fchild = cnf(fbr.c[0])
        fbr.fchild.fparent = fbr
        return rco.bind(null, fbr.fchild)
    }
    if (!fbr.fsibling &&
        fbr.fparent &&
        fbr.fparent.c.length > 1) {
        let cI = 0,
            total = fbr.fparent.c.length,
            dc = fbr.fparent.fchild
        while (cI < total) {
            cI++
            if (dc === fbr) {
                break
            }
            dc = dc.fsibling
        }
        if (cI < total) {
            // fbr !== fbr.fparent.c[last]
            fbr.fsibling = cnf(fbr.fparent.c[cI])
            fbr.fsibling.fparent = fbr.fparent
            return rco.bind(null, fbr.fsibling)
        }
    }

    if (fbr.fparent) {
        return rco.bind(null, fbr.fparent)
    }

    // commit node
    td(cdf.bind(null, fbr))
    // effect    
    td(etf.bind(null, fbr))

    return null
}

function ue(dom, op, np) {
    for (let n in { ...op, ...np }) {
        let oV = op[n], nV = np[n]

        if (n === "style" && !isStr(nV)) {
            for (const k in { ...oV, ...nV }) {
                // newV !== oldV
                if (!(oV && nV && oV[k] === nV[k])) {
                    dom[n][k] = nV?.[k] || ""
                }
            }
            continue;
        }

        // onClick ...
        if (n[0] === "o" && n[1] === "n") {
            n = n.slice(2).toLowerCase()
            if (oV) dom.removeEventListener(n, oV)
            dom.addEventListener(n, nV)
            continue;
        }

        // attr
        if (nV == null || nV === false) {
            dom.removeAttribute(n)
        } else {
            dom.setAttribute(n, nV)
        }
    }
    return dom
}

function ce(fbr) {
    return fbr.t === "string"
        ? document.createTextNode(fbr.n)
        : ue(document.createElement(fbr.t), {}, fbr.p)
}


function cnf(n) {
    n = typeof n === 'string' || typeof n === 'number' ?
        ({ t: 'string', p: [], c: [], n }) :
        n

    let f = {
        t: n.t,
        p: n.p,
        c: n.c,
        k: n.k,
        r: n.r,
        n: n.n,
        l: n.l || LANE.INIT,
        fsibling: null,
        fparent: null,
        fchild: null,
        ets: []
    }

    switch (typeof f.t) {
        case 'string':
            f.n = ce(f)
            break;
        case 'function':
            f.p.c = f.p.c || f.c
            f.n = n
            rs(f)
            f.c = [f.t(f.p)]
            break;
        default:
            break;
    }

    return f
}

function As() {
    // TODO
}
As.us = function (ins) {
    let cfb = wip,
        cT = cfb.ets[wiI]
    if (!cT) {
        cfb.ets[wiI] = cT = {
            s: typeof ins === 'function' ? ins() : ins
        }
    }
    wiI++
    return [cT.s, (ns) => {
        ns = typeof ns === 'function' ? ns(cT.s) : ns
        if (ns !== cT.s) {
            cT.s = ns
            // TODO
            rco(cfb)
        }
    }]
}
As.ue = function (e = () => { }, np = []) {
    let cT = wip.ets[wiI]
    wip.ets[wiI] = { e, np, lp: cT?.np }
    wiI++
}
As.gt = function () {
    return performance.now()
}
As.ht = function (ltm) {
    return As.gt() - ltm < f1rs
}
As.r = function (nR, rV) {
    td(() => {
        fnp = cnf({ n: rV, c: [nR], l: LANE.MOUNT })
        return rco(fnp)
    })
}
// t => type
// k => key
// r => ref
// p => props
// c => children
As.h = function (t, { k, r, ...p }, ...c) {
    return ({
        t,
        k,
        r,
        p,
        c
    })
}

export default As