const engine = {
    deltatime: 0,
    time: 0,
    framecount: 0,
    fps: 0,
    fpcounter: 0,
    fptimer: 0,
    isplaying: false,
    iseditmode: true,
    selectedentity: null,
    entities: new Map(),
    groups: new Map(),
    nextentityid: 1,
    nextgroupid: 1,
    input: {
        keys: {},
        mouse: { x: 0, y: 0, down: false, worldx: 0, worldy: 0 },
        mousedelta: { x: 0, y: 0 }
    },
    camera: { x: 0, y: 0, zoom: 1, targetx: 0, targety: 0 },
    scene: { name: 'Untitled', root: null },
    serialized: null,
    start: function() {
        this.scene.root = this.creategroup('Scene');
        this.camera.x = 0;
        this.camera.y = 0;
        this.camera.zoom = 1;
        this.iseditmode = true;
        this.isplaying = false;
    },
    update: function(dt) {
        this.deltatime = dt;
        this.time += dt;
        this.framecount++;
        this.fpcounter++;
        this.fptimer += dt;
        if (this.fptimer >= 1) {
            this.fps = this.fpcounter;
            this.fpcounter = 0;
            this.fptimer = 0;
        }
        if (this.isplaying) {
            for (let [id, entity] of this.entities) {
                if (entity.active) {
                    if (entity.update) entity.update(dt);
                }
            }
        }
    },
    createentity: function(name, parentid) {
        const id = this.nextentityid++;
        const entity = {
            id: id,
            name: name || 'Entity_' + id,
            active: true,
            parent: parentid || null,
            children: [],
            components: {},
            transform: { x: 0, y: 0, rotation: 0, scalex: 1, scaley: 1 },
            renderable: null,
            rigidbody: null,
            animator: null,
            custom: {}
        };
        this.entities.set(id, entity);
        if (parentid && this.entities.has(parentid)) {
            this.entities.get(parentid).children.push(id);
        } else if (this.scene.root) {
            this.entities.get(this.scene.root).children.push(id);
        }
        return entity;
    },
    creategroup: function(name) {
        const id = this.nextgroupid++;
        const group = { id: id, name: name || 'Group_' + id, children: [] };
        this.groups.set(id, group);
        if (this.scene.root === null) this.scene.root = id;
        else {
            const root = this.groups.get(this.scene.root);
            if (root) root.children.push(id);
        }
        return group;
    },
    getentity: function(id) { return this.entities.get(id); },
    getgroup: function(id) { return this.groups.get(id); },
    deleteentity: function(id) {
        const entity = this.entities.get(id);
        if (!entity) return;
        for (let child of entity.children) this.deleteentity(child);
        if (entity.parent) {
            const parent = this.entities.get(entity.parent);
            if (parent) parent.children = parent.children.filter(c => c !== id);
        }
        this.entities.delete(id);
        if (this.selectedentity === id) this.selectedentity = null;
    },
    deletegroup: function(id) {
        const group = this.groups.get(id);
        if (!group) return;
        for (let child of group.children) {
            if (this.entities.has(child)) this.deleteentity(child);
            else if (this.groups.has(child)) this.deletegroup(child);
        }
        this.groups.delete(id);
    },
    serialize: function() {
        const data = { entities: [], groups: [], root: this.scene.root };
        for (let [id, entity] of this.entities) {
            data.entities.push({
                id: entity.id, name: entity.name, active: entity.active,
                parent: entity.parent, transform: { ...entity.transform },
                components: { ...entity.components },
                renderable: entity.renderable ? { ...entity.renderable } : null,
                rigidbody: entity.rigidbody ? { ...entity.rigidbody } : null,
                animator: entity.animator ? { ...entity.animator } : null,
                custom: { ...entity.custom }
            });
        }
        for (let [id, group] of this.groups) {
            data.groups.push({ id: group.id, name: group.name, children: [...group.children] });
        }
        return JSON.stringify(data);
    },
    deserialize: function(json) {
        const data = JSON.parse(json);
        this.entities.clear();
        this.groups.clear();
        this.nextentityid = 1;
        this.nextgroupid = 1;
        for (let g of data.groups) {
            const group = { id: g.id, name: g.name, children: [...g.children] };
            this.groups.set(g.id, group);
            if (g.id > this.nextgroupid) this.nextgroupid = g.id + 1;
        }
        for (let e of data.entities) {
            const entity = {
                id: e.id, name: e.name, active: e.active, parent: e.parent,
                children: [], components: { ...e.components },
                transform: { ...e.transform },
                renderable: e.renderable ? { ...e.renderable } : null,
                rigidbody: e.rigidbody ? { ...e.rigidbody } : null,
                animator: e.animator ? { ...e.animator } : null,
                custom: { ...e.custom }
            };
            this.entities.set(e.id, entity);
            if (e.id > this.nextentityid) this.nextentityid = e.id + 1;
        }
        for (let [id, entity] of this.entities) {
            if (entity.parent && this.entities.has(entity.parent)) {
                this.entities.get(entity.parent).children.push(id);
            }
        }
        for (let [id, group] of this.groups) {
            for (let child of group.children) {
                if (this.entities.has(child)) {
                    this.entities.get(child).parent = id;
                }
            }
        }
        this.scene.root = data.root;
        if (this.scene.root && !this.groups.has(this.scene.root)) {
            this.scene.root = null;
        }
    },
    duplicateentity: function(id) {
        const original = this.entities.get(id);
        if (!original) return null;
        const copy = this.createentity(original.name + '_copy', original.parent);
        copy.transform = { ...original.transform };
        copy.renderable = original.renderable ? { ...original.renderable } : null;
        copy.rigidbody = original.rigidbody ? { ...original.rigidbody } : null;
        copy.animator = original.animator ? { ...original.animator } : null;
        copy.components = { ...original.components };
        copy.custom = { ...original.custom };
        return copy;
    }
};
