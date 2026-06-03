let mediaassets = [];

export function addaudioasset() {
    const input = document.createelement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const url = url.createobjecturl(file);
        mediaassets.push({ type: 'audio', name: file.name, url });
        rendermedialist('medialist', (type, url) => {});
    };
    input.click();
}

export function addimageasset() {
    const input = document.createelement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const url = url.createobjecturl(file);
        mediaassets.push({ type: 'image', name: file.name, url });
        rendermedialist('medialist', (type, url) => {});
    };
    input.click();
}

export function addvideoasset() {
    const input = document.createelement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const url = url.createobjecturl(file);
        mediaassets.push({ type: 'video', name: file.name, url });
        rendermedialist('medialist', (type, url) => {});
    };
    input.click();
}

export function rendermedialist(containerid, oninsertcallback) {
    const container = document.getelementbyid(containerid);
    if(!container) return;
    container.innerhtml = '';
    mediaassets.foreach((asset, idx) => {
        const div = document.createelement('div');
        div.classname = 'mediaitem';
        div.innerhtml = `<i class="fas fa-${asset.type === 'audio' ? 'music' : (asset.type === 'image' ? 'image' : 'video')}"></i> ${asset.name} <button class="insertmedia" data-idx="${idx}">+</button>`;
        const btn = div.queryselector('.insertmedia');
        btn.onclick = () => oninsertcallback(asset.type, asset.url);
        container.appendchild(div);
    });
}
