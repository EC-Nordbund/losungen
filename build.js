const fs = require('fs')
const fetch = require('node-fetch')
const zip = require('jszip')

const PATH = './data/'

function losungen() {
  if (!fs.existsSync(PATH)) {
    fs.mkdirSync(PATH)
  }

  fs.readdirSync(PATH)
    .filter((v) => v[0] !== '.')
    .map((v) => PATH + v)
    .forEach(fs.unlinkSync)

  const z = new zip()

  function getPart(p, str) {
    return (' ' + str).split(`<${p}>`)[1].split(`</${p}>`)[0]
  }

  fetch(
    'https://www.losungen.de/fileadmin/media-losungen/download/Losung_2021_XML.zip'
  )
    .then((v) => v.arrayBuffer())
    .then(v => {
      return z.loadAsync(v)
    })
    .then(() => z.file(Object.keys(z.files).filter(v => !v.endsWith('pdf'))[0]).nodeStream('nodebuffer'))
    .then(v => new fetch.Response(v))
    .then(v => v.text())
    .then(v => v.split('<Losungen>').slice(1).map(v => v.split('</Losungen>')[0]))
    .then(v => {
      const d = {}

      v.forEach(el => {
        d[getPart('Datum', el).split('T')[0]] = {
          Losungstext: getPart('Losungstext', el),
          Losungsvers: getPart('Losungsvers', el),
          Lehrtext: getPart('Lehrtext', el),
          Lehrtextvers: getPart('Lehrtextvers', el),
        }
      })
      return d
    })
    .then((content) => {
      Object.keys(content).forEach((date) => {
        fs.writeFileSync(PATH + date + '.json', JSON.stringify(content[date]))
      })

      fs.writeFileSync(PATH + 'losungen.json', JSON.stringify(content))
    })
}

losungen()
