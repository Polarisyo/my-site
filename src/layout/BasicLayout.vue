<script setup lang="ts">

  import GlobalHeader from "@/components/GlobalHeader.vue";
  import GlobalLeftBar from "@/components/GlobalLeftBar.vue";
</script>

<template>
  <div id="basicLayout">
    <a-layout style="min-height: 100vh">
      <a-layout-header :style="headerStyle" class="header">
        <global-header></global-header>
      </a-layout-header>
      <a-layout-content :style="contentStyle">
        <div>
          <div class="background"></div>
          <div class="leftBar">
            <global-left-bar></global-left-bar>
          </div>
          <div class="content">
            <router-view/>
          </div>
        </div>
      </a-layout-content>
    </a-layout>
  </div>
</template>

<style scoped>
  .background{
    background-image: url('/img/home-background-river.png');
    background-position: center; /* 图片居中 */
    background-repeat: no-repeat; /* 禁止重复 */
    width: 100%;
    background-size: contain; /* 保持比例，完整显示 */
    aspect-ratio: 16 / 9; /* 固定宽高比（16:9） */
    background-attachment: fixed;
    position: fixed;



  }
  #basicLayout {
    background: #efefef;
    padding: 16px;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: center;
  }
  #basicLayout .header {
    padding-inline: 20px;
    margin-bottom: 16px;
    color: unset;
    background: white;
  }
.header{
  display: flex;
  justify-content: flex-end; /* 子元素靠右 */
  position: fixed;
  top: 0;
  left: 0;
  margin-right: 10%;
  width: 100%;
  height: 60px;
  background-color: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}
.leftBar {
    position: fixed;
    left: 0;
    top: 60px;
    width: 300px;
    height: 100vh;
    padding: 30px;
    box-shadow: 5px 0 15px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    overflow-y: auto;
    text-align: center;
}
  /* 右侧可滑动内容区域 */
  .content {
    flex: 1;
    margin-left: 300px;
    padding: 30px;
    background-color: #252825;
    margin-top: 70vh;
  }
</style>
