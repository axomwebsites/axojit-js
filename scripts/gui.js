let guirootcontainer = null;
let editmode = true;
let allinstances = [];

function getcontainer() {
    if (!guirootcontainer) guirootcontainer = document.getElementById('guicontainer');
    return guirootcontainer;
}

class udim2 {
    constructor(scale, offset, scale2, offset2) {
        this.x = { scale: scale || 0, offset: offset || 0 };
        this.y = { scale: scale2 || 0, offset: offset2 || 0 };
    }
    static new(scale1, offset1, scale2, offset2) { return new udim2(scale1, offset1, scale2, offset2); }
}

class udim {
    constructor(scale, offset) {
        this.scale = scale || 0;
        this.offset = offset || 0;
    }
    static new(scale, offset) { return new udim(scale, offset); }
}

class color3 {
    constructor(r, g, b) {
        this.r = r || 1;
        this.g = g || 1;
        this.b = b || 1;
    }
    static new(r, g, b) { return new color3(r, g, b); }
}

class vector2 {
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }
    static new(x, y) { return new vector2(x, y); }
}

class instancebase {
    constructor(classname) {
        this._classname = classname;
        this._div = document.createElement('div');
        this._div.className = 'guiobject';
        if (classname === 'billboardgui') this._div.classList.add('billboardgui');
        if (classname === 'surfacegui') this._div.classList.add('surfacegui');
        this._div.style.position = 'absolute';
        this._div.style.left = '0px';
        this._div.style.top = '0px';
        this._div.style.width = '100px';
        this._div.style.height = '40px';
        this._parent = null;
        this._children = [];
        this._connections = new map();
        this._properties = {
            name: '',
            backgroundcolor3: new color3(0.2, 0.4, 1),
            visible: true,
            size: new udim2(0, 100, 0, 40),
            position: new udim2(0, 0, 0, 0),
            text: '',
            placeholder: '',
            image: '',
            videourl: '',
            cornerradius: 0,
            strokecolor: new color3(0,0,0),
            strokethickness: 0,
            gradient: null,
            scalefactor: 1,
            aspectratio: 0,
            maxsize: new vector2(9999,9999),
            minsize: new vector2(0,0),
            padding: new udim(0,0),
            cellpadding: new udim(0,0),
            cellspacing: new udim(0,0),
            layoutorder: 0,
            page: 0
        };
        this._videoelement = null;
        this._shadowcache = null;
    }

    get parent() { return this._parent; }
    set parent(p) {
        if (this._parent) this._parent._removechild(this);
        this._parent = p;
        if (p) p._addchild(this);
    }

    _addchild(child) {
        this._children.push(child);
        if (this._div && child._div) this._div.appendChild(child._div);
        this._applylayout();
    }

    _removechild(child) {
        const idx = this._children.indexOf(child);
        if (idx !== -1) this._children.splice(idx, 1);
        if (child._div && child._div.parentNode) child._div.parentNode.removeChild(child._div);
        this._applylayout();
    }

    _applyproperties() {
        this._div.style.left = this._properties.position.x.offset + 'px';
        this._div.style.top = this._properties.position.y.offset + 'px';
        this._div.style.width = this._properties.size.x.offset + 'px';
        this._div.style.height = this._properties.size.y.offset + 'px';
        this._div.style.backgroundColor = `rgba(${this._properties.backgroundcolor3.r * 255}, ${this._properties.backgroundcolor3.g * 255}, ${this._properties.backgroundcolor3.b * 255}, 1)`;
        this._div.style.display = this._properties.visible ? 'flex' : 'none';
        if (this._properties.cornerradius > 0) this._div.style.borderRadius = this._properties.cornerradius + 'px';
        if (this._properties.strokethickness > 0) {
            this._div.style.border = `${this._properties.strokethickness}px solid rgba(${this._properties.strokecolor.r * 255}, ${this._properties.strokecolor.g * 255}, ${this._properties.strokecolor.b * 255}, 1)`;
        }
        if (this._properties.image && (this._classname === 'imagelabel' || this._classname === 'imagebutton')) {
            this._div.style.backgroundImage = `url(${this._properties.image})`;
            this._div.style.backgroundSize = 'cover';
        }
        if (this._classname === 'videoframe' && this._properties.videourl && !this._videoelement) {
            this._videoelement = document.createElement('video');
            this._videoelement.src = this._properties.videourl;
            this._videoelement.controls = true;
            this._videoelement.style.width = '100%';
            this._videoelement.style.height = '100%';
            this._div.appendChild(this._videoelement);
        }
        if (this._classname === 'textlabel' || this._classname === 'textbutton' || this._classname === 'textbox') {
            const label = this._div.querySelector('.guilabel');
            if (label) label.innerText = this._properties.text;
        }
        if (this._classname === 'textbox') {
            const input = this._div.querySelector('input');
            if (input) input.placeholder = this._properties.placeholder;
        }
        if (this._properties.scalefactor !== 1) {
            this._div.style.transform = `scale(${this._properties.scalefactor})`;
        }
        if (this._properties.aspectratio > 0) {
            const newheight = this._properties.size.x.offset / this._properties.aspectratio;
            this._div.style.height = newheight + 'px';
        }
        this._applylayout();
    }

    _applylayout() {
        if (!this._properties.layout) return;
        const layouttype = this._properties.layout;
        const children = this._children.filter(c => c._properties.visible);
        let x = this._properties.padding.offset;
        let y = this._properties.padding.offset;
        if (layouttype === 'grid') {
            const cols = this._properties.gridcols || 2;
            let col = 0;
            for (let child of children) {
                child._div.style.position = 'relative';
                child._div.style.left = '0px';
                child._div.style.top = '0px';
                child._div.style.margin = `${this._properties.cellspacing.offset}px`;
                child._div.style.display = 'inline-block';
                col++;
                if (col >= cols) { col = 0; y += this._properties.cellpadding.offset + 40; }
            }
        } else if (layouttype === 'list') {
            for (let child of children) {
                child._div.style.position = 'relative';
                child._div.style.left = '0px';
                child._div.style.top = y + 'px';
                y += parseInt(child._div.style.height) + this._properties.cellspacing.offset;
            }
        } else if (layouttype === 'page') {
            const page = this._properties.page || 0;
            children.forEach((child, idx) => {
                child._div.style.display = idx === page ? 'block' : 'none';
            });
        } else if (layouttype === 'table') {
            let row = 0, col = 0;
            const rowcols = this._properties.tablecols || 2;
            for (let child of children) {
                child._div.style.position = 'relative';
                child._div.style.left = (col * (parseInt(child._div.style.width) + this._properties.cellspacing.offset)) + 'px';
                child._div.style.top = (row * (parseInt(child._div.style.height) + this._properties.cellspacing.offset)) + 'px';
                col++;
                if (col >= rowcols) { col = 0; row++; }
            }
        }
    }

    get(property) {
        if (property === 'size') return this._properties.size;
        if (property === 'position') return this._properties.position;
        if (property === 'backgroundcolor3') return this._properties.backgroundcolor3;
        if (property === 'visible') return this._properties.visible;
        if (property === 'text') return this._properties.text;
        if (property === 'placeholder') return this._properties.placeholder;
        if (property === 'image') return this._properties.image;
        if (property === 'videourl') return this._properties.videourl;
        if (property === 'cornerradius') return this._properties.cornerradius;
        if (property === 'strokecolor') return this._properties.strokecolor;
        if (property === 'strokethickness') return this._properties.strokethickness;
        if (property === 'scalefactor') return this._properties.scalefactor;
        if (property === 'aspectratio') return this._properties.aspectratio;
        if (property === 'maxsize') return this._properties.maxsize;
        if (property === 'minsize') return this._properties.minsize;
        if (property === 'padding') return this._properties.padding;
        if (property === 'cellpadding') return this._properties.cellpadding;
        if (property === 'cellspacing') return this._properties.cellspacing;
        if (property === 'layoutorder') return this._properties.layoutorder;
        if (property === 'page') return this._properties.page;
        return null;
    }

    set(property, value) {
        if (property === 'size') { this._properties.size = value; this._applyproperties(); }
        else if (property === 'position') { this._properties.position = value; this._applyproperties(); }
        else if (property === 'backgroundcolor3') { this._properties.backgroundcolor3 = value; this._applyproperties(); }
        else if (property === 'visible') { this._properties.visible = value; this._applyproperties(); }
        else if (property === 'text') { this._properties.text = value; this._applyproperties(); }
        else if (property === 'placeholder') { this._properties.placeholder = value; this._applyproperties(); }
        else if (property === 'image') { this._properties.image = value; this._applyproperties(); }
        else if (property === 'videourl') { this._properties.videourl = value; this._applyproperties(); }
        else if (property === 'cornerradius') { this._properties.cornerradius = value; this._applyproperties(); }
        else if (property === 'strokecolor') { this._properties.strokecolor = value; this._applyproperties(); }
        else if (property === 'strokethickness') { this._properties.strokethickness = value; this._applyproperties(); }
        else if (property === 'scalefactor') { this._properties.scalefactor = value; this._applyproperties(); }
        else if (property === 'aspectratio') { this._properties.aspectratio = value; this._applyproperties(); }
        else if (property === 'maxsize') { this._properties.maxsize = value; this._applysizeconstraint(); }
        else if (property === 'minsize') { this._properties.minsize = value; this._applysizeconstraint(); }
        else if (property === 'padding') { this._properties.padding = value; this._applyproperties(); }
        else if (property === 'cellpadding') { this._properties.cellpadding = value; this._applyproperties(); }
        else if (property === 'cellspacing') { this._properties.cellspacing = value; this._applyproperties(); }
        else if (property === 'layoutorder') { this._properties.layoutorder = value; this._applyproperties(); }
        else if (property === 'page') { this._properties.page = value; this._applyproperties(); }
        if (property === 'layout') { this._properties.layout = value; this._applyproperties(); }
        if (property === 'gridcols') { this._properties.gridcols = value; this._applyproperties(); }
        if (property === 'tablecols') { this._properties.tablecols = value; this._applyproperties(); }
    }

    _applysizeconstraint() {
        let w = parseInt(this._div.style.width);
        let h = parseInt(this._div.style.height);
        if (this._properties.maxsize && this._properties.maxsize.x < w) this._div.style.width = this._properties.maxsize.x + 'px';
        if (this._properties.maxsize && this._properties.maxsize.y < h) this._div.style.height = this._properties.maxsize.y + 'px';
        if (this._properties.minsize && this._properties.minsize.x > w) this._div.style.width = this._properties.minsize.x + 'px';
        if (this._properties.minsize && this._properties.minsize.y > h) this._div.style.height = this._properties.minsize.y + 'px';
    }

    onevent(eventname, callback) {
        const domevent = eventname === 'mousebutton1click' ? 'click' : eventname.tolowercase();
        const handler = (e) => { if (!editmode) callback(e); };
        this._div.addeventlistener(domevent, handler);
        this._connections.set(eventname, handler);
    }

    destroy() {
        if (this._parent) this._parent._removechild(this);
        for (let [ev, fn] of this._connections) this._div.removeeventlistener(ev.tolowercase(), fn);
        this._div.remove();
        const idx = allinstances.indexof(this);
        if (idx !== -1) allinstances.splice(idx, 1);
    }
}

class screengui extends instancebase {
    constructor() { super('screengui'); this._init(); }
    _init() {
        this._div.style.width = '100%';
        this._div.style.height = '100%';
        this._div.style.position = 'relative';
        this._div.style.background = 'transparent';
        this._div.style.border = 'none';
        this._div.classList.remove('guiobject');
        this._div.classList.add('guicontainer');
        const container = getcontainer();
        if (container) {
            while(container.firstchild) container.removechild(container.firstchild);
            container.appendchild(this._div);
        }
        allinstances.push(this);
    }
}

class billboardgui extends instancebase {
    constructor() { super('billboardgui'); this._init(); }
    _init() {
        this._div.style.position = 'absolute';
        this._div.style.transform = 'translateY(-50%)';
        this._div.style.background = 'rgba(0,0,0,0.7)';
        this._div.style.borderRadius = '8px';
        this._div.style.padding = '5px';
        allinstances.push(this);
    }
}

class surfacegui extends instancebase {
    constructor() { super('surfacegui'); this._init(); }
    _init() {
        this._div.style.background = 'rgba(0,0,0,0.5)';
        this._div.style.border = '1px solid white';
        allinstances.push(this);
    }
}

class frame extends instancebase { constructor() { super('frame'); this._addresizehandle(); allinstances.push(this); } _addresizehandle() { const h = document.createElement('div'); h.className = 'resizehandle'; this._div.appendChild(h); } }
class scrollingframe extends instancebase { constructor() { super('scrollingframe'); this._div.style.overflow = 'auto'; this._div.style.border = '1px solid #aaa'; this._addresizehandle(); allinstances.push(this); } _addresizehandle() { const h = document.createElement('div'); h.className = 'resizehandle'; this._div.appendChild(h); } }
class canvasgroup extends instancebase { constructor() { super('canvasgroup'); this._div.style.background = '#33333333'; this._div.style.backdropFilter = 'blur(4px)'; this._addresizehandle(); allinstances.push(this); } _addresizehandle() { const h = document.createElement('div'); h.className = 'resizehandle'; this._div.appendChild(h); } }
class viewportframe extends instancebase { constructor() { super('viewportframe'); this._div.style.border = '2px solid cyan'; this._div.style.background = '#111'; this._addresizehandle(); allinstances.push(this); } _addresizehandle() { const h = document.createElement('div'); h.className = 'resizehandle'; this._div.appendChild(h); } }
class textlabel extends instancebase { constructor() { super('textlabel'); this._div.style.alignItems = 'center'; this._div.style.justifyContent = 'center'; const span = document.createElement('span'); span.className = 'guilabel'; span.style.color = 'white'; this._div.appendChild(span); this._addresizehandle(); allinstances.push(this); } _addresizehandle() { const h = document.createElement('div'); h.className = 'resizehandle'; this._div.appendChild(h); } }
class textbutton extends instancebase { constructor() { super('textbutton'); this._div.style.alignItems = 'center'; this._div.style.justifyContent = 'center'; this._div.style.borderRadius = '4px'; const span = document.createElement('span'); span.className = 'guilabel'; span.style.color = 'white'; this._div.appendChild(span); this._addresizehandle(); this._div.onclick = (e) => { if (!editmode) this._triggerclick(e); }; allinstances.push(this); } _addresizehandle() { const h = document.createElement('div'); h.className = 'resizehandle'; this._div.appendChild(h); } _triggerclick(e) { const conn = this._connections.get('mousebutton1click'); if (conn) conn(e); } }
class textbox extends instancebase { constructor() { super('textbox'); this._div.style.background = '#eeeeee'; this._div.style.border = '1px solid #888'; this._div.style.borderRadius = '4px'; const input = document.createElement('input'); input.type = 'text'; input.style.width = '100%'; input.style.height = '100%'; input.style.background = 'transparent'; input.style.border = 'none'; input.style.padding = '4px'; this._div.appendChild(input); this._addresizehandle(); this._div.onclick = (e) => e.stopPropagation(); allinstances.push(this); } _addresizehandle() { const h = document.createElement('div'); h.className = 'resizehandle'; this._div.appendChild(h); } }
class imagelabel extends instancebase { constructor() { super('imagelabel'); this._div.style.backgroundSize = 'cover'; this._addresizehandle(); allinstances.push(this); } _addresizehandle() { const h = document.createElement('div'); h.className = 'resizehandle'; this._div.appendChild(h); } }
class imagebutton extends instancebase { constructor() { super('imagebutton'); this._div.style.backgroundSize = 'cover'; this._addresizehandle(); this._div.onclick = (e) => { if (!editmode) this._triggerclick(e); }; allinstances.push(this); } _addresizehandle() { const h = document.createElement('div'); h.className = 'resizehandle'; this._div.appendChild(h); } _triggerclick(e) { const conn = this._connections.get('mousebutton1click'); if (conn) conn(e); } }
class videoframe extends instancebase { constructor() { super('videoframe'); this._div.classList.add('videoframe'); this._addresizehandle(); allinstances.push(this); } _addresizehandle() { const h = document.createElement('div'); h.className = 'resizehandle'; this._div.appendChild(h); } }
class videoplayer { constructor(parentvideoframe) { this._parent = parentvideoframe; if (parentvideoframe._videoelement) this._video = parentvideoframe._videoelement; } play() { if (this._video) this._video.play(); } pause() { if (this._video) this._video.pause(); } stop() { if (this._video) { this._video.pause(); this._video.currentTime = 0; } } }
class uigridlayout extends instancebase { constructor() { super('uigridlayout'); this.set('layout', 'grid'); this._div.style.display = 'flex'; this._div.style.flexWrap = 'wrap'; allinstances.push(this); } }
class uilistlayout extends instancebase { constructor() { super('uilistlayout'); this.set('layout', 'list'); this._div.style.display = 'flex'; this._div.style.flexDirection = 'column'; allinstances.push(this); } }
class uipagelayout extends instancebase { constructor() { super('uipagelayout'); this.set('layout', 'page'); allinstances.push(this); } }
class uitablelayout extends instancebase { constructor() { super('uitablelayout'); this.set('layout', 'table'); allinstances.push(this); } }
class uipadding extends instancebase { constructor() { super('uipadding'); this.set('padding', new udim(0, 10)); allinstances.push(this); } }
class uiscale extends instancebase { constructor() { super('uiscale'); this.set('scalefactor', 1.2); allinstances.push(this); } }
class uisizeconstraint extends instancebase { constructor() { super('uisizeconstraint'); this.set('maxsize', new vector2(200,200)); this.set('minsize', new vector2(50,50)); allinstances.push(this); } }
class uiaspectratioconstraint extends instancebase { constructor() { super('uiaspectratioconstraint'); this.set('aspectratio', 1.777); allinstances.push(this); } }
class uistroke extends instancebase { constructor() { super('uistroke'); this.set('strokethickness', 2); this.set('strokecolor', new color3(1,0,0)); allinstances.push(this); } }
class uicorner extends instancebase { constructor() { super('uicorner'); this.set('cornerradius', 8); allinstances.push(this); } }
class uigradient extends instancebase { constructor() { super('uigradient'); this._div.style.background = 'linear-gradient(45deg, red, blue)'; allinstances.push(this); } }
class shadowimagecache extends instancebase { constructor() { super('shadowimagecache'); this._div.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)'; allinstances.push(this); } }

const instance = {
    new: (classname) => {
        const map = {
            'screengui': screengui, 'billboardgui': billboardgui, 'surfacegui': surfacegui,
            'frame': frame, 'scrollingframe': scrollingframe, 'canvasgroup': canvasgroup,
            'viewportframe': viewportframe, 'textlabel': textlabel, 'textbutton': textbutton,
            'textbox': textbox, 'imagelabel': imagelabel, 'imagebutton': imagebutton,
            'videoframe': videoframe, 'videoplayer': videoplayer, 'uigridlayout': uigridlayout,
            'uilistlayout': uilistlayout, 'uipagelayout': uipagelayout, 'uitablelayout': uitablelayout,
            'uipadding': uipadding, 'uiscale': uiscale, 'uisizeconstraint': uisizeconstraint,
            'uiaspectratioconstraint': uiaspectratioconstraint, 'uistroke': uistroke,
            'uicorner': uicorner, 'uigradient': uigradient, 'shadowimagecache': shadowimagecache
        };
        const ctor = map[classname.tolowercase()];
        if (!ctor) throw new error('unknown class ' + classname);
        return new ctor();
    },
    getallinstances: () => allinstances
};

export function seteditmode(mode) {
    editmode = mode;
    const handles = document.querySelectorAll('.resizehandle');
    handles.forEach(h => h.style.display = mode ? 'block' : 'none');
}

export function getinstance() { return instance; }
export function getallinstances() { return allinstances; }
