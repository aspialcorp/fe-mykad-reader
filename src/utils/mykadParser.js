import { Buffer } from 'buffer'

export const parseMyKadData = (data) => {
  if (!data || !data.jpn_1_1 || !data.jpn_1_2 || !data.jpn_1_4) return null

  const jp1 = Buffer.from(data.jpn_1_1, 'hex')
  const jp2 = Buffer.from(data.jpn_1_2, 'hex')
  const jp4 = Buffer.from(data.jpn_1_4, 'hex')

  console.log(jp1.slice(0x0, 0x2))
  const r = {}
  r.ic = jp1
    .slice(0x111, 0x111 + 0x0d)
    .toString('utf8')
    .trim()
  r.name = jp1
    .slice(0x3, 0x3 + 0x96)
    .toString('utf8')
    .trim()
  r.address =
    jp4
      .slice(0x3, 0x3 + 0x1e)
      .toString('utf8')
      .trim() +
    '\n' +
    jp4
      .slice(0x21, 0x21 + 0x1e)
      .toString('utf8')
      .trim() +
    '\n' +
    jp4
      .slice(0x3f, 0x3f + 0x1e)
      .toString('utf8')
      .trim()
  r.postcode = bcd(jp4.slice(0x5d, 0x5d + 0x3)).slice(0, -1)
  r.city = jp4
    .slice(0x60, 0x60 + 0x19)
    .toString('utf8')
    .trim()
  r.state = jp4
    .slice(0x79, 0x79 + 0x1e)
    .toString('utf8')
    .trim()
  r.dob = yyyymmddToDate(bcd(jp1.slice(0x127, 0x127 + 0x4)))
  r.citizenship = jp1
    .slice(0x148, 0x148 + 0x12)
    .toString('utf8')
    .trim()
  r.issuedate = yyyymmddToDate(bcd(jp1.slice(0x144, 0x144 + 0x4)))
  r.gender =
    jp1
      .slice(0x11e, 0x11e + 0x1)
      .toString('utf8')
      .trim() == 'L'
      ? 'Male'
      : 'Female'
  r.race = jp1
    .slice(0x15a, 0x15a + 0x19)
    .toString('utf8')
    .trim()
  r.religion = jp1
    .slice(0x173, 0x173 + 0xb)
    .toString('utf8')
    .trim()
  r.photo = displayJpegImageFromHex(data.jpn_1_2.slice(0x6))
  return r
}

const bcd = (buf) =>
  Array.from(buf)
    .map((b) => ((b >> 4) & 0xf).toString() + (b & 0xf).toString())
    .join('')
    .replace(/^0+/, '') || '0'

// Convert 'yyyymmdd' (string or number) into a JavaScript Date.
// Returns a Date object for valid input, otherwise returns null.
// Example: yyyymmddToDate('20240131') -> new Date(2024, 0, 31)
export const yyyymmddToDate = (val) => {
  if (val === undefined || val === null) return null
  const s = String(val).replace(/\D/g, '')
  if (s.length !== 8) return null
  const year = Number(s.slice(0, 4))
  const month = Number(s.slice(4, 6)) - 1
  const day = Number(s.slice(6, 8))
  const d = new Date(year, month, day)
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return null
  return d.toDateString()
}

function displayJpegImageFromHex(hexString) {
  // 1. Clean the hex string (remove non-hex characters and ensure even length)
  let cleanedHexString = hexString.replace(/[^A-Fa-f0-9]/g, '')
  if (cleanedHexString.length % 2 !== 0) {
    console.error('Cleaned hex string length is odd. Cannot form complete bytes.')
    return
  }

  // 2. Convert hex to byte array
  const byteArray = new Uint8Array(cleanedHexString.length / 2)
  for (let i = 0; i < cleanedHexString.length; i += 2) {
    // parseInt(h, 16) parses the 2-char hex string into an integer (byte)
    byteArray[i / 2] = parseInt(cleanedHexString.substring(i, i + 2), 16)
  }

  // 3. Create a Blob with the JPEG MIME type
  const blob = new Blob([byteArray], { type: 'image/jpeg' })

  // 4. Generate an object URL
  const imageUrl = URL.createObjectURL(blob)

  return imageUrl
}
