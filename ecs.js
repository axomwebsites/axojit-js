const ecs = {
    systems: [],
    scripts: new Map(),
    register: function(name, script) {
        this.scripts.set(name, script);
    },
    attach: function(entityid, scriptname, engine) {
        const entity = engine.getentity(entityid);
        if (!entity) return false;
        const script = this.scripts.get(scriptname);
        if (!script) return false;
        entity.components[scriptname] = { script: script, state: {} };
        if (script.init) script.init(entity, engine);
        return true;
    },
    update: function(engine, dt) {
        for (let [id, entity] of engine.entities) {
            if (!entity.active) continue;
            for (let key in entity.components) {
                const comp = entity.components[key];
                if (comp.script && comp.script.update) {
                    comp.script.update(entity, engine, dt);
                }
            }
        }
    },
    oncollision: function(entitya, entityb) {
        for (let key in entitya.components) {
            const comp = entitya.components[key];
            if (comp.script && comp.script.oncollision) {
                comp.script.oncollision(entitya, entityb);
            }
        }
    }
};
