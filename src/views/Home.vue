<template>
  <div class="home">
    <section class="">
      <h2>Initial Log Load Information</h2>
      <div class="flex flex-col lg:flex-row">
        <label class="mx-2"
          >POESESSID
          <a href="https://github.com/pxslip/poe-guild-logs/wiki/Getting-Your-PoE-Session-ID" target="_blank">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              class="align-text-top h-4 inline"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </a>
          <input type="text" class="block border rounded border-gray-700 p-1 w-full lg:w-auto" v-model="sessionId"
        /></label>
        <label class="mx-2"
          >Guild ID
          <a href="https://github.com/pxslip/poe-guild-logs/wiki/Getting-your-Guild-ID" target="_blank">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              class="align-text-top h-4 inline"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              /></svg
          ></a>
          <input type="text" class="block border rounded border-gray-700 p-1 w-full lg:w-auto" v-model="guildId"
        /></label>
        <button
          type="button"
          class="border rounded border-gray-700 bg-gray-300 text-gray-900 hover:border-gray-900 hover:bg-gray-700 hover:text-gray-200 p-1 mx-2 w-auto lg:mt-6 mt-2"
          @click="load"
        >
          Load Logs
        </button>
      </div>
    </section>
    <hr class="my-4" />
    <section class="filters">
      <h2>Filter Logs</h2>
      <div class="flex flex-col lg:flex-row">
        <label class="mx-2"
          >Search
          <input
            type="text"
            v-model="searchText"
            class="block border border-gray-700 rounded py-2 px-1 w-full lg:w-auto"
          />
        </label>
        <label class="mx-2"
          >Player
          <vue-multiselect
            class="inline-block"
            :options="uniquePlayers"
            v-model="playerFilters"
            :multiple="true"
          ></vue-multiselect
        ></label>
        <label class="mx-2"
          >Action
          <vue-multiselect
            class="inline-block"
            :options="uniqueActions"
            v-model="actionFilters"
            :multiple="true"
          ></vue-multiselect
        ></label>
        <label class="mx-2"
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
      <div></div>
      <ul>
        <li class="flex flex-row xs:flex-col border-b-2 border-gray-700s mb-2">
          <div class="mr-4 w-1/5">Player</div>
          <div class="mr-4 w-1/5">Action</div>
          <div class="mr-4 w-1/5">Item</div>
          <div class="">Time</div>
        </li>
        <li v-for="log in filteredLogs" :key="log.id" class="flex flex-row xs:flex-col mb-2">
          <div class="mr-4 w-1/5">{{ log.account.name }}</div>
          <div class="mr-4 w-1/5">{{ log.action }}</div>
          <div class="mr-4 w-1/5">{{ log.item }}</div>
          <div class="">{{ toDateTimeStringFromEpoch(log.time) }}</div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script>
import axios from 'axios';
import VueMultiselect from 'vue-multiselect';
export default {
  name: 'Home',
  components: { VueMultiselect },
  data() {
    return {
      sessionId: '',
      guildId: '',
      logs: [],
      playerFilters: [],
      itemFilters: [],
      actionFilters: [],
      searchText: '',
      from: null,
    };
  },
  methods: {
    async load() {
      try {
        const params = {
          guildId: this.guildId,
          sessionId: this.sessionId,
        };
        if (this.from !== null) {
          params.from = Date.parse(this.from) / 1000;
        }
        const response = await axios.get('/proxy/guild-logs', {
          params: params,
        });
        this.logs = this.filteredLogs = response.data;
      } catch (exc) {
        console.log(exc);
        this.$emit(
          'error',
          'There was an error retrieving the guild logs, please check the console for more information.',
        );
      }
    },
    toDateTimeStringFromEpoch(ts) {
      const date = new Date(ts * 1000);
      return date.toLocaleString();
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
        if (this.searchText.length > 2) {
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
  },
};
</script>

<style>
@import '~vue-multiselect/dist/vue-multiselect.min.css';
</style>
