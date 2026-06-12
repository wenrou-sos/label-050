<template>
  <div class="flex h-screen bg-slate-50">
    <AppSidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <AppHeader />
      <main class="flex-1 overflow-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
onMounted(() => {
  const { isLoggedIn } = useAuth()
  if (!isLoggedIn.value) {
    navigateTo('/login')
  }
})
</script>
