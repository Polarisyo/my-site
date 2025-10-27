<script setup lang="ts">
import {
  GithubOutlined,
  MailOutlined,
  QqOutlined,
  UserOutlined,
  WechatOutlined,
} from '@ant-design/icons-vue'
</script>

<template>
  <div class="me-card carbox borderbefore" id="mycard">
    <div class="mecar-title">
      <a-avatar :size="128">
        <template #icon>
          <UserOutlined />
        </template>
      </a-avatar>
      <h3>Polaris</h3>
      <p class="me-hover">
        <span>其实，我的愿望是世界和平！</span>
      </p>
    </div>
    <div class="borderbotm"></div>
    <div>
      <div class="description">
        <span class="description-key">毕业院校</span>
        <span class="description-value">暨南大学</span>
      </div>
      <div class="description">
        <span class="description-key">所在城市</span>
        <span class="description-value">重庆</span>
      </div>
      <div class="description">
        <span class="description-key">年级</span>
        <span class="description-value">2022届</span>
      </div>
    </div>
    <div class="borderbotm"></div>
    <div class="links">
      <div class="item">
        <a-popover>
          <template #content>
            <p>PolarisAhh</p>
          </template>
          <WechatOutlined />
        </a-popover>
      </div>
      <div class="item">
        <a href="https://github.com/Polarisyo">
          <GithubOutlined />
        </a>
      </div>
      <div class="item">
        <a class="item" href="Mailto:1433602563@qq.com?Subject=邮箱标题&amp;Body=邮箱内容！">
          <MailOutlined />
        </a>
      </div>
      <div class="item">
        <a-popover class="item">
          <template #content>
            <p>1433602563</p>
          </template>
          <QqOutlined />
        </a-popover>
      </div>
    </div>
  </div>
</template>

<style scoped>
.borderbotm {
  /* border-style: dashed; */
  border-bottom: 1px dashed rgb(37, 40, 37);
  height: 0px;
  margin: 30px 0;
}

a {
  color: black;
}

.links {
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
}

.item {
  flex: 1; /* 等分剩余空间 */
  min-width: 0; /* 防止内容溢出 */
  font-size: 20px; /* 统一高度 */
}
.description {
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
}
.description-key {
  font-weight: bold;
}
.description-value {

}
</style>
