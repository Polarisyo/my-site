<template>
  <div class="header">
    <a-menu v-model:selectedKeys="current" mode="horizontal" :items="items" />

  </div>
</template>

<script lang="ts" setup>
import { h, ref } from 'vue';
import { MailOutlined, AppstoreOutlined, SettingOutlined } from '@ant-design/icons-vue';
import { MenuProps } from 'ant-design-vue';
const current = ref<string[]>(['mail']);
const items = ref<MenuProps['items']>([
  {
    key: 'home',
    icon: () => h(MailOutlined),
    label: '主页',
  },
  {
    key: 'projects',
    icon: () => h(AppstoreOutlined),
    label: '项目',
  },
  {
    key: 'experiences',
    icon: () => h(AppstoreOutlined),
    label: '简历',
  },
  {
    key: 'blogs',
    icon: () => h(AppstoreOutlined),
    label: '博客',
  },
  {
    key: 'life',
    icon: () => h(AppstoreOutlined),
    label: '日常',
  },
  {
    key: 'tools',
    icon: () => h(SettingOutlined),
    label: '工具',
    children: [
      {
        type: 'group',
        children: [
          {
            label: 'Option 1',
            key: 'setting:1',
          },
          {
            label: 'Option 2',
            key: 'setting:2',
          },
        ],
      },
    ],
  },
]);
</script>

<style scoped>

</style>

