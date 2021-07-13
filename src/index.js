
const LANE = {
    DELET: 1 << 4,
    INIT: 1,
    MOUNT: 1 << 1,
    UPDATE: 1 << 2,
    DONE: 1 << 3
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
    // ??? TODO ssr
    // return wip === null && setTimeout(st)
}

// task add
function td(t = _ => _) {
    put(ts, t) && fst()
}

// reset working fbr
function rs(fbr) {
    wip = fbr
    wiI = 0
}

// move fbr ets Index
function ms() {
    wiI++
}

// is diff prevProps, nextProps ?
function difp(lp, np) {
    if (!lp || !np) return true

    let oks = Object.keys(lp),
        nks = Object.keys(np),
        k = null

    if (oks.length !== nks.length) return true

    for (let i = 0; i < oks.length; i++) {
        k = oks[i]
        if (lp[k] !== np[k]) {
            return true
        }
    }

    return false
}

function dift(lf, nf) {
    let t = typeof nf

    if (typeof lf !== t) return true

    if (t !== 'object') return lf !== nf

    return lf.t !== nf.t
}

function difo(lf, nf) {
    return dift(lf, nf) || difp(lf.p, nf.p)
}

// effect tree
function etf(fbr = {/** n, ets, fsibling, fparent, fchild */ }) {
    // find bottom fbr
    while (fbr && fbr.fchild && (fbr.fchild.l & LANE.MOUNT)) {
        fbr = fbr.fchild
    }
    rs(fbr)
    // effect ....
    while (fbr.ets[wiI]) {
        let et = fbr.ets[wiI]
        if (et.e && difp(et.lp, et.np)) {
            fbr.ets[wiI].rt = et.e()
        }
        ms()
    }
    fbr.l = LANE.DONE
    if (fbr.fsibling) {
        return etf.bind(null, fbr.fsibling)
    }
    if (fbr.fparent) {
        return etf.bind(null, fbr.fparent)
    }
    rs((fbr = null))
}

// commit dom
// insert dom
function cdf(fbr = {/** n, fsibling, fparent, fchild */ }) {

    const isWait = c => (c.l & LANE.INIT) || (c.l & LANE.UPDATE)

    loop:
    while (fbr && fbr.fparent) {
        while (fbr.fchild && isWait(fbr.fchild)) {
            fbr = fbr.fchild
        }

        let p = fbr.fparent,
            c = p.fchild,
            jfs = []
        // find mount dom
        while (p && p.n._jsx) {
            jfs.push(p)
            p = p.fparent
        }

        while (c) {
            if (c.fchild && isWait(c.fchild)) {
                fbr = c
                continue loop;
            }
            if (c.l & LANE.INIT) {
                c.l = LANE.MOUNT
                p.n.appendChild(c.n)
            }
            if (c.l & LANE.UPDATE) {
                if (!c.ln) {
                    throw Error('why ? no last node')
                }
                c.l = LANE.MOUNT
                p.n.replaceChild(c.n, c.ln)
                // p.n.insertBefore(c.n, c.ln)
                // p.n.removeChild(c.ln)
                c.ln = null
            }
            c = c.fsibling
        }
        // m layout 
        jfs.forEach(jp => (jp.l = LANE.MOUNT))
        // up up layout
        fbr = p
    }

    fbr && (fbr.l = LANE.MOUNT)
    return null
}

// create node fiber
// tree foreach
function rco(fbr = {/** t, p, c, k, r, n, ets, fsibling, fparent, fchild */ }) {
    // init -> create fchild
    if (!fbr.fchild && fbr.c.length > 0 && (fbr.l & LANE.INIT)) {
        fbr.fchild = cnf(fbr.c[0])
        fbr.fchild.fparent = fbr
        return rco.bind(null, fbr.fchild)
    }
    // init -> create fsibling
    if (!fbr.fsibling &&
        fbr.fparent &&
        (fbr.l & LANE.INIT) &&
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
    td(cdf.bind(null, fbr.fchild))
    // effect    
    td(etf.bind(null, fbr.fchild))

    return null
}

// wait update rc number
let urn = 0

// update node fiber
function urco(fbr, oldn, newn) {
    if (urn === 0 && fbr) {
        urn++
    }

    rs(fbr)

    let fc = fbr.fchild,
        fs = fbr.fsibling,
        fp = fbr.fparent,
        oca = oldn.c || [],
        nca = newn.c || [],
        isdft = dift(oldn, newn),
        isdfp = difp(oldn.p, newn.p)

        if (!(fbr.l & LANE.UPDATE)) {

        // update fbr
        if (isdft) {
            let self = fbr,
                n = fbr.n

            fbr = cnf(newn)
            fbr.ln = n

            fbr.fchild = fc
            fc && fc.fparent && (fc.fparent = fbr)

            fbr.fsibling = fs

            fbr.fparent = fp
            if (fp) {
                let pc = null, c = fp.fchild
                while (c && c !== self) {
                    pc = c
                    c = pc.fsibling
                }
                // c => fp.fchild
                if (c === self && c === fp.fchild) {
                    fp.fchild = fbr
                // c => fp.fsibling
                } else if (c === self && c !== fp.fchild) {
                    pc.fsibling = fbr
                }
            }

            fbr.l = LANE.UPDATE
        }

        fbr.c = nca

        // update dom
        if (!isdft && isdfp) {
            ue(fbr.n, oldn.p || {}, newn.p)
        }

    }

    // update diff fchild

    let nfc = fc,
        pfc = fc,
        ni = 0,
        ocl = oca.length,
        ncl = nca.length,
        difcb = [],
        forEach = (arr, func) => arr.forEach(func)

    while (ni < ocl || ni < ncl) {

        if (!oca[ni]) {
            let t = { fchild: null, fsibling: pfc, fparent: fbr }
            urn++
            difcb.push(urco.bind(null, t, oca[ni] || {}, nca[ni]))
        }
        else if (!nca[ni]) {
            nfc.l |= LANE.DELET
            urn++
            difcb.push(urco.bind(null, nfc, oca[ni], nca[ni] || {}))
        }
        else if (difo(oca[ni], nca[ni])) {
            urn++
            difcb.push(urco.bind(null, nfc, oca[ni], nca[ni]))
        }
        ni++
        pfc = nfc
        nfc = nfc?.fsibling
    }

    forEach(difcb, td)

    urn--

    td(() => {
        if (urn === 0 && !fbr.fchild) {
            let p = fbr
            while (p && p.fparent && (p.fparent.l & LANE.UPDATE)) {
                p = p.fparent
            }
            // commit node
            td(cdf.bind(null, p))
            // effect    
            td(etf.bind(null, p))
        }
    })

    rs(null)
}

// update dom props
function ue(dom, op, np) {
    for (let n in { ...op, ...np }) {
        let oV = op[n], nV = np[n]

        if (n === "style" && typeof nV === 'object') {
            for (const k in { ...oV, ...nV }) {
                // newV !== oldV
                if (!(oV && nV && oV[k] === nV[k])) {
                    dom[n][k] = nV?.[k] || ""
                }
            }
            continue;
        }

        // onClick ...
        // diff
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

// create dom and update dom props
function ce(fbr) {
    return fbr.t === "string"
        ? document.createTextNode(fbr.n)
        : ue(document.createElement(fbr.t), {}, fbr.p)
}

// create node filber object
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
            rs(f)
            f.p.c = f.p.c || f.c
            f.n = f.t(f.p)
            f.c = [f.n]
            break;
        default:
            break;
    }

    return f
}

function As() {
    // TODO
}
// function comp state
// eg : const [count,setCount] = us(0)
As.us = function (ins) {
    let cfb = wip,
        cT = cfb.ets[wiI]
    if (!cT) {
        cfb.ets[wiI] = cT = {
            s: typeof ins === 'function' ? ins() : ins
        }
    }
    ms()
    return [cT.s, (ns) => {
        ns = typeof ns === 'function' ? ns(cT.s) : ns
        if (ns !== cT.s) {
            cT.s = ns
            cfb.l = LANE.UPDATE

            rs(cfb)

            // new node
            let nn = cfb.t(cfb.p),
                // prev node
                pn = cfb.n

            cfb.n = nn

            td(urco.bind(null, cfb.fchild, pn, nn))
        }
    }]
}
// function comp update effect
As.ue = function (e = () => { }, np = []) {
    let cT = wip.ets[wiI]
    wip.ets[wiI] = { e, np, lp: cT?.np }
    ms()
}
// get current time
As.gt = function () {
    return typeof performance === 'undefined' ? Date.now() : performance.now()
}
// have work time ?
As.ht = function (ltm) {
    return As.gt() - ltm < f1rs
}
// render fbr to rootDom
As.r = function (nR, rV) {
    td(() => rco((
        fnp = cnf({ n: rV, c: [nR], l: LANE.INIT })
    )))
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