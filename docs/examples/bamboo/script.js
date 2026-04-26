const fs = require('fs');
const { JSDOM } = require('jsdom');

fs.readFile('modified-file.svg', 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    const dom = new JSDOM(data, { contentType: 'image/svg+xml' });
    const svg = dom.window.document.querySelector('svg');
    const bambooLayer = svg.querySelectorAll('.bamboo')
    Array.from(bambooLayer).forEach((gEle) => {
        gEle.querySelectorAll('.bamboo-joint').forEach((jointEle, idx) => {
            // add class of `level_${idx}`
            jointEle.classList.add(`level_${idx}`)
        })
    })

    // bambooLayer.selectAll('[data-type="bamboo"]').each((g) => {
    //     const g = d3.select(g)
    //     g.selectAll('path').classed('root', true).classed('cls-15', false);

    // })
    // bambooLayer.selectAll('[data-type="bamboo-with-leaves]').each((g)=>{
    //     const g = d3.select(g)
    //     g.select('[data-type="bamboo-roots"]').selectAll('path').classed('root', true).classed('cls-15', false);

    // })
    
    const modifiedSvg = dom.window.document.querySelector('svg').outerHTML;
    fs.writeFile('new-modified-file.svg', modifiedSvg, (err) => {
      if (err) {
        console.error('Error writing file:', err);
        return;
      }
      console.log('Modified SVG saved as modified-file.svg');
    });

})