<template>
  <div class="overlay h-screen" @dragover.capture="dragStart" @drop.capture="drop" @dragleave.capture="dragEnd">
    <div :class="[{ 'opacity-25': shown }]">
      <slot></slot>
    </div>
    <div v-if="shown" class="absolute h-64 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64">
      <upload />
    </div>
  </div>
</template>

<script>
import Upload from 'heroicons/outline/upload.svg';
export default {
  components: { Upload },
  data() {
    return {
      shown: false,
    };
  },
  methods: {
    drop(event) {
      event.preventDefault();
      this.$emit('drop', event);
      if (this.shown) {
        this.shown = false;
      }
    },
    dragStart(event) {
      event.preventDefault();
      if (!this.shown) {
        this.shown = true;
      }
    },
    dragEnd(event) {
      event.preventDefault();
      if (this.shown) {
        this.shown = false;
      }
    },
  },
};
</script>

<style></style>
