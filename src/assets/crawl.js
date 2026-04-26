const getScreen = function() {
    const svg = document.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const img = new Image();
    const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(svgBlob);

    img.onload = function() {
        canvas.width = svg.clientWidth;
        canvas.height = svg.clientHeight;
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        const pngData = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngData;
        a.download = 'image.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    img.src = url;
}

getScreen();
