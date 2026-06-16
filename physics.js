const physics = {
    gravity: { x: 0, y: 9.8 },
    broadphase: function(entities) {
        const cells = new Map();
        for (let [id, entity] of entities) {
            if (!entity.rigidbody) continue;
            const t = entity.transform;
            const cellx = Math.floor(t.x / 64);
            const celly = Math.floor(t.y / 64);
            const key = cellx + ',' + celly;
            if (!cells.has(key)) cells.set(key, []);
            cells.get(key).push(entity);
        }
        return cells;
    },
    sat: function(a, b) {
        const at = a.transform, bt = b.transform;
        const ax = at.x, ay = at.y, ar = at.rotation;
        const bx = bt.x, by = bt.y, br = bt.rotation;
        const arw = a.renderable ? (a.renderable.w || 20) : 20;
        const arh = a.renderable ? (a.renderable.h || 20) : 20;
        const brw = b.renderable ? (b.renderable.w || 20) : 20;
        const brh = b.renderable ? (b.renderable.h || 20) : 20;
        const acos = Math.cos(ar), asin = Math.sin(ar);
        const bcos = Math.cos(br), bsin = Math.sin(br);
        const aaxis = [
            {x: acos, y: asin},
            {x: -asin, y: acos}
        ];
        const baxis = [
            {x: bcos, y: bsin},
            {x: -bsin, y: bcos}
        ];
        const axes = aaxis.concat(baxis);
        const ahw = arw/2, ahh = arh/2;
        const bhw = brw/2, bhh = brh/2;
        for (let axis of axes) {
            const ap1 = ax + aaxis[0].x*ahw + aaxis[1].x*ahh;
            const ap2 = ax + aaxis[0].x*(-ahw) + aaxis[1].x*ahh;
            const ap3 = ax + aaxis[0].x*ahw + aaxis[1].x*(-ahh);
            const ap4 = ax + aaxis[0].x*(-ahw) + aaxis[1].x*(-ahh);
            const amin = Math.min(ap1, ap2, ap3, ap4);
            const amax = Math.max(ap1, ap2, ap3, ap4);
            const bp1 = bx + baxis[0].x*bhw + baxis[1].x*bhh;
            const bp2 = bx + baxis[0].x*(-bhw) + baxis[1].x*bhh;
            const bp3 = bx + baxis[0].x*bhw + baxis[1].x*(-bhh);
            const bp4 = bx + baxis[0].x*(-bhw) + baxis[1].x*(-bhh);
            const bmin = Math.min(bp1, bp2, bp3, bp4);
            const bmax = Math.max(bp1, bp2, bp3, bp4);
            if (amax < bmin || bmax < amin) return false;
        }
        return true;
    },
    resolvecollision: function(a, b) {
        const dx = b.transform.x - a.transform.x;
        const dy = b.transform.y - a.transform.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 0.001) return;
        const overlap = (a.renderable.w/2 + b.renderable.w/2) - dist;
        if (overlap > 0) {
            const nx = dx/dist, ny = dy/dist;
            const totalmass = (a.rigidbody.mass || 1) + (b.rigidbody.mass || 1);
            const aratio = (b.rigidbody.mass || 1) / totalmass;
            const bratio = (a.rigidbody.mass || 1) / totalmass;
            a.transform.x -= nx * overlap * aratio;
            a.transform.y -= ny * overlap * aratio;
            b.transform.x += nx * overlap * bratio;
            b.transform.y += ny * overlap * bratio;
            if (a.rigidbody && b.rigidbody) {
                const rest = (a.rigidbody.restitution || 0.5) * (b.rigidbody.restitution || 0.5);
                const relvx = (a.rigidbody.vx || 0) - (b.rigidbody.vx || 0);
                const relvy = (a.rigidbody.vy || 0) - (b.rigidbody.vy || 0);
                const relvn = relvx*nx + relvy*ny;
                if (relvn < 0) {
                    const impulse = -(1+rest) * relvn / totalmass;
                    a.rigidbody.vx = (a.rigidbody.vx || 0) + impulse * nx * (b.rigidbody.mass || 1) / totalmass;
                    a.rigidbody.vy = (a.rigidbody.vy || 0) + impulse * ny * (b.rigidbody.mass || 1) / totalmass;
                    b.rigidbody.vx = (b.rigidbody.vx || 0) - impulse * nx * (a.rigidbody.mass || 1) / totalmass;
                    b.rigidbody.vy = (b.rigidbody.vy || 0) - impulse * ny * (a.rigidbody.mass || 1) / totalmass;
                }
            }
        }
    },
    step: function(entities, dt) {
        const gravx = this.gravity.x;
        const gravy = this.gravity.y;
        for (let [id, entity] of entities) {
            if (!entity.rigidbody || !entity.active) continue;
            const rb = entity.rigidbody;
            const t = entity.transform;
            rb.vx = (rb.vx || 0) + gravx * dt * (rb.gravityscale || 1);
            rb.vy = (rb.vy || 0) + gravy * dt * (rb.gravityscale || 1);
            t.x += rb.vx * dt;
            t.y += rb.vy * dt;
            rb.vx *= (1 - (rb.friction || 0) * dt);
            rb.vy *= (1 - (rb.friction || 0) * dt);
        }
        const cells = this.broadphase(entities);
        const checked = new Set();
        for (let [key, list] of cells) {
            for (let i = 0; i < list.length; i++) {
                for (let j = i+1; j < list.length; j++) {
                    const a = list[i], b = list[j];
                    const pair = (a.id < b.id) ? a.id+','+b.id : b.id+','+a.id;
                    if (checked.has(pair)) continue;
                    checked.add(pair);
                    if (this.sat(a, b)) {
                        this.resolvecollision(a, b);
                        if (a.oncollision) a.oncollision(b);
                        if (b.oncollision) b.oncollision(a);
                    }
                }
            }
        }
    }
};
