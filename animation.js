const animation = {
    tracks: new Map(),
    time: 0,
    duration: 10,
    loop: false,
    playing: false,
    scrubbing: false,
    addtrack: function(entityid, property, keyframes) {
        if (!this.tracks.has(entityid)) this.tracks.set(entityid, {});
        this.tracks.get(entityid)[property] = keyframes;
    },
    evaluate: function(entity, property, time) {
        const tracks = this.tracks.get(entity.id);
        if (!tracks) return null;
        const keyframes = tracks[property];
        if (!keyframes || keyframes.length === 0) return null;
        let prev = null, next = null;
        for (let k of keyframes) {
            if (k.time <= time) prev = k;
            else { next = k; break; }
        }
        if (!prev) return keyframes[0].value;
        if (!next) return prev.value;
        const t = (time - prev.time) / (next.time - prev.time);
        const eased = this.ease(t, prev.ease || 'linear');
        const val = this.lerp(prev.value, next.value, eased);
        return val;
    },
    lerp: function(a, b, t) {
        if (typeof a === 'number') return a + (b-a)*t;
        if (Array.isArray(a)) {
            return a.map((v,i) => v + (b[i]-v)*t);
        }
        if (typeof a === 'object') {
            const res = {};
            for (let key in a) {
                res[key] = a[key] + (b[key]-a[key])*t;
            }
            return res;
        }
        return a;
    },
    ease: function(t, type) {
        switch(type) {
            case 'quad': return t*t;
            case 'cubic': return t*t*t;
            case 'elastic': return Math.pow(2, -10*t) * Math.sin((t-0.075)*20*Math.PI) + 1;
            default: return t;
        }
    },
    update: function(entities, dt) {
        if (!this.playing) return;
        this.time += dt;
        if (this.time > this.duration) {
            if (this.loop) this.time = 0;
            else { this.time = this.duration; this.playing = false; }
        }
        for (let [id, entity] of entities) {
            const tracks = this.tracks.get(id);
            if (!tracks) continue;
            for (let prop in tracks) {
                const val = this.evaluate(entity, prop, this.time);
                if (val !== null) {
                    if (prop === 'x') entity.transform.x = val;
                    else if (prop === 'y') entity.transform.y = val;
                    else if (prop === 'rotation') entity.transform.rotation = val;
                    else if (prop === 'opacity' && entity.renderable) entity.renderable.opacity = val;
                    else if (prop === 'scalex') entity.transform.scalex = val;
                    else if (prop === 'scaley') entity.transform.scaley = val;
                    else if (entity.custom) entity.custom[prop] = val;
                }
            }
        }
    },
    settime: function(t) {
        this.time = Math.max(0, Math.min(t, this.duration));
    },
    gettime: function() { return this.time; }
};
