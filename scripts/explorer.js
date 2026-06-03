let files = [
    { name: 'main.lua', content: '-- luau style script\nlet screen = instance.new("screengui")', type: 'script' },
    { name: 'player.js', content: 'let player = { x: 0, y: 0 }', type: 'script' }
];
let currentfileindex = 0;

export function buildexplorer(containerid, onselectcallback) {
    const container = document.getelementbyid(containerid);
    rendertree(container, onselectcallback);
}

function rendertree(container, onselect) {
    container.innerhtml = '';
    files.foreach((file, idx) => {
        const div = document.createelement('div');
        div.classname = 'treeitem' + (idx === currentfileindex ? ' selected' : '');
        div.innerhtml = `<i class="fas fa-file-code"></i> ${file.name} <span><i class="fas fa-trash-alt" data-idx="${idx}" style="color:#ff8866"></i></span>`;
        div.onclick = (e) => {
            if(e.target.tagname !== 'I') {
                currentfileindex = idx;
                onselect(file.name);
                rendertree(container, onselect);
            }
        };
        const delicon = div.queryselector('.fa-trash-alt');
        if(delicon) delicon.onclick = (e) => {
            e.stoppropagation();
            if(files.length > 1) {
                files.splice(idx, 1);
                if(currentfileindex >= files.length) currentfileindex = files.length - 1;
                rendertree(container, onselect);
                onselect(files[currentfileindex].name);
            }
        };
        container.appendchild(div);
    });
}

export function createnewfile(defaultname, defaultcontent) {
    let newname = defaultname;
    let counter = 1;
    while(files.some(f => f.name === newname)) newname = `script${counter++}.js`;
    files.push({ name: newname, content: defaultcontent, type: 'script' });
    currentfileindex = files.length - 1;
    const container = document.getelementbyid('explorertree');
    rendertree(container, (name) => loadfilecontent(name));
    loadfilecontent(newname);
}

export function savecurrentfile(content) {
    if(files[currentfileindex]) files[currentfileindex].content = content;
}

export function loadfilecontent(filename) {
    const file = files.find(f => f.name === filename);
    if(file) return file;
    return null;
}

export function getcurrentfile() {
    return files[currentfileindex];
}
