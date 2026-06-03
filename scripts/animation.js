import { updateobjecttransform } from './engine3d.js';
import { update2dobject } from './engine2d.js';

class animationclip {
    constructor(name) {
        this.name = name;
        this.keyframes = [];
        this.duration = 0;
        this.isplaying = false;
        this.currenttime = 0;
        this.requestid = null;
        this.targetgetter = null;
        this.target2dgetter = null;
    }

    addkeyframe(property, time, value) {
        this.keyframes.push({ property, time, value });
        this.keyframes.sort((a,b) => a.time - b.time);
        this.duration = math.max(this.duration, time);
    }

    evaluate(time) {
        if (!this.targetgetter) return;
        const target = this.targetgetter();
        if (!target && !this.target2dgetter) return;
        const is3d = !!target;
        const obj = is3d ? target : this.target2dgetter();
        if (!obj) return;

        for (let kf of this.keyframes) {
            if (time >= kf.time) {
                if (is3d) updateobjecttransform(obj, kf.property, kf.value);
                else update2dobject(obj, kf.property, kf.value);
            }
        }
    }

    start() {
        if (this.isplaying) this.stop();
        this.isplaying = true;
        this.currenttime = 0;
        const starttime = performance.now() / 1000;
        const step = (now) => {
            const elapsed = (performance.now() / 1000) - starttime;
            this.currenttime = math.min(elapsed, this.duration);
            this.evaluate(this.currenttime);
            if (this.currenttime < this.duration) {
                this.requestid = requestanimationframe(step);
            } else {
                this.isplaying = false;
                this.requestid = null;
            }
        };
        this.requestid = requestanimationframe(step);
    }

    stop() {
        if (this.requestid) cancelanimationframe(this.requestid);
        this.isplaying = false;
        this.requestid = null;
    }
}

class animationmanager {
    constructor() {
        this.clips = [];
        this.currentclipindex = -1;
        this.targetgetter = null;
        this.target2dgetter = null;
    }

    settargetgetter(getter) { this.targetgetter = getter; }
    set2dtargetgetter(getter) { this.target2dgetter = getter; }

    createclip(name) {
        const clip = new animationclip(name);
        clip.targetgetter = this.targetgetter;
        clip.target2dgetter = this.target2dgetter;
        this.clips.push(clip);
        this.currentclipindex = this.clips.length - 1;
        return clip;
    }

    getcurrentclip() {
        if (this.currentclipindex >= 0) return this.clips[this.currentclipindex];
        return null;
    }

    addkeyframetocurrent(property, time, value) {
        const clip = this.getcurrentclip();
        if (clip) clip.addkeyframe(property, time, value);
    }

    playcurrent() {
        const clip = this.getcurrentclip();
        if (clip) clip.start();
    }

    stopcurrent() {
        const clip = this.getcurrentclip();
        if (clip) clip.stop();
    }
}

export const animationmanager = new animationmanager();

export function createanimationclip(name) {
    return animationmanager.createclip(name);
}

export function addkeyframe(property, time, value) {
    animationmanager.addkeyframetocurrent(property, time, value);
}

export function playcurrentclip() {
    animationmanager.playcurrent();
}

export function stopcurrentclip() {
    animationmanager.stopcurrent();
}

export function setcurrentclip(index) {
    if (index >= 0 && index < animationmanager.clips.length) animationmanager.currentclipindex = index;
}

export function renderkeyframelist(containerid, clip) {
    const container = document.getelementbyid(containerid);
    if (!container) return;
    container.innerhtml = '';
    if (!clip) { container.innerhtml = '<div>no clip selected</div>'; return; }
    clip.keyframes.foreach((kf, idx) => {
        const div = document.createelement('div');
        div.classname = 'keyframeitem';
        div.innerhtml = `${kf.property} @ ${kf.time}s <button class="delkf" data-idx="${idx}">x</button>`;
        div.queryselector('.delkf').onclick = () => {
            clip.keyframes.splice(idx, 1);
            renderkeyframelist(containerid, clip);
        };
        container.appendchild(div);
    });
      }
