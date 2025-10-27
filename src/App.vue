<script setup lang="ts">
import BasicLayout from "@/layout/BasicLayout.vue";

const locale = {
  locale: 'zh-cn'
}
</script>

<template>
  <a-config-provider :locale="locale">
    <header>
      <BasicLayout></BasicLayout>
    </header>
  </a-config-provider>
</template>

<style scoped>
</style>