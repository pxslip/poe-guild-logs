<template>
  <DropOverlay @drop="drop">
    <div class="home">
      <section class="">
        <h2 class="text-xl">Initial Log Load Information</h2>
        <div class="flex flex-col lg:flex-row">
          <label class="mx-2 flex-1">
            POESESSID
            <a href="https://github.com/pxslip/poe-guild-logs/wiki/Getting-Your-PoE-Session-ID" target="_blank">
              <QuestionMarkCircle class="align-text-top h-4 inline"></QuestionMarkCircle>
            </a>
            <input type="text" class="block border rounded border-gray-700 p-2 w-full" v-model="sessionId" />
          </label>
          <label class="mx-2 flex-1">
            Guild ID
            <a href="https://github.com/pxslip/poe-guild-logs/wiki/Getting-your-Guild-ID" target="_blank">
              <QuestionMarkCircle class="align-text-top h-4 inline"></QuestionMarkCircle>
            </a>
            <input type="text" class="block border rounded border-gray-700 p-2 w-full" v-model="guildId" />
          </label>
          <label class="mx-2 flex-1">
            Days Back (More Days = Longer Loads)
            <input
              type="number"
              min="1"
              max="30"
              step="1"
              v-model="daysBack"
              class="block border rounded border-gray-700 p-2 w-full"
            />
          </label>
          <button
            type="button"
            class="border rounded border-gray-700 bg-gray-300 text-gray-900 hover:border-gray-900 hover:bg-gray-700 hover:text-gray-200 mx-2 w-auto lg:mt-6 mt-2 flex-1"
            :disabled="loading"
            @click="load(true)"
          >
            <span v-if="!loading">Load Logs</span>
            <spinner v-if="loading" class="animate-spin h-5 w-5 mx-auto"></spinner>
          </button>
        </div>
        <p class="italic mt-4 text-center w-full">
          Alternatively you may drag/drop a JSON file that matches the API response.
        </p>
      </section>
      <hr class="my-4" />
      <section class="filters">
        <h2 class="text-xl">Filter Logs</h2>
        <div class="flex flex-col lg:flex-row">
          <label class="mx-2 flex-1"
            >Search
            <input type="text" v-model="searchText" class="block border border-gray-700 rounded p-2 w-full" />
          </label>
          <label class="mx-2 flex-1 multiselect-label"
            >Player
            <vue-multiselect
              class="inline-block"
              :options="uniquePlayers"
              v-model="playerFilters"
              :multiple="true"
            ></vue-multiselect
          ></label>
          <label class="mx-2 flex-1"
            >Action
            <vue-multiselect
              class="inline-block"
              :options="uniqueActions"
              v-model="actionFilters"
              :multiple="true"
            ></vue-multiselect
          ></label>
          <label class="mx-2 flex-1"
            >Item
            <vue-multiselect
              class="inline-block"
              :options="uniqueItems"
              v-model="itemFilters"
              :multiple="true"
            ></vue-multiselect
          ></label>
        </div>
      </section>
      <hr class="my-4" />
      <section class="output">
        <p v-if="noneFound" class="font-bold italic text-center text-lg">
          No Logs Found
        </p>
        <ul v-else>
          <li class="flex flex-col lg:flex-row border-b-2 border-gray-700 py-2">
            <div class="mr-4 flex-1">Player</div>
            <div class="mr-4 flex-1">Action</div>
            <div class="mr-4 flex-1">Item</div>
            <div class="flex-1">Time</div>
          </li>
          <li
            v-for="(log, index) in filteredLogs"
            :key="log.id"
            :class="['flex', 'flex-col', 'lg:flex-row', 'py-2', { 'bg-gray-100': index % 2 === 0 }]"
          >
            <div class="mr-4 flex-1">{{ log.account.name }}</div>
            <div class="mr-4 flex-1">{{ log.action }}</div>
            <div class="mr-4 flex-1">{{ log.item }}</div>
            <div class="flex-1">{{ toDateTimeStringFromEpoch(log.time) }}</div>
          </li>
        </ul>
        <button
          v-if="hasMore"
          :disabled="!canLoadMore"
          class="w-full border rounded border-gray-700 bg-gray-300 text-gray-900 hover:border-gray-900 hover:bg-gray-700 hover:text-gray-200 p-2 lg:mt-6 mt-2"
          @click="load(false)"
        >
          <template v-if="!loading">
            <template v-if="canLoadMore">
              Load More Records
            </template>
            <template v-else> Currently Rate Limited, Please Wait {{ this.waitTimeLeft }}s </template>
          </template>
          <Spinner v-else class="animate-spin h-5 w-5 mx-auto"></Spinner>
        </button>
      </section>
    </div>
  </DropOverlay>
</template>

<script>
import axios from 'axios';
import VueMultiselect from 'vue-multiselect';
import Spinner from '@/assets/Spinner.svg';
import QuestionMarkCircle from 'heroicons/outline/question-mark-circle.svg';
import DropOverlay from '@/components/DropOverlay';
export default {
  name: 'Home',
  components: { VueMultiselect, Spinner, QuestionMarkCircle, DropOverlay },
  data() {
    return {
      sessionId: '',
      guildId: '',
      logs: [],
      playerFilters: [],
      itemFilters: [],
      actionFilters: [],
      searchText: '',
      daysBack: 5,
      loading: false,
      truncated: false,
      lastTime: null,
      waitUntil: null,
      waitTimeLeft: null,
      canLoadMore: true,
      noneFound: false,
    };
  },
  methods: {
    async load(clean) {
      this.loading = true;
      this.noneFound = false;
      try {
        const params = {
          guildId: this.guildId,
          sessionId: this.sessionId,
          days: this.daysBack,
        };
        if (this.lastTime !== null) {
          params.startTime = this.lastTime;
        }
        const response = await axios.get('/proxy/guild-logs', {
          params: params,
        });
        const entries = response.data.entries;
        if (entries.length < 1) {
          this.noneFound = true;
        }
        if (clean) {
          this.logs = entries;
        } else {
          this.logs = this.logs.concat(entries);
        }
        this.lastTime = response.data.lastTime ?? null;
        if (response.data.waitUntil) {
          this.waitUntil = response.data.waitUntil;
          this.canLoadMore = false;
          this.startUpdatingWaitTimeLeft();
        } else {
          this.waitUntil = null;
        }
      } catch (exc) {
        console.log(exc);
        this.$emit(
          'error',
          'There was an error retrieving the guild logs, please check the console for more information.',
        );
      }
      this.loading = false;
    },
    toDateTimeStringFromEpoch(ts) {
      const date = new Date(ts * 1000);
      return date.toLocaleString();
    },
    startUpdatingWaitTimeLeft() {
      const intervalId = setInterval(() => {
        this.$nextTick(() => {
          const timeLeft = Math.ceil(this.waitUntil / 1000) - Math.ceil(Date.now() / 1000);
          this.waitTimeLeft = timeLeft < 0 ? 0 : timeLeft;
          if (timeLeft < 0) {
            this.canLoadMore = true;
            clearInterval(intervalId);
          }
        });
      }, 1000);
    },
    async drop(event) {
      event.preventDefault();
      const text = await event.dataTransfer.files[0].text();
      const json = JSON.parse(text);
      this.logs = json.entries;
    },
  },
  computed: {
    uniquePlayers() {
      const players = new Set();
      this.filteredLogs.forEach(item => {
        players.add(item.account.name);
      });
      return Array.from(players);
    },
    uniqueActions() {
      const actions = new Set();
      this.filteredLogs.forEach(item => {
        actions.add(item.action);
      });
      return Array.from(actions);
    },
    uniqueItems() {
      const items = new Set();
      this.filteredLogs.forEach(item => {
        items.add(item.item);
      });
      return Array.from(items);
    },
    filteredLogs() {
      return this.logs.filter(logObj => {
        let keep = true;
        if (this.searchText.length > 0) {
          const lcSearch = this.searchText.toLowerCase();
          keep =
            keep &&
            (logObj.account.name.toLowerCase().includes(lcSearch) || logObj.item.toLowerCase().includes(lcSearch));
        }
        if (this.playerFilters.length > 0) {
          keep = keep && this.playerFilters.includes(logObj.account.name);
        }
        if (this.itemFilters.length > 0) {
          keep = keep && this.itemFilters.includes(logObj.item);
        }
        if (this.actionFilters.length > 0) {
          keep = keep && this.actionFilters.includes(logObj.action);
        }
        return keep;
      });
    },
    hasMore() {
      return this.lastTime && this.waitUntil;
    },
  },
};
</script>

<style scoped>
@tailwind utilities;
@import '~vue-multiselect/dist/vue-multiselect.min.css';
::v-deep .multiselect__tags {
  @apply border-gray-700;
}
</style>
