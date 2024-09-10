<script setup lang="ts">
import { FrontendService, SERVICE_KEY } from "@frontend/stores"
import { inject } from "vue"

const {
  states
  // , actions: { dispatch }
} = inject<FrontendService>(SERVICE_KEY)!
</script>

<template>
  <v-app id="inspire">
    <v-row v-if="states.shared.isLoading" align="center">
      <v-col align="center">
        <v-progress-circular :size="120" :width="15" color="purple" indeterminate />
      </v-col>
    </v-row>
    <router-view v-else />
  </v-app>
</template>
