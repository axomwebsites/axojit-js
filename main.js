document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('viewportcanvas');
    renderer.init(canvas);
    engine.start();

    const resize = function() {
        const container = document.getElementById('viewportcontainer');
        const w = container.clientWidth;
        const h = container.clientHeight;
        renderer.resize(w, h);
    };
    window.addEventListener('resize', resize);
    resize();

    const createcube = function(x, y) {
        const entity = engine.createentity('Cube');
        entity.transform.x = x;
        entity.transform.y = y;
        entity.renderable = { type: 'rect', w: 30, h: 30, color: '#4a8af4' };
        entity.rigidbody = { mass: 1, vx: 0, vy: 0, friction: 0.1, restitution: 0.5, gravityscale: 1 };
        return entity;
    };

    for (let i = 0; i < 5; i++) {
        const e = createcube(i*40 - 80, 0);
    }

    let lasttime = 0;
    let mousedown = false;
    let lastmx = 0, lastmy = 0;

    function loop(time) {
        const dt = Math.min((time - lasttime) / 1000, 0.05);
        lasttime = time;

        engine.update(dt);
        if (!engine.iseditmode) {
            physics.step(engine.entities, dt);
            ecs.update(engine, dt);
        }
        animation.update(engine.entities, dt);

        const cam = engine.camera;
        renderer.clear();
        for (let [id, entity] of engine.entities) {
            if (entity.active && entity.renderable) {
                renderer.drawentity(entity, cam);
            }
        }

        ui.updateinfo(engine);
        ui.settime(animation.gettime());

        requestAnimationFrame(loop);
    }

    canvas.addEventListener('mousedown', function(e) {
        const rect = canvas.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width * canvas.width;
        const py = (e.clientY - rect.top) / rect.height * canvas.height;
        const cx = engine.camera.x;
        const cy = engine.camera.y;
        const cz = engine.camera.zoom;
        engine.input.mouse.worldx = (px - canvas.width/2) / cz + cx;
        engine.input.mouse.worldy = (py - canvas.height/2) / cz + cy;
        engine.input.mouse.down = true;
        mousedown = true;
        lastmx = e.clientX;
        lastmy = e.clientY;
    });

    document.addEventListener('mouseup', function() {
        engine.input.mouse.down = false;
        mousedown = false;
    });

    canvas.addEventListener('mousemove', function(e) {
        const rect = canvas.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width * canvas.width;
        const py = (e.clientY - rect.top) / rect.height * canvas.height;
        const cx = engine.camera.x;
        const cy = engine.camera.y;
        const cz = engine.camera.zoom;
        engine.input.mouse.worldx = (px - canvas.width/2) / cz + cx;
        engine.input.mouse.worldy = (py - canvas.height/2) / cz + cy;
        engine.input.mouse.x = e.clientX;
        engine.input.mouse.y = e.clientY;
        if (mousedown && engine.iseditmode) {
            const dx = e.clientX - lastmx;
            const dy = e.clientY - lastmy;
            engine.camera.x -= dx / cz;
            engine.camera.y -= dy / cz;
            lastmx = e.clientX;
            lastmy = e.clientY;
        }
    });

    canvas.addEventListener('wheel', function(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        engine.camera.zoom = Math.max(0.2, Math.min(5, engine.camera.zoom + delta));
    });

    ui.btnplay.addEventListener('click', function() {
        if (engine.iseditmode) {
            engine.serialized = engine.serialize();
            engine.iseditmode = false;
            engine.isplaying = true;
        }
    });

    ui.btnstop.addEventListener('click', function() {
        if (!engine.iseditmode) {
            engine.iseditmode = true;
            engine.isplaying = false;
            if (engine.serialized) {
                engine.deserialize(engine.serialized);
                engine.serialized = null;
            }
            ui.rebuild(engine);
        }
    });

    ui.btnselect.addEventListener('click', function() {
        document.querySelectorAll('.toolbtn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    });
    ui.btnmove.addEventListener('click', function() {
        document.querySelectorAll('.toolbtn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    });
    ui.btnrotate.addEventListener('click', function() {
        document.querySelectorAll('.toolbtn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    });
    ui.btnscale.addEventListener('click', function() {
        document.querySelectorAll('.toolbtn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    });

    ui.btnaddentity.addEventListener('click', function() {
        const e = engine.createentity('Entity');
        e.renderable = { type: 'rect', w: 30, h: 30, color: '#4a8af4' };
        e.transform.x = engine.camera.x;
        e.transform.y = engine.camera.y;
        ui.rebuild(engine);
    });

    ui.btnaddgroup.addEventListener('click', function() {
        engine.creategroup('Group');
        ui.rebuild(engine);
    });

    ui.btnduplicate.addEventListener('click', function() {
        if (engine.selectedentity) {
            const copy = engine.duplicateentity(engine.selectedentity);
            if (copy) ui.rebuild(engine);
        }
    });

    ui.btndelete.addEventListener('click', function() {
        if (engine.selectedentity) {
            const id = engine.selectedentity;
            engine.deleteentity(id);
            engine.selectedentity = null;
            ui.rebuild(engine);
        }
    });

    ui.btnnew.addEventListener('click', function() {
        engine.entities.clear();
        engine.groups.clear();
        engine.nextentityid = 1;
        engine.nextgroupid = 1;
        engine.scene.root = null;
        engine.start();
        ui.rebuild(engine);
    });

    ui.btnsave.addEventListener('click', function() {
        const data = engine.serialize();
        const blob = new Blob([data], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scene.axojita';
        a.click();
        URL.revokeObjectURL(url);
    });

    ui.btnload.addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.axojita,.json';
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(ev) {
                try {
                    engine.deserialize(ev.target.result);
                    ui.rebuild(engine);
                } catch(ex) { alert('Invalid scene file'); }
            };
            reader.readAsText(file);
        };
        input.click();
    });

    ui.tlplay.addEventListener('click', function() {
        animation.playing = !animation.playing;
        if (animation.playing && animation.time >= animation.duration) {
            animation.time = 0;
        }
    });

    ui.tlstop.addEventListener('click', function() {
        animation.playing = false;
        animation.time = 0;
        ui.settime(0);
    });

    ui.tlloop.addEventListener('click', function() {
        animation.loop = !animation.loop;
        this.classList.toggle('active');
    });

    ui.tlscrubber.addEventListener('input', function() {
        const t = ui.gettime();
        animation.settime(t);
        ui.settime(t);
    });

    ecs.register('bounce', {
        init: function(entity, engine) {
            entity.custom.bouncecounter = 0;
        },
        update: function(entity, engine, dt) {
            if (entity.transform.y > 200) {
                entity.rigidbody.vy *= -0.8;
                entity.transform.y = 200;
                entity.custom.bouncecounter++;
                if (entity.custom.bouncecounter > 10) entity.active = false;
            }
        },
        oncollision: function(entity, other) {
            entity.rigidbody.vy *= -0.5;
        }
    });

    for (let [id, entity] of engine.entities) {
        if (entity.id % 2 === 0) ecs.attach(entity.id, 'bounce', engine);
    }

    setInterval(function() {
        ui.rebuild(engine);
    }, 1000);

    requestAnimationFrame(loop);
});
