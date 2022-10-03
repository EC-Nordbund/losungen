const fs = require("fs");
const zip = require("jszip");

const PATH = "./data/";

function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

function getPart(p, str) {
  return (" " + str).split(`<${p}>`)[1].split(`</${p}>`)[0];
}

async function losungen(year) {
  const z = new zip();

  // Warum XML? Die anderen datein sind komisch encodiert!
  const zipResult = await fetch(
    `https://www.losungen.de/fileadmin/media-losungen/download/Losung_${year}_XML.zip`,
  );
  const zipBuffer = await zipResult.arrayBuffer();
  await z.loadAsync(zipBuffer);
  const csvFile = z.file(
    Object.keys(z.files).filter((v) => v.endsWith("xml"))[0],
  ).nodeStream("nodebuffer");
  /**
   * @type {string}
   */
  const csvContent = await streamToString(csvFile);
  const days = csvContent.split("<Losungen>").slice(1);

  for (const day of days) {
    const datum = getPart("Datum", day).split('T')[0];

    const Losungstext = getPart("Losungstext", day);
    const Losungsvers = getPart("Losungsvers", day);
    const Lehrtext = getPart("Lehrtext", day);
    const Lehrtextvers = getPart("Lehrtextvers", day);
    
    const data = {
      Losungstext,
      Losungsvers,
      Lehrtext,
      Lehrtextvers
    }

    fs.writeFileSync(PATH + datum + '.json', JSON.stringify(data))
  }
}

if (!fs.existsSync(PATH)) {
  fs.mkdirSync(PATH);
}

fs.readdirSync(PATH)
  .filter((v) => v[0] !== ".")
  .map((v) => PATH + v)
  .forEach(fs.unlinkSync);

const currentYear = new Date().getFullYear()
losungen(currentYear).then(() => {
  losungen(currentYear + 1).catch(() => {console.warn('NO DATA FOR NEXT YEAR!')})
});
