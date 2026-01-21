<script setup>
// Import webcard.js to enable webcard functionality
import '@/utils/webcard.js'
import { ref } from 'vue'
import { parseMyKadData } from './utils/mykadParser'

const readers = ref([])
const selectedReader = ref(null)
const readData = ref(null)
const loading = ref(false)

async function handleLoadReaders() {
  readers.value = await navigator.webcard.readers()
}

async function handleReadData() {
  if (!selectedReader.value) {
    alert('Please select a reader first.')
    return
  }

  try {
    const readers = await navigator.webcard.readers()
    const reader = readers.find((r) => r.name === selectedReader.value)
    if (!reader) {
      alert('Selected reader not found.')
      return
    }
    await reader.connect(true)
    console.log('Connected to reader:', reader.name)
    loading.value = true
    const response = await getRawDataFromReader(reader)
    readData.value = parseMyKadData(response)

    await reader.disconnect()
    loading.value = false
    console.log('Disconnected from reader:', reader.name)
  } catch (err) {
    console.error('Error during reading process:', err)
    loading.value = false
    return
  }
}

async function getRawDataFromReader(reader) {
  const data = {}
  // Reference: https://forum.lowyat.net/index.php?s=d8b743a2e4a5498fd8b2d6095e56bf41&showtopic=355950&st=20&p=11151482&#entry11151482
  // Select App + Get Response
  await reader.transceive('00A404000AA0000000744A504E0010')
  await reader.transceive('00C0000005')

  // Section JPN 1-1
  data.jpn_1_1 = ''
  await reader.transceive('C832000005080000A801')
  await reader.transceive('CC00000008010001000000A801')
  data.jpn_1_1 += (await reader.transceive('CC060000FD')).slice(0, -4)
  data.jpn_1_1 += await reader.transceive('CC060000AB')

  // Section JPN 1-2
  data.jpn_1_2 = ''
  await reader.transceive('C832000005080000A30F')
  await reader.transceive('CC00000008020001000000A30F')
  for (let i = 0; i < 15; i++) {
    const x = (await reader.transceive('CC060000FD')).slice(0, -4)
    data.jpn_1_2 += x
  }
  data.jpn_1_2 += await reader.transceive('CC060000D0')
  // Section JPN 1-4
  data.jpn_1_4 = ''
  await reader.transceive('C8320000050800009700')
  await reader.transceive('CC000000080400010000009700')
  data.jpn_1_4 += await reader.transceive('CC06000097')

  for (const [k, v] of Object.entries(data)) {
    data[k] = v.lastIndexOf('9000') !== -1 ? v.slice(0, v.lastIndexOf('9000')) : v
  }
  return data
}
</script>

<template>
  <p>Need this extension: <a href="https://webcard.cardid.org/webcard.msi">Link</a></p>
  <button v-on:click="handleLoadReaders">Load Readers</button>
  <div v-if="readers.length > 0">
    <select id="item-select" v-model="selectedReader">
      <option value="" disabled>Select an option</option>
      <option v-for="reader in readers" :value="reader.name" :key="reader.name">
        {{ reader.name }}
      </option>
    </select>
    <button v-on:click="handleReadData">Read MyKad Data</button>
  </div>
  <div v-else>No readers loaded</div>
  <div v-if="loading">Loading readers...</div>
  <div id="output" v-if="readData">
    <div v-for="(v, k) in readData" :key="k">
      <template v-if="k === 'photo'">
        <div>{{ k }}:</div>
        <img
          :src="v"
          alt="photo"
          style="max-width: 200px; max-height: 200px; object-fit: contain"
        />
      </template>
      <template v-else> {{ k }}: {{ v }} </template>
    </div>
  </div>
</template>

<style scoped></style>
