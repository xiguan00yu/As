const f1rs = 1000 / 60

let wip = null,
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
function pop(ts = []) {
    return ts.pop()
}

// have time , continue work ?
function ht(dl) {
    return (dl?.timeRemaining?.() > 0 || As.ht(stm)) &&
        !(navigator?.scheduling?.isInputPending?.())
}

// start task
function st(dl) {
    stm = As.gt()
    let t = pop(ts)
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

function rco(fbr = {/** t, p, c, k, r, n, ets, fsibling, fparent, fchild */ }) {
    wip = fbr
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
    return null
}
// TODO
function cnf(n) {
    n = typeof n === 'string' ?
        ({ t: 'string', p: [], c: [], n }) :
        n
    return ({
        t: n.t,
        p: n.p,
        c: n.c,
        k: n.k,
        r: n.r,
        n: n.n,
        fsibling: null,
        fparent: null,
        fchild: null,
        ets: []
    })
}

function As() {
    // TODO
}
As.gt = function () {
    return performance.now()
}
As.ht = function (ltm) {
    return As.gt() - ltm < f1rs
}
As.r = function (nR, rV) {
    td(() => {
        fnp = cnf({ n: rV, c: [nR] })
        console.log(fnp)
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