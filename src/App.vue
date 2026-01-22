<script setup>
// Import webcard.js to enable webcard functionality
import '@/utils/webcard.js'
import { ref, computed, onMounted } from 'vue'
import { parseMyKadData } from './utils/mykadParser'

const readers = ref([])
const selectedReader = ref('')
const readData = ref(null)
const loading = ref(false)
const showRaw = ref(false)

onMounted(() => {
  handleLoadReaders()
})

async function handleLoadReaders() {
  try {
    readers.value = await navigator.webcard.readers()
  } catch (e) {
    console.error('Failed to load readers', e)
    readers.value = []
  }
}

async function handleReadData() {
  if (!selectedReader.value) {
    alert('Please select a reader first.')
    return
  }

  try {
    const all = await navigator.webcard.readers()
    const reader = all.find((r) => r.name === selectedReader.value)
    if (!reader) {
      alert('Selected reader not found.')
      return
    }
    await reader.connect(true)
    loading.value = true
    const response = await getRawDataFromReader(reader)
    readData.value = parseMyKadData(response)
    await reader.disconnect()
    loading.value = false
  } catch (err) {
    console.error('Error during reading process:', err)
    loading.value = false
    alert('Error reading card. See console for details.')
  }
}

async function getRawDataFromReader(reader) {
  const data = {}
  await reader.transceive('00A404000AA0000000744A504E0010')
  await reader.transceive('00C0000005')

  data.jpn_1_1 = ''
  await reader.transceive('C832000005080000A801')
  await reader.transceive('CC00000008010001000000A801')
  data.jpn_1_1 += (await reader.transceive('CC060000FD')).slice(0, -4)
  data.jpn_1_1 += await reader.transceive('CC060000AB')

  data.jpn_1_2 = ''
  await reader.transceive('C832000005080000A30F')
  await reader.transceive('CC00000008020001000000A30F')
  for (let i = 0; i < 15; i++) {
    const x = (await reader.transceive('CC060000FD')).slice(0, -4)
    data.jpn_1_2 += x
  }
  data.jpn_1_2 += await reader.transceive('CC060000D0')

  data.jpn_1_4 = ''
  await reader.transceive('C8320000050800009700')
  await reader.transceive('CC000000080400010000009700')
  data.jpn_1_4 += await reader.transceive('CC06000097')

  for (const [k, v] of Object.entries(data)) {
    data[k] = v.lastIndexOf('9000') !== -1 ? v.slice(0, v.lastIndexOf('9000')) : v
  }
  return data
}

const fieldList = computed(() => {
  if (!readData.value) return []
  // Order and friendly labels for parseMyKadData fields
  return [
    { key: 'name', label: 'Full Name' },
    { key: 'ic', label: 'IC Number' },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'gender', label: 'Gender' },
    { key: 'citizenship', label: 'Citizenship' },
    { key: 'race', label: 'Race' },
    { key: 'religion', label: 'Religion' },
    { key: 'issuedate', label: 'Issue Date' },
    { key: 'address', label: 'Address' },
    { key: 'postcode', label: 'Postcode' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'photo', label: 'Photo' }
  ]
})
</script>

<template>
  <div class="container">
    <header>
      <h1>MyKad Reader</h1>
      <p class="hint">Need this extension: <a href="https://webcard.cardid.org/webcard.msi">webcard.msi</a></p>
    </header>

    <section class="controls">
      <div class="reader-row">
        <button class="btn" @click="handleLoadReaders">Refresh Readers</button>
        <div class="select-wrap">
          <select v-model="selectedReader">
            <option value="" disabled>Select reader</option>
            <option v-for="r in readers" :key="r.name" :value="r.name">{{ r.name }}</option>
          </select>
        </div>
        <button class="btn primary" @click="handleReadData" :disabled="!selectedReader || loading">Read MyKad</button>
      </div>
      <div class="status">
        <span v-if="loading">Reading…</span>
        <span v-else-if="readers.length === 0">No readers detected</span>
        <span v-else>{{ readers.length }} reader(s) available</span>
      </div>
    </section>

    <section class="result" v-if="readData">
      <div class="card">
        <div class="card-left">
          <div class="photo" v-if="readData.photo">
            <img :src="readData.photo" alt="photo" />
          </div>
        </div>
        <div class="card-right">
          <h2>{{ readData.name || '—' }}</h2>
          <dl>
            <template v-for="f in fieldList" :key="f.key">
              <template v-if="f.key !== 'photo'">
                <dt>{{ f.label }}</dt>
                <dd>{{ readData[f.key] || '—' }}</dd>
              </template>
            </template>
          </dl>
          <div class="raw-toggle">
            <label><input type="checkbox" v-model="showRaw" /> Show raw JSON</label>
          </div>
        </div>
      </div>

      <pre class="raw" v-if="showRaw">{{ JSON.stringify(readData, null, 2) }}</pre>
    </section>

    <section v-else class="no-data">
      <p>No data read yet. Click "Read MyKad" after selecting a reader.</p>
    </section>
  </div>
</template>

<style scoped>
.container{
  max-width:900px;
  margin:24px auto;
  font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial;
  color:#222;
}
header{display:flex;align-items:center;justify-content:space-between}
header h1{margin:0;font-size:20px}
.hint{margin:0;color:#666;font-size:12px}
.controls{margin-top:16px;padding:12px;border-radius:8px;background:#fafafa;border:1px solid #eee}
.reader-row{display:flex;gap:12px;align-items:center}
.select-wrap select{padding:8px;border-radius:6px;border:1px solid #ddd;min-width:260px}
.btn{padding:8px 12px;border-radius:6px;border:1px solid #ccc;background:#fff;cursor:pointer}
.btn.primary{background:#0078d4;border-color:#0064b4;color:#fff}
.btn:disabled{opacity:0.6;cursor:not-allowed}
.status{margin-top:8px;color:#555;font-size:13px}
.result{margin-top:18px}
.card{display:flex;gap:16px;padding:16px;border-radius:8px;border:1px solid #eee;background:#fff}
.card-left{width:220px;display:flex;align-items:flex-start}
.photo img{width:200px;height:200px;object-fit:cover;border-radius:6px;border:1px solid #ddd}
.card-right{flex:1}
.card-right h2{margin:0 0 8px 0}
dl{display:grid;grid-template-columns:140px 1fr;row-gap:6px;column-gap:12px}
dt{font-weight:600;color:#444}
dd{margin:0;color:#222}
.raw-toggle{margin-top:12px}
.raw{margin-top:12px;padding:12px;background:#0f1724;color:#e6eef8;overflow:auto;border-radius:6px}
.no-data{margin-top:18px;color:#666}
</style>
