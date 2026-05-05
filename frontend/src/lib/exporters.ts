import { toPng, toSvg } from 'html-to-image'
import { jsPDF } from 'jspdf'
import type { ERDResponse } from '../types'

function getFlowElement(): HTMLElement {
  const el = document.querySelector('.react-flow__viewport') as HTMLElement
  if (!el) throw new Error('React Flow viewport not found')
  return el
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

export async function exportPNG(catalog: string, schema: string) {
  const el = getFlowElement()
  const dataUrl = await toPng(el, {
    backgroundColor: '#0f1117',
    pixelRatio: 2,
  })
  downloadDataUrl(dataUrl, `erd-${catalog}-${schema}.png`)
}

export async function exportSVG(catalog: string, schema: string) {
  const el = getFlowElement()
  const dataUrl = await toSvg(el, {
    backgroundColor: '#0f1117',
  })
  // Convert data URL to blob
  const svgStr = decodeURIComponent(dataUrl.split(',')[1])
  const blob = new Blob([svgStr], { type: 'image/svg+xml' })
  downloadBlob(blob, `erd-${catalog}-${schema}.svg`)
}

export async function exportPDF(catalog: string, schema: string) {
  const el = getFlowElement()
  const dataUrl = await toPng(el, {
    backgroundColor: '#0f1117',
    pixelRatio: 2,
  })

  const img = new Image()
  img.src = dataUrl
  await img.decode()

  const orientation = img.width > img.height ? 'landscape' : 'portrait'
  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [img.width / 2, img.height / 2],  // /2 because pixelRatio is 2
  })
  pdf.addImage(dataUrl, 'PNG', 0, 0, img.width / 2, img.height / 2)
  pdf.save(`erd-${catalog}-${schema}.pdf`)
}

export async function exportHTML(catalog: string, schema: string) {
  const el = getFlowElement()
  const svgDataUrl = await toSvg(el, {
    backgroundColor: '#0f1117',
  })
  const svgContent = decodeURIComponent(svgDataUrl.split(',')[1])

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ERD: ${catalog}.${schema}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0f1117; overflow: hidden; font-family: -apple-system, sans-serif; }
  #header { position: fixed; top: 0; left: 0; right: 0; padding: 12px 20px; background: #151720;
            border-bottom: 1px solid #2a2d3a; z-index: 10; display: flex; align-items: center; gap: 12px; }
  #header h1 { color: #ff6f00; font-size: 14px; font-weight: 700; }
  #header span { color: #9aa0a6; font-size: 12px; }
  #container { position: fixed; top: 46px; left: 0; right: 0; bottom: 0; cursor: grab; overflow: hidden; }
  #container:active { cursor: grabbing; }
  #svg-wrap { transform-origin: 0 0; }
</style>
</head>
<body>
<div id="header">
  <h1>UC ERD Viewer</h1>
  <span>${catalog}.${schema}</span>
</div>
<div id="container">
  <div id="svg-wrap">${svgContent}</div>
</div>
<script>
const wrap = document.getElementById('svg-wrap');
const container = document.getElementById('container');
let scale = 1, tx = 0, ty = 0, dragging = false, sx = 0, sy = 0;
function apply() { wrap.style.transform = 'translate('+tx+'px,'+ty+'px) scale('+scale+')'; }
container.addEventListener('wheel', e => { e.preventDefault();
  const d = e.deltaY > 0 ? 0.9 : 1.1; scale *= d;
  tx = e.clientX - (e.clientX - tx) * d; ty = e.clientY - (e.clientY - ty) * d; apply();
});
container.addEventListener('mousedown', e => { dragging = true; sx = e.clientX - tx; sy = e.clientY - ty; });
window.addEventListener('mousemove', e => { if (!dragging) return; tx = e.clientX - sx; ty = e.clientY - sy; apply(); });
window.addEventListener('mouseup', () => { dragging = false; });
apply();
</script>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  downloadBlob(blob, `erd-${catalog}-${schema}.html`)
}

export function exportDBML(data: ERDResponse) {
  const lines: string[] = [`// ERD: ${data.catalog}.${data.schema_name}`, '']

  for (const table of data.tables) {
    lines.push(`Table ${table.name} {`)
    for (const col of table.columns) {
      const attrs: string[] = []
      if (col.is_pk) attrs.push('pk')
      if (!col.is_nullable) attrs.push('not null')
      if (col.comment) attrs.push(`note: '${col.comment.replace(/'/g, "\\'")}'`)
      const attrStr = attrs.length ? ` [${attrs.join(', ')}]` : ''
      lines.push(`  ${col.name} ${col.data_type}${attrStr}`)
    }
    lines.push('}')
    lines.push('')
  }

  for (const rel of data.relationships) {
    for (let i = 0; i < rel.fk_columns.length; i++) {
      lines.push(`Ref: ${rel.fk_table}.${rel.fk_columns[i]} > ${rel.pk_table}.${rel.pk_columns[i]}`)
    }
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  downloadBlob(blob, `erd-${data.catalog}-${data.schema_name}.dbml`)
}
